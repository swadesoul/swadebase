# Swideo Site Bible

Version 1.4, October 31, 2026 (America/Chicago). v1.0 written by Grok Bot Oct 30 ~10:18 PM CT; v1.1 corrected Oct 30; v1.2-v1.3 RunPod (Oct 31); v1.4 fix-all audit and server fixes (Oct 31, ~2:20 AM CT). Product definition confirmed by Harold at 10:17 PM CT Oct 30.

**Status (Oct 31, v1.4): MOSTLY OPERATIONAL, NOT READY FOR OUTREACH.** Public site, sign-in, server functions, admin views, gift credits and published SceneWorld pages work. Remaining code fixes are listed in Swideo_Code_Fix_Brief_2026-10-31.md (voice preview auth, SceneWorld legacy media URLs, Suno and Stripe paths, credit RPC security). See the October 31 fix-all section.

## 1. Identity, aliases, canonical domain, owner
- Name: Swideo (Harold Whaley's video creation studio). Owner: Harold Whaley / SWADEBASE.
- Canonical domain: swideo.com (already owned; DNS at Namecheap, correct).
- AudiVid is PART of Swideo, not a separate product (Harold, Oct 30, 2026). Legacy AudiVid code: /opt/audivid on swadesoul.

## 2. Purpose and formats
1. Movies
2. Short drama
3. Motion graphics video
4. Comedy series shorts
5. Faceless videos
6. AudiVid (song + photo + EQ video)
Home page title: "Swideo — Videos Built to Be Watched, Shared, and Grown".

## 3. Features and limits (evidence state)
- Public site: VERIFIED LOADS (swideo.com HTTP 200).
- Browser auth and data: VERIFIED uses SWADEBASE auth and the `swideo` schema.
- Signed-in features (server functions): FAILING, tokens verified against Lovable Cloud.
- Video generation: APPROVED 2026-10-31 by Harold Whaley. Scope is the Video Jack agent's stick-figure Black history shorts only, with caps of $5 per job, $5 per day and $50 per month.
- 2026-10-31: Harold enabled the KIE routes for all apps (shared access accepted) and raised the Swideo per-job cap to $5; $5/day and $50/month unchanged. Swideo use is for hero clips in Video Jack's stick-figure Black history shorts (policy only; the router does not enforce job-type limits).

## 4. Customer journeys
Sign up, create project, choose format, build characters/frames, preflight, generate, download/share. End-to-end signed-in journey UNVERIFIED until the auth fix lands.

## 5. Repository, hosting, deployment
- Repo: https://github.com/swadesoul/swideo (private). Draft PRs #2 and #4 open.
- Frontend: Lovable project a2fe7a1f-5263-4034-87f1-4294e8f9bf74; swideo.com and www resolve to 185.158.133.1 (Lovable). Lovable badge still served.
- Backend: SWADEBASE (self-hosted Supabase on swadesoul), schema `swideo` (exposed). nginx origin map /etc/nginx/conf.d/swade-app-schemas.conf maps the Lovable project origin plus swideo.com and www.swideo.com to the `swideo` profile (fixed Oct 30).
- 21 server-function modules (in repo) still verify tokens against Lovable Cloud.

## 6. Database
Schema `swideo`: 55 tables, RLS on all 55. Data present (earlier zero-row stats were stale): 12 artists, 29 artist_assets, 27 jobs, 10 model router rules, 10 templates, 6 roles, 5 profiles. Other key tables: mv2_projects, mv2_project_versions, mv2_characters, mv2_frames, mv2_preflight_reports, mv2_provider_settings, generation_provider_logs, credit_grants, credit_transactions.

## 7. Auth and roles
SWADEBASE auth (shared); redirect URLs set. Harold holds master_super_admin. No profile is created on sign-up: only 5 of 129 users have a profile.

## 8. Dependencies and adapters
- SWADEBASE video router: Swideo registered for server calls only; caps $5/job, $5/day, $50/month; allow_user_calls off (end users). Agent/server calls APPROVED 2026-10-31 by Harold Whaley for the Video Jack agent's stick-figure Black history shorts only, within those caps.
- 2026-10-31 update: Harold enabled all six KIE routes (film, film_broll, film_hero, film_long high/low, film_seedance low) for all apps, accepting shared access, and raised Swideo per_job_cap_usd to $5; daily $5 and monthly $50 unchanged. Hero-clips-only for Video Jack's stick-figure Black history shorts is policy only; the router does not enforce it.
- Adapter `swideo-site-connection` in swadebase_ops.adapters_registry, status in_progress (added Oct 30).

## 9. Storage
UNKNOWN; to follow SWADEBASE storage / B2 policy.

## 10. Pricing, billing, entitlements
Credits tables exist. White-label entitlement key `swade.whitelabel.swideo`. No billing live. Rule 21: Harold is exempt from charges.

## 11. Jobs and monitoring
Watchtower (Uptime Kuma) monitors swideo.com.

## 12. Known problems (ranked)
1. Signed-in features fail: the 21 server-function modules verify tokens against Lovable Cloud, not SWADEBASE. Fix PR being prepared by a coding agent.
2. Video generation not approved: all video routes are paid; provider and spend wait on Harold's decision. No spend until then.
3. No profile created on sign-up: only 5 of 129 users have a profile.
4. www.swideo.com returns HTTP 421 until Harold adds it in Lovable under Settings > Domains (Namecheap DNS is correct).
5. Lovable badge still on; migration off Lovable hosting unfinished.

## 13. Backup, recovery, release verification
Schema covered by SWADEBASE database backups. Oct 30 nginx/adapter fix backup: /opt/swadebase/backups/swideo-adapters-20261031T031931Z/. No release verification yet.

## 14. Next steps (not applied here)
1. Review and merge the server-function auth fix PR (Harold approval), then test sign-in features.
2. Harold adds www.swideo.com in Lovable Settings > Domains.
3. Add a profile-on-sign-up trigger and backfill missing profiles.
4. Harold decides on paid video routes and cost.
5. Remove the Lovable badge; finish migration; fold AudiVid in as the sixth format.

## Standing rules that apply
- No purchases (domains, paid generation) without Harold's explicit approval.
- Rule 21: Harold is exempt from charges.
- Outreach is drafts only; no outreach may mention or link Swideo until it is verified 100% ready.
- Back up before changes; deploy lock (rule 20) for server changes.

## Version history
- v1.0, October 30, 2026: first Swideo Bible; product confirmed by Harold.
- v1.1, October 30, 2026: corrected from a later Oct 30 check. Data not empty (stale stats); repo identified; SWADEBASE auth, schema exposure, RLS and video-router registration recorded; nginx origin map and adapter fix recorded; problem list rewritten. Backup of v1.0: Swideo_Site_Bible.md.bak-20261031T032918Z.

## RunPod GPU video (added October 31, 2026 UTC)
Approved by Harold. Server-side on swadesoul only; the swideo GitHub repo was not changed.
- Provider: `runpod` in the Swade Video Router (`_swade-video` core.ts/runtime.ts). Submits to RunPod serverless `/run`, the poller checks `/status` every minute, cancel uses `/cancel`. Cost = executionTime x GPU price per second (RUNPOD_USD_PER_SECOND), recorded in brain.ai_spend. Normal router caps apply ($2/job, $5/day, $50/month for swideo).
- Locked down: runpod routes need a server caller AND the app in RUNPOD_VIDEO_APPS (swideo). Swideo user calls stay off; model_router_rules rows `gpu_wan22_i2v` and `gpu_ltxv_t2v` are active=false.
- Env (functions.env): RUNPOD_API_KEY, RUNPOD_VIDEO_ENDPOINT_ID=7gflopfa96z0cl, RUNPOD_VIDEO_APPS=swideo, RUNPOD_LTX_ENDPOINT_ID=4rdbs8kte0ub1s.
- Routes:
  - `gpu_wan22_i2v`: Wan 2.2 image-to-video, endpoint 7gflopfa96z0cl, needs a first_frame image, 832x480, 81 frames at 16 fps (~5 s). Endpoint min 0 / max 1, 24 GB+ GPUs (4090, 5090, 6000 Ada, L40S), idle 5 s. Status: NOT WORKING. In the Oct 31 test no worker was ever placed in 15 minutes (job canceled, $0 GPU). Needs a fix (likely redeploy from the current RunPod Hub release / smaller disk) before use.
  - `gpu_ltxv_t2v`: LTX-Video 2B v0.9 text-to-video (free open model) on new endpoint 4rdbs8kte0ub1s, ComfyUI worker image timpietruskyrunpod/comfyui-wizard:tpl-ltxv_text_to_video, template asv8qd48vw. 832x480, 121 frames at 24 fps (5 s), 30 steps. Endpoint min 0 / max 1, 24 GB GPUs (A5000, L4, 3090, 4090), idle 5 s. Status: WORKING.
- Test, Oct 31: LTX 5 s clip of a sunset city skyline. About 2 min cold start + 39 s generating on a 24 GB GPU. Cost about $0.01 (recorded $0.0145 at the conservative 4090 rate; account balance fell $0.0115 including storage).
- Watchdog gap: runpod_guard.py only watches pods. It does not yet check serverless workers or endpoint min-workers settings.
- Backup and undo steps: /opt/swadebase/backups/runpod-video-20261031T034812Z/README.md.
- v1.2, October 31, 2026: this RunPod section added.

## RunPod video for admins (update, October 31, 2026 UTC)
- Router side is ON for Swideo admins only (swideo.user_roles: master_super_admin, super_admin, admin; today only Harold). Ordinary users are refused (403) on RunPod routes; nothing changed for other routes.
- Routes: `gpu_ltxv_t2v` (LTX-Video, own endpoint 4rdbs8kte0ub1s, text-to-video 832x480 5 s, about $0.01-0.02 a clip) and `runpod_hosted_wan22_i2v` (RunPod-hosted Wan 2.2 I2V 720p, needs a start image, $0.30 per 5 s clip). Both Swideo rules active.
- Own Wan endpoint 7gflopfa96z0cl is retired (route off, max 0 workers). RunPod has no live hosted Wan 2.2 text-to-video endpoint.
- Tests Oct 31: hosted Wan 1248x720 5.4 s clip in about 3 min, $0.30; LTX 832x480 5 s clip in 75 s warm, about $0.015.
- Still needed: a Swideo code change (PR) so the app calls these routes for admins and waits for the clip; until then nothing in the Swideo UI uses them.
- Backup and undo: /opt/swadebase/backups/runpod-swideo-on-20261031T064638Z/README.md.
- v1.3, October 31, 2026: this update.

## Fix-all audit and server fixes (October 31, 2026, ~2:20 AM CT / 07:17 UTC)
Harold: "Fix Swideo completely". Done by Grok Bot. Server-side only; the swideo repo was not changed in this pass (the RunPod scene-picker PR is a separate agent).

### Audit results
- Pages: all public routes load on swideo.com (home, marketplace, templates, pricing, sign-in, studio, admin, director, director/admin, music-videos, scene-worlds, faceless, frequency, artists, assets, my-work, checkout/return, reset-password, sitemap.xml). Signed-in pages show a sign-in gate when logged out. No script errors. swideo.lovable.app redirects to swideo.com. www.swideo.com still HTTP 421 (domain not added in Lovable; the Lovable connector has no domain tool).
- Server functions: all return a clean "Unauthorized" without a token (verified after PR #6).
- Database: all 48 tables the code uses exist in schema `swideo` (55 tables, RLS on all). RPCs used (has_role, consume_credits, grant_subscription_credits) exist. Buckets sceneworld, vision-director, user-assets, storyform-audio exist (private) with owner policies. B2 bucket `swideo` is used server-side via Lovable secrets.
- Auth: Google + email on SWADEBASE; swideo.com and www are in the redirect allow list; nginx maps both to the `swideo` profile.
- Logs (24 h): no swideo errors in PostgREST, storage, auth or edge functions.

### Fixed (backup + undo: /opt/swadebase/backups/swideo-fix-all-20261031T071704Z/README.md)
1. Admin can read all profiles and music-video projects (admin dashboard counts and user list now complete).
2. Gift credits works: admin policies on user_credits / credit_transactions (super_admin and master_super_admin write; admins read) plus RPC swideo.admin_gift_credits(email, amount) (master_super_admin only). Verified in a rolled-back test as Harold; a normal user gets "forbidden" / RLS denial.
3. Public SceneWorld pages work: /w/noble-rayne showed "World not found"; now renders (anon can read published worlds, scenes, actions, and sign their media in the private sceneworld bucket; unpublished data stays private).
4. Paid-generation guard: the app treats a user with no credits row as unlimited, so after PR #6 any signed-in non-admin could run paid generation free. Every non-admin Swideo user now has a 0-balance credits row (4 rows added), and new Swideo profiles/roles get one automatically (triggers swideo_profile_credit_row, swideo_role_credit_row). Admins stay exempt. Harold can give credits with Gift credits.

### Still open (code or Harold)
- SECURITY (needs Harold's OK, touches credit/payment functions): swideo.grant_subscription_credits and swideo.consume_credits are SECURITY DEFINER and executable by anon/authenticated with any user id: anyone can mint credits or drain someone else's. Fix: revoke execute from anon, authenticated on grant_subscription_credits; make consume_credits check auth.uid().
- Stripe webhook and Suno callback still write to the old Lovable Cloud database (credits from subscriptions never reach SWADEBASE; Suno fast-path updates are lost, polling still works). Suno callBackUrl points at swideo.lovable.app, which 302-redirects.
- /api/tts voice previews verify tokens against Lovable Cloud, so they return 401 for every signed-in user.
- MCP tools and server-side signing without a user token still throw "Needs SWADEBASE server adapter".
- SceneWorld media for noble-rayne still points at the old Lovable Cloud storage URL (images fail to load); the same files exist in SWADEBASE storage.
- Lovable email queue route has no pgmq on SWADEBASE (returns 500 config error); auth emails go through SWADEBASE, so it is unused.
- Voice Lock: draft PR #2 unmerged. Ecosystem footer: draft PR #4 unmerged.
- Code-fix brief for all of the above: /opt/swadebase/docs/site-bibles/Swideo_Code_Fix_Brief_2026-10-31.md
- v1.4, October 31, 2026: this section. Backup of v1.3: Swideo_Site_Bible.md.bak-20261031T072100Z.
