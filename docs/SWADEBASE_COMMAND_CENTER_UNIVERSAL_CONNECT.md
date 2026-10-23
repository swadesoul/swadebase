# SWADEBASE.cloud Command Center — Voice + Text, Universal Connect
Founder product direction: SWADEBASE.cloud is the primary engine and operator interface for the entire Swade Soul ecosystem. SSS Brain can be an assistant/client of this control plane, but should not own a duplicate deployment engine.

## Operator journey
Authenticated founder opens swadebase.cloud -> Command Center -> speaks or types: "Connect the Black Tales Book Studio to all compatible sites, beginning with Maestro." System transcribes voice if needed, parses intention and site scope, shows real inventory, compatibility, costs and permission needs, creates a versioned dry-run plan, requests founder approval for production-wide/paid/destructive changes, executes staged integrations through existing repo/deployment connectors, verifies actual site routes and capabilities, then displays receipts and rollback links. No unapproved cross-site publication.

## Architecture (reuse first)
- One SWADEBASE service registry for sites (domain, repository, production branch, environment, owner, stack, current deployment revision, adapter version, auth and last verified state).
- One capability registry for reusable functions (book_studio, audio_studio, voice_studio, video_studio, payments, analytics); each stores provider, health check, version, install protocol, scopes, costs, prerequisites, schema/policy contract.
- One command intake (text + permissioned speech-to-text) authenticated with existing OnePass/GoTrue identity, typed intent parser (local Ollama default), and a *read-only* plan-preview mode.
- One execution controller with persistent idempotent jobs: DISCOVER -> VALIDATE -> PLAN -> APPROVAL -> STAGE -> TEST -> RELEASE -> VERIFY -> COMPLETE or ROLLBACK; separate per-site results and resume/retry.
- A thin adapter/agent per site where required; auto-detect existing integration and skip no-op, limit allowed GitHub paths/deploy operations, never install arbitrary code or secrets from prompts.
- Site-level tenant boundaries, RLS/least-privilege, short-lived tokens or managed secrets, explicit approvals, audit trail, cost ceilings and rollback points.
- One operator dashboard on SWADEBASE.cloud: command input with microphone, planned-vs-executed timeline, discovered site grid, health, modules, approve/reject, deployment progress and receipts.
- Keep books/media in existing approved Backblaze storage and existing Black Tales production services; do not duplicate engines or inherit originating site's editorial policies.
- Recognize failures: incompatible stack, missing consent/credentials, stale deployment mapping, nonfunctioning API, private auth, unavailable storage. Report honestly.

## Initial implementation sequence
1. Inspect what currently serves swadebase.cloud: this repository is based on upstream Supabase and is not proof of the deployed front-end or custom SWADEBASE services. Locate actual SWADEBASE Studio/UI source, authorized API, existing command interfaces and installed registries before editing a front-end.
2. Pilot read-only discovery for Maestro and Black Tales: prove repo/domain/deployed revision and book/voice workers.
3. Connect one verified feature (Book Studio) on a Maestro staging route through a site-scoped adapter; parity test chapters, audio, artwork and video; production stays untouched until reviewed.
4. Add voice input using existing authenticated STT; text and voice feed same command parser/approval workflow.
5. Expand to all opted-in sites, using staged canary rollout and halt/rollback upon regression.

## Status
Specification only; this does not assert the command dashboard, voice intake, universal rollout, or shared Book Studio service is deployed on swadebase.cloud.
