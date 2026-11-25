// Paid Payment Link fulfillment helpers (2026-11-24).
// Used by stripe-webhook (ReSing), vsw-stripe-webhook, abg-founding-pass-fulfill and blacktales-stripe-webhook.
// Every step is idempotent: a ledger row per fulfillment key, unique Stripe ids on grants,
// and a one-time email marker, so a resent Stripe event never grants or emails twice.
import { sendSwadeMail } from "../swade-_shared/swadeMail.ts";

type Db = any;

export const lowerEmail = (v: unknown) => String(v ?? "").trim().toLowerCase();
const idOf = (v: any): string | null => (typeof v === "string" ? v : v?.id ?? null);

/** Buyer email from a Checkout Session (Payment Links fill customer_details.email). */
export function sessionEmail(s: any): string {
  return lowerEmail(s?.customer_details?.email ?? s?.customer_email ?? s?.metadata?.user_email ?? "");
}

/** Period end across Stripe API versions (pre-basil top level, basil/clover on items). */
export function subscriptionPeriodEnd(sub: any): number | null {
  const v = sub?.current_period_end ?? sub?.items?.data?.[0]?.current_period_end ?? null;
  return typeof v === "number" ? v : null;
}
export function invoiceSubscriptionId(inv: any): string | null {
  return idOf(inv?.subscription) ?? idOf(inv?.parent?.subscription_details?.subscription) ?? null;
}
export function invoiceSubscriptionMeta(inv: any): Record<string, string> {
  return (inv?.subscription_details?.metadata ?? inv?.parent?.subscription_details?.metadata ?? {}) as Record<string, string>;
}
export function invoicePeriodEnd(inv: any): number | null {
  const line = inv?.lines?.data?.find((l: any) => l?.period?.end) ?? null;
  return typeof line?.period?.end === "number" ? line.period.end : null;
}
export const isoFromUnix = (v: number | null | undefined) =>
  typeof v === "number" && Number.isFinite(v) ? new Date(v * 1000).toISOString() : null;

export type Claim = { duplicate: boolean; row: any };

/**
 * Claims a fulfillment key. duplicate=true means it already finished (resent event): do nothing.
 * A row left in 'processing'/'failed' (an earlier attempt crashed) is retried; each step below is idempotent.
 */
export async function claimFulfillment(db: Db, key: string, fields: Record<string, unknown>): Promise<Claim> {
  const { data: inserted, error } = await db.from("paid_fulfillments")
    .insert({ fulfillment_key: key, ...fields }).select("*").maybeSingle();
  if (inserted) return { duplicate: false, row: inserted };
  if (error && error.code !== "23505") throw new Error(`ledger_insert_failed: ${error.message}`);
  const { data: row, error: readErr } = await db.from("paid_fulfillments").select("*").eq("fulfillment_key", key).maybeSingle();
  if (readErr || !row) throw new Error(`ledger_read_failed: ${readErr?.message ?? "missing"}`);
  if (row.status === "done") return { duplicate: true, row };
  await db.from("paid_fulfillments").update({ attempts: (row.attempts ?? 1) + 1, updated_at: new Date().toISOString() })
    .eq("fulfillment_key", key);
  return { duplicate: false, row };
}

export async function updateFulfillment(db: Db, key: string, patch: Record<string, unknown>) {
  const { error } = await db.from("paid_fulfillments").update({ ...patch, updated_at: new Date().toISOString() })
    .eq("fulfillment_key", key);
  if (error) throw new Error(`ledger_update_failed: ${error.message}`);
}

/** Finds the auth user for an email, creating a confirmed account when none exists. */
export async function resolveBuyer(db: Db, email: string, name: string | null, app: string, ref: string):
  Promise<{ userId: string; created: boolean }> {
  if (!email) throw new Error("buyer_email_missing");
  const prep = async () => {
    const { data, error } = await db.rpc("paid_buyer_prepare", { p_email: email, p_ref: ref });
    if (error) throw new Error(`buyer_lookup_failed: ${error.message}`);
    return (data as string | null) ?? null;
  };
  const existing = await prep();
  if (existing) return { userId: existing, created: false };
  const { data, error } = await db.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: name ?? undefined, signup_source: "stripe_payment_link", signup_app: app, stripe_ref: ref },
  });
  if (data?.user?.id) return { userId: data.user.id, created: true };
  // A concurrent delivery may have created it first.
  const again = await prep();
  if (again) return { userId: again, created: false };
  throw new Error(`buyer_create_failed: ${error?.message ?? "unknown"}`);
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export type WelcomeInput = {
  brand: string;
  product: string;
  email: string;
  newAccount: boolean;
  signInUrl: string;
  resetHint: string;
  whatYouGet: string[];
  extraLines?: string[];
};

export function welcomeEmail(w: WelcomeInput): { subject: string; html: string; text: string } {
  const subject = `You're in: ${w.product}`;
  const access = w.newAccount
    ? [`We created your ${w.brand} account for ${w.email}.`, `To get in, open ${w.signInUrl} and ${w.resetHint} to set your password, then sign in with ${w.email}.`]
    : [`Your purchase is on your existing ${w.brand} account (${w.email}).`, `Sign in at ${w.signInUrl} with ${w.email} and it's ready to use.`];
  const lines = [
    `Thank you for buying ${w.product}.`, "",
    "What you got:", ...w.whatYouGet.map((b) => `- ${b}`), "",
    "How to get in:", ...access,
    ...(w.extraLines?.length ? ["", ...w.extraLines] : []), "",
    "This is a digital product. All sales are final; no refunds.",
    `- The ${w.brand} team`,
  ];
  const text = lines.join("\n");
  const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#111;line-height:1.5;max-width:560px;margin:0 auto;padding:24px">
<h2 style="margin:0 0 12px">You're in: ${esc(w.product)}</h2>
<p>Thank you for buying <strong>${esc(w.product)}</strong>.</p>
<h3 style="margin:20px 0 6px">What you got</h3><ul>${w.whatYouGet.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>
<h3 style="margin:20px 0 6px">How to get in</h3>${access.map((a) => `<p>${esc(a)}</p>`).join("")}
<p><a href="${esc(w.signInUrl)}" style="display:inline-block;background:#111;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none">Open ${esc(w.brand)}</a></p>
${(w.extraLines ?? []).map((l) => `<p>${esc(l)}</p>`).join("")}
<p style="color:#666;font-size:12px;margin-top:28px">This is a digital product. All sales are final; no refunds.</p>
</body></html>`;
  return { subject, html, text };
}

export type Mailer = (m: { to: string; subject: string; html: string; text: string; fromName: string; key: string }) => Promise<string>;

/** Default mail path: Swade Mail (Mailcow, noreply@auth.swadesoul.com), same as GoTrue. */
export const swadeMailer: Mailer = async (m) => {
  const r = await sendSwadeMail({ to: m.to, subject: m.subject, html: m.html, text: m.text, fromName: m.fromName, idempotencyKey: m.key });
  return r.messageId;
};

/** Sends the welcome email once per fulfillment key; never throws. Callers return 500 on failure so Stripe retries the email. */
export async function sendWelcomeOnce(db: Db, key: string, alreadySentAt: string | null, mailer: Mailer,
  m: { to: string; fromName: string } & ReturnType<typeof welcomeEmail>) {
  if (alreadySentAt) return { sent: false, skipped: true };
  try {
    const id = await mailer({ ...m, key });
    await updateFulfillment(db, key, { email_sent_at: new Date().toISOString(), email_error: null }).catch(() => {});
    return { sent: true, id };
  } catch (e) {
    const msg = (e as Error)?.message ?? String(e);
    console.error("[paid-fulfill] welcome email failed", key, msg);
    await updateFulfillment(db, key, { email_error: msg.slice(0, 300) }).catch(() => {});
    return { sent: false, error: msg };
  }
}

// ---- Refunds and disputes (2026-11-24) -------------------------------------------------------
export type ReversalKind = "refund" | "dispute_open" | "dispute_won" | "dispute_lost";
export type Reversal = {
  kind: ReversalKind; ref: string; chargeId: string | null; paymentIntentId: string | null;
  customerId: string | null; disputeId: string | null;
};

/**
 * Maps a Stripe charge/dispute event to what it means for access.
 * Full refund -> revoke. Dispute opened -> suspend. Dispute won (or inquiry closed) -> restore. Dispute lost -> revoke.
 * Partial refunds and other dispute updates return null (no access change).
 */
export function reversalFromEvent(event: any): Reversal | null {
  const o = event?.data?.object ?? {};
  if (event?.type === "charge.refunded") {
    const full = o.refunded === true || (typeof o.amount === "number" && o.amount_refunded >= o.amount);
    if (!full) return null;
    return { kind: "refund", ref: o.id, chargeId: o.id, paymentIntentId: idOf(o.payment_intent), customerId: idOf(o.customer), disputeId: null };
  }
  if (event?.type === "charge.dispute.created" || event?.type === "charge.dispute.closed") {
    const kind: ReversalKind | null = event.type === "charge.dispute.created" ? "dispute_open"
      : ["won", "warning_closed"].includes(o.status) ? "dispute_won" : o.status === "lost" ? "dispute_lost" : null;
    if (!kind) return null;
    return { kind, ref: o.id, chargeId: idOf(o.charge), paymentIntentId: idOf(o.payment_intent), customerId: idOf(o.customer), disputeId: o.id };
  }
  return null;
}

/** Disputes don't carry the customer; read it from the charge (Stripe API) when needed. */
export async function reversalCustomer(rev: Reversal, stripeKey: string | undefined): Promise<string | null> {
  if (rev.customerId || !rev.chargeId || !stripeKey) return rev.customerId;
  try {
    const r = await fetch(`https://api.stripe.com/v1/charges/${rev.chargeId}`, {
      headers: { Authorization: `Bearer ${stripeKey}` }, signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) return null;
    const c = await r.json();
    rev.customerId = idOf(c.customer);
    rev.paymentIntentId = rev.paymentIntentId ?? idOf(c.payment_intent);
    return rev.customerId;
  } catch { return null; }
}

/** Access status each reversal sets. */
export const reversalStatus: Record<ReversalKind, string> = {
  refund: "refunded", dispute_open: "suspended", dispute_won: "active", dispute_lost: "revoked",
};
