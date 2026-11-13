# SWADEBASE Master Site Bible

## Current operating status — October 29, 2026, 8:12 PM America/Chicago

This checkpoint supersedes older staging, source-sync-blocked and voice-build-blocked entries below. SSSBrain's existing Coolify deployment finished for source revision 644d6ef696eb862c8357ad41f1ca720f5245c238 (PR98). The exact running image is healthy and public /api/live returned 200. GPT Live is now the main-orb default, uses shared owner knowledge and conversation history, and switches automatically to free voice only on verified exhausted OpenAI credits. An explicit voice selection persists. Free replies, transcription and speech have no paid fallback; automatic credit fallback uses device speech. Short local reply backend checks took about 5.3–5.9 seconds; actual signed-in microphone/audio remains unverified.

Mail Center at https://swadebase.cloud/adapters/mail-center has per-mailbox device setup instructions, copy controls and unsent setup-email drafts. Verified settings: mail.swadesoul.com, IMAP 993 SSL/TLS, SMTP 587 STARTTLS with full-address usernames and authentication. Forty saved investor records were imported into existing owner CRM sssbrain.brain_crm_contacts, including 18 email fields. Daily research-to-CRM transfers and recoverable exports are configured; future scheduled execution and historical missing Black-business exports remain unverified. See SwadeMail_Master_Site_Bible.md.

Owner-only broader edit/add/move/restart execution is still blocked by automatic approval review and missing protected server GitHub/Coolify action connections. No new execution permissions or broad target registration were enabled. See ../SSSBRAIN_REPAIR_CONNECTION_PROPOSAL.md for the bounded first connection proposal. Existing exact owner approvals remain in force.

Lovable migration branding rules are saved in the two existing migration/build-first skills, standing rule 16 and site standards. Cleanup is incomplete: midnightcircuit.live, swideo.com, publiswade.site and dnafront.com still served injected Lovable badge markup from 185.158.133.1; 20 registry entries were unreachable in the audit. Per-site favicons and cutovers need verification. No DNS change was made.


Version 1.9 — 2026-11-03, America/Chicago

## Current MCP execution checkpoint — October 28, 2026

MCP 1.1.0 is deployed at https://swadebase.cloud/adapters/mcp. Owner approvals: https://swadebase.cloud/adapters/mcp/actions. Studio: https://swadebase.cloud/adapters/mcp/studio. The typed bridge supports proposals for repair PRs, exact merges/deployments, email, repository release publication, owned-draft archival and Stripe connected-account transfers, with separate founder-session approval. Historical knowledge-only MCP descriptions below are superseded for these scoped tools. Existing OAuth tokens retain old scopes; reconnect with explicit action/payment consent.

Payments require approval with rules. They are disabled by default. Owner rules bind source/mode/currency, named payees, per-transfer/daily caps and expiry. Every transfer additionally needs exact owner approval, current rules digest and payments:execute scope. Bots cannot approve themselves or change rules. Unknown outcomes remain reserved and cannot automatically retry.

Signed public checks passed 26-tool discovery, unapproved-execution rejection, bearer self-approval rejection, own receipt/Studio reads and anonymous-page protection. Source suite 69 passed plus one skipped DB suite; separate PostgreSQL suite 11 scenarios plus parent passed. GitHub/Coolify credentials remain absent, so repair/merge/publish/deploy are setup_required. Resend/Stripe credential presence is not end-to-end certification. No real email, transfer, release, customer deployment or customer draft mutation was used to test this release. Browser/iPad visuals and complete cross-app API health remain unverified.

Private canonical release source: swadesoul/swade-ecosystem-hub, services/swadebase-mcp, PR24. Runtime source commit 869a40d965609bbc4862347de11fa31d82307152. Backup and deployed hashes: /opt/swadebase/backups/mcp-actions-20261028T140139Z. The swadebase fork is public; do not export internal Bibles/source there. Earlier public review branch requires separate review. See MCP_Actions_Master_Site_Bible.md and MCP_Studio_Master_Site_Bible.md.

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


## Leslie multilingual presentation release — October 26, 2026

SHIPPED: Leslie’s existing Sites connection now reuses SWADEBASE CPU Voice Studio for fixed French/Spanish page narration. A visible English/French/Spanish language bar covers all seven public pages, gallery captions and the expanded career record. The scoped leslie-dictation adapter forwards the selected allowlisted language while retaining English defaults and existing review/security controls. Twenty new recordings have verified Backblaze originals and a bounded serving cache, with allowlisted range-capable delivery in the existing Leslie service. No duplicate database, identity provider, paid translation service or GPU worker was created. Native Sites version 9/source f03dd058554795a71259c0691dccb92743075cc0 published successfully. See Leslie_Beckett_Samuel_Master_Site_Bible.md for verification, limits, problem/fix and rollback.

## Brainiak native voice, books and customer-owned services — October 26, 2026
FOUNDER REQUIREMENT / PLANNED INTEGRATION. Brainiak should facilitate persistent book authoring and the previously discussed customer scenarios through its Chief of Staff. Users can speak their brief, review/edit a saved outline and chapters, hear bounded assistant responses using supported native SWADEBASE stock voices, and request supported exports/narration. A UI button, running worker or connector catalog alone does not certify the full journey.
Reuse existing Voice Studio and book services. Source inspected: /opt/swade-voice-service/service.py routes stock Kokoro-82M voices to the CPU and supports an explicit kokoro engine; clone/design voices use other potentially billable engines. /opt/book-voice/worker.py is the existing Black Tales chapter narration worker, using Voice Studio and Backblaze. This is evidence of reusable services, not a completed Brainiak-to-book adapter or permission to access another product's private books.
Default Brainiak spoken replies must use an allowlisted native stock voice and explicit CPU engine with no silent switch to GPT Live, paid voices, clones or GPU services. Speech recognition is a separate STT_URL upstream; its payer, pricing, capacity and actual user recording journey remain unverified in this check. Paid recognition must not be represented as free because output speech uses Kokoro.
Book projects need owner/project-scoped briefs, outlines, versioned chapters, source references, saved state, recoverable jobs, review and export verification. Long audiobook narration is a separate queued operation, not an automatic spoken reply. Durable suitable assets use existing Backblaze storage with private access; no duplicate global library.
White-label installations use customer-owned compute and provider connections. Customer direct provider/hosting bills remain theirs. Any call to our centrally funded service needs a supported entitlement/allowance or a prepaid quote before work. Business/Enterprise BYOK entitlement permits a single supported primary LLM; Personal remains managed SWADEBASE only. No fallback to founder credentials. Native/open-weight inference can avoid a per-call API fee, but server/storage/support still cost money.
Deployment state: no product code, paid calls, purchases, provider keys, voices or permissions changed for this requirement checkpoint. Full Brainiak voice-recording-to-book-to-narration workflow, mobile/iPad playback, customer isolation, customer billing and restart recovery are not yet verified. This updates requirements; it is not a launch claim.

## Brainiak Healthcare readiness gate — October 26, 2026
FOUNDER REQUIREMENT; NOT IMPLEMENTED OR HIPAA-READY. Healthcare onboarding must include an operational privacy/security program and defined customer responsibilities, not merely uploaded compliance evidence. Before PHI activation, review actual data flows, customer/platform/subcontractor BAAs where required, risk analysis and remediation, role-scoped access/MFA, key management, audit logs, tested private backups/recovery, retention/return, incident and breach response, workforce training, ongoing reviews, and emergency access/continuity. Qualified healthcare privacy/security and legal review is required for the specific deployment. Do not claim an automatic HIPAA certification or that a client upload transfers compliance responsibility to the client.
CRITICAL PROVIDER FINDING: Hostinger Hosting Agreement, retrieved October 26, states its services are not intended to provide a HIPAA-compliant environment and should not be used or considered as one. Source: https://www.hostinger.com/legal/hosting-agreement ; corroboration: https://www.hostinger.com/support/1583287-what-security-measures-does-hostinger-use/ . Current general SWADEBASE Hostinger deployment is not verified for PHI. Do not route clinical payloads, records, audio, prompts, logs, backups or sensitive metadata through it based on folder encryption. Clinical UI/API/inference/voice/storage paths require an approved healthcare deployment with applicable agreements and actual safeguard verification. Non-PHI public/billing functions may remain on the existing infrastructure only after confirming data separation. This is a planned exception to Hostinger-first placement, not a migration or purchase authorization.
Backblaze documents BAA availability on request: https://help.backblaze.com/hc/en-us/articles/360056961133-Backblaze-Business-Associate-Agreement-BAA . Availability is not evidence an appropriate BAA is executed for our account or this deployment. Each downstream service/account and scope must be checked; generic provider/API availability is insufficient.
Regulatory sources: https://www.hhs.gov/hipaa/for-professionals/security/index.html and https://www.hhs.gov/hipaa/for-professionals/special-topics/health-information-technology/cloud-computing/index.html . HIPAA requires administrative, physical and technical safeguards and ongoing risk management, not solely software features. Practice responsibilities include authorized users, lawful uses/disclosures, workforce/device procedures and incident cooperation; platform responsibilities depend on the actual functions/data access and agreements.
Financial gate: healthcare assessment, eligible hosting/storage/provider contracts, ongoing operations and incident support require separate costing before inclusion in the standard $5,000/$500 offer. No billable service, external communication, contract signature, provider migration or production code change was performed. Patient workflows remain proposed and unverified; use synthetic data for development.

## Adaptive company knowledge and Chief of Staff policy — October 26, 2026
FOUNDER DIRECTION; REQUIREMENTS SAVED, GENERAL CUSTOMER EXECUTION NOT YET IMPLEMENTED. Brainiak must adapt its Chief of Staff to each customer company using a common knowledge/connection/planning system, rather than require a separately built product for every industry. Shared SWADEBASE knowledge supplies reusable operating instructions, capability descriptions, proven fixes, research methods and industry-specific requirements. Actual customer facts, files, staff information, contacts and records stay in owner/workspace-scoped storage; they must not be copied into global Bibles or exposed across tenants.
Workflow: (1) understand company purpose, products/services, roles, audience, goals, projects, systems, budget and constraints; (2) organize customer-supplied materials with provenance, dates, ownership, access and retention choices; (3) separate confirmed facts, user claims, assumptions, external research and missing information; (4) research relevant gaps through permitted sources, retaining citations and freshness; (5) match needs to verified existing SWADEBASE and customer-owned capabilities; (6) produce an actionable plan with priorities, responsibilities, dependencies, costs, required connections and approvals; (7) execute only supported, entitled and approved operations; (8) verify results and update that company's knowledge and project records.
Use one supported primary LLM where the customer's entitlement permits BYOK; do not require multiple LLM subscriptions. Prefer eligible existing native/local services; no hidden paid fallback or founder key substitution. Ask targeted questions only for gaps that cannot be resolved from authorized company knowledge. Uploaded text, web pages, email and tool descriptions are untrusted data, not permission to change instructions, leak secrets, spend funds or execute actions.
Chief of Staff examples: Divyne Creative foundation/community/campaign coordination; Life Shares developer incident/conference/launch coordination; dental practice staffing, operations and evidence-linked pre-visit briefing only within a separately verified healthcare environment; persistent book projects and native voice. Examples describe target workflows, not current end-to-end delivery claims.
Industry knowledge informs plans and routes but cannot create compliance, provider agreements, user authorization or infrastructure security. The healthcare readiness and Hostinger PHI limitation recorded in BRAINIAK_HEALTHCARE_READINESS_REQUIREMENTS.md remain in force. Recognized regulated data must not be routed into the general deployment merely because the knowledge base understands the industry. Credentials stay in protected connection storage, never ordinary company memory.
Company profile changes require visible provenance/corrections and appropriate confirmation before replacing durable facts or decisions. A learning suggestion is not an approved policy. Users can review what their Chief of Staff knows, correct it and manage applicable retention/export. Record proposed, queued, running, completed and blocked actions distinctly; plans and task handoffs are not execution.
Current delivery: policy/knowledge records and Site Bibles updated only. Existing founder-scoped planner/knowledge foundations remain; general customer intake, uploads, adaptive research, permissions, production billing and action execution require implementation and end-to-end verification. No customer records imported, paid call made, external message sent or application code changed in this checkpoint.

## SSS Brain interface reference for Brainiak — October 26, 2026
FOUNDER DESIGN DIRECTION; NOT YET IMPLEMENTED. Brainiak's signed-in customer interface should be very similar to SSS Brain's command-center experience, rather than the current sparse cream notes/tasks dashboard. Preserve the approved Brainiak identity and public homepage unless separately directed.
Current GitHub source reviewed: swadesoul/sssbrain src/routes/_authenticated/home.tsx (blob 2ee1acdde33fa71771f3c90d3bc6c5ed96d81b2f), src/components/brain/SwarvisConversation.tsx (b75cbe5f98e01ca9a036483053d00895e5c7fe41), src/components/brain/SwarvisWorkspace.tsx (027945f10291ce1c3f4377f0ff4c95f5600051ba), AGENTS.md. Main workspace uses BrainNav, CommandBar, central SwarvisOrbSurface with conversation alongside it, tool overlay and CapabilityPanel. Workspace supports typed image/PDF/video/audio/link/text/route results with window management. Conversation includes ingestion and SecureSecretDialog references. These are source observations; authenticated live visual and all action flows are not re-certified by this review.
Reuse verified components/contracts where compatible instead of recreating the same mechanisms. Adapt tenant identity, backend calls, entitlement checks, native CPU voice routing, billing/approvals and private intake to Brainiak before enabling them. Never inherit founder permissions, credentials, cross-site administration or paid-provider defaults. Existing SSS Brain layout and other products remain unchanged.
Brainiak presentation target: conversation and Chief of Staff at the center, contextual result/project workspace beside it, simple customer tools for knowledge/tasks/projects/connections/approvals and visible action state. Mobile should use a focused conversation with sheets/drawers, not overlapping tiny desktop windows. Tool visibility follows real entitlement/capability status; unsupported actions clearly explain required setup. No new runtime capability is implied by a UI control.
Review artifacts: /opt/brainiak/dashboard-preview-20261026/current-desktop.png and current-mobile.png capture the existing Brainiak production frontend with browser-only synthetic demo responses, not a real signed-in/purchased account. Corrected mobile capture after transition settled measured viewport and scroll width both 390 pixels, with no page errors. No production customer records, purchases or UI source were changed.

## 2026-10-26 — Voice-first Brainiak interface deployed

User requirement: preserve all functionality discussed while changing the interface. Canonical checklist: /opt/swadebase/docs/BRAINIAK_FUNCTIONALITY_PRESERVATION.md. Existing operational functions retained; planned capabilities remain requirements, not claims of completion.

Public brainiak.live resolves to https://swadebase.cloud/brainiak and now serves conversational home, an anonymous guided introduction demo, everyday-use examples and the existing 720p film. Signed-in layout centers the Chief of Staff with optional adjacent existing task/knowledge workspace. Existing backend routes, data stores, account identity, marketplace and founder controls were retained. The newer live founder operatorAccessToken hook was specifically preserved.

Native demo: private Kokoro CPU stock voice af_alloy on the existing SWADE voice service, with existing private CPU Faster-Whisper transcription via the secondary server. No paid voice or LLM fallback. First-name/goal sample only, not autonomous execution or a finished project. Temporary audio deleted; exact-origin CORS, single concurrent operation, 12 requests/hour/IP, 200/day/process, 2 MB audio and short duration bounds. Rate counters are process-local. Credentials remain server-side in protected environment. Medical/sensitive input prohibited in demo copy. Actual human microphone/device permission flow still requires user testing; synthetic audio transcription and public typed-name native playback were verified.

Verification: TypeScript and both native Sites/Hostinger builds pass. Auth integration test passes PKCE, cookies, state, identity, logout and revocation checks. Demo tests pass allowed-origin, fixed text, native-engine enforcement, no cookies, and rate bounds. Public TTS HTTP 200 native-kokoro (122925 bytes); same synthetic recording STT HTTP 200 with expected transcript; no demo temp folders remain. Public browser verifies first name, goal and guided result. Mobile local QA iframe at 390 pixels has no horizontal overflow. Existing purchased-account workflows were not exhaustively re-certified.

Source commit: 6cc7c90e8cd62eafbc14b727a8967774c22bc270. Native Sites deployment appgdep_6adf6933a8a481918eb326018d45f523 succeeded, preserving owner-private audience. Public Hostinger deployment additive: frontend assets/index, new demo-voice.mjs and minimal server route insertion; other live workers/modules preserved. Backup: /opt/brainiak/backups/voice-first-20261026T144804Z. Nginx demo-specific upload allowance avoids broadening the workspace 32k limit. Backup /opt/brainiak/backups/nginx-before-brainiak-voice-20261026.conf. Recovery: restore server/index and protected env from backup, remove added demo location by restoring verified nginx backup, nginx -t before reload, restart brainiak.service. Do not expose env backup or copy old brain-api over newer live adapters.

Problem/fix: first real transcription hit nginx 413 because inherited /brainiak upload limit was 32k. Added only /brainiak/api/demo/ with bounded 2100k limit and 120s read timeout; real end-to-end transcription then passed. Store nginx backups outside included configuration directories; nginx -t passes without duplicate-server warnings after backup placement corrected.


## Asset Review core workspace - October 26, 2026
SHIPPED CORE / EXTERNAL INTEGRATIONS INCOMPLETE. Private asset project and assigned attorney-review application at https://swadebase.cloud/adapters/asset-review/. Reuses existing adapter service, SWADEBASE identity/Postgres, native voice/model and encrypted Backblaze originals. See site-bibles/Asset_Review_Master_Site_Bible.md for source, role boundaries, tests, operating limits and rollback. Danny reviewer email supplied by founder; no invitation or real legal review sent. Automatic Seed LEAKER discovery, Pinhub issuance, online checkout and 2.1% success-fee charging remain disabled. OpenHands/mini-SWE-agent/Aider research is saved in DEVIN_ALTERNATIVES_20261026.md; no coding agent was installed.

## SwadeMail branded UI update — October 26, 2026

**State: DEPLOYED / LIVE PROBES PASSED; full browser visual QA still pending.** Reused the existing Mailcow and SWADEBASE Mail Center; no new mail server, auth provider or data store. The Mailcow login template `data/web/templates/user_index.twig` now uses `/img/swademail-logo.svg` and SwadeMail welcome copy instead of the cow illustration. `data/web/css/site/index.css` adds responsive navy/blue/gold styling while preserving existing form names, login POST, password reset, FIDO2/WebAuthn, language selector, administrator/domain-admin links and existing authentication flow. SOGo uses the SwadeMail full/short logos and navy/gold theme via existing custom asset mounts; page title changed to SwadeMail | Professional Communication. SWADEBASE `/adapters/mail-inbox` now has a simpler three-step user journey and uses the same brand stylesheet. The Mail Center uses that stylesheet as well.

Backups before changes: `/opt/mail-backups/swademail-ui-20261026-210827/` (login Twig, index CSS, SOGo theme, SOGo config, old full/short logos). Live verification after restarting existing `php-fpm-mailcow`, `nginx-mailcow`, and `sogo-mailcow`: Mailcow login HTTP 200, SwadeMail logo asset HTTP 200, SOGo `/SOGo/` HTTP 200 after startup settled, SOGo full and short logo URLs HTTP 200, SWADEBASE Mail Center redirects to sign-in as expected. The brief SOGo 502 immediately after restart resolved when SOGo workers reported ready. No mailbox data, passwords, DNS, mail routing or auth logic changed. No email sent.

Rollback: restore the six backed-up files from the timestamped directory to their original paths, then restart the existing `php-fpm-mailcow`, `nginx-mailcow`, and `sogo-mailcow` services. Do not delete the new logo until the old full/short logos are restored. Remaining verification: visual Safari/iPad screenshot review, successful mailbox login, password recovery and WebAuthn interaction, SOGo inbox/composer view, and confirmation of the new logo in the authenticated inbox. Do not describe these flows as end-to-end certified until tested.


## Cochrane, Asset Machine and OpenHands — October 26, 2026 checkpoint
Cochrane private Sites sample deployed, source 31c75499f8a0a966ef5f18ff922fe738843bcce8, with trilingual example workspace and 72s native-voice HyperFrames film. Live client backend/legal research/billing remains pending. Asset Machine is a separate founder-named project with three cinematic page concepts only. OpenHands SDK 1.58.2 is now installed experimentally, superseding the earlier no-agent-installed checkpoint; both native coding-model benchmarks failed. Shared OpenHands routing and public Backblaze/Nginx film release were blocked by automatic approval review and were not applied. See the three project Bibles for exact states, tests and recovery.

## Prepared scoped merchandise tools — October 26, 2026
Added staged swade_merch_catalog and swade_merch_report_qa in ops/mcp/pending-merch-20261026. Dedicated merch:read/merch:report scopes preserve existing operator scopes and deny merchandise-only credentials general ecosystem/task access. Read fixed Guardian snapshot; reports validate product ownership, use actor-specific transaction-locked idempotency and fixed cos recipient. No publishing/orders/paid generation. 21 offline tests passed including official SDK discovery/calls.
Native connection SWADEBASE Merchandise Review created DISABLED with only the two allowed tools, no secret installed. Activation and a limited credential await explicit approval; existing runtime core/route/service/protocol remain unchanged. Automatic approval review rejected live service restart + temporary super-admin credential test; no such credential or restart occurred. Use only limited agent credentials after approval. Existing Guardian snapshot metadata extension is deployed; no commerce writes.
Printify readback for sweatshirt 6ade88d1a0cf4fb5aa0f1330 returned only one front image; a verified finished-garment replacement remains unavailable. No substitution fabricated. Chief of Staff consumer remains unverified. See pending README for exact deployment and rollback.

## Approved merchandise read/report activation
See site-bibles/ABAGALE_Merch_Agent_Activation_2026-10-26.md. Native connection active; 10-item catalog read and real QA report 91 verified. General operator/task and foreign-product access denied. Chief of Staff acknowledgment and automatic product creation remain incomplete.

## Approved source and Chief of Staff inbox continuation
See site-bibles/ABAGALE_Merch_Source_And_CoS_2026-10-26.md. Private original logo integrity verified; source metadata is available through scoped catalog. Report91 delivered to a newly established Chief of Staff inbox, not reviewed/acknowledged. Provider templates verified for next cinematic concept; no artwork/product creation or paid generation yet.


## Knowledge retrieval and cleanup — October 26, 2026 America/Chicago
DEPLOYED FIRST PHASE; NO MODEL TRAINING. Exact founder duplicates consolidated from 84 to 16 with private backup and canonical mapping; 14 wiki pages have active lifecycle, with 11 former drafts labeled unverified rather than promoted to verified. Existing private MCP/owner console now exposes Ask your knowledge, combining current approved references with actor-scoped private knowledge. Local Llama 3.2 inference is bounded with source-label validation and explicit source-extract fallback; no paid fallback. An initial live answer failed citation validation and correctly fell back; constrained generation then passed a second live source-grounded check.
Existing Incident Guardian hourly schedule now runs hash-based reference indexing after its review. Approved Site Bibles, standing rules and reviewed lesson files only; no automatic customer upload collection, training consent, GitHub webhooks or all-repository ingestion. Private-row isolation verified: no identity and a different actor returned zero; founder returned 16 knowledge records and 14 wiki pages. Public HTTPS tests rejected unauthenticated/bad-origin/bad-CSRF requests and secrets; approved/private retrieval and no-evidence response passed.
Found original SSS Knowledge Studio in swadesoul/sssbrain PR 26, open/unmerged. It is not deployed by this phase. Three existing review gaps must be repaired before reusing it. Source inventory and known limits: docs/KNOWLEDGE_LEARNING.md. Backups /opt/swadebase/backups/knowledge-learning-20261027T042144Z; rollback only scoped MCP files/drop-in/policies and preserve unrelated work. General SSS Brain/Brainiak chat wiring and the complete studio remain unverified follow-up.


### Knowledge release KL-1 — final verification
First live unconstrained synthesis rejected its citation output and correctly returned source extracts. Constrained source-label JSON generation then passed a second public HTTPS live request: Llama correctly explained the recorded Brainiak HTTP 413 cause and bounded route fix, citing the approved lesson. All 32 MCP/protocol/merch/knowledge tests passed. Official SDK live HTTPS discovery found nine tools and invoked source-grounded extract retrieval and Knowledge Studio search. Independent cleanup comparison preserved every unique material source field; email reference-orphan count zero. Owner isolation passed on the actual adapter database role. Changed-source indexing updated exactly the three changed Bibles; unchanged refresh updated zero. Owner UI/API are deployed; authenticated browser/mobile visual testing is not certified.


## Veteran Bridge shared-backend checkpoint — 2026-10-27T05:10:17.548641+00:00

Veteran Bridge now reuses the existing adapter service, GoTrue identity, PostgreSQL and local Ollama llama3.2:3b. New scoped API /api/adapters/veteran-bridge and secure workspace /adapters/veteran-bridge/ are deployed. Per-user reference IDs and generic plan sync use two RLS-protected swadebase_ops tables. Ten tests plus live HTTPS email-auth, two-user isolation, concurrency/version conflict, consent and real local-inference checks passed; temporary accounts removed. No paid provider fallback, VA/ID.me record connection, claims submission, donation collection, medical upload or new service was enabled. Google authorization start verified; real-user Google completion and iPad Safari remain unverified. Sites source release 1ff6500d5e4679b85c56681f27185549931d0b25. Details, limits and recovery: site-bibles/Veteran_Bridge_Master_Site_Bible.md. This adds an application module without broadening shared Google allowlists or changing other product auth/audio.

Final release checkpoint: Sites version 3/source fdc4d4a5df242290c290a52f33c135012fb63612 is published successfully. SWADEBASE operator catalog now recognizes veteran-bridge; eight existing MCP core tests and scoped indexed-Bible service retrieval passed. Real-user Google/iPad verification and VA/ID.me production credentials remain pending. Backup of shared catalog core: /root/veteran-bridge-backups/20261027T050236Z/mcp-core.mjs.


## Asset Machine live release — 20261027T171551Z
Asset Machine is now live at https://swadebase.cloud/adapters/asset-machine/ using the existing adapter process, isolated machine_* metadata, encrypted B2 prefix and domain-separated encryption key. Existing Google broker reused; owner-only role grants, private assigned review, native AI/voice and evidence workflow integration tests passed. Real Google consent and actual iPad Safari remain unverified; external issuer/custodian/oracle/token/settlement providers remain pending. GitHub source preservation was approval-blocked, internal source archive retained. See Asset_Machine_Master_Site_Bible.md.


## Custom domains connected — 20261027T181159Z
Founder identified stored Namecheap API credentials in SWADEBASE/Coolify. Reused existing /opt/swadebase/signal/namecheap_dns.py API call logic with case-robust parsing, complete-zone backups/preservation, concurrency comparison and API reread. Both actual registered domains connected: cochranailaw.live native Sites apex/www TLS; assetmachine.live SWADEBASE landing HTTPS with canonical private workspace handoff. Browser checks passed. Stored API resolved task despite earlier blocked browser origin; no blocked-origin observation or password reset, new purchase, messages, identity/CORS relaxation. No further registrar browser approval needed. See affected Bibles for recovery and limits.

## Cost ledger and rate cards — deployed October 28, 2026

DEPLOYED: one shared ledger for every AI, voice and media provider call across the ecosystem, in `swadebase_ops` (source `ops/costs/schema.sql`).
- `ai_provider_accounts`: each provider, billing type (prepaid/postpaid/subscription/self_hosted), hard stop and low-balance threshold.
- `ai_rate_cards`: price per unit (input/output token, image, character, audio/GPU second, participant minute); `verified_at` marks prices checked against a current source.
- `ai_credit_topups`: founder-entered opening balances, top-ups and corrections.
- `ai_usage_ledger`: every call with project, feature, provider, model, user, tokens/units, cost and status.
- `ai_provider_balances` view: credit minus spend, month-to-date and 30-day spend.
- `ai_record_usage(...)` prices and writes a call; `ai_can_spend(provider, estimate)` is the hard stop: unknown providers and prepaid providers with no recorded opening balance are blocked; self-hosted services always pass at $0.
- Project wrappers: `teachvirt.record_ai_usage` / `teachvirt.ai_can_spend` (service_role only).
- Read through the Ecosystem MCP: `swade_cost_report` (period/project/provider) and `swade_rate_cards`. Read-only; no top-ups or spending through MCP.
Model order for text (founder rule: cheapest that does the job): Qwen Flash (QwenCloud) → Claude Haiku 5.5 → OpenAI gpt-4o-mini. Voice: SWADE Voice Studio only; OpenAI realtime voice (GPT Live) is founder-only (swadesoul@gmail.com) and metered.
Opening balances must be entered before paid providers are allowed by the hard stop.

## AI provider accounts, balances and usage terms — recorded October 28, 2026

Source of truth: `swadebase_ops.ai_provider_accounts`, `ai_credit_topups`, `ai_rate_cards` and `ai_usage_ledger` (live balance = recorded credit minus ledger spend; read with MCP `swade_cost_report` / `swade_rate_cards`). Opening balances below were founder-reported on 2026-10-27/28.

| Provider (ledger id) | Billing | Opening balance / quota | Backend use | Notes |
|---|---|---|---|---|
| Anthropic (`anthropic`) | prepaid | $40.00 | allowed | Claude Haiku 5.5 ($0.10/$0.50 per 1M tokens). New workspace-scoped key (no workspace ID needed). |
| OpenAI (`openai`) | prepaid | $47.99 | allowed | gpt-4o-mini ($0.15/$0.60) last-resort text; optional images; GPT Live realtime voice founder-only (swadesoul@gmail.com). |
| Replicate (`replicate`) | prepaid | $245.86 credit remaining ($2.62 used this month) | allowed | flux-schnell images (~$0.003 each, unverified). |
| RunPod (`runpod`) | prepaid | $97.68 | allowed | Voice Studio cloned/designed voices (serverless, ~$0.69/GPU-hour). Account spend limit $80/hr; voice policy minimum balance $49. |
| KIE.ai (`kie_ai`) | prepaid (credits) | 9,334 credits ≈ $46.67 at ~$0.005/credit (unverified third-party rate) | allowed | One credit balance across image (Seedream, Flux-2, GPT Image), video (Kling, Wan, Veo 3.1), music/voice (Suno, ElevenLabs, Gemini TTS) and chat (GPT, Claude, Gemini, Grok) models. Limit: 20 new generation requests per 10 s per account (100+ concurrent tasks); excess returns HTTP 429 and is not queued; per-key hourly/daily/total caps available. No balance API: ledger is the running balance, reconcile with kie.ai/logs. Keys server-side only. Docs: https://docs.kie.ai |
| Alibaba Model Studio pay-as-you-go (`qwencloud`) | prepaid | balance not yet reported | allowed | Key `QWENCLOUD_API_KEY` on dashscope-intl compatible-mode; qwen-flash verified working ($0.05/$0.40 per 1M tokens). Intended first choice for app backends once its balance is recorded. |
| QwenCloud Token Plan (`qwencloud_token_plan`) | subscription $18/mo | 45,000 credits/month; 89.1% remaining at 2026-10-28; resets 2026-11-15 10:00 | **NOT allowed** | QwenCloud terms: interactive AI programming tools and OpenClaw-type agents only; not for automated scripts or application backends (suspension/key-ban risk); no pay-as-you-go fallback when credits run out. Base URL https://token-plan.maas.qwencloudapi.com/compatible-mode/v1. The ledger hard stop blocks backend use. |
| SWADE Voice Studio, Ollama, self-hosted LiveKit | self_hosted | n/a | allowed | $0 per call; hosting prepaid. Voice for all products comes from Voice Studio. |
| ElevenLabs, LiveKit Cloud | subscription / postpaid | n/a | fallback only | Legacy/backup paths. |

Founder rules recorded with these accounts: cheapest model tier that does the job; Anthropic and OpenAI credits are used last; every call is logged with project, feature, provider, model and cost; prepaid providers without a recorded balance and unknown providers are blocked; balances must be recoverable by conversation through SSS Brain (MCP cost tools).

## Change log: 2026-10-28, TeachVirt images moved off old Lovable cloud
- All TeachVirt image files were already in SWADEBASE storage (copied 2026-10-04); only DB URLs still pointed at cjrdumbalppujuqqkiqw.supabase.co.
- `forge-images` is PRIVATE on SWADEBASE (it was public on the old cloud). 362 lesson images were re-signed with SWADEBASE's key (10-year signed URLs) and rewritten in `teachvirt.lessons.content`; 4 covers in public `course-covers` were host-swapped in `teachvirt.courses.thumbnail_url`.
- Verified: 0 old-cloud references remain; 366/366 URLs return 200 image/png; teachvirt.courses sends no CSP.
- Backups: `teachvirt._bak_lessons_content_20261028`, `teachvirt._bak_courses_thumb_20261028`. Script: `/opt/swadebase/ops/teachvirt_img_relink.py` (dry run by default, `--apply` to write).
- Signed URLs expire ~2036; if the JWT secret is rotated they break and must be re-signed with the same script approach.


## Maestro station libraries — staged October 28, 2026
SOURCE VERIFIED / NOT DEPLOYED. Separate station libraries, bulk category-folder playlist rules and saved SFTP controls are prepared in swadesoul/swade-radio PR 3. Eighteen Python tests, isolated PostgreSQL/RLS validation and synthetic desktop/mobile Chromium checks passed. Production schema/deployment and disposable live tests remain automatic-approval blocked pending explicit production authorization. Automatic paid checkout-to-plan activation and the historical entry-plan 50% airtime enforcement are incomplete. No flagship broadcast, station library, runtime service or production schema was changed. See site-bibles/Maestro_Radio_Master_Site_Bible.md for verified source, exact scope, tests, limits and recovery. Private What’s New database write and knowledge-index refresh were not run while production writes were blocked.


## PET MUZIK native voice connection — October 28, 2026
DEPLOYED / OWNER-DEVICE ACCEPTANCE PENDING. PET MUZIK reuses the existing SWADEBASE adapter process, shared Google owner broker, HttpOnly owner session, native CPU Kokoro and private CPU Whisper. The project-bound connection window returns short-utterance transcripts and reply audio to the owner-private Site using exact-origin/window/channel/request checks. No shared credential is exposed, no paid fallback, new identity stack, service, database or queue.
Seven targeted bridge tests, four shared-session tests and real CPU speech/transcription passed. Both native usage receipts are priced at USD 0. Two narrow PET MUZIK owner-only functions reserve/finalize existing ledger receipts; generic ledger UPDATE and anonymous function execution remain denied.
Source 9a0c1336393d72746e3983f498b80691a55f5fd0, Sites version 10, deployment appgdep_6ae200fc14cc81918f5b8c5df035e2f8 succeeded at 2026-10-28T14:04:51Z. Live browser reached owner-private ChatGPT sign-in gate. Actual owner Google completion, microphone permission, recording-to-brief/playback and physical iPad Safari remain unverified; deterministic brief organization is not production-agent intake. Three existing bandana drafts remain held; no sales or external messages. See site-bibles/PET_MUZIK_Master_Site_Bible.md and site-bibles/PET_MUZIK_Voice_Connection_2026-10-28.md for current details and recovery.


Final PET MUZIK voice compatibility checkpoint: source 59da279ec7457b8278cc6a8e2c8463b133d25b12, Site version 11, deployment appgdep_6ae201f30be08191afd3eda3e43f18e3 succeeded at 2026-10-28T14:08:57Z. Eight voice tests and four shared-auth tests pass. This handler correctly resolves a verified Google owner cookie even when an older owner-token cookie also exists; anonymous/invalid sessions remain denied. Owner microphone/Google/iPad acceptance remains pending. See site-bibles/PET_MUZIK_Voice_Final_Checkpoint_2026-10-28.md. Three existing merchandise drafts stay held; no duplicates or sales.


## Site Standard v1 (APPROVED by Harold 2026-10-28)
Every site: admin area, data room, super admin = Harold (server-side allowlist), badge/god mode/payment exemption, gifting, scoped roles + audit log, CMS, COS onboarding. See `/opt/swadebase/docs/SWADE_SITE_STANDARD_V1.md`; follows SWADE_ADAPTER_CONTRACT_V1 and the one-engine rule. No code changes yet.


## Isolated alpha baseline — October 29, 2026
New founder scope supersedes broad Maestro rollout intent: no production auth changes, live station changes or database migrations during alpha baseline. Private source is preserved in swadesoul/swade-radio PR #4, branch alpha/safe-radio-baseline-20261029, commit 381d81714af79644c11eac3486493d388667ebc5. Twenty isolated tests passed locally and on the primary Hostinger host. Existing Factory B2 adapter stored a synthetic MP3 and full readback matched SHA256; no original modified/deleted. Public SWADEBASE health and correct production/preview Google starts verified; actual owner/preview sessions, iPad, authenticated alpha host/UI and live failover remain unverified. Existing station 1 is online with 72 rotation tracks; station 3 PET MUZIK is offline with four empty enabled playlists. No songs inserted or station restarted. Alpha transport/analysis/clock/booking/consent/release primitives are tested source, not a deployed Program Director, mastering sale or live-DJ service. See site-bibles/Maestro_Alpha_Baseline_2026-10-29.md for complete evidence, main-vs-Factory inventory, focused license review, gaps and rollback. Queue/start records are not working-code/deployment/execution evidence. Release remains blocked.


## Live voice knowledge repair — 2026-10-29 19:02 CDT

LIVE INTERNAL REPAIR; SOURCE SYNC PENDING. Recorded at 2026-10-30T00:02:51.230064+00:00.

Confirmed source gaps: live session startup had no retrieved business context; native search_knowledge omitted shared approved references and knowledge_entries; the voice prompt instructed the inner model to skip tools for speed; broad ecosystem keyword routing could intercept read questions with a planning response.

Reused the existing knowledge service and database. Added POST /adapters/operator/knowledge, which verifies the caller's original SWADEBASE JWT and current super-admin role, keeps ecosystem:read only, rate limits requests, honors the MCP kill switch and uses extraction only (no model call). Session startup now receives bounded source evidence and registry context. Native chat prefetches scoped references, and search_knowledge includes the shared index plus the existing conversation/capture search. Voice instructions now require evidence for business facts and tools for current operational checks. The routing shortcut is restricted to planning/action language. Retrieved records remain data, never permission to execute. Customer access was not broadened.

Verification: 29 backend tests and 18 native/auth/session tests passed; TypeScript, production build and image build passed. Built HTTP canary verified session context/tool attachment and native voice-mode chat context using simulated model responses only. Read-only checks through the actual adapter database role returned four shared sources, owner-private knowledge and 20 registered capabilities; a different actor identifier received zero private results. Live app liveness HTTP 200; anonymous chat/session HTTP 401; anonymous shared knowledge HTTP 403. Paid test calls: zero. No test account, token or role was created. Authenticated browser microphone and spoken answer remain unverified. Registry availability is not a complete connected-system workflow certificate.

Deployment: app container g1406wexcvceencavj1fuo0u-voice-20261029, image sssbrain-live-knowledge:20261029, healthy on existing swadebase-2 Coolify network. Source is preserved in local commit 9cf7d01 at /opt/sssbrain-live-knowledge-20261029 (branch fix/live-voice-knowledge-20261029). Existing shared adapter service was restarted with the additive endpoint. Receipt: /opt/sssbrain-live-knowledge-release.json on swadebase-2.

Recovery: start retained prior app container g1406wexcvceencavj1fuo0u-20261026T000851 and stop the replacement. The shared route baseline is /opt/swadebase/backups/sssbrain-live-knowledge-20261029/route.mjs; restore that scoped file and restart swadebase-adapters.service if needed. Do not alter customer records.

Outstanding: automatic approval review rejected uploading the changed source to the existing GitHub repositories as an unapproved remote source upload. No push or merge occurred. Canonical source synchronization is required before a later normal deployment, which otherwise could overwrite this server repair. Current deployment is a manual, recoverable release, not a claimed GitHub/Coolify source deployment.


## Owner-controlled Lovable production branding — October 29, 2026

APPROVED POLICY; ecosystem cleanup remains per-domain work. Canonical rule: docs/LOVABLE_MIGRATION_BRANDING_RULE.md; standing rule 16. The existing lovable-to-hostinger and swadebase-build-first skills now require site-owned favicon/manifest/title/social branding, removal of badge-only runtime injectors and no credit/plan-controlled production badge. Future releases must pass source/build and fresh/returning browser checks after SPA navigation and cache handling. Preserve functional integrations and required license notices. Record each production domain's deployment, evidence, exceptions and rollback; do not treat the policy as proof all current sites are clean.


## Source synchronization completed — October 29, 2026

The owner approved synchronization. SSSBrain knowledge repair merged in PR97, commit 69c0b8c3d0ed97996c9b68645ff1fac3f331be2e; shared knowledge bridge merged in private hub PR26, commit adfd5638c35604d6b1b86b5ca7d8ad73bf8be68c. This supersedes the previous source-sync blocker for that initial repair only. The later default/quota/latency voice release is still staged and unverified after swadebase-2 stopped responding during validation; the existing production release remains healthy. The broader native repair privilege expansion was rejected by automatic review and remains disabled. See ACTIVE_REPAIRS_2026-10-29.md and SwadeMail_Master_Site_Bible.md for the new mail/contact work.

## Mail, contact and repair release boundary — October 29, 2026

Mail Center now provides actual per-mailbox device settings, copy instructions and unsent sharing drafts. Forty saved investor records were imported into the existing owner CRM; 18 contain email fields. Repeat import added zero records. The existing daily Black-business task now transfers through the verified importer and saves recoverable exports; a daily 9 AM Chicago catch-up task is enabled. Future task execution and actual signed-in iPad/contact-search journeys remain unverified. See SwadeMail_Master_Site_Bible.md.

The newer GPT Live default and quota-only free voice switch is staged, with 24 focused tests, but its full build and deployment remain blocked by the secondary remote connection being offline. Free-voice latency is unresolved. The local reply experiment timed out and was preserved outside active runtime; the approved scoped knowledge backend remains live. See ../ACTIVE_REPAIRS_2026-10-29.md and ../SSSBRAIN_REPAIR_CONNECTION_PROPOSAL.md for exact remaining scope and approval blocker. No all-site repair permissions were enabled.

## Voice release validation recovered — October 29, 2026

The earlier secondary build/connectivity blocker was resolved by stopping the verified stuck build processes and validating the isolated source on the primary host. Full typecheck/build, 21 native checks and six built HTTP canaries passed. SSSBrain PR98 (644d6ef696eb862c8357ad41f1ca720f5245c238) is merged and the existing Coolify pipeline is deploying it. It makes GPT Live the default main-orb voice and switches automatically only on verified exhausted OpenAI credits. Free mode has local-only language/STT/speech behavior and shared history, with no paid fallback. The revised scoped local reply backend is deployed; eight new checks and 23 existing backend checks passed. Short-answer backend timing was about 5.3–5.9 seconds, not an end-to-end microphone timing. See learning-approved/sssbrain-voice-policy-20261029.md and ACTIVE_REPAIRS_2026-10-29.md for actual deployment status. Broader repair execution is still blocked by the separately documented connection approval and unavailable protected action credentials.

## Production voice release confirmed — October 29, 2026, 8:12 PM Chicago
The existing Coolify deployment 6dgdixxzlqee92kqsq7mcckj finished successfully for SSSBrain PR98 merge 644d6ef696eb862c8357ad41f1ca720f5245c238. The exact image g1406wexcvceencavj1fuo0u:644d6ef696eb862c8357ad41f1ca720f5245c238 is running healthy; the prior revision was removed from live traffic. The public /api/live endpoint returned 200. This supersedes earlier staging/build-blocked and deployment-pending status entries.

GPT Live is the default main-orb voice. Explicit choices persist; automatic free fallback occurs only on verified OpenAI credit/quota exhaustion. Free replies, transcription and speech cannot spill into paid providers. Automatic credit fallback uses device speech. Conversation history, owner knowledge and the existing brain tool bridge are shared.

Actual signed-in microphone/audio journeys remain unverified. Broader all-site repair execution is still blocked by automatic approval review and missing protected server action connections; existing exact owner approvals and allowlists were preserved. Four externally served Lovable badge domains and 20 unreachable audit entries still need migration/favicon verification.

## DEPLOYED 2026-10-29 ~20:20-20:30 CT (Claude, approved by Harold; deploy lock held, rule 20)
- Off-server backup (RK-009): /opt/swadebase/ops/backup/swadebase-backup.sh via swadebase-backup.timer, nightly 03:17 America/Chicago. pg_dumpall (supabase_admin, --no-role-passwords) + configs (nginx, crowdsec, letsencrypt, swadebase docs, swade-secrets, swosting) -> zstd -> GPG AES256 (passphrase file /opt/swade-secrets/backup-passphrase; Harold to copy it to his password manager) -> Backblaze b2 bucket ssworld, path swadesoul/backups/swadebase/daily/<date> (14 days) and monthly/<date>. First run 2026-10-30 01:20 UTC: 1.27 GB dump -> 182 MB, 3 files verified in B2 (rclone check 0 differences). Last success: /var/lib/swadebase-backup/last-success. Log /var/log/swadebase-backup.log.
- Restore test: /opt/swadebase/ops/backup/swadebase-restore-test.sh via swadebase-restore-test.timer (2nd of month 04:47 CT). Restores into a throwaway container of the same supabase/postgres image, compares counts, removes it; never touches live. First run caught a method issue (image pre-creates an older auth schema; users restored 0 although the dump contains all 129 auth.users rows); fixed by dropping auth in the throwaway container before restore. Result: /var/lib/swadebase-backup/last-restore-test.
- Hostinger firewall swade-web-only (id 371444): range 8005:8995 split into 8005:8796 + 8798:8995 so the internal VideoSayWhat extractor port 8797 is no longer public (RK-012). Synced; extractor health OK internally; sites and SMTP OK. Note: ufw on the host is inactive; the Hostinger firewall is the outer wall.
- Repair Kit: catalog docs/learning-approved/repair-kit-known-failures.md, approved fix queue repair-kit-fix-queue.md, daily read-only scan /opt/swadebase/ops/repair-kit/scan.sh via swadebase-repair-kit-scan.timer 06:37 CT -> docs/learning-approved/repair-kit-scan-latest.md.
- CrowdSec (watch mode, no bouncer yet): nginx logs + SSH via journald; allowlist /etc/crowdsec/parsers/s02-enrich/swade-allowlist.yaml. Cloudflare real-IP: /etc/nginx/conf.d/swosting-cloudflare-realip.conf.
- Rollback: systemctl disable --now swadebase-backup.timer swadebase-restore-test.timer swadebase-repair-kit-scan.timer; firewall: restore the single 8005:8995 rule in Hostinger.

## DEPLOYED 2026-10-29 ~20:37 CT — Sign in with LinkedIn (Claude, approved by Harold; deploy lock held)
- LinkedIn OpenID Connect added to SWADEBASE GoTrue next to Google: docker-compose.yml GOTRUE_EXTERNAL_LINKEDIN_OIDC_* (env LINKEDIN_ENABLED/LINKEDIN_CLIENT_ID/LINKEDIN_SECRET in /opt/swadebase/docker/.env; source copy /opt/swade-secrets/linkedin.env, copied server-to-server from Coolify shared variables LINKEDIN_CLIENTID / LINKEDIN_SECRET_KEY on swadebase-2; values never displayed). Redirect URI: https://swadebase.cloud/auth/v1/callback.
- Verified: supabase-auth healthy after restart; /auth/v1/settings shows google true, linkedin_oidc true; /authorize?provider=linkedin_oidc 302 to LinkedIn; Google authorize still 302. A full human sign-in through LinkedIn is NOT yet verified (needs Harold to try).
- Sites use it with supabase-js: signInWithOAuth({provider: 'linkedin_oidc'}). Each site still needs the button added and its return URL in the auth allow list (RK-006).
- Rollback: cp /opt/swadebase/backups/auth-linkedin-20261030T013704Z/{docker-compose.yml,.env} /opt/swadebase/docker/ && docker compose up -d --no-deps auth
- Backup key: second copy now on swadebase-2 /opt/swade-secrets/backup-passphrase (hash matches); third in Harold's Google Drive.

## DEPLOYED 2026-10-30 ~5:20 AM CT — Chat archive (Grok Bot / Big Mamma executor, voice call-79d4cce7; deploy lock held, rule 20)
- New Postgres schema `chat_archive` in supabase-db (additive; no restarts): conversations, messages (full-text search column), ingest_runs; function chat_archive.ingest_conversation(jsonb) (dedup on assistant+conversation id and message id); views v_conversations, v_timeline; function chat_archive.search(text). RLS on with no policies, grants revoked from anon/authenticated: owner/service only.
- Tools: /opt/swadebase/tools/chat-archive/ (ingest.py chatgpt|claude|bigmamma|daily, export_md.py, run_inbox.sh). Secrets (API keys, tokens, passwords, private keys, card numbers) are redacted before insert.
- Drop folder: /opt/swadebase/chat-imports/inbox/{chatgpt,claude,bigmamma}/ -> processed/ or failed/. Timer swadebase-chat-archive.timer (:07 and :37 each hour) ingests drops + daily summaries and rebuilds browsable Markdown at /opt/swadebase/docs/chats/INDEX.md.
- Seeded: 8 Big Mamma daily summaries (2026-10-24..30). ChatGPT/Claude: waiting on Harold to request account exports. Doc: /opt/swadebase/docs/CHAT_LOGGING_SWADEBASE.md.
- Rollback: systemctl disable --now swadebase-chat-archive.timer; rm /etc/systemd/system/swadebase-chat-archive.*; drop schema chat_archive cascade; rm -r /opt/swadebase/tools/chat-archive /opt/swadebase/docs/chats.

## DEPLOYED 2026-10-30 ~10:00 AM CT — Security pass + OmniRoute finished (claude security session)
- **SWADEBASE = the self-hosted Supabase stack on swadesoul** (nginx swadebase.cloud -> supabase-kong 127.0.0.1:18000). Never remove supabase-* as "duplicate Supabase".
- **Firewalls (Hostinger cloud):** swadesoul VM 1796059 = "swade-web-only" (371444, unchanged). swadebase-2 VM 1880663 = NEW "swadebase2-web-only" (389858): 22, 80, 443 tcp+udp, ICMP/v6, all TCP from swadesoul; **8000 open temporarily** until the Coolify GitHub App webhook moves to HTTPS (needs Swade's OK).
- **Coolify dashboard:** https://coolify.2.25.96.150.sslip.io (old http://2.25.96.150:8000 stops working once 8000 closes). If GitHub secret COOLIFY_API_URL points at :8000, change it to https://coolify.2.25.96.150.sslip.io/api/v1.
- **Agent Safe Mode** (swadebase-2): live-tested; rakazo-computer-* networks are blocked from admin ports on both servers, and the internet stays open.
- **OmniRoute** (swadebase-2): chains combo/swade-cheap (qwen-flash -> claude-haiku-4.5 -> gpt-4o-mini) and combo/swade-background (local llama3.2:3b first). Per-app keys with daily/weekly caps (hard stop verified). Failover verified. Spend syncs every 5 min into swadebase_ops.ai_usage_ledger (feature='omniroute'). HTTPS for swadesoul apps: https://omniroute.2.25.96.150.sslip.io (swadesoul-only allow-list). **Oathloom now uses it** (was the Qwen Token Plan, marked backend_use_allowed=false). Details: /opt/omniroute/README.md on swadebase-2.
- **Removed (unused, backed up):** Portainer; Postiz + Temporal + Elasticsearch (0 posts, 0 accounts); 15 stopped containers; orphaned volumes. Stopped (restartable): blacktales, blacktales-marquee-live, hns-gateway-canary, sssbrain-stage, sssbrain-stt + its public cloudflared tunnel (swadesoul copy). **Live Black Tales = blacktales-marquee-live2 (127.0.0.1:3342).** Backups and quarantine are in /opt/swadebase/backups/ (quarantine delete date 2026-11-13).
- Handoff: docs/handoffs/HANDOFF_2026-10-30_claude-security.md. Plans: docs/prds/SWADE_STUDIO_PRD_2026-10-30.md, docs/prds/SSSBRAIN_MOVE_TO_SWADESOUL_2026-10-30.md.

## Watchtower server inventory — October 30, 2026

ChatGPT inspected the newly connected Watchtower server through its existing authorized Remote Desktop Commander device 4789c55f-1f6c-4b80-8b86-22621f7d8956. Hostname watchtower; IPv4 179.197.90.181; Ubuntu26.10; allocated1vCPU; about4GB RAM;48GB root disk with about42GB free;2GB unused swap. Docker and remote access run; no application containers or failed systemd services were reported. No monitoring workload is installed or certified by this inventory. Lightweight monitoring/health checks are a proposed role only. No deployments, configuration changes, workload migrations or new execution grants were made. See Watchtower_Master_Site_Bible.md for the full point-in-time inventory, verification limits and access identifier.


## HaroldWhaley consulting polish — 2026-10-30T21:49:28.502216+00:00
Internal only: private haroldwhaley PR3 commit37b392f implements requested consulting/venture/contact polish. Build/type/lint and three Chromium layouts pass. Release held because main contains an earlier unpublished SWADEBASE backend switch without verified site data tables; preview shows catalog error. No deploy or mailbox/DNS changes. See Harold_Whaley_Master_Site_Bible.md for evidence, scoped approval-review mailbox rejection, release requirements and recovery.

## Watchtower setup checkpoint — October30,2026
ChatGPT verified dedicated SSH and Desktop Commander, enabled the approved host firewall, deployed encrypted nightly Control-server backups to Backblaze and completed a real restore rehearsal (PostgreSQL15:86tables, PostgreSQL16:70tables, both OmniRoute SQLite integrity checks passed). Watchtower now runs58external endpoint monitors; Core refreshes dated observations into existing SSSBrain knowledge. Phone pairing, Hostinger provider-firewall verification, OmniRoute standby relocation, SSSBrain/voice migration and the later Core firewall-range change remain incomplete. No app/DNS cutover occurred. Internal OmniRoute keys printed during a diagnostic require scoped rotation and verified client updates; automatic approval review blocked credential inspection. See prds/WATCHTOWER_COMPLETION_2026-10-30.md for exact scope, verification and recovery.

## Domain policy — founder decision October 30, 2026 (6:28 PM CT)
**No new domain purchases.** Sites without a working domain of their own are launched as **subdomains of SWADEBASE: `<site>.swadebase.cloud`** (e.g. swadez.swadebase.cloud, digidollz.swadebase.cloud), using the existing wildcard DNS/SSL path on Core (digiseatpro.swadebase.cloud and leslie.swadebase.cloud are prior examples). Domains already owned (themaestroradio.com, swideo.com, makemycoin.live, teachvirt.courses, ownmode.live …) keep working. Monitoring (Watchtower) tracks the subdomain. Every launched subdomain must be added to SWADEBASE Google sign-in redirect allowlist. maestroradio.live is retired; the Maestro site is themaestroradio.com.

## Fix run — October 30, 2026, ~10:00–10:05 PM CT (Grok Bot / Big Mamma executor; approved by Harold 22:00 CT; deploy lock held)
- Watchtower alerts: Kuma notification "Email Harold (swadesoul@gmail.com)" (SMTP mail.swadesoul.com:587 as existing noreply@auth.swadesoul.com) attached to all 57 monitors and default for new ones. Test sent 22:02 CT, Gmail 250 OK. Paused (not deleted) 13 monitors for unowned/lapsed domains: swadez.com, rwafactory.cash, xrplfactory.cash, recapcoin.cash, grwnup.digital, cmvault.email, grwnx.io, sterline.digital, shamoneswade.com, digidollz.xyz, aimaestro.consulting, holistichive.health, aba.gold (letting lapse). Backup: watchtower /opt/watchtower/backups/fix-run-20261031T030030Z.
- Core: disabled stale sssbrain-delivery-worker.timer (hit stopped sssbrain-stage :8793; real job sssbrain-job@delivery on swadebase-2 healthy). Fixed logrotate.d/maestro-artist-signal and maestro-dj-render (logrotate succeeds again). Disabled nginx sites post.swadebase.cloud (Postiz removed) and sssbrain-test (dead :8793); swadebase-test kept (live). Backups and undo: /opt/swadebase/backups/fix-run-20261031T030030Z/README.md on swadesoul.

## Change log: 2026-10-30 ~10:20 PM CT, Swideo Bible added (Grok Bot)
- Product list: **Swideo** (swideo.com, Lovable a2fe7a1f-5263-4034-87f1-4294e8f9bf74, schema `swideo`, 55 tables). Status PARTLY OPERATIONAL, NOT READY. Bible: site-bibles/Swideo_Site_Bible.md v1.0.
- RESOLVED: earlier "Swideo = unconfirmed / Audivid?" notes. Swideo confirmed by Harold Oct 30, 2026 10:17 PM CT: video creation studio for movies, short drama, motion graphics, comedy series shorts, faceless videos and AudiVid (AudiVid is part of Swideo). See Swideo_Site_Bible.md v1.0. Earlier text left unchanged.
- Oct 30, 2026 ~22:45 CT (Claude): **Ecosystem legal package drafted** for Swade Soul Enterprise LLC (Wyoming), the only registered entity (Swade confirmed). Terms of Service + Product Terms B1–B8 + Privacy Policy covering 16 sites; ABAGALE excluded (50-50 company). Shared doc for attorney review: https://claude.ai/artifact/TaarjwF5kygDLyVQsasRkq. Status, live-site audit findings, publish blockers (registered agent address; legal@ inbox route — swadesoul.com MX is Amazon SES) and publish plan: /opt/swadebase/docs/legal/README.md. On Your Terms (Lovable 4f9a618c…) is to become the ecosystem legal engine on SWADEBASE.
- Oct 30, 2026 ~22:50 CT (Claude): **Legal pages LIVE** at /terms, /privacy, /product-terms on themaestroradio.com, brainiak.live, oathloom.com, blacktales.online, swadesoul.world, yourown.delivery (shared nginx snippet /etc/nginx/snippets/swade-legal.conf -> /var/www/swade-legal, built from /opt/swadebase/docs/legal/src). Legal inbox legal@brainiak.live (+ privacy@, copyright@ aliases). Registered agent: 30 N Gould St, Ste R, Sheridan, WY 82801. Details/rollback: /opt/swadebase/docs/legal/README.md.
- Oct 30, 2026 ~23:00 CT (Claude): legal pages also live on swadebase.cloud, sssbrain.live, getsideload.com (Traefik file /data/coolify/proxy/dynamic/swade-legal.yaml on swadebase-2). Product Terms B9 (SSS Brain licensing) and B10 (Get Sideloaded) added. See /opt/swadebase/docs/legal/README.md.

### SWADE Soul World 3D roster rollout — 2026-11-01T13:39:07.569794+00:00
Source main c0f9f8e deployed to swadesoul.world via ssworld-web.service. Only Granada, Suki and Mason now use local GLB animation pipeline; eight roster models pending. Tests 22 passed, service/site/assets HTTP 200; browser authenticated journey and iPad Safari unverified, likeness QA pending. See SWADE_Soul_World_Master_Site_Bible.md for rollback. No new shared SWADEBASE adapters or external spend.


## Source-only checkpoint, November 1, 2026
2026-11-01 22:14 UTC. ChatGPT checked and locally committed source changes in /opt/sssbrain: ddbdaad (radio), a26e729 (operations documentation), 3f1adca (STT), 97718c4 (voice/home/chat), and 3cf0334 (Scout and route registry). Five radio tests, STT Python syntax/Compose validation and five URL safety checks passed. SSSBrain production build and TypeScript typecheck passed; scoped ESLint zero errors (one existing React hook warning). This is SOURCE-ONLY, not pushed or deployed. Local main is 22 commits ahead of its origin/main tracking ref, including 17 older commits. No live tenant journey, external media spend, STT restart, SQL migration or application production rollout took place. Existing deployment unchanged. Revert exact commits after reviewing downstream integrations. Backups of the affected Bibles were made before appending. Shared adapter registry, current live APIs, auth and deployment were not modified. Host allowlist for STT URL ingestion is default-disabled.


### 2026-11-01 22:16 UTC — Auto-Director isolated branch source committed
ChatGPT committed 0d0646a on local SSSBrain worktree branch feat/shared-auto-director-20261101. Included client-only Auto-Director page linked from Creative Studio, rules-based six-line dialogue to micro-motion shot cards, manual beat edits/undo, and Markdown/JSON draft exports. Four Vitest tests passed; ESLint zero errors; production Vite build and TypeScript typecheck passed. This is NOT merged into local main, pushed to GitHub, deployed or connected to paid video generation. Existing voices/dialogue are preserved; no AI media production ran. Backend persistence, live job handoff, expanded motion semantics, cross-app rollout and authenticated browser verification remain pending. Rollback by dropping/reverting this isolated branch after review; baseline parent is the earlier worktree HEAD.


## 2026-11-01 — Enterprise prospect research CRM backfill (SOURCE VERIFIED, DATABASE WRITE VERIFIED)

Founder directive: append all daily enterprise prospect research into the EXISTING SSS Brain CRM, without creating another database, with ten genuinely new researched companies per day and explicit approval gates. Existing `sssbrain.brain_crm_contacts` on `supabase-db` was reused. As of the completion check, research types counted: `enterprise_prospect_research`=10 (Nov 1 workbook lead dossiers, including price hypotheses, cited source URLs, pain hypotheses, offer, unsent outreach and private OATHLOOM site outline), `enterprise_prospect_historical`=160 (preserved previous October/November automation no-repeat names, historical-only / NOT full dossiers), and 45 preexisting `investor_research` contacts left intact. Distinct enterprise references=170 records, not 170 fully-qualified sales leads. Historical records deliberately retain missing source and buyer gaps; do not present them as verified leads or contact without independent requalification. Imported records are distinguished by `relationship_type` and notes JSON. Current CRM has founder-owned `user_id` and no dedicated prospect schema: keep tenant and user isolation, never add customer identity or secrets to notes. The daily existing automation ID `6abd394fd55c819196a77f536136293f` was updated from five to ten, daily 8:00 AM America/Chicago, with requirements to deduplicate against SWADEBASE, persist with verified counts, preserve research/approval source states, and provide recoverable export on failure. Automation future run's actual database write has NOT yet been end-to-end observed. Import SQL recovery/check files were written under `/tmp/swadesoul_prospects_import_20261101.sql`, `/tmp/swadesoul_historical_prospects_20261101.sql`, `/tmp/swadesoul_historical_prospects_additional_20261101.sql` (temporary, not durable backups). No emails, microsites or integrations were sent, published, deployed or connected. Next: verify first next scheduled automation execution persists 10 new unique real research dossiers, verify row-level owner-only read and approvals, then record results. Rollback requires an explicit founder-approved scoped review; do not blindly delete imported historical records.

## Cross-site plan — 2026-11-02: Maestro Legends Mix Granada showcase
See Maestro_Radio_Master_Site_Bible.md Legends Mix checkpoint. Collector card geometry locked; locally packaged front-end prototype only, NOT DEPLOYED or connected to live account/payment systems. Reuse existing Maestro media, identity, music and Backblaze services before any rollout. No external spending, Stripe actions, or broadcasts occurred.

## November 2, 2026 (America/Chicago): Coolify Shared Variables access repair

Owner reported that Shared Variables page for Swade Ecosystem / production hangs, while other Coolify pages work. SWADEBASE-2 Coolify deployment version 4.5.3 was healthy; direct public HTTPS login and JS asset returned 200; database retained 33 shared-variable rows (28 environment, 5 server). Logs recorded repeated PHP 256 MB memory-exhaustion errors, not conclusively attributable to this page. Root Team owner membership confirmed. Backed up Coolify PostgreSQL using pg_dump and backed up deployment compose and .env to permission-restricted /root/coolify-repair-20261103 on swadebase-2; backup retained there. Safely raised PHP_MEMORY_LIMIT from 256M to 512M in /data/coolify/source/.env and recreated only the coolify app container with existing local image; DB, Redis, proxy and other apps not recreated. Verified active PHP limit 512M, coolify healthy, local and remote HTTPS login HTTP 200, static JS HTTP 200, TLS valid, same 33 shared-variable rows. Browser-authenticated Shared Variables rendering remains NOT VERIFIED until owner retests; do not mark fully resolved. Recovery: restore protected config backup and set PHP_MEMORY_LIMIT=256M, recreate only coolify after coordinating rollback; do not restore database unless corruption is confirmed. No credentials exported or changed, no production domain or storage migration changed.

## 2026-11-03 Coolify Shared Variables sidebar navigation repair

Owner verified direct Shared Variables URL works but sidebar navigation hangs. Inspected Coolify 4.5.3 on swadebase-2: navbar sublinks and environment index use `wireNavigate()` / Livewire SPA navigation, and instance_settings.is_wire_navigate_enabled=true. After verifying the previously created restricted /root/coolify-repair-20261103/coolify.sql backup is present, disabled Coolify built-in SPA navigation via a single update of instance_settings.is_wire_navigate_enabled=false (id 0). No PHP source, routes, secrets, app data, service deployments, or account roles changed. Verified Coolify healthy, local login HTTP 200, remote HTTPS login HTTP 200 with valid certificate. At verification, shared variable counts were 34 environment and 5 server (39 total); increase from earlier 28 environment was observed, not caused by this setting update. **Owner browser click-through still needs verification**; direct URL worked per owner. Rollback if needed: set instance_settings.is_wire_navigate_enabled=true using existing Coolify Advanced Settings > Wire Navigate, or a carefully scoped database update after backing up. No restart required by code architecture; request-level `once()` settings caching only.


## Asset Machine scoped admin — 20261103T150401Z
Owner-approved app-local delegated client invitations and payment exemptions deployed. Existing confirmed member bound; no global admin grant, shared auth change or user deletion. Existing canonical workspace retained with private Sites launcher. Guide sent to specifically approved recipient. See Asset Machine Bible for current source, tests and rollback.


## Asset Machine experience release — 20261103T170733Z
Existing Asset Machine module extended with source-linked starter guides, plain/professional explanations, private-safe educational sharing, progressive intake, project action summaries, cinematic imagery/horizontal atlas and glass controls. Existing auth/evidence/legal-review boundaries retained. GitHub source2e429655612b0bf7a8fc243fbd7e7f987be5922f; private Sites access entry updated. Nine tests and syntheticDB/B2 regression passed; desktop/390px QA and public export observed. No new provider, spending or checkout. Initial100 directory, company signup and institutional verification integrations pending. See Asset Machine Bible.


## Asset Machine Kokoro homepage voice — 20261103T181455Z
Existing SWADEBASE Kokoro speech and CPU Whisper recognition connected to public metallic voice disc. Curated guide-only answers, typed/mic controls, playback-amplitude pulse and scoped/rate-limited public sessions deployed at assetmachine.live. Existing private evidence/legal/roles protected. Restored existing loopback sssbrain-stt mTLS relay to CPU small.en, restart unless-stopped; old public tunnel stays stopped. Real native and live HTTPS roundtrips passed; browser playback/pulse observed. Actual user microphone/iPad test pending. Source a87e6a32649da322090a829a615dc304627132ca. See Asset Machine Bible for rollback and verification.


## Asset Machine knowledge library — 2026-11-03T19:20:59.014217+00:00

Owner-authorized import is live at https://assetmachine.live/#knowledge. Existing adapter extended with52public articles,nine topics,74primary-source URLs,55checklist rows and29curated answer intents in plain/professional wording; nine operating references remain internal. Public Kokoro answers and authenticated case chat use scoped public references; existing private authorization and no-paid-fallback behavior remain. Source b3a33b962b55d067d034cd7610bc1e97b7c405d4,27tests passed locally/onserver,live search/article/download/voice and HTTP protections verified. Private Whats New shipped event f154748e-b75b-45e1-83b9-5df96c97540e. Full general reference added to approved knowledge; affected docs/index refreshed. No model training,new service,database or financial integration. See Asset Machine Bible for scope,limits and recovery.

## Asset Machine contextual knowledge help — 2026-11-03T17:38:40.648429-06:00

Contextual help is live across Asset Machine: 85 quick explanations, 118 placement rules, hover/focus previews and touch/keyboard-activated in-place reading. A persistent Knowledge & help launcher searches all 52 public articles plus quick workflow explanations, with full article text, sources and downloads. Help preserves the current page, project and form entries. Existing public references/rendering/cache reused with no new model call, paid provider, service or database. 37 automated tests passed. Live acceptance: global help launcher opens a drawer containing all 52 public articles, SKR search returns 6 articles and 3 quick explanations, full SKR article, evidence table and primary source bibliography read inside the drawer without changing the page URL, keyboard focus shows a concise tooltip; Escape hides it while retaining focus; Enter opens the related explanation, closing the drawer restores focus to its launcher, switching the process stage dynamically changes its contextual explanation, unsent public question remains unchanged after opening and searching help, help opens above the existing anonymous sign-in form; closing help preserves that underlying dialog, Escape dismisses a field tooltip without closing the underlying sign-in form, desktop drawer layout visually inspected and page width stays within the viewport. Source 60ccc88885e0dbeab470a2f855d47ec1e2d531ba. The existing public-reference cache and renderer are reused; no new service, database or paid inference. Private What's New f70ee655-5964-4ef1-abc7-ed81c1d2f244. Asset Machine Bible and approved contextual-help reference contain precise scope, acceptance and rollback.


## ATTOBAHN handoff and Workscratcher export — November 4, 2026 America/Chicago

Delivered ATTOBAHN-Delivery-2026-11-04.zip with source revision 613b3e746143ec0f14410fb1b04eb37aa6040911, all 27 descriptor originals, recovered media, six font families, configuration names and the authorized schema/public-content snapshot. Status remains handoff_with_documented_exclusions. See ATTOBAHN_Master_Site_Bible.md and the delivery manifests for unavailable stock references, privacy scope, license limitations, runtime/source differences and production-equivalence limits. The export did not change ATTOBAHN production data, authentication or deployment.

Published Workscratcher complete handoff at /visual-dna/download from commit 3431ce6ab5c9c5f8dccc23bd483ea32fbe44adb6. The browser and local CLI validate supplied original source/media, schema/public content, names-only configuration and license evidence before creating a complete ZIP. Existing reconstruction downloads remain available. All 31 tests and the production build passed; an independent 15-case regression suite passed. Production index-CWeXgQe6.js exactly matches the tested build SHA-256 b2cac9b3dfc9b957e7ae7f3faaf7b630b2ad9eae451e5ac3d087ff5cea973dcf. Signed-in manual/iPad acceptance was not exercised. See Workscratcher_Master_Site_Bible.md for evidence, limits and rollback.

No new service, database, paid model or analysis-credit charge was added by the packager. It does not automatically acquire private originals or query another site's production database. Operator review of inventories, publication provenance and rights remains necessary. The canonical Bibles use the existing no-model knowledge index; the dedicated Bible API enum was not expanded.


## Developer Studio live release — November 5, 2026 (America/Chicago)

**LIVE: supported static-website workflow at https://swadebase.cloud/adapters/developer-studio. Runtime GitHub push remains SETUP REQUIRED.** Existing SWADEBASE owner sessions, adapter service, Oathloom project/file/version/build tables, shared cost ledger and public site host are reused. The interface has separate Chat/Work panes, explicit Send to work, 37 design references, private source add/edit/move/delete/restore, saved changes and checks, immutable publication and rollback. Chat does not dispatch work or publish automatically; Studio Oathloom requests and managed-draft metadata both prohibit automatic publication.

Source merge `912e12927d2b4ec3acfd7158539346496fafbfc3` ([PR 37](https://github.com/swadesoul/swade-ecosystem-hub/pull/37)); backup `/opt/swadebase/backups/developer-studio/20261105T163447.591687Z`. All 62 Node tests, 16 real PostgreSQL disposable-database tests and 22 live acceptance checks passed; 13 runtime files hash-matched source. Main navigation is present. Final health: adapter 200; private page 302 and API 401 without sign-in; builder 401 unauthenticated; existing host and published page 200; adapter active/NRestarts=0. Authenticated Oathloom unknown-action validation returned 400 after the controlled edge restart.

One actual Together reply used 158 input/77 output tokens, settled USD 0.000140 in shared ledger `2293`, and charged the founder USD 0 in application credits. Chat's USD 0.10/call and USD 1/Chicago-day reservation limits are separate from Oathloom Work's existing provider budget. Actual Oathloom run `c8fd1cb8-437e-4144-b2a1-e39cdfa6487f` completed and persisted four files. Its upstream charge was not independently established by this acceptance receipt. Private draft `b1fa67a5-2537-4388-902b-08f6b8f31330` remains separate from public releases.

Final reviewed acceptance release `e6a23e09-0403-424e-a0e1-725177d931e3` at https://swadebase-studio-acceptance.oathloom.site matched source SHA-256 `847b54952744750e2cea6de66225a5c391c7003c512a8f7e8861c3dbe0d035fd` at `2026-11-05T16:43:29.439Z`. Draft/public separation, a second release and live rollback were verified; final copy corrections used no additional model call. Uncertain deploy replay verifies its recorded snapshot without republishing; changed input cannot reuse an operation key.

GitHub runtime push correctly returned 503 setup-required because the existing Coolify App has Contents read-only. No live Studio push is claimed. Existing registry `developer-studio` is enabled/live with this gap recorded. Private What's New shipped event `1da821b0-60b8-4267-9ff2-f168144f4956`; deployment-log ID `12`. Scope remains static HTML/CSS/JS, 200 text files/2 MB, with no arbitrary shell or backend-app deployment. Canonical detail, evidence and recovery: `site-bibles/Developer_Studio_Master_Site_Bible.md`; runtime acceptance receipt `/opt/swadebase-adapters/var/developer-studio-acceptance.json`. Preserve unrelated runtime changes and user history when recovering.
