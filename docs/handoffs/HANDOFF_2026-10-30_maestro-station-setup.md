# HANDOFF — Maestro Radio: song engine, Station Setup, DJs, commercials (2026-10-30 ~21:20 CT)
Written by Claude (security session) at Swade's request so any AI (ChatGPT/Codex, Grok, Claude) can finish. Follow STANDING_RULES (deploy lock rule 20, Site Bible rule 17, founder exemption rule 21). Never print secrets; they live in /opt/swade-secrets and /opt/swadebase/docker/functions.env.

## DONE + VERIFIED LIVE (server: swadesoul 2.25.74.73)
1. Artist Studio /admin/music-factory: 4 steps, talk-it-in, 3 lyric choices, live progress bar, Push to radio (library + playlists), flagged-word clean+retry. Source: swadesoul/swade-radio PR #6 (branch claude/maestro-studio), server/maestro-factory/. Runtime: /opt/maestro-assistant/factory/factory.py (service maestro-factory :8033), /var/www/maestro-factory/studio.*.
2. Song engine fixed: provider self-check + auto-heal of system pauses, instant start, /admin/kick, non-blocking queue. Songs made: "After the Porch Light" (2 takes), "Soft Edges". "Sideways Love" rejected by provider word filter (use Clean it up and retry).
3. Root cause of the old 403: sunoapi.org's Cloudflare blocks the Python-urllib User-Agent (error 1010). Any Python using urllib must send a User-Agent. requests/Deno/Node/curl are fine.
4. Founder exemption = STANDING_RULES rule 21 (also in memory).
5. DJ Studio script writer (edge fn dj-studio, writeScript) now uses OmniRoute (DJ_SCRIPT_URL/KEY/MODEL in functions.env, maestro app key, capped). Before: local gateway timed out at 45 s, so DJs could not talk. Now 3.2 s. Backup: /opt/swadebase/backups/dj-studio-index.ts.bak-*, functions.env.bak-*.
6. Station Setup page /admin/station-setup (setup.html/js/css) + backend /opt/maestro-assistant/factory/station_setup.py (routes /setup/context|plan|apply via factory.py). Applied to Maestro Radio:
   - DJs: Patrice (mornings + weekend wake-up), Barnabas (drive + Saturday night party), Loretta (nights + Sunday soul); voices set, auto_mode on, talk every 4 songs; 8 liners/drops drafted (approve in /studio to voice them).
   - Schedule (AzuraCast station 1): Maestro Mornings M-F 6-10 (pl 24), Midday Mix M-F 10-15 (25), Drive Time M-F 15-19 (26), Maestro Nights M-F 19-24 (27), Overnight daily 0-6 (28), Weekend Wake-Up Sa/Su 8-12 (29), Saturday Night Party Sa 20-24 (30), Sunday Soul Su 16-21 (31). Each has the 72 Artist Music songs, shuffle (days differ). Unscheduled hours = Maestro Rotation (pl 2, untouched).
   - Commercials & Promos (pl 32, once_per_x_minutes 15 = 4/hr).
   - Schedule backup before changes: /opt/swadebase/backups/maestro-schedule-20261031T02*/ (playlists json, ai_djs, shows).
7. One-off runners (founder session via SWADEBASE admin magic link, no email): run_setup_once.py, dj_probe.py in /opt/maestro-assistant/factory. Delete after use.

## OPEN — DO NEXT (in order)
A. CLEANUP: remove the 36 "DJ Spots/" files from playlist 32 Commercials & Promos (they were loaded by an interrupted first run; they belong only in pl 23 Maestro DJ Spots). AzuraCast batch "playlist" REPLACES a file's playlists: send each file with its current playlists minus 32.
B. SITE COMMERCIALS (Swade request): 7 spots, 30 s each, ending with the domain: ReSing Lab, VideoSayWhat (videosaywhat), SSS Brain (sssbrain.live), Brainiak (brainiak.live), Black Tales (blacktales.online), SwadeSoul.com (Swade Soul World 3D world), The League Sound (theleaguesound.com). Confirm ReSing Lab + VideoSayWhat domains from nginx/Bibles before writing. Read each Site Bible for what it does. Voice with Voicebox (free, existing VOICE_SERVICE_URL /v1/voicebox) using a voice not used by the 3 DJs; add a music bed + loudnorm -16 LUFS (ffmpeg), upload to AzuraCast folder "Commercials/", store masters in Backblaze, add to pl 32. station_setup.py auto-loads only Commercials/ folder files.
C. ROTATION VARIETY: Swade wants commercials spread all day and no duplicate day. Shuffle + avoid_duplicates already; verify a full day of AzuraCast schedule/next songs shows varied order. Optional: per-weekday duplicate playlists he can rearrange.
D. SCHEDULE BY DAY/WEEK/MONTH/YEAR: AzuraCast schedule items support start_date/end_date + loop_once. Add date-range scheduling to the Schedule page (src/features/studio/SchedulePage.tsx + schedule.ts) and to dj-studio save_schedule (currently strips dates; allow start_date/end_date YYYY-MM-DD).
E. SPONSOR DAILY REPORT (Swade request): when a sponsor pays, every midnight (America/Chicago) until their account ends, email them that day's air times for their commercials on every station they bought, the commercial link and each station's listen link. Needs: sponsors table (account end, stations, spot media ids), pull AzuraCast schedule/queue per station, Resend/Mailcow send, link to /station/<slug>. Founder approves before any external email goes live (rule 5).
F. Audio Engine Guard /opt/swade-audio-ops/monitor.py (tested --report): install systemd swade-audio-guard.service + .timer (every 15 min), add RK-013 to docs/learning-approved/repair-kit-known-failures.md (silent provider pause / stuck queue / Python-urllib UA 403), finish read-only sweep of Python scripts calling providers with urllib and add User-Agent.
G. Push to radio default: preselect the 8 "· Music" show playlists + Maestro Rotation in studio.js pushPanel so new songs play in every show.
H. Explainer videos (HyperFrames, high-end): pinned project /opt/swadebase/maestro-explainers (hyperframes 0.8.186, Puppeteer Chrome at /root/.cache/puppeteer). Styles chosen from Motion Studio library: product-launch + glassmorphism + kinetic-type in Maestro brand. One pilot (Artist Studio) for Swade's approval, then each area page: home, radio, stations, station page, schedule, library, artists, artist page, DJs, AI DJ Studio, book studio, submit music, pricing, my signals, artist dashboard, Artist Studio, Station Setup.
I. Docs: push station_setup.py + setup.* + factory.py changes to PR #6 (copy byte-identical, md5 check); update Maestro Site Bible + this handoff; release DEPLOY_LOCK lines by "claude (security session)".

## Rollback
- Schedule: restore playlists' schedule_items from the maestro-schedule backup json; delete playlists 24-32 and DJs Patrice/Barnabas/Loretta if needed.
- Factory: /opt/swadebase/backups/maestro-engine-progress-*/ ; Studio: maestro-studio-lyrics-*/ ; dj-studio + functions.env backups as above, then `docker compose up -d --no-deps functions` in /opt/swadebase/docker.

## UPDATE 21:25 CT
- A DONE: 36 DJ Spots removed from Commercials & Promos (pl 32 empty); DJ Spots pl 23 intact (36).
- B IN PROGRESS: scripts written by Claude from each live site's own title/description: /opt/swade-audio-ops/commercials/scripts.json (7 spots, ~30 s, end with domain: resinglab.com, videosaywhat.com, sssbrain.live, brainiak.live, blacktales.online, swadesoul.com, theleaguesound.com). Recorder: make.py [slug] -> Voicebox (VOICE_SERVICE_URL :8790) -> loudnorm -16 LUFS mp3 -> Backblaze maestro/commercials/<slug>.mp3 -> AzuraCast Commercials/<slug>.mp3 -> pl 32. Log lines DONE/FAIL per spot. Voices: Tyler, Maya, Mr Freq, Millie, Javier, Mr. Swade - VirtTeach (SwadeSoul.com), Alexis (Alex). Optional upgrade: music bed under each read.
- T3 question answered: no T3 product; Swade means OmniRoute (multi-account AI router with fallback chains and per-app caps).
- J NEW REQUEST — Commercial Studio (Swade 21:21 CT): page where he enters product name + website (+ notes, length 15/30/60, tone); backend fetches the site (title, meta description, visible headings), AI (OmniRoute) writes a professional script in the style of scripts.json (hook, 3 real benefits from the site only, tagline, spoken domain at the end, no unverified claims like prices/registrations), lets him edit, pick a Voicebox voice, Record -> same make.py pipeline -> Commercials & Promos. Reuse factory ai() + station_setup patterns; route /setup/commercial-* or new /commercials/* in factory.py.
- E sponsor midnight report also covers: one sponsor can buy spots on multiple stations; report lists each station's listen link.

## UPDATE 21:45 CT (Claude)
- B DONE + VERIFIED: all 7 site commercials in AzuraCast Commercials/ (media 195,196,198,199,200,201,202), each in pl 32 Commercials & Promos (4/hr). Masters in Backblaze maestro/commercials/.
- J DONE: Commercial Studio v2 at /admin/commercials. commercials.py now runs write + record as in-memory background jobs with named stages; new POST routes /ads/job {id} (live status, per-step seconds) and /ads/list (everything in Commercials/ with in-rotation flag, signed listen link, plays-per-hour). Page (ads.js v2 + new ads.css) shows: "On the air now" panel with play buttons; live checklist with spinner + running timers for each step (write: open site, read, write, check address; record: voice check, record, level -16 LUFS, Backblaze, upload, add to rotation, on air); remembers form, draft and last voice. Fix: a written domain in the AI script is converted to the spoken form instead of appending a duplicate. Verified live: list 200 (7 spots), voices 19, write job 3.2 s, bad input 400. Record path not re-run (would publish a spot); logic unchanged except stage calls. Jobs live in process memory: a service restart drops in-flight job status (the page says "start it again").
- Artist Studio progress (Swade: "see everything happening, the progress of the songs"): the "Now making" tray added at 02:25 UTC had no CSS; added .tray styles (sticky at top of every step). New liveTick moves song bars, % and timer notes every 1 s between the 12 s server polls without re-rendering (buttons/audio untouched); tray removes itself when nothing is live. studio.html v6.
- Backups: /opt/swadebase/backups/maestro-progress-ui-20261031T022741Z (commercials.py, ads.*, studio.*).

## UPDATE 21:55 CT (Claude) — DJ named the wrong next song
- Root cause: auto-mode writes 2 breaks ahead with song_coming_up captured at write time; they air whenever playlist "AI DJ: <name>" (once_per_x_songs) slots them, often 20-40 min later. Example: seg 1918703a written 02:17 UTC for "Same city different life", cued at 02:36 between "eMastered Level up season" and a DJ Spot.
- Fix written, NOT yet running continuously: /opt/swadebase/signal/dj_cue_fix.py. When a break is in the AzuraCast queue and not yet sent_to_autodj, it rewrites only the song lines (OmniRoute DJ_SCRIPT_*), re-voices (Voicebox, same DJ voice), replaces the file at the same path, resets metadata album=seg-xxxx, keeps the old script in facts.script_before_cue_fix. If the next song isn't visible when the break is next in line, the song name is removed instead of guessed.
- BLOCKED: installing maestro-dj-cue.service/.timer (every 20 s) was denied by the session's safety check. Needs Swade's OK. Unit text: oneshot ExecStart=/usr/bin/python3 /opt/swadebase/signal/dj_cue_fix.py; timer OnUnitInactiveSec=20.
- Timing finding: AzuraCast hands the next item to Liquidsoap ~1 song early (autodj_queue_length=3), so the song after a break is often not visible before hand-off. Recommended (needs OK): raise station 1 autodj_queue_length 3 -> 5.

## 2026-10-31 06:51 UTC — DJ wrong-song fix is LIVE (Claude, Swade said "finish everything")
- systemd: maestro-dj-cue.timer runs /opt/swadebase/signal/dj_cue_fix.py every 20 s (oneshot, 170 s timeout). Logs: journalctl -u maestro-dj-cue.
- AzuraCast station 1 autodj_queue_length 3 -> 5 (saved; takes effect at the next station/backend restart — not restarted live to avoid a dead-air blip).
- Rollback: systemctl disable --now maestro-dj-cue.timer; set autodj_queue_length back to 3.

## 2026-10-31 07:15 UTC — Rotation sign-up, giveaways, Stripe prices (Claude; Swade: "finish everything", "merge and deploy")
- Stripe (Swadesoul acct acct_1SizGm43OPTHaIwn): products/prices for all 8 plans + yearly; ids in maestroradio.rotation_plans (stripe_product_id, stripe_price_id, stripe_price_id_yearly). Script: factory/stripe_rotation_prices.py (idempotent, lookup_key maestro-<slug>-<interval>).
- Pages: /rotation (6-step carousel), /giveaways (free claims, 18+, one per email, atomic RPC maestroradio.claim_giveaway), /admin/rotation (review: approve = import to radio, album "Paid Promotion · Maestro Radio", plan show playlists, DJ notes in song_profiles, giveaway on; decline = full Stripe refund + sub cancel).
- Backend: factory/rotation_signup.py via factory.py prefix /rotation/; tick calls rotation_signup.expire (ends placements, renews from Stripe subscription period). nginx snippet /etc/nginx/snippets/maestro-rotation.conf. Migration: factory/migrations/20261031_rotation_signup.sql. Cover design: Swade Video Router app 'maestroradio' (still, ~$0.03, caps $2/day $20/mo), 3 free per sign-up.
- Payment is confirmed by reading the Checkout Session from Stripe (no webhook); review list re-checks any 'checkout' rows.
- dj_cue_fix.py: paid next song -> DJ must say "paid promotion"; mentions active giveaway. Product Terms B2.3 reworded to match.
- Backups: /opt/swadebase/backups/maestro-rotation-signup-20261031T065813Z (factory.py + nginx), dj_cue_fix.py.bak-*, 02-product-terms.md.bak-*.
- Test data removed; 4 test Checkout Sessions expired.

## UPDATE 2026-10-31 ~02:40 CT — status
DONE: A (commercials cleanup), B (7 site commercials on air in pl 32), F (Audio Engine Guard timer live + RK-013 in Repair Kit), J (Commercial Studio /admin/commercials live; analyzer tested 3.3 s; record path uses same pipeline as the 7 spots), "Now making" tray, all code in PR #6 (byte-identical to live), locks released, Site Bible updated.
STILL OPEN: C verify day-to-day variety in a real day of playout; D date-range scheduling (day/week/month/year); E sponsor midnight report; G push-to-radio preselect show playlists; H explainer videos (HyperFrames); signed-in browser test of /admin/station-setup and /admin/commercials by Swade; delete one-off runners run_setup_once.py + dj_probe.py when no longer needed; OmniRoute key rotation awaiting approval.

## UPDATE 2026-10-31 ~03:00 CT (Claude, separate session)
- I DONE: all live factory/web/ops code pushed byte-identical and merged (swade-radio PR #6 -> main d24a2f1).
- NEW: /stations/manage rebuilt as a 4-step upload carousel (live; PR #7 open awaiting Swade's merge OK). Details + rollback in the Maestro Site Bible.
- Test harness: /opt/swadebase/staging/maestro-stations-*test.cjs (puppeteer, fake backend).
