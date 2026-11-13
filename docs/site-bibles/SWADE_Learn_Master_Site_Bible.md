# SWADE Learn — Master Site Bible

## 1. Identity and owner
SWADE Learn is Swade's standalone learning catalog and instructor studio. Swarvis Teach is its first original instructor collection. Working name selected during the authorized build; it can be renamed without recreating the platform.
Owner: Swade. Site: https://swade-learn.swadeswade-s-8788.chatgpt.site
State: deployed for owner-private review, November 5, 2026. Native access remains custom, owner only.

## 2. Purpose and outcomes
Manage instructors, subjects, classes, lesson text/video/resource links, approved images, site destinations, and production drafts in one place. Other ecosystem sites can link to a class or embed a filtered catalog. Swarvis teaches AI and agent workflows with relaxed confidence, humor, realistic client utility, and human review. His supplied main image and character sheet define his likeness; episode outfits can change while identity remains fixed.

## 3. Features and evidence
Implemented: searchable visitor catalog; instructor and subject filters; class and instructor pages; readable free guides; canonical course enrollment links; filtered embed; private owner CRUD; image uploads and media picking; lesson editing; publication/archive states; site link/embed generator; persistent and portable video production drafts.
Current catalog: 11 published classes (10 canonical TeachVirt courses plus one original written Swarvis guide), four active instructors (Swarvis plus three canonical instructors), and a private Swarvis episode draft. No new finished AI videos were created.
The hosted API returned catalog 200; class detail 200; unauthenticated admin 401; published reference image 200; private/unreferenced character sheet 404. Checks completed after the successful 19:28:33 UTC publication.

## 4. Customer and owner journeys
Visitors browse classes and follow each canonical TeachVirt class page for its signup, access, and delivery. The original free written guide can be read directly. Creating a hub guide does not automatically create a canonical TeachVirt class or purchase entitlement; an owner supplies the corresponding enrollment URL when ready.
The owner opens /admin and signs in through native Sites identity. All admin API operations independently authorize the owner server-side. Instructors, classes, subjects, and site destinations use save/refresh persistence. Video Studio supports saving and reloading production drafts and JSON export/import.

## 5. Source, hosting and deployment
Frontend: native Sites project appgprj_6aecd420ba9c8191884e8bdb379b77b0.
Source repository: https://git.chatgpt-team.site/638d5a12-134e-45ab-abfe-e0e12c18a50b/appgprj_6aecd420ba9c8191884e8bdb379b77b0.git
Source commit: ad17488a8b0ebeaf38cd025b39c912ce03886877
Saved version: appgprj_6aecd420ba9c8191884e8bdb379b77b0~appgver_d77c2ab488fc8191bfc75dbe46274469
Deployment: appgdep_6aecd8dae1848191bc26a796212a304f
Runtime environment revision: 1
Checkout: /workspace/sites/swade-learn.
Full TypeScript check and production Vinext build passed. Source is synchronized through the supported Sites Git workflow. The browser rendered the homepage; managed-preview data requests failed in that environment, while hosted service-access requests succeeded. An interactive owner sign-in/form session was not exercised by the browser.

## 6. Data and migration
Existing database/container: postgres in supabase-db. Schema: teachvirt.
New tables: learning_hub_records and learning_hub_tokens. Fixed hub scope swade-learn; kinds instructors, subjects, courses, sites, media, productions. Existing canonical courses/coaches/lessons/enrollments/payments/auth were not rewritten.
Migration: /opt/swadebase/ops/swade-learn/001-learning-hub.sql, also tracked in the Site source. It passed a rollback transaction test before commit and used NOTIFY pgrst, 'reload schema'; no shared service restart or app-routes change.
Canonical metadata is projected with an explicit field allowlist. Canonical IDs begin teachvirt:. Unknown duration is Self-paced; unknown skill level is All levels. Canonical entries are read-only in the new owner UI.

## 7. Authentication and publication
Owner emails use the existing approved allowlist: swadesoul@gmail.com and officialabagale@gmail.com, verified against platform-supplied identity on the server. Native Site IDs are not SWADEBASE user IDs. A separate opaque credential authorizes only the hub RPC; no founder session or service-role key is exported.
Only the credential SHA256 hash is stored in the private token table. Native Sites holds SWADE_LEARN_TOKEN as a secret; the dedicated administrative backup is /opt/swadebase/secrets/swade-learn.env. Never print or copy credential values into documentation or client code.
Direct table/helper access is revoked for API roles. Public catalog excludes drafts, production prompts, media library rows, and arbitrary private fields; paid hub classes expose preview lessons only. Admin responses are no-store; browser mutations enforce matching Origin.
Native Sites audience remains owner-private. A registered destination or copied iframe does not grant visitor access or install the embed on another site.

## 8. Dependencies and callable contracts
Public RPC: teachvirt.learning_hub_catalog().
Private RPC: teachvirt.learning_hub_admin(p_token,p_action,p_kind,p_body,p_id), with authorize/list/save/delete.
Site API: /api/catalog, /api/session, /api/admin, /api/admin/save, /api/admin/media, /api/media/:id.
Scoped image bridge: https://swadebase.cloud/functions/v1/swade-learn-media.
Bridge source: /opt/swadebase/docker/volumes/functions/swade-learn-media/{index,b2}.ts, tracked in Site backend/swade-learn-media.
Canonical course engine: https://teachvirt.courses.
Existing Skool-style community: https://virtteach.study/school-community. Community membership and course listing must use the existing import/signup journey.

## 9. Media and instructor continuity
Original images are in existing Backblaze B2 beneath teachvirt/swade-learn/media/. Existing provider credentials stay inside SWADEBASE. Images support JPEG/PNG/WebP, eight MiB maximum, with actual format signature checks at the Site upload API and a scoped signer. Stable /api/media/:id links proxy signed transport URLs; expiring URLs are not permanent catalog metadata.
Main reference media ID: 3549b865-97fe-5c36-b286-88a821c89857.
Character sheet media ID: 36a1b980-c183-5ffc-a354-194778f325b4.
Both passed upload, metadata-save, and byte-identical download. Main reference is assigned to published Swarvis metadata. The unreferenced character sheet is readable by the owner only through the Site. Referenced assets cannot have metadata removed without clearing references; deleting metadata never deletes B2 originals.

## 10. Pricing, entitlements and costs
The hub has no credit charges or owner paywall; founder management is exempt. Existing external provider costs remain separate and bounded by the standing zero-spend rule. This build made no paid AI generation calls.
Class prices describe the linked canonical offer; checkout remains at that offer. The new hub does not certify older TeachVirt payment entitlement enforcement. Discovery found public reads of published canonical lesson rows and a self-enrollment policy checking identity, so a separate entitlement review is needed before asserting paid-content isolation. Canonical lesson bodies are not imported into this catalog.

## 11. Production and recurring research
Video Studio creates saved production packs with five character clips totaling exactly 45 seconds: 15/5/5/5/15. Four graphics use 45/65/60/25 seconds for a four-minute default. Word counts are checked independently of actual recorded audio timing.
Opening/closing use the central studio; three middle scenes are topic-specific; one outfit per episode; approved likeness references remain fixed. Final dialogue requires human review before execution, SSS Brain for operators, Brainiak for starter setups, and the signature sign-off.
ElevenLabs voice, Together reference-capable video, and Remotion rendering are intended providers. This release saves/export briefs; it does not execute generation or render finished videos. No premium model is represented as connected or tested.
The earlier daily five-show-idea research automation remains separate (Automation_98ea7cbaf0188191ae721a5596ae3a1b, recorded enabled around 08:00 America/Chicago). This release did not recreate or alter that automation, and no automatic ingestion into this studio is claimed.

## 12. Interoperability and known limits
/embed supports course, subject, instructor, and product filters. Resize event type: swadelearn:resize; host consumers must verify origin and clamp height. /api/catalog supports a public read response with short caching, subject to the site's audience gateway.
Five destination records were added for SSS Brain, Brainiak, Swade Soul, TeachVirt, and VirtTeach. These represent available linking destinations, not completed installation on those frontends. No cross-site learner SSO was added.
Current owner browser login, iPad Safari end-to-end upload, paid checkout, provider rendering, and broad embed rollout remain unverified. Responsive CSS and native file inputs are implemented; uploaded originals and backend writes were verified directly.

## 13. Recovery and verification
Restore a prior saved Sites version for frontend rollback. Disable the dedicated token hash to stop hub writes/media authorization. Preserve content tables and B2 originals; do not drop them as routine rollback. The new media function directory can be withdrawn without changing shared routing or existing functions.
Backend checks: 17 passed for persistence, visibility, token denial, private table/helper denial, references, production privacy, and unsafe URLs. Media checks: both supplied references passed. Hosted checks: catalog/class/image success, admin denial, private-image denial. Temporary integration records were removed.
Scoped deploy lock: chatgpt-swade-learn-20261105, additive learning-hub objects and one new function directory. Attobahn's separate lock and files were preserved.
Private What's New event: b31304a7-79ec-4fb4-89d2-56ffb14d3e7f (internal release; owner-private deployment).

## 14. Sources, decisions and review
Owner instruction: create a separate multi-instructor training website usable across SWADEBASE sites, starting with Swarvis. Reuse found: TeachVirt course engine and VirtTeach Community, the previously built Skool-style program.
Tracked implementation: docs/backend-map.md, docs/operations.md, migrations/001-learning-hub.sql, backend/seed-and-verify.py. Canonical shared references: TeachVirt_Master_Site_Bible.md and SWADEBASE_Master_Site_Bible.md.
Version 1.0, November 5, 2026, ChatGPT. Index this Bible through the existing allowlist site-bibles/*.md. Search knowledge for SWADE Learn; the older fixed swade_get_site_bible enum lacks this new alias and was not changed.
Next review: first owner publishing session, first real learner enrollment, public-audience/embedding rollout, and before paid generation.
