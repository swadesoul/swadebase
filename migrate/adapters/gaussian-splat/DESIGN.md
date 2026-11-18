# `splat` adapter - design (photos -> walkable Gaussian splat scene)

Status: **DESIGN ONLY - pending Harold's approval.** Written 2026-10-28 (America/Chicago) under
`../../ADAPTER_RULE.md`. Nothing is built: no schema, route, key, service or GPU has been created.
Follows `/opt/swadebase/docs/SWADE_ADAPTER_CONTRACT_V1.md`.

## Purpose

A user uploads 5-6 photos of a real place (for example a restaurant interior). The adapter returns a
Gaussian splat scene that a Three.js web game can load and walk through, with clickable items and
collectibles placed in it. Any site can call it once enabled.

- Module slug (proposal): `scene.splat`. Service name: `swade-splat-adapter`. Schema: `splat`.
- Consuming sites: **Music Mogul** (themaestroradio.com/play), **the restaurant game maker**,
  **swadesoul.world**. Others later through `swade_site_modules`.

**Honest expectation:** with only 5-6 photos the result is a **guided path** (camera stays near the
photo viewpoints, limited turning), **not free roam**. Free roam needs the video fallback (below).

## Proposed stack (pending Harold's approval; final tool choice TBD until approved and test-run)

| Stage | Component | License | Notes |
| --- | --- | --- | --- |
| Pose + initial points from 5-6 photos | **VGGT-1B-Commercial** weights (Meta) + bundle adjustment | Meta VGGT commercial license: commercial use allowed, **military use not allowed**; **access application required** | Needs the application approved before use. Record the license text and weight checksum. |
| Splat training (primary) | **gsplat** (nerfstudio) | Apache-2.0 | NVIDIA CUDA GPU. |
| Splat training (alternative) | **Brush** | Apache-2.0 | Runs on any GPU (WebGPU/wgpu); option if no NVIDIA box. |
| Cleanup | **SuperSplat** editor | MIT | Crop floaters, remove people, set floor/orientation. Manual or scripted. |
| Compression | **.spz** (Niantic spz) | MIT | Plus `.sog` as an alternate. |
| Web render | **Spark** (sparkjsdev, Three.js splat renderer) | MIT | Renders .spz/.sog/.ply inside a normal Three.js scene. |
| Fallback input mode | 30-60 s phone video -> ~100 frames -> **COLMAP** or **GLOMAP** | BSD | Better coverage; enables more free roam. |

**Excluded (licensing gate):**

- DUSt3R / MASt3R - CC BY-NC-SA (non-commercial).
- Stock InstantSplat - ships MASt3R, so non-commercial as packaged.
- Inria original 3DGS (graphdeco) - non-commercial research license.
- OpenSplat - AGPL-3.0; avoid for a network service.

Licensing gate rule: only commercial-OK components ship. Each component is recorded in a `LICENSES.md`
with link, license, pinned version and verdict before build. Any new component goes through the gate.

## Schema `splat` (one schema in the shared Postgres; private by default)

Server-only: the adapter service talks to Postgres; `splat` is **not** added to `PGRST_DB_SCHEMAS`
unless browsers later need direct reads (decision for Harold). Never in `public`.

| Table | Key columns |
| --- | --- |
| `jobs` | `id uuid`, `site_id`, `owner_id` (server-derived), `input_mode` (`photos`/`video`), `status` (`queued/running/done/error/cancelled`), `stage` (`upload/pose/train/cleanup/compress/publish`), `progress` 0-1, `error jsonb`, `idempotency_key`, `callback_url`, `callback_status`, `gpu_provider`, `gpu_seconds`, `cost_cents`, `pipeline_version` (pinned versions), `consent_id`, `created_at`, `updated_at` |
| `photos` | `id`, `job_id`, `storage_key`, `sha256`, `width`, `height`, `exif_stripped bool`, `faces_blurred bool`, `pose jsonb` (from pose stage), `created_at` |
| `scenes` | `id`, `job_id`, `site_id`, `title`, `place_name`, `status` (`draft/published/withdrawn`), `files jsonb` (`spz`, `sog`, `ply_compressed`, `mobile_spz` keys + sizes + splat counts), `bounds jsonb`, `spawn jsonb`, `guided_path jsonb` (allowed camera path/viewpoints), `collision_mesh_key`, `license_snapshot jsonb`, `published_at` |
| `scene_objects` | `id`, `scene_id`, `kind` (`clickable/collectible/portal/info/collider`), `label`, `position vec3 jsonb`, `rotation`, `scale`, `mesh_ref` (glTF key or primitive), `action jsonb` (what happens on click/collect), `points int`, `visible bool`, `sort`, `updated_at` |
| `api_clients` | `site_id` (references the SWADE Connect site), `enabled`, `max_jobs_per_day`, `max_photos`, `max_upload_mb`, `allow_publish`, `allowed_origins text[]`, `note`. **No key material** - keys stay in `swadesoul.swade_api_keys` (sha256) per Contract v1. |

Row-level rules: every query is filtered by the server-derived `site_id`; a site never sees another
site's jobs, photos or scenes.

## Storage and outputs

- Working files on the VPS under `/opt/swade-splat/work/<job_id>/` (photos, frames, poses, checkpoints),
  deleted after publish + 7 days.
- Durable files in **Backblaze B2** (existing storage policy) under `splat/<site_id>/<scene_id>/`:
  originals (private, faces blurred copy used for training), `scene.spz`, `scene.sog`,
  `scene.ply` (compressed), `scene.mobile.spz` (LOD), `collision.glb`, `thumb.webp`.
- Served by short-lived presigned URLs, re-signed on every GET (Contract v1).
- **Mobile target:** about **0.5-1.5 million splats** in `.spz`/`.sog` for the mobile LOD; desktop may be larger.

## Job pipeline (worker on SWADEBASE)

`upload -> pose estimation -> training -> cleanup -> compression -> publish`, each stage written to
`jobs.stage` with `progress`; overall `status` uses only the Contract v1 words.

1. **Upload** - 5-6 JPEG/HEIC photos (or one 30-60 s video). Strip EXIF/GPS, check size/count,
   blur faces (see Privacy), store originals privately.
2. **Pose** - VGGT-1B-Commercial predicts camera poses + points; bundle adjustment refines them.
   Video mode: extract ~100 sharp frames, then COLMAP/GLOMAP.
3. **Train** - gsplat (or Brush) trains the splat, about 7k-30k iterations.
4. **Cleanup** - SuperSplat pass: crop to room bounds, remove floaters, level the floor; build an
   invisible **collision proxy mesh** (floor + walls boxes) and the guided path.
5. **Compress** - export `.spz` + `.sog` + compressed `.ply`; build the mobile LOD (0.5-1.5M splats).
6. **Publish** - upload to B2, write `scenes`, send the signed `job.done` callback.

**GPU need.** Training is not practical on this VPS CPU (hours, if it finishes). Options:
(a) a GPU box Harold owns (e.g. swadebase-2 if it has an NVIDIA GPU - unverified), or
(b) a rented on-demand GPU per job. A `runpod.env` file already exists in `/opt/swade-secrets`, so an
existing RunPod account may be reusable - **not verified, needs Harold's OK and a budget**. The
SWADEBASE worker only queues and orchestrates; the GPU worker pulls a job, runs pose/train/compress, and
returns files. Each job records GPU seconds and cost; a per-site daily cap stops runaway spend.
No paid GPU call runs without an approved budget.

## Endpoints (`https://swadebase.cloud/adapters/splat/`)

Contract v1 REST shape under `/adapters/splat/v1/`:

| Method + path | Purpose |
| --- | --- |
| `GET  /v1/status` | Contract `status` (auth required): `ready`, `blockers`, `capabilities` (formats, limits, input modes). |
| `POST /v1/jobs` | Create a job (multipart photos or a video upload, optional `callback_url`, `Idempotency-Key`). Returns 202 `{ok, job_id, status:"queued", status_path}`. |
| `GET  /v1/jobs/:id` | Job status: `status`, `stage`, `progress`, `output` (scene id + presigned URLs when done), `error`. |
| `POST /v1/jobs/:id/cancel` | Cancel a queued/running job. |
| `GET  /v1/scenes/:id` | Scene manifest: file URLs (desktop + mobile LOD), spawn, guided path, collision mesh, objects. |
| `GET  /v1/scenes/:id/objects` | List scene objects. |
| `POST /v1/scenes/:id/objects` | Add a clickable/collectible. |
| `PATCH /v1/scenes/:id/objects/:oid` | Move/edit an object. |
| `DELETE /v1/scenes/:id/objects/:oid` | Remove an object (soft delete, kept for audit). |
| `POST /v1/scenes/:id/publish` / `withdraw` | Make a scene playable / take it down. |

Routing: a dedicated `location ^~ /adapters/splat/` block before the `/adapters/` catch-all in
`/etc/nginx/sites-enabled/swadebase.cloud` (the catch-all allows only 64k bodies), proxying to a
loopback port, with a larger body limit for photo uploads (about 60m) and a longer timeout. Callbacks:
`X-Swade-Signature` per Contract v1 section 5.

## Auth (per-site, server-side)

- Site servers call with `X-SWADE-API-KEY` (SWADE Connect key, sha256 in `swadesoul.swade_api_keys`,
  scope e.g. `splat:write`, `splat:read`). Players' browsers call with a SWADEBASE user JWT for read-only
  scene loading, or the site's backend proxies the call.
- Site and owner come from the credential; caller-supplied `site_id`/`owner_id` is rejected.
- Site must be enabled in `swadesoul.swade_site_modules` and `splat.api_clients`.
- Adapter secrets (DB role, B2 key, GPU provider key, service token) in `/opt/swade-secrets/splat.env`
  (root, chmod 600). **No key ever reaches a client site.**
- Kill switch: registry entry in `swadebase_ops.adapters_registry`.

## Web embed (Three.js)

- Load **Spark** in the site's Three.js scene; fetch `GET /v1/scenes/:id`; pick `mobile_spz` on phones
  and low-memory devices, full `.spz` otherwise.
- **Collision:** invisible proxy meshes (`collision.glb`) - the player collides with these, not splats.
- **Collectibles and clickables:** ordinary Three.js meshes placed from `scene_objects`, picked with a
  raycaster; collecting calls the consuming site's own game API (points live in the site, not here).
- Movement constrained to the guided path for photo-mode scenes.
- A tiny shared embed helper (`@swade/splat-embed`) can be published later so every site loads scenes
  the same way.

## Privacy

- Photos of real places and people: **blur faces and licence plates** before training; never train on
  unblurred originals of bystanders.
- **Owner consent required**: the uploader confirms they own the place or have the owner's permission
  (consent record linked in `jobs.consent_id`); public publish needs that consent.
- EXIF/GPS stripped on upload. Originals private, deletable on request; withdrawing a scene removes it
  from serving.
- No minors' faces in published scenes.

## Licensing gate (summary)

Only commercial-OK components (table above). VGGT-1B-Commercial requires an approved access application
and forbids military use. Final tool choice: **TBD pending Harold's approval and a test run.**

## Open questions for Harold

1. Approve the proposed stack? Who submits the VGGT-1B-Commercial access application?
2. GPU: does swadebase-2 (or another machine) have an NVIDIA GPU, or use the existing RunPod account?
   Budget per scene and per site per day?
3. Photo mode = guided path only. Offer the 30-60 s video mode from day one for free roam?
4. Who places collectibles - site owners in an editor, or the game automatically?
5. Should browsers read `splat` via PostgREST (add to `PGRST_DB_SCHEMAS`) or only through the adapter API?
6. Retention for original photos (default: delete working files 7 days after publish).
7. First test scene: which real place, with the owner's consent?
8. Hosting the adapter: new service `swade-splat-adapter`, or a route inside `swadebase-adapters.service`
   for the API with a separate GPU worker? (Proposal: API in the existing adapter service style, separate worker.)
