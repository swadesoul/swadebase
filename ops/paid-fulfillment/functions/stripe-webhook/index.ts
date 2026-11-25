import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { grantEntitlement, revokeEntitlementsForSubscription } from "../_shared/entitlements.ts";
import { activateShowcaseFromCheckout, claimStripeEvent, forEachMarketSchema, grantMarketPurchase } from "../_shared/marketplaceFulfill.ts";
import { paymentExemptAcross } from "../_shared/paymentExempt.ts";
import {
  claimFulfillment, invoicePeriodEnd, invoiceSubscriptionId, invoiceSubscriptionMeta, isoFromUnix, resolveBuyer,
  sendWelcomeOnce, sessionEmail, subscriptionPeriodEnd, swadeMailer, updateFulfillment, welcomeEmail,
} from "../_shared/paidFulfill.ts";

// Payment Link plans (Abagale-approved automatic fulfillment, 2026-11-24). Credits match create-checkout PLANS.
const LINK_PLANS: Record<string, { tier: string; credits: number; name: string }> = {
  pro_monthly: { tier: "pro", credits: 700, name: "ReSing Lab Pro" },
  studio_monthly: { tier: "studio", credits: 1250, name: "ReSing Lab Studio" },
};

// Payment Link buyers have no user_id in Stripe metadata until fulfillment writes it; fall back to the ledger.
async function userForSubscription(db: any, subscriptionId: string | null | undefined): Promise<string | undefined> {
  if (!subscriptionId) return undefined;
  const { data } = await db.from("paid_fulfillments").select("user_id")
    .eq("stripe_subscription_id", subscriptionId).not("user_id", "is", null).limit(1);
  return data?.[0]?.user_id ?? undefined;
}

async function creditsAlreadyGranted(db: any, invoiceId: string | null | undefined): Promise<boolean> {
  if (!invoiceId) return false;
  const { data } = await db.from("credit_transactions").select("id").contains("metadata", { invoice_id: invoiceId }).limit(1);
  return !!data?.length;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    const signature = req.headers.get("stripe-signature");
    if (!signature) throw new Error("No Stripe signature found");
    
    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(
        body, signature, webhookSecret, undefined, Stripe.createSubtleCryptoProvider(),
      );
      logStep("Webhook signature verified", { eventType: event.type });
    } catch (err: any) {
      logStep("Webhook signature verification failed", { error: err.message });
      return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 });
    }

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Handle subscription lifecycle events
    if (event.type === 'customer.subscription.created' || 
        event.type === 'customer.subscription.updated' ||
        event.type === 'customer.subscription.deleted') {
      
      const subscription = event.data.object as Stripe.Subscription;
      const isOurs = subscription.metadata?.app === 'resinglab';
      const userId = isOurs ? (subscription.metadata?.user_id || await userForSubscription(supabaseService, subscription.id)) : undefined;
      const periodEndIso = isoFromUnix(subscriptionPeriodEnd(subscription));
      const tier = subscription.metadata?.tier || 'free';
      const rollover = false; // no rollover on any plan
      
      logStep("Processing subscription event", { eventType: event.type, userId, tier });

      if (userId) {
        const status = subscription.status;
        const activeTier = status === 'active' ? tier : 'free';

        await supabaseService
          .from("profiles")
          .update({
            subscription_tier: activeTier,
            subscription_status: status,
            subscription_end: status === "active" ? periodEndIso : null,
            plan_rollover: false,
          })
          .eq("id", userId);

        // Durable access record so a plan is never "paid but locked".
        if (status === "active") {
          await grantEntitlement(supabaseService, {
            user_id: userId,
            product_type: "subscription",
            product_id: subscription.items.data[0]?.price?.id ?? subscription.id,
            product_name: `${tier} plan`,
            access_level: tier,
            credits_granted: Number.parseInt(subscription.metadata?.monthly_credits ?? "0", 10) || 0,
            stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : null,
            stripe_subscription_id: subscription.id,
            stripe_event_id: event.id,
            expires_at: periodEndIso,
            metadata: { source: "stripe-webhook", event: event.type },
          }).catch((e) => logStep("Entitlement grant failed", { error: String(e) }));
        } else {
          await revokeEntitlementsForSubscription(
            supabaseService,
            subscription.id,
            status === "canceled" ? "revoked" : "suspended",
          ).catch((e) => logStep("Entitlement revoke failed", { error: String(e) }));
        }

        logStep(`Updated subscription for user ${userId}: ${activeTier} (${status})`);
      }
    }

    // Refunds pull access back.
    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : null;
      if (paymentIntentId) {
        await supabaseService
          .from("user_entitlements")
          .update({ access_status: "refunded", updated_at: new Date().toISOString() })
          .eq("stripe_payment_intent_id", paymentIntentId);
        logStep("Revoked access after refund", { paymentIntentId });
      }
    }

    // Handle invoice payment - credit rollover logic
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      const invoiceSubId = invoiceSubscriptionId(invoice);
      const payloadMeta = invoiceSubscriptionMeta(invoice);
      // Newer API versions drop invoice.subscription; the payload snapshot is used when it already names the user.
      const subscription: any = invoiceSubId
        ? (payloadMeta?.user_id && payloadMeta?.app
          ? { id: invoiceSubId, metadata: payloadMeta }
          : await stripe.subscriptions.retrieve(invoiceSubId).catch((e: any) => {
            logStep("Subscription lookup failed", { invoiceSubId, error: String(e?.message ?? e) });
            return Object.keys(payloadMeta ?? {}).length ? { id: invoiceSubId, metadata: payloadMeta } : null;
          }))
        : null;
      const userId = subscription?.metadata?.app === 'resinglab'
        ? (subscription?.metadata?.user_id || await userForSubscription(supabaseService, invoiceSubId))
        : undefined;
      const monthlyCredits = parseInt(subscription?.metadata?.monthly_credits || "0");
      const rollover = false; // no rollover on any plan
      const tier = subscription?.metadata?.tier || 'free';

      logStep("Processing invoice payment", { userId, monthlyCredits, rollover, tier });

      if (subscription?.metadata?.type === "marketplace_showcase") {
        const showcaseUser = subscription.metadata.user_id;
        const exempt = showcaseUser
          ? await paymentExemptAcross(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", showcaseUser, "marketplace_showcase")
          : false;
        if (exempt || invoice.billing_reason === "subscription_cycle") {
          await stripe.subscriptions.update(subscription.id, { cancel_at_period_end: true });
          logStep("Stopped further showcase invoices", { subscriptionId: subscription.id, exempt });
        }
      }

      const renewalEndIso = isoFromUnix(invoicePeriodEnd(invoice));
      if (userId && renewalEndIso) {
        // Renewal extends access to the newly paid period.
        await supabaseService.from("profiles").update({ subscription_end: renewalEndIso }).eq("id", userId);
        await supabaseService.from("user_entitlements")
          .update({ access_status: "active", expires_at: renewalEndIso, updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", invoiceSubId);
      }

      if (userId && monthlyCredits > 0 && await creditsAlreadyGranted(supabaseService, invoice.id)) {
        logStep("Credits already granted for invoice", { invoiceId: invoice.id });
      } else if (userId && monthlyCredits > 0) {
        const { data: profile } = await supabaseService
          .from("profiles")
          .select("credits_balance")
          .eq("id", userId)
          .single();

        if (profile) {
          // Rollover: add to existing balance. No rollover: reset to monthly amount.
          const newBalance = rollover 
            ? (profile.credits_balance || 0) + monthlyCredits 
            : monthlyCredits;

          await supabaseService
            .from("profiles")
            .update({ 
              credits_balance: newBalance,
              credits_last_reset: new Date().toISOString(),
              subscription_tier: tier,
              subscription_status: 'active',
              plan_rollover: rollover,
            })
            .eq("id", userId);

          await supabaseService.from("credit_transactions").insert({
            user_id: userId,
            type: "credit",
            amount: monthlyCredits,
            reason: rollover ? "subscription_rollover" : "subscription_reset",
            metadata: {
              invoice_id: invoice.id,
              subscription_id: invoiceSubId,
              tier,
              rollover,
            },
          });

          logStep(`${rollover ? 'Added' : 'Reset'} ${monthlyCredits} credits for user ${userId}. New balance: ${newBalance}`);
        }
      }
    }

    // Handle checkout completion for press releases (keep existing functionality)
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      if (session.payment_status === 'paid' && session.metadata?.type === 'press_release_distribution') {
        const pressReleaseId = session.metadata.press_release_id;
        const userId = session.metadata.user_id;

        if (pressReleaseId && userId) {
          await supabaseService
            .from('press_orders')
            .update({ status: 'paid', updated_at: new Date().toISOString() })
            .eq('stripe_session_id', session.id)
            .eq('user_id', userId);

          await supabaseService
            .from('press_releases')
            .update({ status: 'paid', updated_at: new Date().toISOString() })
            .eq('id', pressReleaseId)
            .eq('user_id', userId);

          logStep("Updated press release to paid", { pressReleaseId });
        }
      }

      // Every paid checkout gets a durable entitlement so access can be recovered.
      const meta = (session.metadata ?? {}) as Record<string, string>;

      // ReSing Payment Links: no signed-in user, so find or create the buyer by email and deliver the plan.
      const linkPlan = LINK_PLANS[meta.offer ?? meta.plan_id ?? ""];
      if (meta.app === "resinglab" && !meta.user_id && linkPlan &&
          ["paid", "no_payment_required"].includes(session.payment_status as string)) {
        const ok = await fulfillResingLink(stripe, supabaseService, event, session, meta, linkPlan);
        if (!ok) return new Response("Fulfillment incomplete; retry", { status: 500 });
      }
      if (session.payment_status === "paid" && meta.user_id &&
          (meta.app === "resinglab" || meta.type === "press_release_distribution")) {
        await grantEntitlement(supabaseService, {
          user_id: meta.user_id,
          user_email: session.customer_details?.email ?? session.customer_email ?? null,
          product_type: meta.product_type ?? (session.mode === "subscription" ? "subscription" : "digital_download"),
          product_id: meta.product_id ?? meta.price_id ?? session.id,
          product_name: meta.product_name ?? meta.tier ?? meta.type ?? "ReSingLab purchase",
          access_level: meta.tier ?? meta.access_level ?? null,
          credits_granted: Number.parseInt(meta.credits_granted ?? "0", 10) || 0,
          stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
          stripe_subscription_id: typeof session.subscription === "string" ? session.subscription : null,
          stripe_event_id: event.id,
          metadata: { source: "stripe-webhook", mode: session.mode },
        }).catch((e) => logStep("Checkout entitlement grant failed", { error: String(e) }));
      }

      if ((meta.type === "marketplace_purchase" || meta.type === "marketplace_showcase") && session.payment_status === "paid") {
        const claimed = await claimStripeEvent(supabaseService, event.id, event.type);
        if (claimed) {
          const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
          const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
          await forEachMarketSchema(supabaseUrl, serviceKey, async (market) => {
            if (meta.type === "marketplace_purchase") {
              await grantMarketPurchase(market, {
                sessionId: session.id,
                paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
                eventId: event.id,
              });
            }
            if (meta.type === "marketplace_showcase" && meta.listing_id && meta.user_id && meta.ends_at) {
              await activateShowcaseFromCheckout(market, {
                sessionId: session.id,
                subscriptionId: typeof session.subscription === "string" ? session.subscription : null,
                listingId: meta.listing_id,
                sellerId: meta.user_id,
                endsAt: meta.ends_at,
              });
            }
          });
          logStep("Marketplace checkout fulfilled", { type: meta.type, sessionId: session.id });
        }
      }
    }

    return new Response("Webhook processed successfully", { status: 200 });
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    return new Response(`Webhook error: ${errorMessage}`, { status: 500 });
  }
});

async function fulfillResingLink(stripe: Stripe, db: any, event: Stripe.Event, session: Stripe.Checkout.Session,
  meta: Record<string, string>, plan: { tier: string; credits: number; name: string }): Promise<boolean> {
  const key = `checkout:${session.id}`;
  const email = sessionEmail(session);
  const subscriptionId = typeof session.subscription === "string" ? session.subscription : (session.subscription as any)?.id ?? null;
  const customerId = typeof session.customer === "string" ? session.customer : null;
  const credits = Number.parseInt(meta.monthly_credits ?? "", 10) || plan.credits;
  const claim = await claimFulfillment(db, key, {
    offer: meta.offer ?? plan.tier, email, stripe_event_id: event.id, stripe_checkout_session_id: session.id,
    stripe_subscription_id: subscriptionId, stripe_customer_id: customerId,
  });
  if (claim.duplicate) { logStep("Payment Link already fulfilled", { sessionId: session.id }); return true; }
  try {
    const buyer = await resolveBuyer(db, email, session.customer_details?.name ?? null, "resinglab", session.id);
    let periodEnd: number | null = null;
    if (subscriptionId) {
      try {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        periodEnd = subscriptionPeriodEnd(sub);
        // snake_case user_id only: the Lovable webhooks act on camelCase userId.
        if (sub.metadata?.user_id !== buyer.userId) {
          await stripe.subscriptions.update(subscriptionId, { metadata: { user_id: buyer.userId, monthly_credits: String(credits) } });
        }
      } catch (e: any) {
        logStep("Subscription read/tag failed (ledger fallback used)", { subscriptionId, error: String(e?.message ?? e) });
      }
    }
    const endIso = isoFromUnix(periodEnd) ?? new Date(Date.now() + 31 * 86400_000).toISOString();
    const now = new Date().toISOString();
    const { error: profErr } = await db.from("profiles").upsert({
      id: buyer.userId, email, subscription_tier: plan.tier, subscription_status: "active", subscription_end: endIso,
      stripe_customer_id: customerId, plan_rollover: false,
    }, { onConflict: "id" });
    if (profErr) throw new Error(`profile_update_failed: ${profErr.message}`);

    const invoiceId = typeof (session as any).invoice === "string" ? (session as any).invoice : null;
    const creditKey = invoiceId ?? `checkout:${session.id}`;
    if (!(await creditsAlreadyGranted(db, creditKey))) {
      const { error: balErr } = await db.from("profiles")
        .update({ credits_balance: credits, credits_last_reset: now }).eq("id", buyer.userId);
      if (balErr) throw new Error(`credits_update_failed: ${balErr.message}`);
      const { error: txErr } = await db.from("credit_transactions").insert({
        user_id: buyer.userId, type: "credit", amount: credits, reason: "subscription_reset",
        metadata: { invoice_id: creditKey, subscription_id: subscriptionId, tier: plan.tier, rollover: false, source: "payment_link", checkout_session_id: session.id },
      });
      if (txErr) throw new Error(`credit_tx_failed: ${txErr.message}`);
    }

    await grantEntitlement(db, {
      user_id: buyer.userId, user_email: email, product_type: "subscription",
      product_id: meta.price_id ?? meta.offer ?? plan.tier, product_name: plan.name, access_level: plan.tier,
      credits_granted: credits, stripe_customer_id: customerId, stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: null, stripe_subscription_id: subscriptionId, stripe_event_id: event.id,
      expires_at: endIso, metadata: { source: "stripe-webhook", channel: "payment_link", offer: meta.offer ?? null },
    });

    await updateFulfillment(db, key, { user_id: buyer.userId, status: "granted", detail: { tier: plan.tier, credits, period_end: endIso, new_account: buyer.created } });

    const mail = welcomeEmail({
      brand: "ReSing Lab", product: plan.name, email, newAccount: buyer.created,
      signInUrl: "https://resinglab.com/auth", resetHint: 'click "Forgot password?"',
      whatYouGet: [
        `${plan.name} plan, active now and renewing monthly`,
        `${credits} music credits every billing month`,
        `Full ReSing Lab studio access at the ${plan.tier === "studio" ? "Studio" : "Pro"} level`,
      ],
      extraLines: ["Cancel any time from your account; your plan stays active until the end of the paid month."],
    });
    const sent = await sendWelcomeOnce(db, key, claim.row?.email_sent_at ?? null, swadeMailer, { to: email, fromName: "ReSing Lab", ...mail });
    if (!sent.sent && !sent.skipped) { await updateFulfillment(db, key, { status: "email_failed" }); return false; }
    await updateFulfillment(db, key, { status: "done", last_error: null });
    logStep("Payment Link fulfilled", { sessionId: session.id, userId: buyer.userId, tier: plan.tier, newAccount: buyer.created });
    return true;
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    logStep("Payment Link fulfillment failed", { sessionId: session.id, error: msg });
    await updateFulfillment(db, key, { status: "failed", last_error: msg.slice(0, 300) }).catch(() => {});
    return false;
  }
}
