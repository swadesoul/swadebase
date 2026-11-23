# SWADEBASE Studios — original-series conversational production contract
Date: 2026-11-23 (America/Chicago)
State: DESIGN / INTEGRATION REQUIREMENTS — NOT DEPLOYED OR END-TO-END VERIFIED
Owner approval: user request in ChatGPT, November 23, 2026.
Implementation authority: preserve SWADEBASE standing rules, production deploy lock, budgets, and approval scopes.

## Mission
One shared production studio in swadebase.cloud with commands originating from SSS Brain or Brainiak. DeepSeek is the preferred conversational/script-writing model, but the operator can switch at any time among server-discovered, authorized, currently configured LLMs. Do not hardcode a fictional model inventory or guarantee a model is available without a health/permission check. ComfyUI is the first production render path after the script and shot plan are approved and render prerequisites met. Publish original series to BLACK TALES, followed by a MAESTRO RADIO promo campaign for one month or until the next episode premieres, whichever comes first.

## Flagship original productions
- BEAUTY CULTURE — canonical title Beauty Culture, metadata and cast to import only from approved source assets. Do not invent characters or relationships.
- KARMINE — canonical title KARMINE, metadata and cast to import only from approved source assets.
- FREQUENCY RUN — canonical title Frequency Run. Preserve established Rhunn family, ship, locations, wardrobe, voice, scene geography and existing peaceful ending requirements; load approved project bible, never invent missing canon.
All workspaces target BLACK TALES distribution, with independent rights, character libraries, episode series, production memory, voices, and budgets.

## SWADEBASE UI
Studios > Productions > project > Bible | Cast | Voices | Scripts | Seasons & Episodes | Locations | Storyboard | Shot Queue | Score & FX | Edits | Release | Campaigns | Budget | Audit.
Header: conversational session; model dropdown from SWADEBASE model registry; actual provider, latency, context, available/cost indicator. Switch model per next request without deleting session/working script. Show local/hosted badges and live status. Keep currently unsupported model disabled with explanatory reason. Never expose secrets.

## Conversation and story agent
1. SSS Brain/Brainiak sends authenticated user + project_id + transcript + model preference to same studio API, with tenant scope and idempotency key.
2. Resolve active model from SWADEBASE registry and router; DeepSeek as default ONLY if configured and healthy; otherwise clearly explain unavailable and offer installed models.
3. Retrieve production bible, episode outline, script revision, character and voice registry, approved images, location and outfit references, and related episode synopsis; keep authoritative structured project data independent of model context.
4. Chat agent interviews producer naturally about subject matter, tone, casting, conflict, ending and runtime; writes beat sheet, outline, scenes, dialogue, shot list, music cues, and unresolved questions. Show script diffs.
5. Agent may draft and preview; script approval required before render, rights clearance before external distribution, and explicit production budget gates before GPU/provider consumption.
6. Before applying any AI-generated changes to canon, run a continuity verifier: character_id, face refs, voice_id, name, outfit_rev, location_id, script_revision, pronouncing lexicon, timeline and scene start/end state. Flag exceptions for approval.
7. Model switching passes the same canonical structured context + last conversational summary and current draft/version to the new provider; log actual model per turn.

## Production records
Persist tenant_id, project_id, series_id, season_id, episode_id, scene_id, shot_id, take_id, character_id, outfit_revision_id, location_id, voice_profile_id, script_revision_id, audio_cue_id, render_job_id, media_asset_id, distribution_release_id, campaign_id, approved_by, created_at, updated_at.
Character record: canonical name, bio, traits, relationships, face/turnaround references, permissible appearance variants, approved performance style, fixed voice provider/ID, consent/rights, sample references, pronunciation notes.
Job record: durable status, idempotency, provider/actual model, prompt/workflow version, seed, media refs, attempts, provider cost ledger, B2 path/checksum, user approval, failure reason.
No large binaries in PostgreSQL; protected originals/references/masters/stems/exports live in B2, readback verified.

## ComfyUI render pipeline
approved script + canon > structured scenes/shots and reference images > storyboards/animatic > approval > queue durable jobs > model/provider preflight and spend gate > ComfyUI private API-format workflow > polling/retry > clip readback to B2 > audio/lip-sync/editorial > FFmpeg assembly > QC > export 16:9 and derived 9:16 > release gate.
Use ComfyUI /prompt and /history/{prompt_id}; workflow template inputs include prompt, negative prompt, seed, width, height, duration, approved reference assets and continuity metadata. Never start paid generation merely because layout was edited; require explicit render-ready state plus budget authorization.
Check current SWADEBASE migration 20261123072500_swade_video_comfy.sql: it adds Comfy Cloud Wan 2.2 video routes. That alone is not proof a private/self-hosted ComfyUI backend, B2, worker, or production handoff is healthy. Prefer already-verified self-hosted engine where commercial license and compute allow. Cloud/Replicate fallback is separately gated.

## BLACK TALES release
Release agent packages video masters, 16:9 playback encode, 9:16 social version, captions, poster/thumbnail, synopsis, credits, rights manifest, original title/season/episode metadata and B2 checksums. Publishing to BLACK TALES requires an authenticated backend adapter, successful preview/playback QC and explicit release authority. Treat failures as recoverable, not as publication.

## MAESTRO RADIO promo lifecycle
Trigger: BLACK TALES release becomes VERIFIED_PUBLISHED (not just render complete). Emit deduplicated event blacktales.episode.published with series_id, episode_id, published_at, trailer/approved promo assets, destination URL and campaign_idempotency_key.
Create proposed campaign in MAESTRO, with original compliant 15/30/60s audio spot, series name, episode name, CTA, start_at = verified premiere, scheduled_end_at = premiere + 30 calendar days, and stop_when_next_episode_published = true. Respect radio-ad slot rules, station frequency caps and publish approval; do not overwrite paid ads or active sponsor inventory. Never assume permission to send an outside marketing message or incur ad spend.
State machine: DRAFT -> READY_FOR_APPROVAL -> APPROVED -> ACTIVE -> STOPPED_NEXT_EPISODE | EXPIRED_30_DAYS | PAUSED | ERROR. For each series, the newest verified published episode supersedes the prior episode campaign; stop prior before enabling newer campaign to avoid overlap. For no new episode, end after 30 days. If a premiere is delayed, retain old campaign only until its own 30-day expiry. Reject duplicate release events; store audit receipts with campaign and episode IDs.
No campaign is claimed LIVE until MAESTRO schedule records and actual playback/rotation are verified. Copy is not aired until approved and confirmed operational.

## Cost, safety, audit
Default external spend zero unless separately authorized under current founder controls. Founder's platform-credit exemption does not exempt real vendor bills. No key leakage, no unrestricted browser-role access; tenant-scoped capabilities; audit of voice consent, rights, scripts, model switch, render retries, release and campaigns. Never auto-approve script/public publishing based on the LLM's own output. Respect deploy lock before live changes.

## First acceptance slice
[ ] Enumerate actual model registry and test configured DeepSeek route; support chat, session preservation, model switch.
[ ] Create independent editable workspaces for 3 flagship projects, importing only verified canon.
[ ] Attach one approved test character and voice; switch model without changing identity.
[ ] Prepare a 10-second shot: storyboard -> approved image -> ComfyUI -> B2 durable readback -> playback, recording actual charges.
[ ] Assemble captioned video and test 16:9/9:16.
[ ] Stage BLACK TALES private draft -> verify playback -> authorized publish.
[ ] Emit release event -> stage MAESTRO campaign -> approved activation -> simulate next-episode replacement and 30-day expiry.
[ ] Verify failures, retries, idempotency, permissions, rights and mobile Safari.
[ ] Update all affected Bibles, knowledge index and What's New, test live flows; record rollback before marking shipped.

## Discovery status
Read SWADEBASE Master Site Bible and STANDING_RULES from swadesoul device. Found existing Comfy Cloud route migration dated 2026-11-23. BLACK TALES Bible under guessed BLACK_TALES_Master_Site_Bible.md path was not found; do not infer there is no Bible. Full registry and deployed service checks are still pending. This document is a saved implementation contract, not a deployment receipt.
