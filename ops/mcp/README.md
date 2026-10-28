# SWADEBASE Ecosystem MCP — operator release 1.0

Deployed 2026-10-25 inside the existing swadebase-adapters process. No new hosting, cloud database, paid AI calls, GPU generation or media copies.

- Operator UI: https://swadebase.cloud/adapters/mcp-connect
- MCP Streamable HTTP endpoint: https://swadebase.cloud/adapters/mcp
- OAuth discovery: `/.well-known/oauth-authorization-server/adapters/mcp` and `/.well-known/oauth-protected-resource/adapters/mcp`.
- Six tools: get Bible, search approved knowledge, list capabilities, route request, create internal task, retrieve own task. Current founder/super-admin access only.
- OAuth authorization-code flow uses explicit consent, S256 PKCE, exact client redirects, single-use expiring codes, audience-bound opaque tokens, server-side role rechecks and revocation. Raw tokens are not stored.
- Service SQL role reads only approved Bibles/standing rules through existing RLS. No shared checker token, founder service credential or model prompt can confer a user's authorization.
- Tasks use existing `handoff_log`, `source=swadebase-mcp`, coordinator `cos`, `needs_approval=true`, actor-bound idempotency. A handoff is not completed production.
- Current local Ollama classifier is bounded and optional. Deterministic routing remains available when it times out; no paid fallback. Live smoke used rules fallback, not a successful local-model classification.
- Brainiak server-side bridge plans recognized founder ecosystem requests. It forwards only the user's original verified token to the local adapter bridge. Customer permissions are not widened. Normal notes/tasks remain on their existing paths.
- SSS Brain/ReSing/native clients need this endpoint registered through OAuth before they can invoke it. No automatic integration into their existing chat is claimed.
- Costs/margins are not enforced for paid production in this release: no paid production action is exposed. The 60–90% target still requires a verified rate card, wallet/reservation/settlement and product adapter checks before enabling production.

## Verification
`npm run check`, `npm test` (8 tests), `npm audit --omit=dev` (0 findings). `node live-smoke.mjs` uses new short-lived deployment credentials, never reads existing secrets, verifies real OAuth/PKCE/CSRF/replay protection, official SDK tool calls against public HTTPS, current Bible retrieval, search, routing, task idempotency/approval and token revocation. It drops its test task and removes its credentials in finally. Run only as authorized deployment operator on the existing host. Live generation, actual press sending, customer entitlements and complete authenticated browser use were not tested.

## Deployment and rollback
Apply `schema.sql` with the database owner. Keep `node_modules` out of git; use the exact lockfile. Install imports/hooks in existing registry routes and retain `userId` on the existing verified admin session. Nginx exact OAuth metadata routes proxy to the existing 18795 service. Backups of edited registry/SSO/index and nginx files have `pre-mcp-<timestamp>` names. Syntax-check before restarting adapters and gracefully reloading nginx. Brainiak server/brain-api backups sit beside the current release.

For immediate stop, disable registry `swadebase-mcp`; all six tool services fail closed. Already issued tokens do not bypass it. Revoke tokens if needed. For code rollback, restore the specific pre-mcp backups (review concurrent edits first), restart the two existing services and validate nginx before reload. Retain schema, audit history and handoff records; do not drop shared data. A deploy must not overwrite concurrent mail/backend changes.

## Cost tools (added 2026-10-28)
- `swade_cost_report` — spend by project, provider/model and feature for today/7d/30d/mtd/all, plus each provider's recorded credit balance. Scope `ecosystem:read`. Read-only.
- `swade_rate_cards` — price per unit for each provider/model, with verified/unverified flags.
Source: `costs.mjs` over `swadebase_ops.ai_*` (schema `../costs/schema.sql`). Live check: load the adapter env and run `node costs-live-smoke.mjs`.

