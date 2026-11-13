# SSS Brain Master Site Bible

## Current operating status — October 29, 2026, 8:12 PM America/Chicago

This checkpoint supersedes older staging, source-sync-blocked and voice-build-blocked entries below. SSSBrain's existing Coolify deployment finished for source revision 644d6ef696eb862c8357ad41f1ca720f5245c238 (PR98). The exact running image is healthy and public /api/live returned 200. GPT Live is now the main-orb default, uses shared owner knowledge and conversation history, and switches automatically to free voice only on verified exhausted OpenAI credits. An explicit voice selection persists. Free replies, transcription and speech have no paid fallback; automatic credit fallback uses device speech. Short local reply backend checks took about 5.3–5.9 seconds; actual signed-in microphone/audio remains unverified.

Mail Center at https://swadebase.cloud/adapters/mail-center has per-mailbox device setup instructions, copy controls and unsent setup-email drafts. Verified settings: mail.swadesoul.com, IMAP 993 SSL/TLS, SMTP 587 STARTTLS with full-address usernames and authentication. Forty saved investor records were imported into existing owner CRM sssbrain.brain_crm_contacts, including 18 email fields. Daily research-to-CRM transfers and recoverable exports are configured; future scheduled execution and historical missing Black-business exports remain unverified. See SwadeMail_Master_Site_Bible.md.

Owner-only broader edit/add/move/restart execution is still blocked by automatic approval review and missing protected server GitHub/Coolify action connections. No new execution permissions or broad target registration were enabled. See ../SSSBRAIN_REPAIR_CONNECTION_PROPOSAL.md for the bounded first connection proposal. Existing exact owner approvals remain in force.

Lovable migration branding rules are saved in the two existing migration/build-first skills, standing rule 16 and site standards. Cleanup is incomplete: midnightcircuit.live, swideo.com, publiswade.site and dnafront.com still served injected Lovable badge markup from 185.158.133.1; 20 registry entries were unreachable in the audit. Per-site favicons and cutovers need verification. No DNS change was made.


Version 1.1 — October 29, 2026, America/Chicago. Source baseline and operator integration release. This document does not certify every product feature.

## MCP action bridge checkpoint — October 28, 2026

The shared SWADEBASE MCP 1.1.0 now has typed action proposals and separate owner approvals, with payments disabled until rules and exact approvals exist. See MCP_Actions_Master_Site_Bible.md. This does not automatically upgrade native SSS Brain chat into an execution client. An explicitly connected/scoped MCP client must prepare requests, wait for owner approval and execute the approved digest. Missing server GitHub/Coolify credentials still block code repair/merge/publish/deploy. Full app health and authenticated journey coverage remain incomplete.

## 1. Identity
SSS Brain / SSSbrain; conversational companion Swarvis. Canonical application: https://sssbrain.live. Repository: swadesoul/sssbrain. Founder: Swade Soul. SWADEBASE is the shared backend; SSS Brain is the conversational operating layer. Brainiak is a separate consumer product.

## 2. Purpose
Help the signed-in user retrieve knowledge, organize work and use existing ecosystem capabilities. The main conversation stays on /home; capability panels open over it. A route or registry entry is not proof that production works.

## 3. Features and evidence
SOURCE VERIFIED: user-scoped knowledge, threads/messages, memory search, studio projects/sections, creative requests, connected-system tools, Gmail tool, Money Bar, Strategy Miner, delivery hub and ecosystem operations. LIVE SERVICE OBSERVED: the existing Coolify application. This audit does not certify all tools, external sends, media generation, purchases or delivered outputs.

## 4. Operator journey
New integration: after SWADEBASE user verification and secret-input rejection, recognized ecosystem requests use the fixed shared operator endpoint before a paid model is initialized. It reads SWADEBASE's Bible/registry, chooses existing programs using rules, and reports missing Bibles/adapters. An explicit request to save a plan writes a draft to the user's existing brain_wiki_pages and reads it back. A supplied thread must belong to that user. Unrelated requests and users lacking operator access retain the existing chat path. This integration does not authorize paid execution.

## 5. Source and deployment
TanStack Start/React application. src/routes/api/chat.ts; src/lib/ecosystem-operator.server.ts. Existing deployment is Coolify application g1406wexcvceencavj1fuo0u on swadebase-2, port 3000 in Docker. Baseline image commit 20e8cba80ca518ccd40752cea849fd6869b8a997. A separate /opt/sssbrain checkout on the primary VPS is dirty and is not the current release source. Preserve it. Deployment results must be recorded separately from source intent.

## 6. Data
Existing SWADEBASE PostgreSQL schema sssbrain. Relevant existing tables: threads, messages, brain_wiki_pages, context_state, knowledge_entries, swadebase_docs and swadebase_knowledge_chunks. Shared identity roles remain in public. Knowledge drafts use the existing unique (user_id,slug) constraint, with a stable submission-derived slug. No new database or duplicated media store.

## 7. Identity and connections
Browser/server resolve the same SWADEBASE issuer from server-config/auth middleware. Verify the bearer user before access. Use createUserScopedClient with schema routing: application records in sssbrain; shared roles/profiles in public. The operator bridge independently verifies that same original user token and current super-admin role. No founder or service-role credential substitution. Raw tokens never enter model context, generated plans or logs. Other customer permissions are not widened. Gmail/GitHub connection completeness remains independently unverified.

## 8. Dependencies and contracts
Shared operator HTTPS endpoint: https://swadebase.cloud/adapters/operator/route. Request {request,rules_only:true}, authenticated with the verified user's bearer. Same underlying planner as the authenticated MCP endpoint https://swadebase.cloud/adapters/mcp. MCP supports approved knowledge, discovery and coordinator handoff; it does not expose paid production or shell access. The native chat bridge is not an independently implemented MCP server. Old public echo/about MCP remains compatibility-only. Reuse the existing studios/workers for subsequent execution.

## 9. Storage
Durable media belongs in Backblaze; SWADEBASE keeps metadata and original references. The operator saves text plans in existing knowledge and creates no media copies. No temporary/legacy originals were deleted by this feature. Reclaim storage only after durable integrity, permissions and retrieval checks.

## 10. Costs and commerce
Founder policy targets 60–90% platform-funded margin; API credits still have replacement cost. This operator path uses deterministic rules and no paid model fallback. Normal chat retains its preexisting provider behavior. Production rate cards, reservations/settlement and customer entitlements are not certified here. No paid generation, publication, purchase or external send is enabled by this integration.

## 11. Jobs and monitoring
Plans are distinct from execution. Explicit saved drafts are completed knowledge operations only. Existing MCP handoffs use handoff_log, approval required. Do not claim an autonomous production worker started because a plan or task exists. Existing schedulers/voice/memory/production tools are preserved; no new scheduler/service is introduced.

## 12. Known gaps and verification
Unit tests cover fixed endpoint/user-token handling, no paid fallback, explicit save, stable artifact identity, verified readback, role denial, unavailable backend, unrelated chat, negative save instructions and stream framing. A successful build/health probe is not an authenticated user workflow. Record actual live test evidence below after deployment. Customer entitlements, paid media production, external sending and iPad Safari remain separate verification tasks.

## 13. Recovery
Keep the previous Coolify image and deployment available. Revert the scoped chat/helper commit and redeploy through the existing application if required. Preserve knowledge drafts and shared data; do not delete user content during rollback. Shared planner rules_only is additive and may remain safely. Never overwrite unrelated dirty source or concurrent homepage/audio/memory changes.

## 14. Sources and changes
Inspected October 25: current GitHub chat source (blob 9d1725002b0d01d8bdf6f35c88defaaa5a8f9930), deployed router bundle, server-config.ts, SSS Brain AGENTS.md and site skill, Hostinger/Coolify runbook, SWADEBASE Bible v1.3 plus later extensions, standing rules, adapter registry and live schema constraints. Prior shared-context map is a dated inventory, not evidence of complete integration. Update this Bible and SWADEBASE after material changes and verify retrieval through existing knowledge records.

## 15. Deployment verification — October 25, 2026
Native operator source merged in PR #92: https://github.com/swadesoul/sssbrain/pull/92; merge commit 134aa39607eae022700ad9fa87e6a0d8a4c919a7. Existing Coolify deployment heebzwto0rnpe1ss2twzg01l finished; new container g1406wexcvceencavj1fuo0u-20261025T230927 became healthy and rolling update completed. Previous baseline image remains available for rollback.

A real, temporary SWADEBASE user authenticated through GoTrue and invoked public HTTPS /api/chat. The request prepared a multi-program school anthem/video plan, saved it into that user's existing knowledge, read it back and returned a native UI message stream. Repeating the same submitted message retained one draft. A different thread ID returned 403. Removing the operator role made the shared bridge return 403. No paid model or external production ran. Temporary identity, role, thread, messages and draft were removed after testing. Five focused native tests and nine shared MCP tests passed. This is an API-level signed-in verification, not an iPad/browser visual or paid-production test.


## OpenHands checkpoint — October 26, 2026
OpenHands is installed as a separate bounded voice-code experiment on existing SWADEBASE compute. Native-model benchmarks failed; proposed handoff/registry integration is staged and approval-blocked, not an operational chat tool. Existing app audio, routing, identity and permissions are unchanged. See OpenHands_Master_Site_Bible.md.


## Knowledge retrieval and cleanup — October 26, 2026 America/Chicago
DEPLOYED FIRST PHASE; NO MODEL TRAINING. Exact founder duplicates consolidated from 84 to 16 with private backup and canonical mapping; 14 wiki pages have active lifecycle, with 11 former drafts labeled unverified rather than promoted to verified. Existing private MCP/owner console now exposes Ask your knowledge, combining current approved references with actor-scoped private knowledge. Local Llama 3.2 inference is bounded with source-label validation and explicit source-extract fallback; no paid fallback. An initial live answer failed citation validation and correctly fell back; constrained generation then passed a second live source-grounded check.
Existing Incident Guardian hourly schedule now runs hash-based reference indexing after its review. Approved Site Bibles, standing rules and reviewed lesson files only; no automatic customer upload collection, training consent, GitHub webhooks or all-repository ingestion. Private-row isolation verified: no identity and a different actor returned zero; founder returned 16 knowledge records and 14 wiki pages. Public HTTPS tests rejected unauthenticated/bad-origin/bad-CSRF requests and secrets; approved/private retrieval and no-evidence response passed.
Found original SSS Knowledge Studio in swadesoul/sssbrain PR 26, open/unmerged. It is not deployed by this phase. Three existing review gaps must be repaired before reusing it. Source inventory and known limits: docs/KNOWLEDGE_LEARNING.md. Backups /opt/swadebase/backups/knowledge-learning-20261027T042144Z; rollback only scoped MCP files/drop-in/policies and preserve unrelated work. General SSS Brain/Brainiak chat wiring and the complete studio remain unverified follow-up.


### Knowledge release KL-1 — final verification
First live unconstrained synthesis rejected its citation output and correctly returned source extracts. Constrained source-label JSON generation then passed a second public HTTPS live request: Llama correctly explained the recorded Brainiak HTTP 413 cause and bounded route fix, citing the approved lesson. All 32 MCP/protocol/merch/knowledge tests passed. Official SDK live HTTPS discovery found nine tools and invoked source-grounded extract retrieval and Knowledge Studio search. Independent cleanup comparison preserved every unique material source field; email reference-orphan count zero. Owner isolation passed on the actual adapter database role. Changed-source indexing updated exactly the three changed Bibles; unchanged refresh updated zero. Owner UI/API are deployed; authenticated browser/mobile visual testing is not certified.


## Lamborghini package — full SSS Brain, $4,999 — 2026-10-28, America/Chicago, per Harold
PLAN/REQUIREMENT ONLY; NOT IMPLEMENTED, NOT IN STRIPE. No code, Stripe, database, config or service change. Backup: SSS_Brain_Master_Site_Bible.md.bak-20261028T231950Z.
What it is: the full SSS Brain, everything Harold has. Price: $4,999. Sold only on the SSS Brain website (sssbrain.live). It is not sold on brainiak.live and is not a Brainiak tier; Brainiak Enterprise is a separate, watered-down SSS Brain at $1,900 (billing period to confirm) with toggleable paid upsells.
Includes: the Hostinger account with all bills included (recorded as Harold stated it; duration and which services are covered are to be confirmed, since a one-time price cannot fund indefinite recurring costs).
Bring your own APIs: the buyer brings their own API keys and connects their own situation. No fallback to founder credentials.
Build requirement — super admin key panel: the buyer's super admin area must let them plug in, replace or remove their own API keys at any time. Keys are stored server-side on the buyer's SWADEBASE, encrypted at rest, executed server-side only, shown back masked (never in full), never placed in notes, chat, model context or logs, with rotate/revoke and an audit record of who changed which key and when.
Overlap flagged for Harold, not changed: the existing SSS Brain $100/month hosted BYOK and $1,900 self-host license (BRAINIAK_PRICING_AND_MARKETPLACE.md status line) now overlap with this package, and the $1,900 self-host license matches the new Brainiak Enterprise price. Also unreconciled: a "standard $5,000/$500 offer" referenced in the Brainiak healthcare readiness notes.

## Upgrade and provisioning model (Lite to Lamborghini) — 2026-10-28, America/Chicago, per Harold

Status: PROPOSAL, docs only. No code, config, database, Stripe, Hostinger or service change was made. Stripe/billing for Lite, the Lamborghini and upgrades is NOT set up.

### 1. Lite / Enterprise price (settles "billing period to confirm")

2026-10-28 update per Harold: SSS Brain Lite / Brainiak Enterprise is $1,900 one-time plus $279/month. This settles the earlier "billing period to confirm with Harold" notes; those notes are left in place for history.

### 2. Upgrade credit to the Lamborghini ($4,999)

Everything a Lite client has already paid (the $1,900 plus every $279 monthly payment) is credited toward the $4,999 Lamborghini. Balance due = $4,999 − total paid.

Worked example: $1,900 + 3 × $279 = $2,737 paid, so the balance is $4,999 − $2,737 = $2,262.

Note: Harold's "roughly $3,000" balance matches $1,900 paid plus about 0 to 1 monthly payments ($3,099 after 0 months; $2,820 after 1 month). After 3 months the balance is $2,262; after 11 months it is $30, and by 12 monthly payments the credit exceeds the whole $4,999.
FLAG for Harold to confirm: the credit formula, whether there is a cap or time limit on the credit, and whether the $279/month fee stops after upgrading to the Lamborghini.

### 3. Provisioning on payment clear

When payment clears, the client gets two brand-new servers that match what Harold's current servers do, under a NEW Hostinger account created for that client. Never an existing Hostinger account, and never Harold's.
- App and data server (mirrors swadesoul's role): web apps and sites, the SWADEBASE adapter service and registry, PostgreSQL and identity (GoTrue), nginx and SSL, Motion Studio, product content and docs, local Ollama for routing.
- AI / GPU and worker server (mirrors swadebase-2's role): the SSS Brain app deployment (Docker via Coolify), the always-on agent team (Rakazo), rendering and background workers.
(Roles described from the existing docs. No IPs, hostnames, credentials or secrets are recorded here.)

Steps: (1) payment webhook, (2) Hostinger account and VPS creation, (3) base image or bootstrap, (4) content and layer sync, (5) BYOK/BYOC onboarding, (6) health check, (7) handover.

### 4. Content parity and boundary

Copied over: all of Harold's product content, modules, templates, styles, elevation layers and features (gated by the client's grants, per the one-engine rule).
NEVER copied: Harold's own secrets or API keys; Harold's personal data feeds (per /opt/sssbrain/docs/GODSEYE_PERSONAL_CUSTOMER_BOUNDARY.md); customer records; other clients' data. White-label or licensed add-ons are copied only if that client has been granted them.

### 5. BYOK / BYOC

The client plugs in their own API keys and providers through the super-admin key panel at any time. Nothing runs on Harold's keys, with no fallback to founder credentials.

### 6. Timeline and client expectations

The new two-server environment goes live within THREE BUSINESS DAYS of payment clearing, for Lite ($1,900 + $279/month) or the Lamborghini ($4,999). During that window the client can already plug in their own APIs through the super-admin key panel.

Suggested client-facing wording (draft for Harold's approval; nothing is sent automatically):
- Checkout / welcome email: "Welcome to SSS Brain. Your payment is confirmed. We're now building your private SSS Brain on two dedicated servers of your own. It will be live within three business days. You don't have to wait to get started: sign in to your super-admin panel and add your own API keys and providers now, so everything is ready the moment your servers go live."
- Status: Payment received. "Payment received. Your SSS Brain build has started."
- Status: Provisioning. "We're setting up your two dedicated servers and securing them."
- Status: Content sync. "Your servers are up. We're loading your SSS Brain modules, templates, styles and content."
- Status: Live. "Your SSS Brain is live. Sign in to your super-admin panel to start. Any API keys you added are already connected."

### 7. Automated Desktop Commander provisioning workflow

Once payment clears (verified Stripe webhook), an orchestrator runs every step with no manual intervention:
1. Create the client's NEW Hostinger account and two VPSs (Hostinger API or MCP).
2. Bootstrap: a cloud-init or first-boot script installs the Desktop Commander agent and registers the two new devices.
3. Setup through Desktop Commander: OS hardening, Docker, PostgreSQL or Supabase, nginx and SSL, then services matching swadesoul's app and data role and swadebase-2's AI and worker role, from the pinned golden snapshot (section 8).
4. Content and layer sync: product content, modules, templates, styles and elevation layers only, applying the boundary in section 4 (no Harold secrets, personal feeds or customer data).
5. Super-admin panel activation for the client.
6. Key panel readiness (BYOK/BYOC).
7. Automated health checks.
8. Handover (Live status message).

Every step logs to a provisioning job table (proposed name: `provisioning_jobs`, e.g. job id, client, tier, step, status, attempt, started/finished, error summary with no secrets, snapshot version). Every step is idempotent, can be retried, and alerts Harold on failure. Fallback: if a step fails twice, it escalates to Harold, within the three-business-day SLA.

Flags for Harold:
- Whether a NEW Hostinger account can be created fully by API. Signup, identity verification and payment may need a human, or a Hostinger reseller or agency account may be required.
- Who pays the Hostinger bills (ties to the earlier "all bills included" flag on the Lamborghini).
- How Desktop Commander gets first access: a one-time bootstrap token in cloud-init, rotated or revoked after setup.
- Security: the client gets super-admin on their own servers, and Harold's own keys never ship.

### 8. Self-updating golden snapshot

What: Desktop Commander captures a versioned snapshot / manifest of Harold's current swadesoul and swadebase-2 setup. Provisioning replicates that snapshot on new client servers.

Captured: OS and server config (packages, systemd units, nginx sites, Docker compose files and images with tags, ports and service roles); installed tools and versions; database structure (schema-only dumps and migrations, no row data except safe seed and reference data such as styles, templates and module catalogs); the adapter registry (swadebase_ops.adapters_registry); Motion Studio templates, styles and elevation layers; feature-grant definitions (the catalog and tier defaults, NOT Harold's or other clients' grant rows); content layers; agent definitions.

Never captured: secret values (only key NAMES, as a checklist for the BYOK panel); .env values; Harold's personal data feeds; customer records; other tenants' data; logs.

Secret scan: every snapshot passes a secret-scan step; if any secret pattern is found, the snapshot is blocked and not stored or promoted.

Self-updating: triggered by events (adapter registry change, new module or template, migration applied, deploy) plus a nightly scheduled refresh. Each snapshot is dated and versioned, with a diff against the previous one and a changelog. Stored in a private repo or object storage with a retention limit.

Safety: a new snapshot is validated by a test provision on a throwaway VPS before it is promoted to "current". Provisioning always pins a known-good version, so a broken change can be rolled back. Harold can freeze snapshots or approve a promotion.

Updating existing clients (optional, OFF by default): already-provisioned client servers can be offered opt-in updates to a newer snapshot.

### 9. Open questions for Harold

- Who owns and pays the client's Hostinger account (ties to the earlier "all bills included" flag).
- Server sizing and cost per client.
- How often content syncs after launch.
- Whether the Lamborghini is still sold only on sssbrain.live.
- Upgrade credit formula, and whether $279/month stops after upgrading.
- Whether a new Hostinger account can be created fully by API, or needs a human step or a reseller/agency account.


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

## Incident note — 2026-10-29 ~20:11 CT (recorded by Claude, rule 17; no SSS Brain code was changed)
- Symptom: Harold tapped Sign in and got "This page didn't load. Something went wrong on our end."
- Cause (evidence): sssbrain.live (served from swadebase-2, 2.25.96.150) was redeployed at 2026-10-30 01:10:16 UTC (Last-Modified on /assets/index-6Qr26qc2.js). An already-open tab still ran the previous build; its lazy /auth chunk no longer exists (old hashed assets return 404 text/html), so the route import failed and the error boundary showed. Verified working at 01:15 UTC: all 119 current chunks 200, auth-config.json 200, GoTrue settings 200 (google enabled), /auth/v1/authorize?provider=google 302 to Google.
- Immediate fix for users: close the tab and reopen (iPad Safari: clear sssbrain.live website data if needed).
- Permanent fix (proposed, needs approval; code lives on swadebase-2): 1) add a `vite:preloadError` listener that reloads the page once when a chunk fails to load; 2) serve index.html with `Cache-Control: no-cache`; 3) keep the previous build's /assets for 24-48 h after each deploy.
- Note: swadebase-2's Desktop Commander agent has been unresponsive since ~19:40 CT; the site itself responds normally.

- Update 2026-10-29 ~20:50 CT (Claude): permanent client fix for the stale-tab sign-in error is PR #99 (swadesoul/sssbrain, branch fix/stale-build-reload): reload once on chunk-load errors, 30 s loop guard, tests pass. Not merged or deployed yet; awaiting Harold.

## Talk-to-Post — design v1 (PROPOSAL, 2026-10-29 ~21:00 CT, per Harold; not built)
Goal: Harold tells SSS Brain what to post; SSS Brain asks if he wants an image, generates one, shows the image + the exact text per platform, Harold approves, it posts to the platforms he picks (LinkedIn, Facebook, Instagram, X, TikTok).
Reuse (rule 11): Distribution Mesh (src/lib/money-bar-distribution*.ts) already drafts per-platform variants and routes publish approvals through money_bar_events (YELLOW) — keep that as the single approval path. Image generation: existing image.server.ts / media-core. Images stored on Backblaze (public URL needed by Instagram/Facebook).
Missing piece = the actual poster. Candidate: Postiz (github.com/gitroomhq/postiz-app, ~40k stars, AGPL-3.0, active, has public API + MCP, supports X, Instagram, LinkedIn, Facebook, TikTok, Threads, YouTube, Bluesky...). Self-host on swadesoul (not swadebase-2: memory). SSS Brain calls Postiz API only AFTER the approval event is approved. AGPL: fine for Harold's own use; offering it to SWOSTing customers requires publishing modifications — decide before reselling. Alternative MIT option: Mixpost (fewer platforms).
Flow: chat/voice "post about X" -> drafts per platform (length rules per platform) -> "want an image?" -> generate 1 image (1:1 and 9:16 crops from one master, per media rule) -> preview card (image + each platform's text + checkboxes) -> Harold approves/edits -> post -> receipt with links; failures reported per platform.
Platform reality (checked 2026-10-29): LinkedIn personal profile posting = "Share on LinkedIn" product (same LinkedIn app as sign-in); company pages need LinkedIn Community Management API approval. Facebook Pages + Instagram (Business/Creator account linked to a Page) = Meta app with pages_manage_posts / instagram_content_publish, needs Meta App Review. TikTok Content Posting API: unaudited apps post private-only until TikTok audits the app. X: no free tier for new developers; pay-per-use ~$0.015 per post, ~$0.20 per post containing a link (spend under rule 13 needs Harold's approval).
Rule 5 still applies: nothing posts without Harold's explicit approval of that exact image + text (or a recorded standing grant).

- DEPLOYED 2026-10-29 ~21:00 CT (Claude, approved by Harold, deploy lock held): PR #99 merged as f285e92; Coolify deployment hfifkjfxicphzjkux8ct6tam finished 01:58 UTC. Verified: /api/health 200, home 200, /auth 200, live bundle assets/index-DYiIkRpC.js contains the stale-build reload guard, Google and LinkedIn authorize both 302. Rollback: revert f285e92 on main (Coolify auto-deploys). Still open: index.html no-cache and keeping previous build assets 24-48 h.
- Oct 30, 2026 ~22:10 CT (Claude): **God's Eye map fixes — PR #103 open, NOT merged/deployed** (https://github.com/swadesoul/sssbrain/pull/103, branch fix/gods-eye-maps-satellite-infrared-location, commit 04077ec on top of live 54a6aea). Root causes: Open-Meteo geocoder only matches comma-separated names, so spoken places ("Miami Florida", "Dallas TX"), coordinates and "my location" failed → error instead of map; any failed 60 s refresh replaced a working map; "turn on satellite" toggled the ISS layer, not imagery; GPT Live's sss_brain_local_command could only open maps, never steer them. Fix: Nominatim → Photon fallback + lat,lon reverse lookup; map stays up on refresh errors; satellite imagery on/off + labels, remembered; overlays infrared (NASA GIBS GOES-East/West, Himawari; VIIRS thermal elsewhere), night lights (Black Marble), radar (RainViewer), all free/no keys; my location (browser geolocation, marker, iPad permission help, 📍 me); backup street tiles; GPT Live steers open maps. 304 tests pass, tsc clean, build OK, headless Chrome render check 0 failed tiles. Merge was blocked by the session's review safety check; Swade (or a reviewer) merges in GitHub, then Coolify auto-deploys g1406wexcvceencavj1fuo0u (auto-deploy observed: container started 4 s after commit for 54a6aea).

## Resolution note: 2026-10-30 ~10:20 PM CT (Grok Bot)
- RESOLVED: "Swideo" unconfirmed / possible Audivid notes. Swideo confirmed by Harold Oct 30, 2026 10:17 PM CT: video creation studio for movies, short drama, motion graphics, comedy series shorts, faceless videos and AudiVid (AudiVid is part of Swideo). See Swideo_Site_Bible.md v1.0. Entitlement key `swade.whitelabel.swideo` name confirmed. Earlier text left unchanged.


## Source-only checkpoint, November 1, 2026
2026-11-01 22:14 UTC. ChatGPT checked and locally committed source changes in /opt/sssbrain: ddbdaad (radio), a26e729 (operations documentation), 3f1adca (STT), 97718c4 (voice/home/chat), and 3cf0334 (Scout and route registry). Five radio tests, STT Python syntax/Compose validation and five URL safety checks passed. SSSBrain production build and TypeScript typecheck passed; scoped ESLint zero errors (one existing React hook warning). This is SOURCE-ONLY, not pushed or deployed. Local main is 22 commits ahead of its origin/main tracking ref, including 17 older commits. No live tenant journey, external media spend, STT restart, SQL migration or application production rollout took place. Existing deployment unchanged. Revert exact commits after reviewing downstream integrations. Backups of the affected Bibles were made before appending. Auto-Director specification remains at /opt/swadebase/docs/prds/SWADE_SHARED_AUTO_DIRECTOR_2026-11-01.md; not yet deployed.


### 2026-11-01 22:16 UTC — Auto-Director isolated branch source committed
ChatGPT committed 0d0646a on local SSSBrain worktree branch feat/shared-auto-director-20261101. Included client-only Auto-Director page linked from Creative Studio, rules-based six-line dialogue to micro-motion shot cards, manual beat edits/undo, and Markdown/JSON draft exports. Four Vitest tests passed; ESLint zero errors; production Vite build and TypeScript typecheck passed. This is NOT merged into local main, pushed to GitHub, deployed or connected to paid video generation. Existing voices/dialogue are preserved; no AI media production ran. Backend persistence, live job handoff, expanded motion semantics, cross-app rollout and authenticated browser verification remain pending. Rollback by dropping/reverting this isolated branch after review; baseline parent is the earlier worktree HEAD.


## Admin invite + feature ACL + COS onboarding (2026-11-05)

Inventory and gaps: docs/prds/SSSBRAIN_ADMIN_INVITE_FEATURE_ACL_2026-11-05.md. Live source https://github.com/swadesoul/sssbrain.git. Admin codes UI at /admin invites; email via Swarvis send_invite; feature ACL at /admin-products (not on invite). Invite-only BEFORE INSERT trigger currently missing on SWADEBASE auth.users — repair before treating gate as live. Workspace starter provision via sssbrain.provisioning_jobs (PR #111). COS talk-in onboarding not built yet (form /onboarding only). Public launch drip HOLD.

### Additional full-duplex voice fallback candidate — 2026-11-11 (NOT ENABLED)
Owner requested low-latency, low-cost fallback to metered GPT Live. NVIDIA PersonaPlex source at /opt/swadebase/ops/voice-personaplex, SHA16419a2; shared adapter registration voice.personaplex disabled/ready=false/no active sites, no weights, no GPU, no billable activation. Existing GPT Live default and free CPU/device-speech fallback preserved. To enable, first verify NVIDIA model license, GPU and real microphone streaming latency, then integrate through the existing SWADE voice router with a founder-approved bounded GPU budget. See SWADEBASE Master Site Bible PersonaPlex entry.

## Together MiniMax credit protection — November 12, 2026 America/Chicago

Installed by ChatGPT and verified November 13, 2026 UTC (actual server date). Founder approved paid Together API use and reported $79 remaining. An idempotent reconciliation corrected the existing approximately $80 ledger estimate to approximately $79; the balance is owner-reported rather than independently provider-verified. A live verification cost $0.000031 (ledger 4623), leaving $78.999906 estimated. The existing $2 floor and $10 low-balance threshold remain. The shared Together spending function checks $0.10 per-call estimates and a $1 Chicago-day settled-plus-held budget, negative estimates, held Studio reservations and unpriced calls. Older callers without atomic reservations are not certified against concurrent overspend.

Developer Studio defaults to MiniMaxAI/MiniMax-M3.1-Flash through the hosted serverless chat API, explicitly selecting low reasoning. It streams internally, closes transport on finish, aborts after 10 seconds without meaningful content/reasoning/usage progress and has a 120-second total job limit. Keepalives do not count as progress. No automatic retries; ambiguous or incomplete results retain their reservation for reconciliation. Disconnect cannot guarantee an upstream refund. Founder application credits stay exempt; upstream usage remains real.

Read-only account verification found the model available and zero owned dedicated endpoints. The initial Python client received HTTP403; an explicit User-Agent resolved the check. No rented GPU, dedicated endpoint or account billing setting was changed. Shared ledger checks affect callers using ai_can_spend. The 10-second transport watchdog is verified for Developer Studio only; the existing compiled SSS Brain client and independent callers have not been replaced. Do not claim ecosystem-wide timeout enforcement.

Acceptance: 12 Node tests passed, including a measured 10-second heartbeat-only timeout, progress and hard deadlines, abort, truncated streams, replay, concurrent Studio reservations and ledger failure handling. Nine rolled-back SQL assertions passed. Actual MiniMax reply READY took 3.851 seconds, with 193 input/3 output tokens. Duplicate request replay returned the same ledger receipt without another provider call. Internal and public adapter health returned HTTP200.

Source and verification: /opt/work/together-credit-20261113. Prior runtime, Bibles and spending function: /opt/swadebase/backups/together-credit-20261113T045720Z. Restore provider.mjs and restart only swadebase-adapters under the deployment lock to roll back code. Reverting the shared spending function requires deliberate policy recovery; retain genuine usage receipts and the owner's balance reconciliation. Rate source: https://docs.together.ai/docs/serverless/models. Input/output rates $0.15/$0.60 per million; cached input is conservatively charged at full input rate in the existing ledger.

Commercial attribution: Built with MiniMax M3.1-Flash.

Source backup status — November 13, 2026 UTC: Automatic approval review rejected creation of a Git tree containing six prepared files in swadesoul/swade-ecosystem-hub on codex/together-credit-guard-20261113. Stated reason: internal deployment code, database policy, operational paths and owner balance/usage details were being uploaded to an unverified destination without explicit disclosure authorization. No alternate upload or retry was made. The branch exists, but no source tree/commit was uploaded. Tested source and evidence remain at /opt/work/together-credit-20261113. Runtime controls and prior live verification are unaffected. Explicit owner approval of that payload/destination is required for the backup.
