# Oathloom: Vercel exit decision (Nov 3, 2026, ~7:20 PM CT)

## Verdict
- **oathloom.com is live and self-hosted on primary (2.25.74.73). It has no Vercel or Convex dependency.** Nothing to port.
- **oathloom-app-build (v0-oathloom.vercel.app) is dead.** Vercel returns 402 DEPLOYMENT_DISABLED. The last feature commit was Aug 11, 2026; since then there have only been Next.js security bumps (Oct 15, Nov 3).
- **oathloom-app-build-qa (oathloom-app-build-flax.vercel.app):** also 402 disabled. Since Jul 11 it was only a redirect placeholder pointing to oathloom.com.
- **Recommendation: Skip the port. Archive the Vercel projects (or delete them once Swade confirms). Archive both GitHub repos as read-only.** Leave oathloom.com as it is.

## Evidence
- DNS: oathloom.com and www point to 2.25.74.73 (A record); nameservers are Namecheap registrar-servers. Nginx `sites-available/oathloom` sends `/` to container `oathloom-current-test` (127.0.0.1:18089, image oathloom-frontend:9db37a9-site1, created Oct 20). Supabase routes go to kong :18000 and `/voice/` goes to :18190 (python). The `oathloom-receptionist` and `oathloom-frontend` containers are also up.
- Live page title is "Oathloom - The Sovereign Web" (Vite SPA). The bundle has no vercel or convex references. The `_oathloom` edge functions are namecheap.ts and site-engine, with no Vercel or Convex references.
- Watchtower reports Oathloom "up". Legal pages went live Oct 30. `ecosystem_app_registry` has app_id=oathloom with status connected. Oathloom is **not** in `public.ecosystem_sites` (a known registry gap).
- Usage: the `oathloom` schema has 17 projects (last created Oct 27), 35 build runs, and only **1 distinct user** (likely the founder or agents). Every build run since Oct 30 failed (Oct 30 ×4, Nov 2 ×1). The nginx container log shows about 51 unique non-bot IPs hitting `/` in 7 days.
- GitHub swadesoul/oathloom (Lovable/Vite, live site source): last merges Oct 30; 26 open PRs, all stale (from Oct 24 or earlier).
