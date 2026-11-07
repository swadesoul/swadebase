# Catalog video contract (ABAGALE and BLACKTALES)

First-stage backend. It is not deployed, not merged, and not wired to production Backblaze. `master` does not describe the live SWADEBASE host: Motion Studio is running there from `feat/motion-studio` and is absent from `master`. Do not replace the live checkout with this branch.

## What the apps call

The service stays off unless `CATALOG_VIDEO_ENABLED=true`. Health reports `enabled: false` until that explicit switch. Do not set it during a deploy that has not passed the gates below.

Base path, once enabled: `https://swadebase.cloud/functions/v1/catalog-video`

Send `Authorization: Bearer <SWADEBASE user JWT>` except for `GET /health` and for playlist/segment URLs that already carry a playback token.

| Call                                        | Behavior                                                                                                         |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `GET /health`                               | Reports `four_k: disabled`, `billing: unconfigured`, 600-second limit                                            |
| `POST /series`                              | `{ tenant, title }` tenant is `abagale` or `blacktales`                                                          |
| `GET /series/:id`                           | Series plus episodes ordered by `episode_order`                                                                  |
| `POST /series/:id/source-master`            | `{ asset_id }` keeps an over-length original unpublished                                                         |
| `POST /assets`                              | `{ tenant, title, source_type, rights: { web, roku }, series_id?, episode_order?, episode_title?, youtube_id? }` |
| `POST /assets/:id/uploads`                  | `{ bytes, content_type }` returns multipart PUT URLs. 1 GiB uses 16 MiB parts                                    |
| `PUT` part URL                              | Raw part bytes. Local mode uses a signed function URL. Object storage mode uses a presigned PUT                  |
| `POST /assets/:id/uploads/complete`         | `{ upload_id, parts: [{ part_number, etag }] }` stores the original and queues a probe                           |
| `POST /assets/:id/rights`                   | `{ rights: { web, roku } }`                                                                                      |
| `GET /assets/:id/playback?target=web\|roku` | Embed, pending, episode-needed, or a short-lived HLS master URL                                                  |

`Idempotency-Key` on `POST /assets` returns the original asset. Episode order is unique per series. A missing right is rejected, not treated as granted.

## Duration, series, and sources

The server probes the file with ffprobe. The duration is the larger of the container duration and the video-stream duration.

- `<= 600` seconds, including exactly 600, may be packaged.
- `> 600` becomes `needs_episode_submission`. The original stays. Nothing is cut or deleted.
- The creator uploads each episode as its own asset with `series_id` and `episode_order`.
- `source_type: youtube_embed` returns a YouTube id. `hls` and `roku` are null. Roku rights cannot be true. YouTube duration is not probed.

## Playback

Ready originals with the matching right get an HLS version 3 master. Video is H.264 High, `yuv420p`, AAC-LC stereo when the master has audio. Rungs are 1080, 720, 480, and 360, dropping any rung above the source. Nothing is scaled up. Segments are MPEG-TS. Playlist and segment URLs are HMAC-signed for 15 minutes. Segment responses advertise `accept-ranges`. A player that can read that master can fall down the ladder.

The default x264 preset is `veryfast` at CRF 20 because the VPS size is unknown. That is lossy. It is not a promise of invisible quality or of a particular file size. Review frames before calling a title acceptable.

## Storage layout

Private keys, not an access policy:

- `catalog/{tenant}/{creator_user_id}/masters/{asset_id}/original`
- `catalog/{tenant}/{creator_user_id}/1080/{asset_id}/`
- `catalog/{tenant}/{creator_user_id}/posters/{asset_id}.jpg`
- `catalog/{tenant}/{creator_user_id}/4k/{asset_id}/` is reserved and rejected if a publish tries to write it

Every signature checks the asset, the creator, and the key prefix. A folder name is not security.

## 4K and the $100 quote

`catalog_video_entitlements` can store only `billing_status = unconfigured`, `price_quote_cents = 10000`, currency USD, a null playback window, and null quotas. Database checks reject an active subscription and any numeric quota. Playback always returns `entitled: false` and omits 4K from the manifest, including when the master is genuine 4K. No Stripe object exists.

The $100 figure is a per-creator per-year quote for a future genuine-4K add-on. Title count, stored bytes, encode hours, and egress are still unset. Do not treat the price as an allowance.

## Queue

`catalog_video_jobs` and `claim_catalog_video_job` are separate from Motion Studio. The claim function forces one running job. Heartbeats are every 30 seconds. A lost heartbeat older than 10 minutes requeues until two attempts, then fails. The original remains. The worker container is opt-in via `docker/docker-compose.catalog-video.yml` and is not started by the default compose file.

## Deploy prerequisites (do not do these from this branch automatically)

1. Reconcile this branch with the live tree before any host deploy. Live Motion Studio is not in `master`.
2. Apply `supabase/migrations/20261107210000_catalog_video.sql` on a non-production database first. Reload PostgREST (`NOTIFY pgrst, 'reload schema'` or restart the REST service).
3. Set `CATALOG_VIDEO_SIGNING_KEY` (32+ characters) in the functions env. Keep it out of git.
4. Point `CATALOG_VIDEO_S3_*` at a private non-production bucket. Production Backblaze writes are not authorized.
5. Do not set `FUNCTIONS_VERIFY_JWT=false` for this service. The gateway keeps verifying JWTs for every existing function and for catalog data routes. Only `GET`/`HEAD /catalog-video/hls/*` and `PUT /catalog-video/uploads/parts` skip that gateway check, and only when they carry a long `token` query parameter. The function still verifies that HMAC. Flipping the global flag on the live host is a separate compatibility change because today's live gateway does not require a JWT.
6. Confirm bucket privacy, CORS for the ABAGALE and BLACKTALES web origins, byte range, and the current egress price.
7. Measure VPS CPU, RAM, and free disk. The compose file asks for 1 CPU and 1.5 GB as a placeholder. A multi-minute 1080p encode plus a 1 GB master can need more disk than that.
8. The 8 GiB per-master ceiling is a safety cap (`CATALOG_VIDEO_MAX_MASTER_BYTES`), not the commercial quota.

## Tested here

Local filesystem multipart, ffprobe, one real H.264 HLS package (320x240 fixture), ffmpeg reading the signed master, byte ranges, the 600.001-second rejection with the original kept, YouTube embed rejection for Roku/HLS, series order, idempotency, tenant and signature isolation, and the PostgreSQL checks that block active billing, quotas, YouTube-as-Roku, a second concurrent claim, and cross-user reads.

Also verified locally, still not production:

- A real 1 GiB multipart object was assembled in a temporary directory and then deleted. That directory was not Backblaze.
- Deno booted `docker/volumes/functions/catalog-video/index.ts`. Health returned `enabled: false`. A data route returned 503.
- Image `swadebase-catalog-video-worker:local` built on this machine. With a 1 CPU, 1536 MB, and 128 pid limit, the container exited 0 because `CATALOG_VIDEO_ENABLED` was unset. The image was not pushed.

## Stop. This pull request is not a launch

Do not merge, reset the live checkout, apply the migration on production, set `CATALOG_VIDEO_ENABLED`, or start the worker until every line below is true.

1. Required CI checks and reviews are green. They are not.
2. The change is applied onto the live revision. `origin/feat/motion-studio` holds the deployed Motion Studio function, worker, and migrations. Those files are not on `master`. Replacing the live tree with this branch would remove them.
3. A restorable backup of the live database and the current deploy revision is recorded. None was taken.
4. An authorized operator puts `CATALOG_VIDEO_SIGNING_KEY` in the existing secret store. It is not committed.
5. Private object storage, free disk, CORS, range, and zero extra spend are confirmed. The Hostinger VPS list call timed out, so capacity is not verified.
6. `CATALOG_VIDEO_ENABLED` stays unset until those checks pass.

When a later deploy is authorized, rollback is: clear `CATALOG_VIDEO_ENABLED`, stop the catalog worker, and leave masters in place. Do not drop the catalog tables or delete objects unless a reviewed backup shows they contain only this feature's data.

Live read on 2026-11-07: `GET /functions/v1/motion-studio/health` returned 200. `GET /functions/v1/catalog-video/health` returned 500 because that function is not on the server.
