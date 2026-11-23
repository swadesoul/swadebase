# Maestro Radio — November 20, 2026 release record

**Owner:** Swade. **Implementation:** ChatGPT with independent frontend, native rotation, and QA reviews. Times in the listener schedule are America/Chicago. This record separates verified production behavior from prepared work that has not aired.

## Live station and player changes

The initial core frontend was deployed at 19:08:06 UTC (1:08 PM Central). Station selection stops and unloads the previous stream immediately, prepares the selected stream, and performs a six-second record exchange before making that stream audible. The needle lifts, the record brakes and exits right, the selected station record enters, and the needle returns. Rapid changes use revision guards so an older request cannot restart the wrong station. Reduced-motion mode uses a short transition. Song changes and commercials update artwork without repeating the station-switch animation.

The homepage, station hub, and station links now lead to each station’s own page. Seven coordinated identities are installed: Maestro Radio Mix, Hip-Hop, R&B, Pop, Country, Gospel, and Rock. Mix, Hip-Hop, Pop, and R&B have verified real feeds. Country, Gospel, and Rock are labeled as previews because they do not yet have real station engines.

Vinyl treatments vary by song while drawing restrained colors from its cover art. Artist and title appear in rotating edge text and a readable stationary caption. Artwork failure has a quiet fallback; the needle remains clear. Only explicitly marked advertisements, promos, and shout-outs use advertiser records. The creator supports the ten supplied brand identities, existing art uploads, and saving through the station’s authenticated media tools.

The installed art package contains 24 original transparent PNGs and 24 optimized WebP derivatives: seven station logos, seven station records, and ten advertiser records. These are raster assets, not a claim of vector or print-certified merchandise files. Web derivatives total 5,805,602 bytes versus 49,883,777 bytes for the originals. Original files remain preserved.

All four live native station records now point to their verified new WebP logos, including the previously empty Hip-Hop, Pop, and R&B records. This was applied at 19:30:58 UTC after checking the public image bytes and MIME types.

The existing push-first now-playing implementation is included. Its shared `live-now-playing.ts` is byte-identical to the separately staged b7b8cf7 correction. Do not deploy the older now-playing-only staging release over this broader release.

<!-- maestro-turntable-release-20261120 -->
## Turntable motion and Deck lights — live follow-up

The turntable-only release was verified live at 23:32:49 UTC on November 20, 2026 (5:32 PM Central). The vinyl now uses composited rotation at 33⅓ RPM. The needle follows the live song’s elapsed time and duration from 21.6° to 39°, with a 700 ms reset for the next song. The six-second station exchange is preserved. Bottom Deck lights controls persist Auto Artwork (default), Station, Manual, 120-second Cycle or Off, brightness, and reduced-motion preferences.

The final build passed desktop and 390 px real-stream checks plus 48 fixture browser checks. The release passed 447/447 deployment checks across 38 SPA entry points and 48 artwork assets. Final live 390 px smoke loaded index-DophLcRY.js, observed three advancing record transforms and actual late-join needle progress from 75.68% to 76.40%, and applied/saved manual blue Deck lights without interrupting rotation. Controls fit without horizontal overflow; runtime page errors were zero. Raw smoke is seven passed assertions and one incorrect harness expectation, preserved unchanged. Review confirmed that the finite 550 ms pause coast correctly ends with animation state finished (not paused), animation time 550, Play UI and a paused needle. The listener was paused and the browser closed. No browser rerun or frontend change was used to relabel the raw result.

The first 23:30 deployment attempt automatically rolled back because the public intro includes an existing 152-byte Nginx helper injection. The operations-only correction checks the preserved public baseline separately from the exact disk file. Public intro SHA256 bcb6e87bbd33fbff2affab9f51fcdbadfa3465de947f2a10e9205fcc962ad24d and disk intro SHA256 131530d4410d4cbbcc008d4970c013d79daab5249264a4a970a3c533bfb1998a were preserved. Nginx configuration, intro content and premiere media were not changed.

Broadcast Modes remains uninstalled and pending hook approval. Its proposed shared station DJ slot would provide a configured interval of about five songs; this is not a promise of five completed music recordings. Announced 10/20-song modes still require verified native activation and matching ready announcement audio. Swadesoul visual work remains unchanged and deferred until Maestro completion.

Live verification artifacts: /tmp/maestro-live-vinyl-smoke-20261120/report.json and /tmp/maestro-live-vinyl-smoke-20261120/reviewed-verdict.json.

## Library control and rotation cleanup

Pause Rotation / Resume Rotation is available in Station Library, Song Details, and DJ Studio Media. It changes broadcast eligibility while preserving the library recording, site links, audio bytes, and media identity. A recording already on air may finish. Verified queued copies are removed; ambiguous alternate recordings require review. Resume restores the saved original path and still-valid playlist memberships after checking ownership and the audio fingerprint. It does not invent a new placement or restore stale queue entries.

Authorization uses the original user bearer, the native station entitlement, actual admin/super-admin roles, and the existing trial station-tools gate. Current family-admin recordings can be held across verified family copies. Independent customer stations remain scoped to their owner. Durable operation IDs and snapshots make interrupted requests retryable. A partial failure remains visible rather than being reported as a successful rollback.

Seven recordings whose title or basename starts with `eMastered` were removed from 63 playlist memberships and moved to a metadata hold. Their files, titles, audio hashes, public artwork, and media IDs were preserved. They are in the new hold ledger and cannot resume until their display titles are corrected:

- eMastered Maybe Nobody Owes U
- eMastered Choose me again
- eMastered DIFFERENT NOW 2
- eMastered Level up season
- eMastered My Peace
- eMastered No more broke days
- eMastered Stay Solid 2

The upload handler now verifies the actual folder, owner, plan, upload identity, and category before reading the file body. Ordinary music, ad, bumper, and liner uploads keep their 80 MB limit; only real show folders receive 400 MB. The same context is revalidated after receipt. Family-wide holds are limited to the explicitly declared Maestro genre stations and the platform Mix; an unrelated station owned by an administrator stays station-scoped.

Twenty-one old commercials and 24 old spoken station IDs were removed from active rotation and queues across Mix, Hip-Hop, and Pop. Their originals remain archived. No active legacy audio was found in the three inspected AI-DJ playlists. No library file was deleted.

Automatic approval review rejected retiring 528 historical draft/approved/failed scripts because status and age did not prove that every script was obsolete. No script status was changed, and that rejected bulk action was not retried through another route. The targeted old audio is out of rotation; historical scripts remain intact.

## R&B and Maestro Mix

Maestro R&B is public and live with 32 qualified existing recordings, eight daypart playlists, and 55 clock slots. Its stream returned MPEG audio and passed a five-second decode. The existing morning-show blueprint remains inactive pending actual host audio.

The 25-song **Room for Real Life** collection is saved as native private drafts, spanning solo men, solo women, male groups, female groups, and bands. There are 25 text drafts and zero newly generated R&B audio recordings in this release. The separate earlier PET music generation allowance was already consumed and was not reused.

The family audit verified 107 genre-station placements representing 97 unique recordings already present in Maestro Mix. The automatic updater now recognizes the native catalog’s `active` state and verified copy provenance. The live reconciliation mapped all 107 placements with zero new copies, zero downloads, and zero deferrals. Future qualifying family uploads use the existing five-minute refresh; independent customer material, private/draft items, held music, PET music, and nonmusic are excluded. Unknown identities defer instead of creating an unverified duplicate.

## PET MUZIK with Layla

**The listener roll-call capability is live; the hosted broadcast schedule is planned and not activated.** The public page says the show is being prepared and that submitting a name does not guarantee airtime. The standalone PET station keeps its current operation.

| Broadcast | Days | Central time | Recording |
|---|---|---|---|
| New original | Monday, Tuesday, Thursday, Sunday | 9–10 AM | A new one-hour episode |
| Same-day replay | Tuesday, Thursday | 11 PM–midnight | That morning’s exact episode |
| Weekly marathon | Sunday | 8–9 PM | Monday’s original |
| Weekly marathon | Sunday | 9–10 PM | Tuesday’s original |
| Weekly marathon | Sunday | 10–11 PM | Thursday’s original |
| Weekly marathon | Sunday | 11 PM–midnight | Sunday’s original |

This is four originals plus six replay hours, totaling ten weekly hours. PET music is intended for these Mix slots only. Original editions cannot repeat a composition used in either of the preceding two original morning editions. Exact evening and marathon replays are the explicit exception.

Layla has exactly four planned appearances: the opening welcome; **Layla’s Pet Fix** around :15; **Layla’s Pet World** around :30; and **Helping Paws / Layla’s Pet Roll Call** around :55. Her tone is warm, fun, and natural. The first three appearances invite submissions; the final appearance reads the approved list. Review closes at 9:45 AM, with at most 20 names within the final spoken segment’s time budget. Replay consent is explicit and distinct from public display consent.

The configurable initial species registry includes dogs, cats, birds, fish, pigs, iguanas, snakes, hamsters, guinea pigs, and ant farms. Pet Fix topics can come from recurring Reddit questions; care guidance must be verified with appropriate professional sources. Pet World covers international conventions, shows, support programs, films, and documentaries using official dates and clear recorded-as-of wording. No invented events, identifying social stories without consent, or unlicensed film clips.

The existing PET station contains 29 recordings totaling 86.22 minutes. An already-generated 25-composition technical shortlist adds a possible 79.23 minutes, but none of those candidates was newly approved, selected as a master, or imported. Conditional combined duration is 165.44 minutes; listening approval, composition deduplication, quarter-hour fit, and finished episode mastering remain necessary. Every original must become a verified 3,600-second immutable master, with frozen music, spoken segments, roll-call list, and hash reused for its replays.

The PET-to-Mix audit compared all 29 PET recordings with 192 Mix entries, 177 catalog rows, and the main upload ledger. Original-master hash comparison and encoded-audio comparison against 42 duration-compatible Mix recordings found zero exact matches and zero errors. No Mix recording was removed on speculation. A distinct transcode or remix is outside that exact-recording identity conclusion.

## Broadcast Modes — follow-up in progress

The requested reusable station capability has four modes: normal programming with a proposed shared station DJ slot configured for an interval of about five songs; an announced uninterrupted ten-song run; an announced uninterrupted twenty-song run; and a music-only day. A sponsor is optional and belongs in the pre-run announcement. No ad, ID, promo, shout-out, or DJ break belongs inside a ten- or twenty-song run. Music-only day suppresses spoken interruptions entirely.

Broadcast Modes is uninstalled and pending approval of its integration hooks. The proposed normal interval is not an exact completed-music counter. Activation must require proven native exclusive playback, real track-completion receipts, hold-aware queue handling, DJ generation suppression, recovery of prior settings, and suitable ready announcement audio for ten/twenty songs. A drafted script or an engine playlist-loading callback is not proof that the announced songs aired. Day boundaries use the station’s local timezone, including daylight-saving changes.

## Voice / key work still blocked

Ten product commercial scripts and 56 station-specific liners are prepared. New ads and replacement DJ liners have not been generated or aired. The connected ElevenLabs workspace does not expose the seven saved Maestro DJ voice IDs, including Layla. No replacement API key was provided through an authorized secret path, and the Coolify key has not been rotated. The existing sign-in wall and account mismatch must be resolved before voice generation and connected-service validation can finish.

No substitute voice is being passed off as a saved Maestro DJ. No new paid voice or music generation was submitted in this release interval.

## Verification and practical limits

- Frontend: 86 tests, 396 assertions, TypeScript check, and production build passed for the core release.
- Browser: 47 core checks plus seven focused mobile-lineup/PET checks passed, with zero runtime errors. Two simultaneous isolated Chromium listeners retained independent playback, mute, rapid selection, and cancellation, with at most one audible stream per listener. This is not a Safari/device-farm or high-load concurrency certification.
- Native: the current combined library, hold, family, and boundary-review suite passed 75 tests in 2.267 seconds. An independent reviewer reran the 15 new boundary tests successfully. Eight simultaneous synthetic oversized upload requests made zero body reads; this is fixture evidence, not an eight-user production load certification.
- PET: 18 tests / 78 assertions and Deno helper checks passed. Public production info returned 200 with planned status and ten species; unauthenticated submission returned 401.
- Initial core static deployment: 184 live HTTP checks passed. All 48 asset hashes and MIME checks passed. Existing intro and premiere media hashes were preserved.
- Pause/Resume real signed-in browser roundtrip was not performed. Native state checks, isolated tests, ownership/authorization cases, and anonymous HTTP denial were verified.
- The observed local startup artwork transfer dropped from 18,594,180 to 1,088,064 bytes. This is an observed build comparison, not a cellular or field-performance guarantee.

## Release evidence and recovery

Source repository: `swadesoul/swade-radio`, core PR31. Static source: `6c1a2ea19797e7cbf77670d9a0616f6df4b5acba`. Native family-sharing follow-up: `4dda6f12c732875c9cb9db51a28bb50fb35de263`; subsequent boundary fixes: `4a86cb41769a45b977ee3ec9c8841b9ecb31deec`, deployed at 19:33:39 UTC. Core PR31 passed both CI workflows and merged as `e1806c3081dba098522ba88e9bbef771e048688b`.

The current live static symlink points to `/var/www/maestroradio-web/releases/20261120T233248Z-vinyl-motion`. Its index SHA-256 is `31c3e1a6614a3f117dd53475220108ad99d04d08863a998476caebe687be9b2b`. The guarded rollback target is the previous core release `/var/www/maestroradio-web/releases/20261120T190806Z-station-vinyl`.

Turntable release: Source 2b48e74b51531c10b0098109f9a58d4acac16cfb; frontend 2311c4aaa05221494cef74c67e2b815828e99d3f; PR33 merged as 5a50c60 with both CI workflows green; operations PR34 merged as c7b486e409434668ddef5ee736255a10672fe29b. Bundle index-DophLcRY.js; index SHA256 31c3e1a6614a3f117dd53475220108ad99d04d08863a998476caebe687be9b2b.

Authoritative backup receipts:

- Current turntable frontend: `/opt/swadebase/backups/maestro-vinyl-motion-20261120T233248Z/receipt.json`

- Static: `/opt/swadebase/backups/maestro-station-vinyl-20261120T190806Z/receipt.json`
- Initial native rotation: `/opt/swadebase/backups/maestro-rotation-controls-20261120T190423Z/receipt.json`
- Native follow-up: `/opt/swadebase/backups/maestro-rotation-followup-20261120T191323Z/receipt.json`
- PET function: `/opt/swadebase/backups/maestro-pet-roll-call-20261120T190401Z/receipt.json`
- Upload/family boundary fixes: `/opt/swadebase/backups/maestro-review-boundaries-20261120T193339Z/receipt.json`
- Native branding links: `/opt/swadebase/ops/maestro-playback-cleanup-20261120/station-logo-link-receipt.json`
- Audio cleanup and schedules: `/opt/swadebase/ops/maestro-playback-cleanup-20261120/`

A final direct browser check of the live R&B page confirmed channel-to-page navigation, completed station transition, current song/schedule data, and working playback/mute controls. The verified live page was retained for review.

Rollback must use the relevant receipt and current deployment lock. A static rollback switches only the guarded web symlink and rechecks paths. A native code rollback restores only the touched files and restarts `maestro-factory.service`; that API restart does not restart the radio engines. Do not erase hold ledgers, restore held/retired audio automatically, reverse unrelated concurrent changes, or restart the shared edge container. PET helpers were installed helpers-first/index-last and became live after the existing worker expired. Preserve their stored submissions and consent records.

The only new station start in this release was the first start of R&B. Existing radio engines were not restarted for the frontend, rotation controls, or PET roll-call deployment.

## Station-change animation release (Claude, 2026-11-21 00:50Z / 6:50 PM CT)
Owner request (Swade, 2026-11-20, his words): when a listener clicks a different station, the needle comes off the turntable at that moment, a record scratch plays while the new station loads, the old station fades out while the new channel's vinyl materializes and fades in already spinning, then the needle comes across, touches the vinyl, and the song playing at that moment slowly fades in.
- Live release: `/var/www/maestroradio-web/releases/20261121T0050Z-vinyl-switch-scratch` (index-DxEpXgb5.js), built from main fcbd3b9 (fast-forward of c7b486e; includes ChatGPT PR #33/#34 native spin, tonearm, deck lights, Record motion toggle).
- Rollback (one switch): `ln -sfn /var/www/maestroradio-web/releases/20261120T233248Z-vinyl-motion /var/www/maestroradio-web/current`
- Deploy lock taken and released per rule 20 (entry claude-opus-5.5-vinyl-switch).
- Checks: 49 unit tests pass (19 station controller incl. new sequence tests), tsc clean, live headless-browser run on themaestroradio.com: needle up + scratch at tap, old station 0.5 -> 0 in ~0.5 s, vinyl crossfade ~1.0-1.8 s, needle down ~2.4 s, full volume ~3.6 s.
