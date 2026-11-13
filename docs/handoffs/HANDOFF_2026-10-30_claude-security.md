# Handoff 2026-10-30 (13:30Z) - claude - security pass

## Done (verified)
- **Safe Mode network guard works** (swadebase-2, /opt/swade-agent-guard/netguard.sh, services swade-agent-guard + swade-agent-guard-refresh).
  Live test 13:15Z: throwaway `rakazo-computer-*` network was BLOCKED from 22/8000/6001/8080 on swadebase-2 (gateway + public IP) and on swadesoul (2.25.74.73); internet 443 stayed OPEN. Test network removed.
  Chains are empty while no agent computer is awake. That is expected; rules load when a rakazo-computer-* network is created.
- **Portainer removed from swadesoul** (2.25.74.73) at 13:25Z on Swade's approval. It was unused: 68 KB of data, no edge agents, no app references.
  - Backup: /opt/swadebase/backups/portainer_data-20261030T132535Z.tar.gz and portainer-container-20261030T132535Z.json (root-only).
  - Removed: container, portainer_data volume, portainer/portainer-ce:latest image.
  - Restore: `docker volume create portainer_data`, untar the backup into its _data, then re-run portainer-ce with 9443 bound to 127.0.0.1.
  - After removal: swadesoul.world 200, themaestroradio.com 200, sssbrain.live 307 (redirect), no unhealthy containers.

## Firewall facts
- Hostinger cloud firewall **"swade-web-only" (id 371444)** is on VM 1796059 (swadesoul, 2.25.74.73). It allows 22, 80, 443, ICMP, 2022, 8005-8796, 8798-8995, mail (25/465/587/993), LiveKit/TURN (7881, 7882/udp, 3478/udp, 5349, 30000-40000/udp).
  Verified blocked from outside over v4 and v6: 8000, 9443, 18000 (supabase-kong 18000/18443 is not publicly reachable).
- **swadebase-2 (VM 1880663, 2.25.96.150) has NO Hostinger firewall.** Coolify 8000, 6001/6002 and the proxy's 8080 are open to the internet. Coolify has no fqdn set.

## Next (scheduled, runs once the OmniRoute lock clears)
1. Give Coolify an HTTPS address (https://coolify.2.25.96.150.sslip.io) and verify it. Then inventory swadebase-2's public ports and attach a new Hostinger firewall group "swadebase2-web-only" (22/80/443 + needed ports + all from 2.25.74.73).
   If GitHub secret COOLIFY_API_URL points at :8000, Swade must update it.
2. Verify the OmniRoute work: local-first chain, ledger hookup, hard stop actually blocking, Oathloom routed.

Where things live: this handoff and DEPLOY_LOCK.md are on **swadesoul** (/opt/swadebase/docs). Coolify, OmniRoute, Rakazo and the Safe Mode guard are on **swadebase-2**.

## Cleanup on swadesoul, 13:33–13:40Z (Swade-approved)
Backups: /opt/swadebase/backups/cleanup-20261030T133336Z (root-only). Quarantine: /opt/swadebase/backups/quarantine-20261030T133336Z (delete after 2026-11-13 if nothing broke).
- **Removed Postiz + Temporal + Elasticsearch** (/opt/postiz stack). It had never been used: 0 posts, 0 connected social accounts. DB dumps and config are in backups; the /opt/postiz dir is quarantined. The SSS Brain Bible line 237 "Postiz as the poster" is now historical; a future social poster needs a fresh decision.
- Removed 15 stopped containers (old Black Tales stage/preview/prev copies, oathloom-prev x2, voicestudio-lab, sapphire-sssbrain-pilot, caddy-hermes). **Kept blacktales-rollback-e233b10** as the undo point. Container JSON is saved in backups.
- Removed orphaned volumes: voiceboxsoul_huggingface-cache (1.9 GB model cache; VoiceBox runs on swadebase-2), sssbrain-validate-node_modules, voiceboxsoul_voicebox-data + 2 traefik cert volumes (all three tarred to backups first).
- Quarantined /opt/sssbrain-build-{17e77ad,6add057,7fbec62,e232953} and /opt/sssbrain-qa. Kept /opt/sssbrain-releases (rollback history) and /opt/sssbrain (dirty, preserve per Bible).
- **Stopped (not removed; restart policy set to no):** blacktales (port 3210, same image as the rollback), blacktales-marquee-live (3341), hns-gateway-canary (idle), sssbrain-stage (idle), sssbrain-stt + sssbrain-stt-tunnel (swadesoul copy, 0 requests in 24h; the cloudflared quick tunnel had it exposed publicly). Restart any with `docker start <name>`.
- **Live Black Tales = blacktales-marquee-live2 (127.0.0.1:3342)**; nginx blacktales.online proxies there. Its name is misleading, so don't remove "live2".
- Kept, still in use: oathloom-current-test and oathloom-frontend (health checks + SwadePower-Monitor traffic; routing source unclear, verify before touching), mailcow (18 mailboxes, 4 domains), azuracast, vsw-warp.
- Verified after: blacktales.online, swadesoul.world, themaestroradio.com, teachvirt.courses 200; swadebase.cloud/rest/v1 401 (expected); sssbrain.live 307; no unhealthy containers.

## SWADEBASE = self-hosted Supabase
The supabase-* containers on swadesoul ARE SWADEBASE: nginx swadebase.cloud has 12 routes to supabase-kong 127.0.0.1:18000 (rest/auth/storage/realtime). Never remove them as "duplicate Supabase".

## SSS Brain layout after cleanup
- App: Coolify g1406wexcvceencavj1fuo0u on **swadebase-2**, plus sssbrain-stt (whisper) there, plus services sssbrain-tts and sssbrain-stt-relay.
- Shared infra it uses on **swadesoul**: SWADEBASE DB (schema sssbrain) and the voice engine on 172.16.0.1:8795 (reached through ssh tunnel service sssbrain-voice-studio-tunnel on swadebase-2).
- Pending on swadebase-2 (after the OmniRoute lock): remove exited sssbrain-knowledge-fixture-20261029, publiswade-migration-test, videosaywhat-studio-engine-before-clone-fix; prune build cache (~3.5 GB). Rakazo one-shot containers are compose-managed: leave them.

## 14:39–15:00Z — Coolify closed, OmniRoute finished (took over the stale 13:02Z lock)
The earlier OmniRoute session stalled: no combos or keys were created, and nothing changed after 13:04Z. Lock taken over at 14:39Z.

**Coolify (swadebase-2):**
- Dashboard is now **https://coolify.2.25.96.150.sslip.io** (instance fqdn set via Coolify's own setupDynamicProxyConfiguration; Let's Encrypt cert valid to 2027-01-28; realtime websocket returns 101 through the proxy). instance_settings backup: /root/coolify-instance_settings-20261030T144026Z.sql on swadebase-2.
- **Hostinger firewall "swadebase2-web-only" (id 389858)** attached to VM 1880663, synced 14:43Z. Allows: 22, 80, 443 tcp+udp, ICMP/ICMPv6, all TCP from swadesoul (2.25.74.73 and 2a02:4780:75:8037::1), and **8000 from anywhere (TEMPORARY)**. 6001/6002/8080 and the private relays 3901–3903 are no longer public; swadesoul still reaches them (verified).
- **8000 is still open** because the Coolify GitHub App "coolifyswade1" webhook = http://2.25.96.150:8000/webhooks/source/github/events (42 auto-deploys in 14 days). After Swade approves, change the webhook to https://coolify.2.25.96.150.sslip.io/webhooks/source/github/events (it can be done via the app JWT from Coolify tinker, or in GitHub settings), then delete rule 1602540 and sync.
- The swadesoul firewall "swade-web-only" (id 371444) is unchanged.

**OmniRoute:** see /opt/omniroute/README.md (2026-10-30 section) on swadebase-2: chains swade-cheap / swade-background, $0 local pricing, per-app keys with caps (hard stop verified 200 then 429), key-swapping failover (verified), HTTPS route for swadesoul only, ledger sync timer into swadebase_ops.ai_usage_ledger (verified), **Oathloom switched off the Qwen Token Plan to OmniRoute** (E2E verified; rollback documented).

## 15:00Z — swadebase-2 cleanup (approved)
Removed exited containers sssbrain-knowledge-fixture-20261029, publiswade-migration-test, videosaywhat-studio-engine-before-clone-fix (inspect JSON in /opt/swade-secrets/cleanup-swadebase2-20261030T150031Z on swadebase-2). Build cache pruned: 3.5 GB freed (no build was running). Rakazo one-shot containers were left alone. After: sssbrain.live 307, coolify sslip 200, oathloom.site 200, swadebase-2.swadebase.cloud 200; OmniRoute, Coolify, SSS Brain, Rakazo and VoiceBox healthy; nothing unhealthy. Disk 30 GB free.

## 15:10Z — SSS Brain move PAUSED (premise corrected); render fixed
See the Correction section in docs/prds/SSSBRAIN_MOVE_TO_SWADESOUL_2026-10-30.md. The heavy voice models live on swadebase-2 (swadesoul only has forwarders), so an app-only move is pointless. Real option = move the voice stack + app together (RK-004). **Renders fixed** via new sssbrain-render-tunnel.service on swadebase-2 (verified 200 from the live app).
Also noted: swadesoul's voice engine is published on 2.25.74.73:8795, and the swadesoul Hostinger firewall range 8005:8796 is open to anyone, so it is publicly reachable (token-protected: 401 without a token). Consider narrowing 8005:8796 after checking what needs it.

## 15:15Z — Swade Studio P1
Knowledge Studio fixes: PR #102 on swadesoul/sssbrain (branch fix/knowledge-studio, commit 165d87f). Built, type-checked and tested; not merged or deployed yet. See PRD section 13.

## 15:22–15:28Z — webhook to HTTPS, port 8000 closed, Knowledge Studio deployed (all approved by Swade 10:22 CT)
- Coolify GitHub App "coolifyswade1" webhook changed to https://coolify.2.25.96.150.sslip.io/webhooks/source/github/events (insecure_ssl=0), via the app JWT from Coolify tinker. **Verified by a real event:** the merge push was delivered 200 OK and Coolify started deployment z784jsg2lgm271soziprennu with is_webhook=true.
- Hostinger firewall 389858: rule 1602540 (8000 from anywhere) deleted and synced. swadebase-2 now only accepts 22, 80, 443 tcp/udp, ICMP and everything from swadesoul. The old http://2.25.96.150:8000 dashboard address no longer works; use the sslip HTTPS address. If the GitHub secret COOLIFY_API_URL still points at :8000, the SSS Brain deploy workflow falls back to Coolify's own webhook deploys (which work).
- **PR #102 merged** as 54a6aea (squash). The Coolify webhook deploy finished at 15:26Z; the build needed no swap spike (~3.3 GB available throughout). Live container g1406wexcvceencavj1fuo0u-20261030T152322 is healthy; /knowledge-studio returns 200; the bundle contains the knowledge-studio and swarvis-capabilities code; render path verified 200 from the new container.
- Still owed: a signed-in iPad test by Swade (upload PDF, ask, citations, save).
- Voice-stack move: Swade asked why, before approving execution. Inventory so far: on swadebase-2, VoiceStudio (ghcr.io/debpalash/voicestudio, 17 GB image, data 3.2 GB at /opt/videosaywhat-studio/data, 5 GB mem limit), VoiceBox (12.6 GB image, HF cache 5.5 GB, profiles 38 MB, outputs 441 MB), sssbrain-stt (1.46 GB image, whisper cache 464 MB), plus relay services voicebox-relay, sssbrain-stt-relay, videosaywhat-studio-relay, sssbrain-tts and sssbrain-voice-studio-tunnel. swadesoul: 8 CPU, ~21 GB available memory, 201 GB free disk, ~40% CPU busy (AzuraCast, supabase). Not started.

## 23:15Z — Watchtower check (read-only; ChatGPT-Codex-Watchtower built it and holds the watchtower lock)
- Confirmed via the Hostinger connector (fills Codex's gap #5): VM 2112045 has provider firewall **"watchtower-locked" (id 389924)**, synced. Allows SSH 22 (any), ICMP/ICMPv6, and all TCP from swadesoul v4/v6 and swadebase-2 v4/v6. UFW is also active on the host. Kuma is on 127.0.0.1:3001 only. SSH is key-only (sshd -T: passwordauthentication no).
- Kuma's 19 failing of 58, as checked from Watchtower: **13 domains have no DNS at all** (teachvirt.com, swadez.com, makemycoin.cash, rwafactory.cash, xrplfactory.cash, recapcoin.cash, grwnup.digital, swideo.live, cmvault.email, grwnx.io, sterline.digital, shamoneswade.com, digidollz.xyz, holistichive.health, aimaestro.consulting; to be verified per domain): these are expired/retired/never-launched names, not outages. Remove them or mark them retired after Swade confirms. **Real ones:** ownmode.live returns 404 (Cloudflare 162.159.143.30); maestroradio.live resolves to 104.219.250.37 and times out (the live Maestro site is themaestroradio.com on swadesoul, 200). External hosts (fortavaz.replit.app, swadesaidit-rose.vercel.app) were not individually re-checked.
- **OmniRoute app keys exposed** (Codex's diagnostic printed the 12 keys from /opt/omniroute/Caddyfile). Current consumers: only Oathloom (swadesoul /opt/swadebase/docker/.env OATHLOOM_AI_KEY) and the gateway key map. The other 5 apps' keys are unused. Spend caps limit the blast radius. Rotation is awaiting Swade's approval; the plan is: new keys via ops/setup_keys.py (regenerate env files + keymap), update Oathloom env, verify, then delete the old keys.

## 23:20–23:35Z — monitor list corrected, site launch plan (Swade request 18:14 CT)
- The "dead" domains are NOT dead sites. 10 of them are **not registered to anyone** (available at Namecheap via SWADEBASE domain-manager search); swideo.com, makemycoin.live and teachvirt.courses are the real live addresses. ownmode.live is owned (Namecheap DNS) but points at Emergent hosting, which returns 404 — the site was unpublished/detached; no GitHub repo exists for it.
- Watchtower Kuma: removed maestroradio.live, swideo.live, makemycoin.cash, teachvirt.com; added themaestroradio.com (it was not monitored), makemycoin.live, teachvirt.courses (swideo.com already present). Scripts: /opt/watchtower/add-monitor.cjs, remove-monitor.cjs (run inside the kuma container; creds never printed). Target backups in /opt/watchtower/backups/.
- Plan: /opt/swadebase/docs/prds/SITE_LAUNCH_PLAN_2026-10-30.md (needs Swade: domain confirmations, purchase approval, where 6 sites' code lives, Emergent check for OwnMode).
- Note: the auto-approval policy blocks reading Namecheap credentials directly; use domain-manager's server-side actions instead.

## Maestro Artist Studio (done, live)
Deployed to themaestroradio.com/admin/music-factory; verified 200s and full backend run (talk-in 5.4s, suggest 6.3s, draft 4.3s, revise 3.3s). Source pushed: swade-radio PR #6. Lock released. Note for key rotation: also update /opt/swade-secrets/omniroute-maestro.env on Core. Details in Maestro Site Bible.
