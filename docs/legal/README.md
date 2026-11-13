# Swade Soul legal package (Oct 30, 2026 — Claude, for Swade)

Party: **Swade Soul Enterprise LLC** (Wyoming) — confirmed by Swade as the ONLY registered entity. "Swadez LLC", "SWADEZ LLC" (except ABAGALE), "SWADE Soul Holdings LLC" and "Swade Soul Inc" on live sites are wrong and must be replaced. ABAGALE (50-50 company) is EXCLUDED: do not change its terms without its partner.

Master copy (shared doc, editable, for attorney review): https://claude.ai/artifact/TaarjwF5kygDLyVQsasRkq
Contents: Attorney review notes · Terms of Service (Schedule A = 16 sites) · Product Terms B1–B8 · Privacy Policy (voice/biometric §4 per Tex. Bus. & Com. Code §503.001).

## Status
- Drafted and checked; attorney = yes (Swade has one). Governing law drafted as Wyoming, venue [Laramie County, WY] (attorney to confirm; Texas option noted).
- PUBLISH BLOCKED ON: (1) registered agent mailing address (Wyoming SOS lookup is captcha-gated; Swade to provide), (2) legal@ inbox: swadesoul.com MX = Amazon SES inbound (inbound-smtp.us-east-1.amazonaws.com), NOT Mailcow, so legal@swadesoul.com cannot be created on Mailcow without changing that route. Swade chose "new legal@ inbox"; decide domain/route first.
- Must be true before publish: voice consent records (B1.2), paid-play announcement for new rotation plans (B2.3), voice-data deletion path (Privacy §4), per-site analytics/cookie check.
- Live-site audit (headless Chrome, Oct 30): no terms on themaestroradio.com, oathloom.com, theleaguesound.com; brainiak.live /terms = homepage fallback; wrong entities on videosaywhat.com, teachvirt.courses, swadesoul.com; mixed law (Texas on resinglab.com, "United States" on pinhub.live).

## Publish plan
1. Server-hosted sites (nginx on this VPS: themaestroradio.com, brainiak.live, oathloom.com, blacktales.online, swadesoul.world, yourown.delivery): static /terms, /privacy, /product-terms from one folder /var/www/swade-legal (exact-match nginx locations before the SPA fallback; deploy lock rule 20).
2. Repo/Lovable/Coolify sites (resinglab, videosaywhat, swadesoul.com, theleaguesound, mydistribution, teachvirt, pinhub, getsideload, sssbrain): PR per repo replacing their terms pages.
3. Clickwrap checkbox at signup/checkout + acceptance log (version, time, user) on every site.
4. Register DMCA designated agent with the U.S. Copyright Office (renew every 3 years).
5. Move On Your Terms (Lovable project 4f9a618c-184c-455e-a93c-56e6119e69c1) onto SWADEBASE as the legal engine: Lovable Cloud DB -> swadebase.cloud schema; Lovable AI Gateway Gemini -> OmniRoute combo/swade-cheap; its Stripe -> Swade Stripe adapter; fix its prompts (defaults to Delaware law, lists Lovable/Gemini as processors); known open bug: audit_logs had no INSERT policy (see its .lovable/plan.md).

## UPDATE Oct 30, 2026 ~22:50 CT — LIVE on 6 server-hosted sites (Swade: "push when done")
- Registered agent address (Swade): 30 N Gould St, Ste R, Sheridan, WY 82801. Venue set to Sheridan County, Wyoming (attorney to confirm).
- Legal inbox: mailbox legal@brainiak.live on Mailcow (credentials /opt/swade-secrets/legal-mailbox.env, IMAP mail.swadesoul.com:993, SMTP :587), aliases privacy@brainiak.live and copyright@brainiak.live -> legal@. Delivery tested OK. swadesoul.com left untouched (MX = Amazon SES inbound; Swade unsure what uses it).
- Sources: /opt/swadebase/docs/legal/src/*.md; build: .venv/bin/python build.py -> /var/www/swade-legal/{terms,privacy,product-terms}.html.
- Served via /etc/nginx/snippets/swade-legal.conf (exact-match /terms /privacy /product-terms; /terms-of-service and /privacy-policy 301) included in the HTTPS server block of: themaestroradio.com, brainiak.live, oathloom.com, blacktales.online, swadesoul.world, yourown.delivery (wire_nginx.py). Verified 200 + "Swade Soul Enterprise LLC" on all 18 URLs; home pages unchanged.
- Rollback: copy files from /opt/swadebase/backups/swade-legal-nginx-20261031T034351Z/ back over /etc/nginx/sites-enabled/ targets (they are real files resolved from the symlinks), nginx -t, reload.
- NEXT: the 10 repo/Lovable/Coolify sites (sssbrain, resinglab, videosaywhat, swadesoul.com, theleaguesound, getsideload, mydistribution, teachvirt, pinhub, swadebase.cloud) need PRs; clickwrap + footer links; DMCA agent registration at copyright.gov (agent: Swade Soul Enterprise LLC, address above, copyright@brainiak.live); On Your Terms migration.

## UPDATE Oct 30, 2026 ~23:00 CT — 9 of 16 sites live
- swadebase.cloud: same nginx snippet (wire_one.py; backup /opt/swadebase/backups/swade-legal-nginx-swadebase-*). Public pages only; rest of the site stays login-protected.
- sssbrain.live + getsideload.com (swadebase-2): Traefik dynamic file /data/coolify/proxy/dynamic/swade-legal.yaml routes /terms /privacy /product-terms (priority 1000) to https://swadebase.cloud (passHostHeader false); /terms-of-service and /privacy-policy 301. Apps untouched. Roll back = delete that file.
- Kept product-specific terms: added Product Terms B9 (SSS Brain hosted plan / self-hosted license / IP retained / BYO API keys / white-label by written agreement) and B10 (Get Sideloaded directory, app checker, listing rules, conversions). Master §5 refunds now honor "the refund policy shown at checkout" (YourOwn.delivery promised this).
- Remaining: Lovable-hosted resinglab.com, videosaywhat.com, swadesoul.com, theleaguesound.com, mydistribution.music, teachvirt.courses; Cloudflare-hosted pinhub.live. Before replacing each, read its current terms and carry product-specific clauses into a Product Term.
