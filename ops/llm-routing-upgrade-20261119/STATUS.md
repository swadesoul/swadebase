# SWADEBASE LLM registry refresh — 2026-11-19

## Confirmed current sources
Existing shared `swadesoul.ai_model_registry` (20 entries before; 33 after update), plus separate `abagale.ai_model_registry`, `swideo.model_router_rules`, app-level voice/chat routing. Existing Hostinger Ollama /api/tags exposed ONLY `qwen3:4b` and `llama3.2:3b`. Do not confuse registered names with healthy installed models; the very large `:cloud` or 235B entries are not local GPU workloads.

## Implemented database changes (non-financial)
- Prior data backup: `legacy-registry-backup.sql` in this folder (private, do not expose).
- 4 new open-weight models registered as DISABLED candidates, in role-specific entries: `qwen3.5:9b` for chat/growth/reasoning; `gemma4:12b` for multimodal chat/vision/visual_analysis; `granite4.2:8b-q4_K_M` for code/reasoning; `ministral-3:8b` for fast/social.
- Existing installed `qwen3:4b` enabled for chat/fast/social (does not claim it has native tools or vision).
- Retired precisely THREE old cloud-first defaults by setting `is_enabled=false`: `gpt-oss:120b-cloud` chat; `gpt-oss:20b-cloud` fast and social_post. No rows deleted. Reasoning, growth strategy, code, vision, embeddings remain working as-is until a new compatible local provider passes a real task-level benchmark. OpenAI paid fallbacks remain configured but must require approved permission, not be automatically spent by new router.
- Current candidate model IDs checked against published Ollama catalogs on 2026-11-19. No new models pulled; Hyperstack `haru-voice-01` remained hibernated, actual hardware and storage size unverified.

## Router preview
`auto-router.mjs` exports `MODEL_CATALOG`, `classifyTask(text,metadata)`, and `selectModel({task,manual,models,available,allowPaid})`. Explicit task metadata overrides keyword heuristics; only enabled AND installed/healthy and task-capable models can be Auto-selected. Manual uninstalled/unavailable candidates fail clearly; no paid external fallback without authorization. Local text fallback allowed only for text-only tasks, not vision or tool-required code. Eight passing tests, including independent concurrent requests. **Not wired into production**; existing app-level routing remains unchanged except whichever consumers read `swadesoul.ai_model_registry`.

## Cautions / acceptance required
- Model binary downloads, benchmarking and swaps on Hyperstack require real VM `nvidia-smi`/persistent disk verification and explicit cost controls; no auto GPU start, no new paid credits.
- Performance benchmark: 30 business/user tasks covering voice, code, business, video/music director briefs, structured tool use, safety/approvals; two concurrent distinct-user sessions and measured p95/VRAM/TTFT. Conduct on owner's verified VM only.
- Determine actual SWADEBASE inference route (registry may not yet be used directly in the active request path); connect preview in current existing router, avoid duplicate router service. Maintain Auto/Manual selector and health-aware status per user, never expose uninstalled models as live.
- Rollback registry: prefer scoped flags for three retired rows or restore previous data from `legacy-registry-backup.sql` only with independent database review (do not blindly replay INSERT statements against new records).
- No Hugging Face/OpenAI/GPU/Stripe paid provider calls or service restarts initiated by this change. The new model selections are NOT running in production as of this receipt.
