# SWADE Shared Auto-Director / Script Studio — Implementation Contract
Status: APPROVED REQUIREMENT; DESIGN ONLY — NOT DEPLOYED
Recorded: 2026-11-01 America/Chicago
Founder direction: Every ecosystem video-production program can invoke one shared Auto-Director; SSSBrain is the voice/chat entrypoint; auto directing remains editable.

## Reuse and integration
Reuse SWADEBASE media core, video router, operator/MCP approval bridge, adapter registry, durable jobs and B2 storage. Reuse SSSBrain studio projects, creative requests, chat operator and Swideo project/character/shot version data where verified. Do not create a parallel video service/database.
Symbolic shared capability: video.auto_direct.v1 (not a deployed endpoint). Consumers discover capability via authenticated registry. Proposed consumers after verification: SSSBrain, Swideo/AudiVid, Black Tales, ABAGALE, PET MUZIK, ReSingLab video, VideoSayWhat video, trailers and other registered video producers.

## User modes
AUTO: create editable directing plan from script. EDIT: change individual actions, timing, camera and performance. AUTO_PLUS_EDIT (default): generate full plan and expose editable shot cards with review/undo/redo. Preserve spoken dialogue and voice identities by default, manual unlock to rewrite dialogue.
One button Auto-Direct, per-shot pencil/Edit, Add Movement, Regenerate Motion Only, A/B Compare, Lock, Approve, Send to Builder. Presets subtle/natural/expressive. Natural stillness is allowed; never fill every pause with motion.

## Contract
Input: source dialogue JSON or Markdown, scene/project IDs, character/voice/location locked references, prop layout, aspect ratio, directing preset, selected edit scope.
Output: source-faithful screenplay.md + timed video_manifest.json + editable shot cards, provenance, dependencies, continuity warnings, render-cost estimate.
Each motion: actor ID, motion type, timing relative to aligned speech, eyes/gaze target, head and torso, facial micro-expression, hands, feet/blocking, camera/transition, intensity, priority, preconditions, fallbacks, and validation.
Walking toward a door while looking back: stand, orient, approach door, slow or stop, rotate head/eyes to dialogue partner, speak, return gaze, continue. No teleporting or incorrect geometry.
Never change locked faces, voices, wardrobe or approved dialogue automatically. Reaction shots for silent characters and continuity from prior shot required.
Edits are versioned/non-destructive; only changed shot rerendered. Human approval before any paid render, publish or external delivery.

## SSSBrain interaction
Voice/text intents: Open Script Studio; Auto-direct scene one; Edit Arthur head turn; Add glance toward door; Show changes; Undo last motion; Approve and send to video builder.
Three views in overlay on existing /home: Script, Director Shot Cards, Edit Timeline. Save plan in user-scoped existing project records. No new default paid model. Existing operator routes to the shared capability.

## Costs and rights
Default direction is rules/local verified LLM, zero paid video generation until explicit approval. Founder app-credit exemption does not bypass actual vendor budget caps. Keep consented voice assets unchanged; lip sync only to final approved audio. Backblaze B2 is durable media, SWADEBASE stores metadata. Auth, tenancy, signed assets, idempotent jobs, resume and cost receipts required.

## Pilot acceptance test
Import supplied dialogue V01-V06; preserve exact lines and voice IDs arthur_mitchell and harold_whaley. Auto add V01 presentation gaze, V03 gentle interruption + Harold reaction, V05 memory glance, V06 playful response. Manual edit: walk to door while looking back; test update, undo, lock, export Markdown/JSON, roundtrip and continuity. No video render required to test directing contract.
Then test one approved short generated shot with speech sync, Backblaze readback, refresh persistence, 16:9 and 9:16, paid caps, rollback and iPad Safari.

## Rollout
Inventory site Bibles, adapter registry and actual application code before development. Implement one shared pure director/manifest module. Attach to SSSBrain UI, verify authenticated draft. Attach first existing video builder, test single-shot production. Roll to consumers one at a time with feature flags and regression tests. Obtain deploy lock before deployment and update affected Bibles and What's New with verified states.
Current state: specification persisted only; not built, not deployed, no customer app enabled.