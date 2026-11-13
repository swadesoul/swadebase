# Handoff — Claude, 2026-10-30 (~06:00–07:58 CT)

## Done and LIVE
- **GitHub access:** account-level SSH key on swadesoul, alias `github-all` (/root/.ssh/swade_github_all). Reaches every swadesoul repo.
- **Swade Soul World (swadesoul.world) OFF Lovable, on SWADEBASE.** PR3 (identity repair + Identity Studio), PR6 (character chat), PR7 (Granada workflows + Music Mogul link) merged with watch mode; black & gold % loading ring; ~3.4 MB XR emulator stripped; type fixes. Lovable agent added RLS fixes (c488937). Service `ssworld-web` (port 18840, /opt/ssworld-web/current, env /opt/swade-secrets/ssworld-web.env), nginx /etc/nginx/sites-available/swadesoul.world, Let's Encrypt cert, DNS A @/www -> 2.25.74.73. Rollback: DNS back to 185.158.133.1.
- **Maestro Radio (themaestroradio.com) OFF Lovable.** Static build of swade-radio d499993 in /var/www/maestroradio-web/current. Includes Safari/iOS upload fix (MP3/M4A/MP4/WAV/AAC/AIFF/FLAC/OGG), single-track "Upload tracks" labels, safe filenames. Station-libraries work from 10/28 committed + merged to main. Rollback: /opt/swadebase/backups/nginx-themaestroradio-20261030T122007Z.conf.
- **Old SSWorld Lovable DB:** 26 open policies removed (restore: /opt/swadebase/backups/ssworld-lovable-olddb-policies-20261030.sql).
- **Postiz/Temporal:** temporal crash-looped 652x (dynamicconfig dir root-only, 700). Fixed perms (755/644, no secrets); temporal healthy; postiz started and healthy; post.swadebase.cloud responds.
- Site Bibles updated: Maestro_Radio, SwadeSoul (with backups). Deploy lock released.

## In progress / NOT finished
1. **Agent Safe Mode (approved by Harold).** Phase 1 = Moxie on swadebase-2.
   - Built: /opt/swade-agent-guard/netguard.sh + watch-networks.sh; systemd `swade-agent-guard.service` + `swade-agent-guard-refresh.timer` (active). Detects `rakazo-computer-*` networks (log /var/log/swade-agent-guard.log).
   - **NOT EFFECTIVE YET:** a test from a rakazo-computer network still reached host :22/:8000/:6001 and swadesoul :22. Host uses iptables-nft + docker-proxy (userland proxy). Fix the rule path, re-test, and only then claim protection. Desktop Commander blocks `iptables` and `sleep` on swadebase-2.
   - Findings: Moxie computer is non-root (1000), unprivileged, 2 GB/2 CPU, no keys; mounts only rakazo_appdata (bot homes). **Coolify :8000/:6001 are open to the whole internet** (flagged to Harold, not changed).
   - Still to build: out-of-reach nightly backup of rakazo_appdata; watchdog (crash loops + stale deploy locks); Safe Actions menu via MCP Actions (backup -> health check -> auto-rollback); approval queue; hard never-list. Then Big Mamma, then others.
2. **Move remaining Lovable-hosted sites (Harold: "move them all", use the migration kit).**
   - Static + data already on SWADEBASE: teachvirt.courses (repo teachvirt, Lovable ee80aad6), resinglab.com (resing, 691e8717), sonikyn.com (sonikyn, 19a5cccf), tokencsi.com (tokencsi, f956bc0c), swadesoul.com (Lovable ea3d46cb or 31cf1390; repo unknown — the `swadesoul` repo is Brand Cinema, not the site).
   - Server code + SWADEBASE data: mydistribution.music (Lovable a30b1397), agentmarketplace.diy (74d64d35); repos unknown.
   - Data still on hosted Supabase -> run /opt/swadebase/migrate kit first: dnafront.com (bprjkodtrilbnfefxvqa, Lovable aeed4533), haroldwhaley.com (qykadcixaainqqmbgrpj, Lovable 2b0a3464).
   - Clones in /opt/work/sites. npm fails on bun.lock projects; **use bun** (/root/.nvm/versions/node/v22.23.3/bin/bun). Pattern: build -> /var/www/<site>/releases + `current` symlink (static) or systemd node service (server) -> nginx -> certbot -> Harold flips DNS (managed in Lovable's domain panel / Name.com).
3. **Swade Soul World duplicate:** another agent deployed `swadesoulworld.service` (port 3420, /opt/swadebase/world, has DeepFilterNet env) serving world.swadebase.cloud at ~05:53 CT. Mine (`ssworld-web`, 18840) serves swadesoul.world. Consolidate to one.
4. **Swade Soul World gaps off Lovable:** missing HIGGSFIELD_SECRET_KEY, HERMES_URL/HERMES_JOB_SIGNING_KEY, SWADESOUL_CATALOG_URL/KEY (Forge/billboard video, catalog sync). Signup email still via Lovable sender (move to SwadeMail; keep `notify` NS records until then). Four July files (#1 building GLB + thumbnail, "Swade Soul Opening" PNG) only on old Lovable storage.
5. **OmniRoute (built overnight on swadebase-2; the Grok Bot alternative):** healthy dual primary/standby + gateway 127.0.0.1:20120; 6 providers active (OpenAI, Anthropic, Gemini, Qwen Cloud, Kimi, KIE). No API keys issued, no combos, no apps wired. Next: issue key, cheapest-first combo (Qwen Flash -> Claude Haiku 5.5 -> gpt-4o-mini), point Oathloom, then SSS Brain.

## Queue after that (Harold's list)
Swade Soul World front desk (Talk to Granada, fam directory, 3-choice nav, 10 unplaced artists' floors, remaining speed fixes) · Maestro full-station auto-schedule (music + DJ breaks + sponsors + IDs + shows) · create-song-in-admin -> instant rotation -> Maestro Family artist matching/profiles via Sonikyn · Swosting site on SWADEBASE (Bible approved; images on B2) · HyperFrames how-to videos for every Maestro area.

## Standing reminders
No Lovable send_message (credits). Deploy via GitHub/SWADEBASE. Take/clear DEPLOY_LOCK.md (rule 20). Update Site Bibles same session (rule 17). Uploads must work on iPad Safari (rule 6).
