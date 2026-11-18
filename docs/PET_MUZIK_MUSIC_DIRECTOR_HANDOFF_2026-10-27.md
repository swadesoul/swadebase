# PET MUZIK — Music Director agent and audio integration (internal design, 2026-10-27)
Status: SOURCE-VERIFIED DISCOVERY; AGENT SPECIFICATION CREATED; NOT CONNECTED END-TO-END OR DEPLOYED.
## Existing SWADEBASE functions (verified as source files, not certified paid workflow)
- resinglab-generate-music: authenticated-user endpoint, existing music generation, provider selection, custom songs and voice-profile checks.
- music-bridge: authenticated and scoped music asset registration, rights, handoffs and quotes; current app list excludes PET MUZIK.
- music-api: generation and lyrics API; requires auth checks and verified rate-book.
- resinglab-kits-song-pipeline: existing project orchestration route.
- sssbrain-music: existing music route; reconcile with RESINGLAB ownership before writing.
- api-transcribe: VideoSayWhat x-api-key API; not appropriate to call directly from browsers; use server-side scoped adapter only.
- Other transcription endpoints include transcribe and assemblyai-transcribe; inspect and choose authorized active route before connecting.
## Required PET MUZIK Music Director role
Name: MUZIK Director. SWADEBASE-owned, narrow-scoped non-admin agent, with SSS Brain as conversational interface. Never impersonate super admin.
The agent interviews pet owners by voice or text; extracts and displays structured pet facts, names, pronunciations, relationship and locale; records corrections and per-product consent; presents story snapshot for owner sign-off.
It writes original lyrics and music briefs for RESINGLAB without copying existing songs or impersonating artists. User chooses mood, genre, vocal and language. The system checks spelling, pet identity, factual claims, singability, sensitive privacy, pronunciation and creative quality before rendering.
Voice-specific references require verified consent. Stored pet sounds are optional and reuse requires user consent. All pending payments must be server-verified with idempotent webhook before paid creation.
Agent actions: intake.update, story.approve, lyrics.draft, lyrics.review, music.quote, music.generate (after payment + cost authorization), music.status, audio.qa, deliver.verify, revision.request, radio.submit (separate rights consent). No direct unbounded provider API calls.
## QA and training
"Training" means retrieval-based knowledge and approved example briefs, not training on private customer conversations or voice cloning without express opt-in. Index existing RESINGLAB music studio bible, Suno/provider caps, VideoSayWhat transcript and pronunciation facts, licensing constraints, QA checklists, MaestroRadio audio formatting and PET MUZIK examples as private knowledge references.
Preflight: snapshot version, all names exact, no invented facts, language/vocal/style supported, copyright constraints, customer consent, verified cost ceiling, correct authorized actor and provider.
Postflight: playable audio, format metadata, audible voice/names, peak/loudness, no silence or truncation, lyric matching where possible, B2 object readback, MP3 download test with Content-Type audio/mpeg and attachment filename, signed customer-scoped retrieval.
Agent logs job ID, QA findings and version, bounded retries, owner approval, and actionable failure. Target 10 min, not guarantee.
## Integration contract (proposed, not live)
PET MUZIK one-button voice UI -> authenticated SWADEBASE agent ingress -> MUZIK Director -> approved pet profile and quote -> existing RESINGLAB generation -> B2 -> verification -> customer drawer/player. VideoSayWhat speech/transcription only through an existing authorized server-side route, never with API key exposed to client.
Shared music bridge currently restricts source_app values to resinglab, mydistribution, maestroradio, maestroradiofactory. Add PET MUZIK only after schema validation and compatibility migration. Do not fake PET MUZIK as resinglab to bypass product ownership.
## Next verified build slice
1) Confirm PET MUZIK project/site identity and customer auth; 2) verify active RESINGLAB provider generation and cost policy with safe test; 3) implement a scoped PET MUZIK adapter and music-director QA with unit tests; 4) dry-run unpaid test; 5) secure paid test after authorization; 6) playback/download QA and OnePass customer UI.
No production deployment, API key change, music generation, charge or app publication occurred as part of this document.
