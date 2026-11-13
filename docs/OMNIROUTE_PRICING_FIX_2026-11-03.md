# OmniRoute pricing fix + Oathloom test build — 2026-11-03 (evening, CT)

Approved by Swade Nov 3 ~7:36 PM CT (t794s3279). Executor: Grok Bot.

## Root cause
OmniRoute v3.8.52 (SB2 2.25.96.150) re-costs every call in an app key's usage window against the
current /api/pricing table. If ANY model used in that window has no price, a USD-capped key fails
closed for the whole window (log: `[apiKeyUsageLimits] no pricing found for X ... fails closed`).
Oathloom sees that as HTTP 429 -> "Rate limit reached. Try again shortly."
- `anthropic/claude-haiku-4-5` (the id `claude-haiku-4.5` routes to) was unpriced -> that log line came from the **maestro** key.
- The **oathloom** key (602dfc02-…) was actually blocked by one unpriced `qwen-cloud/qwen3.8-max` call
  (Oct 30 16:31Z, design stage; oathloom-build DESIGN_MODELS default = qwen3.8-max, qwen3.7-max, deepseek-v4-pro).

## Prices set (USD per 1M tokens), on BOTH omniroute-primary (:20128) and omniroute-standby (:20138)
| provider / model | input | output | cached | reasoning | cache_creation | basis |
|---|---|---|---|---|---|---|
| anthropic / claude-haiku-4-5 | 1 | 5 | 0.1 | 7.5 | 1.25 | identical to existing claude-haiku-4.5 and -20251001 entries |
| qwen-cloud / qwen3.8-max | 2 | 6 | 0.25 | 6 | 2.5 | Alibaba Model Studio intl list price (higher regional rate) |
| qwen-cloud / qwen3.7-max | 2.5 | 7.5 | 0.5 | 7.5 | 3.125 | same source |
No caps changed (oathloom still $5/day, $25/week). No other keys touched.
Scripts: /opt/omniroute/ops/setup_haiku_price.py, setup_qwen_max_price.py (+ read-only inspect_*_price.py).
Backups (0600): /opt/omniroute/backups/pricing-{primary,standby}-20261104T013718Z.json (pre-haiku),
-20261104T013907Z.json (pre-qwen). Rollback: PATCH /api/pricing with the backup body on each instance.
Readback after PATCH: 200 on both; values present.

## Verification
- Probe `smoke.py oathloom` (combo/swade-cheap): 200 in 1.3s, served by claude-haiku-4-5, cost $0.000038. No more "no pricing found" lines for the oathloom key after the change.
- Test build (temp user, prompt "Rise & Crumb" bakery one-pager): run 8487408b-6f43-4ce4-876d-8a1d7adba0b4
  **completed** 01:40:05Z -> 01:44:39Z (7:40–7:44 PM CT, ~4.6 min). Project eef3f49a-d0b5-4203-919f-35ebc0b8b32c
  (oathloom.projects_v2): index.html 42.4 KB (title "Rise & Crumb — Neighborhood Artisan Bakery") + oathloom.manifest.json.
  Models: design/code on qwen-cloud/qwen3.8-max (success); content stages via combo -> qwen-flash 403 -> claude-haiku-4-5 (success).

## Key rotation status
Oathloom key NOT rotated. Confirmed never rotated after the Oct 30 exposure: primary key 602dfc02-… and standby
cdfd4012-… both created 2026-10-30 ~14:49Z, no revoked_at, /opt/swade-secrets/omniroute-app-keys/oathloom.env mtime
2026-10-30 14:49Z. Exposure is documented (WATCHTOWER_COMPLETION_2026-10-30.md, HANDOFF_2026-10-30_claude-security.md).
Not rotated now because: there is no rotate tool (setup_keys.py skips existing apps), SB2 cannot reach primary,
so the new secret would have to be copied by hand between hosts, and applying it needs a recreate of the shared
supabase functions container on primary (all edge functions; in-flight builds would die). Do it in a planned window:
create new keys on both instances (same caps) -> rewrite oathloom.env + keymap.caddy -> caddy reload gateway ->
update OATHLOOM_AI_KEY in primary .env -> `docker compose up -d --no-deps functions` with no running build_runs ->
smoke -> revoke old keys 602dfc02/cdfd4012.

## Follow-ups
1. qwen-cloud/qwen-flash returns 403 "free quota exhausted" -> every cheap call falls back to haiku (higher cost). Enable paid billing on Alibaba Model Studio, or reorder or replace the combo.
2. deepseek-v4-pro (3rd DESIGN_MODELS fallback) has no deepseek connection in OmniRoute, so it can't be routed. Add a connection or set OATHLOOM_AI_DESIGN_MODELS (needs a functions recreate).
3. Pre-price any new model before routing it to a capped key, or consider USAGE_LIMIT_IGNORE_UNPRICED (weaker hard stop).
4. Test artifacts left in place (deletion not approved): auth user oathloom-e2e-1793756403@swadebase.invalid
   (d89a2755-01d6-4ae0-a656-cf4f47bf584a), its project eef3f49a-… (+ files and a version), and the script /root/oathloom_e2e_20261103.py on primary.
5. SWADEBASE swadebase_ops.ai_rate_cards lacks qwen3.8-max, qwen3.7-max, and claude-haiku-4-5 rows (it has only qwen-flash and claude-haiku-5-5).
