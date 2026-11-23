# SWADEBASE unified capability layer — owner-approved design / staged contract
Recorded November 19, 2026. **Status: staged read-only planning code, NOT integrated into SWADEBASE production execution.**

## Objective
One request by text, voice, document or existing project should receive one plan that selects capability and specialist model/agent/tool, applies user and tenant permissions, controls spending, and returns checked results within the project's private workspace. Foundation is existing SWADEBASE/SWADEBASE Ops, SSS Brain, Brainiak, SWAGENTS, approved Rakazo workers, adapter registry, OmniRoute, Ollama, Postgres, B2, Hostinger, RunPod/Hyperstack. **Do not build duplicate databases, authentication, model routers or media pipelines.**

## Map of examples the founder gave
| Request family | Provider comparison / existing assets | Status and contract |
| --- | --- | --- |
| ElevenLabs-grade voice | Existing SWADE Voice Service (Kokoro), Voice Gateway, connected ElevenLabs tools | Internal service registry live; full continuous speech-to-speech and universal ElevenLabs bridge NOT VERIFIED; meter paid voice per-account |
| Higgsfield-grade video | Existing RunPod GPU video adapter, SWIDEO, ImagineSwade, Higgsfield prior deliverables | RunPod adapter registered live and Higgsfield previous jobs completed; active job availability requires test and approval |
| Suno-grade original music | ReSingLab, music GPU adapter, Suno OAuth/MCP intake | Native music adapter registry INACTIVE, Suno authorized external download not confirmed |
| Microsoft Office-grade documents | Existing Document Extraction, SWADEBASE documents, Microsoft Graph later | Native input/review may work; a full Microsoft 365 OAuth/write connector NOT VERIFIED |
| Google SEO | SWADEBASE prior SEO studies, Search Console OAuth/official tools when connected | NO general authenticated live Search Console connector verified; separate organic AEO/SEO planning from verified analytics |
| Harvey-grade legal | Cochrane / BYERS legal layer and Asset Machine due diligence | Harvey is a capability reference, NOT owned licensed API; legal outputs require current sources and lawyer review where necessary |
| Granola-grade meeting intelligence | SSS Brain memory, SWADE Voice, meeting note intake | Granola MCP/account NOT VERIFIED; consent, recording privacy and participant permissions required |
| 'Notation' | Potential Notion knowledge workspace OR music notation sheets | Ambiguous intent; keep Notion and score/music notation distinct in the catalog rather than guessing |
| Hostinger / SWOSTing | Existing Hostinger/Coolify/SSS Brain/Backblaze/Deploy Lock | Verified hosting available; deployment and spending remain owner-protected |
| GROKBOT / SWADE BOTS | Existing Grok Bot remote device, SSS Brain/Rakazo agents and approved computer-worker proposal flow | Device can be online without delegated execution authorization; no autonomous cross-site access implied |
| Investment / RWA | Asset Machine and Cochrane/Token CSI protected pipelines | Read-only due diligence and explanations first; never automatically trade, tokenize, transfer or authorize custody |

## Single execution contract (no new platform)
1. Intake: `userId`, `tenantId`, `projectId` verified by the existing SWADEBASE auth/session, plus a text/voice/asset request and explicitly selected scopes.
2. Intent classifier: user-selected area or structured task metadata wins; otherwise lightweight keyword classification, with a clarification when domains are ambiguous. Output one or more canonical capabilities. This stage does not take action.
3. Model choice: invoke the existing `swadesoul.ai_model_registry` upgraded 2026-11-19 with task/health/gpu/memory/speed/cost-aware `selectModel`; Auto or Manual. Only installed enabled healthy models qualify. The four new candidate models remain disabled until actual Hyperstack benchmark and proper runtime mapping. An LLM cannot automatically pay for itself or trigger new provider credits.
4. Tool/team composition: a specialist may suggest `Crown` lead, `Majesty` assistant, industry agents, native media/legal/marketing workers, and existing verified external adapters. A user can override suggested agents subject to paid plan and permissions. Every tool needs a versioned capability description, granted user scopes, tenant filtering, health test, cost estimate, and dry-run/approval mode.
5. Cost and capacity reservation: quote in customer credits and actual estimated provider dollars; use a PostgreSQL atomic job record and idempotent reservation only after customer approval; 50% infrastructure reserve is bookkeeping, not spendable provider money; founder in-app exemption is independent of provider billing. RunPod first for qualified workloads; Hyperstack only where measured VRAM/latency/volume needs justify it. Never start, resume, charge or publish without correct protected approval.
6. Project workspace: `projects/{tenantId}/{projectId}/` in Backblaze B2, with per-project voice references, characters, model seeds, scenes, edit timelines, invoices, approved originals/exports, rights and provenance. Model weights/cache may stay on Hyperstack persistent root/SSV but private customer content belongs to per-tenant, B2-backed durable storage.
7. Operations: explicit jobs `planned -> awaiting_approval -> queued -> executing -> verifying -> delivered` with `blocked/failed/cancelled` alternatives. Real statuses, timeouts, retries, concurrency limits, live cost, signatures and user-attributed audit logs.
8. UI: one conversation surface plus expandable 'Why this model?', 'Assigned agents', 'Connected services', 'Cost', and 'Progress' controls. Manual model list visibly distinguishes READY, NOT INSTALLED, PERMISSION REQUIRED and PAID. For voice, show listening, speaking, muted, paused, and remaining allowance; never call transcription speech-to-speech.
9. Release proof: two-user session isolation, simultaneous credit reservation, no cross-tenant B2 access, no secret leaks, same task on different agents with correct role prompts, generated file readback from B2 and actual model/adapter health checks. Test at documented expected concurrency then stress; record p95 turn latency, audio quality and real provider dollars before enabling live public use.

## Files, actual staged test results and limitations
- `capabilities.mjs`: known service/provider capabilities and clear documented non-live status; 21 capability types and 24 provider references.
- `planner.mjs`: bounded, read-only `buildPlan` and `detectCapabilities`; requiring user/tenant/project ids, no external calls; impossible to mistake a plan for an executed job by design.
- `planner.test.mjs`: 10/10 passed, including 100 independent per-tenant simultaneous requests and denial of unavailable model or unverified service execution. This **does not** prove real agent/GPU capacity.
- `/opt/swadebase/ops/llm-routing-upgrade-20261119`: 4-model staged Auto/Manual selector, 8/8 tests, existing registered model table and disabled candidate entries. These 2 contracts should be merged into the **existing** production inference route once per-provider auth, GPU and live model tests pass; do not make a duplicate routing server.
- No production site updated, GPU resumed, model downloaded, user charged, media generated, legal action executed or provider OAuth changed by this step.
- Concurrent SWAGENTS royal artwork release is separately locked at `/opt/swadebase/docs/DEPLOY_LOCK.md`; avoid editing its dirty files or restarting shared services until coordinated.
