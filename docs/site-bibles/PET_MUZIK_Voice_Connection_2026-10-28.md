# PET MUZIK — SWADEBASE Voice Studio connection

Current checkpoint: October 28, 2026, America/Chicago. This supersedes the earlier health-check-only implementation.

## Implemented connection

The existing SWADEBASE adapter process serves `/adapters/pet-muzik-voice/` and `/api/adapters/pet-muzik-voice/{session,speak,transcribe}`. Talk opens an authenticated first-party connection window. The existing shared SWADEBASE Google/OnePass broker and HttpOnly owner session are reused; no second identity service, database or queue is created. While this Site is owner-private, both the verified owner email and a fresh super-admin role check are required. Legacy owner-token sessions and unrelated accounts are denied.

The Site and connection window exchange bounded audio/transcript/reply messages using exact origins, the exact window handle, a random channel, project ID and request IDs. No identity token, CSRF token or shared service credential is sent to the Site. The connection window sends same-origin requests with its session and CSRF header. Third-party cookies are not required. Close the connection window to disconnect. If Google clears the window’s opener, close it and tap Talk again after sign-in.

Microphone capture uses MediaRecorder, capped at 29 seconds/2 MB. After Finish, the server decodes and verifies duration (30 seconds maximum), transcribes through the existing private CPU Whisper service and deletes temporary audio. This is completed-utterance transcription, not live streaming words. Raw answers appear in the conversation and drive the existing deterministic brief guide; selected drawer dictation fields also accept text. Each edit resets story approval. No production-agent job is created.

Spoken questions explicitly pin `engine=kokoro` and `voice=kokoro:af_alloy`, with a 600-character cap and no paid fallback. Audio returns to native controls inside the Site conversation/drawer; browsers that block autoplay offer Play. Browser SpeechRecognition and speechSynthesis are not used. Audio is session-only, not added to saved drafts.

## Limits and receipts

One voice operation at a time; 120 calls/hour and 300/day for this owner/project. Persistent reservations and outcomes use the existing shared cost ledger through only `pet_muzik_record_voice` and `pet_muzik_finish_voice`, scoped to PET MUZIK native voice and the verified owner. General ledger UPDATE remains denied. Anonymous execution is denied. Ledger metadata excludes transcripts/audio. Existing shared credentials remain server-side. No external spending, GPU/cloned voices, paid speech provider or paid model fallback.

## Verification

- Seven targeted route tests passed: anonymous/unrelated-user rejection, scoped session metadata, CSRF/origin denial, CPU routing, incorrect-engine rejection, persistent limit, audio input/result handling.
- Four existing shared owner-session tests passed.
- Real native CPU round trip passed: 163244-byte WAV, 3.4 seconds; synthetic phrase “My dog Ruby loves her evening walks.” transcribed correctly. Both usage receipts show priced=true and cost USD 0.
- Public connection page HTTP 200; anonymous session HTTP 401; existing voice health and adapter health HTTP 200.
- Browser verified Talk opens the new connection page, the Google connection control is visible, and typed song intent still opens/populates the correct drawer. The preview intentionally is not an allowed transport origin.
- Real owner Google completion, browser microphone permission, complete live recording-to-brief-to-playback, and physical iPad Safari remain UNVERIFIED. Service/route tests are not proof of those device journeys.

## Deployment and recovery

Backend source: `ops/pet-muzik-voice/` in the existing Site Git repository; deployed to `/opt/swadebase/ops/pet-muzik-voice/`. Existing adapter server imports one new handler. Nginx adds only a PET MUZIK voice-specific 2100k upload limit and 120-second timeout. Other API/audio routes retain their settings.

Backend backup: `/opt/swadebase/backups/pet-muzik-voice-20261028T135130Z`. Recovery: first disable/remove this handler and restore only its import/handler insertion and exact nginx location after comparing current files; validate Node/nginx before restart/reload. Do not overwrite unrelated subsequent changes. Revoke the two scoped logging function grants if retiring the bridge; retain cost receipts. Frontend rollback uses the prior saved Sites version 9. Never expose protected environment values.

## Published release receipt
Source commit: 9a0c1336393d72746e3983f498b80691a55f5fd0.
Sites saved version: appgprj_6ae11e774ba88191ba4898e90c08dea6~appgver_ae5eaea2cbfc8191b064a9e60387a3d7 (version 10).
Deployment: appgdep_6ae200fc14cc81918f5b8c5df035e2f8, succeeded 2026-10-28T14:04:51.149150+00:00. Audience unchanged, owner-private.
Browser live check reached the expected ChatGPT sign-in gate; no owner credential was provided and no real owner/device voice journey is certified. Preview Talk opened the new SWADEBASE Google connection screen. Native speech/transcription round trip and ledger readback passed at USD 0. General ledger UPDATE and anonymous logging-function execution remain denied.
Merchandise: 3 existing originals / 3 existing hidden drafts / 3 visible artwork proposals / 3 held / 0 finished listings. No duplicates created. New canary repair rejected disabled-image omission with 400/8150; prior 8251 mapping holds remain. No v1 art reused, master or current print file hash changed, checkout, order, paid fallback or external message.
