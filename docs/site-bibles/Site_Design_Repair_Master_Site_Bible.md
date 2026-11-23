# Site Design Repair — Master Site Bible

Updated: 2026-11-19. Canonical operating summary; detailed procedure: `SITE_DESIGN_REPAIR_PLAYBOOK.md`. Preserve existing site-specific Bibles and verified capability limits.

## Release status

| Area | Verified state |
| --- | --- |
| Actual local runtime | 17 checks passed against PostgreSQL, installed Ollama models and SSS Brain; real local conversation/design work, source versions, protected files and owner isolation verified. No site published by that acceptance run. |
| Secure UI integration | Real shared navigation and 1440/390px Chromium layout verified with synthetic backend fixtures; separate from runtime acceptance. |
| Private history | All 25 supplied owner requests imported into three owner-scoped SSS Brain records; readback passed. Private contents and identifiers are not part of this Bible. |
| SWAGENTS visual release | Deployed 2026-11-19 22:10:23Z; amended 22:13:06Z. Public 24/24 files matched. Final manifest SHA-256: `ee2ad34238ea6faac29a86a050567285b80f07b61371efb161ba7212bfa59577`. |
| Hub production integration | **LIVE:** `2026-11-19T22:15:17.239543+00:00; final preview/source-check correction activated 2026-11-19T22:43:07.343624+00:00`; verification `LIVE; health 200; final 19/19 authenticated public HTTPS checks passed at 2026-11-19T22:43:17.717568+00:00, including actual scanner, saved workspace, isolated artwork/font preview, source classification and SSS Brain receipts; 318 references verified, 0 failed, 44 runtime/external references explicitly require live review; 17/17 real database/local-model/memory acceptance checks passed`; receipt `/opt/swadebase/ops/site-design-repair-20261119/ADAPTER_DEPLOYMENT.json, PREVIEW_SOURCE_FOLLOWUP_DEPLOYMENT.json and PUBLIC_HTTP_ACCEPTANCE.json`. Actual authenticated public-route acceptance is recorded in the release receipt. |
| Source delivery | Dedicated branch + draft PR; no main merge or whole-tree deployment. Hub: `site-design-repair-20261119`, `3a996fb5c363a4de1be468906beda4f5a2d2b34d`, `https://github.com/swadesoul/swade-ecosystem-hub/pull/75`. SWAGENTS: `cinematic-ui-20261119`, `129d682ba4c8debd6dd81353f807161ef7972b1a`, `https://github.com/swadesoul/swagents/pull/1`. |

## Purpose and entry point

The **Swade Site Design Repair** adapter (`site-design-repair`) provides one private existing-site workflow: choose a registered site, resume its design conversation, prepare a visual draft, inspect pages/versions, and review release to its existing domain. Entry: `https://swadebase.cloud/adapters/site-design-repair`, in SWADEBASE Web Family navigation. Final live availability is governed by the release-status row above.

The signed-in current super-admin and enabled adapter-registry checks apply to every hub page, asset and API request. Pausing stops new hub requests; it does not cancel dispatched jobs or disable independent tools.

## Connected source and workflow

The dropdown uses `swadebase_ops.mail_machine_registered_sites()`. An entered HTTPS origin must resolve to that registry; it is not an arbitrary fetch target. Source is available through the fixed SWAGENTS public-file mapping (45 text files at acceptance) or an existing owner-held Oathloom project whose verified origin matches. Other registered sites may keep a conversation, but generation stays unavailable until a reviewed source mapping exists.

One private project per owner/origin reuses Oathloom projects, files, versions and Developer Studio operation receipts. Keyed message and design-work requests are idempotent. Opening/selecting a project does not dispatch work. Explicit work creates a bounded local job, before/after versions and a durable outcome. Private previews, source checks and conversation export are distinct from production acceptance.

Managed projects record their production target and `releaseDestination: existing-site-reviewed-release`. Generic Studio chat, work, GitHub, deploy and rollback dispatch reject these projects. Ordinary Studio projects retain their behavior. Use the dedicated workflow and the site's verified release path.

## Actual Impeccable and other resources

Upstream `https://github.com/pbakaus/impeccable` is installed at `/opt/swadebase/vendor/impeccable`, commit `d41d9860b0094dcb68030657da63461212835aaa`; package 4.9.2, native engine 0.1.25. Binary SHA-256: `f48aca43294a9ba1ea3eb7b1d0a0b2d595c480e8c65003e410247b9884820ddd`.

The actual deterministic `detect` checker reports findings; an agent applies guidance and verifies rendering. Current service scan targets are fixed SWAGENTS homepage and Support sources. Project source checks are a separate operation. Native scans accept no arbitrary paths, URLs or commands: 5 MiB source/4 MiB output, 20-second deadline, two global/one-per-actor concurrency, no waiting queue. The root-owned helper verifies the executable descriptor, requires no-new-privileges and socket/io_uring network denial, uses a fresh private source snapshot and removes it afterward. Exit 2 means findings, not a crash.

The catalog also references existing Studio templates (34 styles in one collection), Frontend Slides, Aceternity Spotlight, 21st.dev, bounded Browser/Site Checker and Repair Kit destinations. Taste Skill, ScrollCraft and Elaya entries are source references with unverified runtime adoption. Listing a reference neither installs nor executes it.

## Source-review and preview accuracy

Literal source references are checked against the imported snapshot and the fixed SWAGENTS public directory/verified route map. Unknown assets and routes still fail; auth, external and generated references are explicitly `needs_live_review`. The static result is separate from live review, and each concurrent check updates its own exact owned receipt after a source-hash check. This resolves the original generic checker’s false missing-file reports for existing assets and server routes.

The opaque private preview embeds approved local fonts and existing static raster artwork in transient copies using bounded, no-follow reads and format validation. This preserves the actual typography, logo, leaders and cinematic scene despite the original public assets’ cross-origin protection. Stored source and SWAGENTS headers are unchanged. Live account/API actions remain disabled in the preview.

## Local generation and privacy

Existing loopback Ollama and already-installed models provide conversation and bounded design recipes. No model download, external-provider fallback or new GPU is required. Accepted receipts show `local_ollama` and zero external model spend; infrastructure still has operating costs, and no ChatGPT usage-percentage guarantee is made.

Validated recipes expand deterministically into a dedicated stylesheet and marked HTML links. Models cannot provide executable HTML/scripts/CSS, paths or commands. The worker rechecks ownership, source hashes and protected JS/JSON/SVG before atomically committing versions and outcome. This creates a multi-page visual draft, not arbitrary functionality or guaranteed finished cinematic art direction.

The narrow `swadebase_ops.site_design_repair_save_memory` function checks current role and project/operation ownership, then upserts allowlisted conversation/outcome fields into existing owner-scoped SSS Brain source, knowledge and wiki records. Operation idempotency prevents duplicates. It excludes source snapshots and unrelated result fields. Copied conversation remains private; the function is not a general secret redactor, so keep secrets out of design messages. The UI claims synchronization only on a successful receipt; project history survives a mirror failure and completed unsynchronized operations receive bounded retries.

Separate tenant databases remain held with `tenant_memory_bridge_required`; the primary-database implementation does not pretend to write to them. Shared Bibles contain reusable instructions, not transcripts or private account/project identifiers. Indexed memory does not retrain model weights or guarantee automatic retrieval by future ChatGPT sessions.

## Release boundaries

Preserve logos, characters, voices, navigation, content structure, working controls and customer data. SWAGENTS retains all pages, six Support categories and its conversation/plan/activity/email/browser drawer. Telephone execution remains off; automatic customer-account writes remain off. Customer browser reads require explicit approval and customer-handled sign-in/MFA. Specialist email approvals remain intact. Physical Safari/iPad microphone behavior is not tested.

Read current affected Bibles, hold the site deployment lock, capture a fresh live baseline and replace only reviewed paths with immediate hash guards, backups and guarded rollback. SWAGENTS scope is 23 HTML/CSS files plus one scene image; scripts/backend/customer records are untouched. Hub integration restarts only `swadebase-adapters.service`. Never deploy the older repository tree over the live adapter directory or run its legacy whole-directory `rsync --delete` release script. Submit source on reviewed branches with draft PRs.

## Evidence and learning

- Actual runtime: `/opt/swadebase-adapters/var/site-design-repair-runtime-acceptance.json`.
- Private history import receipt: `/opt/swadebase-adapters/var/site-design-repair-owner-history-import.json` (restricted; do not publish its contents).
- Memory migration/canary: `/opt/swadebase/ops/site-design-repair-20261119/MEMORY_INSTALL.json` and `MEMORY_ACCEPTANCE.json`.
- Secure hub UI: `/opt/swadebase/ops/site-design-repair-ui-integration-20261119/QA_RECEIPT.json`.
- SWAGENTS release: `/opt/swagents/cinematic-stage-20261119/CINEMATIC_UI_MANIFEST.json` and `CINEMATIC_UI_DEPLOYMENT.json`.
- Rendered and voice evidence: `/opt/swadebase/ops/swagents-cinematic-review-20261119/output/`.
- Native scan/classification: `/opt/swadebase/ops/site-design-repair-20261119/SWAGENTS_CINEMATIC_FINAL_CLASSIFICATION.json` and `FINAL_ACCOUNT_DETECT_RECEIPT.json`. The full scan had reviewed notices; do not claim zero warnings across the entire site.

After installing this Bible, related append blocks, playbook and dated learning checkpoint, run the existing free index `/opt/swadebase/ops/knowledge-learning/sync.py` and verify indexed paths/content hashes. Keep this summary bounded for the 250 KB index; large receipts and private history stay at their evidence paths.


<!-- swagents-character-identity-20261119:start -->
## Preserve the working character editor — November 20 UTC, 2026

The SWAGENTS source binding expands from 45 to **49** files by adding `kin-appearance.js`, `kin-appearance-profiles.js`, `kin-appearance-cast.js` and `kin-appearance-store.js`. The existing dependency checker resolves these imports from the private snapshot; no new runtime capability or external fetch is introduced. All four modules enter the protected-file manifest.

The exact deployed character repair is selected as private version **7**, source hash `877877d76ad2ea63dc19b8b499fbe5a9ff25dffdf6fc826d664e5bd813d9afa9`, release manifest `710c130d3a550a7c5db16bb6c3d41c0394d8d64873412df1d7469da55138d61b`. The guarded save required selected predecessor version 5 / `7438474a737ead706526fe510b39069bbfdac0fa388cd9ecca4bc7d6069c5a3f`, no competing design job, successful public-byte verification, and the installed 49-file binding `943ddc0e0c9bb76b9bef07b7c03fb28e4e05846bf227f2a1313b8f95ee1ebf79`. A transaction retains the previous snapshot, saves the reviewed source, and records the owned operation before mirroring it to SSS Brain. The save runs no model and publishes no site files.

Future visual drafts must retain these modules and the identity-preserving interaction. A missing colour layer keeps approved art visible. Source preservation checks must cover both imports and behavior; a screenshot showing the correct initial portrait does not prove that later colour edits preserve it.

**GitHub publication is pending explicit user approval.** The live repair and private source/memory save are complete. Automatic approval review rejected publication of the concrete files to the named repositories. No new trees, commits, branches, ref updates or pull-request changes succeeded. Eleven unreferenced image blobs from already-public scene assets were created before rejection. Both main branches and the existing source branches remain unchanged; the proposed SWAGENTS repair branch is absent. The existing hub PR75 does not contain this follow-up. No retry or alternate publication route was attempted.

Automatic approval review — SWAGENTS (verbatim evidence from the pinned blocked receipt):

> This action was rejected due to unacceptable risk.
> Reason: This action publishes 26 source, test, documentation, fixture, and image payloads—including material derived from local and remote/private sources—to the public GitHub repository `swadesoul/swagents`; although the transcript contains assistant/root planning and release-gate approval, no trusted end-user message explicitly authorizes publishing these identified files to this destination, so the sensitive publication egress must be denied.
> Do not bypass this rejection through a workaround or indirect execution. Continue with a safer alternative, or carry out checks to prove that the action is authorized or low risk before trying again. Complete unaffected work without asking for confirmation. Report anything that remains blocked, clarify why it was blocked by auto-review, inform the user of the risk and ask for approval.

Automatic approval review — SWADEBASE hub (verbatim evidence from the pinned blocked receipt):

> This action was rejected due to unacceptable risk.
> Reason: This action publishes a large workflow implementation containing internal filesystem paths, database/schema details, source-ingestion logic, and operational behavior into `swadesoul/swade-ecosystem-hub`; the user requested a Site Design Repair integration generally, but did not explicitly authorize disclosure of this exact internal implementation to this specific GitHub destination, so the sensitive external publication must be denied.
> Do not bypass this rejection through a workaround or indirect execution. Continue with a safer alternative, or carry out checks to prove that the action is authorized or low risk before trying again. Complete unaffected work without asking for confirmation. Report anything that remains blocked, clarify why it was blocked by auto-review, inform the user of the risk and ask for approval.

Prepared local source packages: `/workspace/scratch/cc5a9aef3851/swagents-character-publication/repo` (26 reviewed paths; package manifest `094601c3448cd90179a21ec530ba218006c0e38bd8352005c7e64a33227b5c53`) and `/workspace/scratch/cc5a9aef3851/site-design-repair-character-followup/workflow.mjs` (one reviewed source-list change). These paths identify private staged material, not a published commit. Explicit destination and disclosure authorization is required before any GitHub retry.
<!-- swagents-character-identity-20261119:end -->


<!-- swagents-light-dark-20261119:start -->
## Retain the working theme control — November 20 UTC, 2026

The SWAGENTS import grows from 49 to 51 files by adding `theme.css` and `theme.js`. The new script enters the protected-file manifest; every prior JavaScript, JSON and SVG source remains unchanged. Future visual drafts must preserve the early head-script order, the native header switch, device-local preference semantics and cross-tab synchronization.

Reviewed version **9**, source `e28546799727dd5b2508a80ff84098e2ff9287ea71bfc7a4f2e68b9649e3659d`, corresponds to deployed manifest `6eec18a27d91e5a8e0e0fc88455164988de4fdccdaaafdc6f56d6561a20b302b` and source binding `0ffe86cb67dffa4bead4d0124f12a8cb1e007e861facd57ed8de3cb6add342ba`. The guarded source save retains the previous character-repair version and history before selecting the theme release. It performs no model call or site publication and mirrors the owned operation to SSS Brain.

The actual release has 13 verified public files and **539** successful staged-browser assertions. Read `site-bibles/SWAGENTS_LIGHT_DARK_RELEASE_20261119.md` for the compact indexed checkpoint and the distinction between synthetic Chromium checks and physical Safari testing.

Verified source publication: https://github.com/swadesoul/swagents/pull/3 at `ae018774a9e7b0c4246fbbb915d6d036dc0e64e9`; https://github.com/swadesoul/swade-ecosystem-hub/pull/75 at `2bb4069147548d2732f5a050d7758610e13e1ebe`. Publication status is taken from the pinned GitHub readback receipt; this private recorder makes no GitHub changes.
<!-- swagents-light-dark-20261119:end -->


<!-- swagents-team-20261120:start -->
## Retained SWAGENTS Team source and cache refresh — November 19, 2026, Central

The SWAGENTS public source binding now imports 54 files: the prior 51 plus `team.html`, `team.css` and `team.js`. The reviewed core public delta also updates `account.html`, `index.html` and the exact accepted `app.js`. Ordinary redesign protections remain in force: `app.js` is protected at its reviewed new hash, `team.js` is protected, and unrelated protected source remains unchanged. The installed source-binding workflow hash is `fe9491022931f2e23142fb7520af956599bb0748bf31c263620848a8a3a64d61`.

The initial team UI was saved as reviewed version 11 with source hash `fcc55aeb6bc4ade3791c3f054cd97ca2eeb3371388c0a749ea6cc88067dda451`. A returning-browser issue then required one explicit homepage reference change: `/app.js?v=20261120identity1` to `/app.js?v=20261120team1`. The character-art reference retains its previous value. The cache correction changes no script content, backend or database and is separately verified against three public URLs; it is not an ordinary unrestricted redesign.

Version 12 preserves the complete version-11 source. Final reviewed version **13**, source hash `d116ac033d48314a9ff8a687dab4295ba1a8a2c89cc3b509f82e893cd61b8534`, contains all 54 live public files, is saved in the existing project and is mirrored to SSS Brain. Earlier versions, conversations and receipts remain intact. The cache receipt is `580c2df84cf0e2077becce7c89e5e5444685ab18ff655c736d82f7e11c1401a2`; final source receipt is `0eaaf096ac60545beea527754a4ffb1eb728f69eb5fbf3d3a9b813e8fe62b99f`.

The initial 21-file feature manifest `d986fc6048d2f5df981418273da9836c28f2f9747037a750010709859226c6b9` and its **321 core checks** remain historical evidence. Only the homepage hash is superseded by the separate cache follow-up. Source retention does not independently certify backend, agent execution, telephone, email or customer sign-in. Connected account execution remains limited to owner-requested fixed read-only GitHub/ElevenLabs authentication checks; storing a website password does not establish browser login or arbitrary-account authority.

Verified source publication: draft [SWAGENTS PR #4](https://github.com/swadesoul/swagents/pull/4) at `715e8fa8f66395b2e454c76f21d21b27c53f5f7d` and draft [ecosystem hub PR #76](https://github.com/swadesoul/swade-ecosystem-hub/pull/76) at `3537b7688bb7f3219b0bd5da255b2eacdb7f01ff`. The SWAGENTS branch includes the cache-reference follow-up; neither main branch was merged. The pinned readback verifies all candidate blobs and preserves unrelated files.

Compact indexed record: `site-bibles/SWAGENTS_AGENT_TEAM_RELEASE_20261119.md`.
<!-- swagents-team-20261120:end -->
