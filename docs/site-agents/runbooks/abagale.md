# Runbook: abagale.live ("Abigail")

**Status: Spec v1, 2026-10-24, not built.** This runbook uses the per-site template ([SPEC §15](../SPEC.md#15-runbooks-intake-and-one-pass)), filled in for the first money site. Items marked *(unverified)* were not checked. It contains no secret values; credentials are named only.
**Agent:** `site-abagale`. It is not created yet. Big Mamma sets it up and verifies it.
**Times:** UTC with CT, where CT = America/Chicago.

## 1. Identity and owners

| Item | Value |
|---|---|
| Site | abagale.live (+ www). Swade says "Abigail". The descriptor lists the alternates abagail.live and www.abagail.live *(DNS unverified)* |
| Slug / schema | `abagale` / `abagale` (604 tables) |
| Site agent | `site-abagale`, with override on abagale's own config and data (SPEC §2.2) |
| Shared component owners it depends on | Finance (Stripe), Big Mamma (auth, one-pass identity, B2, gateway, edge runtime, nginx, DNS, secrets, autoheal, Hostinger), CoS (email policy) |
| Migration state | `LIVE_PENDING_VERIFICATION` (cutover 2026-10-07 UTC; not fully certified) |

## 2. Hosting and topology

- **DNS / edge:** Cloudflare nameservers, proxied.
- **Web:** SWADEBASE host nginx `/etc/nginx/sites-enabled/abagale.live` serves the static SPA from `/var/www/abagale-app/current`. The registry's "Lovable/Hostinger/Vercel" platform value is stale.
- **Backend:** SWADEBASE gateway `https://swadebase.cloud/app/abagale/{rest,auth,storage,realtime,functions}/v1`. Functions `/app/abagale/functions/v1/X` map to `abg-X` in the shared edge runtime (~337 `abg-*` functions).
- **Auth:** shared `auth.users` (GoTrue + Google).
- **Media:** B2 (shared key), Mux.
- **Repo:** `swadesoul/abagale` (private). CI `pr-build.yml` is build-only (no deploy).

## 3. What is live (release tracking, SPEC §12.2)

| Field | Value |
|---|---|
| Live release | `releases/editor-pro-bc5138fd`, deployed Oct 11 22:23 UTC (Oct 11 5:23 PM CT) |
| Built from | `/root/abagale-build/repo`, branch `finish/abagale-swadebase-20261007`, commit `bc5138fd` |
| On GitHub? | **No.** The commit is not on GitHub (API: no commit found). 2 modified files: `Affiliates.tsx`, `Sponsorships.tsx` |
| GitHub `main` | `f837cd0` (Oct 18) |
| Deploy log | `DEPLOY_LOG.txt` stops at Oct 7, but 3+ later releases exist |
| First `site_releases` row | `status = untracked` → drift incident, score 19 (U0 R5 S5 D5 P4), raised to SEV3 by the drift floor (SPEC §12.2) |

**Action (needs Swade's OK for the push):**
1. Commit the 2 modified files on the build branch.
2. Push `finish/abagale-swadebase-20261007` to GitHub.
3. Open a PR into `main` to reconcile (not merged without review).
4. Record the release.

From then on, production releases must be pushed, clean commits.

## 4. Staging (SPEC §12.1, proposed)

- Web: `/var/www/abagale-app/staging/` → `swadebase.cloud/stage/abagale/`
- DB: `abagale_stage` schema (structure only, anonymised seed)
- Functions: `abg-stg-*`
- Payments: Stripe test mode
- Storage: `swadebase/staging/abagale/`
- Email and SMS: sink only

Not built.

## 5. Real health probe (the first job: health today is fake)

**Today:**
- `/api/health`, `/health` and `/healthz` return **200 with the SPA HTML**.
- `/status.json` is static ("operational", dated 2026-03-05).
- The `report-health` function always pushes "ok".
- The registry says ok as of Oct 4.
- `ecosystem_health_checks` holds only a mock row from Jul 15.
- The site guardian marks it "yellow" (`api_verified: false`).

**Probe v1** (`ecosystem_sites.health_probe`; run by the prober every 5 min):
1. `GET https://abagale.live/` returns 200, **and** the HTML references the asset hash of the live `site_releases` row (this catches wrong or empty releases).
2. `GET /app/abagale/rest/v1/` through the gateway answers (expected 200 or 401 JSON, **not** HTML).
3. A no-auth function ping: `abg-live-healthcheck` (strike model: 3 strikes = dead, 1–2 = degraded).
4. Latest results of `abg-validate-video-health`, `abg-network-roku-health`, `abg-hostinger-service-status` and `abg-connected-sites-status`, plus the `storage_health_checks` and `video_health_checks` tables.
5. Stripe webhook freshness: last row in `stripe_webhook_events`. That table is **0 rows today**, which means either no payments or webhooks not landing *(unverified; Finance to check Stripe)*.

**Result:**
- `ok`: all of the above pass.
- `degraded`: any of 3–5 fails.
- `down`: 1 or 2 fails.

`report-health` and `status.json` must stop claiming ok without a check. That is a code change and a deploy, so it is A3.

## 6. Dependencies (shared components)

`stripe-platform` (shared `STRIPE_SECRET_KEY`; `ABAGALE_STRIPE_WEBHOOK_SECRET`, `ABAGALE_CREDIT_WEBHOOK_SECRET`, `ABAGALE_KREW_WEBHOOK_SECRET`; names only), `swadebase-auth`, `onepass`, `b2-media`, `swade-connect`, `edge-runtime`, `kong`, `swadebase-db`, `web-nginx`, `dns-cloudflare`, `email-transactional`, `secrets-locker`, `autoheal`, `hostinger-platform`.

## 7. Paid services and OSS status (SPEC §10)

| Service | Used for | Monthly cost | OSS research status |
|---|---|---|---|
| Mux | Video streaming | *(unverified)* | Not started |
| ElevenLabs | Voice | *(unverified)* | Not started (check the existing ecosystem voice service) |
| Replicate | AI media | *(unverified)* | Not started (check the GPU controller) |
| Twilio | SMS/voice | *(unverified)* | Not started |
| Restream | Multistreaming | *(unverified)* | Not started |
| Printify | Merch | *(unverified)* | Not started (a fulfilment service; likely no OSS swap) |
| Suno | Music generation | *(unverified)* | Not started |
| Stripe | Payments | Fees | Tracked, not a swap target |
| B2, Resend | Storage, email | Shared | Owned by Big Mamma and CoS |

Each finding arrives as a comparison first. Swade approves any switch.

## 8. Stack for security scouting (SPEC §11)

- Front end: Vite/React SPA (lockfile in the repo).
- Edge: Deno edge functions (`abg-*`).
- Platform: Supabase images on SWADEBASE (Postgres, GoTrue, Kong, storage, imgproxy, meta), nginx and OpenSSL on SWADEBASE, Cloudflare.
- Extra code in the repo: `external-services/` (health-guardian, hostinger-autopilot, prism-distributor) and `hostinger-proxy/swadesoul-world-proxy` (Hostinger and PHP surface).

**Known findings:**
- 2 unrevoked SWADE Connect keys with `*` scope (S = 5).
- The live build is not traceable to GitHub.

## 9. Self-heal envelope (SPEC §6.1)

**Allowed now, ping after:**
- Retry idempotent failed jobs (3 attempts).
- Live-source degraded or dead marking using the existing strike logic.
- Re-run the health and validation functions.
- Clear its own stuck queue statuses (no deletes).

**Not allowed:**
- **Container restarts.** abagale has no dedicated container: its web is static nginx and its functions run in the shared edge runtime, so it has no allowlisted restarts until it gets its own service.
- **Release rollback.** It is pending O-03. If approved, the target is the previous release in `/var/www/abagale-app/releases/`.

## 10. Pause procedure (needs Swade's approval)

Options, mildest first:
1. **Disable checkout:** a feature flag *(flag to identify; unverified)*.
2. **Maintenance page:** an nginx `abagale.live` maintenance include. This is a Big Mamma change.
3. **Cloudflare "Under attack" or a block rule** (DNS/WAF = Swade).

To resume, reverse the step, then run the probe v1 until it is green.

## 11. Common incidents and fixes (open now)

| Incident | Severity (existing) | Status | Notes |
|---|---|---|---|
| `INC-20261009-ABAGALE-DIRECTOR-BOOT` | critical | partially_verified | Re-score on the v1 rubric at start |
| `INC-…-SCOUT-SILENT-SOURCE` | high | open | Live-source silence; strike logic applies |
| `INC-…-TSC-HEAP` | medium | open | TypeScript build heap |

Other signals: `error_skill_events` has 329 rows (triage source).

## 12. Client questions, intake and one-pass

- **Tickets:** `support_tickets` has 1 row (resolved). Replies are always drafts.
- **Profiles:** 128.
- **Subscriptions:** 1 (cancelled).
- **Intake flavour:** from `abagale.client_intake_forms` (2 rows), mapped onto the one-pass skeleton.
- **One-pass identity:** `public.onepass_identities` is linked by `swade_user_id`. abagale also has its own `onepass_*` wallet, plan and role tables.

## 13. Revenue and costs (SPEC §9)

- `payment_orders` has 0 rows, and so do `stripe_webhook_events` and `stripe_customer_map`.
- Revenue tables include `revenue_events`, `voice_revenue`, `sponsor_spin_revenue`, `krew_revenue_log` and `arie_revenue_*`. Their counts were not read.
- AI cost: `ai_usage_logs`.
- Real revenue state: *unverified* until Finance supplies the per-site feed.

## 14. Known findings (kept from the v0.1 investigation)

1. **Health checks are fake** (§5).
2. **The live build is not on GitHub** (§3).
3. **`*`-scoped keys:** 2 for abagale (attobahn and ssworld also have them). Narrow or rotate them before the agent goes live (keys gate, O-10).
4. The registry platform value is stale; DEPLOY_LOG is stale.

## 15. Open items for this site

- Approve the push and reconcile of the live branch.
- Approve fixing `report-health` and `status.json` (code and deploy).
- Narrow the `*` keys.
- Confirm abagail.live DNS.
- Finance: check Stripe for abagale payments and webhooks.
- Confirm or add a checkout-disable flag for the pause procedure.
