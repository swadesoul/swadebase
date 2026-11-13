# PET MUZIK — Background production and continuity process

Founder directive: October 27, 2026, America/Chicago. Scope: coordinate songs, animated movies, cartoons/art, merchandise, ABAGALE TV, and PET MUZIK Radio using existing SWADEBASE agents and services.

## Operating status
This document records the required process. It does not certify that all roles have been assigned to live agents or that unattended production is running. The Sites frontend currently prepares briefs; server-side agent intake, production, permissions, payment and delivery must be verified separately. Existing Music Director and Motion Studio handoffs remain authoritative integration references.

## Accountability and reuse
The existing Chief of Staff is the accountable coordinator. A PET MUZIK producer role maintains project progress and routes to existing authorized specialists. Reuse MUZIK Director/RESINGLAB for music, the existing film/motion workflow and Kinetta for animation, approved character-art tooling, the existing merchandise stewardship capability with a separately verified PET MUZIK shop, ABAGALE editorial review, and the existing Maestro station system. Role descriptions are not evidence of new bot creation, credentials, tool permissions or job execution.

| Role | Responsibility | Verification before action |
| --- | --- | --- |
| PET MUZIK Producer / Chief of Staff | Own the project ledger, sequence jobs, resolve blockers and report evidence | Verified actor, project, tools and existing queue; no duplicated scheduler |
| MUZIK Director | Pet facts, original lyrics, genre/vocal/pronunciation direction, lyric and audio QA, revision lineage | Scoped music bridge, provider/rate/cost authorization and verified payment before paid generation |
| Film / Motion Director | Approved character reference, script, scenes, dialogue, motion and screen formats | Existing Motion Studio contract, exact style/version, output and B2 readback |
| Character & Art Steward | Likeness, coat markings, eye color, typography, palette and cartoon continuity | Approved character sheet/master hashes; revisions require explicit review |
| Merchandise Steward | Map locked artwork to real provider templates; create and inspect drafts in PET MUZIK only | Dedicated token and shop binding; blueprint/provider/variant dimensions, actual mockups and costs |
| ABAGALE TV Curator | Rights, screening QA, captions, formats and editorial handoff | Separate publication consent, approved program and verified ABAGALE submission capability |
| Maestro Radio Programmer | Clean audio, station metadata, rights, introductions and programming handoff | Verified PET MUZIK station/stream, consent and bounded station-scoped tools |
| Continuity / QA Guardian | Independently compare each result to the approved pet/story/brand; reject drift | Current approved snapshot and source/asset/job IDs; no fabricated QA passes |

## One approved identity and story across every format
Maintain a versioned canonical pet profile: name, pronunciation, species, markings, eye color, signature accessories/personality, relevant people and relationships, occasion, approved facts, must-include and exclude lists, locale, voice choices, master references/hashes and per-destination consent. Store metadata and permissions in SWADEBASE; durable media and originals in the existing Backblaze storage. Never publish private family stories or identify children without the applicable consent.

Every song, movie scene, illustration, product and broadcast handoff must reference the same pet_profile_id, project_id, approved_story_version and source asset IDs. Preserve parent/derivative lineage, master checksum, provider/job ID and revision history. New names, factual changes, character redesigns or artwork substitutions reset relevant approvals. Do not infer permission for TV, radio or merchandising from permission to create a private song.

## Required production flow
1. Ingest the product-specific studio brief through verified authenticated SWADEBASE intake. Current browser-local drafts are not server jobs.
2. Producer resolves the existing project and canonical pet profile, identifies reusable assets and obtains corrections and story approval.
3. Plan specialist tasks against verified registry capabilities. Unknown routes, costs, permissions or ownership become explicit blockers.
4. Run preflight: facts, spelling/pronunciation, likeness, rights, privacy, correct store/station, variant templates and bounded cost. External spending remains zero unless specifically authorized under a verified policy.
5. Reserve authorized budget and verify payment/entitlement where applicable. Submit idempotent, scoped jobs through existing workers; never fan out uncontrolled paid work.
6. Specialist returns actual output references, source/master lineage, job state and measured usage. Preserve an uncertain submission rather than blindly resubmitting.
7. Continuity Guardian checks the result against the approved story/reference: lyrics and names, character appearance across scenes, palette/type and print quality, audio/video integrity, captions and screen/print safe areas. Failures return to the same specialist with a bounded repair request. Customer revisions and internal repairs are tracked separately.
8. Verify playable/downloadable media and durable asset readback. Human review remains required where quality/identity cannot be established automatically.
9. Prepare delivery or destination handoff. Merchandise publication, orders/charges, TV airing and radio scheduling each require their own authorization, ownership and consent checks. A plan, visible mockup or browser redirect is not fulfillment.
10. Producer records truthful state: draft, approved, queued, processing, needs_review, blocked, ready, delivered or separately published/broadcast. Report actual receipts and unresolved blockers to Chief of Staff using the existing authorized private process. No external messages without authorization.

## Background management and reporting
Use the existing queue, job IDs, status callbacks/polls, cost ceilings, audit and health infrastructure. Do not add another database, queue, cron or subscription. Agents may prepare/report within their proven scopes; they do not gain founder credentials or cross-tenant access. A role assigned on paper remains PLANNED until a scoped tool call and return receipt are verified.

Required report per project: current story/reference version; responsible role; outstanding approval/consent; completed and blocked tasks; result/job IDs; QA outcomes and repairs; current cost/usage; delivery/publication status; next accountable owner. Failed health checks, repeated drift, uncertain provider submissions and missing permissions must pause the affected job, preserving unrelated working services.

## Printify separation
Dedicated names: PET_MUZIK_PRINTIFY_API_TOKEN and PET_MUZIK_PRINTIFY_SHOP_ID. Resolve the actual token's shops list and bind only the verified PET MUZIK shop. Never reuse ABAGALE's shop ID or generic token fallback. Unverified products remain concepts; created items remain drafts until real provider mockup/design/cost review. The approved 760 × 380 logo is not automatically suitable for large prints.

## Acceptance before claiming agents are managing production
- Authenticated real studio intake creates an attributable project/job.
- At least one bounded specialist dry run returns a real receipt without paid execution.
- Guardian accepts an approved example and rejects a deliberately inconsistent one.
- Original and repaired versions remain attributable; retry and idempotency behavior are verified.
- Cross-shop/station/project access is denied.
- Chief of Staff receives and can retrieve the actual status report.
- Paid/fulfillment/publication paths remain disabled until their own acceptance gates pass.

References: PET_MUZIK_Master_Site_Bible.md; PET_MUZIK_MUSIC_DIRECTOR_HANDOFF_2026-10-27.md; PET_MUZIK_MOTION_INTEGRATION_2026-10-27.md; SWADEBASE Master Site Bible and standing rules; Printify Design Lock.

## Founder voice and visible-conversation directive
The homepage conversation panel belongs directly beneath the experience cards/Spotlight, before merchandise samples. Keep the raw customer transcript visible and a separate compiled brief beside it. Route explicit creation intent to the matching studio, populate verified fields, ask the next missing question, and preserve correction/version lineage. Changing to another pet must prompt a new-story versus name-correction decision before mixing facts.

SWADEBASE Voice Studio is mandatory for recording, transcription and spoken responses. Do not substitute browser SpeechRecognition, speechSynthesis, paid Replicate/OpenAI speech, or an unrelated voice provider. The current guided typed conversation is deterministic local intake, not a certified live producer agent. Voice Studio proxy health is verified; PET MUZIK's authenticated Sites-to-SWADEBASE session connection remains pending. Never place shared voice/service-role credentials in the frontend or bypass user ownership to make the microphone appear active.

Printify connection discovery succeeded with the newly saved PET_MUZIK_PRINTIFY_API_TOKEN in the inspected Coolify environment scope. Official API readback identified custom-integration shop Pet Muzik, ID 29509155; its scoped catalog returned zero products. Token content was never printed. This token can see several shops in its merchant account; enforce a strict shop 29509155 binding for the PET MUZIK merchandise role. No products, provider mockups, costs, live sales or fulfillment have been created or verified.


## PET MUZIK native voice connection — October 28, 2026
DEPLOYED / OWNER-DEVICE ACCEPTANCE PENDING. PET MUZIK reuses the existing SWADEBASE adapter process, shared Google owner broker, HttpOnly owner session, native CPU Kokoro and private CPU Whisper. The project-bound connection window returns short-utterance transcripts and reply audio to the owner-private Site using exact-origin/window/channel/request checks. No shared credential is exposed, no paid fallback, new identity stack, service, database or queue.
Seven targeted bridge tests, four shared-session tests and real CPU speech/transcription passed. Both native usage receipts are priced at USD 0. Two narrow PET MUZIK owner-only functions reserve/finalize existing ledger receipts; generic ledger UPDATE and anonymous function execution remain denied.
Source 9a0c1336393d72746e3983f498b80691a55f5fd0, Sites version 10, deployment appgdep_6ae200fc14cc81918f5b8c5df035e2f8 succeeded at 2026-10-28T14:04:51Z. Live browser reached owner-private ChatGPT sign-in gate. Actual owner Google completion, microphone permission, recording-to-brief/playback and physical iPad Safari remain unverified; deterministic brief organization is not production-agent intake. Three existing bandana drafts remain held; no sales or external messages. See site-bibles/PET_MUZIK_Master_Site_Bible.md and site-bibles/PET_MUZIK_Voice_Connection_2026-10-28.md for current details and recovery.
