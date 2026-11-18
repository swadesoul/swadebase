# SWADE BOTS OS — Fusion Architecture and Phase-One Release

Updated: 2026-11-14 UTC
Owner: Swade Soul
Live entry: https://swadebase.cloud/adapters/swade-bots
Deployment state: Phase 1 Agent Fusion profiles SHIPPED; later runtime connectors and customer interfaces NOT SHIPPED.

## Product objective
One voice-first, concise, personal and professional AI workforce, with a shared knowledge backbone and per-agent personality/memory/tool selections. SSS Brain is the personal and business intelligence core, SWADEBASE owns identity, credentials, approvals and operations; Brainiak is the planned agent packaging/commercial experience; SWOSTing hosts customer managed runtime. Reuse established SWADE Voice (local Whisper/Kokoro), existing indexed Site Bibles, existing owner-scoped SWADE BOTS profiles, Rakazo (only after separate runtime verification), SWADEBASE PostgreSQL and existing protected browser workspace. Do not reproduce proprietary designs or claim undocumented third-party APIs.

## Phase 1: Verified deployment
Added SWADE BOTS OS Agent Fusion Builder accessible through the existing SWADE BOTS sidebar. Owner chooses one of five role presets (Chief of Staff, Artist/Label, Personal, Developer, Sales), voice personality (natural, executive, creative), typical reply length (20–100 words, default 45), silence timer (1–5 seconds, default 3), whether speaking may interrupt, a memory boundary (agent_only vs owner_shared), and one or more selected capabilities.

Nine capability definitions: ecosystem_knowledge, natural_voice, tasks_approvals, personal_memory, social_drafts, computer_workspace, github_inspect, agent_delegation, messaging. Catalog distinguishes available, planning, agent-history-only, connection required and worker-link-required features. A checked capability is a preference/request only, NEVER a credential grant or authority escalation.

New additive per-owner table swadebase_ops.swade_bots_fusion_profiles with bot_id FK, owner_id, template_key, personality, reply_words, silence_seconds, interrupt_by_voice, memory_scope, capabilities and approved_execution (empty by default, not writable through the profile editor). DB role swadebase_adapters has SELECT/INSERT/UPDATE, while the route enforces owner_id and verified super-admin session. GET /adapters/api/swade-bots/fusion?bot_id=... and POST /adapters/api/swade-bots/fusion/save validate identity, CSRF on mutation, fixed enums/numeric bounds and allowed capability IDs. Profile saves add existing bot-profile audit events. Existing Chief of Staff profile is unchanged and stays chat_ready; a default Fusion profile is returned without modifying it until the owner clicks Save. No DB schema removals or passwords.

For Together MiniMax chat, selected personality and reply length are injected into the existing guarded system message; existing spending caps are unchanged. Existing local voice user experience uses the selected silence timer after profile retrieval; currently a chosen interrupt_by_voice=false disables hands-free barge-in. Read-only SWADE ecosystem reference retrieval from sssbrain.swadebase_knowledge_chunks and product alias recognition already existed before this release and are reused, including 'Reesing Lab' => ReSingLab, with read-only allowlisted site check. GitHub references in Site Bibles are not the same as authenticated live GitHub operations. Existing shared memory indexing is read-only and tenant scoped to verified SWADE super-admin; no broad private personal memory sharing is created by choosing owner_shared.

### Test evidence
- Node source syntax/import check passed.
- 16/16 combined unit/security/regression tests passed, including fixed capability/role catalog, validation of voice and memory constraints, rejection of unknown privileges, name alias and site-check authorization.
- Owner-record SQL test: inserted a Fusion profile into an explicit transaction, read back settings then rolled back; verified no test profile persisted.
- Sandboxed Chromium iPad-width (820 px) render: opened Fusion panel, changed reply_words to 35 and silence_seconds to 2, submitted mock owner-scoped save and verified payload; 0 JS exceptions and 0 horizontal overflow. This is NOT an authenticated production user interaction.
- Live adapter service restarted and health HTTP 200; anonymous GET and POST Fusion APIs returned HTTP401; unrelated SWADE Voice, browser workspace and site-monitor timer remained active; Chief of Staff remains chat_ready.

### Source and rollback
Code /opt/swadebase-adapters/routes/swade-bots.mjs and new routes/swade-bots-fusion.mjs; existing public/swade-bots.{html,js,css}. Schema and pre-release source backups: /opt/swadebase/backups/swadebots-os-foundation-20261114/. Rollback: restore prior route/html/js/css, restart swadebase-adapters; keep additive fusion table and customer profile records to avoid data loss. Do not drop tables or reset credentials. Release has no new payment, GPU, paid media generation, agent worker, or connector integration.

## Remaining stages — NOT LIVE
1. Expand canonical site/alias/owner-scoped knowledge and attach trustworthy GitHub repository metadata, live authorization status and read-only GitHub inspection. Track knowledge/source freshness and explicit staging vs production states.
2. Hermes compatibility sandbox on existing Hostinger worker tier. Evaluate license and security; implement tool registry, signed job requests, queues, idempotency, bounded runtime, worker audit, per-bot skills and cost ceilings. Do not swap the existing Rakazo system without compatibility and rollback tests.
3. Computer Studio: per-agent isolated browser profiles, short-lived owner delegation, view/inspect/pause/resume/take-control, multi-device sessions with explicit access grants and browser separation. Must never copy existing owner Google cookies into autonomous workers.
4. Memory, goals, SOUL identity, social inbox and approval-card system: per-person/role/tenant data boundaries, revision/revocation, verifiable memory sources, encrypted secret pointers, proactive routines and auditability.
5. Social & communications connections: X, Facebook, Instagram, GitHub, email through Mail Machine, SMS/WhatsApp and optional supported Apple messaging. App/API availability and permission scopes vary; status stays connection_required until owner OAuth and read/write approval verified.
6. Chief of Staff to worker execution: task lifecycle requested -> planned -> approved -> queued -> executing -> verifying -> completed, with blocked/failed/uncertain and forced stop; no money, public messages, publishing, production code deployments or permission escalation without explicit owner approval and independently enforced backend rules.
7. Brainiak and SSS Brain customer/owner experience: shared API and profile bundles with tenant-appropriate memory boundaries; no new backend database or duplicate workers. Pricing and billing to be decided after measuring real resource consumption.

## Core business and security rules
SWADEBASE is the secret locker; approved Site Bibles and source-of-truth documents are indexed, not infallible. Local-first, credits conserved, agents sleep when idle. Model instructions are not permission checks. Connection cards must show actual live last-verified status, scopes, owner, expiry and revocation path. Private credentials never enter prompts. Different users and businesses must remain isolated. Founder retains control.
