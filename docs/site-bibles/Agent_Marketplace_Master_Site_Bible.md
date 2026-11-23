# Agent Marketplace — Master Site Bible

**Current priority, November 19, 2026 (America/Chicago): first storefront launch focus.** Existing public site: https://agentmarketplace.diy/ . New shared store/commerce work is prepared in draft PR 4 and not deployed.

## Identity and intended role

Owner: Swade / SWADEBASE Web Family. Canonical repository: private swadesoul/agentmarketplacediy. Canonical OnePass application id: agentmarketplacediy. The user also calls this the Marketing Skills marketplace. The owned site is distinct from the third-party coreyhaines31/marketingskills source library.

Agent Marketplace is the central catalog, licensing and delivery destination. Relevant subsets should appear in Maestro Radio, ReSingLab and SWAGENTS, then other approved family sites. Products must describe what buyers actually receive: instructions/templates, software tools, or a separately supported hosted service. A download or listing is not proof of agent execution.

## Existing source and observed public behavior

Inspected main baseline: 3f7b268c1ec19e5e42b1128e2da91d0fa78d2818. Public homepage and the AI Music Producer detail page loaded during November 19 inspection. Existing products/categories/pricing/tags/purchases/Vault/workspaces/typed entitlements/audit records can be reused. Actual customer checkout/access and complete production backend alignment were not verified.

Source browser identity is routed to SWADEBASE and agentmarketplace schema. Privileged server queries and auth middleware still read SUPABASE_* configuration with public schema defaults. This mismatch in source is a concrete launch verification item; do not infer the live environment or blindly apply the prepared public-schema SQL.

## Commercial direction

Start with a small tested collection while keeping the full 40-repository research backlog. Proposed packages: Product Launch Kit, Artist Release Kit, Radio Station Promotion Kit, Music Utility Kit, Website Review Kit, Document Intake Kit. These are proposals, not live products or approved prices. Measure time to accepted result, rework, actual model/infrastructure/support cost, conversion, delivery success, refunds and margin.

Prepare one reviewed promotion skill for a SWAGENTS growth agent using the existing SSS Brain Agent OS. Preserve scoped identity, site permissions, output evidence and cost limits. Default catalog matching and metadata lookup use local rules, not paid model calls. Existing AI subscriptions have usage costs/quotas; open-source licensing does not make hosted inference free.

## Agent Marketplace shared skills and stores — November 19, 2026

**PREPARED SOURCE / NOT DEPLOYED.** Founder prioritizes agentmarketplace.diy as the first storefront launch and wants one reusable skills store for Maestro Radio, ReSingLab, SWAGENTS and other Web Family sites. Forty repository candidates plus three discovery/specification references are recorded with role/job fit, licenses, dependencies, cost policy and disabled/unlisted status. These are metadata-reviewed candidates, not installed capabilities or approved products.

Agent Marketplace draft PR 4: https://github.com/swadesoul/agentmarketplacediy/pull/4 (source e36f5a4cfd762281dbb712ac721f513479179d09). Prepared public feed/embed, explicit admin product assignment, Maestro/ReSingLab/SWAGENTS profiles, current pricing/ownership UI and atomic license-specific purchase preparation. Local validation: 97 application tests, 14 isolated PostgreSQL fixture tests, TypeScript and production build passed. Fixture testing does not establish production RLS, real Stripe delivery, iPad acceptance or multi-connection load.

SSS Brain draft PR 128: https://github.com/swadesoul/sssbrain/pull/128 (source 27380c22d456761256c183278e3f6226782dbcda). Explicit-only Agent Marketplace marketing target; wrong-target fallback and cross-product draft reuse repaired in source. Seven focused tests passed; full SSS repository gates remain unrun. No campaign was sent or published.

The SWAGENTS executable skill attachment/entitlement-to-worker bridge is still proposed. Its observed catalog lists agent identities/plans. Reuse documented SSS Agent OS workers/workflows/runs/run steps and SWADEBASE identity/adapters, with selected pinned skills loaded only when a job needs them. No second agent runtime or paid recommendation call is added.

Launch gate: the marketplace browser client targets SWADEBASE agentmarketplace schema while server authentication/admin source retains legacy SUPABASE_* public defaults; actual deployed identity/schema alignment must be verified. Review SQL is outside auto-migrations and must be adapted only after that verification. Purchase-to-delivery, legacy sessions, stale pending recovery, refund/dispute, protected downloads, host audio/mobile and load acceptance remain open. No production schema, billing, DNS, site embed or runtime change was made.

Full source/design/research: https://github.com/swadesoul/agentmarketplacediy/tree/review/shared-skills-marketplace-20261119/docs . Canonical summary: site-bibles/Agent_Marketplace_Master_Site_Bible.md . Full candidate evidence: learning-approved/agentmarketplace-skill-catalog-2026-11-19.md .


## Release and recovery

Keep the draft source separate until the deployment identity/schema, real sandbox purchase-to-Vault/download flow and simultaneous-user checks pass. Deploy checkout, matching reviewed RPCs and webhook together; missing RPCs fail closed. Reconcile legacy sessions before switching.

Restore the previous frontend/server release or remove an embed to roll back presentation. Preserve completed payments, Vault/entitlement records, immutable order snapshots and audit receipts. Do not drop customer financial records. Source changes, host-site activation and executable skill activation have separate verified status.

## Canonical references

- Marketplace source/review: https://github.com/swadesoul/agentmarketplacediy/pull/4
- SSS Brain marketing source/review: https://github.com/swadesoul/sssbrain/pull/128
- Source launch packet: https://github.com/swadesoul/agentmarketplacediy/tree/review/shared-skills-marketplace-20261119/docs/LAUNCH_REVIEW_2026-11-19.md
- Reusable store contract: https://github.com/swadesoul/agentmarketplacediy/tree/review/shared-skills-marketplace-20261119/docs/SHARED_STOREFRONTS.md
- Agent capability contract: https://github.com/swadesoul/agentmarketplacediy/tree/review/shared-skills-marketplace-20261119/docs/SWAGENTS_SKILL_BRIDGE.md


## Agent Marketplace SSS CI follow-up — November 19, 2026

Draft SSS Brain PR 128 now includes follow-up commit 2f701508c1b535081307a0b3edb88052a62f6300. The seven-case review harness retains all cases and works in Node 24 and CI Bun 1.4.5; targeted Bun verification with the distribution suite passed 14/14. The full SSS CI remains unverified/blocked: its unchanged workflow uses bun test while package.json specifies Vitest, and existing tests call unsupported Bun stubGlobal/unstubAllGlobals APIs. Earlier CI also reported unresolved shared-knowledge/server-config failures. The initial harness incompatibility was fixed; no app tests were hidden or removed. Build/lint/typecheck in the failed full CI run were skipped. Marketplace PR 4 remains locally verified with 97 tests, 14 isolated SQL fixture tests, TypeScript and exact-source production build. Both PRs remain drafts; no runtime deployment occurred.


<!-- marketplace-pricing-delivery-20261119 -->
## Marketplace pricing, game skills and execution readiness — November 19, 2026

Owner priority remains agentmarketplace.diy, with one reusable catalog/store for Maestro Radio, ReSingLab and SWAGENTS. Source is prepared, not deployed by this task. No live skill price, checkout, credential, customer grant or hosting account was changed.

The latest commercial rule is $1 small skills, $5 individual skills, $10–$50 heavy packages, $5 known bundles and $20 mystery boxes. EVERY mystery box retains 21–25 distinct $1 products, guaranteeing at least $21 actual standalone catalog value; any $5/$10/$20/$25/$50 extras are additional. This supersedes the earlier two-$10 guarantee. No bonus probabilities are selected. Exact duplicate delivered content is rejected in policy v3, and editorial review must reject semantic duplicates. The observed catalog has no qualifying active $1 inventory.

Inventory: 32 saved custom skills, four SWADEBASE registry records, 53 inspected MarketingSkills files, 25 proposed $1 variants, and 30 proposed original game-building offers. None of the 30 game offers is certified for sale; named AI/model, engine, hardware, visual output, rights and export checks remain required. Twenty unverified ABAGALE error records were excluded.

Marketplace draft PR 4 is at 9c8f8b7f8e4f51fc961d2184d5d2039eca59401a: https://github.com/swadesoul/agentmarketplacediy/pull/4 . Final tests 127/127, TypeScript and current-source production build pass. Existing 14 isolated SQL fixtures pass; they do not prove real checkout, RLS or independent concurrent transactions. Browser/server schema alignment and real purchase/refund/protected delivery remain launch gates. Pricing policy returns checkout disabled and is not live fulfillment.

Zapier MCP is the existing connection path found inside SSS Brain: one encrypted saved grant and 17 cached generic tools, last cached probe September 25. Access token expired; APP_USER_CONNECTION_KEY_SECRET is absent from observed live runtime and inspected approved configuration locations. No replacement key or credential refresh was attempted. Cached tools do not establish Gmail/GitHub scopes. Composio code exists but no configured key was found. SWADE Connect is an ecosystem/site registry, not the third-party OAuth connection.

SSS Brain draft PR 129 at 752d7f9844ef86a32c3f78fe6222762002b1b473: https://github.com/swadesoul/sssbrain/pull/129 . It fixes stale token fallback, owner-scoped conditional refresh saves, safe metadata-only status and Zapier refresh/disconnect UI. Twenty isolated tests and focused TypeScript pass; full app/CI and credentialed refresh are not established. Process-local coordination is not a distributed provider lease. Prior marketing-target PR 128 remains separate at 2f701508c1b535081307a0b3edb88052a62f6300.

SWAGENTS draft PR 2 at fe79b95c7f5ec2aab22637ee6fee68c4ed5948df: https://github.com/swadesoul/swagents/pull/2 . Reuses support cases/tasks/receipts for a founder/admin-only pinned marketing-ideas local draft pilot; ordinary customer entitlement mapping is not enabled. Sixty-four Node tests and 7 PGlite SQL fixtures pass. The isolated Node 20 real-model canary FAILED with no draft, canary_timeout and zero output samples; cleanup was independently verified. An abort-timer repair is in source only. Automatic approval review rejected writing that repair to the staged model module because it interpreted staging permission as limited to the backend lease refresh. The rejection was not bypassed and no further inference was run. Production readiness stays false.

Every retail skill must provide a tested result, exact app/model/engine and hardware, original/licensed assets, useful return links, a local/own-server/optional SWOSTING route, itemized upfront and ongoing costs, and buyer-scoped API/MCP permissions. An optional SWAGENTS selling/publishing workflow requires its own verified capabilities, rights and operation scope. These are documented requirements, not universally implemented gates. SWOSTING public intake is live; paid fulfillment remains disabled. Historical service rates are not new gamer-hosting quotes.

Complete inventory/prices and cost sources: learning-approved/marketplace-pricing-delivery-2026-11-19.md and marketplace PR 4 docs/research. Workbook: SWADE_Skill_Pricing_2026-11-19.xlsx, file_id libfile_8d4f0bdc55008191b0430e4f3bf06882. No new paid service or subscription was purchased.
