# PET MUZIK Motion Studio Integration Contract

Date: 2026-10-27
Status: PLANNED — no PET MUZIK render or integration deployed

## Verified reuse
- SWADEBASE Motion Studio documented at `/functions/v1/motion-studio` with Kinetta and 86 style library entries.
- Health returned HTTP 200: `ok:true`, `styles_in_db:86`, `styles_in_file:86`, `b2:true` on 2026-10-27.
- `swadebase-hyperframes.service` active; `supabase-motion-worker-1` and `supabase-edge-functions` running.
- Worker existence/health is not proof of completed video render; sample render + B2 readback remain mandatory.
- Follow SWADEBASE Master Site Bible, STANDING_RULES and existing HyperFrames version-specific authoring contract. Never upgrade existing shared adapter to fit one production.

## PET MUZIK bridge (reuse, no duplicate renderer)
1. PET MUZIK Maestro collects validated pet identity, approved story, audio B2 object, approved scene image B2 object and public/private permissions.
2. Identity Guardian locks original pet photos and approved composition by hashes; start-image compositions animate background, text, camera, particles and atmosphere without redrawing the subject. New-pose generation requires separate review.
3. Kinetta recommends existing styles; store chosen style ID, project owner, brand/property `pet-muzik`, duration and aspect ratio.
4. Via verified server-side authentication, use Motion Studio MCP `motion_create_project` with `mode=audio` for song-synced lyric videos, or `mode=start_image` for approved still-based pieces. Verify actual schema and whether combining both assets is supported before implementation; do not guess endpoint capabilities.
5. Render 16:9 master for ABAGALE and independently QA 9:16 vertical cut; produce 1:1 or 4:5 for storefront only where requested. Preserve storyboard and safe zones.
6. Retrieve actual MP4, source ZIP and poster from B2; visually inspect multiple frames, text, audio sync, identities and captions. Read back B2 object and save manifest/checksum.
7. Keep all videos private by default. Public pet store, PET MUZIK Radio, ABAGALE TV and Roku each require separate opt-ins and verified downstream adapters.
8. For memorials use gentle motion and opt-in names/dates; avoid invented narrative facts, automatic public sharing, and synthetic animal motion implying a real event.

## Acceptance gates
- Test authenticated adapter project creation with a non-customer sample, MP4+source download, 16:9 and 9:16 framing, captions, B2 readback, desktop and iPad Safari playback.
- Track per-job CPU/elapsed cost and failure/retries; no paid inference by default.
- Report `source_verified`, `service_observed`, `live_probe_passed`, and `end_to_end_verified` separately.
- Do not publish, spend money, send customer email or release media without scoped approval.
