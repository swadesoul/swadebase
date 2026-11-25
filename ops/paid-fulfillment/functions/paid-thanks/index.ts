// Post-checkout landing page for Payment Links (after_completion redirect), 2026-11-24.
// GET /functions/v1/paid-thanks?app=<resinglab|videosaywhat|abagale|blacktales>&session_id={CHECKOUT_SESSION_ID}
// Shows what was bought and where the access email went. Read-only; fulfillment happens in the webhooks.
const APPS: Record<string, { brand: string; url: string; color: string }> = {
  resinglab: { brand: "ReSing Lab", url: "https://resinglab.com/auth", color: "#7c3aed" },
  videosaywhat: { brand: "VideoSayWhat", url: "https://videosaywhat.com/auth", color: "#2563eb" },
  abagale: { brand: "Abagale TV", url: "https://abagale.live/auth", color: "#dc2626" },
  blacktales: { brand: "Black Tales", url: "https://blacktales.online/auth", color: "#b45309" },
};
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const mask = (e: string) => e.replace(/^(.)(.*)(@.*)$/, (_m, a, b, c) => a + "*".repeat(Math.min(b.length, 6)) + c);

Deno.serve(async (req) => {
  const u = new URL(req.url);
  const app = APPS[u.searchParams.get("app") ?? ""] ?? { brand: "Swade", url: "https://swadesoul.com", color: "#111" };
  const sid = u.searchParams.get("session_id") ?? "";
  let product = "your purchase", email = "";
  if (/^cs_(live|test)_[A-Za-z0-9]+$/.test(sid)) {
    try {
      const r = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sid}?expand[]=line_items`, {
        headers: { Authorization: `Bearer ${Deno.env.get("STRIPE_SECRET_KEY")}` }, signal: AbortSignal.timeout(8000),
      });
      if (r.ok) {
        const s = await r.json();
        product = s.line_items?.data?.[0]?.description ?? product;
        email = s.customer_details?.email ?? "";
      }
    } catch { /* show the generic page */ }
  }
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Thank you - ${esc(app.brand)}</title><meta name="robots" content="noindex"></head>
<body style="font-family:system-ui,Arial,sans-serif;background:#0b0b0f;color:#f5f5f5;margin:0;display:flex;min-height:100vh;align-items:center;justify-content:center">
<main style="max-width:520px;padding:32px;text-align:center">
<h1 style="margin:0 0 12px">Thank you!</h1>
<p style="font-size:18px">Your payment for <strong>${esc(product)}</strong> went through and it's being set up now.</p>
<p>We're emailing ${email ? `<strong>${esc(mask(email))}</strong>` : "you"} what you bought and how to get in. It usually arrives within a few minutes; check spam if you don't see it.</p>
<p style="margin-top:28px"><a href="${app.url}" style="background:${app.color};color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none">Go to ${esc(app.brand)}</a></p>
<p style="color:#9ca3af;font-size:12px;margin-top:28px">Digital product. All sales are final; no refunds.</p>
</main></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
});
