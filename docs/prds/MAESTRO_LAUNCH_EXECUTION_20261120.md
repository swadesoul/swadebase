# Maestro Radio Launch — Release Execution & Gate Status
Date: 2026-11-20 America/Chicago (21:03 CT checkpoint)
Founder scope: all previously approved Maestro radio and ReSingLab integrations to launch without breaking operating player. This grants controlled deployment of completed verified changes, NOT a waiver of payment, email, rights, security or live-stream gates.
Status: PARTIAL IMPLEMENTATION, NOT FULL LAUNCH. Recheck before claiming shipped.
## Verified live baseline
- https://themaestroradio.com/ and https://themaestroradio.com/maestro-mix/ returned HTTP 200 from the Hostinger instance in this execution. Status code is not proof that every feature works.
- Active front-end symlink points to /var/www/maestroradio-web/releases/20261121T0115Z-shared-covers. Preserves live station turntable and cover art improvements.
- GitHub main at audit: fcbd3b98e16c7cc17b76ea1f0d2aca6ccd59a29f; old local /opt/work/swade-radio is a dirty feature worktree and must not be deployed wholesale.
## Actual source implementation this execution
- Isolated worktree /opt/work/maestro-launch-intake-20261120, branch feat/maestro-launch-intake-15mb-20261120, commit 8802b7788e46127abdb4c75b3628942456e249a8.
- Pull request DRAFT https://github.com/swadesoul/swade-radio/pull/35. Not merged and not deployed.
- Changed /submit-music input drop/picker/submit to reject files >=15,000,000 bytes, and direct use-song-upload boundary to reject files >=15,000,000 bytes.
- Legacy public song creation now writes status='pending' rather than 'approved', no longer adds to arbitrary playlist or triggers automatic AzuraCast sync. Submission acknowledgement now accurately says producer review pending.
- Generic existing station-library upload limits and backend remain UNCHANGED by this frontend-only patch.
- Verified git diff --check, tsc --noEmit and npm run build (Vite production built; existing bundle-size advisory). No signed-in actual backend upload test; this gate may require backend source coordination. Do NOT merge until complete.
## Release tracks, order
1. Prepare paid/free order-entitlement to email form intake from PRD MAESTRO_EMAIL_ORDER_INTAKE_AGENT_20261120.md. Validate signed Stripe webhook + sender domain + sender-controlled inbox; verify from account, never trust email instructions.
2. Extend server-owned upload boundary (<15MB) and proper media validation, rejection on oversize Content-Length and measured bytes, B2 owner-isolated quarantine. Avoid accidental impact to existing station upload.
3. Confirm pending status / admin review actual production database, rights and approvals, safe publishing path. Run verified full authenticated upload and producer approval through correct station ID; only then merge/deploy draft PR35 with guarded release process and backup.
4. Build Maestro Explicit station under MAESTRO_Explicit_16plus_Station_20261120.md: sign-in + SERVER-verified 16+ entitlement, protect direct streaming mount and source/metadata, distinct clean vs explicit catalog, comprehensive security test. No public link or direct source access until auth tests pass.
5. World/Gospel station launch: ReSingLab local chart-led original production, 50 unique songs per station (40 curated broadcast + 10 reserve), one original alternate take per composition reserved untouched for Maestro Mix. Fresh creator license and audio/cover QA, station UUID and live playback validation. No new spending or media generation is assumed authorized.
6. Maestro Mix featured daily 2 alternate recordings from each World/Gospel station (20/day), deterministic daily unique slate, no yesterday repeats when pool supports; opt-in previews, no giveaway-content on broadcast; secure winner identity/rights and claim ledger.
7. Native ReSingLab voice system with existing DJ voice samples for books, talk, morning shows, world-language announcements once authorized voice consent and tested synthesis/auditions. ElevenLabs optional fallback, not a hard dependency.
8. Final launch proof: main player, vinyl/needle, deck lights, paid/free artist and business email workflow, advertiser disclosure, verified scheduled on-air receipt, direct 16+ age denial, streaming rights, 10/20-song no-interruption, iPad Safari, phone, desktop, source/branch checks, backup & rollback and customer receipts. Only checked passing features promoted.
## Blockers currently known
- Maestro Resend domain sender authority and inbound email receiver must be freshly verified; prior record notes sender domain authorization failed.
- Age-gated streaming cannot be secured with client screen alone; underlying AzuraCast stream must be private/protected.
- Source PR35 not backed by a server-size check; pending schema/approval route unverified. Merge blocked by release gate.
- Missing approved songs and prize rights means World/Gospel 40 rotations and daily Mix feature cannot be represented as live yet.
- No specific external AI/media provider spending authority; auto-generation is forbidden absent a bounded existing grant.
## Execution checkpoint counts
- 1 new isolated code branch, 1 GitHub draft PR, 1 TypeScript pass, 1 Vite production build, 0 merges, 0 production code changes, 0 stations created, 0 radio uploads, 0 customer email, 0 checkouts, 0 external provider spend, 0 new live features deployed.
- Preserve /var/www/maestroradio-web/current until all release gates pass.
## Review and rollback
On future implementation, use GitHub main worktree based on live commit and review changes; back up live symlink and affected server modules, test on staging, merge after backend review, deploy with the supported release pipeline, live smoke, rollback symlink and backend files if any regression. Protect actual station playlist and owner data. Update all Bibles, knowledge index and What's New with verified statuses. The older docs with planned-only specs are not proof of readiness.


## Fresh sync checkpoint — 2026-11-20 21:07 CT / 2026-11-21 03:07 UTC
This audit is read-only and reconciles work done by other operators AFTER the earlier launch plan. Latest exact remote main `fcbd3b98e16c7cc17b76ea1f0d2aca6ccd59a29f`, live Maestro site `/var/www/maestroradio-web/releases/20261121T0115Z-shared-covers`, site HTTP200; no deploy in this audit.
CRITICAL NEW REUSE: Maestro Bible records **seven** founder-supplied Morning Mix DJ voice ID samples imported into native ReSingLab Voicebox, CPU LuxTTS on swadebase-2, with mapping /opt/swadebase/signal/resing_voice.py, DJ render/cue fallback updated, 4 station lineups with breaks each 4 songs, DJ playlists Surrinda R&B #91 and Shane Hip-Hop #92. `swade-voice-worker` service and `maestro-factory` service active; active DJ and radio timers confirmed. The previous Bible note that saved ElevenLabs voices were missing is SUPERSEDED for these seven recovered/imported voice references. Do not create duplicate voices or default to GPU/ElevenLabs. Log contains historical 503 cache retry and duplicate Barnabas capture; following record states Barnabas captured by hand. This audit does not establish a fresh real-time successful DJ on-air break for every seat.
NEW HOUSE ADS: Maestro Bible documents seven 25–31s voiced and bed-ducked house commercials produced using ReSingLab CPU voices, B2 masters under maestro/commercials/house-20261121, ad files on main/Hip-Hop/Pop/R&B and configured every 15min; three missing advertiser-record vinyl presets still identified. Do not regenerate commercials. Confirm actual play logs before asserting airings.
MAESTRO MIX independent repo: `swadesoul/maestro-mix` main 07960f9 exactly matches live /var/www/maestro-mix/dist/index.html via SHA256 6cde386e...; preserve it as source of truth, do NOT edit old `swade-radio/ops/maestro-mix-index.html` copy. Current Mix returns HTTP200 but the 20/day World/Gospel rotation and secure downloadable prize ledger remain separate pending features.
COVER LOOKUP: live 20261121T0115Z-shared-covers, shared lookup based on verified source. An arbitrary unmatched title query returned 404, which is not evidence of a regression; check known existing song with current artwork for actual acceptance. Bible lists missing art on 9 PET MUZIK and roster recordings. Gospel route HTTP200 is SPA behavior, NOT proof of a real Gospel station stream, music library or secure age-gated station.
UNCHANGED BLOCKERS: owner-approved paid email invitation intake, 15MB server enforcement and new explicit 16+ station are still not verified as deployed. The earlier draft PR35 includes changes to legacy public upload; rebase/check current backend paths before merging. No customer emails, payments or production mutation in this read-only sync.
