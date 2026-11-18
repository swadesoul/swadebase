# Maestro alpha baseline — October 29, 2026

**Current state: owner-approved operator-only alpha deployed October 29, 2026. Broad on-air release remains blocked.** A start/queue record is not working code, execution, playout or deployment evidence.

## Approved operator deployment — October 29

Founder explicitly approved merging PR #4 and deploying the operator-only alpha after reviewing its scope and verification limits. PR #4 merged as `94a98f635e9679c3ddc0be4fef7ba2ed21b44c24`. Staged files matched all 13 approved GitHub blobs before installation. The guarded installer applied the exact reviewed native-host patch, Nginx validation passed, only `maestro-factory` restarted, and Nginx reloaded. No production auth configuration, database migration, AzuraCast/Liquidsoap service restart or live playlist mutation occurred.

Live manager: https://themaestroradio.com/stations/manage . Existing superadmins only; user allowlist is empty. Select a station, then **Alpha review**. Alpha originals remain outside the on-air library and playlists. The root-only disable switch is `/opt/swadebase/var/maestro-alpha/config.json`.

All 11 live deployment checks passed: host/page/script 200, unauthenticated API/upload 401, foreign Origin 403, operator-only gate, private config permissions, unchanged station file paths/playlist counts, unchanged Factory base source and exact installed-manifest hashes. Nineteen backend/HTTP/installer tests passed again with installed modules asserted. The installed code also decoded/analyzed a synthetic MP3 and performed real full B2 readback at `maestro-alpha/20261029/fixtures/host-relay-c1bbe0a8-175f-42c1-96e6-af3a03a681b6/original.mp3`, SHA256 `b42742b4483d6d09452f681092d3eb6ce9209bf059e0a478b3a1ccb0d8b0a528`, 361,787 bytes, verified 2026-10-29T18:44:31.425490+00:00. Original retained. These probes use no live station or database writes.

Public engine readback: Maestro online, no human live input; PET MUZIK offline, no human live input. Maestro's 72 music paths and 3 playlists match the pre-work snapshot; PET's empty library and 4 playlists match. The signed-out browser renders the manager, alpha panel mounts and remains hidden, with no app-script error observed. Full signed-in operator upload, actual Google/preview sessions, physical iPad Safari and two actual users remain unverified. An installed-module synthetic B2 probe does not prove a browser upload.

Rollback receipt: `/opt/swade-repairs-20261029/maestro-alpha-integration/rollback-20261029T184229Z/receipt.json`. Use `host/install_alpha.py --rollback` with this receipt to restore only the named files, preserving all alpha receipts/B2 originals; later edits stop restoration. The actual host restore and human/AI failover were not exercised. Evidence: `ops/alpha-radio/evidence/host-deployment.json`, `host-installation-manifest.json`, `host-installed-tests.log`. Scheduling/ads, alpha DJ booking and paid mastering remain unfinished. Earlier staged-only and blocked-merge notes below are historical and superseded by this explicit approval and deployment receipt.

## Latest repair checkpoint — October 29

Code commit `00c1a77873ac8319c10dc9f6220844cd08cc1313` extends the existing authenticated station host and native manager with operator-only alpha MP3 review. It adds server-side station ownership/entitlement checks, quota reservations, SHA256-bound intents, fixed B2 originals, 24-hour expiry, concurrent-request locking, same-intent retry/reconciliation, real FFmpeg/Chromaprint analysis, full streamed B2 readback, human duplicate review and independently audited metadata corrections. It adds no station/database migration, engine writes, new service, live credentials or paid output. New alpha writes have no Lovable Cloud fallback. Existing cloud data is preserved.

**51 checks passed** on the existing host: 19 backend/HTTP/installer checks, 11 core Python checks, 14 Node checks and 7 existing station-rule checks. Identity in HTTP tests and DOM/XHR in UI tests are explicit fixtures. A separately generated MP3 passed real analysis and real B2 full readback: 361,787 bytes, 15,047 ms, SHA256 `b42742b4483d6d09452f681092d3eb6ce9209bf059e0a478b3a1ccb0d8b0a528`. Fixture retained at `maestro-alpha/20261029/fixtures/host-relay-b2f10a77-03f2-44a2-94d4-16f0aa5bdc24/original.mp3`.

Automatic approval review rejected the default-branch merge, citing the large merge and missing GitHub checks; no deployment was attempted after rejection. GitHub confirms PR #4 is open and ready for review, not draft. Main remains `55976205c5af17288bc0121e89b04d3630c603d3`. There are no GitHub check runs/status contexts for the code commit; remote test logs are separate evidence. The code is staged at `/opt/swade-repairs-20261029/maestro-alpha-integration`. The guarded installer dry run passes; actual runtime files remain at their previous hashes, the alpha module/config are absent, and its public JS is 404. Existing host health is 200. Station file-path hashes and playlist counts match the pre-work snapshot: Maestro has 72 tracks/3 playlists; PET MUZIK has 0 tracks/4 playlists. These are library snapshots, not evidence PET MUZIK is broadcasting.

Review: https://github.com/swadesoul/swade-radio/pull/4 . Evidence and logs: `ops/alpha-radio/evidence/host-*`. The installer backs up exact changed files before applying, validates Nginx and restarts only the Factory host; rollback preserves originals and refuses to overwrite subsequent edits. Install/restore is fixture-tested, not exercised on the live host.

Outstanding acceptance: real Google and framed-preview sessions; two real signed-in users; physical iPad Safari upload/retry; an actual restore exercise; measured human/AI failover. BPM/genre are tagged or manually correctable, not automatic inference. Conversational Program Director, day/week/month planning, exact observed playout, alpha DJ signup/booking and paid mastering remain separate unfinished backlog. The broad release gate stays blocked. The original baseline observations below are historical and do not supersede this checkpoint.

## Scope and authority

Founder requires runtime/Google/preview verification without production auth changes; inspect the existing AzuraCast/Liquidsoap instance; verify B2 and block new alpha cloud fallback; inventory main app and compare Factory selectively; isolate alpha with rollback and no live station/database migrations. Source and runtime credentials remain server-side. No station or production database writes were used in the baseline probes. One small JSON and one synthetic MP3 were saved in a private B2 alpha prefix, using the existing adapter, with full matching readback. No old data was removed.

## Observed evidence

| Check | Result | Actual evidence / limit |
|---|---|---|
| SWADEBASE runtime | PASS | Public config points to `https://swadebase.cloud`; keyed GoTrue health HTTP 200, v2.189.0; Google enabled; adapter health HTTP 200/status ok. |
| Google start, production + preview | PASS for start only | Both `/auth/v1/authorize` requests returned HTTP 302 to accounts.google.com; provider callback is `https://swadebase.cloud/auth/v1/callback`. Main project `b66128c5-9232-47e2-853a-cab847b56554` is confirmed. |
| Google consent/session completion | UNVERIFIED | No actual owner consent, browser PKCE exchange, preview-broker session or physical iPad sign-in was exercised. Auth config was not changed. |
| Existing engine | PASS for observed processes/config | One existing `azuracast` container; station 1 and 3 backend/frontend processes running. Existing Liquidsoap configs contain live input/fallback. No duplicate service or live input test. |
| Maestro Radio playout | PASS for current status | Existing API reports station 1 online, no live DJ; Maestro Rotation has 72 tracks. This does not certify exact future program clocks. |
| PET MUZIK playout | FAIL for current availability | Station 3 reports offline; its four enabled playlists each contain zero songs. Engine running is not working audio. No songs were inserted or station restarted. |
| B2 | PASS | Existing adapter uploaded a 361,787-byte synthetic MP3, full readback SHA256 `215d2317da0142a6217a7e889f196403faa9323d828753386e81cee3690e129a`, duration 15,047 ms, original unchanged. Receipt `ops/alpha-radio/evidence/real-mp3-b2.json`, UTC 2026-10-29T14:55:56.591381+00:00. |
| Alpha safety tests | PASS, isolated only | 11 Python + 9 Node tests passed locally and on Hostinger; real FFmpeg decode/fingerprint/measurement, destination/prefix denial, receipt verification, bounded retry, duplicate review, timing, bookings and release gate. |
| New cloud fallback | BLOCKED in isolated code | Alpha transport accepts only HTTPS B2 S3 endpoints; core accepts only SWADEBASE origin and isolated object prefix. Not yet integrated into the live upload UI. |
| Live human/AI failover, iPad upload, tenant-bound alpha API | UNVERIFIED | Not exercised or deployed; release remains blocked. |

## Source inventory and selective reuse

Main repo `swadesoul/swade-radio` at `55976205c5af17288bc0121e89b04d3630c603d3` is authoritative. Factory comparison ref: `a9d27e3b9b5072a2b03e336764cf4347002f924a`. Do not replace the main app with Factory.

| Area | Main app | Gap / decision |
|---|---|---|
| Runtime/auth | `src/integrations/swadebase/runtimeClient.ts`, `vite.config.ts` alias, `LoginPage.tsx`, `features/signals/AuthCallback.tsx`, preview storage broker | Effective Vite alias already pins SWADEBASE and `maestroradio` schema. The generated `integrations/supabase/client.ts` is not the effective Vite client. Do not claim active cloud fallback merely from that unused file. Preserve auth; verify actual sessions separately. |
| Single/bulk legacy upload | `use-song-upload.ts`, `use-bulk-upload.tsx`, `utils/storage.ts` | Storage-bucket paths; single upload simulates progress, defaults duration to 180s and may auto-approve; bulk uses filename identity/step percentages and duration 0. Preserve old data. Do not port these shortcuts into alpha. |
| Actual library | `features/studio/LibraryPage.tsx` at `/stations/library`, `features/studio/library.ts`, DJ Studio `library` action | Reuse actual engine-backed library, filtering, tagging and playlist tools. `/library` is a placeholder; do not build alpha atop that placeholder. |
| Program calendar | `features/studio/SchedulePage.tsx` at `/stations/schedule`, `features/studio/schedule.ts` | Existing weekly hourly grid/playlist conversion works at source level. It rounds to hours and later overlapping playlists win, so it is not exact ad/playout timing or a conversational month planner. Add exact validation alongside it. |
| DJ Studio | `features/dj-studio/{api,StudioPage,Identity,Personality,Segments,Shows,LiveDJs,StationsPage,StationMedia}.tsx` | Reuse existing authenticated DJ action/native host. Current manager live-DJ controls are not public alpha signup or expiring booking authorization. |
| Native station libraries | Existing `/opt/maestro-assistant/factory/station_libraries.py` | Already has ownership/quota rules, SHA256, original B2 storage and engine playlist readback. Later SFTP/folder/provision fixes exist live beyond draft PR #3. Preserve source separately; do not rerun its production migration in alpha. |
| Factory upload | `music-upload-prepare`, `music-upload-finalize`, `upload-station-track`, `_shared/backblaze.ts` | Consider filename/size and direct B2 intent patterns selectively. The finalize path creates an analysis job and fires an invocation; that is queue evidence only. Do not port completion claims, missing full-readback proof, or Factory auth config. |

## Approved backlog and concrete completion gates

| Backlog | Isolated work now | Still required before calling it working |
|---|---|---|
| Single/bulk MP3 upload | Measured-byte transport, SHA256, bounded same-key retry, full-readback primitive, real decode/quality/fingerprint, review-only duplicates | Authenticated owner-bound prepare/finalize through existing host; UI progress/cancel/retry; independent metadata correction with audit; BPM/genre analysis confidence; two-user and real iPad test. No automatic duplicate deletion. |
| Conversational Program Director | Exact duration/crossfade validator | Reuse existing assistant; day/week/month draft schedules, format templates, ad booking, explicit approvals, conflicts/timezone/DST, playlist readback and observed second-level playout. No job completion from an invocation response. |
| Live DJ alpha | Timezone-aware isolated booking validator; no live credentials issued | Signup/form and reviewed booking persistence; actual host authorization; expiring station-scoped broadcaster credentials; operator controls and measured AI/human/failover acceptance. |
| Radio mastering | Free measured engineering screen; consent/source-bound 500-cent quote primitive | Verified cost-ledger reservation, actual separately stored mastered output, consent bound to source/settings, authenticated $5 checkout, refund/retry policy and audible QA. No sale or mastering output is enabled now. |

## DJ licensing and security review

Focused source review only; no external DJ code executed, installed, embedded or given credentials. No full audit/certification claimed.

| Candidate | Verified source | Alpha decision |
|---|---|---|
| ZAOMixZ | `bettercallzaal/ZAOMixZ` ref `07ca0f0596784e532b4752d4b382d186d52dbac3`; LICENSE blob `66aba9a627671ab5d6efb447cd591601ab27beb1` is MIT with retained notices. `web/dj/Audius.js` requests public Audius services; README advertises library, recording, MIDI/mic, PWA and Go Live, but documentation is not integration proof. | Candidate for isolated prototype after dependency/notices and exact audio-ingress review. Disable external catalog/telemetry and protect music rights; no same-origin embed or station secrets. No observed vulnerability is asserted from external requests alone. |
| MIXI | `fabriziosalmi/mixi` ref `21a30c0b709c21748926da2cc28bad19ff906bda`; LICENSE blob `2fbb5e10f0d0d76f1d2d9da3a5f2faa6f42071b7` is PolyForm Noncommercial 1.0.0. Upstream explicitly requires separate commercial licensing. Source package v0.5.19; SECURITY.md supported-version table only lists 0.3.x. Desktop source enables context isolation/sandbox and disables Node integration; API CORS allows localhost/private LAN and designated upstream web origins. | Commercial incorporation held pending an appropriate license and bounded review. Not a drop-in commercial open-source replacement. Source safeguards do not certify sidecar/API/MIDI/UDP/IPC or browser behavior. No licensing outreach sent. |
| Mixxx desktop | Official download/source terms GPL v2 or later; official 2.5 manual describes Icecast/Shoutcast live output. | Prefer a separately installed desktop client using expiring station credentials once booking/live-test gates pass. Do not repackage without satisfying notices/source obligations, and do not connect to active stations during this baseline. Music broadcast rights are separate from the software license. |

Sources: https://github.com/bettercallzaal/ZAOMixZ ; https://github.com/fabriziosalmi/mixi ; https://mixxx.org/download/ ; https://manual.mixxx.org/2.5/en/chapters/livebroadcasting .

## Isolation, rollback and release state

Source namespace: `ops/alpha-radio`. Host filesystem: `/opt/swade-repairs-20261029/maestro-alpha`. Private B2 keys: `maestro-alpha/20261029/`. No alpha HTTP listener, production route registration, DB schema, credential store, station or scheduler was created. Keep user/owner/intent/evidence authority in the existing authenticated host; pure test functions are not a security boundary for public callers.

Rollback: revert/abandon only the isolated branch; preserve evidence and original tracks. No production service/configuration needs restoring because none was changed by this stage. Do not delete old media or broad B2 prefixes. Future deployment requires passing receipts, exact diff/image, narrow backups, disable switch and a reviewed restore exercise. Current release gate is **blocked**, not queued/deployed.
