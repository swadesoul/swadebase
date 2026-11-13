# PRD — Swade Studio (chat to images, motion graphics, docs/contracts, notebooks)
Version 1.0 · 2026-10-30 · Owner: Harold "Swade" Whaley Jr. (founder approval required for scope changes)
Status: APPROVED TO BUILD (founder request 2026-10-30 08:28 CT). Nothing in this PRD is deployed yet.

## 1. One-line
A ChatGPT/Claude-style chat inside **SSS Brain (sssbrain.live /home)**, backed by **SWADEBASE**. From one conversation Swade can ask questions, make images, make motion graphics, write documents and contracts, and run NotebookLM-style notebooks over his sources. **Every output is downloadable.**

## 2. Build-on-existing decision (standing rule: no duplicate systems)
| Need | Reuse (verified in Site Bibles) | New work |
|---|---|---|
| Chat UI, threads, auth | SSS Brain /home, `src/routes/api/chat.ts`, `sssbrain.threads/messages`, SWADEBASE GoTrue | Tool calls + Outputs shelf |
| LLM routing | OmniRoute on swadebase-2 (local Qwen/Llama first) | Point chat + studio at OmniRoute |
| Cost control | `swadebase_ops.ai_usage_ledger`, `ai_rate_cards`, hard stop | Reserve/settle per job |
| Notebooks | **swadesoul/sssbrain PR 26 "SSS Knowledge Studio"** (branch feature/sss-knowledge-studio, head d6d8d1b) + KL-1 retrieval | Fix 3 defects, uploads, audio |
| Motion graphics | HyperFrames 0.8.186 on SWADEBASE compute (Cochrane 72s film), Motion Studio contract, Kokoro voices | Chat to scenes to render job |
| Images | Replicate flux-schnell (~$0.003), KIE.ai, OpenAI (optional) — **never fal** | Image tool + B2 save |
| Voice | Voice Studio / Kokoro (local, free) | Podcast audio overview |
| Storage | Backblaze B2 (durable), SWADEBASE metadata | Signed download URLs |
| Existing SSS Brain "studio projects/sections" and "creative requests" | Inspect in Phase 0 and **extend, don't duplicate** | — |
Do NOT build: a separate chat app, a second notebook system, a second media store.

## 3. Users & access
- v1: founder only (super-admin via existing server-side allowlist). v2: OnePass roles, paid tiers (Brainiak/SWOSTing customers).
- iPad-first, plus iOS Safari, desktop. Downloads must work on iPad (Share to Files).

## 4. Experience
- Center: the existing SSS Brain conversation. Right: an **Outputs shelf** listing every artifact from this thread, each with preview, **Download** (format choices), Save to Brain, Regenerate, Delete.
- Shortcuts: `/image`, `/motion`, `/doc`, `/contract`, `/notebook` (natural language also routes).
- Every paid step shows an estimate first. Free/local steps run without asking.
- Long jobs (renders) show live status and survive closing the tab; the result lands on the shelf, with a push/email when done.

## 5. Capabilities and acceptance criteria
### 5.1 Ask (chat)
Existing chat, routed through OmniRoute local-first. AC: an answer streams; a provider outage fails over; spend appears in the ledger.

### 5.2 Images
- Text to image, image to image (upload a reference), variations, aspect presets 1:1, 16:9, 9:16, 4:5.
- Provider order: Replicate flux-schnell, then KIE, then OpenAI (only if requested). Ledger reservation before the call.
- Save original to B2 `studio/{user}/{thread}/images/`; download PNG/JPG/WebP.
- Character/location continuity: optional "use approved reference" from the existing roster/face locks (`SWADE_ROSTER_FACE_CHARACTER_LOCKS.md`).
- AC: prompt to image to shelf to download on iPad; ledger row with actual cost; regenerate creates a new version, never overwrites.

### 5.3 Motion graphics
- Chat to **editable scene plan** (JSON: scenes, text, timing, style, brand colors, logo, music, narration), then preview, then render.
- Engine: HyperFrames on SWADEBASE compute (CPU first; GPU only when needed, then shut down). Narration: Kokoro. Captions EN default.
- One master render; derive 16:9, 9:16 and 1:1 by reframe (cost rule: never render the same thing three times).
- Download MP4 (H.264, `-preset veryfast` unless "best quality"), GIF for short loops, PNG frames.
- AC: a 15–30s logo/text promo renders end-to-end, lands in B2, downloads on iPad; editing one scene re-renders only what's needed.

### 5.4 Documents & contracts
- Docs: chat to outline to full document, edited in place; export **DOCX and PDF** (server-side; pandoc or docx library), plus Markdown.
- Contracts: template library seeded with consulting retainer, project/SOW, NDA (mutual, one-way), revenue share, licensing (music/IP), equity/advisor letter, sponsorship, white-label/client services (ATTOBAHN-style), creator agreement (Black Tales). Variable form (parties, entity default **Swade Soul Enterprise LLC**, fees, term, state = Texas default); clause library; version history with diffs.
- Every contract carries "Draft — not legal advice; attorney review recommended" until Swade marks it final. **Never sent externally without founder approval.** Later: e-signature via self-hosted Documenso (open source).
- AC: "retainer for X at $Y/month" produces a DOCX that opens cleanly in Word/Pages on iPad, with a correct variables table and version 1 saved.

### 5.5 Notebooks (NotebookLM-style) — finish PR 26
- Fix the 3 recorded defects: (1) upload/source-list mismatch; (2) saved-output provenance must use the selection used at generation, not the current UI selection; (3) fallback citations must carry source metadata.
- Sources: existing knowledge entries + new uploads (PDF, DOCX, TXT/MD, URL, YouTube via VideoSayWhat transcript), stored in B2 with chunks in `swadebase_knowledge_chunks`.
- Modes (existing): Ask with [S#] citations, Briefing, Report, Quiz, Mind Map, Podcast script, Video brief. Add: **Audio Overview** (podcast script to two Kokoro voices to MP3), **Video brief to Motion** (hand off to 5.3), export any output to DOCX/PDF (5.4).
- Model: local (Qwen/Llama via OmniRoute) first; constrained citation validation as in KL-1.
- AC: upload 3 PDFs, ask a question, answer with clickable citations; audio overview MP3 downloads.

## 6. Architecture
SSS Brain UI (TanStack Start, Coolify app g1406wexcvceencavj1fuo0u on swadebase-2), then server functions, then a **Studio Job API** (SWADEBASE adapter, Adapter Contract v1 async job envelope), then workers (image provider call / HyperFrames render / doc export / audio), then B2, then shelf.
- New tables (schema `sssbrain`, additive only): `studio_jobs` (id, user_id, thread_id, kind[image|motion|doc|contract|notebook|audio], status, input jsonb, output jsonb, provider, cost_estimate, cost_actual, ledger_id, b2_keys[], error, created_at, updated_at), `studio_assets` (id, job_id, kind, mime, b2_key, bytes, width, height, duration, version, parent_asset_id), `doc_templates`, `doc_versions`. Reuse existing studio/creative tables where they fit (Phase 0 decides).
- Downloads: short-lived signed B2 URLs from the server; never public buckets; never client-side keys.
- MCP: expose `studio_make_image`, `studio_make_motion`, `studio_make_doc`, `studio_notebook_ask` on the SWADEBASE MCP (scoped, approval-gated for paid steps), so Claude/ChatGPT can drive it too.

## 7. Cost
| Item | Default engine | Typical cost |
|---|---|---|
| Chat, docs, contracts, notebooks | Local Qwen/Llama via OmniRoute | $0 (cheap paid fallback logged) |
| Image | flux-schnell (Replicate) | ~$0.003 each (verify rate card) |
| Motion graphics | HyperFrames on own CPU | $0 marginal |
| Narration/podcast | Kokoro local | $0 |
| Storage | B2 | ~$6/TB-month |
Hard stop: the job is refused when the ledger reservation fails.

## 8. Security & founder control
Founder-only v1; server-verified JWT on every call; secrets server-side only; no paid call without a ledger reservation; contracts and anything external are approval-gated; audit log of every job; uploads are scanned by type/size limits; private B2 per user.

## 9. Phases (each ends deployed and verified, not just built)
- **P0 Inspect (½ day):** existing studio/creative tables, chat tool-calling, OmniRoute readiness, HyperFrames runner location, B2 bucket/paths. Output: a decision note added to this PRD.
- **P1 Notebook + Doc export:** fix PR 26 defects, merge, add uploads, DOCX/PDF export, Outputs shelf v1.
- **P2 Images:** tool + ledger + B2 + downloads.
- **P3 Contracts:** templates, variables, versions, approval gate.
- **P4 Motion graphics:** scene plan editor, render jobs, reframes.
- **P5 Audio overview + MCP tools + push notifications.**

## 10. Definition of done (every phase)
Code merged; Coolify deploy succeeded; service healthy; signed-in founder flow tested on iPad Safari and desktop; DB rows correct; B2 object exists and downloads; ledger rows correct; admin path works; rollback recorded; Site Bibles (SSS Brain + SWADEBASE) updated; handoff written.

## 11. Out of scope (v1)
Public customer signups, billing, e-signature, team collaboration, long-form AI video (stays in the Swade Video Router / Black Tales pipeline).

## 12. Phase 0 findings (2026-10-30 13:50Z, read-only, swadesoul/sssbrain main)
- **Tables already exist in schema `sssbrain`, so reuse them; no new tables:** `studio_projects` (id,user_id,type,title,status,spec), `studio_jobs` (id,user_id,project_id,kind,provider,status,input,result_asset_id,error), `studio_assets` (id,user_id,project_id,kind,title,storage_path,external_url,mime,size_bytes,metadata), `studio_documents` (project sections). Additive columns only: `studio_jobs.thread_id, cost_estimate, cost_actual, ledger_id`; `studio_assets.b2_key, version, parent_asset_id`. Template/version needs fit in `studio_projects.spec` and `studio_documents` (type='contract').
- **Chat already uses the AI SDK v7 with many tools** (`src/routes/api/chat.ts`): imageTool, createStudioProject/saveStudioSection/listStudioProjects, video and audivid tools. The Studio adds tools here; it doesn't build a new chat.
- **Image tool problem:** `src/lib/image.server.ts` calls the **Lovable AI gateway** (`ai.gateway.lovable.dev`, gemini-2.5-flash-image, LOVABLE_API_KEY), stores to SWADEBASE storage bucket `brain-images`, and writes **no ledger row**. P2 replaces this with Replicate flux-schnell / KIE + ledger + B2, keeping the same tool name and return shape so the UI is unchanged.
- **Export exists:** `src/routes/api/studio/export.ts` produces DOCX (docx lib) and PDF (pdf-lib), but is shaped for KDP book manuscripts. P1 generalizes it to document/contract styles (no new library).
- **Pages exist:** creations, downloads, outputs, client-docs, so the Outputs shelf reuses `outputs`/`downloads` rather than creating a new page.
- **PR 26** = `src/lib/knowledge-studio.functions.ts` (164 lines) + `src/routes/_authenticated/knowledge-studio.tsx` (307 lines); default model `qwen2.5:7b`. Small and mergeable after the three fixes.
- Deploy target swadebase-2 was under another agent's lock (13:02Z OmniRoute/Oathloom); code work proceeds on a branch, and deploy waits for the lock to clear.

## 13. P1 progress (2026-10-30 15:15Z)
- **Knowledge Studio defects fixed** on branch `fix/knowledge-studio` (fresh from main 4261910, since PR #26 was 866 commits behind). **PR #102**: https://github.com/swadesoul/sssbrain/pull/102 (supersedes #26).
  (1) uploaded files (brain_wiki_pages) now selectable alongside knowledge_entries; (2) save uses the run snapshot + server re-verifies ownership; (3) fallback cites all included sources with matching [S#] + metadata.
- Verified in the production Bun image: frozen-lockfile install OK, `bun run build` OK, `tsc --noEmit` 0 errors, 4 new vitest tests pass (run under Node; Bun's vitest can't load zod here).
- NOT yet deployed: merging to main auto-deploys sssbrain through the Coolify GitHub webhook and builds on swadebase-2, which RK-004 says is memory-tight (build timeouts). Merge when a build can be watched; then verify signed-in on iPad: upload PDF -> ask -> citations -> save.
- Still to do in P1: DOCX/PDF export of Studio outputs (reuse src/routes/api/studio/export.ts), Outputs shelf v1.
- 15:20Z: the Codex review raised 3 findings on #102, all fixed in 32ab772. File sources now use brain_sources.raw_text (full text, not the wiki summary), Knowledge Studio is added to SWARVIS_CAPABILITIES with voice aliases, and saves publish the brain-content-changed event. tsc 0 errors; vitest src/lib 50 files / 287 passed. Still not merged or deployed.
