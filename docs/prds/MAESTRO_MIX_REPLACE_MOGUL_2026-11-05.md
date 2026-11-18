# Maestro Mix — replace Music Mogul on `/play`
Status: **PRD (docs only)** — 2026-11-05 America/Chicago. No product deploy / no live `/play` cutover in this pass.
Recorded: 2026-11-05 ~09:15 America/Chicago
Approval: Swade GO **t825u** (docs align Bible + PRDs). Cutover of live `/play` requires a **separate explicit GO**.
Canonical name: **Maestro Mix** (aka prior “Legends Mix” / “slot machine”).
Owner surface: themaestroradio.com. Site Bible: `docs/site-bibles/Maestro_Radio_Master_Site_Bible.md` (Maestro Mix canonical section).
Device: Desktop Commander swadesoul (`86ce1ca5-b523-42a5-8ea7-44e2dd3bc4b2`).
Siblings: `ARTIST_GIFT_BOX_2026-11-05.md`, `STATION_DNA_ONESHOT_TOP40_2026-11-05.md`, `TREND_TOP40_CREATE_PIPELINE_2026-11-05.md`.

## Problem
Music Mogul occupies the sticky `/play` merchandising slot. Founder approved (2026-11-02) replacing it with the six-reel gold-card collection game. Naming and design direction from ChatGPT share **6aec9b31** call the product **Maestro Mix**. Prototype `maestro-legends-granada-demo.zip` is not on SWADEBASE/GitHub. Live `/play` is still Mogul 3D (`/opt/swadebase/mogul/current` → `34d85f6`). No `/maestro-mix/` or `/legends-mix/` deployable exists under `/var/www` as of this PRD.

## Goal
Ship Maestro Mix as the canonical sticky game that eventually replaces Mogul on `/play`, after free-play lands on a dedicated path and legal/economy gates clear. Preserve Mogul XP until an explicit migration decision. Do not invent product rules beyond Bible + ChatGPT share capture.

## Non-goals / rejects (this pass)
- No live nginx `/play` change, no homepage promo swap, no Mogul shutdown.
- No paid chance-based winnings, Stripe Mix checkout, or Rewards Vault ledger activation.
- No Capisino / spin-winner-magic scope.
- Do not destroy Mogul player progress or published assets.
- Prices, XP tier thresholds, and legal packaging remain **PROPOSED** until counsel + founder certify live.

## Product capture (from ChatGPT share — do not invent beyond)
- Journey: **player → collector → curator → station owner**
- **6 reels**; **Living Artist Cards** (Granada etc.); **Rewards Vault** on SWADEBASE
- XP per-artist collection tiers (illustrative): Standard / Featured / Legendary / Supreme
- Revenue ledger proposed **60 / 25 / 10 / 5**; **Maestro Credits**; **100 free trial spins once**
- Responsible play (binding rule from Bible Nov 2): **10 downloads/day CT**; **3 h play + 3 h cooldown**; **no autoplay**; self-exclusion
- Station funnel readiness **10 / 25 / 50**; buy station without winning spins
- Proposed plans **$49 / $99 / $199** + bounded **50 ReSingLab** over ~90 d — **PROPOSED not live**
- Build order: licensed libraries → preview → checkout → ReSingLab allowance → Artist Worlds
- Station fill engines: Station DNA + Trend Top-40 PRDs (paths above)

## Recommended free-play URL path
**Prefer `/maestro-mix/`** as the canonical public free-play path (matches product name). Keep `/legends-mix/` as an optional alias if any prior handoff/docs already cite it. Do **not** point homepage or `/play` at Mix until cutover GO.

## Cutover checklist
### A. Docs / naming (this pass)
- [x] Bible: Maestro Mix canonical + aka Legends Mix / slot machine
- [x] This PRD written
- [x] Gift-box pointer PRD (optional sibling)
- [x] Station DNA / Trend Top-40 noted as fill engines
- [x] Bible backup under `/opt/backups/maestro-mix-bible-*`

### B. Free-play land (before `/play` touch)
- [ ] Recover or rebuild prototype assets (Granada gold card, hero, demo reels, MP3 player panes)
- [ ] Place source under versioned tree (swade-radio or dedicated Mix repo) — not ChatGPT-only zip
- [ ] Nginx static (or service) for `/maestro-mix/` only; SPA fallback; desktop + iPad smoke
- [ ] Optional `/legends-mix/` → `/maestro-mix/` redirect
- [ ] Free-play only: cosmetic or server-authorized non-valuable spins; no cash-out prizes
- [ ] Responsible-play UI placeholders (downloads left, session time, cooldown end) even if enforcement stubs
- [ ] Rollback: remove Mix location block; leave `/play` Mogul untouched

### C. Economy / vault (gated)
- [ ] Licensed library catalog wired for previewable tracks only
- [ ] Preview → checkout path (no silent grants)
- [ ] Rewards Vault schema on SWADEBASE (idempotent ledger)
- [ ] Maestro Credits + 100 free trial spins once (server-side unique grant)
- [ ] Revenue split 60/25/10/5 implemented only after legal/processor OK — mark live vs PROPOSED
- [ ] ReSingLab bounded allowance (50 / ~90 d) tied to paid station plans when those go live
- [ ] Artist Worlds after libraries + checkout + ReSingLab allowance

### D. `/play` cutover (REQUIRES explicit Swade GO — not granted by t825u docs pass)
- [ ] Backup nginx `themaestroradio` `/play` blocks, music-mogul.service unit, `/opt/swadebase/mogul/current` tree, Mogul DB/XP snapshots
- [ ] Homepage Landing promo swap from Mogul `/play` → Mix path
- [ ] `/play/` redirect or alias to Mix **or** reverse-proxy Mix at `/play` — pick one plan and document
- [ ] Preserve Mogul XP until migration decision (export/map/hold); do not wipe
- [ ] Post-cutover smoke: `/`, `/play/`, `/maestro-mix/`, stream, stations, factory unchanged
- [ ] Rollback drill documented and tested (restore nginx + Mogul service symlink)

### E. Post-cutover hygiene
- [ ] What’s New / knowledge index only after verified live
- [ ] Update Bible status from PROPOSED/free-play → LIVE with receipt paths
- [ ] Decide Mogul decommission vs archive URL

## Open legal / compliance items
Mark each cleared only with counsel/processor evidence — not agent assumption.

1. **Chance-based / sweepstakes / gambling framing** — free-play vs paid spins; which jurisdictions; age gates; whether Mix is skill, promotion, or regulated chance.
2. **Music rights for downloadable / collectible tracks** — licensed libraries only; no unauthorized downloads; clear preview vs own vs stream.
3. **Living Artist Card likeness & bio** — Granada and future artists; artwork ownership; reverse-card biography accuracy.
4. **Revenue ledger 60/25/10/5** — parties, tax reporting, Stripe Connect / payouts, artist vs platform vs affiliate shares (PROPOSED).
5. **Maestro Credits** — stored value / gift card / virtual currency rules; refunds; non-cash-out language.
6. **100 free trial spins** — promotion terms; one-per-account abuse; no purchase-required where illegal.
7. **Responsible play enforcement** — 10 downloads/day CT, 3h/3h, no autoplay, self-exclusion; server-side evidence; cooling-off UX copy.
8. **Station plans $49/$99/$199 + 50 ReSingLab/90d** — Stripe products not created for Mix plans yet; do not advertise as live; airtime/quota metering gaps already noted in Bible commercial section.
9. **Buy station without winning spins** — separate from game odds; avoid “pay to win broadcast” misrepresentation.
10. **Mogul XP migration** — player notice, consent, and fairness if balances map into Mix tiers.
11. **Processor ToS** — Stripe (and any other) prohibited businesses for chance / virtual prizes.
12. **Gift-box inventory** — unreleased Suno twins + ≤5 past uploads; rights to gift/sell; see sibling PRD.

## Current live inventory (do not change without GO)
| Surface | State 2026-11-05 |
|---|---|
| `/play/` | Music Mogul via music-mogul.service `:3417`; assets `/opt/swadebase/mogul/current` → `34d85f6` |
| Homepage sticky | Links to `/play/` (Landing.tsx) |
| `/maestro-mix/`, `/legends-mix/` | **Not deployed** |
| Prototype zip | ChatGPT-only; not on SWADEBASE/GitHub |
| Mogul XP | Preserve until migration decision |

## Success criteria (later build)
- Free-play Mix reachable on `/maestro-mix/` without breaking Mogul `/play`.
- Responsible-play limits enforceable server-side before valuable rewards.
- Explicit cutover GO executed with backups + rollback proof.
- Bible/What’s New say LIVE only after verified receipts.

## Rollback
Docs-only this pass: restore Bible from `/opt/backups/maestro-mix-bible-20261105T151621Z/`. Future Mix route: remove nginx location; leave Mogul intact. Future `/play` cutover: restore nginx + Mogul service + current symlink from cutover backup.
