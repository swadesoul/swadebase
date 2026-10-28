# MCP Studio Master Site Bible

Version 0.1 — October 27, 2026, America/Chicago. PREPARED SOURCE; NOT DEPLOYED.

## Identity and purpose
MCP Studio is a private owner capability inside SWADEBASE, not a separate hosted product or a new execution engine. Proposed owner page: https://swadebase.cloud/adapters/mcp/studio. Source: ops/mcp in swadesoul/swadebase. SSS Brain remains the conversational front door; Swarvis remains its voice.

## Delivered source scope
First-phase source provides adapter inventory, recorded usage by project, existing rate cards and explicit coverage gaps. It extends the existing MCP process, owner console, session policy, registry kill switch and usage ledger. The complete application registry, authenticated API health, Tool Workshop, Test Lab UI, Repair Desk, approvals and recovery UI remain follow-up work.

The swade_studio_overview read tool exposes the same server read model. Existing tool names, OAuth contracts and native chat paths remain compatible. Registration and a live registry status are not proof of a working application journey. Studio does not introduce shell access, deployments, sends, purchases, database migrations or auto-remediation.

## Data and permissions
Read only selected adapter-registry metadata plus existing cost-report/rate-card queries. No new database, schema, grants, tables, secrets, customer copies or media storage. Never return adapter connections/evidence blobs or raw ledger metadata to this page. Inventory uses bounded parameterized pagination; price results are bounded to 50 entries with the full count retained.

Private page, script, stylesheet and data routes recheck the existing verified super-admin session. API reads pass the existing ecosystem:read guard and registry kill switch. Existing Origin/Host checks, no-store responses, rate limits and restrictive CSP remain enforced. Ordinary customer users gain no new permissions. OAuth tokens remain audience-bound; the read tool does not forward tokens upstream.

## Usage and pricing
Reuse makeCosts over swadebase_ops.ai_usage_ledger and ai_rate_cards. Record availability honestly. Ledger totals exclude unpriced calls and cannot prove complete instrumentation. No balance top-up or spend endpoint is exposed. The existing today period is displayed as Last 24 hours because the reused query is rolling rather than calendar-day accounting. Prepaid hosting remains separate from recorded per-call costs. No paid provider was invoked for this source work.

## Source preservation
GitHub default master a5cb19244c72394ee7be1ddce708da8eb98aa3b3 does not contain ops/mcp. The operating VPS has committed MCP source at local commit bbc49e8c01acb6cd4a0fd0344026b3c4843e01d7. Preserve the top-level MCP files from that commit in this review branch, then apply the bounded Studio additions. Do not claim this reconciles all divergent repository history or captures unrelated feature modules. Nested pending experiments, node_modules, backup files, secrets and an unrelated uncommitted core.mjs edit are excluded. Review deployment-hooks.patch against the current adapter server before any release.

## Verification
Isolated npm run check passed. All 45 tests passed on existing Node 22.23.3 and installed pinned MCP dependencies: existing 32 tests plus 13 added Studio model/route/protocol tests. They include SDK discovery/invocation/schema rejection, anonymous and ordinary-user denial, hostile-origin denial, super-admin inventory, kill switch, read-only SQL, pagination, CSP, sensitive-field omission and unavailable/unpriced usage. Existing services were not restarted and no live identities, sends or paid generations were created by these tests.

A separate BEGIN READ ONLY / SET LOCAL ROLE swadebase_adapters probe passed the inventory, ledger-field and active-rate-card SELECT contracts: 20 registered adapters, 16 active rate cards and no visible usage records. This proves those SQL permissions/contracts, not authenticated Studio delivery or complete metering.

Authenticated browser/iPad rendering, full service-to-database integration, public HTTPS Studio behavior, app-health coverage and production deployment are NOT VERIFIED. The phase must remain a draft until those release checks and source reconciliation pass. Do not describe the complete cross-app MCP or coding-repair system as delivered.

## Recovery and documentation
Rollback only the Studio additions to service, protocol, routes and console plus its new files; preserve the baseline MCP behavior, customer data, source snapshot and audit history. Update this Bible and SWADEBASE with actual release SHA, deployment, verification and rollback evidence after an approved release. Refresh current knowledge indexing then verify retrieval. Source-only review is not a shipped release or a refreshed knowledge index.
