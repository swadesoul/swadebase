// Black Tales Payment Link webhook (SWADEBASE, schema blacktales). Own Stripe endpoint + BLACKTALES_STRIPE_WEBHOOK_SECRET.
// 2026-11-24: Film Listing ($20/yr, price_1Uf6Gu43OPTHaIwnvlN5g3lE). Payment finds or creates the buyer, issues one
// listing credit for the paid year, and emails them. Renewals extend the credit (and the film it was used on);
// cancellation lets it run to the end of the paid year. Only Black Tales events are acted on (shared Stripe account).
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.96.0";
import {
  claimFulfillment, invoicePeriodEnd, invoiceSubscriptionId, invoiceSubscriptionMeta, isoFromUnix, lowerEmail,
  resolveBuyer, reversalCustomer, reversalFromEvent, sendWelcomeOnce, sessionEmail, subscriptionPeriodEnd, swadeMailer, updateFulfillment, welcomeEmail,
} from "../_shared/paidFulfill.ts";

const LISTING_PRICE = "price_1Uf6Gu43OPTHaIwnvlN5g3lE";
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const isListingMeta = (m: any) => (m?.app === "blacktales" || m?.brand === "blacktales") && m?.offer === "film_listing";
const log = (msg: string, d?: unknown) => console.log(`[BT-STRIPE] ${msg}${d ? " " + JSON.stringify(d) : ""}`);

Deno.serve(async (req) => {
  if (req.method !== "POST") return reply({ error: "method_not_allowed" }, 405);
  const secret = Deno.env.get("BLACKTALES_STRIPE_WEBHOOK_SECRET");
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  if (!secret || !key) return reply({ error: "misconfigured" }, 500);
  const sig = req.headers.get("stripe-signature");
  if (!sig) return reply({ error: "missing_signature" }, 400);
  const raw = await req.text();
  const stripe = new Stripe(key, { apiVersion: "2025-08-27.basil" });
  let event: any;
  try { event = await stripe.webhooks.constructEventAsync(raw, sig, secret); } catch { return reply({ error: "invalid_signature" }, 400); }
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const obj = event.data?.object ?? {};

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      if (!isListingMeta(obj.metadata)) return reply({ received: true, ignored: true });
      if (!["paid", "no_payment_required"].includes(obj.payment_status)) return reply({ received: true, unpaid: true });
      return await fulfillListing(stripe, db, event, obj);
    }

    if (event.type === "invoice.paid") {
      const subId = invoiceSubscriptionId(obj);
      if (!subId) return reply({ received: true, ignored: true });
      const meta = invoiceSubscriptionMeta(obj);
      const priceOnLine = obj.lines?.data?.some((l: any) => (l?.pricing?.price_details?.price ?? l?.price?.id) === LISTING_PRICE);
      if (!isListingMeta(meta) && !priceOnLine) return reply({ received: true, ignored: true });
      if (obj.billing_reason !== "subscription_cycle") return reply({ received: true, first_invoice: true }); // checkout covers year one
      const ledgerKey = `invoice:${obj.id}`;
      const claim = await claimFulfillment(db, ledgerKey, { offer: "film_listing_renewal", stripe_event_id: event.id, stripe_subscription_id: subId, email: lowerEmail(obj.customer_email) });
      if (claim.duplicate) return reply({ received: true, duplicate: true });
      const end = isoFromUnix(invoicePeriodEnd(obj)) ?? new Date(Date.now() + 366 * 86400_000).toISOString();
      const { data: credits, error } = await db.from("listing_credits")
        .update({ status: "active", period_end: end, updated_at: new Date().toISOString() })
        .eq("stripe_subscription_id", subId).select("id,user_id,film_id");
      if (error) throw new Error(`renewal_failed: ${error.message}`);
      const films = (credits ?? []).map((c: any) => c.film_id).filter(Boolean);
      if (films.length) {
        const { error: fErr } = await db.from("films").update({ expires_at: end }).in("id", films);
        if (fErr) throw new Error(`film_extend_failed: ${fErr.message}`);
      }
      await updateFulfillment(db, ledgerKey, { status: "done", user_id: credits?.[0]?.user_id ?? null, detail: { period_end: end, films } });
      log("renewal applied", { subId, end, films: films.length });
      return reply({ received: true });
    }

    const rev = reversalFromEvent(event);
    if (rev) return await applyListingReversal(db, event, rev, key);

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      if (!isListingMeta(obj.metadata) && obj.items?.data?.[0]?.price?.id !== LISTING_PRICE) return reply({ received: true, ignored: true });
      if (event.type === "customer.subscription.deleted") {
        // Fires when the paid year is over (cancel at period end) or on an immediate cancel: no further years.
        await db.from("listing_credits").update({ status: "canceled", updated_at: new Date().toISOString() }).eq("stripe_subscription_id", obj.id);
        log("subscription ended", { subId: obj.id });
      } else {
        const end = isoFromUnix(subscriptionPeriodEnd(obj));
        if (end && ["active", "trialing"].includes(obj.status)) {
          await db.from("listing_credits").update({ period_end: end, updated_at: new Date().toISOString() })
            .eq("stripe_subscription_id", obj.id).eq("status", "active");
        }
      }
      return reply({ received: true });
    }
    return reply({ received: true, ignored: true });
  } catch (e) {
    console.error("[BT-STRIPE] error", event?.id, String((e as Error)?.message ?? e));
    return reply({ error: "processing_failed" }, 500);
  }
});

async function fulfillListing(stripe: Stripe, db: any, event: any, session: any): Promise<Response> {
  const ledgerKey = `checkout:${session.id}`;
  const email = sessionEmail(session);
  const subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null;
  const customerId = typeof session.customer === "string" ? session.customer : null;
  const claim = await claimFulfillment(db, ledgerKey, { offer: "film_listing", email, stripe_event_id: event.id,
    stripe_checkout_session_id: session.id, stripe_subscription_id: subId, stripe_customer_id: customerId });
  if (claim.duplicate) return reply({ received: true, duplicate: true });
  try {
    const name = session.customer_details?.name ?? null;
    const buyer = await resolveBuyer(db, email, name, "blacktales", session.id);
    await db.from("profiles").upsert({ id: buyer.userId, email, display_name: name ?? email.split("@")[0] }, { onConflict: "id", ignoreDuplicates: true });
    let periodEnd: number | null = null;
    if (subId) {
      try {
        const sub: any = await stripe.subscriptions.retrieve(subId);
        periodEnd = subscriptionPeriodEnd(sub);
        if (sub.metadata?.user_id !== buyer.userId) {
          // snake_case user_id only: the Lovable webhooks act on camelCase userId.
          await stripe.subscriptions.update(subId, { metadata: { user_id: buyer.userId } });
        }
      } catch (e) { log("subscription read/tag failed (ledger fallback used)", { subId, error: String((e as Error)?.message ?? e) }); }
    }
    const end = isoFromUnix(periodEnd) ?? new Date(Date.now() + 366 * 86400_000).toISOString();
    const { error: insErr } = await db.from("listing_credits").insert({
      user_id: buyer.userId, email, credits: 1, credits_used: 0, status: "active", period_end: end,
      stripe_subscription_id: subId, stripe_checkout_session_id: session.id, stripe_customer_id: customerId,
    });
    if (insErr && insErr.code !== "23505") throw new Error(`credit_issue_failed: ${insErr.message}`);
    await updateFulfillment(db, ledgerKey, { user_id: buyer.userId, status: "granted", detail: { period_end: end, new_account: buyer.created } });
    const mail = welcomeEmail({
      brand: "Black Tales", product: "Black Tales Film Listing", email, newAccount: buyer.created,
      signInUrl: "https://blacktales.online/auth", resetHint: "use the forgot-password option",
      whatYouGet: [
        `1 film listing credit, good through ${end.slice(0, 10)} and renewing yearly`,
        "Use it to list one film in the Black Tales theater district for the paid year",
      ],
      extraLines: ["Next step: sign in and submit your film at https://blacktales.online/submit. Your listing credit is already on your account.",
        "Cancel any time; your listing stays up until the end of the paid year."],
    });
    const sent = await sendWelcomeOnce(db, ledgerKey, claim.row?.email_sent_at ?? null, swadeMailer, { to: email, fromName: "Black Tales", ...mail });
    if (!sent.sent && !sent.skipped) { await updateFulfillment(db, ledgerKey, { status: "email_failed" }); return reply({ error: "email_failed" }, 500); }
    await updateFulfillment(db, ledgerKey, { status: "done", last_error: null });
    log("listing fulfilled", { sessionId: session.id, userId: buyer.userId, newAccount: buyer.created });
    return reply({ received: true });
  } catch (e) {
    const msg = String((e as Error)?.message ?? e);
    console.error("[BT-STRIPE] listing failed", session.id, msg);
    await updateFulfillment(db, ledgerKey, { status: "failed", last_error: msg.slice(0, 300) }).catch(() => {});
    return reply({ error: "fulfillment_failed" }, 500);
  }
}

// Refunds and disputes (2026-11-24). The listing credit stores the buyer's Stripe customer.
// Full refund -> 'refunded', dispute opened -> 'suspended', dispute won -> back to 'active' (only from suspended),
// dispute lost -> 'revoked'. While not active, the film the credit was used on is hidden (expires_at = now) and the
// original expiry is kept in the ledger so a won dispute restores it. Ledger key per refund/dispute outcome = idempotent.
async function applyListingReversal(db: any, event: any, rev: NonNullable<ReturnType<typeof reversalFromEvent>>, stripeKey: string) {
  const customer = await reversalCustomer(rev, stripeKey);
  if (!customer) return reply({ received: true, ignored: true, reason: "no_customer" });
  const { data: credits, error } = await db.from("listing_credits").select("id,user_id,email,status,film_id,period_end")
    .eq("stripe_customer_id", customer);
  if (error) throw new Error(`credit_lookup_failed: ${error.message}`);
  if (!credits?.length) return reply({ received: true, ignored: true, reason: "not_a_listing_customer" });
  const ledgerKey = `${rev.kind}:${rev.ref}`;
  const claim = await claimFulfillment(db, ledgerKey, {
    offer: "film_listing_reversal", email: credits[0].email, user_id: credits[0].user_id, stripe_event_id: event.id, stripe_customer_id: customer,
  });
  if (claim.duplicate) return reply({ received: true, duplicate: true });
  const now = new Date().toISOString();
  const changed: any[] = [];
  for (const c of credits) {
    let to = c.status;
    if (rev.kind === "refund") to = "refunded";
    else if (rev.kind === "dispute_lost") to = c.status === "refunded" ? "refunded" : "revoked";
    else if (rev.kind === "dispute_open") to = c.status === "active" ? "suspended" : c.status;
    else if (rev.kind === "dispute_won") to = c.status === "suspended" ? "active" : c.status;
    if (to === c.status) continue;
    const { error: uErr } = await db.from("listing_credits").update({ status: to, updated_at: now }).eq("id", c.id);
    if (uErr) throw new Error(`credit_update_failed: ${uErr.message}`);
    if (c.film_id) {
      const expires = to === "active" ? (c.period_end ?? null) : now;
      const { error: fErr } = await db.from("films").update({ expires_at: expires }).eq("id", c.film_id);
      if (fErr) throw new Error(`film_update_failed: ${fErr.message}`);
    }
    changed.push({ id: c.id, from: c.status, to, film_id: c.film_id });
  }
  await updateFulfillment(db, ledgerKey, { status: "done", last_error: null, detail: { kind: rev.kind, changed } });
  log("reversal applied", { kind: rev.kind, customer, changed: changed.length });
  return reply({ received: true, changed: changed.length });
}
