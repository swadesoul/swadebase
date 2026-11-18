# Oathloom: SWADEBASE inventory (Nov 3, 2026, ~7:50 PM CT)
This was a read-only check. Nothing was changed, restarted, or deleted. It covers primary swadesoul (2.25.74.73), plus swadebase-2 for OmniRoute.
The earlier Vercel exit decision is at /workspace/docs/OATHLOOM_VERCEL_EXIT_DECISION_2026-11-03.md on the Grok Bot box. Vercel was never in the live path.

## What SWADEBASE docs and registries say
- There is **no Oathloom Site Bible** under docs/site-bibles, and no status flag (active, paused or retired) anywhere.
- Mentions of Oathloom:
  - The SWADEBASE Master Site Bible lists it in the site-agent rollout order, last after Black TALES. It also logs that legal pages went live on oathloom.com Oct 30.
  - The SWOSTing Bible sells "Brainiak Build (OATHLOOM)" at $399. It names the limits as single-HTML output with the visual editor unmounted. It also lists the OATHLOOM Receptionist as the phone line.
- Registries:
  - Oathloom is **not** in `swadesoul.ecosystem_sites` (17 rows), and not in `public.ecosystem_sites`.
  - It **is** in `oathloom.ecosystem_app_registry` (app_id oathloom, launch_url /build).
  - The gap is already flagged in SWADE_MULTI_BOT_SYSTEM.md item 8.
- Monitoring: Watchtower shows Oathloom "up" (checked 2026-11-04 01:30 UTC). The repair-kit scan shows oathloom.com at HTTP 200.
- Handoff Oct 30 (security): "Kept oathloom-current-test and oathloom-frontend … routing source unclear, verify before touching". The oathloom-prev ×2 containers were removed.

## What runs on primary
- **nginx** `sites-enabled/oathloom` routes:
  - `/` goes to 127.0.0.1:18089, which is **oathloom-current-test** (image oathloom-frontend:9db37a9-site1, created Oct 20, healthy, up 13d). That container is the live site.
  - `/auth|rest|storage|functions/v1` and realtime go to supabase-kong :18000.
  - `/voice/` goes to 127.0.0.1:18190.
- **oathloom-frontend**: :8089, created Sep 28, healthy, but **not routed by nginx**. It is a stale twin.
- **oathloom-receptionist**: image :5, host network, python app.py on :18190 (Twilio ConversationRelay). The log has had no activity since the "LLM warm" line on Oct 21. It is idle.
- None of the three containers is a compose project. They are bare `docker run` containers with restart=unless-stopped, and there is no systemd unit.
- **systemd**: `oathloom-kimi-prices.timer` runs a daily pricing check.
- **/opt/oathloom** is not a git checkout. It holds releases/, backups/ and two Oct 8–9 notes. /opt/oathloom-receptionist is also there.
- The edge runtime is the shared supabase-edge-functions container (healthy). Its logs show only generic wall-clock early-termination warnings.

## Builder and database (`oathloom` schema in supabase-db)
- `projects` (v1) has 0 rows. `projects_v2` has **27 projects** from **2 users**, 8 of them public, the last created Oct 27, 1:32 PM CT. The earlier "17 projects" figure was build_runs-based; build_runs covers 20 projects from 3 users.
- `build_runs`: 20 completed (the last on Oct 27, 1:21 PM CT) and **15 failed**.
  - **Every run since Oct 30 failed** at stage intent/code with the error **"Rate limit reached. Try again shortly."** (Oct 30 ×4 around 11:31 AM CT, Nov 1 ×1 at 11:43 PM CT).
  - Support tickets: 0.
- **Likely root cause:** on Oct 30 (around 9:40–10 AM CT), Oathloom was re-pointed to OmniRoute.
  - The settings are `OATHLOOM_AI_URL=https://omniroute.2.25.96.150.sslip.io/...` and `OATHLOOM_AI_MODELS=combo/swade-cheap`, with a per-app key capped at $5/day and $25/wk as a hard stop.
  - The omniroute-primary logs on swadebase-2 keep repeating: `no pricing found for anthropic/claude-haiku-4-5 … a configured USD quota fails closed`. claude-haiku-4.5 is in the swade-cheap chain.
  - So the capped Oathloom key fails closed, and that comes back as 429 "Rate limit reached". This is inferred from the logs and not yet tested.
  - Note: the Oathloom key was also among the keys exposed on Oct 30 (handoff item). Check whether it has been rotated since.

## GitHub swadesoul/oathloom
- There are 26 open PRs. The newest activity is #40 (draft, milestone-1 site engine, last updated Oct 24). Most are Oct 14 drafts (#22–#37), plus #38 storage limits (Oct 15). All are stale.

## Gaps
1. No Site Bible and no lifecycle flag.
2. Missing from `swadesoul.ecosystem_sites`.
3. The builder has been broken since Oct 30 by the OmniRoute quota fail-closed.
4. Stale `oathloom-frontend` twin container on :8089.
5. No compose file or IaC for the live containers.
6. 26 stale PRs.
7. The receptionist has been idle since Oct 21.

## Repair options (none done; each needs approval)
- **A.** Add a price for `anthropic/claude-haiku-4-5` in OmniRoute, or set USAGE_LIMIT_IGNORE_UNPRICED, or drop haiku from swade-cheap. Then run one test build.
- **B.** Or temporarily set the Oathloom key without a USD quota.
- Then add a row to `swadesoul.ecosystem_sites` and write an OATHLOOM Master Site Bible with a status flag.
