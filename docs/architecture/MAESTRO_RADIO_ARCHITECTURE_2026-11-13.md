# Maestro Radio — Architecture Map (as of 2026-11-13, ~4:55 PM CT)

Prepared by Big Mamma (executor) for Swade, read-only research. No code, server, DB, DNS or deploy changes were made producing this doc.
All times America/Chicago (CT) unless marked UTC.

Evidence labels used throughout:
- **[VERIFIED-LIVE]**: I checked it today on the server, in the database (read-only), or with a live HTTP request.
- **[VERIFIED-SOURCE]**: I saw it in code (GitHub or a server checkout), not exercised live.
- **[DOC]**: recorded in a SWADEBASE Site Bible, PRD, release note or daily log, and not re-checked by me today.
- **[PRD-ONLY]**: design or plan only, with nothing built.
- **[DISCUSSED]**: in memory or chat only.

---

## 1. Overview

Maestro Radio (https://themaestroradio.com) is a 24/7 AI-DJ radio network self-hosted on **SWADEBASE Primary (2.25.74.73)**. The pieces are:
- **Broadcast engine:** AzuraCast (Docker `azuracast`, Icecast/Liquidsoap), public hostname `radio.themaestroradio.com`.
- **Native backend:** the "Maestro Factory", a Python service `maestro-factory.service` from `/opt/maestro-assistant/factory/`, plus a set of systemd timers.
- **Edge function:** `dj-studio` in the shared `supabase-edge-functions` runtime.
- **Database:** the `maestroradio` Postgres schema (96 tables) on SWADEBASE.
- **Media storage:** Backblaze B2.
- **Frontend:** a React/Vite SPA served by nginx from `/var/www/maestroradio-web/current`.

Around the radio core sit the listener/game layer (Maestro Mix, Behind the Rotation, Certified, free-song codes), the artist layer (Artist Studio, Artist Office, Discovery, cinematic pages) and the station-owner layer (stations, planner, gifts, credits, DJ talk-time). Three external systems feed in:
- **ReSingLab** is the tightest, real link. It supplies a paid and featured promo feed, a library import, the voices for Maestro artists, lyrics, and the song-delivery inbox.
- **Black Tales** connects through its Book Studio. Books & Stories went live today and reads chapters on air.
- **SSS Brain** is mostly loose. It advertises on air, and its chat agent has a Maestro bridge, but that bridge points at a legacy endpoint.

Live state right now [VERIFIED-LIVE]:
- Station "Maestro Radio" is online (AzuraCast now-playing API returned 200).
- Live web release: `20261113T163926Z-restyle` (10:39 AM CT today).
- `/play/` now redirects to `/behind-the-rotation`.

---

## 2. Component inventory

### 2.1 Core radio
| Component | What it is | Where it lives | Status |
|---|---|---|---|
| Public site | React/Vite SPA | themaestroradio.com → `/var/www/maestroradio-web/current` → `releases/20261113T163926Z-restyle`. Source: swadesoul/swade-radio (main), plus several **local-only** branches on Primary | **[VERIFIED-LIVE]** |
| Radio engine | AzuraCast (Icecast + Liquidsoap). Station 1 Maestro Radio, station 3 PET MUZIK | Docker `azuracast` on Primary; `radio.themaestroradio.com` (A → 2.25.74.73); `/api/nowplaying/1` 200 | **[VERIFIED-LIVE]**. Icecast burst ~256KB + AutoCue/ReplayGain applied [DISCUSSED/memory] |
| Maestro Factory | Native Python API: stations, uploads, credits, song codes, gifts, DJ talk-time, books, Artist Office/Studio, discovery, planner, music providers | `/opt/maestro-assistant/factory/` (factory.py + modules such as books.py, song_codes.py, dj_talk.py, station_*.py, music_providers.py, artist_*.py); `maestro-factory.service`; routed at `/maestro-factory-api/*` | **[VERIFIED-LIVE]**: service running, modules present |
| dj-studio edge function | AI DJ scripts, shows, segments, shout-outs, station tools, trial/gift forwarding | `supabase-edge-functions` container; versioned in swade-radio `supabase/functions/dj-studio/` (PR #12) | **[VERIFIED-LIVE]**: container up |
| Timers | `maestro-dj-render` (1 min), `maestro-dj-cue` (20 s), `maestro-factory-tick` (5 min), `maestro-station-refresh` (5 min), `maestro-artist-signal` (1 min), `maestro-resync-promo-injector` (1 min), `maestro-book-render` (2 min), `swade-audio-guard` (15 min) | systemd on Primary | **[VERIFIED-LIVE]**: all loaded/active |
| AI DJs | Barnabas, DONNA D, Loretta (plus Patrice in older docs). Day-part shows; talk every ~4 songs; time-of-day fix; dj_polish to -16 LUFS | dj-studio + `signal/dj_render.py`, `dj_cue_fix.py`, `clean_tail.py` | **[DOC]** live 2026-11-11 |
| Commercials playlist | Playlist 32, once every 15 min. Spots for ReSing Lab, VideoSayWhat, **SSS Brain**, Brainiak, **Black Tales**, SwadeSoul.com and The League Sound | B2 `maestro/commercials/`; AzuraCast Commercials | **[DOC]** (Oct 30–31; SSS Brain spot re-voiced Nov 11) |
| Lyrics on play | Catalog-first lyrics: song_profiles → maestro_catalog → artist_tracks → ReSingLab generations/catalog → optional Suno timestamped. **No Whisper on play** | `/maestro-lyrics-api`, `/lyrics`, `/opt/maestro-assistant` player; PRD `prds/MAESTRO_LYRICS_ONPLAY_EXTRACT_2026-11-05.md` | **[DOC]**: PRD says IMPLEMENTED (server-only), Nov 5. See contradiction in §8 |
| Storage | Originals and broadcast copies, books audio, commercials, explainers | Backblaze B2 (`maestro/...`) | **[DOC]** |

### 2.2 Station-owner layer
| Component | Where | Status |
|---|---|---|
| Station libraries / bulk upload / SFTP (max 10 per station) | `/stations/manage`, `station_libraries.py` | **[DOC]** live since Oct 28 |
| Upload credits + song codes (permanent "song SSN") + free-song drawer `/free` | `upload_credits.py`, `song_codes.py`; PR #13/#14 | **[DOC]** live Nov 8 |
| Rotation ladder pricing, station plans, Gift a Station `/admin/gifts` | `rotation_plans`, `station_gifts.py` | **[DOC]** live Nov 8–10 |
| DJ talk-time meter + `/pricing` | `dj_talk.py`; release Nov 11–12 | **[DOC]** live. Out-of-breaks fallback **not enforced** |
| No-repeat window (150 min) | AzuraCast setting | **[DOC]** live Nov 11–12 |
| Station Planner `/stations/planner`, station ads, `/education` | `station_planner.py`; swade-radio main 97551d5 | **[DOC]** live Nov 12; route 200 **[VERIFIED-LIVE]** |
| Station team / staff roles, Control Room `/admin` | factory + RLS tables | **[DOC]** live |
| Music import: ReSingLab-first + own files (Suno dormant pending partner approval) | `music_providers.py`; PR #21/#22 | **[DOC]** live Nov 12 |
| Single radio stage `/radio` + public caller/shout-out feed `/maestro-factory-api/radio/public` | release 20261113T153746Z | **[VERIFIED-LIVE]**: feed 200 |
| Site-wide restyle | release 20261113T163926Z-restyle (local branch) | **[VERIFIED-LIVE]**: current symlink |

### 2.3 Artist layer
| Component | Where | Status |
|---|---|---|
| Artist Studio (song factory: Artist → Song → Lyrics → Voice → Push to radio) | `/admin/music-factory`; generation via sunoapi.org; OmniRoute writer | **[DOC]** live Oct 30 |
| Voice Casting (Suno personas → stored in **ReSingLab** voice profiles) | `/admin/voice-casting`, `voice_casting.py` | **[DOC]** live Oct 31 |
| Artist Discovery (free 30-day promo, 3 weekly slots) | `/artist-discovery`, `artist_discovery.py` | **[DOC]** live Nov 10. No enrollments at launch |
| Cinematic artist pages (OATHLOOM renderer, swosting.com/artists) + Maestro Artist Studio `/artist-studio` | OATHLOOM artist-site renderer; factory `artist_design.py` | **[DOC]** live Nov 10/12 |
| Artist Office `/artist-office`, Label Office `/label-office` | `artist_office.py`; release 20261113T032457Z | **[DOC]** live; route 200 **[VERIFIED-LIVE]** |
| Artist profile reconciliation (one published source → radio, catalog, ReSingLab bios) | release 20261113T045102Z | **[DOC]** live |
| Artist Signal follow alerts | `maestro-artist-signal.timer` | **[VERIFIED-LIVE]**: timer active |
| Maestro Certified plaques | certified.themaestroradio.com (static) | **[VERIFIED-LIVE]**: 200. Awards are illustrative only |

### 2.4 Listener / entertainment layer
| Component | Where | Status |
|---|---|---|
| **Maestro Mix** (6-reel slot / living artist cards, free play) | `/maestro-mix/` → `/var/www/maestro-mix/dist`; source `/opt/work/maestro-guides/mix-prod` (not in GitHub). `/legends-mix` → 301 | **[VERIFIED-LIVE]**: 200. v3 live Nov 10; radio drawer embed live Nov 11 |
| Behind the Rotation (music-industry radio drama, Ep. 1 on demand, listener votes) | `/behind-the-rotation`; `maestroradio.drama_votes` | **[VERIFIED-LIVE]**: 200 |
| Music Mogul (retired) | `/play`, `/play/` → 302 `/behind-the-rotation` **[VERIFIED-LIVE]**. The `music-mogul.service` process is **still running** **[VERIFIED-LIVE]** (data preserved by design) | Retired publicly |
| Books & Stories on air | `/books`, `/books/<slug>`, `/studio/books`; see §6 | **[VERIFIED-LIVE]**: bundle contains the feature, 1 airing row, **paused** |
| Android preview app | App Factory debug build | **[DOC]** debug only |
| Cinematic explainer film (126 s) | B2 `maestro-radio/explainers/20261113/` | **[DOC]**: produced, **not embedded** on the site |

### 2.5 Planned / PRD-only
| Item | Doc | Status |
|---|---|---|
| Station DNA one-shot Top-40 fill | `prds/STATION_DNA_ONESHOT_TOP40_2026-11-05.md` | **[PRD-ONLY]** |
| Trend Top-40 create pipeline (shared knowledge plane with ReSingLab, era snapshots, Suno A/B pack, unreleased twin) | `prds/TREND_TOP40_CREATE_PIPELINE_2026-11-05.md` | **[PRD-ONLY]** |
| Artist Gift Box (B-sides/unreleased twins + ≤5 past uploads + passes) | `prds/ARTIST_GIFT_BOX_2026-11-05.md` | **[PRD-ONLY]** |
| Maestro Mix economy (XP tiers, Rewards Vault, 60/25/10/5 ledger, station funnel) | Site Bible + `prds/MAESTRO_MIX_REPLACE_MOGUL_2026-11-05.md` | **[PRD-ONLY]** (Mix is device-only, no server ledger) |
| Live DJ guest backstage (LiveKit) | `prds/MAESTRO_LIVE_DJ_GUEST_BACKSTAGE_2026-11-11.md` | **[PRD-ONLY]** |
| $100 Artist Spotlight AI interview | `prds/MAESTRO_ARTIST_SPOTLIGHT_INTERVIEW_2026-11-11.md` | **[PRD-ONLY]** (strategy) |
| Maestro Fashions (own Printify store), Certified point ledger, song-code money ideas | Site Bible Nov 8 | **[DISCUSSED/approved idea]**, not built |

---

## 3. Data & control flows

```mermaid
flowchart LR
  subgraph Primary["SWADEBASE Primary 2.25.74.73"]
    NGINX[nginx themaestroradio.com]
    WEB[React SPA /var/www/maestroradio-web]
    FACT[maestro-factory.service /maestro-factory-api]
    DJ[dj-studio edge fn]
    AZ[(AzuraCast station 1 / 3)]
    DB[(Postgres: maestroradio, resinglab, blacktales, swade_music_bridge_stage, sssbrain)]
    PROMO[maestro-resync-promo-feed + injector]
    BOOKR[maestro-book-render.timer books_render.py]
    BT[Black Tales app :3342 blacktales.online / books.blacktales.online]
    BV[book-voice.service Kokoro/RunPod]
    MIX[/maestro-mix static/]
  end
  B2[(Backblaze B2)]
  RSL[ReSingLab resinglab.com Lovable frontend + SWADEBASE edge fns]
  SSS[SSS Brain sssbrain.live]
  LIST((Listeners))

  LIST --> NGINX --> WEB
  WEB --> FACT
  WEB --> DJ
  WEB -->|stream + nowplaying| AZ
  MIX -->|hooks, duck radio, follow, shout-out| DJ
  FACT --> DB
  FACT -->|upload/playlist/media API| AZ
  FACT --> B2
  DJ -->|scripts, segments| DB
  DJ -->|rendered breaks via timers| AZ
  RSL -->|Push to Maestro: Stripe $10 or exempt| DB
  PROMO -->|reads radio_promo_orders, streams B2 file| AZ
  FACT -->|ReSingLab library import: resinglab bucket| B2
  FACT -->|voice casting writes voice profiles| DB
  BT -->|productions format=book, chapters, narration| DB
  BV --> B2
  BOOKR -->|narration + score + intro/outro -> mp3| B2
  BOOKR --> AZ
  WEB -->|/books read-along, buy link| BT
  SSS -. swade_ecosystem tool 'maestroradiofactory' -> maestroradio.app (legacy hosted Supabase) .-> X[(legacy Maestro Factory, NOT live site)]
  AZ -->|ads incl. SSS Brain + Black Tales spots| LIST
```

Key flows:
1. **Listening** [VERIFIED-LIVE]: the browser plays the AzuraCast stream through one shared audio element. Now-playing comes from the engine. The DJ portrait swaps in during DJ segments.
2. **Song intake** [DOC]: browser bulk upload, SFTP or the provider import goes to the factory. The factory decodes the file (ffprobe), charges credits, archives the original in B2, assigns a song code, writes ID3 tags, adds the track to an engine playlist and reads it back.
3. **AI DJ** [DOC]: dj-studio writes a script → `dj_render` voices it → `dj_cue_fix` stamps the time → the break is queued in AzuraCast. Usage is metered per account.
4. **Paid promo (ReSingLab)** [VERIFIED-LIVE service; DOC behaviour]: an artist pays $10 in ReSingLab (Stripe webhook → `resinglab-radio-promo-webhook`) → a row lands in `swade_music_bridge_stage.radio_promo_orders`. The injector runs every minute and `maestro-resync-promo-feed` streams the single B2 file into AzuraCast playlist 20 "ReSync Promo" during New Music Hour (4–5 PM CT, rebroadcast 1–2 AM). A Kokoro voice announces each paid spin.
5. **Books** [VERIFIED-LIVE row; DOC flow]: see §6.

---

## 4. Connection to SSS Brain

What is real:
- **Advertising** [DOC]: SSS Brain is one of the 7 house commercials in playlist 32, which plays every 15 min. The spot's garbled ending was trimmed on Nov 11, and it was re-voiced in Mr Freq's voice using sentence-by-sentence takes.
- **SSS Brain chat → "Maestro Radio Factory" bridge** [VERIFIED-SOURCE + DB]:
  - The sssbrain `src/routes/api/chat.ts` `swade_ecosystem` tool lists system `maestroradiofactory`. Its reads are list_stations/get_station/list_djs and its writes are create_station_draft/create_dj; writes need an explicit "create/build/do it".
  - The registry row `sssbrain.connected_systems` slug `maestroradiofactory` is state "reachable" and points to `site_url https://maestroradio.app` and `api_base_url …qpfapgbgylfyelsoljqf.supabase.co/functions/v1/sssbrain-bridge`. That is a **hosted (Lovable-era) Supabase project, not the live SWADEBASE Maestro Factory**.
  - The Maestro Site Bible says the old `maestroradiofactory` app "must not replace this application". **So today SSS Brain cannot see or control the real themaestroradio.com stations.**
- **SSS Brain constellation/registry** [VERIFIED-SOURCE]: Maestro Radio is listed as node SSH-14, but `constellation-data.ts` still links **maestroradio.live**, a domain you let expire on Oct 15.
- **Staged radio control-plane (source only)** [VERIFIED-SOURCE]:
  - Commit `ddbdaad` (Nov 1) "bounded Maestro action planning and staged approval queue" adds `ops/control-plane/maestro-action-adapter.mjs`, `radio-action-planner/bridge/staged-queue/readiness-gate` and SQL `0002_radio_action_jobs.sql`.
  - It is committed only in the local `/opt/sssbrain` checkout on Primary. **Not pushed, not deployed, SQL not applied.**
- **Shared infrastructure** [DOC]:
  - Same SWADEBASE auth/DB.
  - `sssbrain-stt` Whisper is explicitly **not** used for Maestro lyrics.
  - Separate OmniRoute app identities (`app-maestro`, `app-sssbrain`).
- **Not found**: no SSS Brain → Maestro data feed, no knowledge sync of Maestro state into SSS Brain, and no SSS Brain UI for radio. Nov 5 memory: you chose to keep the Mix↔Radio brief with Big Mamma and not feed it to Swade Brain (Swade Brain is the bot, a different thing from the SSS Brain app).

---

## 5. Connection to ReSingLab (ReSing Lab / "ReSync")

This is the deepest integration. Everything below is **[DOC]** unless marked.
1. **"Play on Maestro Radio" paid promo**:
   - Live since Oct 28: $10 for one week, 2 plays a day in New Music Hour, at least 3 h apart, announced on air as a paid promotion.
   - Since Nov 9, super admins and exempt users can push free as a "Featured spin", which is not labelled as paid. The resing frontend button for this is merged but **the Lovable publish was not done**.
   - Live today [VERIFIED-LIVE]: `maestro-resync-promo-feed.service` and `maestro-resync-promo-injector.timer` are active. `radio_promo_orders` has **12 active and 2 pending_payment**, and `radio_promo_plays` has 20 rows.
2. **ReSingLab library import into stations**:
   - Live Nov 12 (PR #22). Owners import finished ReSingLab songs from the `resinglab` storage bucket (87 songs at build time) through the normal upload pipeline.
   - ReSingLab is the **default** import source. Suno and Udio were removed from the UI.
3. **Voices**:
   - Voice Casting creates Suno personas and saves them to `resinglab.resinglab_voice_profiles`.
   - The trigger `sync_resing_artist_voice` keeps Maestro artist voices "ready" in ReSingLab. The 4 Maestro artists covered are Ellis Vale, Jules Meridian, Nia Solace and Tessa Orbit.
4. **Lyrics**: Maestro lyrics fall back to `resinglab_generations.lyrics` and `resinglab_catalog_songs.lyrics`, plus Suno timestamped lyrics for ReSingLab generations.
5. **Song-delivery inbox**: `/admin/song-deliveries` went live Nov 12 with the Station Planner release. It lets you approve, hold or reject songs pushed via the music-bridge. A hold blocks future radio-feed picks. The separate MyDistribution tab is **not deployed**.
6. **Artist bios**: the 3 exactly-linked ReSingLab featured profiles are kept in sync with published artist pages. "Royal" stays separate from Royal Banks because no match was confirmed.
7. **Commercial**: ReSing Lab has a house ad in playlist 32.
8. **Planned** [PRD-ONLY]:
   - The Trend Top-40 pipeline is "one knowledge plane, two surfaces": Maestro fills stations, and ReSingLab uses the same style/era snapshots for creation.
   - The Gift Box holds ReSingLab/Suno unreleased twins.
   - Maestro Mix station plans bundle 50 ReSingLab generations.
   - Your memory rule: Suno MCP two-clip A/B keep, with the B-side going to the gift box.

Gaps:
- ReSingLab's frontend is still on Lovable (`sssbrain.connected_systems` points resing at `resing.lovable.app`).
- MyDistribution "included radio week" handoff: zero handoffs exist, so nothing delivers it.
- Direct ReSingLab handoff fulfillment beyond the promo feed and import is "not newly connected" (Nov 10 note).

---

## 6. Connection to Black Tales, including the book section

**Black Tales** [VERIFIED-LIVE]:
- An SSR app running in Docker `blacktales-e6cc915` (image `blacktales:main-e6cc915`) on Primary. nginx proxies `blacktales.online` and `books.blacktales.online` → `127.0.0.1:3342`. Both returned 200 today.
- Source: GitHub `swadesoul/blacktales`.
- Data: the `blacktales` schema in SWADEBASE (54 tables). Book-related tables include `productions`, `episodes`, `project_assets`, `book_pages`, `audiobooks`, `audiobook_chapters`, `orders` and `order_items`.
- The `book-voice.service` narration worker (Kokoro CPU + RunPod serverless) is running.
- `productions` currently holds 3 rows with format=book, out of 4 total.

**Books & Stories on air** (live today, ~10:30 AM CT; Claude, your direction "use the structure of Black Tales' book section"):
- Root cause it fixed [DOC]: the old Maestro Book Studio edge function was a stub pointed at the blacktales tables, so nothing connected a book to a station.
- How it works now [DOC; key parts VERIFIED]:
  1. Books are **written and produced in Black Tales Book Studio**, under the same SWADEBASE account. A book is a production with format=book; its episodes are chapters; narration, score and images are project_assets.
  2. Maestro `/studio/books` lists the owner's Black Tales books. The owner picks a station, chapters (starting at ch. 1), a buy link (default `books.blacktales.online/bookstore/<id>`) and a schedule (story slot or every N songs).
  3. Factory `books.py` **[VERIFIED: file present]** writes `maestroradio.maestro_book_airings` / `maestro_book_airing_chapters`. It creates a station folder `show/Book - <title>` and a sequential AzuraCast playlist.
  4. `maestro-book-render.timer` → `books_render.py` **[VERIFIED: timer active]** builds each chapter mp3. It uses Black Tales narration, or reads the manuscript with a Kokoro fallback. It lays the chapter score under the voice at -16 dB, adds a spoken intro and an outro saying where to buy, and outputs at -16 LUFS. The file goes to B2 `maestro/books/<airing>/chapter-NN.mp3` and then to the engine.
  5. Public `/books` and `/books/<slug>` show a read-along page with only the aired chapters' text, "On air now", a Get-the-book link and Listen live. **[VERIFIED: the live JS bundle contains the Books feature; /books 200]**
- First airing [VERIFIED-LIVE DB]:
  - **THE BLACK RUSSIAN** by Swade Soul ("A Tale of Ivan"), created 10:30 AM CT today.
  - Playlist 51, scheduled daily 8:00–8:30 PM CT.
  - Buy link `books.blacktales.online/bookstore/40528fc4…`.
  - **status = paused**: it will not air until you press Resume in Studio.
  - One chapter row is in `ready` status (ch. 1, 173.7 s per the Bible).
- Other Black Tales ↔ Maestro ties:
  - The Black Tales 30-second commercial plays in house ads [DOC].
  - Maestro Fashions must stay a separate Printify store from Black Tales [DOC rule].
  - SSS Brain also has a `blacktales` bridge (`blacktales.online/api/sssbrain`), but that bridge is SSS Brain ↔ Black Tales, not Maestro.
- **Not found**: no Black Tales Site Bible exists in `/opt/swadebase/docs/site-bibles/`. No sales/commission tracking from radio airings to bookstore orders. No automatic "next chapter" advance beyond chapters the owner adds. The Book Studio in Black Tales does not itself know a book is on air; the link is one-way, Maestro reading from Black Tales.

---

## 7. Maestro Mix (game) and the Gift Box

- **Maestro Mix** [VERIFIED-LIVE route; DOC details]:
  - What it is: a gold Vegas cabinet with 13 Swade Family faces, 3 paylines, Encore bonus and point jackpots. Swade Soul is the legendary symbol (~1 in 450). Free play is 100 spins a day with no cash value.
  - Progress is saved **on the device only** (localStorage), with **no server ledger or leaderboard**.
  - Radio links (all real):
    - 30-second hooks cut from songs on station 1.
    - The radio ducks to 15% under a hook.
    - "Artist on air = x3" ties a win to the current song.
    - Follow goes through Artist Signal.
    - DJ shout-outs go through dj-studio, limited to 3 an hour and reviewed by the producer.
    - It sits in a drawer on `/radio` (embed mode).
  - Source sits in `/opt/work/maestro-guides/mix-prod` on Primary. **It is not in GitHub.**
- **Responsible-play rules** (10 downloads a day, 3 h play then 3 h cooldown, no autoplay, self-exclusion): approved as requirements but **not server-enforced** [DOC].
- **Economy** (XP tiers, Rewards Vault, Maestro Credits, 60/25/10/5, station-funnel plans $49/$99/$199 plus 50 ReSingLab gens): **[PRD-ONLY]**. The Rewards tiles say "Coming soon".
- **Artist Gift Box**: **[PRD-ONLY]**. It would package unreleased Suno twins/B-sides, up to 5 past non-radio uploads, and optional passes, tickets or Zoom invites. Gift-box items never go on air automatically. The tie-in to the Mix Rewards Vault is an open item.
- **Music Mogul**: publicly retired today; `/play` redirects to Behind the Rotation. Its service and data are preserved.

---

## 8. Open gaps, contradictions, unverified items

Contradictions / stale data:
1. **Lyrics status**: the Maestro Site Bible says "Lyrics on-play extract: PLAN ONLY, awaiting build OK". The PRD header and Nov 5 memory say "IMPLEMENTED (server-only)" with Whisper removed. The Bible section needs reconciling.
2. **SSS Brain points at the wrong Maestro**: its `maestroradiofactory` bridge targets `maestroradio.app` and a hosted Supabase function, not the SWADEBASE factory. Its constellation also links the expired `maestroradio.live`.
3. **Artist tag drift**: live now-playing showed **"aibb - Can I feed you tonight?"**. The Nov 8 note says aibb was renamed "Maestro Fam Artist" everywhere, including engine tags on 29 flagship files. At least one engine track still carries the old tag.
4. **Promo order count**: the Nov 12 note said "four active radio orders, two awaiting payment". Today's DB shows 12 active and 2 pending. Not necessarily wrong (it may have grown or been counted differently), but it is worth one check.
5. **Older Mix docs**: Mix docs from Nov 2–9 say "not built / no `/maestro-mix/`". Superseded: it has been live since Nov 5–10.
6. **Old User Guide video** still tells listeners to play Music Mogul (retired). It needs re-recording before reuse.

Source-control risk:
7. **GitHub main is behind live.** Several live releases exist only as local commits on Primary, and pushes were blocked pending your exact OK:
   - Artist Studio (`feat/artist-growth-20261112`)
   - Artist Office (`feat/artist-office-20261113`)
   - artist reconcile
   - Behind the Rotation (`ae82690`)
   - radio stage (`a5ab692`)
   - restyle (`feat/site-restyle-20261113`)
   - Books
   - Maestro Mix source

   A build from GitHub main would silently drop these features. swade-radio open PR: #23 (sitemap). Last merged: #22.

Not enforced / not built:
8. DJ talk-time out-of-breaks → stock voice fallback is shown but **not enforced**.
9. Maestro Mix limits and rewards are not server-side. There is no ledger.
10. Rotation rule "paid music ≤30% of airtime / 2 h gap" is **not enforced by the scheduler** (Oct 30 note).
11. The MyDistribution included radio week has no delivery path (0 handoffs). The MyDistribution song-inbox tab is not deployed.
12. ReSingLab frontend: the free "Push to Maestro" button is merged but the Lovable publish is not done.
13. Community tables/RPC (`community_sites`, `station_service_links`) were never created, so `/community` sections are empty.
14. `/stations/faces` returned "Unknown action" for super admin (Nov 9 note). Not re-checked.
15. Gift emails and support-desk alerts are not sent because the Resend key is not authorized for Maestro domains.
16. Suno account linking is blocked pending Suno partner approval.
17. Live DJ guests (LiveKit), Spotlight interview, Station DNA, Trend Top-40, Gift Box and Certified points ledger: **plan only**.
18. Books: the first airing is **paused**. There is no sales attribution from airing to bookstore order.

Unverified (consistently flagged in releases):
19. Physical iPad Safari for every upload flow (standing rule). This includes station uploads, Artist Studio, Office and Books.
20. Owner-signed-in positive paths: song editor, gifts, tryouts, planner, Mix shout-out and follow.
21. `radio.themaestroradio.com/` root returned a 302 to `/setup` from outside. I did not inspect further; worth confirming the AzuraCast admin/setup page is not exposed.
22. Whether the `music-mogul.service` process should keep running now that the game is retired publicly.

What I searched and did not find:
- A Black Tales Site Bible.
- Any Maestro → SSS Brain data feed.
- Teammate transcripts: SWADEBASE `docs/chats/` holds only Big Mamma logs, and I had no readable session ids for Radio Ron, Swade Brain, Novelli, Notebook Neil or Promo Paul. Teammate work is captured only where it was written into SWADEBASE docs.

---

## 9. Sources

SWADEBASE Primary (`/opt/swadebase/docs/`):
- `site-bibles/Maestro_Radio_Master_Site_Bible.md` (161 KB; primary source, sections Oct 28 → Nov 13)
- `site-bibles/ReSingLab_Master_Site_Bible.md`, `site-bibles/SSS_Brain_Master_Site_Bible.md`, `site-bibles/Maestro_Alpha_Baseline_2026-10-29.md`, `site-bibles/Artist_Pages_Master_Site_Bible.md`
- `prds/ARTIST_GIFT_BOX_2026-11-05.md`, `prds/STATION_DNA_ONESHOT_TOP40_2026-11-05.md`, `prds/TREND_TOP40_CREATE_PIPELINE_2026-11-05.md`, `prds/MAESTRO_LYRICS_ONPLAY_EXTRACT_2026-11-05.md`, `prds/MAESTRO_MIX_REPLACE_MOGUL_2026-11-05.md`, `prds/MAESTRO_LIVE_DJ_GUEST_BACKSTAGE_2026-11-11.md`, `prds/MAESTRO_ARTIST_SPOTLIGHT_INTERVIEW_2026-11-11.md`, `prds/SERVER_STRUCTURE_2026-10-30.md`, `prds/WATCHTOWER_COMPLETION_2026-10-30.md`
- `handoffs/HANDOFF_2026-10-30_maestro-station-setup.md`
- `daily/2026-10-29.md` … `daily/2026-11-13.md`; `chats/big_mamma/*`
- `releases/maestro-*-2026111{2,3}*` (artist studio, office, profiles, behind-rotation, cinematic explainer, radio stage, station planner)
- `/opt/swade-resync-radio/` (promo feed source and README)

Live checks today (~4:50–4:55 PM CT):
- HTTP: `/`, `/maestro-mix/`, `/behind-the-rotation`, `/books`, `/artist-office`, `/stations/planner`, `certified.`, `blacktales.online`, `books.blacktales.online/bookstore`, `resinglab.com` → 200. `/play/` → 302 to `/behind-the-rotation`. `radio.themaestroradio.com/api/nowplaying/1` → 200, online.
- systemd units/timers and Docker containers listed in §2. nginx `sites-enabled` routes.
- Read-only SQL (in `BEGIN READ ONLY … ROLLBACK`):
  - `maestroradio.maestro_book_airings` and `_chapters`
  - `blacktales.productions` and schema tables
  - `swade_music_bridge_stage.radio_promo_orders` and `_plays`
  - `sssbrain.connected_systems`

GitHub (swadesoul org):
- swade-radio PRs #1–#23 (e.g. https://github.com/swadesoul/swade-radio/pull/17, /pull/22).
- sssbrain `src/routes/api/chat.ts`, `src/lib/connected-systems.server.ts`, `src/lib/constellation-data.ts`.
- Local `/opt/sssbrain` commit `ddbdaad` (unpushed).
- blacktales commit references in daily logs (e.g. Book Studio "Produce my book" b797491, Bookstore tab b71420a).

Memory (Nov 5, 2026):
- Lyrics are catalog-first with Whisper off.
- Station DNA standing decision.
- Mix↔Radio brief stays with Big Mamma.
- maestroradio.live retired Oct 14 in favour of themaestroradio.com.
