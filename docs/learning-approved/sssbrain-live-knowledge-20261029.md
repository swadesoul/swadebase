# SSSBrain live voice knowledge retrieval repair


## Live voice knowledge repair — 2026-10-29 19:02 CDT

LIVE INTERNAL REPAIR; SOURCE SYNC PENDING. Recorded at 2026-10-30T00:02:51.230064+00:00.

Confirmed source gaps: live session startup had no retrieved business context; native search_knowledge omitted shared approved references and knowledge_entries; the voice prompt instructed the inner model to skip tools for speed; broad ecosystem keyword routing could intercept read questions with a planning response.

Reused the existing knowledge service and database. Added POST /adapters/operator/knowledge, which verifies the caller's original SWADEBASE JWT and current super-admin role, keeps ecosystem:read only, rate limits requests, honors the MCP kill switch and uses extraction only (no model call). Session startup now receives bounded source evidence and registry context. Native chat prefetches scoped references, and search_knowledge includes the shared index plus the existing conversation/capture search. Voice instructions now require evidence for business facts and tools for current operational checks. The routing shortcut is restricted to planning/action language. Retrieved records remain data, never permission to execute. Customer access was not broadened.

Verification: 29 backend tests and 18 native/auth/session tests passed; TypeScript, production build and image build passed. Built HTTP canary verified session context/tool attachment and native voice-mode chat context using simulated model responses only. Read-only checks through the actual adapter database role returned four shared sources, owner-private knowledge and 20 registered capabilities; a different actor identifier received zero private results. Live app liveness HTTP 200; anonymous chat/session HTTP 401; anonymous shared knowledge HTTP 403. Paid test calls: zero. No test account, token or role was created. Authenticated browser microphone and spoken answer remain unverified. Registry availability is not a complete connected-system workflow certificate.

Deployment: app container g1406wexcvceencavj1fuo0u-voice-20261029, image sssbrain-live-knowledge:20261029, healthy on existing swadebase-2 Coolify network. Source is preserved in local commit 9cf7d01 at /opt/sssbrain-live-knowledge-20261029 (branch fix/live-voice-knowledge-20261029). Existing shared adapter service was restarted with the additive endpoint. Receipt: /opt/sssbrain-live-knowledge-release.json on swadebase-2.

Recovery: start retained prior app container g1406wexcvceencavj1fuo0u-20261026T000851 and stop the replacement. The shared route baseline is /opt/swadebase/backups/sssbrain-live-knowledge-20261029/route.mjs; restore that scoped file and restart swadebase-adapters.service if needed. Do not alter customer records.

Outstanding: automatic approval review rejected uploading the changed source to the existing GitHub repositories as an unapproved remote source upload. No push or merge occurred. Canonical source synchronization is required before a later normal deployment, which otherwise could overwrite this server repair. Current deployment is a manual, recoverable release, not a claimed GitHub/Coolify source deployment.
