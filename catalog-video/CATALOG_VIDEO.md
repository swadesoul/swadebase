# Catalog video contract (ABAGALE and BLACKTALES)

First-stage backend. It is not deployed, not merged, and not wired to production Backblaze. `master` does not describe the live SWADEBASE host: Motion Studio is running there from `feat/motion-studio` and is absent from `master`. Do not replace the live checkout with this branch.

## What the apps call

Base path: `https://swadebase.cloud/functions/v1/catalog-video`

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
5. Leave `FUNCTIONS_VERIFY_JWT` false, or exempt signed `GET /hls/*`. The gateway otherwise rejects Roku and Safari segment requests that only have the playback token.
6. Confirm bucket privacy, CORS for the ABAGALE and BLACKTALES web origins, byte range, and the current egress price.
7. Measure VPS CPU, RAM, and free disk. The compose file asks for 1 CPU and 1.5 GB as a placeholder. A multi-minute 1080p encode plus a 1 GB master can need more disk than that.
8. The 8 GiB per-master ceiling is a safety cap (`CATALOG_VIDEO_MAX_MASTER_BYTES`), not the commercial quota.

## Tested here

Local filesystem multipart, ffprobe, one real H.264 HLS package (320x240 fixture), ffmpeg reading the signed master, a 206 byte range, the 600.001-second rejection with the original kept, YouTube embed rejection for Roku/HLS, series order, idempotency, and the PostgreSQL checks that block active billing, quotas, YouTube-as-Roku, a second concurrent claim, and cross-user reads.

## Not tested and not done

No production B2 call, no 1 GB fixture upload, no Deno edge boot, no browser or Roku device, no visual quality review, no 4K encode, no billing, no quota numbers, and no worker image build (Docker is not available in this workspace).
