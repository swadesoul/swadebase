# GhostRep Master Site Bible

Version 0.1 — November 10, 2026 (America/Chicago). Created by Claude (claude.ai session) at Swade's request. Prototype release.

## 1. Identity, aliases, canonical domain, owner
- **Canonical project:** GhostRep (working name; Swade may rename). Aliases: player form analyzer, sports motion coach, "star model" app.
- **Domain:** https://ghostrep.live (canonical, live 2026-11-10) and https://www.ghostrep.live; also https://ghostrep.swadebase.cloud (same app).
- **Owner:** Swade Soul (Harold Whaley Jr.). Legal entity to be confirmed by the founder before any commercial launch.
- **PRD (canonical product spec):** Claude Docs "GhostRep — PRD & Basketball Prototype Scope", https://claude.ai/artifact/9eP1YqyAqaDcTvTC12JRw9

## 2. Purpose, users, outcomes
A coach films their own star player (with consent) making shots; GhostRep averages those makes into a **Model Profile** and compares every teammate's shot against it — from a clip or live from the phone camera — giving a Form Match %, the top three fixes with drills, and a ghost-skeleton replay. Celebrity/pro footage is deliberately NOT used (YouTube terms, league copyright, name-and-likeness rights). Licensed pro models (Real ABA League first) are a later phase. Basketball jump shot first; multisport later on the same engine.

## 3. Features and limits (evidence state)
| Feature | State |
|---|---|
| Live camera: skeleton overlay, rep detection, spoken top cue after each shot, front/back flip | LIVE PROBE PASSED (see §12) |
| Clip upload/record (iPhone/iPad Safari file picker with camera), auto shot detection, multi-shot clips | LIVE PROBE PASSED in Chromium; native Safari UNVERIFIED |
| Star Model builder with consent gate (player + guardian if under 18, coach name, timestamp) | LIVE PROBE PASSED |
| Compare: Form Match %, rhythm match (DTW), 11-metric table, top 3 fixes + drills, Made/Missed tag | LIVE PROBE PASSED |
| Ghost replay (model skeleton aligned at load/release, scaled to the player, mirrored for opposite hand) | LIVE PROBE PASSED (screenshot) |
| Models export/import as JSON; "mark as style" per metric | SOURCE VERIFIED |
| Installable PWA (manifest + service worker) | SOURCE VERIFIED |
| Accounts, teams, cloud sync, admin area (Site Standard v1), payments | PLANNED (phase 2) |
| Automatic make/miss (ball + rim tracking), other shot types, other sports | PLANNED |

Accuracy limit: single-camera 2D pose. Side view required for reliable angles; elbow-under-ball reads best from the front.

## 4. Customer journeys
A: Coach builds a star model (Models → New → consent → add ≥3 made-shot clips, 5+ recommended → Save). B: Compare a teammate (Analyze → model → film/upload). C: Live training (Live → model → Start camera; device voice speaks one cue per rep).

## 5. Source, hosting, deployment
- Source: `/opt/ghostrep/src` on the swadesoul VPS (2.25.74.73). Tests: `/opt/ghostrep/test` (`node test/analysis.test.mjs`, `node test/e2e.mjs <clips dir>`). Not yet in GitHub — next step: push to a private `swadesoul/ghostrep` repo (rule 3).
- Served static by nginx from `/var/www/ghostrep` (rsync of src). Config `/etc/nginx/sites-available/ghostrep.swadebase.cloud`, Let's Encrypt cert via certbot, HTTP→HTTPS redirect.
- Pose engine: MediaPipe Tasks Vision 1.2.2 (Apache-2.0) self-hosted under `/vendor` — `vision_bundle.mjs`, wasm, `pose_landmarker_lite.task` (live) and `pose_landmarker_full.task` (clips). No third-party calls at runtime.
- Files: `index.html`, `styles.css`, `app.js` (UI, camera, storage, replay), `analysis.js` (pure engine: rep detection, phases, metrics, profile, compare, ghost alignment), `sw.js`, `manifest.webmanifest`, icons.

## 6. Data
All on the device (IndexedDB `ghostrep`: stores `models`, `sessions`; memory fallback). Video never uploaded. A model keeps metrics, angle curves and a short skeleton trace per make. Phase 2: SWADEBASE schema (teams, players, models, sessions — metrics only) and optional coach-controlled video to B2 `swadesoul/ghostrep/...`.

## 7. Auth and roles
None in the prototype (no accounts, nothing server-side to protect). Phase 2 must add SWADEBASE sign-in, team roles, Harold as super admin with founder exemption (rules 15, 21) and Google sign-in redirect allowlist entry.

## 8. Dependencies / reuse check
Reuse check done Nov 10: no existing pose/motion-analysis capability in SWADEBASE Bibles (only a MediaPipe face landmarker in the character factory). Build is the verified gap. Voice cues use device speech for now; production should use SWADEBASE Voice Studio. The character factory (Blender + mannequin) was reused to render synthetic test shots.

## 9. Storage
No server storage beyond static files. Test renders under `/opt/ghostrep/test/render` (temporary; safe to delete).

## 10. Pricing
Proposed only (see PRD): Player Free, Player Pro $7.99/mo, Team $29/mo, Program $99/mo, Pro Model Pack $4.99. Nothing implemented. Founder exemption required when billing exists. Running cost ~$0 (analysis on the phone).

## 11. Jobs and monitoring
None. Add to Watchtower monitoring (TODO).

## 12. Verification
(Filled in below by the release check.)

## 13. Backup, recovery, rollback
- Remove the site: `rm /etc/nginx/sites-enabled/ghostrep.swadebase.cloud && nginx -t && systemctl reload nginx`.
- Roll back files: re-rsync a previous copy of `/opt/ghostrep/src` to `/var/www/ghostrep`.
- Pre-cert nginx config backup: `/opt/swadebase/backups/ghostrep-nginx-pre-cert-*.conf`.

## 14. History
- 2026-11-10 v0.1 — Claude: PRD written, prototype built, deployed to ghostrep.swadebase.cloud, deploy lock taken/released.
- 2026-11-10 — Claude, founder-requested (explicit override of the no-new-domains policy for this domain): registered **ghostrep.live** at Namecheap via the existing API credentials, 1 year, paid from account balance $3.18 (1-yr $2.98 + $0.20 ICANN; renews at $41.48/yr), WHOIS privacy on. Order 219156092, transaction 266028160, domain ID 109414858. Receipt /opt/ghostrep/ops/ghostrep-live-receipt.json. Balance after: $22.70. DNS NOT yet pointed at SWADEBASE (still Namecheap defaults); script ready at /opt/ghostrep/ops/nc_dns.py (backs up hosts, sets @ and www A → 2.25.74.73), awaiting founder go-ahead. Then: nginx server_name + certbot for ghostrep.live/www.
- 2026-11-11 00:49 UTC — Claude, founder-approved: ghostrep.live DNS pointed via Namecheap API (@ and www A → 2.25.74.73, TTL 300; prior parking records backed up in /opt/ghostrep/ops/ghostrep-live-dns-before-*.json). nginx `/etc/nginx/sites-available/ghostrep.live` serves /var/www/ghostrep; Let's Encrypt cert (ghostrep.live + www, expires 2027-02-08, auto-renew via certbot) with HTTP→HTTPS redirect. Verified: both hosts 200 over valid TLS, http 301 → https, engine files served. Rollback: remove sites-enabled/ghostrep.live, reload nginx; restore DNS from the JSON backup.
- 2026-11-11 01:40 UTC — Claude, founder-requested: partner inbox **partners@ghostrep.live** on self-hosted Mailcow (domain ghostrep.live added, DKIM selector `dkim`, mailbox quota 2 GB, force password change on first login; credentials root-only at /root/ghostrep-partners-mailbox.txt). Namecheap DNS set (EmailType MX): MX 10 mail.swadesoul.com, SPF ip4:2.25.74.73, DMARC p=none, DKIM TXT, autodiscover/autoconfig CNAME → mail.swadesoul.com; @/www A kept. Local SMTP RCPT check 250 OK. Prior hosts backed up in /opt/ghostrep/ops/ghostrep-live-dns-before-mail-*.json. Mail client: IMAP mail.swadesoul.com 993 SSL/TLS, SMTP 587 STARTTLS, full address as username.

### 2026-11-11 — Landing, film, admin, reports (claude-ghostrep-admin)
- **Layout:** landing at `/` (source `/opt/ghostrep/site/`), app at `/app/` (source `/opt/ghostrep/src/`), `/auth/` sign-in, `/admin/` admin area, `/report/?t=` public report page. Deploy: `/opt/ghostrep/ops/deploy_site.sh` (backs up first). Root `/sw.js` unregisters the old root service worker.
- **Film:** `/media/ghostrep-film.mp4` (87 s, HyperFrames comp `/opt/ghostrep/video/comp/`, VO Kokoro am_onyx, Higgsfield stills/clips/music). Opens once on first visit (Skip intro), replayable from nav/hero and from the app header.
- **Backend:** one edge function `ghostrep` (`/opt/ghostrep/functions/ghostrep/index.ts` → `/opt/swadebase/docker/volumes/functions/ghostrep/`), POST `{action}` at `https://swadebase.cloud/functions/v1/ghostrep`. Server-side SQL only; ghostrep tables have forced RLS with no client grants. Founder allowlist `swadesoul@gmail.com` = super admin (in code, not in a table).
- **Schema:** migrations `/opt/ghostrep/db/001–004`: profiles, admins (admin|support|billing|viewer), entitlements (gift|trial|purchase; monthly|lifetime), view_as (30 min, reason, read-only), audit_log (append-only), admin_chat, brands + brand_members (white-label), report_links (expiring token), sessions.client_id/metrics/clip_path, models.client_id. Storage bucket `ghostrep-clips` (private, 15 MB, owner-folder upload policy).
- **Sign-in:** PKCE via `https://swadebase.cloud/sso/ghostrep/callback` → `https://ghostrep.live/auth/` (location added to `/etc/nginx/sites-enabled/swadebase.cloud`, which is a real file, not a symlink; backup `/opt/swadebase/backups/nginx-enabled-*`).
- **BLOCKER:** SWADEBASE sign-up is invite-only for all sites (`sssbrain.enforce_invite_only_signup` on auth.users). Only the founder can sign in to GhostRep until Swade decides how GhostRep invitees get through. Do NOT use sssbrain invite codes for GhostRep (they enqueue an SSS Brain tenant database).
- **Reports:** admin creates an expiring private link (1/7/30 days); page shows clip (if coach ticked the consent box when saving), fixes, trend, metrics; branded GhostRep or the coach's white-label brand. No server-sent email (rule 5): "Email it" opens the admin's own mail app.
- **Ops chat:** snapshot (counts + health probes, no emails) → Qwen Flash, else Claude Haiku 5.5; ledger-gated; $1/day cap. Qwen currently blocked (no recorded balance).
- **Tests:** `/opt/ghostrep/test/harness/run.sh` runs the real function code in one rolled-back transaction (58 checks, all pass; `--chat` adds one paid Haiku call). No test account can be created because of the invite gate — do not bypass it. Page checks: `/root/wk/gr_pages.mjs`, `/root/wk/gr_admin_ui.mjs` (stubbed data).
- **Not verified:** real Google sign-in round trip, clip recording on a real phone (iOS Safari MediaRecorder), super-admin UI with the real account. **Not built:** Stripe checkout, plan gating, server-sent report email, coach-side report sending, white-label partner sites, Watchtower entry, private repo push.
- **Rollback:** `/opt/swadebase/backups/ghostrep-site-20261111T112015Z` (site + nginx), `/var/www/ghostrep-old`.


### 2026-11-11 (later) — Waitlist, invites, launch switch, templates (claude-ghostrep-waitlist)
- **Owner direction:** launch January 1, 2027. Until then: waitlist hero; first 100 joiners get in at once; every member gets 5 invite credits (invite link `/?invite=CODE`), invitees get 5 too; on launch day everyone gets in.
- **Built:** migration `005_waitlist.sql` (`ghostrep.settings` launch_at/first_n/invite_credits, `ghostrep.waitlist`, `ghostrep.templates`, helper `ghostrep.signup_allowed(email)`). Edge function public actions `waitlist.stats`, `waitlist.join`, `templates.list/get`; admin `admin.waitlist`, `admin.waitlist.set` (approve/remove/credits), `admin.settings.set` (super admin). Join is rate-limited to 20 per connection per day. Landing hero = waitlist form; `/app/` redirects signed-out visitors to `/?join=1` until launch_at; account page shows the invite link; admin tab "Waitlist & invites".
- **STILL BLOCKED:** the shared gate `sssbrain.enforce_invite_only_signup` was NOT changed (an automated safety check refused it as a security change). The one-line change it needs: an early `IF ghostrep.signup_allowed(NEW.email) THEN RETURN NEW; END IF;` before the invite-code check. Until applied, approved people see "spot saved" but get no sign-in link. Apply only on Swade's explicit OK; back up the function first.
- **Launch day:** GhostRep opens itself at `launch_at` (join auto-approves, app gate lifts). No change to other sites is needed.
- **Templates:** pipeline `/opt/ghostrep/templates/run_build.sh <spec.json>` (headless app engine, publishes to `ghostrep.templates`), shown in the app's Models tab as "Starter templates". YouTube refuses downloads from this server (bot check) and Wikimedia Commons had no clean single-shooter side-view footage (only game clips). Real templates need footage with the shooter's permission.
- **Tests:** harness covers waitlist/invites (first-N, cascade, credits spent, removed, launch switch); all pass.
- **Not built:** Stripe checkout + plan locking (shared adapter ready at `/opt/swadebase-adapters`, `ops/stripe-site.mjs add ghostrep`; needs owner answers on founding-member pricing and billing start), server-sent report email, coach-side reports, white-label partner sites.


### 2026-11-11 (12:10 UTC) — Owner decisions applied
- **Sign-up gate APPLIED on Swade's explicit OK:** `sssbrain.enforce_invite_only_signup` now returns early when `ghostrep.signup_allowed(NEW.email)` (approved waitlist, GhostRep admin, or live entitlement). Source `/opt/ghostrep/db/006_signup_gate.sql`; previous definition `/opt/swadebase/backups/enforce_invite_only_signup-20261111T120510Z.sql` (restore = run that file). Verified in a rolled-back transaction: approved email can create an account, waiting email is refused.
- **Pricing rule (owner):** the first 100 (founding members) are FREE until launch (auto entitlement: monthly, source gift, expires `launch_at`, note "Founding member"). People who come in on an invite get access but PAY. Checkout goes live **December 1, 2026** (`ghostrep.settings.billing_at`). Launch January 1, 2027.
- **Open with owner:** does founding-member free access end January 1 or continue; what invited members can use between now and December 1 (today: full access, nothing is locked).
- **Screen reading:** desktop model builder has "Read a video playing on this screen" (tab capture, 45 s max, analysed in the browser, video not saved). Super admin can "Publish as a starter template" from a saved model (`admin.templates.set`, needs name + source link + permission/license). No template is published yet.
- **Caution:** a headless template build on this server hit "fork: Resource temporarily unavailable" (process limit) while two builds overlapped. Run at most one `/opt/ghostrep/templates/run_build.sh` at a time, and check `ps` first.
- **Next build:** Stripe checkout through the shared adapter (`/opt/swadebase-adapters`, `node ops/stripe-site.mjs add ghostrep "GhostRep" --hosts ghostrep.live`) and plan locking, due before December 1.

### 2026-11-11 (12:20 UTC) — Payment rule + exemptions
- **Owner rule:** everybody pays, except the super admin (always exempt) and anyone the super admin exempts for a set time: week, month, 6 months, season, year, forever.
- **Built:** migration `007_exempt.sql` (entitlements.source adds `exempt`); `admin.grant {kind:'exempt', term}` is super-admin only (permission `grant.exempt`); terms week=7d, month=30d, six_months=182d, season=150d (assumed: one basketball season), year=365d, forever=no expiry. Admin tab renamed "Exemptions & gifts". Exempt emails may sign up. Revocable, logged.
- Founding members (first 100) keep the automatic free plan until launch day, then pay unless exempted. Invited members pay once checkout opens December 1.


### 2026-11-11 (12:35 UTC) — Checkout, data pages, Android app (claude-ghostrep-billing)
- **Stripe:** site `ghostrep` registered on the shared Swade Stripe adapter (live, Swadesoul gateway). Secrets: `/opt/swade-secrets/stripe-sites/ghostrep.env` and `ghostrep.server_secrets` (row `swade_stripe`, server-only). Migration `008_billing.sql` (stripe ids on entitlements, `billing_events` dedupe log).
- **Checkout:** `billing.checkout {plan: monthly|lifetime}` ($10/mo subscription, $500 one-time) via inline prices; closed until `settings.billing_at` = 2026-12-01 06:00 UTC; refuses founder, exempt and already-active. `billing.portal` for paying members. Success/cancel return to `/auth/`.
- **Webhook:** new edge fn `ghostrep-stripe` (`index.ts` + `handler.ts`): verifies adapter HMAC, grants `purchase` entitlements on checkout.session.completed (metadata.app = ghostrep), renews on invoice.paid (+3 day grace), ends on subscription canceled/deleted. Refunds are logged only; an admin revokes. Live signed-event test `/opt/ghostrep/test/billing_webhook_test.py` (cleans up after itself).
- **Paywall:** `src/account.js` shows "Choose your plan" after billing_at to signed-in members whose plan is Free. Inside the Android app (referrer `android-app://live.ghostrep.app`) prices and checkout are hidden until Play external-offers enrollment.
- **Data deletion:** `account.delete` (type DELETE) removes models, compares, clips, report links, team membership, profile; anonymises the waitlist row; keeps payment records and the shared SWADEBASE sign-in. Page `/delete-account/`. Plain-language data page `/data/`.
- **Legal pages:** ghostrep.live and ghostrep.swadebase.cloud now include `/etc/nginx/snippets/swade-legal.conf` (shared `/privacy`, `/terms`). Backups `/opt/swadebase/backups/nginx-ghostrep.*-*`.
- **Android (Trusted Web Activity):** package `live.ghostrep.app`, minSdk 24, target 36. Toolchain: JDK 17, `/opt/android-sdk` (+ `tools` symlink for Bubblewrap), Bubblewrap CLI 1.24.1. Project `/opt/ghostrep/android/project` (twa-manifest.json), build `/opt/ghostrep/android/build.sh`, outputs `/opt/ghostrep/android/out/`. Upload key `/opt/swade-secrets/ghostrep-android/upload.jks` + `upload.env` (root 600) — BACK THIS UP OFF-SERVER; SHA-256 FA:AE:15:10:…:D1:11:D7. `/.well-known/assetlinks.json` has the upload-key fingerprint; Play's app-signing fingerprint must be ADDED after the first upload. Web manifest for the app: `/manifest.webmanifest` (start `/app/?source=android`, maskable icon `/app/icon-maskable-512.png`).
- **Store kit:** `/opt/ghostrep/android/store/` (feature graphic, 4 phone screenshots, `PLAY_LISTING.md` incl. draft Data safety answers).
- **Play account:** personal account created after Nov 2023 → closed test with ≥12 testers for 14 consecutive days before production.
- **Builds on this server:** Gradle takes ~4 minutes; do not run alongside headless browser jobs (server hit its process limit once today).
- **Temporary download folder** (remove once uploaded to Play): /var/www/ghostrep/dl/f5c59761ad4993abf5402d8b054cdcb2/ — .aab, .apk, store graphics, listing. Build 1.0.0 (code 1) verified: versionName 1.0.0, signer SHA-256 matches upload key.


### 2026-11-11 (22:45 UTC) — White-label partner portal, Stripe Connect, share cards (claude-ghostrep-partners)
- **First real founding member** joined and signed in at 22:20 UTC (waitlist → approved first100 → confirmed). Sign-up gate verified end to end with a real person. Founder Google sign-in verified on iPad at 21:40 UTC.
- **Partners (migration 009):** `ghostrep.partners` (owner_email, status, connect_ref, connect_ready); `ghostrep.brands` gains partner_id, slug, tagline, support_email, monthly_cents, lifetime_cents; setting `partner_fee_bps` = 0 (GhostRep takes no cut of partner sales until Swade sets one); public bucket `ghostrep-brand` (PNG/JPG/WebP ≤500 KB, no SVG). `signup_allowed()` now also admits partner owners and coaches in an active partner's program.
- **Partner portal `/partner/`:** partner creates a program per client (name, web name → `ghostrep.live/p/<slug>`, tagline, colour, support email, own monthly/one-time prices, logo upload with live preview), adds/removes that client's coaches, connects payouts with **Stripe Connect Express** through the shared adapter (no API keys pasted; external_ref `partner-<id>`), checks status, opens their Stripe dashboard. Step-by-step Connect instructions are on the page.
- **Program page `/p/<slug>`** (nginx `location ^~ /p/`): branded landing for the client; hidden when the partner is paused.
- **Branding in the app:** a coach in a program sees its name, logo, tagline and colour (account.js `applyBrand`); reports and share cards use the brand.
- **Checkout for program members:** charged at the program's prices, paid to the partner's connected account (`connected_ref`), plus `application_fee_bps` if set; blocked with a clear message until the partner's Stripe is ready and prices are set.
- **Admin:** new "Partners" tab — super admin adds partners (company + owner email), pauses/reactivates; all actions audited.
- **Share my grade (app, Analyze result):** 1080×1350 branded card (grade A+…D from match %, match, rhythm, next focus, ghost + player skeleton at release, brand logo/colour or GhostRep), captions mixed from score-band hooks + fix lines + closers + rotating hashtags (thousands of combinations, editable, Shuffle), link carries the member's invite code when they have credits, or the program page for white-label. Uses the phone's share sheet (image + caption); falls back to Save image + Copy caption. No player name on the card by default.
- **Tests:** harness covers partner permissions, slugs, logo upload (real bucket, cleaned up), coach poaching, paused partners, Connect gating, checkout gating — all pass. Visual checks of portal, program page and share card done with sample data. NOT tested live: a real Stripe Connect onboarding and a real connected payment.
- **2026-11-11 23:25 UTC:** Swade set GhostRep's cut of partner client payments to **3.5%** (settings.partner_fee_bps = 350), on top of the $3,000 setup + $250/yr license. Taken as a Stripe application fee from each partner sale (the client pays the partner's listed price).

## 2026-11-11 · Founding members, /partners page, collective credit (claude-ghostrep-founders)
- Migration 010: `ghostrep.founding_members` (email pk, card facts: name, title, organization, org_logo_url, photo_url, affiliations[], affiliation_logos[], bio, highlights[], accent, sort, published; member-written: rating 1-5, review <=700 chars, review_at; admin: review_hidden). Forced RLS, no client grants.
- Eligible to rate: approved first-100 waitlist members, or anyone with a card. Card facts are admin-entered; the rating and words are written only by the member (`founder.review`). Admins can hide a review, never edit it.
- Actions: public `founders.list` (published cards, no emails); member `founder.review {rating, review}`; `me` now returns `founding`; admin `admin.founders` (people.read, lists cards plus uncarded first-100) and `admin.founders.set` (waitlist.manage; image links must be /media/... or https).
- Seeded card: Aldis Presley, Owner, Southwest Warriors (ABA, 15 years; son of the late Ralph Presley, original owner in the ABA's early-2000s return; bowling champion). Assets: /media/founders/aldis.webp, southwest-warriors.webp, aba.png. Rating empty until he posts it.
- New page /partners/ (founding member cards with star rating + recommendation at the bottom of each, and the partner program incl. $3,000 setup + $250/yr and the 3.5% fee on client payments). Landing nav, doors and close CTA point to /partners/.
- Account page /auth/ shows the "Founding member rating" form to eligible members (/auth/#rate).
- Admin: new "Founding members" tab to add/edit cards, publish, hide reviews.
- Landing credit rewritten per Swade: no individual bio; "Built by leaders from professional basketball" with ABA / CBA / NBA backgrounds. Footer no longer says "by SWADE SOUL". The intro film still names Harold Whaley (video not changed).
- Harness: founder tests added; all pass. Backups: /opt/swadebase/backups/ghostrep-fn-*-prefounders.ts, ghostrep-index-*.html, ghostrep-auth-*.html, ghostrep-admin-*.js.


## Dedicated white-label page — 2026-11-12T00:28:47.188161+00:00 (ChatGPT)
- **SHIPPED:** https://ghostrep.live/white-label/ separates the commercial partner program and six expandable training lessons from the founding-member cards at /partners/. Source /opt/ghostrep/site/white-label/index.html, served from /var/www/ghostrep/white-label/index.html. Homepage navigation, business card and closing partner CTA, partners overview and partner portal link to the new page. Existing /partners/#program remains a short referral section; founder cards and rating fetch preserved.
- Preserves the recorded $3,000 setup + $250/year + 3.5% client-payment fee; Stripe fees additional. $49/$99/$199 resale examples are explicitly illustrative, not enforced prices or published customer plans. Includes license scope, separate reseller rights, service/customization guidance, capacity-by-agreement, cost example and application email link. Mailto opens the user's mail app; no message sent.
- Six public lessons contain practical exercises and expandable answers. This is informational training, not persisted completion, certification or automatic selling activation. No backend license caps, billing, payments, permission or schema changed. Actual partner Connect onboarding/payment remains unverified as previously recorded.
- Verification: all four changed public pages HTTPS 200; anchors resolve, six lessons present, unique IDs, exact 3.5% and first-year arithmetic checks passed; /partners founder-list fetch retained. Live desktop Chromium page, training anchor, first lesson and answer expansion verified. Native iPad Safari and narrow viewport not tested in this release.
- Deployment: four static HTML files copied atomically per file after backup, no nginx reload. Backup /opt/swadebase/backups/ghostrep-white-label-20261112T002712Z includes prior source/live copies and Bible. release.json records SHA-256 hashes. Existing GhostRep source still lacks a GitHub repository; this page does not claim source synchronization.
- Rollback: restore index.html, partners/index.html and partner/index.html from /opt/swadebase/backups/ghostrep-white-label-20261112T002712Z/source and /opt/swadebase/backups/ghostrep-white-label-20261112T002712Z/live to corresponding source/live paths, remove the new white-label/index.html from both trees, then verify HTTPS and navigation. No database rollback is needed.
