# Brainiak voice upload: HTTP 413 fix
Evidence: Brainiak Master Site Bible, voice-first checkpoint October 26, 2026; handoff 87.
Symptom: the real transcription upload returned nginx HTTP 413.
Cause: the /brainiak route inherited a 32k request-body limit.
Fix: a bounded /brainiak/api/demo/ location received a 2100k upload limit and 120-second read timeout. Do not widen unrelated routes.
Verification recorded: synthetic end-to-end transcription HTTP 200 with expected transcript; nginx configuration check passed. Real human microphone permission flow and all purchased-account workflows were not verified.
Prevention: test a realistically sized upload through the public proxy, not only against the internal service. Store nginx backup files outside included configuration directories.
This historical lesson is reference evidence, not authorization to modify a site.
