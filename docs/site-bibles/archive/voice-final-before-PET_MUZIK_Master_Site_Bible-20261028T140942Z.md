# PET MUZIK Master Site Bible

Version 1.2 — October 28, 2026, America/Chicago
State: frontend workspace and protected SWADEBASE native-voice bridge implemented; owner/device voice acceptance and production-agent integrations pending.

## 1. Identity and purpose
Owner: Swade / Harold Whaley. Canonical Sites project: appgprj_6ae11e774ba88191ba4898e90c08dea6. Address: https://pet-muzik.swadeswade-s-8788.chatgpt.site. Owner-private audience preserved. Existing Sites source repository is canonical for frontend code. PET MUZIK turns pet stories into creative briefs for music, animated movies, cartoons/art, merchandise, ABAGALE TV consideration, and radio consideration.

## 2. Customer journey and page structure
Homepage keeps the approved Studio v02 artwork, exact transparent gold ensemble logo, three rotating compositions, manual carousel controls, reduced-motion preference and sample films. Experience cards and shortcuts navigate to dedicated explanation pages:
- pet-songs.html: personal songs, planned $19.99 base package and one complimentary revision.
- animated-movies.html: character identity, animation direction, storyboards, dialogue and formats.
- cartoons-art.html: character portraits, three-panel cartoons, character sheets, stickers and posters.
- merchandise.html: product, color, size, placement and artwork brief.
- abagale-tv.html: program source, format and rights information for a future editorial submission.
- pet-muzik-radio.html: dedicated listening lounge and airplay metadata brief.

Every experience page explains its offering and opens the matching studio. The homepage Create/Get Started controls open the studio directly.

## 3. Cinematic creation studio
Wide slide-out with warm metallic accents, mode-specific heading/theme, pet portrait, persistent voice console, specialist workbench and fixed review/save footer. Song mode has genre/vocal/mood/language/pronunciation/hooks/instruments/exclusions. Movie mode has animation direction, screen format, running time, setting, narration, dialogue and up to 12 editable scene cards. Art mode has likeness, canvas, palette, output format and cartoon captions/beats. Merch, TV and radio have their own metadata controls.

Common fields preserve the pet name, type, story, occasion and pronunciation. Full brief review uses the visible mode's fields; story approval is required before review and resets on edits/mode changes. No browser success state indicates paid fulfillment.

## 4. Voice and references
SWADEBASE Voice Studio is the sole permitted voice service. Browser SpeechRecognition and speechSynthesis have been removed. The native voicebox-proxy health endpoint returned HTTP 200 and provider swade-voice-service. Its recording/speech routes require an authenticated SWADEBASE user or approved server caller. PET MUZIK’s native Sites identity is not yet bridged to that authorization; recording and spoken replies remain unavailable. No service credentials or paid fallback are exposed. Typed guided intake works now; it is not the MUZIK Director agent or a two-way live AI session.

Optional JPG/PNG/WebP references are previewed only in the current browser session, capped at 10 MB. They are not uploaded or included in saved drafts. Reference upload has not been certified on iPad Safari. Object URLs are revoked on removal/replacement.

## 5. Persistence and deliverables
Opt-in localStorage drafts use version 3, preserve fields across mode switches and saved scenes, and migrate earlier version 1/2 names/story/music fields. Restored drafts require review. Save, clear, copy and text-brief download controls are implemented. Sensitive stories are not sent to a backend by these actions. No new database, provider, subscription or queue was created.

Both supplied sample MP4s are preserved: Sheriff Husky (24 seconds) and the Whaley Husky/Snowy memorial (65 seconds), H.264/AAC. They are photographic motion-graphics drafts, not fully animated character performances. Embedded selection, controls and explicit MP4 downloads remain available. The earlier request for two HyperFrames animation template styles remains pending.

## 6. Radio integration
Source discovery verified the existing Maestro admin assistant and factory documentation on the swadesoul device: https://themaestroradio.com/admin/assistant and /admin/music-factory. PET MUZIK station creation and its stream URL are not verified. No other station was substituted.

station-config.json currently has status=pending and stream_url=null. The lounge displays that state. The audio player activates only when status=verified and a validated HTTPS stream URL is supplied. Playback starts by user action; loading/playing/paused/error states are handled. Stream connection must be verified through the existing Maestro system before changing this configuration. No new radio infrastructure or scheduled broadcast was created.

## 7. Backend, auth and production boundaries
SWADEBASE Bible and standing rules were read on the correct swadesoul device; prior swadebase-2 ENOENT lookups did not establish absence. Existing PET_MUZIK_MUSIC_DIRECTOR_HANDOFF_2026-10-27.md and PET_MUZIK_MOTION_INTEGRATION_2026-10-27.md are source references. Reuse RESINGLAB, VideoSayWhat, Motion Studio, Backblaze and the existing music bridge after approved contracts, customer authorization, cost controls and compatible product scopes are verified.

OnePass/Google sign-in, checkout, paid generation, lyrics/audio QA, email delivery, B2 customer delivery, Printify checkout, ABAGALE submission and radio broadcast submission are not connected in this frontend. No new song/job/paid order/email delivery exists. No external spending or provider jobs occurred. Never expose keys or impersonate another app to bypass music-bridge ownership restrictions.

## 8. Hosting, access and operational recovery
Static HTML/JS/CSS deployed through Sites under the existing project ID and static directory dist. .openai/hosting.json preserves identity. No audience expansion or shared backend deployment change. Baseline for rollback: source commit a7a6c5a10b2e97b01608638b655a6dd9f242f613, saved version appgprj_6ae11e774ba88191ba4898e90c08dea6~appgver_719d0b621b588191a752627060b76b0c. Restore that saved Sites version to revert the studio/pages change while retaining source history.

## 9. Verification and remaining work
JavaScript syntax and all HTML local asset/link/unique-ID checks passed. Desktop browser verified homepage-to-song-page navigation, song review with supplied details, movie scene addition/edit/save, saved draft restoration, cartoon mode controls, and all six experience routes. Radio lounge correctly shows connection pending. Native voice capture, new reference selection, phone/iPad Safari rendering, real stream playback and all production/payment/fulfillment paths remain unverified.

Publish receipt and exact frontend SHA are recorded in the current conversation and release metadata. Central documentation uses this file and existing SWADEBASE text knowledge chunks; current authenticated MCP retrieval is a separate verification limit. Record actual deployment evidence before calling this a shipped frontend release.

## 10. Source and decision history
- Approved PET_MUZIK_Studio_v02.zip: libfile_632f57fc1bf88191aebe95abaf985907.
- October 27: founder requested cinematic slide-out with different song/movie/cartoon layouts and a talk connection; then six separate experience pages and a Maestro-backed radio area.
- Existing local PROJECT_CONTEXT.md and STUDIO_DESIGN_BRIEF.md retain prior story facts and source limits.
- Production integration remains scoped to the prior Music Director and Motion Studio handoffs; no duplicate backend services are introduced.


## 11. Dedicated Printify collection — October 27, 2026
Founder requested a separate PET MUZIK Printify store/token and collection samples immediately below the homepage Spotlight strip. Added an explicitly labeled concept collection in that location, with exact approved logo on CSS-only shirt/mug/pet-accessory explorations. These are not Printify provider mockups, products or purchase offers. Real product selection and template/print quality checks remain required.

Reserved credential names are PET_MUZIK_PRINTIFY_API_TOKEN and PET_MUZIK_PRINTIFY_SHOP_ID, injected only into the server-side SWADEBASE Printify adapter with runtime-only token scope. Existing ABAGALE/generic names and stores must remain unchanged. Checked Coolify shared/resource variable names did not contain a Printify/PET pair; no token, shop, or product was verified. No credential value was printed or written. See PET_MUZIK_PRINTIFY_SETUP.md for exact shared-reference syntax and remaining production gates.

## 12. Visible conversation and verified store discovery
The homepage has a conversation transcript below the card/Spotlight artboard, with a separate compiled-brief panel. Typed answers map explicit pet name/type, creation intent, music genre/vocal and product-specific replies into the studio. Missing details drive follow-up questions. A newly identified creation mode can open the correct studio automatically; users may disable this behavior. Pet changes require a new-story versus correction decision. Text and studio edits reset approval. Optional draft saving retains the transcript and fields; no backend agent job is created.

The newly saved PET_MUZIK_PRINTIFY_API_TOKEN was found in Coolify shared environment scope 1. Official Printify shops read returned Pet Muzik, shop 29509155, custom_integration. Scoped catalog read returned HTTP 200 and zero products. The token also sees other shops, so new operations must be bound to 29509155. No secret value was printed or copied to source; no key rotation or generic-store substitution occurred. Earlier statements that the token/shop were unverified are superseded by this read-only discovery; product/catalog/checkout creation remains pending.

See PET_MUZIK_AGENT_PROCESS.md for the explicitly requested background-agent consistency and handoff requirements. Roles remain planned until real scoped jobs and QA receipts prove operation. Central shared-document/index update had been rejected by automatic approval review before the founder’s later explicit instruction to record the agent process. Do not claim that broad update was completed. A new, narrower PET MUZIK agent-process write is tracked separately.

## 13. Current native voice connection — October 28, 2026
This supersedes the pending voice-bridge descriptions in sections 4, 7 and 9. Talk now opens the existing SWADEBASE shared Google sign-in in a first-party connection window. A verified owner session, owner identity and fresh role checks protect bounded recording/transcription and CPU Kokoro responses. Exact-origin/window/channel/request checks return transcripts and reply audio to the Site without exposing shared credentials. Short utterances are transcribed after recording finishes; there is no streaming-text claim. Drawer dictation can target a selected field. Spoken questions use native audio controls in the Site and remain optional.

Seven bridge tests, four existing shared-session tests, and a real CPU speech/transcription round trip passed. Existing ledger receipts show USD 0. Anonymous session requests are denied; generic ledger writes remain denied. Actual owner Google completion, microphone permission, live recording/playback and physical iPad Safari are not yet verified. All production, payment, agent submission, TV and radio gates remain separate. See PET_MUZIK_VOICE_INTEGRATION.md for endpoints, scope, limits, tests and recovery.

Current merchandise state: October 28 has three immutable bandana originals, six corrected exact-size v2 files, three existing hidden Printify drafts, three visible flat artwork proposals and zero finished-product listings. All three drafts are held for provider variant mapping and owner/mockup acceptance. The additional split-area repair rejected empty images on disabled variants (HTTP 400 / 8150); no duplicate product was created. Rejected First Press good-intentions v1 remains quarantined; no approved art changed. See production/daily/2026-10-28 receipts.
