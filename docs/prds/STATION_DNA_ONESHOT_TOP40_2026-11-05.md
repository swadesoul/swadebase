# Station DNA — one-shot Top-40 radio fill
Status: **PRD (docs only)** — 2026-11-05 America/Chicago. No product code in this pass.
Recorded: 2026-11-05 America/Chicago
Approval: Swade voice/design (prior chat) + t816u; era/sonic archive clarification t817u.
Owner surface: **Maestro Radio** (primary on-air / user stations). Shared knowledge plane with ReSingLab via `TREND_TOP40_CREATE_PIPELINE_2026-11-05.md`.
Device context: Desktop Commander swadesoul / SWADEBASE primary 2.25.74.73.

## Problem
Users want a station that *sounds like* a vibe they can speak or type — eras, energy, artists, avoids — without manually curating dozens of tracks. Empty or thin libraries cannot hold engagement. Paid create must not be the first lever; free DNA-matched catalog and uploads come first. Stations still need to be **on-air while ramping** toward a hard Top-40 floor.

## Goal
One-shot **Station DNA**: voice or text → locked vibe profile → score full catalog → suggest fills → ramp to **≥40 songs** (Top-40 mindset) with clear lanes for DB match / upload / paid create. Daily create budget **3–10** tracks so an empty station reaches ready in about **4–5 days**. Account tier controls suggestion count and fill aggression.

## Non-goals / rejects
- No product implementation in this docs pass.
- No second trend engine inside Station DNA (consume shared trend/style plane from the Trend Top-40 Create Pipeline PRD).
- No verbatim clones of third-party lyrics or note-for-note covers framed as originals.
- Do not block on-air below 40 — use DNA-adjacent network fillers until ready badge.

## Station DNA (locked profile)
User speaks or texts desired vibe. Persist as a locked profile fields (illustrative):
- Eras / decades / scenes
- Energy, tempo band, mood
- Reference artists / avoids
- Genre lanes (Top 40, R&B, hip-hop, extensible)
- Production feel notes (bass-heavy, melodic, edit quirks) — may seed or pull from **era sonic fingerprints** (see below)
- Language / explicitness / content avoids

DNA is the scoring target for match, upload accept, and create briefs.

## Catalog match → suggest
Score Maestro + ReSingLab + uploads (+ artist_tracks / maestro_catalog hooks) against DNA.
- Free **DNA-matched library suggestions** first
- Tier gates how many suggestions surface and how aggressive auto-queue is
- Suggestions must prefer owned/licensed catalog over paid create

## Top-40 floor & on-air while ramping
- Hard minimum **40 songs** for “ready” badge and full engagement features
- Station may stay **on-air below 40** using DNA-adjacent network fillers (clearly not counted as owned ready library until replaced/accepted)
- Progress UI: current count / 40, ETA from daily create rate

## Fill lanes (order)
1. **DB match** — free DNA-scored catalog picks
2. **Upload** — user uploads scored against DNA (accept / soft-reject with reason)
3. **Suno or paid create** — only after match+upload gaps; fee rules per tier; briefs must follow Station DNA **and** (when genre is Top 40 / R&B / hip-hop / etc.) the shared trend+style pipeline

### Upload note (iPad Safari)
Any upload UX in this flow must work on **iPad Safari** (standing Music Mogul / Maestro upload rule). No desktop-only file pickers that break iPad.

## Daily create cadence
- Target **3–10 creates/day** per station (align rate limits with Trend pipeline)
- Empty → ~40 at mid cadence ≈ **4–5 days**
- Tier may raise/lower daily cap and suggestion batch size; never silent unlimited paid burn

## Account tier effects
| Lever | Lower tiers | Higher tiers |
| --- | --- | --- |
| Suggestion count | Smaller batches | Larger / refreshed more often |
| Fill aggression | Manual accept heavy | More auto-queue within DNA |
| Daily create cap | Toward 3 | Toward 10 (policy-capped) |
| Paid create priority | Gated / fee clearer | Faster gap fill after match |

Exact SKUs/prices are billing follow-ups — this PRD only locks behavior levers.

## Era / timeslot sonic fingerprints (tie-in)
Station DNA may reference a **dated era snapshot** (e.g. “Top 40 · 2016-H1”, “R&B · 2024-Q3”) from the shared catalogue of multi-axis sonic vectors (bass weight, melodic density, edit/production quirks, energy, etc.).
- Matching and create briefs can target **today’s hot** or a **historical timeslot**
- Snapshots are append-only; picking an old slot recreates that era’s feel with **new** lyrics/concepts
- Detail and write path: `TREND_TOP40_CREATE_PIPELINE_2026-11-05.md`

## Pipeline handoff (create)
When lane 3 fires for Top 40 / R&B / hip-hop (extensible):
1. Load Station DNA + optional era snapshot id
2. Call shared Trend Top-40 Create Pipeline stages (ingest tops → fingerprint → world/music trends → concept+lyric brief → generate → QA → publish)
3. Publish accepted tracks into **this station’s pool** and append features to the shared ReSingLab training / knowledge store

## Reuse (must)
| Piece | Notes |
| --- | --- |
| Maestro / AzuraCast plays & catalogs | Existing station + rotation data |
| `maestro_catalog`, `artist_tracks`, ReSingLab gens/catalog | Same lyric/catalog plane as lyrics-on-play PRD |
| Suno / paid create paths | Existing fee/provider rules; no new provider invent |
| Music Mogul sticky | Related UX gravity on Maestro; not a second fill engine |
| Shared trend/style KG | One knowledge plane — see sibling PRD |

## Related docs / hooks found (reuse scan 2026-11-05)
- `prds/MAESTRO_LYRICS_ONPLAY_EXTRACT_2026-11-05.md` — catalog cascade (not trend)
- Maestro Radio Master Site Bible — promo / ReSingLab radio week
- Music Mogul mentions (sticky `/play`); iPad Safari upload standing note
- **No prior** Station DNA / Top-40 floor / trend-create PRD on disk before this file

## Success criteria
- DNA lock from voice or text in one shot
- Suggestions ranked by DNA score before paid create
- On-air below 40 with fillers; ready badge at ≥40
- 3–10/day create path documented and tier-gated
- Era snapshot optional on DNA without forking a second trend system

## Suno pack fill note (see Trend PRD)
When lane-3 paid create uses Suno MCP packs: default **A/B alternate** clip picker (odd gens → first clip, even → second); non-chosen clip held **UNRELEASED** (artist sellable / gift-box inventory). Daily 3–10 counts **released** fills unless billing says otherwise. Full rules: `TREND_TOP40_CREATE_PIPELINE_2026-11-05.md` (t818u / t819u).
