# Leslie Beckett Samuel Master Site Bible

Version 1.0 — October 26, 2026, America/Chicago. Internal operating reference.

## Identity and deployment

Canonical public connection: https://leslie.swadebase.cloud/ . Presentation remains hosted on native Sites at https://lbs.swadeswade-s-8788.chatgpt.site . Sites project appgprj_6ade24b75f008191a0a6ea9b3384ff86, source SHA f03dd058554795a71259c0691dccb92743075cc0, saved version 9 (appgprj_6ade24b75f008191a0a6ea9b3384ff86~appgver_57dab72a16d481919713267f95fba8cf), deployment appgdep_6adf54c5b82c8191945889408e03e2ca succeeded. Public audience retained.

The existing connection service is /opt/leslie-connection, systemd leslie-connection.service, bound to loopback port 18748. Its nginx front end proxies fixed presentation paths from native Sites. Owner administration is /admin. No copy of the presentation application runs on the VPS.

## Language experience

SHIPPED: a prominent sticky English / Français / Español bar immediately below navigation on all seven public pages. Query parameter lang=en|fr|es overrides the saved browser preference; internal links retain it. Public pages, navigation, form labels, prompts, narration controls, image alternatives and gallery captions change language. Names, brands, URLs and submitted user content remain intact. The expanded historical career record has French/Spanish adaptations. Gallery captions are concise adaptations, with an explicitly requested original English caption available in the viewer. External original source pages are not translated by this site.

The Let’s connect navigation invitation uses the Bahamian flag palette and triangle, with bold dark text on its gold centre band. French and Spanish text use the same high-contrast design.

Translations are reviewed static TSV pairs in scripts/localization and compiled to public/assets/localization.js, with no per-visitor paid translation service. Maintenance commands and generation/recovery references are in scripts/localization/README.md in the Sites source repository.

## Narration and dictation

Existing SWADEBASE Voice Studio reused: /opt/swade-voice-service, Kokoro CPU engine. French voice ff_siwis, Spanish em_alex, English bm_george. No GPU, subscription or new voice service created. Twenty additional fixed page recordings cover French/Spanish on every public page and English on the six remaining pages; the English homepage retains its earlier asset.

Backblaze is the durable original under swadesoul/leslie-site/narration/v1/, with immutable text-hash keys. Runtime cache: /opt/leslie-site/narration. Receipts and exact object keys/checksums: /opt/leslie-site/narration-manifest-v1.json. Originals verified uploaded by size; audio SHA-256 and duration recorded. Local render inputs: /opt/leslie-site/narration-inputs-v1.json. Generation log ends COMPLETE: 20 recordings verified.

Fixed allowlisted GET/HEAD /narration/{en|fr|es}/{page}.mp3 routes serve public MP3, support byte ranges, and permit public audio CORS. Unknown languages/paths cannot read arbitrary files. Narration starts on request, with pause, resume, stop, retry and timeout controls. It does not activate a microphone. Gallery narration reads the introduction; individual captions are text. The expanded historical career record is not part of prerecorded page narration.

The existing protected leslie-dictation edge function previously forced English. It now accepts only en/fr/es, defaulting to English for older callers. Native Sites and frontend multipart uploads forward the chosen language. The canonical proxy forwards the original bounded multipart body. Existing key checking, per-IP rate limits, review-before-apply, cancel, permission timeout, sixty-second recording limit and manual form submission remain. French/Spanish names, email symbols and spoken digits are normalized. The visitor’s message is preserved, not translated.

## Existing data and ownership

New contact enquiries use the existing SWADEBASE leslie schema. Two site-scoped full administrators remain configured: swadesoul@gmail.com and Leslie’s designated owner address. Roles and sign-in were not changed by the language release. No enquiries or contacts were copied or removed. No mailbox passwords, DNS, global identity configuration or permissions were changed in this release.

Two professional mailboxes were prepared in the previous release, with a private password-setting workflow in administration. Domain connection and mail delivery require their own DNS and personal sign-in verification; this language release does not certify those workflows.

## Verification and practical limits

PASS: source translation coverage checks, all seven page language/audio controls, English/French/Spanish name/email/phone normalization and message preservation, syntax checks and framework production build. Browser verified French page navigation, translated gallery search and opening captions; French narration played in preview. Live Spanish homepage translation and audio playback verified after publication. All twenty narration URLs returned HTTP 200 and nonzero audio lengths; measured durations 22.992–172.368 seconds. Fixed audio route tests: initial range and suffix range returned 206, invalid range 416, unsupported language 404. Admin contacts remained 401 without sign-in.

Live canonical French and Spanish synthetic audio samples submitted through the existing transcription route both returned HTTP 200 with nonempty language-appropriate transcripts. Proper names may require review/correction. The preview uses HTTP and therefore cannot validate microphone capture; a physical Safari/iPad microphone recording was not newly tested. Existing browser MediaRecorder format selection and typing fallback were preserved.

## Problem/fix and prevention

Symptom: language control not visible on the published site while work was still in preview. Fix: publish the complete release and expose labelled direct language buttons below the header, sticky during scrolling. Verify current live release rather than treating preview as delivery.

Symptom: selected French/Spanish could still be transcribed with an English hint. Cause: scoped edge function hardcoded language=en. Fix: validate and forward the selected language through every hop. Keep English as the backwards-compatible default and test normalization separately from recognition.

## Recovery

Frontend rollback: redeploy previously published Sites version 6, appgprj_6ade24b75f008191a0a6ea9b3384ff86~appgver_b848102d79008191aa10dc114c327881, source fe0ba1b9475ab047d99774727f257a544e31b2f2. Version 7 was saved as a checkpoint but not deployed. Server rollback backup: /opt/leslie-connection/server.before-languages-20261026.mjs. Edge rollback backup: /opt/leslie-site/leslie-dictation.before-languages.ts. Restore missing audio cache from exact Backblaze keys/checksums in the manifest. Do not delete durable originals as part of rollback.

## Clean URL compatibility verification

LIVE PROBE PASSED: native hosting redirects .html addresses to clean paths such as /biography. The canonical connection now allowlists both forms of the same seven fixed public pages, retaining query parameters; it still rejects arbitrary paths. All seven pages in both French and Spanish followed redirects to HTTP 200. Live browser also verified French expanded biography: 69 translated paragraphs. Source checkpoint version 9 records this compatibility fix; native presentation build output is unchanged from version 8.
