# Veteran Bridge Master Site Bible

Version 1.0 — SWADEBASE integration release. Author: Codex executing Swade's request to finish the backend and identity setup. Actual verification and deployment timestamps are recorded in the What's New database and release evidence.

## 1. Identity and ownership
Veteran Bridge, powered by GroundLift; Swade Soul Holdings LLC (founder-provided). Public frontend: https://veteran-bridge.swadeswade-s-8788.chatgpt.site. Authenticated workspace: https://swadebase.cloud/adapters/veteran-bridge/. Sites project appgprj_6ad7b7f7c3988191bb5fab12d836f099. Independent of VA; account membership does not verify veteran status.

## 2. Purpose and outcomes
Reduce veteran navigation burden: organize questions, locate official resources and accredited assistance, maintain a simple next-step checklist, draft factual letters, and reach GroundLift. No eligibility determination, medical treatment, rating guarantees, or claims representation.

## 3. Features and limits
LIVE API VERIFIED: SWADEBASE identity validation; unique account reference IDs; isolated generic checklist storage; local-AI navigation; consent gate; exact-origin CORS; registry kill switch; fixed request/inference limits. BROWSER OBSERVED: sign-in workspace, guided/local mode controls and anonymous AI gate. SOURCE VERIFIED: browser-only PDF/text workspace, editable template letters, resource search, GroundLift links and Pass the Cup note exports. NOT CONNECTED: VA/ID.me records, medical uploads/analysis, accredited partner workflow, document sending/filing and payments.

## 4. Customer journey
Open My account on the Sites frontend, continue to the secure SWADEBASE workspace, then use existing Google or email sign-in. A verified account receives a VB-prefixed reference ID. Existing cloud plan is loaded; generic steps can be changed with optimistic version checks. Choose Local AI, explicitly consent to message processing, and ask a navigation question. Source links are separate from generated prose. Guided navigation remains available to guests. Sign out clears local conversation, tokens, files and drafts; it does not delete the cloud account or checklist.

## 5. Source, hosting and deployment
Frontend and recovery copy of backend/schema/tests are in the Sites source repository for project appgprj_6ad7b7f7c3988191bb5fab12d836f099. Runtime backend source: /opt/swadebase/ops/veteran-bridge/route.mjs. It is imported by the existing /opt/swadebase-adapters/server.mjs; no duplicate service, scheduler, AI deployment or database was created. Identical frontend assets are served from that module's public directory. API: /api/adapters/veteran-bridge/{config,me,plan,chat}. An isolated nginx location raises only this API's bounded request/time limits and disables its access logging. Sites audience remains public as observed before the edit.

## 6. Data and ownership
Existing PostgreSQL, schema swadebase_ops: veteran_bridge_profiles (verified user_id FK, unique VB-prefixed bridge_id, generic plan, optimistic plan_version, timestamps); veteran_bridge_usage (user_id, UTC/server-date request counter). Foreign keys cascade only with authorized auth-user deletion. RLS denies anonymous/authenticated direct table access; existing adapter role has scoped access to the two new tables. Every private operation independently verifies the token with Auth and filters data by verified user ID. Client-supplied IDs are ignored. No conversations, medical files, letter details, passwords or provider credentials are persisted by this application.

## 7. Identity and roles
Reuse SWADEBASE GoTrue, not hosted Supabase. Existing Google broker callback: https://swadebase.cloud/auth/v1/callback. App return: https://swadebase.cloud/adapters/veteran-bridge/. Existing allowlist already covers it. S256 PKCE verifier is single-use sessionStorage; access/refresh tokens stay in memory, refresh while tab is open, and clear on sign-out. Browser refresh requires login again. Native Sites identity and SWADEBASE identity are separate; the Sites frontend links to the SWADEBASE workspace instead of adding external OAuth to Sites. No new Google client or shared allowlist broadening. Bridge reference ID is not a military/VA ID or ID.me credential. Founder account policy remains unchanged; no roles were elevated.

## 8. Dependencies and callable capabilities
Reuse existing adapter service/pool, enabled registry entry veteran-bridge, existing GoTrue and Ollama llama3.2:3b at loopback. Config is public non-secret capability metadata. All private endpoints require a verified account and check the adapter kill switch. There is no tool execution, outbound messaging, VA access or paid-provider fallback. AI is constrained to general navigation using selected official-source descriptions. Raw model-produced phone numbers and URLs are replaced with pointers to trusted links. Source links are not proof of factual correctness of every model sentence.

## 9. Files and retention
No durable media generated or uploaded. Documents and letter drafts remain in browser memory; future durable media must use Backblaze under the shared policy. Generic plans remain in SWADEBASE. Daily counters contain no text. No application conversation transcript logging; existing infrastructure logging policy needs its own periodic review.

## 10. Cost and usage
External paid budget is zero under current standing rules. No paid model call, new subscription or service key was created/copied. Local inference: one in-flight request in this adapter, five attempts per user per 15 minutes, twenty attempts per server day, 2,000 input characters, at most six recent context messages, 260 generated tokens, 90-second server timeout. Failures do not fall back to paid providers. Attempts consume the daily allowance. Shared CPU/hosting capacity is finite; no profitability or latency guarantee.

## 11. Jobs and operations
No new background jobs. Existing swadebase-adapters.service hosts the module. Operator can disable veteran-bridge in the registry. Chief of Staff receives an internal documentation handoff through the existing shared log, not an external message. Resource metadata and regulatory guidance need periodic verification; this release did not create a new schedule.

## 12. Verification and known gaps
Ten Node authorization tests passed locally and on SWADEBASE. Public HTTPS smoke verified anonymous 401, foreign-origin 403, email login with two temporary confirmed test accounts, distinct Bridge IDs, user-isolated plan reads/writes, rejection of a stale plan version, consent enforcement and a real local-model answer in about 10.31 seconds. Both test accounts were deleted through the admin API afterward. Existing adapter health remained 200. Browser observed account and companion mode screens. Real-user Google consent/callback, actual iPad Safari, optional dictation, account recovery and clinical-data processing readiness remain unverified. VA/ID.me client credentials were not found among key names in the shared docker .env/functions.env or the previously inspected app configuration; production approval is not established. No VA client ID is invented, and no official records connection is claimed.

## 13. Recovery
Baseline shared server/nginx backup: /root/veteran-bridge-backups/20261027T050236Z. Disable registry entry first. Remove only the module import/handler after reviewing concurrent changes, syntax-check and restart the existing service. Do not blindly restore entire shared files or drop shared data. Sites prior source: 82b7af8fa184076294d142d83ed38873542968df, available as preceding saved version. Preserve current source/row evidence for future recovery.

## 14. Decisions, sources and next review
Founder request in this conversation: build Veteran Bridge, use SWADEBASE backend for AI and set up identities, then finish. Reuse-first and zero-paid-spending standing rules govern. Sources: current SWADEBASE Bible and rules, adapter registry/server/database catalog, existing mail-enhance local inference implementation, existing GoTrue Google authorization response, official VA Patient Health production-access documentation, VA accredited-representative guidance, frontend source and live smoke. Next gates: real-user Google callback, approved VA application/scopes/client credentials, any separately contracted ID.me verification, accredited partner agreement and health-data readiness before records processing. Documentation index readback and release SHA are recorded in the deployment evidence.

Release evidence: actual server timestamp 2026-10-27T05:10:17.548641+00:00; Sites pushed SHA 1ff6500d5e4679b85c56681f27185549931d0b25, saved version 2. Publication status is recorded separately after the native deployment result.

Final release checkpoint: Sites version 3/source fdc4d4a5df242290c290a52f33c135012fb63612 is published successfully. SWADEBASE operator catalog now recognizes veteran-bridge; eight existing MCP core tests and scoped indexed-Bible service retrieval passed. Real-user Google/iPad verification and VA/ID.me production credentials remain pending. Backup of shared catalog core: /root/veteran-bridge-backups/20261027T050236Z/mcp-core.mjs.
