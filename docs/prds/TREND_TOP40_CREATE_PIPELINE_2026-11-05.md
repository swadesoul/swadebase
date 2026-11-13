# Trend Top-40 Create Pipeline — Maestro fill + ReSingLab shared knowledge
Status: **PRD (docs only)** — 2026-11-05 America/Chicago. No product code in this pass.
Recorded: 2026-11-05 America/Chicago
Approval: Swade (pt816u / t816u) — top tracks → new products matching style, new lyrics/concepts from world+music direction; shared plane trains ReSingLab.
Clarifications: **t817u** multi-axis sonic + append-only era/timeslot catalogue; **t818u** Suno MCP pack A/B alternate clip picker; **t819u** non-chosen clip kept UNRELEASED (artist sellable / gift-box inventory).
Owner: **Maestro Radio** primary for on-air station library fill. **ReSingLab** consumes the same style+trend knowledge (not a second reinvented trend engine).
Sibling: `STATION_DNA_ONESHOT_TOP40_2026-11-05.md` (Station DNA / Top-40 floor / fill lanes).
Device context: Desktop Commander swadesoul / SWADEBASE primary 2.25.74.73.

## Problem
Creating Top 40 / R&B / hip-hop (and later genres) by gut feel drifts from what is actually hot in *our* system and from where music culture is going. Static clones of today’s hits age out. We also lose the ability to remember *how* an era sounded — bass weight, melodic density, edit quirks — so we cannot faithfully recreate a past timeslot with fresh concepts years later. Suno gens return two clips; without a default pack picker and unreleased twin policy we waste inventory and confuse what goes on-air vs gift/sell later.

## Goal
For extensible genre lanes starting with **Top 40, R&B, hip-hop**:
1. Look at **top tracks already in our system** (Maestro/AzuraCast plays, catalog scores, ReSingLab gens, `artist_tracks`).
2. Analyze **all sonic axes** (not genre alone) and **save dated fingerprints**.
3. Create **new products** that match production/feel/tempo/energy **but different lyrics & concepts**, grounded in **world events + music direction-of-travel**.
4. Continuously evolve: **hot-match + direction-of-travel**, not static clones.
5. Output fills **radio station libraries** (Station DNA / Top-40 floor).
6. **One knowledge plane, two surfaces**: Maestro radio fill vs ReSingLab create UX — shared graph/features train ReSingLab.
7. Grow an **append-only time-travel catalogue** so a future query by year/timeslot can recreate that era’s sound with new lyrics/concepts.
8. Pack create via **existing Suno MCP**: default **A/B alternate** clip pick; twin clip always retained as **UNRELEASED** inventory.

## Non-goals / rejects
- No product code in this docs pass.
- No verbatim clone of third-party lyrics; no “soundalike with same hook words.”
- No second trend engine inside ReSingLab.
- Never **overwrite** historical sonic snapshots — append only.
- Do not burn unlimited paid gens; align **3–10/day** station fill caps where applicable.
- Do not discard the non-chosen Suno clip — it is inventory, not trash.
- Gift-box product UX is **next** (document pairing only here; do not build gift-box checkout in this pass).

## Core concepts

### Tops in *our* system (ingest sources)
Rank / sample “what’s hot here” from:
- Maestro / AzuraCast play counts & recency
- Catalog scores / rotation weight
- ReSingLab generations & catalog songs
- `swadesoul.artist_tracks` (+ related maestro_catalog hooks)
Primary window example: **top 10** per genre lane (configurable top-N).

### Multi-axis sonic fingerprint (beyond genre)
For each top set and each timeslot analysis run, extract and store vectors across **all** available sonic axes, including at least:
- Bass weight / low-end dominance
- Melodic density / hook shape class
- Edit / production quirks (chops, drops, vocal FX, sidechain feel, etc.)
- Tempo / BPM band & groove feel
- Energy / dynamics arc
- Harmonic brightness / darkness
- Vocal delivery class (talk-sing, melisma, stacked hooks, etc.) when detectable
- Mix space (dry/wet, width) and any other durable axes we can score
Genre label is one field among many — **not** the fingerprint.

### Era / timeslot snapshots
- Each analysis run writes a **dated style vector** keyed by genre lane + timeslot (examples: `top40|2026-W45`, `rnb|2024-Q3`, `hiphop|2016-H1`).
- Snapshots are **immutable once written**; corrections = new snapshot rows, never in-place overwrite.
- Continuous append grows the catalogue so years from now we can query a particular timeslot and **re-create that era’s sound** (new lyrics/concepts, same sonic DNA).

### Catalog as time-travel archive
| Query | Result |
| --- | --- |
| Genre + “now” | Latest hot fingerprint + live trend direction |
| Genre + year/slot | Historical fingerprint for era recreate |
| Station DNA era ref | Briefs locked to that snapshot id |
Training store keeps fingerprint ids so ReSingLab UX can offer “create in 2019 R&B pocket” without reinventing analysis.

### Hot-match + direction-of-travel
- **Hot-match**: proximity to current (or selected era) sonic fingerprint.
- **Direction-of-travel**: world + music trend signals that push concepts/lyrics forward so products evolve instead of freezing a clone of last week’s #1.

### Suno MCP pack create — default A/B alternate picker (t818u)
- Create packs quickly via the **existing Suno MCP** connection (reuse; do not invent a parallel provider client).
- Each Suno generation returns **two songs/clips** (clip A = first, clip B = second).
- **Default pack picker** alternates by pack order across the whole pack experience:

| Pack gen order | Chosen for release path | Rule |
| --- | --- | --- |
| gen1 | **first** clip (A) | take A |
| gen2 | **second** clip (B) | take B |
| gen3 | **first** clip (A) | take A |
| gen4 | **second** clip (B) | take B |
| … | continue A/B/A/B… | odd → A, even → B |

This is the **default** automatic selection for station-fill / pack ramp. Manual override may exist later; default remains A/B alternate unless product policy changes.

### Released vs UNRELEASED pairing (t819u)
For **every** Suno gen (always 2 clips):
- **Released** = the clip selected by the A/B alternate rule → continues to QA → may publish to station pool / primary product path.
- **UNRELEASED** = the clip **not** chosen → **kept** as durable inventory:
  - Artist **sellable asset**
  - **Gift-box** inventory (gift box product is next; this PRD only locks the pairing + hold)
- Persist an explicit **pair record** per generate: `{ gen_id, clip_A, clip_B, released_clip, unreleased_clip, pack_index, picker_rule: "AB_ALTERNATE" }`.
- Never delete or auto-overwrite the unreleased twin when releasing its sibling.
- Unreleased items are **not** on-air by default; promotion to released requires an explicit later action (outside default pack picker).

## Pipeline stages (clear order)

### 1) Ingest tops
Pull top-N per active genre lane from plays, scores, ReSingLab gens, artist_tracks. Normalize ids/titles; dedupe; attach play/score metadata and time window used.

### 2) Style fingerprint
Run multi-axis sonic analysis on the top set. Emit fingerprint document + **append** era/timeslot snapshot to the catalogue (never overwrite prior snapshots for that slot’s history chain).

### 3) World / music trend signals
Ingest culture & music direction signals (news/culture briefs, genre discourse, our own engagement deltas). Produce a short **trend brief**: themes rising, themes fading, tonal constraints. No scraping of copyrighted lyric corpora into prompts.

### 4) Concept + lyric brief
Combine: Station DNA (if any) + selected fingerprint (now or historical) + trend brief.
Require:
- Matched production/feel/tempo/energy axes
- **Different** concept and lyrics from seed tops
- Explicit differentiation checklist vs nearest tops (title, hook thesis, story)

### 5) Generate (Suno MCP / our create) + pack pick
- Prefer **existing Suno MCP** for fast pack create under **fee rules** and tier policy.
- Station fills: prefer **3–10/day** rate alignment (count **released** picks toward the daily fill cap unless billing policy says otherwise; unreleased twins still stored).
- Apply **A/B alternate** default picker across pack gen order (see table above).
- Write **released vs unreleased** pair for each gen before QA on the released clip.
- No silent unlimited queue.

### 6) QA vs DNA / trend / fingerprint
Automated + light human gates on the **released** candidate:
- Sonic distance to target fingerprint within band
- Trend/concept compliance
- Lyric originality checks (no verbatim third-party lyric spans)
- Station DNA avoid-list
Fail → revise brief or reject released candidate; **unreleased twin remains inventory** (do not auto-promote unless explicitly chosen).

### 7) Publish → station pool + ReSingLab training store
- Accept released → station library / fill queue (Maestro primary)
- Keep unreleased twin in sellable / gift-box inventory store with pair link
- Same artifacts (fingerprint ids, briefs, features, outcomes, pair ids) **append** to shared knowledge / training store for ReSingLab create UX
- One plane: ReSingLab reads; it does not fork a parallel trend pipeline

## Surfaces
| Surface | Role |
| --- | --- |
| Maestro Radio | Owner of on-air fill; Station DNA Top-40 floor consumer; receives **released** picks |
| ReSingLab | Create UX shares DNA/trend/era fingerprints; can surface unreleased inventory later |
| Shared KG / feature store | Single append-only truth for style+trend+era snapshots + gen pairs |
| Gift-box (next) | Consumes UNRELEASED inventory; not built in this pass |

## Guardrails
- **No verbatim clone** of third-party lyrics; differentiate concepts deliberately.
- Rate limits: **3–10/day** station fills where this pipeline feeds Station DNA gaps.
- Fee rules: paid create only after policy/tier; surface cost before burn.
- **iPad Safari**: if uploads appear in adjacent Station DNA fill lanes, upload UX must work on iPad Safari (standing Maestro/Music Mogul rule).
- Append-only snapshots; time-travel recreate must cite snapshot id in the brief for audit.
- Extensible genres: add lanes without renaming the plane.
- **Pack picker default = A/B alternate**; document any override in the pair record.
- **Never discard** the non-chosen clip; UNRELEASED hold is mandatory per gen.

## Reuse (must)
| Piece | Notes |
| --- | --- |
| Station DNA PRD | Floor, lanes, tiers, on-air-while-ramping |
| Lyrics-on-play catalog cascade | `MAESTRO_LYRICS_ONPLAY_EXTRACT_2026-11-05.md` source tables |
| **Suno MCP** (existing) | Pack create; 2 clips/gen; A/B picker + unreleased twin |
| ReSingLab generate paths | Shared plane consumer; fee surfaces |
| AzuraCast / Maestro rotation | Tops + publish destination for released |
| Music Mogul | Sticky feature gravity only — not a second engine |

## Related hooks from reuse scan (2026-11-05)
- Existing: ReSingLab ↔ Maestro lyrics/catalog; Music Mogul sticky; Site Bible promo week; **no** prior trend-create / era-fingerprint / Top-40 create pipeline PRD before this file.
- Standing rules: ReSingLab front scroll never downgraded (unrelated UI constraint).

## Success criteria
- Documented 7-stage pipeline with owners
- Multi-axis fingerprints + append-only era/timeslot catalogue specified
- Time-travel query path specified (year/slot → recreate)
- Maestro fill + ReSingLab training share one knowledge plane
- Suno MCP pack **A/B alternate** default picker documented
- **Released vs UNRELEASED** pairing per gen documented (gift-box next)
- Guardrails (lyrics, rate limits, iPad upload note) explicit
- Docs only — no code shipped in this pass
