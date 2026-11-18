# REA ("Reverse Engineer Everything") — capability report

Checked Friday Oct 30, 2026, ~5:15 AM CT, by Grok Bot (Big Mamma executor, voice call-79d4cce7).
Sources: GitHub swadesoul (swadesoul-app-store, sssbrain, oathloom, swade-ecosystem-hub), SWADEBASE server
(`/opt/swadebase/docs`, `/opt/swade-app-store-api`, supabase-db `public.rea_*` tables), and the live endpoints.

## Current state (corrects the Oct 24 memory)
| Piece | State now |
|---|---|
| REA Lab + Site Blueprint pipelines | **Merged** (swadesoul-app-store PR #1, Oct 24 1:52 AM CT) and **live**: `swade-app-store-api.service` on SWADEBASE, `https://appstore-api.swadebase.cloud/api/health` → 200 |
| REA owner console | **Live** at `https://swadebase.cloud/rea/` (PRs #5, #7; SWADEBASE super-admin sign-in) |
| SSS Brain REA panel | **Merged** (sssbrain #88/#89): Systems → "◎ rea lab", owner only |
| "Build this" (adapter `rea.build`) | Merged (PR #6). Creates a build brief only. `REA_BUILD_DISPATCH_ENABLED` is now `true` in the env file, but the code still only marks briefs `queued` — there is no executor, and `swadesoul.agent_handoffs` still does not exist. 3 briefs total, all from Oct 24 test runs, all `ready`. |
| Usage | 10 REA runs total (all `passed`): 1 real one (harvey.ai, Oct 26), the rest are example.com/.org/.net tests. 1 Site Blueprint (example.com). |
| AI behind it | The latest run recorded `{"provider":"ollama","fallback":true}`, meaning it fell back to the built-in rules instead of an LLM. |
| Living Blueprint | **Still unmerged**: oathloom PR #3 and sssbrain PR #36 (on #35), all OPEN |
| Codebase X-Ray | **Live** in sssbrain (`/doctor` → "Codebase X-Ray · owner view · static first", operator-only) |
| Site Bibles | **Already a working practice.** 14 Master Site Bibles in `/opt/swadebase/docs/site-bibles/` (SWADEBASE, SSS Brain, Brainiak, GroundLift, PET MUZIK, Maestro Radio, SWOSTing, Asset Machine, Asset Review, Cochrane, Leslie Beckett Samuel, MCP Actions, MCP Studio, OpenHands), plus SwadeMail and SWADE Soul World in the hub. Standing rule 17 requires every change to update its Bible. The SWADEBASE MCP has `swade_get_site_bible`. Agents write these by hand; no generator exists. |

## 1) What REA actually does
**Input:** a URL or bare domain on *someone else's* site, plus a feature name. The prompt template is "Understand how [feature] works in the [site] app. Show me the evidence and build a similar feature for my project." A screenshot is optional. You can start one from the REA console, the SSS Brain panel, or `POST /api/rea/intake`.

**Pipeline** (each step saves a hash-stamped receipt in `rea_receipts`): capture → score → gap → build → verify → record.

**Outputs** (columns on `rea_runs`):
- `capture` / `score`: the page's structure and the capabilities it found (hero block, pricing table, sticky CTA, 9:16 layout, and so on).
- `gap` / `spec`: a JSON list of capabilities that **OATHLOOM's own codebase** is missing, with target files (for example `shared/oathloom/render/document.mjs`), implementation notes and acceptance checks. It also lists what OATHLOOM already has (`builtOn`).
- `artifact`: a generated HTML/module prototype of that feature.
- `verification`, plus a `narrative` of 1–3 short sentences. Example from the harvey.ai run: "A heading stack gives the page a readable order. Short forms are easier to finish in a portrait layout…"
- Optional `rea_builds` brief, which is the JSON handed to a future coding agent.

Site Blueprint (the same service) turns an outside page into a portrait, mobile-first site blueprint: sections, palette, fonts, empty slots for images.

## 2) Does it produce human-readable documentation?
**Barely.** The output is mostly JSON for a coding agent: capability IDs, file paths, acceptance checks. The only prose is the short `narrative`. The console shows status, receipts and the evidence trail. It never writes a plain-language document that explains what a site is, who it's for, or how to use it.

## 3) Does it fit plain-language site Bibles for each Swade site, for non-technical users?
**No.** It's built for a different job:
- It studies **outside** sites to copy a feature. It does not document **Swade's own** sites.
- Its gap analysis compares pages against the **OATHLOOM** codebase, not against the site you point it at.
- It reads only the public page (one capture). It can't see sign-in-only screens, the database, payments, agents or the code.
- Its output is aimed at engineers (JSON spec, file paths), and the AI step is currently falling back to rules.
- What it does well that's worth reusing: capture with hash-stamped evidence receipts. That pattern fits a Bible's "verified on <date>" claims.

## 4) Recommended approach: a dedicated "Site Guide" generator on top of the existing Master Site Bibles
Swade already has the right raw material: the Master Site Bibles. They're accurate, and each claim carries a source tag ([LIVE]/[DB]/[CODE]/[PRD]). But they're written for agents, and only about 16 of the 60+ ecosystem sites/schemas have one. So:

1. **Keep Master Site Bibles as the source of truth** (rule 17 already keeps them current). Don't fork a second set of facts.
2. **Build a small `site-guide` generator**, ideally as an SSS Brain / SWADEBASE adapter (`site.guide`). Per site it:
   - reads the Master Site Bible (via `swade_get_site_bible` or the file),
   - adds facts from **Codebase X-Ray** (routes, integrations, env names only, never values) and a live check (headless render plus screenshots of the main pages, saved with REA-style hash receipts),
   - writes a **plain-language Site Guide** at a 6th–8th-grade reading level: What this site is · Who it's for · What you can do today (live) vs. coming soon · How to do the top 5 tasks, step by step with screenshots · Who to contact / what to do when something breaks · Glossary. Anything unverified is marked "Not confirmed yet".
   - Output: `/opt/swadebase/docs/site-guides/<Site>_Site_Guide.md` (+ PDF/HTML), mirrored to the hub, and optionally shown in SSS Brain next to the Bible.
3. **Generate Master Site Bibles for sites that don't have one yet** with the same read-only research recipe agents already use (GroundLift v1.0 is a good template). Then generate their guides.
4. **Refresh automatically:** whenever a Master Site Bible changes (rule 17), regenerate that site's guide. Optionally a weekly timer re-runs the live check and flags drift.
5. **Living Blueprint** (still unmerged) is the investor/explainer *visual map*. Once merged it can link to each Site Guide. On its own it isn't a written manual.
6. **REA stays what it is:** a competitor/feature study tool. If wanted later, its capture stage could be reused for the guide's screenshots.

Effort estimate: one cloud coding agent can build the generator (a script plus an adapter manifest) in about a day. Writing missing Bibles is per-site research, roughly 30–60 minutes of agent time each.

## Voice-ready summary
REA is live on SWADEBASE and in SSS Brain, but it's a tool for studying *other people's* websites. You give it a site and a feature, and it captures the page, saves evidence, and writes a technical build plan for what OATHLOOM is missing. Its output is mostly code-style data for a coding agent, with only a line or two of plain English. So it isn't a good fit for plain-language guides to your own sites. The better path is to build on the Master Site Bibles you already keep for about 16 sites, and add a small "Site Guide" generator that turns each Bible, plus Codebase X-Ray and live screenshots, into a simple how-to guide anyone can read. It would refresh automatically whenever a Bible changes, and we'd write Bibles for the sites that don't have one yet.
