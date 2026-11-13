# Maestro lyrics on-play — Suno / ReSingLab first
Status: **IMPLEMENTED (server-only)** — 2026-11-05 America/Chicago. On-play lyrics pull from existing generation catalogs (Suno / ReSingLab / artist_tracks / maestro_catalog). **No Whisper / VideoSayWhat STT on the play path.**
Recorded: 2026-11-05 America/Chicago
Approval: Swade (Nov 5) — return to lyrics after VSW+SSS Brain; MCP/DB for Suno + ReSingLab already exist; do not re-listen.
Device context: Desktop Commander swadesoul / SWADEBASE primary 2.25.74.73.

## Problem (root cause)
Lyrics often look "missing" because `maestroradio.song_profiles` is empty for the track — **not** because the lyrics player is broken. Songs were generated in Suno / ReSingLab / Artist Studio, so lyrics already live on those systems (and often in SWADEBASE tables). Filling profiles from those sources once fixes every later play. Whisper re-listening was the wrong path.

## Goal
On the **next play** of a track that has no persisted (or only Whisper-quality) lyrics, **copy-forward** from generation/catalog sources, store in `song_profiles`, then show lyrics on every subsequent play from storage. Never call VideoSayWhat / Whisper STT from `publicLyrics`.

## Non-goals / rejects (explicit)
- **No Whisper / VideoSayWhat STT on play path** (HARD — do not restart or touch VSW transcription).
- No paid AssemblyAI / Gemini transcription for this path.
- No rebuilding the lyrics player.
- No blocking upload or station push on extract.
- Prefer DB-stored lyrics over live MCP/API calls.

## Rules (Swade)
1. **Lazy on next play** — fill only when a listener/player needs lyrics and none (usable) are stored yet.
2. **Persist once → show every play** — after successful write, later plays read DB only.
3. **Prefer existing stored lyrics first** (order):
   - `song_profiles` (non-Whisper source preferred; Whisper-only may be upgraded)
   - `maestro_catalog.lyrics`
   - `swadesoul.artist_tracks.lyrics_text`
   - `resinglab.resinglab_generations.lyrics` (+ cached `metadata.timestamped_lyrics`)
   - `resinglab.resinglab_catalog_songs.lyrics`
4. **Optional live Suno timestamped lyrics** only when a matching generation has `provider_task_id` + `metadata.provider_audio_id` and no usable text yet — call `api.sunoapi.org` get-timestamped-lyrics (same path as `resinglab-timestamped-lyrics`). Never Whisper.
5. **Editable after fill** — Artist Studio lyrics step / light editor can correct text; edits overwrite the same profile fields.
6. **Unique style** — existing `lyrics.css`; optional bg/font like `artist_tracks`.

## Reuse (must)
| Piece | Location / contract |
| --- | --- |
| Lyrics player UI | Existing `/opt/maestro-assistant` lyrics player |
| Lyrics API | Existing `/maestro-lyrics-api` → `public_lyrics` |
| Generation lyrics | `resinglab.resinglab_generations`, `resinglab.resinglab_catalog_songs`, `swadesoul.artist_tracks` |
| Optional timed lines | Suno get-timestamped-lyrics via `SUNO_API_KEY` (edge env) |
| Persist | `maestroradio.song_profiles`: `lyrics`, `lyric_lines`, `lyrics_visible`, `suggestion.lyrics_source` |
| Style | `lyrics.css` |

## Play-time flow (implemented)
1. Client requests lyrics (`public_lyrics` / `/maestro-lyrics-api`).
2. Visible `song_profiles` hit with non-Whisper source → return immediately.
3. Fuzzy title match across profiles / `maestro_catalog` / `artist_tracks` / ReSingLab generations & catalog songs (title variants strip remix/parenthetical suffixes).
4. Best non-empty text wins; if Whisper-only profile exists and a better source is found, upgrade + persist.
5. Persist into `song_profiles` when `media_id` is known; return text to player.
6. If still empty but a ReSingLab generation has Suno task+audio ids → background `get-timestamped-lyrics` (EdgeRuntime.waitUntil); UI may show "Fetching lyrics from Suno…"; never STT.
7. Audio playback is never blocked.

## Persistence contract
- Table: `maestroradio.song_profiles`
- Fields: `lyrics`, `lyric_lines`, `lyrics_visible`, `suggestion.lyrics_source`
- Provenance values: `song_profiles` | `maestro_catalog` | `artist_tracks` | `resinglab_generations` | `resinglab_generations_timestamped` | `resinglab_catalog_songs` | `sunoapi_timestamped` | `copy_forward`
- Whisper source string `videosaywhat_whisper` is recognized only to allow upgrade; it is never written by this path.

## Known gaps (document; do not invent scope)
1. Live Cursor MCP connectors for Suno/ReSingLab are not required — SWADEBASE edge + DB already hold generation lyrics.
2. Title identity across remix suffixes still heuristic (`titlesMatch` / `titleVariants`).
3. Bulk backfill of all catalog → profiles is optional later; lazy on-play is v1.

## Acceptance criteria
- Track with empty/Whisper profile but lyrics in catalog/`artist_tracks`/ReSingLab → first play copies into `song_profiles`, shows lyrics, **no STT call**.
- Track with generation ids only → optional async Suno timestamped fetch; audio still plays; result stored.
- Concurrent first plays → single provider fetch (inflight + cooldown).
- Upload / push-to-radio path unchanged.
- VideoSayWhat / `sssbrain-stt` / `vsw-warp` **untouched** (no restart).
- Zero paid STT spend on this path.

## Implementation receipt
- Date: 2026-11-05 America/Chicago
- Deploy: SWADEBASE-server-only (volume-mounted edge functions; byte-sync `/opt/maestro-assistant/assistant.ts`)
- Files:
  - `/opt/swadebase/docker/volumes/functions/dj-studio-libraries-v1/assistant.ts`
  - `/opt/swadebase/docker/volumes/functions/dj-studio-libraries-v1/index.ts` (removed unused `getAudio` from `public_lyrics`)
  - `/opt/maestro-assistant/assistant.ts` (byte-synced)
  - This PRD + `daily/2026-11-05.md`
- Backup: `/opt/backups/maestro-lyrics-suno-first-20261105T140457Z/`
- HARD: VideoSayWhat transcription not restarted; admin analyze/voice STT helpers in `assistant.ts` remain for founder voice commands only.

### Smoke (2026-11-05 America/Chicago)
- `Breathe Back Into Me Noble Rayne` → lyrics_len=2418, lines=101, media_id=108, source=artist_tracks, stt=false
- `Come And Get It (R&B Flip)` → lyrics_len=3189 via fuzzy title → artist_tracks, stt=false
- Live empty tracks correctly return empty note (no Whisper fallback)
- VSW/sssbrain-stt not restarted
