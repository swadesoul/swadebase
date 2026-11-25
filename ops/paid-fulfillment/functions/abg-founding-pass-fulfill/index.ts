// Abagale TV 2027 Founding Pass fulfillment (2026-11-24).
// Reached only through abg-stripe-router, which verifies Stripe's signature, claims the checkout once,
// and re-signs the event with ABAGALE_FOUNDING_PASS_WEBHOOK_SECRET.
// Finds or creates the buyer, issues the next numbered pass, records the entitlement, emails the buyer.
import { createClient } from "npm:@supabase/supabase-js@2.96.0";
import {
  claimFulfillment, resolveBuyer, reversalFromEvent, reversalStatus, sendWelcomeOnce, sessionEmail, swadeMailer,
  updateFulfillment, welcomeEmail,
} from "../_shared/paidFulfill.ts";

const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function verify(raw: string, header: string, secret: string): Promise<boolean> {
  let t = ""; const v1: string[] = [];
  for (const part of header.split(",")) { const [k, v] = part.split("="); if (k === "t") t = v; if (k === "v1") v1.push(v); }
  if (!t || !v1.length || Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${raw}`));
  const hex = Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return v1.some((s) => s.length === hex.length && [...s].reduce((a, c, i) => a | (c.charCodeAt(0) ^ hex.charCodeAt(i)), 0) === 0);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return reply({ error: "method_not_allowed" }, 405);
  const secret = Deno.env.get("ABAGALE_FOUNDING_PASS_WEBHOOK_SECRET");
  if (!secret) return reply({ error: "misconfigured" }, 500);
  const raw = await req.text();
  if (!(await verify(raw, req.headers.get("stripe-signature") ?? "", secret))) return reply({ error: "invalid_signature" }, 400);
  const event = JSON.parse(raw);
  const rev = reversalFromEvent(event);
  if (rev) return await applyReversal(event, rev);
  const session = event?.data?.object;
  if (!["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event?.type) || session?.object !== "checkout.session") {
    return reply({ received: true, ignored: true });
  }
  if (!["paid", "no_payment_required"].includes(session.payment_status)) return reply({ received: true, unpaid: true });
  const md = session.metadata ?? {};
  if (md.offer !== "founding_pass_2027") return reply({ received: true, ignored: true });

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const key = `checkout:${session.id}`;
  const email = sessionEmail(session);
  const customerId = typeof session.customer === "string" ? session.customer : null;
  const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : null;
  const claim = await claimFulfillment(db, key, {
    offer: "founding_pass_2027", email, stripe_event_id: event.id, stripe_checkout_session_id: session.id, stripe_customer_id: customerId,
  });
  if (claim.duplicate) return reply({ received: true, duplicate: true });
  try {
    const name = session.customer_details?.name ?? null;
    const buyer = await resolveBuyer(db, email, name, "abagale", session.id);

    await db.from("founding_passes").insert({
      user_id: buyer.userId, email, credit_name: name, stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntent, stripe_customer_id: customerId,
      amount_total: session.amount_total ?? null, currency: session.currency ?? null,
    }).select("pass_number").maybeSingle();
    const { data: pass, error: passErr } = await db.from("founding_passes").select("pass_number")
      .eq("stripe_checkout_session_id", session.id).maybeSingle();
    if (passErr || !pass) throw new Error(`pass_issue_failed: ${passErr?.message ?? "missing"}`);

    const { data: ent } = await db.from("user_entitlements").select("id")
      .eq("stripe_checkout_session_id", session.id).eq("product_id", "founding_pass_2027").maybeSingle();
    if (!ent) {
      const { error: entErr } = await db.from("user_entitlements").insert({
        user_id: buyer.userId, user_email: email, stripe_customer_id: customerId, stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: paymentIntent, product_id: "founding_pass_2027", product_type: "founding_pass",
        product_name: "Abagale TV 2027 Founding Pass", price_id: "price_1Uf6Go43OPTHaIwnlOtOXyUZ", access_status: "active",
        access_level: "founding", is_lifetime: true, metadata: { pass_number: pass.pass_number, source: "payment_link" },
      });
      if (entErr && entErr.code !== "23505") throw new Error(`entitlement_failed: ${entErr.message}`);
    }
    await updateFulfillment(db, key, { user_id: buyer.userId, status: "granted", detail: { pass_number: pass.pass_number, new_account: buyer.created } });

    const no = String(pass.pass_number).padStart(4, "0");
    const mail = welcomeEmail({
      brand: "Abagale TV", product: `Abagale TV 2027 Founding Pass #${no}`, email, newAccount: buyer.created,
      signInUrl: "https://abagale.live/auth", resetHint: "use the forgot-password option",
      whatYouGet: [
        `Founding Pass number ${no}, registered to ${email}`,
        `Name credit as a founding member${name ? ` (listed as "${name}")` : ""}`,
        "An early channel-submit slot when the Abagale TV Roku channels open in 2027",
        "Founder updates by email as launch gets closer",
      ],
      extraLines: ["The Roku channels launch in 2027. This pass is not access to live Roku channels today."],
    });
    const sent = await sendWelcomeOnce(db, key, claim.row?.email_sent_at ?? null, swadeMailer, { to: email, fromName: "Abagale TV", ...mail });
    if (!sent.sent && !sent.skipped) { await updateFulfillment(db, key, { status: "email_failed" }); return reply({ error: "email_failed" }, 500); }
    await updateFulfillment(db, key, { status: "done", last_error: null });
    console.log("[founding-pass] fulfilled", { sessionId: session.id, pass: pass.pass_number, newAccount: buyer.created });
    return reply({ received: true, pass_number: pass.pass_number });
  } catch (e) {
    const msg = String((e as Error)?.message ?? e);
    console.error("[founding-pass] failed", session.id, msg);
    await updateFulfillment(db, key, { status: "failed", last_error: msg.slice(0, 300) }).catch(() => {});
    return reply({ error: "fulfillment_failed" }, 500);
  }
});

// Refunds and disputes (router forwards charge.refunded / charge.dispute.* when the payment intent is a founding pass).
// Full refund -> pass 'refunded', entitlement revoked. Dispute opened -> pass 'suspended', entitlement paused.
// Dispute won -> restored (only if it was suspended, never after a refund). Dispute lost -> revoked.
// State-based updates plus a ledger row per refund/dispute outcome make resends no-ops.
async function applyReversal(event: any, rev: ReturnType<typeof reversalFromEvent> & {}) {
  if (!rev.paymentIntentId) return reply({ received: true, ignored: true, reason: "no_payment_intent" });
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { data: pass, error } = await db.from("founding_passes").select("id,pass_number,status,user_id,email")
    .eq("stripe_payment_intent_id", rev.paymentIntentId).maybeSingle();
  if (error) return reply({ error: "lookup_failed" }, 500);
  if (!pass) return reply({ received: true, ignored: true, reason: "not_a_founding_pass" });
  const key = `${rev.kind}:${rev.ref}`;
  const claim = await claimFulfillment(db, key, {
    offer: "founding_pass_2027_reversal", email: pass.email, user_id: pass.user_id, stripe_event_id: event.id,
    stripe_customer_id: rev.customerId, detail: { kind: rev.kind, pass_number: pass.pass_number, previous_status: pass.status },
  });
  if (claim.duplicate) return reply({ received: true, duplicate: true });
  try {
    const now = new Date().toISOString();
    let passStatus = reversalStatus[rev.kind];
    if (rev.kind === "dispute_won" && pass.status !== "suspended") passStatus = pass.status; // refunded stays refunded
    if (rev.kind === "dispute_open" && pass.status === "refunded") passStatus = "refunded";
    const access = passStatus === "active" ? "active" : passStatus === "suspended" ? "paused" : "revoked";
    const { error: pErr } = await db.from("founding_passes").update({ status: passStatus, updated_at: now }).eq("id", pass.id);
    if (pErr) throw new Error(`pass_update_failed: ${pErr.message}`);
    const ent = access === "active" ? { access_status: "active", revoked_at: null, revoked_reason: null }
      : { access_status: access, revoked_at: now, revoked_reason: rev.kind };
    const { error: eErr } = await db.from("user_entitlements").update({ ...ent, updated_at: now })
      .eq("stripe_payment_intent_id", rev.paymentIntentId).eq("product_id", "founding_pass_2027");
    if (eErr) throw new Error(`entitlement_update_failed: ${eErr.message}`);
    await updateFulfillment(db, key, { status: "done", last_error: null, detail: { kind: rev.kind, pass_number: pass.pass_number, previous_status: pass.status, new_status: passStatus } });
    console.log("[founding-pass] reversal", { kind: rev.kind, pass: pass.pass_number, from: pass.status, to: passStatus });
    return reply({ received: true, pass_number: pass.pass_number, status: passStatus });
  } catch (e) {
    const msg = String((e as Error)?.message ?? e);
    await updateFulfillment(db, key, { status: "failed", last_error: msg.slice(0, 300) }).catch(() => {});
    return reply({ error: "reversal_failed" }, 500);
  }
}
