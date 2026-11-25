// VideoSayWhat Stripe webhook (SWADEBASE). Own endpoint + own secret (VSW_STRIPE_WEBHOOK_SECRET).
// 2026-11-24: scoped to VideoSayWhat events only (the Stripe account is shared), Payment Link buyers are found or
// created by email and fulfilled idempotently, renewals extend access, cancellations end it at period end.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getErrorMessage } from '../vsw-_shared/error-utils.ts';
import { sendMail } from '../vsw-_shared/mail.ts';
import {
  claimFulfillment, invoicePeriodEnd, invoiceSubscriptionId, invoiceSubscriptionMeta, isoFromUnix, lowerEmail,
  resolveBuyer, reversalCustomer, reversalFromEvent, sendWelcomeOnce, sessionEmail, subscriptionPeriodEnd, updateFulfillment, welcomeEmail, type Mailer,
} from '../_shared/paidFulfill.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, stripe-signature',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const TIER_CONFIG: Record<string, { minutes: number; rollover: boolean; name: string }> = {
  'free': { minutes: 2, rollover: false, name: 'Free' },
  'starter': { minutes: 60, rollover: true, name: 'Starter' },
  'creator': { minutes: 300, rollover: true, name: 'Creator' },
  'pro': { minutes: 1200, rollover: true, name: 'Pro' },
  'api': { minutes: 5000, rollover: false, name: 'API' },
  'enterprise': { minutes: 10000, rollover: true, name: 'Enterprise' },
};

// Live price ids plus lookup keys (lookup keys were previously used here as if they were ids).
const PRICE_TO_TIER: Record<string, string> = {
  'price_1Uf6Go43OPTHaIwnmmncIwzA': 'starter',
  'price_1Uf6Gp43OPTHaIwnrcxw10td': 'creator',
  'price_starter_monthly': 'starter',
  'price_creator_monthly': 'creator',
  'price_pro_monthly': 'pro',
  'price_api_monthly': 'api',
  'price_enterprise_monthly': 'enterprise',
};
const tierForPrice = (price: any): string | undefined =>
  PRICE_TO_TIER[price?.id ?? ''] ?? PRICE_TO_TIER[price?.lookup_key ?? ''];

const isVswMeta = (m: any) => m?.app === 'videosaywhat' || m?.brand === 'videosaywhat';
function isVswSession(s: any): boolean {
  if (isVswMeta(s?.metadata)) return true;
  try { return new URL(s?.success_url ?? '').hostname.includes('videosaywhat'); } catch { return false; }
}
const isVswSubscription = (sub: any) => isVswMeta(sub?.metadata) || !!tierForPrice(sub?.items?.data?.[0]?.price);

// HMAC-SHA256 verification for Stripe webhooks (constant-time compare, 5 minute tolerance)
async function verifyStripeSignature(payload: string, sigHeader: string, secret: string): Promise<boolean> {
  let timestamp = '';
  const signatures: string[] = [];
  for (const part of sigHeader.split(',')) {
    const [key, value] = part.split('=');
    if (key === 't') timestamp = value;
    if (key === 'v1') signatures.push(value);
  }
  if (!timestamp || signatures.length === 0) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - parseInt(timestamp)) > 300) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${payload}`));
  const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  return signatures.some((s) => s.length === expected.length &&
    [...s].reduce((acc, ch, i) => acc | (ch.charCodeAt(0) ^ expected.charCodeAt(i)), 0) === 0);
}

async function stripeApi(path: string, init?: RequestInit): Promise<any> {
  const key = Deno.env.get('STRIPE_API_SECRET_KEY') || Deno.env.get('STRIPE_SECRET_KEY');
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    ...init, headers: { 'Authorization': `Bearer ${key}`, 'Stripe-Version': '2025-12-15.clover', ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`Stripe API error: ${res.status} ${(await res.text()).slice(0, 200)}`);
  return res.json();
}
const stripeGet = (path: string) => stripeApi(path);

const vswMailer: Mailer = async (m) => {
  const r = await sendMail({ from: `"${m.fromName}" <noreply@videosaywhat.com>`, to: m.to, subject: m.subject, html: m.html, text: m.text,
    headers: { 'X-Swade-Idempotency-Key': m.key } });
  if (r.error) throw new Error(r.error.message);
  return r.data?.id ?? '';
};

/** Finds the VSW profile for a user (by user_id, then email) and applies the patch, creating it if missing. */
async function upsertVswProfile(userId: string, email: string, patch: Record<string, unknown>) {
  let { data: rows } = await supabase.from('profiles').select('id').eq('user_id', userId).limit(1);
  if (!rows?.length) ({ data: rows } = await supabase.from('profiles').select('id').ilike('email', email).limit(1));
  const now = new Date().toISOString();
  if (rows?.length) {
    const { error } = await supabase.from('profiles').update({ ...patch, user_id: userId, email, updated_at: now }).eq('id', rows[0].id);
    if (error) throw new Error(`profile_update_failed: ${error.message}`);
  } else {
    const { error } = await supabase.from('profiles').insert({ ...patch, user_id: userId, email });
    if (error) throw new Error(`profile_insert_failed: ${error.message}`);
  }
}

async function profileForSubscription(sub: any): Promise<any | null> {
  const { data } = await supabase.from('profiles').select('id,user_id,email').eq('stripe_subscription_id', sub.id).limit(1);
  if (data?.length) return data[0];
  const { data: led } = await supabase.from('paid_fulfillments').select('user_id').eq('stripe_subscription_id', sub.id)
    .not('user_id', 'is', null).limit(1);
  if (led?.length) {
    const { data: p } = await supabase.from('profiles').select('id,user_id,email').eq('user_id', led[0].user_id).limit(1);
    if (p?.length) return p[0];
  }
  return null;
}

async function fulfillSubscriptionCheckout(event: any, session: any): Promise<boolean> {
  const key = `checkout:${session.id}`;
  const email = sessionEmail(session);
  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id ?? null;
  const customerId = typeof session.customer === 'string' ? session.customer : null;
  const claim = await claimFulfillment(supabase, key, {
    offer: session.metadata?.offer ?? session.metadata?.plan ?? 'subscription', email, stripe_event_id: event.id,
    stripe_checkout_session_id: session.id, stripe_subscription_id: subscriptionId, stripe_customer_id: customerId,
  });
  if (claim.duplicate) return true;
  try {
    let sub: any = null;
    if (subscriptionId) {
      try { sub = await stripeGet(`/subscriptions/${subscriptionId}`); }
      catch (e) { console.warn('Subscription lookup failed; using session metadata', getErrorMessage(e)); }
    }
    const tier = (sub && tierForPrice(sub.items?.data?.[0]?.price)) ?? session.metadata?.plan ?? session.metadata?.tier;
    if (!tier || !TIER_CONFIG[tier] || tier === 'free') throw new Error(`unknown_vsw_plan: ${tier ?? 'none'}`);
    const buyer = await resolveBuyer(supabase, email, session.customer_details?.name ?? null, 'videosaywhat', session.id);
    const periodEndIso = isoFromUnix(subscriptionPeriodEnd(sub)) ?? new Date(Date.now() + 31 * 86400_000).toISOString();
    const minutes = TIER_CONFIG[tier].minutes;
    // Usage resets once per paid checkout; a resent event is stopped by the ledger above.
    await upsertVswProfile(buyer.userId, email, {
      tier, minutes_limit: minutes, minutes_used: 0, stripe_customer_id: customerId, stripe_subscription_id: subscriptionId,
      subscription_id: customerId, subscription_period_start: new Date().toISOString(), subscription_period_end: periodEndIso,
    });
    if (sub && subscriptionId && sub.metadata?.user_id !== buyer.userId) {
      // snake_case user_id only: the Lovable webhooks act on camelCase userId.
      await stripeApi(`/subscriptions/${subscriptionId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ 'metadata[user_id]': buyer.userId, 'metadata[app]': 'videosaywhat', 'metadata[plan]': tier }),
      }).catch((e) => console.warn('Subscription tag failed', getErrorMessage(e)));
    }
    if (tier === 'pro' || tier === 'enterprise') {
      await supabase.functions.invoke('assembly-provision', { body: { userId: buyer.userId, userEmail: email, tier } })
        .catch((e: unknown) => console.error('Failed to provision AssemblyAI:', e));
    }
    await updateFulfillment(supabase, key, { user_id: buyer.userId, status: 'granted', detail: { tier, minutes, period_end: periodEndIso, new_account: buyer.created } });
    const name = `VideoSayWhat ${TIER_CONFIG[tier].name}`;
    const mail = welcomeEmail({
      brand: 'VideoSayWhat', product: name, email, newAccount: buyer.created,
      signInUrl: buyer.created ? 'https://videosaywhat.com/auth?reset=1' : 'https://videosaywhat.com/auth',
      resetHint: 'enter your email under "Reset your password"',
      whatYouGet: [
        `${name} plan, active now and renewing monthly`,
        `${minutes} minutes of transcription every month`,
        tier === 'creator' ? 'Caption editing, ReVoice and translation' : 'Starter export tools',
      ],
      extraLines: ['Cancel any time from Settings; your plan stays active until the end of the paid month.'],
    });
    const sent = await sendWelcomeOnce(supabase, key, claim.row?.email_sent_at ?? null, vswMailer, { to: email, fromName: 'VideoSayWhat', ...mail });
    if (!sent.sent && !sent.skipped) { await updateFulfillment(supabase, key, { status: 'email_failed' }); return false; }
    await updateFulfillment(supabase, key, { status: 'done', last_error: null });
    console.log('VSW subscription fulfilled', { sessionId: session.id, userId: buyer.userId, tier, newAccount: buyer.created });
    return true;
  } catch (e) {
    const msg = getErrorMessage(e);
    console.error('VSW fulfillment failed', session.id, msg);
    await updateFulfillment(supabase, key, { status: 'failed', last_error: msg.slice(0, 300) }).catch(() => {});
    return false;
  }
}

// Refunds and disputes on a paid plan (2026-11-24). Matched by the Stripe customer stored on the profile.
// Full refund, dispute opened or dispute lost -> plan drops to free (1 minute); the plan it had is kept in the ledger.
// Dispute won -> that plan is restored if the profile is still on free. One ledger row per refund/dispute outcome.
// The Stripe subscription itself is not canceled here (a renewal that is paid again re-grants the plan).
async function applyVswReversal(event: any, rev: NonNullable<ReturnType<typeof reversalFromEvent>>) {
  const customer = await reversalCustomer(rev, Deno.env.get('STRIPE_API_SECRET_KEY') || Deno.env.get('STRIPE_SECRET_KEY'));
  if (!customer) return { received: true, ignored: true, reason: 'no_customer' };
  const { data: profile, error } = await supabase.from('profiles')
    .select('id,user_id,email,tier,minutes_limit,subscription_period_end').eq('stripe_customer_id', customer).maybeSingle();
  if (error) throw new Error(`profile_lookup_failed: ${error.message}`);
  if (!profile) return { received: true, ignored: true, reason: 'not_a_vsw_customer' };
  const key = `${rev.kind}:${rev.ref}`;
  const claim = await claimFulfillment(supabase, key, { offer: 'vsw_reversal', email: profile.email, user_id: profile.user_id,
    stripe_event_id: event.id, stripe_customer_id: customer });
  if (claim.duplicate) return { received: true, duplicate: true };
  const previous = { tier: profile.tier, minutes_limit: profile.minutes_limit, subscription_period_end: profile.subscription_period_end };
  if (rev.kind === 'dispute_won') {
    const { data: opened } = await supabase.from('paid_fulfillments').select('detail').eq('fulfillment_key', `dispute_open:${rev.ref}`).maybeSingle();
    const prior = opened?.detail?.previous;
    const refunded = rev.chargeId ? (await supabase.from('paid_fulfillments').select('fulfillment_key').eq('fulfillment_key', `refund:${rev.chargeId}`).maybeSingle()).data : null;
    let restored = false;
    if (!refunded && profile.tier === 'free' && prior?.tier && prior.tier !== 'free' && TIER_CONFIG[prior.tier]) {
      const { error: uErr } = await supabase.from('profiles').update({ tier: prior.tier, minutes_limit: prior.minutes_limit ?? TIER_CONFIG[prior.tier].minutes,
        subscription_period_end: prior.subscription_period_end, updated_at: new Date().toISOString() }).eq('id', profile.id);
      if (uErr) throw new Error(`restore_failed: ${uErr.message}`);
      restored = true;
    }
    await updateFulfillment(supabase, key, { status: 'done', last_error: null, detail: { kind: rev.kind, restored, restored_tier: restored ? prior.tier : null } });
    console.log('VSW dispute won', { profileId: profile.id, restored });
    return { received: true, restored };
  }
  if (profile.tier !== 'free') {
    const { error: uErr } = await supabase.from('profiles').update({ tier: 'free', minutes_limit: 1, updated_at: new Date().toISOString() }).eq('id', profile.id);
    if (uErr) throw new Error(`downgrade_failed: ${uErr.message}`);
  }
  await updateFulfillment(supabase, key, { status: 'done', last_error: null, detail: { kind: rev.kind, previous } });
  console.log('VSW access removed', { kind: rev.kind, profileId: profile.id, from: profile.tier });
  return { received: true, revoked: profile.tier !== 'free' };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();
    const webhookSecret = Deno.env.get('VSW_STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('SECURITY ERROR: VSW_STRIPE_WEBHOOK_SECRET not configured');
      return json({ error: 'Webhook secret not configured' }, 500);
    }
    if (!signature) return json({ error: 'Missing signature' }, 400);
    if (!(await verifyStripeSignature(body, signature, webhookSecret))) {
      console.error('SECURITY ERROR: Invalid webhook signature');
      return json({ error: 'Invalid signature' }, 400);
    }
    const event = JSON.parse(body);
    console.log('SECURITY: Stripe webhook received', { eventType: event.type, eventId: event.id });

    const rev = reversalFromEvent(event);
    if (rev) return json(await applyVswReversal(event, rev));

    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object;
        if (!isVswSession(session)) return json({ received: true, ignored: true });
        if (!['paid', 'no_payment_required'].includes(session.payment_status)) return json({ received: true, unpaid: true });
        const metaType = session.metadata?.type;

        // Credit pack one-time purchase (idempotent through award_credits key)
        if (metaType === 'credit_pack') {
          const userId = session.metadata?.user_id;
          const credits = parseFloat(session.metadata?.credits || '0');
          const packKey = session.metadata?.pack_key || 'unknown';
          if (userId && credits > 0) {
            await supabase.from('credit_pack_purchases').update({
              status: 'completed', completed_at: new Date().toISOString(),
              stripe_payment_intent_id: session.payment_intent ?? null,
            }).eq('stripe_session_id', session.id);
            const { error } = await supabase.rpc('award_credits', {
              p_user_id: userId, p_kind: 'purchase', p_amount: credits,
              p_idempotency_key: `pack:${session.id}`, p_metadata: { pack_key: packKey, session_id: session.id },
            });
            if (error) throw new Error(`award_credits failed: ${error.message}`);
            await supabase.rpc('qualify_referral', { p_referee_id: userId });
          }
          break;
        }

        // Unlimited subscription
        if (metaType === 'credit_subscription') {
          const userId = session.metadata?.user_id;
          if (userId) {
            await supabase.from('credit_accounts').update({ is_unlimited: true }).eq('user_id', userId);
            await supabase.rpc('qualify_referral', { p_referee_id: userId });
          }
          break;
        }

        if (session.mode === 'subscription' || session.subscription) {
          const ok = await fulfillSubscriptionCheckout(event, session);
          if (!ok) return json({ error: 'fulfillment_incomplete' }, 500);
        }
        break;
      }

      case 'invoice.paid':
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subId = invoiceSubscriptionId(invoice);
        if (!subId) break;
        let sub: any = { id: subId, metadata: invoiceSubscriptionMeta(invoice), items: { data: [{ price: invoice.lines?.data?.[0]?.pricing?.price_details?.price ? { id: invoice.lines.data[0].pricing.price_details.price } : invoice.lines?.data?.[0]?.price }] } };
        if (!isVswSubscription(sub)) {
          try { sub = await stripeGet(`/subscriptions/${subId}`); } catch { break; }
          if (!isVswSubscription(sub)) break;
        }
        const key = `invoice:${invoice.id}`;
        const claim = await claimFulfillment(supabase, key, { offer: 'renewal', stripe_event_id: event.id, stripe_subscription_id: subId,
          stripe_customer_id: typeof invoice.customer === 'string' ? invoice.customer : null, email: lowerEmail(invoice.customer_email) });
        if (claim.duplicate) break;
        const profile = await profileForSubscription(sub);
        if (!profile) {
          // First invoice can arrive before checkout fulfillment; checkout sets the period and minutes.
          await updateFulfillment(supabase, key, { status: 'done', detail: { skipped: 'no_profile_yet' } });
          break;
        }
        const tier = tierForPrice(sub.items?.data?.[0]?.price) ?? sub.metadata?.plan;
        const periodEndIso = isoFromUnix(invoicePeriodEnd(invoice));
        const patch: Record<string, unknown> = { subscription_period_end: periodEndIso ?? undefined, updated_at: new Date().toISOString() };
        if (invoice.billing_reason === 'subscription_cycle' && tier && TIER_CONFIG[tier]) {
          Object.assign(patch, { tier, minutes_limit: TIER_CONFIG[tier].minutes, minutes_used: 0, subscription_period_start: new Date().toISOString() });
        }
        const { error } = await supabase.from('profiles').update(patch).eq('id', profile.id);
        if (error) throw new Error(`renewal_update_failed: ${error.message}`);
        await updateFulfillment(supabase, key, { status: 'done', user_id: profile.user_id, detail: { tier, period_end: periodEndIso, billing_reason: invoice.billing_reason } });
        console.log('VSW renewal applied', { subId, tier, periodEndIso });
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        if (!isVswSubscription(sub)) break;
        const profile = await profileForSubscription(sub);
        if (!profile) break;
        const end = isoFromUnix(subscriptionPeriodEnd(sub));
        if (['active', 'trialing'].includes(sub.status) && end) {
          await supabase.from('profiles').update({ subscription_period_end: end }).eq('id', profile.id);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        // Stripe sends this when the paid period ends after a cancel (or immediately on an immediate cancel).
        const sub = event.data.object;
        if (!isVswSubscription(sub)) break;
        const profile = await profileForSubscription(sub);
        if (!profile) break;
        await supabase.from('profiles').update({
          tier: 'free', minutes_limit: 1, subscription_id: null, stripe_subscription_id: null,
          subscription_period_start: null, subscription_period_end: null,
        }).eq('id', profile.id);
        console.log('Subscription ended, downgraded to free:', { profileId: profile.id, subId: sub.id });
        break;
      }
    }
    return json({ received: true });
  } catch (error) {
    console.error('Error in vsw-stripe-webhook:', error);
    return json({ error: getErrorMessage(error) }, 500);
  }
});
