# SONIKYN Master Site Bible
Version 0.1 — 2026-11-03 (America/Chicago)
Status: documentation initialized; current production state not fully verified.

## Project identity
- Brand: SONIKYN
- Public domain: https://sonikyn.com (production routing not reverified in this session)
- Source of truth: private GitHub repository swadesoul/sonikyn (default branch main).
- Shared infrastructure: SWADEBASE for identity, adapters, data permissions and operational records; SSSBrain for agent coordination.
- Founder rule: every SONIKYN feature, fix, API, design, configuration and deployment change MUST be entered in this Bible in the same session. Back up the prior revision; record date, acting agent, files, tests, deployment status and rollback. Update the SWADEBASE Bible for shared behavior changes.
- Keep secrets out of this file.

## 2026-11-03 — Public homepage operational health registry removal
- Request: remove the operational control panel / health registry from SONIKYN public front page, but preserve existing backend health monitoring for authorized administration and SSSBrain.
- Source observed: src/pages/Index.tsx renders src/components/cinematic/SonikynFilm.tsx. That film currently imports and renders EcosystemRail from src/components/swadebase/EcosystemRail.tsx. EcosystemRail displays SWADEBASE control-plane, adapter registry and other connector probe results to public visitors.
- Intended minimal change: remove EcosystemRail import and render call from SonikynFilm only. Preserve component, adapters and admin routes. Preserve cinema, artist CTA and site navigation.
- State: source verified; repository change and production deployment pending until separately recorded and verified.
- Acceptance: homepage contains no 'Wired to SWADEBASE' or connection health statuses; authorized admin health checks stay functional; no homepage regressions.
- Rollback: revert the SONIKYN GitHub change to SonikynFilm.tsx and redeploy after deploy lock, approval and backups.

## 2026-11-03 — Fake Name Generator / social marketing
- User reports Fake Name Generator API credential added to Coolify; actual environment scope/availability and API test not verified.
- Concept: artist-facing persona and social profile management within SONIKYN; reuse SWADEBASE identity/adapter services and SSSBrain marketing orchestration.
- Public accounts require legitimate owner-managed setup and platform-compliant fictional/virtual identity disclosures; no fake-user registrations, impersonation, or engagement manipulation.
- Status: proposed, NOT deployed. Before building audit existing identity/character systems, runtime deployment and social integrations. Keep credentials server-side only.

## Architecture and current evidence
- GitHub inspection on 2026-11-03 confirmed SONIKYN's homepage and an existing AdminEcosystem component at src/components/admin/AdminEcosystem.tsx.
- SSSBrain ecosystem API docs and server-side health paths exist in repository. Presence in source does not establish live end-to-end health.
- SWADEBASE policy: build-first reuse, no duplicate service, explicit founder approvals, no external spending by default, deploy lock and verified release checks.

## 2026-11-03 GitHub follow-up
- Public rail-removal branch committed: 0771f9acebb11f038490eaf5cc96047cb58d1ec0.
- Repository Site Bible committed to same branch: ef89bf175f68187b899715e313729785425b2f46 at docs/SONIKYN_Master_Site_Bible.md.
- Open PR: https://github.com/swadesoul/sonikyn/pull/12. Not merged or deployed. PR API returned mergeable=false; diagnose checks/conflicts before any merge.
- Audit of 13 pre-existing SONIKYN branches compared to main: eight diverged with ahead commits; five were entirely behind main. Ahead commits do not establish that work is incomplete or appropriate to merge. Review selectively before actions.


## Cinematic artist-page rollout — 2026-11-10T23:47:57.477964+00:00 (2026-11-10 17:47 CST; ChatGPT)

**Public pages LIVE; owner dashboard STAGED.** Founder requested an individual page for every existing artist using uploaded imagery with varied cinematic backgrounds. The existing OATHLOOM artist-site renderer, SWOSTing fallback routes, SWADEBASE records/auth and native storage were reused. No second service, database, paid model on page views or scheduler was added.

49 canonical page records now exist: 17 published and 32 private drafts, with 75 links to existing platform identities. Public directory: https://swosting.com/artists. Eight cinematic palettes, integrated artist portrait, actual available tracks, one persistent audio element, editorial biography, approved video links and artist connections. Empty sections are omitted; no fabricated subscription form, songs, statistics or badges. Existing explicit legacy design looks remain supported; cinematic palettes are server-renderer defaults.

Nevaborya uses the founder-uploaded purple-suit reference through a separate identity-preserving cinematic derivative. Her original remains unchanged. Royal Banks and Rivan portraits were recovered from their existing public source assets and copied into native storage. All three selected page portrait variants also have verified durable copies through the existing B2 media core; protected receipts are in the backup folder. Old source assets and original artist records were preserved.

55 recordings returned HTTP 200 from native artist storage. Six published-title references with absent exact recordings retain external artist links rather than false direct play controls or substituted mixes. Thirty-two drafts remain unpublished: 18 private/incomplete SONIKYN records, ten Maestro artist records without a usable portrait, three inactive creator records and the ReSingLab Royal entry whose portrait/canonical Royal Banks linkage is not verified. No other user's private references were published.

Source: swadesoul/oathloom branch feat/cinematic-artist-rollout-20261110. Public renderer/rollout c50aae9 (initial faaa832). Owner inventory, draft reopen endpoint and matching preview built at c2298e5; image oathloom-frontend:c2298e5-cinema. Automatic approval review REJECTED the attempted OATHLOOM frontend container replacement plus production artist-site handler update, citing service-disruption risk beyond explicit artist-page build approval. That call did not execute. Owner inventory/load action remains staged; live frontend remains oathloom-frontend:8f745eb-artists. Do not describe its new inventory or preview as shipped. Existing public pages and directory are already independently live.

Validation: 8 Bun tests / 29 assertions; Deno handler typecheck; successful production frontend build; 34 real public Chromium layouts at 1440/390px with no overflow, broken displayed image or page exception; all 49 URL visibility checks (17 HTTP 200, 32 HTTP 404); directory lists exactly 17 pages. Actual audio decoded/advanced and paused on Nevaborya, Granada and Reggie. Staged owner UI fixture passed at 1440/820/390px with no production writes forwarded. Fixture auth is not real Google/owner login certification; native physical iPad Safari and authenticated owner inventory lifecycle remain unverified.

Recovery: protected baseline, initial table/link snapshots, runtime function copies, rollback-initial.sql, next-phase rollback.sql, immutable source, image receipts and test reports at /opt/swadebase/backups/artist-cinema-20261110. Review for edits since rollout before any rollback. To undo public rollout, restore the backed-up artist-site/_artistsite sources and reconcile/restore initial page/link snapshot using rollback-initial.sql; preserve new customer edits and durable media. Do not execute the staged OATHLOOM frontend swap without approval of that exact live switch. No DNS, payment, radio-engine or shared edge-runtime restart occurred. Full receipt: releases/2026-11-10_Artist_Cinematic_Pages.json.


### Owner editor reconciliation checkpoint — 2026-11-10T23:55:56.095752+00:00 (ChatGPT)

The newer upstream cinematic editor ef1371f was found on feat/builder-studio-layout and preserved. Draft/revision/restore controls were reused instead of replacing them with a second inventory. Source conflicts are resolved in 6ecbace; phone-width chooser fix and template compatibility tests are in **04a6087**, draft PR https://github.com/swadesoul/oathloom/pull/45. Source-only renderer compatibility keeps the existing cinema-* pages on their current stored design, and an explicit v2 upgrade retains their colors. The initial rollout renderer is isolated in _artistsite/rollout.ts; the upstream cinematic.ts remains intact.

**Prepared candidate supersedes c2298e5:** oathloom-frontend:04a6087-cinema. Production build, Deno typecheck and ten Bun tests /33 assertions passed. Reconciled owner chooser, draft reopen and preview passed 1440/820/390px browser fixtures with zero forwarded production writes, no overflow or script exceptions. The v2 additive revision migration passed in a rolled-back transaction: 17 existing published HTML snapshots matched byte-for-byte, revision table RLS was on and anonymous SELECT was denied. No revision schema was activated in production.

The public directory and 17 published/32 draft records remain as recorded above. OATHLOOM live frontend is still 8f745eb; automatic approval review blocked the live replacement. The only pending approval is the exact tested artist-management rollout: additive revision-history schema, reconciled function/template files and the staged OATHLOOM frontend switch. Do not execute it through an alternate path while blocked. Owner login completion, customer publishing/restore lifecycle and physical iPad Safari remain unverified.
