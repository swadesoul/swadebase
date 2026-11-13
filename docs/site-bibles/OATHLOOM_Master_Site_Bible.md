# OATHLOOM — Master Site Bible

## November 7, 2026: design instruction enforcement

**State: installed and source-verified at 2026-11-07T07:53:21Z; authenticated generation and desktop/phone visual acceptance remain unverified.** This record concerns the existing shared builder, not a new service or a certification of every Oathloom website.

Swade directed that the added design repositories and written documents must be embedded in the way Oathloom builds, with the managing bot checking their application. Each launch front page must retain its own brand and visual identity.

### Verified existing locations

- Site: https://oathloom.com (the browser reached the existing OnePass sign-in page).
- Developer Studio: https://swadebase.cloud/adapters/developer-studio.
- Running shared builder: `/opt/swadebase/docker/volumes/functions/oathloom-build/index.ts` in the existing edge runtime on Core.
- Before this release, the deployed builder matched `swadesoul/swade-ecosystem-hub/deploy/oathloom-build/index.ts` at baseline SHA-256 `4c324308ecb649d735ae8943879295b15108ebcfc077f892fa9192aa89c6c7bc`.
- Studio catalog: `services/swadebase-adapters/developer-studio/catalog.mjs`, runtime `/opt/swadebase-adapters/developer-studio/catalog.mjs`.
- The separate canonical application repository is `swadesoul/oathloom`. Its older builder at commit `ff39ac772dc8b2bb2fb6c465b77b7bab4ae3ad36` differs materially from production. Never overwrite the deployed handler with that older file: it lacks the current schema selection, Studio identity bridge, model routing and legacy-engine preservation. The hub is the deployment source for this scoped release; canonical pipeline reconciliation remains separate.

### What was actually connected before this release

The Studio catalog contained 37 entries: 34 styles from Beautiful HTML Templates, Aceternity Spotlight, 21st.dev discovery and FrontendSlides. Studio selection forwarded short instructions and URLs into Oathloom. The canonical repository also vendors Beautiful HTML Templates, FrontendSlides and Match-cut. Its generated skill catalog carried metadata and design-document paths, rather than the written recipe contents. Presentation-specific processing could replace HTML after the earlier model review. This source is not proof that those canonical hooks run on the current deployed handler.

### Shared design contract

Policy version `2026-11-07.1` is attached to ordinary builds and Studio work. It assigns responsibility to the existing Design DNA Director, Code Weaver, Quality Verifier and Repair Weaver. No extra agent, model provider, scheduler, database or service is introduced.

The code snapshot includes all 34 actual written recipe excerpts from the canonical vendored source, with source commit, path, hash and retained license. Each stored excerpt is at most 8,000 characters; prompts include at most 24,000 recipe characters total. These are bounded reference excerpts, not complete repositories or imported third-party component implementations. Full source and excerpt provenance are recorded in `docs/verification/oathloom-design-source-inventory.json`. There is no repository fetch during a build.

The Studio catalog remains the one maintained resource inventory. `scripts/sync-oathloom-design-catalog.mjs` generates the edge snapshot; its `--check` mode rejects stale snapshots. Explicit selection is limited to eight known catalog IDs. A new-site blueprint may select an appropriate recipe; otherwise it must explain its original brand-specific direction. Existing sites retain their established identity unless a redesign is requested.

Blueprint, code, continuation, review and repair receive the contract. A reference application plan identifies how the selected material fits the project. The final managing-bot check records:

- Brand identity and audience fit.
- Varied page composition and a coherent visitor journey.
- A purposeful interaction or visual moment.
- Responsive and accessible behavior.
- Actual reference application, including limitations.
- Source checks for a complete document, a main landmark and one primary heading, viewport, responsive rules, reduced motion, navigation targets, planned palette and basic SEO metadata.

A reviewer score alone cannot override missing checks. Repaired source receives a new review; an earlier verdict cannot certify changed HTML. A malformed/unavailable review or unresolved high/critical issue stops before project/file/version writes or automatic publication. Full review source is bounded to 120,000 characters; larger output is held instead of approving an unseen tail.

`quality_report.designAudit`, the saved manifest and the build result carry the policy version, catalog revision, applied IDs and result. `automated_pass` means source checks passed. `visualReview: pending` remains explicit until a separate real desktop/phone inspection is recorded. A model statement is not a screenshot, native Safari check or launch certification.

### Managing bot procedure

1. Load this Bible and the current requested site's brand/launch brief through existing authorized knowledge access.
2. Use the authenticated existing `oathloom-build` action `design_policy` to inspect the installed contract without a model call. Supply optional `resourceIds` from the controlled catalog.
3. Build with the existing verified identity and project ownership checks. Store recipe selection in `clarifications.studio_resource_ids` or `clarifications.design_resource_ids`; no caller can grant ownership or entitlements through these fields.
4. Inspect `quality_report.designAudit`. Resolve missing checks before release. Unsupported legacy-engine recipe requests are held before model calls instead of silently ignored.
5. Review the rendered desktop and phone page, primary action, navigation, assets and motion. Record actual evidence separately. Preserve Studio's explicit private-draft and publication boundary.

The fixed legacy renderer retains its existing content-edit path. Its final HTML/CSS/JavaScript receives review before persistence. Applying arbitrary new recipes requires a separate reviewed migration, preserving the existing page.

### Launch and paid-service decisions

The discussed launch concept remains a configurable four-to-six-week runway, Founding 100, five invitations per founding member, a product-specific 3–30-day allowance and short experience-feedback checkpoints. Launch pages use individual creative direction. No campaign, waitlist email or public launch was executed by this change.

Swade confirmed this service structure: basic page SEO for all sites; optional advanced SEO and map services as add-ons for free-plan customers; specified services included in paid-plan entitlements. The bot must check existing entitlements before proposing a duplicate charge. The discussed $5 feature-installation price is an example for costing and SKU definition, not a live checkout price. External recurring/metered usage requires explicit limits and disclosed pricing; an installation fee does not buy unlimited provider calls.

Reuse existing `swade-maps` first. Its registered service uses OpenFreeMap/OpenStreetMap, Photon/Nominatim and OSRM with caching and limits; its public health endpoint was observed enabled. That is not a complete customer API test. Monid's official documentation supports priced API discovery and execution, including map/listings tools; no connected Monid credential, installation or paid execution was established here. Model routing through OmniRoute does not establish map or SEO integration. Existing Stripe and OnePass systems remain the intended billing/access owners. This release embeds these constraints in build instructions but does not change checkout, prices, subscriptions or entitlements.

### Verification and recovery

The focused source suite passed 39 tests at the preparation checkpoint, using synthetic model responses and an in-memory database. It covers existing authentication/ownership, direct and Studio builds, real recipe text, automatic recipe selection, final-source review, bounded repair, invalid IDs, failed-review preservation, legacy handling and zero-cost policy diagnostics. The current deployed legacy renderer was imported into an isolated local check: its 37,091-character sample passed all eight applicable static source checks. No provider generation or customer project mutation was used for these checks.

Before installation, recheck the shared deploy lock, exact baseline source/catalog hashes and absence of running Oathloom builds. Back up the old builder, install the three data/policy modules and the handler, restart only the existing edge runtime, and verify public liveness/anonymous denial plus installed hashes. The runtime receipt records what actually happened. Rollback atomically restores the prior handler from backup and restarts the same runtime; the unreferenced new policy modules may remain for diagnosis. Failed recovery retains an active coordination lock. No schema migration, credential change or customer-data rollback is involved.

## November 7, 2026: Oathloom design contract installed

Release `oathloom-design-20261107`, policy `2026-11-07.1`, was installed at 07:53:21 UTC. Source is merged in [hub PR #55](https://github.com/swadesoul/swade-ecosystem-hub/pull/55), commit `53450c5c2344356484e1ecf9c77fa5de27bc4bd4`.

The shared Oathloom builder now receives bounded actual written excerpts for 34 template styles, drawn from the 37-entry Studio catalog. Blueprint, code, review and repair share a required project-specific design contract. A failed or missing final review stops before replacing project files or publishing. Repairs receive a fresh review. No extra model provider or agent service was installed.

Validation: 39 focused source tests passed; the actual legacy renderer sample passed eight applicable source checks; all four installed source hashes match the tested release. The live frontend returned HTTP 200 and the builder retained its HTTP 401 anonymous sign-in requirement after the scoped runtime restart. These checks made zero provider-generation calls. Authenticated generation, actual per-page visual acceptance and paid-service checkout remain unverified.

Swade confirmed: basic on-page SEO for everyone; optional advanced SEO/maps add-ons for free accounts; specified services included in paid-plan entitlements with no duplicate charge. The suggested $5 installation fee and ongoing provider usage must be treated separately. These constraints are now builder instructions; this release does not implement entitlement enforcement or change billing. The existing swade-maps service is enabled; no Monid installation or paid call was established.

Canonical operator detail: `site-bibles/OATHLOOM_Master_Site_Bible.md`. Runtime evidence: `releases/oathloom-design-20261107/runtime-receipt.json`. Backups precede changes. Do not describe `automated_pass` as desktop/mobile visual approval or a fully connected paid feature.


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

## Maestro Artist Studio — 2026-11-12T22:47:41.442621+00:00 / ChatGPT

LIVE: https://themaestroradio.com/artist-studio. Source e1618d31e9c860167baf901fda9c8f0e2459428b in /opt/work/maestro-growth-20261112, branch feat/artist-growth-20261112. Release /var/www/maestroradio-web/releases/20261112T224521Z-artist-studio; previous /var/www/maestroradio-web/releases/20261112T224344Z-artist-studio; backup /opt/swadebase/backups/maestro-artist-studio-20261112T224521Z. Owner explicitly requested implementation of the branded cinematic artist builder, references/prompt edits and connected promotion/identity workflow.

Reused existing OATHLOOM artist renderer/editor (04a6087), 34-look catalog, SWADEBASE identity/database, oathloom-upload/B2, Mailcow artist domain and Maestro host service. Native Maestro session; no OATHLOOM customer branding/link-out or frontend container replacement. Existing published HTML is unchanged. Full editor includes portrait/gallery/music/bio/consent, focal control, palettes/looks, ordered sections, desktop/phone preview, private drafts, atomic revisions, restore and unpublish. Draft name/image changes no longer leak through the public artist directory; existing page URLs stay stable. Prompt edits use only existing local Ollama llama3.2:3b with bounded inputs/output, concurrency/rate limits and sanitized structured style changes. No paid provider fallback. References provide image color sampling, not screenshot-to-HTML or visual model analysis; reference URLs are not included in public gallery, but underlying media URLs remain publicly readable through the established media service.

Published artist snapshots generate owner-scoped downloadable campaign drafts. This is NOT delivered advertising, directory submission, third-party signup or an activated external promotion network. No prices/subscriptions, payment flows, external messages or paid listing/model orders changed. A customer can activate a unique per-site artist alias on existing artists.swadesoul.com; TLS/API verification and readback confirm routing to the existing managed artist inbox. No new mailbox/password or catch-all is created, and foreign-account activation is denied. Existing Mail Center remains the operator inbox; third-party registrations still need provider eligibility/consent. Label team delegation and account-management integrations are not inferred from this release.

Verification: 15 Bun tests/52 assertions, Python alias safety/idempotence tests, actual local CPU-model structured response, TypeScript app typecheck, production build and Deno check; rolled-back PostgreSQL atomic publish/revision failure/privacy/grant tests. Browser fixtures at 1440/820/390 cover prompt/undo/reference uploads/draft settings/previews with no production writes. Actual live synthetic accounts via a temporary two-use invite tested sign-in, cross-account denials, save/reopen/publish/private draft/restore/unpublish, campaign snapshots and identity requests, real managed alias creation/readback/idempotence/tenant denial, B2 upload+byte readback+foreign-owner denial, desktop/phone signed-in and returning-session UI, anonymous sign-in gate and absence of builder badges. Fixture accounts/pages/invite/media/aliases removed; expected audit history retained. Physical iPad Safari and Harold's personal Google OAuth completion remain unverified. Existing public radio/education/pricing/planner/artist routes healthy; radio engine and shared edge runtime were not restarted.

During acceptance, fixed a local-model recommendation that could hide unspecified music sections; visibility now stays unchanged unless explicitly requested. Alias activation originally attempted an audit through a non-exposed database schema; corrected to existing Maestro audit_log and retested successfully. Do not claim per-artist mailboxes: these are unique managed aliases.

Source synchronization BLOCKED: automatic approval review rejected git push to configured origin because exact destination/branch authorization was not explicit. No alternate publication attempted. Tested code is committed locally on the server; not on GitHub main. Require explicit owner approval to push these implementation commits to swadesoul/swade-radio, branch feat/artist-growth-20261112. Future builds must preserve this live source until synchronization/merge is approved; building an older main would remove the editor.

Rollback: restore previous Maestro current symlink and backed-up artist-site/_artistsite/factory.py/artist_design.py/artist_identity.py files; restart maestro-factory only. Preserve additive revision/design/campaign/identity tables and customer records. Review concurrent changes before source restoration. Mail aliases already activated are real identities; do not delete customer aliases during rollback. See ARTIST_STUDIO_RELEASE.md, deploy-artist-studio.py, deployment.json, studio-ui-report.json, studio-live-report.json and studio-live-browser.json in the workspace. No broad rollback of older artist-page snapshots is authorized.
