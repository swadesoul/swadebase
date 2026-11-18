# SWADEBASE Developer Studio — Master Site Bible

## Purpose and owner decision

Swade requested a standalone section inside swadebase.cloud with a ChatGPT-style chat/work split, separate Chat and Work Agents, explicit chat-to-work handoff, an existing design-resource library, Oathloom website creation/repair, source editing, GitHub push and deployment. On November 5, 2026, Swade explicitly authorized implementation, testing, push and deployment. The application belongs in SWADEBASE and reuses existing infrastructure.

## Canonical locations

- Owner interface: `https://swadebase.cloud/adapters/developer-studio`
- API prefix: `/adapters/api/developer-studio`
- Private source: `swadesoul/swade-ecosystem-hub`, `services/swadebase-adapters/developer-studio/`
- Runtime: `/opt/swadebase-adapters/developer-studio/`, existing `swadebase-adapters.service` on loopback port 18795
- Oathloom handler: `/opt/swadebase/docker/volumes/functions/oathloom-build/{index.ts,studio-auth.ts}`
- Public static host: existing SB2 Oathloom host, `https://<slug>.oathloom.site`
- Existing owner identity and sessions: shared SWADEBASE owner backend

## Release architecture

The Chat Agent uses Together via an existing server-only credential, exact shared usage-ledger functions and conservative durable budget reservations. No model runs on page load. Studio Chat has a $0.10/call and $1/Chicago-day cap; Oathloom's existing Work generation budget is separate. Founder application-credit exemption does not suppress real vendor accounting.

Work starts only on explicit Send to work. The request forwards the selected references and task to the actual Oathloom build function. A fixed session/CSRF verification bridge resolves the authenticated owner; neither request JSON nor an unverified cookie payload can supply identity. Existing Bearer authentication is preserved. All Studio builds pass autoPublish:false, and managed-draft metadata separately blocks automatic publication.

Projects and files use the existing oathloom schema. New operation history and provider reservations live in swadebase_ops. Adapter-role policies scope access to the current actor set transaction-locally. Writes apply only to managed projects. Drafts cannot be edited concurrently with an active or unresolved Work task.

Source changes retain snapshots, differences and recovery history. Checks are bound to the exact source hash. Publishing copies a verified draft into a separate immutable release project and atomically assigns its public slug. Editing a draft does not edit the public snapshot. A prior release remains available for rollback. Public verification compares the served index document against the released source, allowing for existing host-cache propagation. An uncertain result is not represented as a verified deployment.

## Product surfaces

Design Library is the default workspace view, with 37 curated resource entries from the verified existing inventory. Vellum, Aceternity Spotlight, 21st.dev and FrontendSlides are brought forward. Resource selection adds task guidance; the application does not silently import or claim a license to third-party components.

Workspace tabs: Design Library, Preview, Files, Changes, Checks, Release. Source editing supports create, repair through Work, add, move/rename with local-reference rewriting, delete and recovery. Chat and Work use persisted receipts and honest running/failed/uncertain states. GitHub push and public deployment are separate explicit reviewed actions.

## GitHub connection gap

The connected GitHub tool can push this product's source release. The runtime server does not have a contents-write GitHub credential. The existing Coolify App coolifyswade1 has Contents:read and must not be treated as a usable push connection or broadened without authorization. Studio's GitHub action therefore remains setup-required until a properly scoped server connection is provided. No token belongs in this document or in frontend code.

The implemented GitHub path accepts repositories under swadesoul and dedicated working branches, uses atomic trees/commits with force:false, preserves unrelated paths, deletes only previously managed paths, and verifies the resulting branch head. Mocked behavior can be tested without claiming a successful live push from Studio.

## Supported scope and limitations

Static HTML/CSS/JavaScript websites, up to 200 text files and 2 MB of source. No arbitrary shell/npm execution, server-app deployment or backend creation in this release. Source checks cover paths/bounds, HTML entry and viewport, JSON, and local-file references. Browser appearance and application behavior require separate preview/live review. Complex cyclic module graphs are outside the lightweight private-preview renderer's scope.

## Deployment controls and rollback

Before production mutation, acquire the shared `/opt/swadebase/docs/DEPLOY_LOCK.md` lock. Use additive import/navigation changes because the runtime server includes unrelated modules newer than the private repository's server baseline. Back up every affected runtime file. Apply only the scoped schema migration, registry registration, module source and two Oathloom files. The Together EnvironmentFile is protected and is never copied into source control.

Pause the Studio through the existing adapter registry. Roll back code from the recorded backup and restart only the affected service/container under the lock. Keep the additive database tables and user history. Use project release rollback for published websites.

## Verification checkpoint

**Live release verified November 5, 2026.** The final automated suite passed 62 Node tests. The real PostgreSQL disposable-database suite passed 16 tests (15 behavioral subtests plus the enclosing test), including current-role checks, RLS isolation, persistence, source operations, input-bound idempotency, immutable release recovery and rollback. The disposable database was removed afterward.

The final HTTPS/API acceptance receipt contains **22 passing checks**. It covers owner and anonymous access, CSRF and origin rejection, 37 resources, saved file creation/move/deletion/restoration, path traversal rejection, source-bound checks, private preview assets, the authenticated Oathloom bridge, actual Together chat, actual Oathloom generation, immutable publication, draft/public separation, a second release, rollback, reviewed public copy and the unavailable GitHub connection's fail-closed response. The final acceptance page copy was reviewed and republished without another model call.

The main navigation includes Developer Studio. Thirteen installed runtime files matched their source hashes. The authenticated builder returned the expected unknown-action 400 after the controlled edge-container restart, demonstrating that the owner bridge reached action validation. Final health observations: adapter 200; private Studio page 302 without sign-in; unauthenticated Studio API 401; unauthenticated builder 401; existing host and published acceptance page 200; adapter service active with NRestarts=0. Browser screenshot evidence is retained in the private source release. These are scoped observations, not certification of every browser or arbitrary project.

## Deployment receipt — November 5, 2026 (America/Chicago)

**State: LIVE for the supported static-website workflow. Runtime GitHub push remains SETUP REQUIRED.**

- Source merge: `912e12927d2b4ec3acfd7158539346496fafbfc3`, [PR 37](https://github.com/swadesoul/swade-ecosystem-hub/pull/37).
- Backup: `/opt/swadebase/backups/developer-studio/20261105T163447.591687Z`.
- Deployment coordination reference: `chatgpt-developer-studio-20261105`; the current shared lock file remains authoritative.
- Private acceptance draft: `b1fa67a5-2537-4388-902b-08f6b8f31330`.
- Work operation: `9e9f392c-329c-46be-9640-a765617df6e2`; actual completed Oathloom run: `c8fd1cb8-437e-4144-b2a1-e39cdfa6487f`, producing four saved draft files.
- Final public acceptance URL: [swadebase-studio-acceptance.oathloom.site](https://swadebase-studio-acceptance.oathloom.site).
- Final immutable release: `e6a23e09-0403-424e-a0e1-725177d931e3`; previous release: `f8f9d90c-717a-489b-b122-911f51b788b8`.
- Final source SHA-256: `847b54952744750e2cea6de66225a5c391c7003c512a8f7e8861c3dbe0d035fd`.
- Final source/public response verification: `2026-11-05T16:43:29.439Z` (10:43:29 America/Chicago), HTTP 200.
- Shared deployment-log ID: `12`, service `developer-studio`, recorded `2026-11-05T16:45:30.433729Z`.
- Private What's New shipped-event ID: `1da821b0-60b8-4267-9ff2-f168144f4956`.
- Existing adapter registry: `developer-studio`, enabled and lifecycle `live`; evidence explicitly records the GitHub gap.

### Verified model usage and cost boundary

One actual Together chat completed on `deepseek-ai/DeepSeek-V4.1-Flash-1017`: 158 input tokens, 77 output tokens, zero reported cached tokens, 208 response characters. Shared ledger ID `2293` settled **USD 0.000140** for request `867d49c8-ce71-4047-9cf8-fa90b6110e61`. Founder application charge was USD 0; provider cost remains recorded. This is the shared ledger's token-rate accounting, not an independent provider-invoice reconciliation.

Studio Chat reserves against its USD 0.10/call and USD 1/America-Chicago-day limits; unresolved calls retain reservations. Oathloom Work uses its separate existing provider path and budget. The successful generation receipt does not independently certify its upstream charge. Do not represent the Chat limit as a combined Chat-and-Work limit or claim the build was free.

### Reliability and recovery

Repeated operation keys are bound to canonical input. A changed request cannot reuse an earlier operation key. Publication stores its operation ID inside the immutable release transaction. Replaying an uncertain deployment verifies that exact release and never republishes the current draft. Superseded releases are not silently restored. A known rollback receipt is verified without executing another rollback; a lost rollback response without an identifiable receipt stays held for reconciliation.

For a code rollback, coordinate through the existing deployment lock, restore only this release's affected runtime files from the backup, and restart only the affected service/container. Preserve the additive operation/reservation tables and user history. Disable the existing registry entry to pause new Studio requests; this does not cancel work already dispatched. Project rollback remains the separate recovery path for public website snapshots.

### Remaining connection gap and evidence

The live GitHub action returned its expected **503 setup-required** response. The existing Coolify App's Contents permission is read-only. No successful GitHub push from the running Studio is claimed; source delivery through the connected GitHub tool is a distinct verified operation. A correctly scoped server-side Contents-write connection remains necessary.

Canonical runtime receipt: `/opt/swadebase-adapters/var/developer-studio-acceptance.json`. The private source repository includes [sanitized live acceptance](../verification/developer-studio-live-acceptance.json), [browser evidence](../verification/developer-studio-live.jpg), and the [shared-Bible checkpoint](../verification/developer-studio-shared-bible-entry.md). The sanitized receipt excludes the original generated HTML and contains no provider credentials. Approved knowledge indexing uses the two canonical Site Bible paths; it does not train a model or expose the private acceptance source files.

## November 7, 2026: Oathloom design contract installed

Release `oathloom-design-20261107`, policy `2026-11-07.1`, was installed at 07:53:21 UTC. Source is merged in [hub PR #55](https://github.com/swadesoul/swade-ecosystem-hub/pull/55), commit `53450c5c2344356484e1ecf9c77fa5de27bc4bd4`.

The shared Oathloom builder now receives bounded actual written excerpts for 34 template styles, drawn from the 37-entry Studio catalog. Blueprint, code, review and repair share a required project-specific design contract. A failed or missing final review stops before replacing project files or publishing. Repairs receive a fresh review. No extra model provider or agent service was installed.

Validation: 39 focused source tests passed; the actual legacy renderer sample passed eight applicable source checks; all four installed source hashes match the tested release. The live frontend returned HTTP 200 and the builder retained its HTTP 401 anonymous sign-in requirement after the scoped runtime restart. These checks made zero provider-generation calls. Authenticated generation, actual per-page visual acceptance and paid-service checkout remain unverified.

Swade confirmed: basic on-page SEO for everyone; optional advanced SEO/maps add-ons for free accounts; specified services included in paid-plan entitlements with no duplicate charge. The suggested $5 installation fee and ongoing provider usage must be treated separately. These constraints are now builder instructions; this release does not implement entitlement enforcement or change billing. The existing swade-maps service is enabled; no Monid installation or paid call was established.

Canonical operator detail: `site-bibles/OATHLOOM_Master_Site_Bible.md`. Runtime evidence: `releases/oathloom-design-20261107/runtime-receipt.json`. Backups precede changes. Do not describe `automated_pass` as desktop/mobile visual approval or a fully connected paid feature.
