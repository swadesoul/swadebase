# SwadeSlice (SWADE Video Editor) — Master Site Bible (staging)

**Version 0.1 — 2026-11-23 (America/Chicago). Author: Claude (claude-openreel-editor-staging), on founder instruction "OpenReel it is, customize it for our system."**

## 1. What it is
The editing stage of SWADE video creation: a CapCut-class browser editor where router-generated clips are assembled, captioned, mixed and exported. Generation stays in the **Swade Video Router** (`swade-video` edge function); this editor is the assembly step.

- **URL (owner-only staging):** https://swadebase.cloud/editor/
- **Access:** SWADEBASE super admins only (`swb_admin` session, verified by `GET /internal/admin-session` on the adapter service via nginx `auth_request`). Signed-out visitors are redirected to `/adapters/login?next=/editor/`.
- **Status:** STAGING. Not a customer product. Not yet end-to-end verified by the founder in a browser (see §7).

## 2. Upstream and brand mapping (Standing Rule 23)
| Item | Value |
|---|---|
| Upstream | OpenReel Video — https://github.com/Augani/openreel-video |
| Upstream commit | `b358fab` (2026-11-23, "Sync 1.1.0") |
| License | MIT, Copyright (c) 2024-2026 Augustus Otu and Contributors — LICENSE file kept unchanged in the source tree |
| SWADE product brand | **SwadeSlice** — approved by Swade 2026-11-23 14:00 CT. Applied to: page title, PWA manifest name/short_name, welcome-screen wordmark, About dialog (with OpenReel MIT credit), Help menu ("About SwadeSlice", "Learn SwadeSlice…"). Other upstream help texts that mention OpenReel are unchanged. |
| Identifiers | Upstream package names (`@openreel/*`), store names and code identifiers are NOT renamed. |

Source: `/opt/swadebase-staging/editor/openreel` (git clone; SWADE changes are uncommitted local modifications marked `SWADE customization`). Built files: `/var/www/editor/`.

## 3. SWADE customizations (all marked "SWADE customization" in code)
1. `apps/web/src/services/swade/router-client.ts` — Video Router client (menu, list, submit, job status, cancel, Backblaze upload links), same-origin only.
2. `apps/web/src/components/editor/inspector/SwadeVideoPanel.tsx` — "Swade Video" card in the AI tab: engine picker (long_video tiers: LTX-2.5 Comfy default, Wan 3.0, Kling 3.0, Seedance 2.5, Wan 3.0 HD), prompt, length slider (default 15 s, per-engine limits from the router menu), aspect ratio, optional start image (uploaded to Backblaze `swade-media/swadebase/inputs/`), generate → auto-import into the project; Swade clip library (every finished router clip, "Add" imports it); "Save a finished edit to SWADEBASE" (uploads an exported file to `swade-media/swadebase/exports/`).
3. `apps/web/src/components/editor/AIGenTab.tsx` — adds the "Swade Video" card.
4. `apps/web/vite.config.ts` — `base` from `SWADE_BASE` (build with `SWADE_BASE=/editor/`).
5. `apps/web/src/services/service-worker.ts` — offline service worker disabled when not served from `/` (a root-scoped worker would intercept every swadebase.cloud page).
6. `packages/core/src/video/overlay-three-renderer.ts` — 3D font paths honour the base path.
7. `apps/web/index.html`, `public/manifest.json`, `components/welcome/WelcomeScreen.tsx`, `components/editor/AboutDialog.tsx`, `components/editor/EditorMenuBar.tsx` — SwadeSlice brand.

## 4. Backend pieces
- **nginx:** `/etc/nginx/snippets/swade-editor.conf`, included in `sites-enabled/swadebase.cloud`. Locations: `/editor/` (static, COOP/COEP isolation headers), `/editor-api/video` (GET/POST only, same-origin only, proxies to `swade-video`), `/editor-b2/ssworld/` (presigned-only Backblaze pass-through for GET/PUT; Backblaze still verifies each signature).
- **Secret:** `/etc/nginx/secrets/swade-editor-router.conf` (root 600) holds the SWADEBASE service credential injected toward the router. Never sent to the browser.
- **Router additions (swade-video):** `GET ?list=1` (service only: recent jobs with fresh 7-day links + prompt), `POST {action:"upload_url", purpose:"export"|"input"}` (service only: 30-minute presigned PUT under `swade-media/<app>/exports|inputs/`), menu rows now include `min_duration_s`/`default_duration_s`.
- **Billing app:** jobs are submitted as app `swadebase` (router per-app caps apply; spend logged to `brain.ai_spend`).

## 5. Not customized yet (known gaps)
- Upstream AI features that call outside services with the user's own keys remain as shipped: kie.ai image dialog, ElevenLabs text-to-speech, optional OpenAI/Anthropic AI editor. Founder preference is in-house first (SWADEBASE Voice Studio, OmniRoute/Qwen); rewiring these is pending.
- Export goes to the device first; saving to SWADEBASE is a second step (pick the exported file). Direct export-to-Backblaze is pending.
- iPad Safari export/upload (Standing Rule 6) not yet verified.

## 6. Rebuild / deploy
```
cd /opt/swadebase-staging/editor/openreel && pnpm build:wasm
cd apps/web && SWADE_BASE=/editor/ NODE_OPTIONS=--max-old-space-size=8192 pnpm build
rsync -a --delete dist/ /var/www/editor/
```
Take a deploy-lock line first (Standing Rule 20).

## 7. Verification record
- 2026-11-23: anonymous `/editor/` → 302 to login; `/editor-api/video` and `/editor-b2/` → 401 without session; `/console/` and `/adapters/login` unaffected (200).
- Router `list` and `upload_url` verified with the service credential.
- 2026-11-23 17:47 UTC: production build (tsc clean, vite 15m17s) deployed, 793 files in /var/www/editor; index.html loads /editor/assets/*; anon /editor/ still 302 to login after deploy.
- Signed-in browser test by the founder (desktop + iPad Safari, Rule 6): PENDING.

## 8. Rollback
Remove the `include /etc/nginx/snippets/swade-editor.conf;` line from `/etc/nginx/sites-enabled/swadebase.cloud` (backup: `/opt/swadebase/backups/swade-editor-20261123T172905Z/`), `nginx -t && systemctl reload nginx`. Optionally delete `/var/www/editor`. Router additions are side-by-side and harmless if unused.

## 2026-11-23 — LumaFusion-style tablet layout + Auto ratio (claude-swadeslice-luma)
- Brand build live 20:21Z (title/manifest/About = SwadeSlice).
- iPad held sideways (landscape, >=1000x640, coarse pointer) now uses three panes at once: Library top-left (36%), Viewer top-right, full-width Timeline below (44%). Hook: `hooks/useTabletLandscape.ts`; `luma` flag in `EditorInterface.tsx`.
- Bottom bar (LumaFusion style): Media | Transitions | Titles | Audio | Effects switch the library source (`useEditorWorkspaceStore.setSection`); Edit clip and AI open as slide-over panels on the viewer (tap again to close).
- Track headers widen to 232px on tablet landscape with lock / eye / mute / link inline (no "..." menu) — `Timeline.tsx`, `timeline/TrackHeader.tsx`.
- Auto ratio: `hooks/useAutoRatio.ts`. First photo/video into an empty project sets 16:9 (w/h > 1.15), 9:16 (< 0.87) or 1:1; closes the start card; toast says what it picked. Manual change any time: viewer menu > Aspect ratio. Skipped if a format was already chosen or the timeline has clips.
- iPad portrait and phones keep the upstream one-panel tabs.
- Patch script (idempotent, re-apply after upstream syncs): `/opt/swadebase-staging/editor/patches/luma_layout.py`.

## 2026-11-23 — Swade Director (claude-swadeslice-director)
- LumaFusion layout + Auto ratio live 20:46Z (DEPLOYED-LUMA).
- **Swade Director** = analyse the whole clip and recommend the edit, per shot: keep/drop + trim, lighting (exposure stops, contrast, temperature, saturation), camera move (punch in, slow push/pull, pan, tilt, slow-mo, speed up, stabilize), and the transition into the next shot (from all 46 + hard cut).
- Open it: iPad bottom bar **Director**, or AI tools card "Swade Director". Cards: Accepted/Skipped per shot; toggles Cuts/Lighting/Moves/Transitions; **Apply all**; **Undo Director** rolls everything back.
- Client: `services/swade/director.ts` (existing scene detection, 3 frames per shot for luma/sat/warmth/motion, one 384px JPEG per shot; applies via the editor's own agent tools: split_clip, add_video_effect, add_keyframe, set_clip_speed, set_clip_stabilization, trim_clip, ripple_delete_clip, close_gap, add_transition). Panel: `components/editor/inspector/SwadeDirectorPanel.tsx`; wiring patch `/opt/swadebase-staging/editor/patches/director_wire.py`.
- Server: edge fn `swade-director` (service-key only) behind nginx `/editor-api/director` (super-admin cookie gate, 12 MB body, 180 s). Max 40 shots.
- Models (cheapest that does the job): Qwen3.8-Flash ($0.15/$0.47 per M) -> Qwen3.5-Flash -> Claude Haiku 5.5 fallback. Qwen3.7-Flash rejected (misread exposure in test). Exposure is grounded in measured luma so a model slip can't brighten a bright shot. Ledger: `swadebase_ops.ai_can_spend` per provider, `ai_record_usage`, `brain.ai_spend` label `swade-director:analyze`.
- As of 2026-11-23 the cost ledger has **no Qwen balance recorded**, so Director runs on Haiku (~1¢ per 3-shot test). Record the Qwen balance in `swadebase_ops.ai_provider_balances` to switch to Qwen (~10x cheaper).
- v1 analyses picture only; transcript + music-beat inputs are supported by the function but not yet sent by the editor.

## 2026-11-23 22:34Z — Director e2e passed, logo v2 applied
- Swade approved logo v2 (gold forged sliced S). Applied: favicon.svg, icons/editor-reel.svg (top bar), icons/swadeslice-mark.svg (welcome screen), apple-touch-icon, favicon-16/32, icon-192/512, icon-maskable-512. Sources in /opt/swadebase-staging/editor/patches/logo/ (render-icons.mjs renders the PNGs). Upstream icons backed up in /opt/swadebase/backups/swadeslice-icons-upstream/.
- Top-bar text now "SwadeSlice"; track headers 268px on iPad landscape so names read in full.
- Director: if nothing is on the timeline it places the newest upload itself, then analyses. Apply runs as ONE history group (LiveEditorHost.beginTransaction/commitTransaction), so Undo Director = one undo.
- Server fn: exposure override only when the model pushes the wrong way; a deliberate "leave it" stays (number and note agree).
- E2E test (patches + apps/web/director-e2e.mjs, serve.py proxies /editor-api/director on loopback): 12 s, 4-shot test clip -> 4 shots found in 27 s -> Apply all = 3 clips (dark opener dropped, trims, exposure) -> Undo Director = original 1 clip. PASS.
- Lesson: never `pgrep -f`/`pkill -f` with a pattern that appears in the same shell command (it matches its own shell); kill by exact PID.
