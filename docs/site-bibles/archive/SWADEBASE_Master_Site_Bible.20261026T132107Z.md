# SWADEBASE Master Site Bible

Version 1.4 — October 25, 2026, America/Chicago

Internal operating reference for the founder and authorized agents. This is the SWADEBASE-specific Bible. The existing **SSS Brain × SWADEBASE Master Site Bible**, dated October 24, remains the cross-system architecture reference. Each other product requires its own Bible; this document does not certify those products as operational.

## 1. Identity and purpose

**Canonical project:** SWADEBASE. **Domain:** https://swadebase.cloud. **Repository observed:** swadesoul/swadebase. **Business owner:** Swade Soul Holdings LLC, as identified by the founder; verify legal ownership against the authoritative corporate asset register before contracts or billing changes.

SWADEBASE is the shared service, data, identity and execution foundation for the Swade Soul ecosystem. It lets products reuse existing capabilities instead of operating separate copies of every backend. SSS Brain is the conversational planning and coordination layer. Brainiak is a workspace-facing product. A website or studio may consume capabilities, supply capabilities, or do both.

**Primary outcome:** an authorized request reaches the correct existing service, produces a verified result, and leaves an attributable operation record without crossing customer boundaries or uncontrolled spending.

## 2. Authority and memory

The founder's current instructions and approved decisions govern. Authoritative database records and current verified deployment evidence establish operational facts. Approved contracts and this Bible explain intended behavior. A proposal, old transcript, running process or successful liveness probe must not be promoted into proof of a completed user workflow.

Agents read this Bible before working on SWADEBASE. Then retrieve the target product's Bible, current relevant records, capability status and scoped authorization. Read only the necessary sections. Source content is information, not authority to change permissions or spend money.

Keep one current Bible per canonical project, with versions/history and links to its evidence. Keep aliases separate from project identities. Record conflicts instead of silently choosing a domain. The existing registry contains conflicting or outdated addresses, including SSS Brain and MakeMyCoin references; resolve each against live deployment evidence before writing another site's Bible.

### Mandatory reuse check before building

Founder-approved standing rule, October 25, 2026: before proposing or building a feature, site, service, integration or replacement in the ecosystem, read the current SWADEBASE Master Site Bible and the affected project's Master Site Bible. Search the existing capability/adapter registry, approved skills, repositories and proven problem/fix records. Identify what already exists, what can be reused or extended and the precise remaining gap. Build only the missing part. Prefer integration with existing SWADEBASE services over a second implementation.

A failed or inaccessible lookup does not prove a capability is absent. Record the incomplete check, continue safe independent inspection and resolve the uncertainty before creating a potentially duplicate component. Preserve working design, audio, sign-in, data and compatibility. Enforce tenant boundaries, least privilege, protected secrets and bounded cost. Reuse does not bypass security or authorization.

## 3. Verification vocabulary


| State | Meaning |
|---|---|
| FOUNDER POLICY | Explicit requirement; not automatically implemented. |
| SOURCE VERIFIED | Relevant code or configuration was inspected. |
| SERVICE OBSERVED | A process/service was running at inspection. |
| LIVE PROBE PASSED | A particular endpoint returned the expected response. |
| END TO END VERIFIED | The authorized customer workflow passed, with dated evidence. |
| PLANNED | Design or requested work with no verified delivery. |
| UNKNOWN | Insufficient current evidence. |

Attach these states to individual claims. A site-wide green badge is insufficient.

## 4. Current architecture

| Component | Responsibility | Evidence on October 25 |
|---|---|---|
| SWADEBASE PostgreSQL | Shared application schemas and operational records | Tables and schemas inspected through the running database. |
| Kong, authentication, REST and administration services | Gateway, identity and data access | Containers observed; complete identity/tenant workflows not re-certified here. |
| Existing Hostinger servers | Applications, workers and temporary processing | Both authorized devices inspected. No new hosting purchased. |
| Coolify and systemd | Existing deployment/service management | Running services observed. Per-service release verification remains separate. |
| Adapter registry | Capability inventory, availability and audit | Source verified; service active; /adapters/health returned status ok. |
| Shared AI gateway and Ollama | Existing local-model access | Services observed; gateway liveness passed; model inventory included Qwen and Llama. No new inference benchmark performed. |
| Shared media core | Media routing and Backblaze asset operations | Source verified; health probe passed. No fresh paid production or Backblaze upload test performed. |
| Backblaze mirror | Durable copy of existing local storage objects | Source verified; copies files and deliberately retains local originals. |
| Product Operator skill | Specialized instructions derived from the existing growth skill | Saved and registered; definition delivery installed. Seven new tests and thirteen existing adapter tests passed. |
| What's New and press releases | Private change timeline and approved-release workflow | Deployed October 25. Source tests, existing adapter regression tests and route authorization checks passed. External health passed; page requires sign-in and API returns 401 without it. Live email delivery and visual browser checks are not verified. |
| SWADEBASE Ecosystem MCP | Authorized tools/resources/prompts over existing knowledge and handoffs | DEPLOYED. Official SDK client verified OAuth, Bible/search/routing, task idempotency and revocation through public HTTPS. Founder/operator scope only. |
| Ecosystem routing | Select existing programs for a requested outcome | Shared planner deployed; Brainiak server-side hook installed and unit tested. Live routing used rules fallback; local-model completion, native SSS Brain chat wiring and paid production remain unverified. |

Self-hosted components retain upstream Supabase package/container names in this installation. That does not by itself mean a product uses hosted Supabase. Verify actual destinations; preserve the founder's SWADEBASE migration policy and do not introduce a new hosted dependency.

## 5. Interfaces and capability discovery

Observed owner areas include the adapter registry, console, Corporate Advisor, Client Docs and Mail Center. These are private operational surfaces; their documentation is not permission to expose them publicly.

The installed skill-definition route is `/api/adapters/swade-product-operator/skill`. It uses the existing owner session or adapter-check service authorization and checks registry availability before serving instructions. An unauthenticated live request returned 401. Its kill switch controls definition delivery; consumer execution and in-flight cancellation remain the host application's responsibility.

The approved **SWADE Adapter Contract v1** defines side-by-side compatibility, authenticated status, capability descriptions, scoped operations, asynchronous job envelopes, signed callbacks and verification. Its documented target fields are not evidence that every existing adapter conforms. Preserve legacy routes until their callers migrate and the founder approves removal.

For each capability, record its real operation name, input/output contract, allowed caller, cost source, limits, dependencies, last successful test, failure behavior and owner. Never invent endpoint paths from a product name.

### What's New and press release workflow

Private owner page: https://swadebase.cloud/adapters/whats-new. It combines existing deployment records and adapter-registration history with manual process updates. Entries retain server-generated timestamps; the interface displays America/Chicago date and time. Planned, internal and shipped states remain distinct.

Manual changes use `swadebase_ops.whats_new_events`. Press drafts reuse `swadebase_ops.advisor_press_drafts`; delivery attempts use `swadebase_ops.press_release_deliveries`. No second press-draft engine or mail subscription was introduced. The route runs within the existing adapter service.

Select an update, supply a verified public title/summary, create a draft, edit, approve the current version, download or send to an explicitly confirmed recipient. Internal descriptions are not automatically included in the public release. Editing resets approval; content digests reject stale approvals and sends. The sender uses the service's existing configured outbound email credentials and remains unavailable if they are missing. Recipient-specific idempotency, persistent limits of five sends/hour and twenty/day, and outcome logs prevent blind resends. Provider acceptance is distinct from inbox delivery; uncertain outcomes require reconciliation. No live release was sent during implementation.

Implementation checkpoint: source commit `9934f84c8f` in the existing SWADEBASE repository. Four feature tests and thirteen existing adapter tests passed. Additional checks covered owner-only page/API behavior, CSRF, static delivery and unrelated-route isolation. Public health returned ok; the private page redirected unauthenticated access and the API rejected it. The environment lacked a usable local browser executable, so responsive visual behavior and an authenticated browser journey remain unverified. Approved outbound delivery also remains untested against a real recipient.

## 6. Identity and ownership


Founder-designated super-admin account: swadesoul@gmail.com. Apply actual server-side role checks and audit privileged actions; the account's name does not authorize arbitrary customer impersonation.

Derive user, organization, workspace and site from verified credentials. Check ownership on every relevant operation. Keep customer connections separate from founder credentials. Do not grant cross-product access merely because a request mentions another program.

The adapter service's source supports a shared super-admin session with role rechecks. Complete browser login, expiry, revocation and customer isolation require their own dated tests.

Store no passwords, provider keys, private wallet keys, session tokens or customer secrets in any Site Bible. Record secret-reference names only when necessary.

## 7. Storage policy

Backblaze holds durable media, downloadable products and appropriate archives. SWADEBASE holds ownership, permissions, metadata, checksums, versions, provenance and original-object references. The VPS retains running software, required databases/model files and bounded temporary working files.

Upload → verify object integrity and authorized retrieval → record the durable reference → expire eligible temporary files. A successful mirror alone does not authorize deletion of legacy originals; current playback/download paths may still need them. Legacy migration must verify those paths first.

Do not copy the same original into every consuming product. Do not copy complete mailboxes or repositories into ordinary memory by default. Keep bounded excerpts and references appropriate to the task.

## 8. Commercial and usage policy

FOUNDER POLICY: target 60–90% margin on platform-funded work, with an 80% planning default. Hosting is prepaid for the year; it is not a new per-job purchase. API credits still have replacement cost. Account for provider calls, bounded retries, incremental compute, storage/delivery and applicable billing fees. Distinguish variable contribution from total profitability after fixed costs.

Unknown costs must block paid execution. The shared runtime needs verified rate cards, aggregate durable reservations, concurrency/rate limits, bounded retries, settlement and refunds/releases of unused reservations. Customer-owned keys do not provide unlimited platform resources. Gifts/founder work use a recorded subsidy budget and are not automatically profitable.

The skill's cost calculator supplies advisory estimates; it does not implement or enforce a wallet. Brainiak's inspected promotional-credit code explicitly kept production spending disabled pending a verified rate card/wallet. The Brainiak limits document likewise labels its commercial controls as a draft. Do not advertise those controls as enforced until verified.

## 9. Operating workflow

1. Identify the authenticated actor and target project; load this Bible and the target project's Bible.
2. Read the current scoped records, capability availability and source evidence.
3. Plan the requested outcome using existing services; surface only material missing choices.
4. Enforce permissions, product access, cost ceiling and applicable authorization before mutation.
5. Submit an idempotent operation through the existing dispatcher/worker; retain its job ID.
6. Follow progress and reconcile timeouts before resubmitting paid/external work.
7. Verify the delivered file, external object or customer flow; store references and receipts.
8. Record measured usage, unresolved failures and any resulting Bible change with evidence.

Example: a school event can use The League Sound for team context and connected music/video/voice services for outputs. These are routing intentions until each adapter path is tested. Optional delivery credits name only products actually used and follow white-label settings.

## 10. Safety and maintenance

Preserve working audio, voice, sign-in, user records and site design. Use the existing approved site-agent rules: own-site authority does not confer control over shared infrastructure. Shared components have designated owners. Existing approval boundaries remain in effect; do not interpret a Bible as expanded operational permission.

Before a change, inspect current source and unrelated modifications, capture a recoverable baseline, apply the smallest scoped change, test relevant behavior and verify production if deployed. Preserve history. Do not commit credentials or private customer records to public repositories.

For an incident, record symptom, affected project, evidence, cause, fix, verification, prevention and rollback. Keep this in the existing problem/fix and operations records; link the incident from the affected Bible.

## 11. Known gaps and next verification

- The authenticated MCP knowledge/planning/handoff journey passed. Customer execution permissions, paid production and complete autonomous cross-program delivery are not verified.
- Installed skill delivery does not automatically wire the skill into Brainiak or SSS Brain chat execution.
- Brainiak now has a server-only founder routing hook for recognized ecosystem requests. Its live browser/chat journey remains unverified; no production tools were enabled.
- Gmail's specification describes incomplete action/multi-account work. Verify deployed behavior independently.
- The existing Backblaze mirror does not reclaim VPS space.
- Ecosystem registry names/URLs contain conflicts. Reconcile canonical identities before populating product-specific deployment facts.
- Per-site release SHA, rollback proof, actual billing readiness, tenant tests and provider health need their own evidence.

## 12. Sources and update rules

Sources inspected: the October 24 combined SSS Brain × SWADEBASE Master Site Bible; `docs/SWADE_ADAPTER_CONTRACT_V1.md`; `docs/site-agents/SPEC.md` and `DECISIONS.md`; `docs/BRAINIAK_USAGE_LIMITS_AND_JOB_BUDGETS.md`; adapter registry/server source; shared media core and Backblaze mirror source; Brainiak handler/admin source; database catalog; service inventory and limited health probes.

Retain older documents as history. This Bible does not silently supersede approved contracts or decisions. After a verified feature change, update only relevant sections, link the commit/deployment and test evidence, increment version, preserve prior content and record who changed it. Review operational facts again before a consequential action; a date on this Bible is not a perpetual health certificate.

### Major change documentation gate

Founder-approved standing rule, October 25, 2026: update the affected site's Master Site Bible after every material architecture, feature, API, schema, authentication, permission, storage, pricing, provider, deployment or operational-workflow change. Update this SWADEBASE Bible as well whenever shared behavior changes. Record the date, version, decision, source commit or deployment, actual state, verification evidence, known issues and recovery/rollback details. Preserve the previous version and refresh the current knowledge records.

Verify that the current version can be retrieved through the intended agent path. Do not call a major change fully handed off while the Bible is stale. If documentation or retrieval is blocked, keep that status explicit and complete the update when access is restored. This rule is recorded policy and agent instruction; automatic build/deploy enforcement is not yet verified.

### Version history

- Version 1.3, October 25, 2026: authenticated MCP and shared operator planner deployed; Brainiak routing hook installed; live OAuth/SDK checks passed. Costs/customer-production boundaries remain closed.

- Version 1.0, October 25, 2026: first SWADEBASE-specific baseline, source inventory and per-site Bible structure.
- Version 1.1, October 25, 2026: founder's mandatory reuse-first check, security/interoperability requirement and major-change Bible update/retrieval gate.
- Version 1.2, October 25, 2026: deployed What's New/press workflow, evidence, delivery limits and remaining verification. Founder directs completed authorized changes to be tested, deployed and checked live.

## 13. Required structure for every other Site Bible


Every canonical product gets one separate Bible with these sections:

1. Identity, aliases, canonical domain and business owner.
2. Purpose, target users and successful outcomes.
3. Features and limits, each with its evidence state.
4. Customer journeys and representative requests.
5. Frontend/backend repositories, hosting and current deployment.
6. Database schemas, data ownership and migration status.
7. Authentication, roles, customer connections and access rules.
8. Dependencies, adapters, callable tools and capability contracts.
9. Media/object storage, retention and original-asset references.
10. Pricing, billing, entitlements, rate sources and cost controls.
11. Background jobs, schedules, monitoring and support ownership.
12. Known problems, fixes, regression evidence and operational runbooks.
13. Backup, recovery, rollback and release verification.
14. Source links, dated decisions, version history and next review.

Populate from current source, records and tests. Use UNKNOWN where necessary; do not copy another site's architecture or call a template a completed audit.

## 14. Initial Bible sequence

Start with SWADEBASE, then SSS Brain, Brainiak, ReSing Lab, The League Sound, VideoSayWhat, TeachVirt, Black TALES and OATHLOOM. Continue through the reconciled ecosystem registry. This sequence does not change the previously approved site-agent rollout order.

Connect each completed Bible to existing SWADEBASE knowledge records. The deployed MCP retrieves current approved Bibles and relevant sections through authorized tools/resources. SWADEBASE retrieval passed a live official-client test. Every additional Bible still requires source review and verified retrieval.

## Mail Center extension — version 1.2, October 25, 2026
Professional mailbox management now uses verified SWADEBASE super-admin sessions, Mailcow API, expiring single-use user password setup links and sanitized audit records. Existing and future active IMAP-enabled Mailcow mailboxes can use the shared local-AI Enhance page; selected drafts only, no inbox reads or sending. Brainiak mail domain/MX/SPF/DKIM/DMARC were provisioned. Security/API/TLS/local-model integration tests passed; real browser/iPad/external delivery checks remain unverified. Sources, quotas, boundaries and rollback: BRAINIAK_PROFESSIONAL_EMAIL_AND_ENHANCE.md and site-bibles/Brainiak_Master_Site_Bible.md. Shared service files changed under /opt/swadebase-adapters; no paid provider/model added.

## 15. Ecosystem MCP — deployed operator release 1.0

Owner UI: https://swadebase.cloud/adapters/mcp-connect. MCP endpoint: https://swadebase.cloud/adapters/mcp. Runs inside the existing adapter service on Hostinger; no new service subscription. The old SSS Brain public echo/about MCP is preserved and is not the authorized production interface.

Six tools retrieve a Site Bible, search approved Bibles/standing rules, list registry capabilities, route an outcome, create a task in the existing coordinator queue, and retrieve that actor's task. A Bible resource and an ecosystem-operator prompt are exposed. Existing knowledge tables retain RLS; the adapter SQL role sees only approved Bible/standing-rule paths. Registry status is not a production certificate; missing Bibles/inactive adapters remain explicit.

Authorization-code OAuth uses dynamic public-client registration, explicit super-admin consent, S256 PKCE, exact redirects, single-use two-minute codes and audience/issuer-bound 30-minute opaque tokens. Only hashes are stored. Every request rechecks current super-admin status; scopes distinguish reading, planning and task writing. Tokens can be revoked. Same-origin owner UI mutations require CSRF. Shared checker/owner tokens cannot mint identities. Customer accounts receive no broader cross-product rights.

A routing request reads the current main Bible and registry, then uses the existing local Ollama model if it completes within its allowance. Bounded deterministic routing is the fallback; no paid provider fallback. Live testing used rules fallback after local-model timeout. This release therefore verifies useful routing but does not claim local-model intelligence has passed its production benchmark. Production output is neither generated nor credited by a routing plan.

Tasks reuse swadebase_ops.handoff_log, source swadebase-mcp, target coordinator cos, needs_approval=true and actor-bound idempotency. They do not start production. Brainiak's existing handler now calls the local planner for recognized founder ecosystem requests using its server-held verified user token; it does not expose the token in model context or responses. Notes/tasks keep their existing handlers. Full authenticated Brainiak browser use and ReSing chat integration remain unverified. Native SSS Brain chat now uses the shared planner and can explicitly save/read back a plan in existing user knowledge; see the verified checkpoint below.

The target 60–90% margin is founder policy, not an enforced paid-production guarantee. This MCP exposes no paid generation/publication/sending/shell action. Verified rate cards, durable reservations/settlement, customer entitlements and working product adapters must precede enabling production. Existing storage policy still places durable media in Backblaze; this release creates no media copies and deletes no legacy originals.

Verification: eight new Node tests and thirteen existing adapter regression tests passed. Public HTTPS smoke verified registration, explicit consent, CSRF rejection, wrong PKCE rejection, single-use authorization code, official SDK discovery of six tools, actual Bible retrieval/search, prepared routing, idempotent approval-required handoff, and token revocation. Temporary credentials were removed and test handoff dropped. Production dependency audit found zero vulnerabilities. No paid provider call or external message was sent. Visual browser validation and real production/delivery were not performed.

Source/runbook: ops/mcp/README.md, schema.sql, route.mjs, service.mjs, protocol.mjs, brainiak-operator.mjs and live-smoke.mjs in the existing SWADEBASE repository. Recovery: disable the swadebase-mcp registry entry to block tool operations; revoke tokens if required. Restore reviewed pre-mcp registry/SSO/index/nginx and Brainiak server/handler backups to roll back code, syntax-check, restart the existing services and reload nginx. Preserve shared data/history. Review concurrent changes before restoring files.

## ABAGALE Printify merchandising checkpoint — October 25, 2026

The existing ABAGALE Printify shop 27971409 was reused, not duplicated. Einstein Krew has five real Printify products: black and white front-print caps, an AOP cut-and-sew tee, sweatshirt and bomber. All have price values from per-variant provider cost times 1.25, real mockup references, and synchronized product records. The three AOP garments were generated from four print positions each. Provider mockup visual certification, on-device QA and member-only Stripe fulfillment remain unverified and checkout remains disabled. ABAGALE database now defines merch_products.access_type ('public' or 'einstein_krew_only'), with the five Krew items restricted; existing non-Krew products default public. Website release /var/www/abagale-app/releases/ek-aop-public-gallery-20261025 exposes the gallery publicly while order functionality stays gated. Previous release reference: /root/abagale-press/checks/ek-merch-public-previous-20261025.txt. The earlier Printify product IDs and all product records are preserved. Public ABAGALE 5-style merchandise product batch is not yet built, and the storefront checkout for public products has not been re-certified.

## ABAGALE public merchandise / Einstein Krew update — October 25, 2026

Added ABAGALE product `access_type` to the existing `abagale.merch_products` with allowed values `public` and `einstein_krew_only`, and applied restriction to all five Einstein Krew entries. No new shop/database/service introduced. ABAGALE shop 27971409 now has 10 synchronized garments: five Krew-exclusive (black/white caps, AOP tee/sweatshirt/bomber) and five public AOP tees (Creator Hustle, Network Energy, Producer Mode, Broadcast Culture, Creator Sayings). The products were created through the authorized existing Printify connection with all four required AOP image positions and per-variant costs/prices read back at production cost x 1.25, without automatic checkout activation. SWADEBASE catalog records retain provider images, cost, price, Printify IDs and access type. Public gallery paths: https://abagale.live/abagale-store and https://abagale.live/einstein-krew/merch; deployed release `/var/www/abagale-app/releases/abagale-public-merch-five-aop-20261025`; rollback release reference `/root/abagale-press/checks/abagale-public-store-previous.txt`. Production build passed, both pages returned HTTP 200 and DB shows 5 public + 5 Krew-exclusive products. Not certified: visual Printify print-coverage QA for every variant, iPad Safari render, Stripe account/payment/fulfillment, member-only checkout test, Printify publication acknowledgements. Purchases remain disabled. Public sweatshirts, jackets and hats are not yet created. No paid Printify orders were placed. Avoid treating publicly listed as orderable.


## Native SSS Brain operator — verified October 25, 2026

SSS Brain PR #92 merged as 134aa39607eae022700ad9fa87e6a0d8a4c919a7. Existing Coolify deployment heebzwto0rnpe1ss2twzg01l finished; the new container became healthy and rolling update completed. The existing chat handler calls the shared Bible-first planner for recognized ecosystem requests after identity/secret checks and before a paid model initializes. rules_only=true skips local inference too. No new service, database, scheduler or paid API was added.

An explicit save-plan request reuses the signed-in user's brain_wiki_pages, stable submission-derived slug and readback verification. Thread ownership is checked. Other customer permissions and unrelated chat paths remain unchanged. Native responses use the existing UI message stream protocol. The original paid-provider path remains for unrelated chat; this is not a claim that all SSS Brain usage is free.

Five native tests and nine shared MCP tests passed. A temporary user authenticated through real GoTrue and invoked public HTTPS /api/chat: school anthem/video routing, saved knowledge, exact readback and retry idempotency passed. Another thread ID was denied; removal of the operator role denied the shared bridge. Temporary identity, role, thread, messages and draft were removed. No production, external send or paid model call ran. iPad/browser visual tests and paid production remain unverified.

Current SSS Brain Bible: site-bibles/SSS_Brain_Master_Site_Bible.md, also committed in swadesoul/sssbrain. Source: src/routes/api/chat.ts, src/lib/ecosystem-operator.server.ts, ops/operator/verify-operator.mjs. Rollback: retain/redeploy the previous Coolify image; revert the scoped chat/helper source without deleting saved user knowledge. Shared rules-only planner support is additive.

## Brainiak contextual business promotion — founder direction October 25, 2026

PLANNED, not deployed: businesses pay to register their verified domain(s), public offer and relevant customer needs. When another Brainiak user makes a relevant request, an agent may return a clearly labeled sponsored business result alongside the independent answer. This is separate from private business-brain notes and connections. Do not automatically publish private descriptions, mailbox contents or repositories as advertising data.

Founder selected both a private business brain and optional promotion, with the existing $79/month Business price and separately funded promotion. Advertising rates, domain limits, campaign billing, funded budgets, impression/click measurement, moderation, domain verification and agent boundaries still require implementation and verification. The existing gifted promotional_credit_ledger is not a cash-funded ad wallet. Existing Brainiak checkout remains disabled. The Stripe plugin exposed a different sandbox account from the documented shared SWADEBASE merchant; do not substitute it or report payments ready.

Gravity research is reference evidence only, not a live integration or a distribution guarantee. Reuse SWADEBASE identity, existing workspaces, product grants, receipts, approvals, billing and existing local/rule matching where verified. Native sponsored delivery, domain ownership proof and paid-campaign execution are not certified by the native SSS Brain knowledge test.
