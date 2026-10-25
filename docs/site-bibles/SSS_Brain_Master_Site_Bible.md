# SSS Brain Master Site Bible

Version 1.0 — October 25, 2026, America/Chicago. Source baseline and operator integration release. This document does not certify every product feature.

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
