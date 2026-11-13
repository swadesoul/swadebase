# SWADE Soul World Master Site Bible (SWADEBASE copy)

Canonical full Bible: swadesoul/swadesoulworld docs/SWADE_SOUL_WORLD_MASTER_SITE_BIBLE.md. This file records dated entries made under STANDING_RULES rule 17.

## 2026-11-01 — Character Factory Phase 1: Granada v2 (Claude, America/Chicago morning)

State: BUILT AND BROWSER-TESTED ON THE SERVER; NOT DEPLOYED. Awaiting Harold's likeness approval. Live site unchanged (CHARACTER_MODE flag not yet added; world still renders primitive figures).

Where: factory at `/opt/swade-character-factory` on the swadesoul VPS (Blender 4.5.15 LTS headless, MPFB 2, blender-mcp addon, MediaPipe face landmarker, Quaternius Universal Animation Library 1+2 Standard, CC0). Entry point `make_character.sh <slug> [outdir]` reads `recipes/<slug>.json`.

Fixed this session (v1 → v2):
- Patchwork face. Cause: the Cycles emission bake also baked MPFB hidden helper geometry (5,778 vertices: joint cubes, tights, eye/hair helpers) that shares the body UV space. Replaced with `face_dump.py` + `face_raster.py` + `face_apply.py`: texture-space rasterization, helpers excluded, depth-tested, head UV island only.
- Face landing too low. Cause: projection read the base mesh instead of the phenotype-shaped mesh the face camera matched. `face_dump.py` now evaluates shape keys with modifiers off (topology preserved).
- Skin tone: whole body colour-matched (Lab) to the locked photo's face skin.
- Look matched to the locked sheet: hair `elvs_50s_updo`, gown `punkduck_medieval_dress` tinted sage with new `fabric` tint mode (no white panel). Previous recipe kept as `recipes/granada.v1.json`.
- See-through materials in browsers: export marked every material BLEND. `scripts/fix_alpha.py` sets skin/clothes OPAQUE, hair/lashes/eyes MASK. Now part of `make_character.sh`.
- Web builds: `<slug>-web.glb` (meshopt, game) and `<slug>-viewer.glb` (quantized) via gltf-transform.

Outputs: `out/granada-v3/`. 11 clips (Idle, Talking, Walk, Formal walk, Jog, Sit down, Seated, Seated talk, Stand up, Dance, Interact); 39,457 triangles; 1.64 m. Repo branch `character-factory/granada-v2` adds `public/characters/granada-swade/v2/`. v1 files untouched.

Test: headless Chromium (Playwright, SwiftShader WebGL) loads the viewer GLB with three.js r147, all 11 clips bind, phone width 400 px has no horizontal overflow.

Not done / next: mouth shape keys for talking (export currently `export_morph=False`); LOD mesh; B2 upload + SWADEBASE version row (after approval, per PRD step 8); world runtime swap behind `CHARACTER_MODE`. Harold supplied Tripo AI GLBs for Granada, Mason, Suki, Nevaborya (hologram) and KarriAnne: static, unrigged, lighting baked, faces need cleanup, KarriAnne ~1M vertices. Not yet on any server; plan is to clean, decimate and rig them onto the shared skeleton.

Rollback: nothing deployed. Delete branch `character-factory/granada-v2`; v1 assets remain at `public/characters/granada-swade/v1/`. Git remote of `/opt/swade-character-factory/gitpush` switched to `git@github-all:swadesoul/swadesoulworld.git` with Harold's approval (2026-11-01 06:16 CT).

## 2026-11-01 — Mason MakeHuman draft (ChatGPT, source-only)

State: SOURCE BUILT AND STRUCTURE VALIDATED; NOT VISUALLY APPROVED OR DEPLOYED. Existing live character and main branch unchanged.

Factory: `/opt/swade-character-factory`; recipe `recipes/mason.json`; outputs `out/mason-v3/`. Fixed a pending shirt recipe with installed `elvs_male_shirt_tie_tucked1.mhclo`; selected Oxford dress shoes. The initial size reported during MPFB object import was misleading: saved model dimensions were checked in Blender; final shoes span about 0.52m together. No shared pipeline scaling code was changed.

Pipeline completed with exit 0. MakeHuman body + locked sheet facial projection, hair, shirt/tie, trousers and shoes; GLB 2.16 MB web and 2.91 MB viewer. Valid glTF 2.0; 62 nodes, 8 skins, 11 clips with named Idle/Walk/Formal Walk/Jog/Talk/Sit/Dance/Interact. Source branch `character-factory/roster`, assets `public/characters/mason-swade/v1/`.

Still required: human likeness approval against locked sheet; staged browser renders, walk/sit foot contact and shoe/skin/clothing quality checks; signed-in iPad checks; owner-approved CHARACTERMODE world integration. No new services, payments, auth or live changes. Rollback: remove Mason v1 files from development branch only; prior assets and main unaffected.

## 2026-11-01 — Mason v2 reference-corrective draft (ChatGPT, source-only)

State: BUILT / RENDERED / GLB STRUCTURE VERIFIED; VISUAL PHOTOREALISM REVIEW FAILED; NOT DEPLOYED. Compared v1 render with `/opt/swade-character-factory/refs/mason/sheet.webp`. V1 blond hair, gray shirt with necktie and formal shoes contradicted locked visual reference. V2 uses brown curly hair, loose light shirt, dark trousers and brown boots. Generated front render confirms face visibility and broadly closer styling, but detailed jeans/boots/textile fidelity, precise likeness and in-browser motion still unapproved.

Factory: `/opt/swade-character-factory/recipes/mason-v2-review.json`; build `out/mason-v4` completed successfully. 11 animation clips, 8 skins; GLBs 3.59 MB (web), 4.33 MB (viewer). Repo source-only branch `character-factory/roster`, `public/characters/mason-swade/v2/` has recipe, models and front review image. No paid service, no B2 publication, no live change. Preserve v1 for comparison.

Next: enhance physically based garments/face mesh, check hair intersection and skin/eye realism, render 3/4 and side animation poses, perform iPad/browser visual QA and owner likeness approval before production integration. Rollback: remove only v2 review files and revert the source-only commit; v1 and production intact.

## 2026-11-01 — Character Factory GLB rollout (ChatGPT; DEPLOYED, PARTIAL)

Deployment UTC: 2026-11-01T13:39:07.569794+00:00. Production: `https://swadesoul.world`, nginx to `ssworld-web.service` port 18840. Source `swadesoul/swadesoulworld` main commit `c0f9f8e` (fast-forward merged `character-factory/roster`), Node SSR release `/opt/ssworld-web/releases/20261101T133802Z-characters-c0f9f8e`. Previous release `/opt/ssworld-web/releases/20261030T122227Z` retained.

Implementation: `src/world/RosterGLB.tsx` provides skeleton-aware Three.js GLB cloning, 11-animation-compatible idle/walk/talking selection, bounded lobby motion, and isolated asset-load fallback. `RosterCharacters.tsx` replaces the existing primitive renderer for Granada v2, Suki v1 and Mason v2 only; eight other roster members still render procedural fallback while their models are unfinished. No auth/schema/payment/audio/worker changes. Existing click-to-chat and all roster identity locks preserved. All GLBs on public path are static local artifacts; no external generation/spend.

Tests: `npm run test`: 22/22; `NITRO_PRESET=node-server npm run build`: success; local staging `127.0.0.1:18841` homepage/world and three GLBs returned 200; public URL after deploy homepage/world and three GLBs returned 200 with exact byte counts 2,316,052 Granada, 2,898,528 Suki and 4,329,384 Mason; service active. Mason standalone WebGL viewer loaded model with 11 clips and 1.83m reported height. Browser desktop/mobile unauthenticated world showed an existing 'Your world profile could not be loaded' message on staging; full signed-in world navigation, interaction and Safari are **not end-to-end verified**. Model visual realism does not meet final locked-sheet approval.

Deployment process: first rsync failed before switching due deleted remote CWD. First attempted restart was immediately probed and automatically rolled back for startup race, without app crash. Second attempt waited for HTTP readiness and passed; current release is healthy.

Rollback (requires deploy lock): `ln -s /opt/ssworld-web/releases/20261030T122227Z /opt/ssworld-web/.rollback && mv -Tf /opt/ssworld-web/.rollback /opt/ssworld-web/current && systemctl restart ssworld-web`; wait up to 25 seconds for localhost HTTP 200. To revert source, follow normal authorized PR/revert procedure on main; no force-push.

Still required: improve photorealistic likeness and garments, build 8 missing roster artists, test authenticated real-world motion/conversation and iPad Safari, address anonymous spectator/profile issue independently, release gate/monitor before claiming complete 3D world.

## 2026-11-01 evening — World broken for everyone: hotfix (Claude)

Reported by Harold 17:11 CT: site broken when visiting as super admin.

Root causes found:
1. **Missing 3D assets.** 20 files referenced by `src/assets/*.asset.json` (Swade Soul tower, neon jukebox, default player avatar, Attobahn data tower, neighbour buildings and their textures, tower hero image) were served only from Lovable's CDN path `/__l5e/assets-v1/...`. Since the 2026-10-30 move to SWADEBASE they returned 404 on swadesoul.world. The world scene crashes on the first missing file ("Something didn't load right"), so signed-in members, including the super admin, could not enter.
2. **Guests blocked.** `src/world/profileStore.ts` and the auth check in `src/routes/world.tsx` treated Supabase's `AuthSessionMissingError` (no one signed in) as a failure, showing "Your world profile could not be loaded" / "Your session could not be checked" to every guest instead of entering them as locked spectators.

Not the cause (verified): ssworld-web service healthy; super admin Google login succeeds (PKCE, 23:05 UTC); profile + active character rows exist and are readable under RLS as that user; REST serves `ssworld` schema; CORS allows swadesoul.world.

Fix:
- Restored all 20 assets byte-identical from the Lovable-published project (`swadesoulworld.lovable.app`), 33 MB, to `/opt/ssworld-web/l5e-restore/__l5e/`; nginx `location /__l5e/` alias added to `/etc/nginx/sites-available/swadesoul.world` (backup `/opt/ssworld-web/nginx-swadesoul.world.bak-*`). Live 23:15 UTC.
- Same files committed to `public/__l5e/` so builds serve them without nginx.
- Guest fix in profileStore + world route (`getSession()` first; missing session = guest).
- Branch `hotfix/world-guest-and-assets`, commit be5b1d2 (on top of main d915f54). Tests 22/22, node-server build OK.

Rollback: switch `/opt/ssworld-web/current` back to `/opt/ssworld-web/releases/20261101T133802Z-characters-c0f9f8e` and restart ssworld-web; nginx: restore `/opt/ssworld-web/nginx-swadesoul.world.bak-*`. Deployed release `20261101T231725Z-profilefix`.

Still to verify by Harold: signed-in super admin entry on desktop and iPad Safari (cannot be automated without his login).

## 2026-11-01 night — Hotfix merged to main and redeployed from main (Claude)

Approved by Harold 18:13 CT ("Merge and deploy"). Fast-forwarded `swadesoul/swadesoulworld` main d915f54 -> 91c654f (be5b1d2 guest/asset fix + 91c654f docs); no force push. Built from main (tests 22/22, node-server build OK), deployed release `/opt/ssworld-web/releases/20261102T001436Z-main-91c654f`, replacing `20261101T231725Z-profilefix` (same app code). Production now matches GitHub main.
Rollback: point `/opt/ssworld-web/current` at `20261101T231725Z-profilefix` (or `20261101T133802Z-characters-c0f9f8e` for the pre-hotfix state) and `systemctl restart ssworld-web`; wait for localhost:18840 HTTP 200.

## 2026-11-01 evening — SWADE Fam 24/7 staff office (Claude) — DEPLOYED Nov 2 (release 20261102T003806Z-staff-office)

Harold's direction (18:23–18:25 CT): characters must work, not walk in place; cubicle desks with computer/phone/tablet dock on the ground floor; an editable work plan; 24-hour coverage with 3–4 employees on duty at all times. Choices: office off the Grand Lobby; editable schedule now, real SSS Brain jobs later; real Central time.

Cause of "walking in place": RosterGLB.tsx played Walk_Loop while sliding the model around a 0.55 m circle at its marker (placeholder from the c0f9f8e rollout).

Built (branch `feature/staff-office-24-7`, commit 1df19a6; not merged, not deployed):
- `src/world/staff/plan.ts`: shifts (Morning 7a–3p Granada/Ameyea/Reggie/KarriAnne; Evening 3p–11p Suki/Mason/Shamone/Ty; Night 11p–7a Nevaborya/Steemo/Leyco), default blocks, Central-time resolver.
- `officeLayout.ts`: 12 desks behind reception (x ±8/±11/±14, z −8.85/−12.35 seats), walk network (aisles, elevator, front desk, meeting table at (−15.2, 2.2), break spot by the jukebox).
- `CubicleOffice.tsx`, rewritten `RosterCharacters.tsx` (StaffWorker state machine), `RosterGLB.tsx` (plays a given clip).
- `/admin/staff-plan` editor with hourly coverage bar.
- Tests 28/28 (6 new: coverage 3–4 every hour, front desk always staffed, ≤1 break/away at once, reachability, no path through furniture). Build OK. Staging probe: no page errors; on-shift models load.

**Applied to SWADEBASE (additive):** table `ssworld.staff_schedule` + RLS (public read; master_super_admin/super_admin/admin write) + 59 seeded rows; PostgREST schema reloaded (SIGUSR1). Verified anon read 200, anon write 401. Migration: `supabase/migrations/20261101_staff_schedule.sql`. Rollback: `drop table ssworld.staff_schedule;` (nothing else depends on it until this release ships).

Not verified: visual seat alignment and furniture in a real GPU browser (software rendering on the server is too slow for screenshots). Sitting offset measured from the rig: hips 0.22 m behind / 0.50 m above the feet; chairs placed 0.25 m behind the seat point.

### Update 2026-11-01 23:28 CT — staff office DEPLOYED (Claude)
Approved by Harold 23:27 CT ("Yes"). main fast-forwarded 91c654f -> 1df19a6. Production release `/opt/ssworld-web/releases/20261102T003806Z-staff-office` (built from 1df19a6, tests 28/28), replacing `20261102T001436Z-main-91c654f`. Verified: /, /world, /admin/staff-plan return 200; guest world loads lobby, tower, jukebox, avatar with no page errors (only the known guest 401 on district_parcels). Night shift (Nevaborya, Steemo, Leyco) on duty at deploy time; they render as procedural figures until their models are built.
Rollback: point `/opt/ssworld-web/current` at `20261102T001436Z-main-91c654f` and `systemctl restart ssworld-web`; table `ssworld.staff_schedule` can stay (unused by that release).

## Changelog catch-up (Nov 1–5, 2026)

| Date (CT) | Change | Release |
| --- | --- | --- |
| 2026-11-05 | #9 Guard ZIP uploads against unfixed fflate `unzipSync` (CVE-2026-122146): `src/lib/safe-unzip.ts` + tests (Cursor) | `20261105T1733Z-main-9c561d4` |
| 2026-11-03 | #8 Guests stay in a living tower when catalog or assets fail (`WorldEntryFallback`, `districtLoad`), guest catalog grant migration (applied), floor/interior restyle, marketplace floor previews (Cursor) | `20261103T0629Z-main-f0361a9` |
| 2026-11-01 | SWADE Fam staff office: 12 cubicle desks off the ground-floor lobby (monitor, phone, gold tablet dock, live nameplates), meeting table, break cart. 24/7 Central-time plan with 3–4 staff always on (morning 7:00 Granada/Ameyea/Reggie/KarriAnne; evening 15:00 Suki/Mason/Shamone/Ty; night 23:00 Nevaborya/Steemo/Leyco). Editable at `/admin/staff-plan`; table `ssworld.staff_schedule` (public read, admin write, 59 seeded rows). Characters walk real paths (Dijkstra over aisle nodes), sit/stand with Sitting_Enter/Exit clips, hold still when a visitor talks to them (Claude) | `20261102T003806Z-staff-office` |

## 2026-11-06, deployed 2026-11-08 — World polish release (Claude)

From the Nov 6 review ("swadesoul.world Game Review"). Approved by Harold: "fix this completely".

- **Outside crash fixed.** `CurrentSectorPortals` selected `s.currentPortals()`, which returns a new array per read; under zustand v5 that re-rendered forever (React #185) whenever the plaza loaded. Now selects raw fields + `useMemo`. New test `tests/storeSelectors.test.ts` fails the build if any selector calls a store method that builds a fresh array/object.
- **Home page:** `isNight` read after mount (server is UTC → hydration error #418); hero is now `/media/tower-hero.webp` (199 KB, was a 2.25 MB PNG).
- **Sharing:** absolute `og:image` / `twitter:image` = `https://swadesoul.world/media/og-swadesoul-world.jpg` (1200×630) on every page; `summary_large_image`. PNG app icons (`icon-192.png`, `icon-512.png`, `apple-touch-icon.png`) — the manifest listed them but they were missing.
- **Lighter 3D:** Attobahn tower simplified to 35% + meshopt, 13.5 MB → 5.4 MB (`/models/attobahn-tower-opt.glb`); default/guest avatar (Soldier, also the stand-in for unbuilt roster artists) meshopt + WebP, 2.16 MB → 0.56 MB (`/models/avatar-default-opt.glb`); roster characters load the meshopt builds (`granada.glb` 1.7 MB, `suki.glb` 1.9 MB, `mason.glb` 3.6 MB) instead of `*-viewer.glb`. Asset JSONs keep `original_url`. Retired Granada v1 / Mason v1 web files moved to `/opt/swade-character-factory/archive/web-public/`.
- **Plaza:** FBX neighbour buildings no longer request their unshipped embedded textures (the only 404s in the access log); our PBR materials replace them anyway.
- **Office:** partitions back to smoked glass (opacity 0.38) so lobby visitors can see staff at desks.
- **Sound:** unlocks on the first tap/click/key anywhere; no AudioContext is created before a gesture.
- **Admin tools** (`EditorPanel`, `ForgePlaceOverlay`) lazy-load for admins only.
- **Type check** passes again (RosterCharacters state ref typed as `Mode`); run it with `NODE_OPTIONS=--max-old-space-size=6144` — it OOMs at Node's default heap.
- **nginx** (`/etc/nginx/sites-available/swadesoul.world`): gzip for JS/CSS/JSON/SVG/GLB/octet-stream (was HTML only); `/assets/` served from disk with 1-year immutable cache; `/models|characters|media` served from disk with 7-day cache; `^~ /__l5e/` keeps priority. Backup: `/opt/ssworld-web/nginx-swadesoul.world.bak-20261109T000414Z` (restore: copy back, `nginx -t`, `systemctl reload nginx`). Live check: world JS 1.12 MB -> 329 KB over the wire.
- Not changed on purpose: `ssworld.fam_staff` stays owner-only — its `persona` column holds AI prompts; the World gets names/roles from code.

Release: `20261108T0000Z-polish-9de5397` (deployed 2026-11-08 ~18:03 CT after staging on :18841; phone /outside: no errors, no 404s). Rollback: `ln -s /opt/ssworld-web/releases/20261105T1733Z-main-9c561d4 /opt/ssworld-web/.rb && mv -Tf /opt/ssworld-web/.rb /opt/ssworld-web/current && systemctl restart ssworld-web`.

Still open: 8 roster artists to build in the Character Factory (night shift first), talking mouths (visemes), Granada end-to-end agent (OmniRoute/Composio/Glimmer).
