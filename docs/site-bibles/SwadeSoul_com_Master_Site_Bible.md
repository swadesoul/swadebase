# SwadeSoul.com — Master Site Bible

**Domain:** https://swadesoul.com (canonical brand domain)
**Source:** GitHub `swadesoul/swade-ecosystem-hub` (source of truth). Lovable project `17b4801e-07f8-4a4f-8d0b-d301357ba95c` ("Swadesoulpro") syncs from GitHub and serves the published site; no Lovable AI credits are used for builds.
**Backend:** SWADEBASE (self-hosted Supabase on Hostinger). Storage: Backblaze B2 for media.
**Owner / super admin:** Harold Whaley Jr. (swadesoul@gmail.com), founder exemption per standing rule 21.
**Repo copy:** `docs/site-bibles/SwadeSoul_com_Master_Site_Bible.md` in swade-ecosystem-hub (kept identical).

## Version history

| Date (America/Chicago) | Who | Change | Rollback |
| --- | --- | --- | --- |
| 2026-11-15 | Claude (Opus 5.5), Swade chose option 3 | Motion toggle: effects follow Reduce Motion by default; "Motion on/off" button (bottom-left) lets visitors opt in or out, remembered per device. PR #71 (merge 074a01c), deployment 067d4252. Replaces the always-on behavior of PR #70 after a Codex accessibility finding. | Revert 074a01c and republish. |
| 2026-11-15 | Claude (Opus 5.5), owner-reported bug | Scroll fix: scroll-scrubbed effects now run with Reduce Motion on (PR #70, merge a5ba83c, deployment 8d810039). Verified in headless Chromium with and without reduced motion. | Revert a5ba83c and republish. |
| 2026-11-15 | Claude (Opus 5.5), approved by Swade | Systems homepage: new positioning, SSS Brain pinned story, 3D platform ring, 10-act film section, artist lineup, founder story, OnePass rewrite, contact paths, 35 transparent platform logos. PR #69 (merge 6a0119e), CI build check added. | Revert merge commit 6a0119e on `main` and republish; the previous homepage is fully restored (old components were not deleted). |

## Purpose

The front door of the Swade Soul ecosystem. Positioning: "We build the systems that run the whole game." SSS Brain is the centerpiece; the record label (Swade Fam, Freq Fam) is shown as proof the systems work.

## Homepage structure (src/pages/Index.tsx)

1. Navbar + HeroStrip ticker (items from `src/data/platforms.ts` `tickerItems`)
2. Hero (studio photo, wordmark, studio player and battle modes from `site_settings.hero_mode`, unchanged mechanics)
3. VelocityBand — scroll-velocity word band + streaming logo wall (opens EcosystemDrawer)
4. BrainStory (`#ss-brain`) — pinned 300vh on md+; panel tilts flat, steps light up
5. HomeGuideSection (`#ss-guide`) — existing "Talk to Swade Soul" chat, the live demo
6. PlatformRing (`#ss-layers`) — every platform on a 3D cylinder; scroll turns it (pinned 400vh on md+), arrows and 7 layer chips steer it; tap opens EcosystemDrawer
7. ExplainerFilm (`#ss-explainer`) — 10 acts from the explainer outline; plays the current YouTube explainer (TMP57RKosDU) until the new film is cut; artist-journey strip
8. ArtistLineup (`#ss-artists`) — scroll-lit text reveal + drifting lineup of the 11 artists; opens the existing ArtistDrawer
9. SwadeFamSection, FreqFamSection (unchanged)
10. FounderStory (`#ss-founder`) — founder portrait, facts, founder-film slot ("coming soon")
11. FounderSection (`#founders`, founders program, unchanged)
12. OnePassSection (`#onepass`) — Google sign-in → `/onepass/signin`, create → `/onepass/signup`
13. ContactPaths + existing ContactSection (`#contact`)
14. Footer (radio link now themaestroradio.com)

Full directory: `/ecosystem-library`.

## Platform registry

`src/data/platforms.ts` is the single list for the logo wall, ring, drawers and ticker (35 platforms, 7 layers). Flagships: SSS Brain, ABAGALE TV, The League Sound, Publiswade. Logos live in `src/assets/eco/` (transparent WebP, 480 px; full-quality PNG pack delivered to Swade for SWADEBASE storage bucket `swadesoul-site/ecosystem-logos/`). Phase 2 (planned, not built): move the list to a SWADEBASE `ecosystem_sites` table with status/health checks and MCP tools.

## Scroll and motion

framer-motion `useScroll`/`useTransform`; no new dependencies. Motion follows the visitor's Reduce Motion setting by default (`src/components/home/motion.tsx`). A "Motion on/off" toggle (bottom-left) lets anyone switch scroll effects on or off; the choice is stored on the device (`localStorage` key `ss-home-motion`). With motion off: no pinning, no scroll-driven movement, no ambient animation (ticker, logo wall, Ken Burns, pulse); the ring turns with arrows and layer buttons, the logo wall and word band wrap, the artist row scrolls by hand. Pinning applies on md+ screens only.
Verified live 2026-11-15 in headless Chromium: normal = ring turns 01->18->33; reduced = no pin, ring static, toggle reads "Motion off"; reduced + toggle on = ring turns, choice survives reload.

## Compliance notes

FinCEN wording removed from the page title, meta description, OG/Twitter tags and schema only. Remaining mentions for attorney review (unchanged): `Footer.tsx` lines 15 and 53, `pages/Guide.tsx` lines 89 and 319, `pages/About.tsx` line 193.

## Tests and verification (2026-11-15)

- GitHub Actions `Build check` (`.github/workflows/build-check.yml`): type-check (0 errors repo-wide), production build, no Lovable badge in output, vitest 6/6 passed.
- Merged as PR #69 (merge commit 6a0119e) at about 10:04 AM CT. Lovable synced from GitHub; published with deployment f541ca33-38a9-407a-8088-f255fd0d9cbe (no AI credits used).
- Live check from SWADEBASE primary at about 10:09 AM CT: swadesoul.com returns the new title; its x-deployment-id matches f541ca33; the live bundle index-DmDkcany.js contains all new sections; a platform logo asset returns HTTP 200; no "Edit with Lovable" string.
- Not yet verified by a person in a browser: visual layout, scroll behavior, iPad Safari (rule 6). Deploy lock taken 16:02Z and released after the check.

## Known gaps

- Founder film and the new 10-act explainer are not produced yet.
- OnePass hub/central sign-in (PRD Addendum 2) is not built; buttons link to the existing OnePass pages.
- Registry is still a code file, not the SWADEBASE table.

## SWARVISTEACH ecosystem link — 2026-11-16 (ChatGPT)
Owner directed that SWARVISTEACH use swarvisteach.live and primary contact info@swarvisteach.live and appear in the SwadeSoul.com ecosystem. Existing src/data/platforms.ts already contained the swarvis media/education record and brand logo. Updated that record's URL and description in swadesoul/swade-ecosystem-hub main commit 22ae749b8d0513571a27e2d4ec20dd043a0ff8e6; no new site/category/logo was created. Source write confirmed; the published SwadeSoul.com update has NOT been independently verified, and no site rebuild was triggered here. Rollback: revert the one-record platform registry change in the cited commit. The domain presently points to Namecheap parking A 192.64.119.99, with registrar MX eforward hosts. Domain-to-Coolify deployment, TLS, DNS cutover, mailbox provisioning, inbox delivery and verified SSS Brain integration are NOT complete. Keep contact email as planned primary until Mail Machine/Mailcow mailbox and DNS are verified. No spend or outgoing email.
