# SWADEBASE Site Design Repair

## Purpose and owner direction

Site Design Repair is the permanent SWADEBASE entry point for improving an existing registered website. The owner selects a site from the canonical dropdown or enters that site's HTTPS address, keeps a private design conversation, prepares a visual draft, inspects pages and saved versions, and reviews the exact release to the existing domain.

Swade requested this workflow while redesigning SWAGENTS. His direction is cinematic, authored visual design with the actual installed Impeccable program. Preserve the site's approved logo, characters, voices, navigation, content structure, working functions, sign-in, billing and customer data. A visual redesign is not permission to invent capabilities, turn on telephone execution, change customer accounts, replace integrations or publish private conversations.

The full provided owner request history is stored privately with the founder's SWAGENTS redesign project and mirrored to his SSS Brain records when that write succeeds. This shared playbook contains reusable operating instructions, not the private transcript. No unseen assistant messages are reconstructed.

## Open the workspace

Use `https://swadebase.cloud/adapters/site-design-repair`, also linked from the SWADEBASE Web Family navigation. The existing signed-in super-admin role and adapter registry gate apply on every request. The adapter ID is `site-design-repair`, with display name **Swade Site Design Repair**.

1. Choose the registered site or enter its exact existing HTTPS origin. The server resolves it against the canonical registry; typing an address does not authorize arbitrary remote fetching.
2. Open the workspace. There is one persistent private redesign project per owner and registered origin. Returning to that site resumes its conversation and versions.
3. Describe what should change and what must stay. Existing-site instructions, actual Impeccable guidance and the saved conversation provide context.
4. Request a design draft. This starts an explicit local job with a durable receipt. Keyed message and design-work requests are idempotent: repeating the same request key replays the saved operation. Native scans and project source checks are separate executions; they do not use that request-key replay.
5. Review each HTML page in the private preview, compare versions and run source checks. A private preview does not execute customer account operations or constitute production testing.
6. Before release, test the real application controls, responsive layouts, keyboard behavior, contrast, voice flow and preserved source against the current live baseline. Publish only through that site's existing verified deployment path with a scoped backup and rollback.

## Source mappings and production domains

The registered-site list is provided by the existing `swadebase_ops.mail_machine_registered_sites()` function. At initial acceptance it contained 62 normalized origins; this count can change with the canonical registry.

SWAGENTS has an explicit, read-only mapping to 45 public text source files under `/opt/swagents/app/public`. The importer rechecks hashes after reading and records protected JavaScript, JSON and SVG fingerprints. Its existing characters, fonts and other media remain served from the bound site. Existing owner-held Oathloom projects can also supply source when their saved live URL or public slug exactly matches the registered origin.

A registered site without one of those verified source mappings can retain its design conversation, but design generation remains unavailable with an explanation. Do not silently create an empty replacement website or claim that every registered domain is connected. Add new mappings through reviewed source changes using fixed paths or verified owner/project bindings, not a free-form filesystem or URL input.

Each managed project records its `productionTarget` and `releaseDestination: existing-site-reviewed-release`. The preview and draft do not automatically publish to that domain. The ordinary Developer Studio chat, work, GitHub, deploy and rollback endpoints reject these managed projects so they cannot accidentally invoke a paid generic builder or publish a private existing-site conversation through a generic Oathloom release. Existing ordinary Studio projects retain their own behavior.

## Actual Impeccable installation

- Upstream: `https://github.com/pbakaus/impeccable`
- Installed checkout: `/opt/swadebase/vendor/impeccable`
- Reviewed source commit: `d41d9860b0094dcb68030657da63461212835aaa`
- Skill/package version: 4.9.2. Native engine version: 0.1.25.
- Linux binary: `skill/scripts/bin/linux-x64/impeccable`
- Binary SHA-256: `f48aca43294a9ba1ea3eb7b1d0a0b2d595c480e8c65003e410247b9884820ddd`

The local scanner performs the actual deterministic `detect` command. The source repository and its design guidance are real installed resources. The native scanner identifies findings; it does not independently redesign a website or prove that a rendered interface is correct. An agent applies the guidance and validates the result.

The root-owned helper `/opt/swadebase/site-design-repair/scan-runner.py` verifies and executes the pinned binary from the same open descriptor. It requires no-new-privileges and seccomp denial of network/socket and io_uring operations. Each request gets a fresh private source-only workspace under `/var/lib/swadebase-site-design-repair`, runs as the service account, and removes it afterward. It does not inherit service credentials or a user's home directory. Telemetry flags are disabled as defense in depth; network denial is the actual offline boundary. Exit code 2 means findings were produced, not a crashed scan.

Source-only findings need interpretation. Legacy unloaded styles are not evidence of a visible defect; a deliberately JavaScript-populated image is not a broken live asset if browser verification succeeds. Conversely, a clean source scan cannot establish accessible contrast over imagery, working mobile drawers or a successful live voice interaction. Record findings and the specific rendered evidence used to resolve them.

### Accurate source and preview checks

The existing-site source review resolves literal file references against the imported source and, for SWAGENTS, its fixed public directory and verified server route map. Reads reject traversal and symlinks. Unknown files and routes remain failures. Authentication, external addresses and generated references are labeled `needs_live_review`; they are not mislabeled missing files or silently approved. `static_passed` distinguishes the literal-source result from those remaining live checks. Each invocation saves its own exact owner-bound receipt after a source-hash check, then mirrors the result to SSS Brain.

The opaque private preview embeds the approved SWAGENTS fonts and static raster artwork in transient renderer copies. The public site protects those assets with cross-origin rules, so directly linking them from the isolated preview would not reproduce the design. Fixed-root, no-follow reads, format checks and size limits keep this embedding bounded. Original source files and the public site's headers remain unchanged. Live account/API operations stay disabled in the preview; verify those behaviors on the actual site through the appropriate test workflow.

## Programs collected in the same adapter

| Collection | Current relationship |
| --- | --- |
| Impeccable | Actual pinned local source and verified native checker |
| Beautiful HTML Templates | Existing Studio collection of 34 styles, listed once |
| Frontend Slides | Existing Studio visual direction workflow |
| Aceternity Spotlight | Existing Studio component reference |
| 21st.dev | Existing component discovery reference |
| Browser Workspace and Site Checker | Links to the existing bounded browser workflow |
| SWADEBASE Repair Kit | Existing health and repair review destinations |
| Taste Skill | Saved source reference; runtime adoption unverified |
| ScrollCraft | Cinematic workflow source reference; separate runtime unverified |
| Elaya Design Skills | Two recorded source references; runtime adoption unverified |

The catalog states the integration status of each item. Reference links do not install packages or execute third-party code. Review the actual source, license and compatibility before any later adoption. Do not count each template as another installed program.

## Local generation and cost control

The workflow uses the existing loopback Ollama service and already-installed models. It does not download a model, provision a GPU or call an external model provider. Generation receipts identify `local_ollama` and zero external model spend. Existing server operating costs still exist; zero external provider spend is not a claim that all infrastructure is free or that ChatGPT usage is under a particular percentage.

The design model returns a small structured visual recipe. Deterministic code validates and expands that recipe into bounded tokens and CSS. Text and muted text must pass 4.5:1 contrast against their intended surfaces; controls and focus indicators must meet the configured 3:1 checks. Body typography and control dimensions have explicit lower bounds. Model output cannot supply executable HTML, scripts, CSS, filesystem paths or commands.

Generation appends a dedicated stylesheet and its marked link to each existing HTML page. Protected scripts, JSON and SVG bytes stay unchanged. The worker verifies the owner, current source hash, protected fingerprints and operation before committing the new source, before/after versions and completed receipt in one transaction. Work has global and per-owner concurrency bounds and a timeout. A failed or interrupted job reports that state and does not claim an applied design. Short replies and constrained recipes keep local CPU generation practical.

This local mode creates a coherent multi-page visual draft. It does not claim unrestricted framework refactoring, arbitrary new functionality or automatic finished art direction. Complex cinematic composition can still be implemented through the normal agent-assisted source workflow, then saved as the reviewed version in the same private project.

## Private conversation and SSS Brain

The adapter reuses existing `oathloom.projects_v2`, `project_files`, `project_versions` and `swadebase_ops.developer_studio_operations`. Messages, requests, job outcomes, checks and version records persist under the actual owner. The page offers a private conversation export. There is no new standalone database, background scheduler or public transcript manifest.

The narrow database function `swadebase_ops.site_design_repair_save_memory(project_uuid, operation_uuid)` reads verified database records, checks the current actor's super-admin role and project/operation ownership, and upserts owner-scoped `sssbrain.brain_sources`, `knowledge_entries` and a project wiki page. It copies only allowlisted conversation and outcome fields, excluding source snapshots and unrelated payload fields. It does not redact all secrets that an owner may type into copied conversation fields; those records remain private and owner-scoped. Its idempotent operation UUID prevents duplicate knowledge entries. Public execution is revoked; the existing adapters database role receives only the required function grant.

The UI says saved to SSS Brain only after the function returns a successful receipt. A project-saved message remains useful if the mirror is unavailable. Reopening the project retries bounded unsynchronized completed operations.

The founder currently uses the primary SSS Brain database path. Owners mapped to a separately provisioned tenant database are deliberately held with `tenant_memory_bridge_required`; this implementation does not yet route their memory write into that separate database. Do not remove a tenant mapping or claim a primary-database write reached a customer's separate SSS Brain. Implement the existing tenant bridge before broadening that support.

The shared Site Bibles, this playbook and the dated learning checkpoint also enter the existing free knowledge index through `/opt/swadebase/ops/knowledge-learning/sync.py`. Verify the indexed path and content hash after sync. Saving instructions in SSS Brain does not change a model's weights or guarantee that every future ChatGPT session automatically reads them.

## SWAGENTS cinematic design contract

Use the approved transparent SWAGENTS.live crown logo everywhere the main brand mark appears. Keep the actual CROWN and MAJESTY character assets and the existing character/voice choices. The approved direction uses an authored cinematic architectural scene, matte ink and petrol surfaces, warm ivory text, restrained bronze lines and the original purple primary action. Typography and scene composition carry the design; generic decorative cards, tiny controls and repeated glow effects should not.

Preserve every existing page and navigation destination: home sections, Support Room, Money Room, credits, approvals, account, admin, terms, privacy, support updates and errors. Keep all six Support Room categories and its right drawer with conversation, plan, activity, mail and customer-browser surfaces. The design must remain readable on phones and usable with reduced motion, keyboard navigation and high zoom.

Keep the existing continuous conversation voice behavior: a user starts the microphone, grants browser permission, sees listening/speaking/error state, receives a real response, returns to listening after playback, and can stop recording and pending playback. A browser fixture can verify that control flow; it is not proof of a physical iPad microphone, live STT/TTS throughput or telephone provider execution.

Telephone execution and automatic customer account modifications remain separate incomplete capabilities. The current customer browser supports explicit customer-approved reads of an already visible page, with sign-in/MFA performed by the customer. Preserve these actual boundaries and the existing specialist-mail approval flow during a visual release.

## Release and recovery

Hold the existing site-scoped deployment lock; read the current affected Master Site Bibles. Capture a fresh live baseline rather than assuming an older Git commit matches current production. Prepare only reviewed paths, then hash-guard each live file immediately before replacement. Preserve unrelated concurrently deployed files and all customer records.

For the November 19 SWAGENTS visual release, the exact scope is 23 HTML/CSS files plus `public/cinematic-hq.webp`. Source scripts and backend configuration are untouched. The release script writes a backup, replaces individual files atomically, verifies hashes and emits a receipt. Its rollback requires the deployed hashes still match before restoring only those same paths. No whole-tree rsync or database deletion is appropriate.

For the adapter, install the module, apply the narrow memory function, add the server handler and navigation entry, apply the existing-site Studio guard, upsert the adapter registry record and restart only `swadebase-adapters.service`. Verify health, anonymous denial, current owner access, registry disable behavior, scanner isolation, real local generation, persistence, private preview and owner-isolated memory retrieval. A repository snapshot that predates other current adapters must never be deployed over the live tree.

Record the real deployment result, source commit, test scope, rollback location and remaining gaps in the affected Site Bibles and private What's New. Use the final release receipts as the source of truth for what is live. Do not convert a staged file, fixture test, mockup or source commit into a deployment claim.
