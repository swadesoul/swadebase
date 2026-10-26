# SWADEBASE Motion Studio — PRD and System Bible

Owner: Swade Soul Enterprise LLC · Status: built on branch `feat/motion-studio`, not yet deployed · Date: 2026-10-26

## 1. Purpose
Founder-controlled motion-graphics factory inside SWADEBASE. Start from **an idea**, **an audio file**, or **a start image**; pick one of **86 styles** (or let **Kinetta**, the motion graphics agent, pick); get a rendered **MP4 plus the editable HyperFrames source ZIP**, always downloadable. Any ecosystem app or agent can call it through the API or MCP.

## 2. Users and roles
| Role | Can |
|---|---|
| Founder / super admin (`MOTION_ADMIN_EMAILS`, or `app_metadata.role` = founder/super_admin) | Everything, plus generating the 86 style samples and seeing any project |
| Signed-in user (OnePass Google sign-in on SWADEBASE) | Create, render and download their own projects |
| Agent programs (SSS Brain Agent OS, the Grok-style agent adapter area, Sovereign Board, Claude/ChatGPT) | MCP tools, acting as the signed-in user whose token they carry |

## 3. Architecture
```
Motion Studio page  (swadebase.cloud/functions/v1/motion-studio/app)
  │  Google sign-in (SWADEBASE auth) · audio analyzed in the browser (tempo, beats, energy, sections)
  ▼
motion-studio edge function  (docker/volumes/functions/motion-studio)
  │  styles · Kinetta agent · uploads (pre-signed PUT to B2) · projects · render queue · MCP
  ▼
Postgres: motion_styles · motion_projects · motion_render_jobs · motion_agent_messages
  ▼
motion-worker container on the Hostinger VPS  (motion/worker, CPU only)
  │  claim job → compose HTML (LLM or zero-cost template) → hyperframes lint + 2 repair rounds
  │  → hyperframes render → poster → source ZIP
  ▼
Backblaze B2: swadesoul/motion-studio/{user}/uploads|projects/... and /library/samples/{style}/...
```
No GPU is required: HyperFrames renders with headless Chrome + FFmpeg.

## 4. The library (86 styles, 14 categories)
- Source of truth: `motion/styles/styles.src.mjs`. Run `node motion/styles/build.mjs` after edits; it validates counts and regenerates `library.json`, the SQL seed and the edge-function copies.
- Category taxonomy mirrors Futurepedia's AI Style Atlas so the two can be compared. The 15 publicly visible Atlas entries were used as visual references (`atlas` field); every spec is original writing. No Atlas prompt text or clips are copied.
- Each style: look, palette (5 hex), typography, motion grammar, transitions, audio behavior, best-for keywords, ecosystem fit.
- **Style samples:** our own 8-second render per style, all telling the same four-beat story so they can be compared. Founder presses *Generate samples* (or `POST /styles/samples {all:true}`); the worker renders draft quality and stores them in B2. Cards play the sample on hover (desktop) or when scrolled into view (iPhone). Until then, cards show an animated color preview.

## 5. Creation modes
| Mode | Input | Behavior |
|---|---|---|
| Idea | Title + description (+ optional script) | 3–6 scenes, hook in first 2s, end card |
| Audio | MP3/WAV/M4A/AAC upload | Video length matches the track; scene changes on sections, accents on beats, intensity follows energy. Analysis runs in the browser (no server cost). |
| Start image | PNG/JPG/WebP upload + what's in it | Frame one is the image full-bleed, then it comes alive in the chosen style. Shape auto-matches the image orientation. |

Shapes: 16:9, 9:16, 1:1, 4:5. Length 3–600s. Quality: draft, standard, high. FPS 24/30/60.

## 6. Kinetta (motion graphics agent)
- Scope: Motion Studio only. Suggests 3 styles with reasons and recommends one; "you pick" → she picks; naming a style locks it; understands "vertical", "30 seconds", "draft", "final".
- Brain: built-in rule picker (free, instant, always on) + optional LLM (`MOTION_AGENT_PROVIDER` anthropic/openai/ollama). LLM output is validated against the library; invalid ids fall back to the rule picker.
- Portable package: `motion/agent/motion-agent.mjs` + `agent.manifest.json` (persona, guardrails, tool schemas). See `motion/agent/README.md`.

## 7. API (all under `/functions/v1/motion-studio`)
`GET /app` · `GET /health` · `GET /styles` · `GET /styles/:id` · `POST /styles/samples` (founder) · `POST /recommend` · `POST /agent` · `POST /uploads` · `GET|POST /projects` · `GET|PATCH /projects/:id` · `POST /projects/:id/render` · `GET /projects/:id/download?type=video|source|poster` · `POST /mcp`

MCP tools: `motion_list_styles`, `motion_recommend_styles`, `motion_create_project`, `motion_get_project`, `motion_list_projects`.

## 8. Downloads (always)
Every ready project has `downloads.video` (MP4) and `downloads.source` (ZIP: `index.html`, `assets/`, `style.json`, `README.txt` with re-render commands), as 1-hour signed Backblaze links with attachment filenames. Re-sign anytime via `GET /projects/:id` or `/download`.

## 9. Cost model
| Item | Cost |
|---|---|
| Rendering | VPS CPU you already pay for. No GPU. |
| Audio analysis | Browser, $0 |
| Kinetta chat | $0 with built-in picker; ~fractions of a cent per message with a small model |
| Composition (LLM writes HTML) | One call + up to 2 repair calls per project; set `MOTION_COMPOSER_PROVIDER=template` for $0 (simpler motion) or `ollama` to use the Hostinger GPU/Ollama when it's up |
| 86 style samples | One-time batch of 86 short compositions |
| Storage | Backblaze B2 |

## 10. Security
- Secrets only in Hostinger env (see `docker/.env.hostinger.example`). Browser gets the public anon key only.
- RLS: owners read their own projects/jobs/messages; render outputs and job claiming are service-role only (`claim_motion_render_job` is not executable by users).
- Uploads: pre-signed PUT (15 min), type and size checked, keys namespaced by user id; project creation rejects keys outside the caller's prefix.
- Only `GET /motion-studio`, `/app`, `/health` bypass `VERIFY_JWT` (`PUBLIC_FUNCTION_GET_PATHS`); they return no data.

## 11. Deploy checklist (founder approval required — touches production)
1. Merge the PR → Hostinger redeploys `swadebase`.
2. Apply migrations on the live DB in order: `20261026220000_motion_studio.sql`, then `20261026220100_motion_styles_seed.sql`. Verify `select count(*) from motion_styles` = 86.
3. Set env vars in Hostinger (B2 values exist already for other apps; add MOTION_* and composer key). Add `https://swadebase.cloud/functions/v1/motion-studio/**` to `ADDITIONAL_REDIRECT_URLS`.
4. Configure the B2 bucket CORS to allow `PUT` and `GET` from `https://swadebase.cloud` (browser uploads).
5. Restart functions: `docker compose up -d functions`.
6. Start the worker: `docker compose -f docker-compose.yml -f docker-compose.motion.yml up -d --build motion-worker`. Check logs for `hyperframes doctor`.
7. Verify: `GET /health` (styles_in_db 86, b2 true) → sign in on `/app` → idea project at draft quality → audio project → start-image project → each downloads MP4 + ZIP on desktop and iPhone → founder generates samples.
8. Pin `hyperframes` in `motion/worker/package.json` to the version that passes step 7.

## 12. Known gaps / next
- Not yet verified against a live HyperFrames install (sandbox had no npm access). The fallback template was tested in Chromium for all 86 styles; the full LLM → lint → render loop needs the step-7 run.
- Word-level lyric timing (`captions`) is supported by the composer; wiring VideoSayWhat/AssemblyAI transcription into the audio flow is the next step for the Lyric Caption Karaoke style.
- Hook-up to the "Grok-style" agent adapter area: package is ready; target repo still to be confirmed.
- Expose in SSS Brain: add Motion Studio to SSS Brain's connections via the MCP URL so "Kinetta, make…" works by voice.

## 13. Recovery
Projects and samples are rows + B2 objects; the worker is stateless. Failed jobs retry once automatically; heartbeat-lost jobs are requeued after 10 minutes. Re-render any project from its card or `POST /projects/:id/render`.
