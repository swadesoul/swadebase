# Runbook — Move SSS Brain app from swadebase-2 to swadesoul
Approved by Swade 2026-10-30 08:54 CT. Status: **PAUSED 2026-10-30 15:10Z, premise corrected; awaiting founder choice (see Correction).** Execute only when no other lock is held on swadebase-2 or sssbrain.live.

## Why (verified 13:55–14:05Z)
- Today: app = Coolify `g1406wexcvceencavj1fuo0u` on swadebase-2 (2 CPU / 8 GB, ~340 MB free); fqdn sssbrain.live + www; repo swadesoul/sssbrain main, Dockerfile, port 3000. DNS sssbrain.live / www -> 2.25.96.150 (Namecheap).
- Almost every dependency lives on **swadesoul** (8 CPU / 32 GB, ~20 GB free): SWADEBASE DB (schema sssbrain), voice engine 172.16.0.1:8795 (today reached through ssh tunnel service sssbrain-voice-studio-tunnel), render worker /opt/sssbrain-render-worker 172.16.0.1:8794, TTS adapter 127.0.0.1:8796, VoiceBox 172.16.0.1:17600, Ollama 127.0.0.1:11434.
- **Broken today:** FFMPEG_RENDER_URL / RENDER_HOST = 172.16.0.1:8794 on swadebase-2, where nothing listens, so SSS Brain renders fail. BLACKTALES_HEALTH_URL=http://127.0.0.1:3210/ is unreachable from inside the container (dead check).
- Coolify already has swadesoul as server id 1 "swadebase" (reachable, usable, proxy NONE because host nginx owns 80/443). No apps deployed there yet.

## Steps
0. Lock line in /opt/swadebase/docs/DEPLOY_LOCK.md (swadesoul). Back up: the Coolify app row + env (encrypted export via Coolify), the current image tag, the nginx vhost /etc/nginx/sites-enabled/sssbrain.live (old, http-only to :8913, stale).
1. **STT on swadesoul:** restart the stopped `sssbrain-stt` (`docker update --restart=unless-stopped`), but **NOT** `sssbrain-stt-tunnel` (it exposed STT publicly via a cloudflared quick tunnel; keep it removed).
2. **New Coolify app on server 1** (clone of g1406, same repo/branch/Dockerfile/env). Destination network must give the container gateway 172.16.0.1 (as the original swadesoul deploy did) and also reach sssbrain-stt. Publish only `127.0.0.1:<free port, e.g. 8920>:3000`. Temporary fqdn: none (nginx handles it).
   Env changes: LOCAL_STT_TRANSCRIBE_URL -> swadesoul sssbrain-stt; LOCAL_TTS_URL -> swadesoul TTS (bind or bridge 8796 so the container reaches it); SWADE_VOICE_ENGINE_URL stays 172.16.0.1:8795 (now local); fix BLACKTALES_HEALTH_URL -> http://172.16.0.1:3342/ (live marquee-live2) or https://blacktales.online/. Everything else unchanged. **Do not** change the AI provider in this step (OmniRoute switch is a separate change).
3. Test on `https://sssbrain-test.2-25-74-73.sslip.io` (cert exists, valid to 2026-12-27): login (SWADEBASE GoTrue), /home chat stream, knowledge search, voice STT+TTS, a small render, DB writes in schema sssbrain, admin path. Compare against the live site.
4. **Cutover, zero TLS gap:** copy the current sssbrain.live / www Let's Encrypt cert from swadebase-2 coolify-proxy (traefik acme.json) into nginx on swadesoul; vhost sssbrain.live + www -> 127.0.0.1:8920 with websockets/SSE (proxy_buffering off). Then **Swade changes 2 DNS A records at Namecheap** (sssbrain.live, www) 2.25.96.150 -> 2.25.74.73. Optional bridge until DNS propagates: swadebase-2 coolify-proxy forwards sssbrain.live to swadesoul.
5. After DNS resolves: `certbot --nginx -d sssbrain.live -d www.sssbrain.live` for auto-renew; GitHub -> Coolify auto-deploy on the new app; voice tunnel service on swadebase-2 disabled (no longer needed).
6. Old app g1406 on swadebase-2: **stopped, not deleted**, for 14 days. Also stop swadebase-2's sssbrain-stt, sssbrain-tts and sssbrain-stt-relay services only after a 48h clean run.

## Rollback (minutes)
DNS A records back to 2.25.96.150, then start the old g1406 container in Coolify. Data is untouched either way (same SWADEBASE DB).

## Done means
sssbrain.live served from swadesoul; login, chat, voice, render, knowledge and admin verified on iPad Safari + desktop; renders work (fixed); swadebase-2 freed of SSS Brain; Site Bibles (SSS Brain + SWADEBASE) updated; handoff written.

## Follow-ups (separate, approved direction)
- SSS Brain chat currently calls OpenAI gpt-5.5 directly (SSSBRAIN_AI_PROVIDER=openai, fast model gpt-5.4-mini). After OmniRoute's ledger + hard stop are verified, route chat through OmniRoute local-first.


## Correction (2026-10-30 15:10Z) — read before executing anything above
- swadesoul's `sssbrain-stt` is **a forwarder** (image swade-forward:1) to swadebase-2's STT relay, not Whisper. swadesoul's 172.16.0.1:17600 is **swade-voicebox-forward**, which forwards to VoiceBox on swadebase-2. Port 8796 on swadesoul is **VideoSayWhat studio**, not TTS. **All heavy voice models run on swadebase-2** (VoiceBox, Whisper STT, and VoiceStudio/videosaywhat-studio-engine at 3.5–4.3 GB RSS when its models are loaded; see RK-004).
- The SSS Brain app container itself uses ~56 MB. Moving only the app frees almost nothing on swadebase-2 and adds cross-server hops for voice. Steps 1–2 above (STT/TTS env) are WRONG as written.
- **The real consolidation** = move the voice stack (VoiceStudio engine, VoiceBox, Whisper STT + the sssbrain-tts adapter) **and** the SSS Brain app to swadesoul together; swadebase-2 keeps Coolify, OmniRoute, Rakazo/agents. This resolves RK-004 option (a). It needs its own runbook (model download sizes, CPU contention with AzuraCast on swadesoul, relay/forwarder retirement).
- **Fixed instead (15:08Z, reversible):** renders were broken (the app's FFMPEG_RENDER_URL 172.16.0.1:8794 pointed at nothing on swadebase-2). Added `sssbrain-render-tunnel.service` on swadebase-2 (ssh -L 172.16.0.1:8794 -> swadesoul render worker, same pattern as sssbrain-voice-studio-tunnel). Verified from the live app container: authenticated /health 200 (service sssbrain-ffmpeg-render); token fingerprints match. Rollback: `systemctl disable --now sssbrain-render-tunnel`.
