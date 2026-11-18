# ATTOBAHN Master Site Bible

Version 1.1 — 2026-11-05T19:50:19.970118+00:00. Operator: ChatGPT, acting on the owner's request to finish the migration and provide a complete technical handoff.

## Current release status

**PARTIAL MIGRATION — OWNED HOSTING RELEASED; ACCOUNT SYNC AND ACCEPTANCE LIMITS REMAIN.** The public hosting, TLS, static assets and scoped backend have moved to the owner's SWADEBASE infrastructure. The application retains its existing maintenance experience. The Lovable project still receives GitHub changes, and a clean result in the external ChatGPT browser has not been established. Do not describe this checkpoint as a fully disconnected or fully accepted application.

### Source, hosting and DNS

The pushed source revision is `b24277be058e4f085c82e4985aa77654a24e4edf` in `swadesoul/attobahn`. The final revision changes documentation/metadata only from `960793ca379114f30bf2da52655d06ccf859be76`; its backend code is identical to the deployed backend. Owner-operated Nginx and valid TLS cover `attobahn.live`, `www.attobahn.live` and `zamaniwave.attobahn.live`, with DNS A records pointing to `2.25.74.73`.

Four reviewed, fingerprinted Lovable verification TXT records and the two `notify` delegations to Lovable nameservers were retired after cutover. The Lovable DMARC report recipient was removed while preserving the existing monitoring policy. Namecheap's `FWD` email mode, its implicit forwarding MX records, unrelated SPF and other DNS records were preserved. Complete-zone backups and scoped read-before-write verification are retained privately.

The deployed source removes the vendor MCP build plugin/SDK and uses owned runtime configuration, locally supplied media and fonts. Functional dependencies and license notices are retained. Seventeen origin checks passed. The external ChatGPT browser continued to retrieve the old provider's scripts despite current authoritative DNS, public resolver checks and new server-side HTTPS responses. A cached or alternate resolver path is suspected, not proven. Browser policy rejected the attempted internal cache-clear page; no bypass was attempted. Fresh/returning browser branding acceptance remains **UNVERIFIED**.

### Backend and tenant boundaries

All 37 source handlers deploy under `atto-<original-name>` with separate `atto-_shared` helpers. Each database client is pinned to `attobahn`; user authorization uses real SWADEBASE Auth validation, and service-only handlers require an exact server credential match. Existing application role checks remain. Installation preserved 32 other application registrations and 991 unrelated function files.

Eight frontend tests and eight backend boundary test groups passed. The actual isolated Deno runtime loaded all 37 handlers, and the final MP3 narration change passed a further runtime check. Production HTTPS validation recorded **67 successful checks**: 37 OPTIONS responses, 27 rejected protected unsigned POSTs, rejected unauthenticated MCP access, and successful OPTIONS/rejected POST on the scoped `/app/attobahn/functions/v1/atto-studio-chat` route. Tests used only public runtime configuration and did not exercise privileged workflows, send mail or invoke AI/voice generation. Evidence: `/opt/swadebase-staging/attobahn-backend-20261105/live-backend-validation.json`.

Text and voice sources now use the existing local SWADE AI gateway and Kokoro voice service without a paid-provider fallback. Shareholder narration uses MP3 bytes with a matching browser decoder and selects published reports. Live inference, synthesis and private business journeys were not accepted end to end.

### Database, storage and public handoff

The current schema/public-content snapshot is `2026-11-05T19:15:35.128956Z`, after the two queue URL replacements and storage provisioning. Schema and content share one read-only, repeatable PostgreSQL snapshot. The handoff contains schema definitions and grants, 60 public rows from 12 explicitly allowlisted tables/column sets, exact filters, dependency metadata and checksums. It excludes private/auth/contact rows, credentials, shareholder/investor/NDA/KYC records, private correspondence and storage object bytes. Restoration into a clean independent database was not tested.

The five legacy application storage buckets each had zero objects. SWADEBASE now has `attobahn-consultant-documents`, `attobahn-investor-documents`, `attobahn-page-resources`, `attobahn-partner-brand-assets` and `attobahn-voice-updates`; page resources and partner branding retain their original public setting. Sixteen translated access rules and four restrictive guards preserve the intended private boundary against broader shared policies. Actual PostgreSQL checks on temporary synthetic rows verified anonymous/cross-user denial, owner access, ownership-change denial and unchanged unrelated buckets. Private upload/save/playback journeys remain unaccepted.

Database archive: `/opt/swadebase-staging/attobahn-backend-20261105/public-database.tar.gz`, 97,378 bytes, SHA-256 `b08d83f47ba00e52b85dd9e432933ea2fc7e9021c38ba717c5f80f695ea3a37b`. Its 20 recorded checksums match; the schema contains no remaining hosted-Supabase or Lovable URLs.

### Media and delivery

Recovered media includes all 27 original asset descriptors, 19 stock images and fonts: **81 recovered files, totaling 100,171,276 bytes**. Repository-native assets and their license notices remain in source. This is a file-recovery statement, not an independent determination of third-party ownership or rights. Two historical stock URLs were unavailable upstream; final source uses documented replacements from existing ATTOBAHN art. Their provenance and the original social image MIME discrepancy are recorded in the source handoff.

Final technical handoff: `ATTOBAHN-SWADEBASE-Handoff-2026-11-05.zip`, **122,040,559 bytes**, SHA-256 `b1197cf2b7b23860186fe965e7ae862f9116b2a587ae90468ebf20a854a11c6e`, based on source `b24277be058e4f085c82e4985aa77654a24e4edf`. The packager verified all 710 source files against their Git objects, matched 157 published files and independently verified all 21 public-database files, every archive entry hash and ZIP CRC. Retain its manifests, public-data exclusions, configuration instructions and readiness limits. A requested extra Backblaze archive copy was rejected by automatic approval review; no new B2 copy was made.

### Remaining migration work

1. **GitHub/Lovable account link:** the project's latest-source field advanced to the newly pushed GitHub commit, confirming continued synchronization during this session. Available connectors do not expose the project-disconnect control. Completing it requires authenticated project settings access; browser authentication blocked that path. Use the project-specific Git disconnect, preserving the GitHub repository and unrelated workspace connections. No project or repository was deleted.
2. **Email sender and queue:** outbound ATTOBAHN mail is disabled. The existing Resend account has 10 of 10 domain slots occupied and no ATTOBAHN sending domain registered. No domain was removed, no plan upgraded, no credential created and no message sent. A sender cannot be assumed from another brand's verified domain. Queue definitions now point to the owned endpoint, but `pgmq`/`cron` and the reviewed queue configuration remain absent/unaccepted; no job was enabled and no Vault value changed.
3. **Business integrations:** partner/progress integrations remain disabled pending configuration and acceptance. Private uploads, signed-in business workflows, AI/voice operation, founder exemptions and iPad acceptance were not fully reverified. Existing maintenance behavior remains enabled.
4. **Browser acceptance:** public DNS/server evidence passes, but the external browser's retained old provider scripts prevent a clean browser certification. Do not substitute a source scan for that missing proof.

### Recovery, records and evidence

Private release backups: `/opt/swadebase/backups/attobahn-migration-20261105`. Restore only scoped web configuration/assets, namespaced handler directories, the saved ATTOBAHN router entry and reviewed database definitions as required; coordinate any shared runtime restart under the deployment lock. Preserve all unrelated application routes, files, DNS records and data. Do not reinstall vendor runtime dependencies as a silent fallback.

Private What's New event: `f57a1579-4941-460c-8043-178983bef0ed`, recorded with the server's actual timestamp and a shipped state scoped to the owned-hosting release, with partial-migration limits in its description. Current canonical records are mirrored only to the verified private `swadesoul/swade-ecosystem-hub` repository, not the public `swadesoul/swadebase` fork. Documentation/index verification receipt: `/opt/swadebase-staging/attobahn-docs-sync-20261105/checkpoint-receipt.json`. The existing no-model knowledge sync is reused; no global assistant memory or model training is claimed.

The prior November 4–5 handoff record below is retained as history and is superseded by this current checkpoint wherever release state differs.

## Historical record — prior November 4–5 checkpoints

Version 1.0 — 2026-11-05 UTC / November 4, 2026 America/Chicago. Canonical handoff record prepared by ChatGPT. Status: delivered handoff with documented exclusions. A complete private-data backup and independently reproduced production deployment are not claimed.

## 1. Identity and ownership

Canonical product: ATTOBAHN / AttoBahn. Observed domain: https://attobahn.live. Source repository: swadesoul/attobahn. Work was requested by Swade; legal ownership and asset licenses require the authoritative owner records. No existing ATTOBAHN Bible or indexed ATTOBAHN Bible was found in the scoped canonical lookup on November 5.

## 2. Purpose and intended outcome

The website presents distributed compute and energy infrastructure, App Store modules, AttoGrid offerings, resilience case studies and partner pages. This checkpoint records delivery of source, original media, public content, names-only configuration, fonts and license notices so an authorized recipient can review and prepare a migration.

## 3. Features and evidence states

Delivered archive: ATTOBAHN-Delivery-2026-11-04.zip, 171644879 bytes, 804 ZIP entries. SHA-256: f6a40c28154f91d4b8cc72a6da66603238a3bbddb91e15ae411b32ae82c80312.

Source identity: revision 613b3e746143ec0f14410fb1b04eb37aa6040911. GitHub and the hosting project's latest-source field agreed. Of 573 tracked files, 572 were supplied byte-for-byte; the populated .env was omitted. A production bundle fingerprint is supplied, but the hosting API did not independently certify the exact deployed commit/bundle equivalence.

Media: all 27 current asset-descriptor originals, 53 repository media files, one external social image and 19 recovered stock images. The requested count of 22 was stale against the observed source inventory. Six font families and available terms/notices were bundled. These are delivered-file facts, not a guarantee that third-party ownership was independently established.

## 4. Customer journeys

The published source retains MAINTENANCE_ENABLED = true and the temporary launch experience. The full application routes remain in source. A migration recipient must configure the destination services and test the required journeys before changing that flag. The archive did not change the live website.

## 5. Source, hosting and deployment

Vite/React/TypeScript project. Source includes 37 backend function folders, migrations and lockfiles. The source build passed using the documented legacy-peer dependency workaround and a non-persisted react-is install. Committed files were restored and rechecked after the build plugin regenerated one MCP source file. Build success is not a byte-for-byte reproduction of the live bundle.

The browser reads SWADEBASE runtime authentication configuration and explicitly uses schema attobahn. Shared deployed functions differ from committed project functions; the archive does not certify a fully configured replacement backend.

## 6. Database and data ownership

Read-only PostgreSQL 17.6 snapshot: 2026-11-05T04:58:03.630331Z, REPEATABLE READ. Full attobahn structural schema contains 106 tables, 1 view and 23 functions; all 107 relations were inventoried. Ownership/grants are excluded from the dump.

Public content exported: 60 rows across 12 selected tables: categories 8, tiers 5, modules 6, AttoGrid plans 6/slides 6, published blog 4, active/archived case studies 2, security sections 12, What's New 7, partner branding 2 and CTA settings 2. Service incidents were empty. Eight additional editorial tables were empty and have empty JSON files.

Automatic approval review rejected unfiltered shareholder/investor/NDA content and partner contact/support fields. The one shareholder_reports row and those fields were not exported. Private identity, KYC, communications, ledgers, support records, operational inventories and credential data are excluded with explicit counts/reasons. Products 100 and permissions 23 are among the operational exclusions. Auth user attribution IDs are omitted from exported content.

## 7. Authentication and access

Source uses the shared SWADEBASE/Supabase-compatible stack. The schema references auth.users, auth.uid(), auth.role(), anon and authenticated roles. No auth identities, sessions, password hashes or secret-table data were supplied. Founder exemptions and full destination authorization were not reverified during this delivery; retain this as UNKNOWN, not a passed migration check.

## 8. Dependencies and configuration

Names-only configuration inventory is in the archive. The only observed site_settings key was landing_gridscope_variant; its value is excluded. Partner configuration exclusions are explicit in the manifest.

Schema functions reference pgcrypto, pg_net, Vault, pgmq and pg_cron objects. pgmq/pg_cron were not listed as installed extensions despite function-body references; runtime availability is unverified. Email queue code retains a legacy Supabase endpoint and Vault secret-reference name email_queue_service_role_key. No secret value is present. Restore instructions require a compatible shared stack and destination-specific access configuration.

## 9. Media, storage and licenses

All 27 descriptor media files retain original names, declared byte sizes and content types without resizing/transcoding. Copies under source/public/__l5e/assets-v1 preserve the existing static paths; media/originals provides separate handoff originals.

Two Unsplash identifiers returned 404, including exact source URL variants: photo-1516321310764-79c1f95d7d8c and photo-1563770660941-10a636076ee8. They were not fabricated or replaced. Photographer upload names were not available in the source; recovered stock uses source identifiers. Project media did not include separate ownership/license documents; that limitation remains explicit.

## 10. Pricing and cost controls

No additional hosted-model service, paid provider or purchase was added for this handoff. Delivery and inspection reuse existing infrastructure. No email or third-party message was sent. This statement does not claim that the ChatGPT session itself used no credits.

## 11. Jobs and monitoring

The archive records existing functions and schema routines. No job, service, schedule, provider connection or monitoring check was installed by this database/export work. Email queue runtime and destination scheduled jobs remain unverified.

## 12. Known problems and evidence

Known limits: two stock images unavailable, private/NDA export blocked, configuration values excluded, independent production-source equivalence unverified, shared runtime/source differences, project media terms absent and lockfile dependency inconsistencies. The archive uses package_status=handoff_with_documented_exclusions and must retain this status.

The separate Workscratcher enhancement was subsequently published and verified; see Workscratcher_Master_Site_Bible.md. This archive was prepared through a scoped export process and retains its documented exclusions. The strict exporter must not relabel it complete without resolving those exclusions and evidence limits.

## 13. Backup, recovery and release checks

Original live data, authentication and deployment were unchanged. The delivery archive and its manifests provide recovery material for the documented subset. Restore schema before content into a compatible empty destination; content.sql handles the workspace provisioning trigger to avoid duplicate settings. No disposable database restore was performed.

Any future deployment must follow STANDING_RULES rule 20 and DEPLOY_LOCK.md, retain a scoped rollback and verify the destination journey. Do not restore excluded credentials or private identities from this package.

## 14. Sources, history and next review

Evidence: the delivered START_HERE.md, DELIVERY_STATUS.json, FILE_MANIFEST.json, verification/BUILD_NOTES.md, database/{README.md,manifest.json,table-inventory.csv}, media inventories and licenses/LICENSES-AND-FONTS.md. Local inspection copies are under /workspace/scratch/7f0258293ace/delivery/ATTOBAHN-Delivery-2026-11-04.

Canonical rules read: SWADEBASE_Master_Site_Bible.md, STANDING_RULES.md and DEPLOY_LOCK.md on swadesoul. This first canonical record describes the November 4–5 delivery. Preserve prior versions, reconcile concurrent owner changes and verify the existing knowledge index after installation. Next review: any separately authorized recovery of missing content or production-source evidence.


## 2026-11-05 migration release in progress

Operator: ChatGPT, on the owner's request to finish the Lovable-to-SWADEBASE migration and produce the complete repository/media ZIP. GitHub source 960793ca379114f30bf2da52655d06ccf859be76 is committed and pushed. The owner-operated Nginx origin has valid TLS for the apex, www and zamaniwave domains; 17 origin checks passed on 2026-11-05 at 19:32 UTC. All 37 prefixed backend functions and their isolated shared helpers are installed; 32 unrelated app registrations and 991 unrelated function files are preserved. Current maintenance behavior is retained. DNS cutover and final live/ZIP verification follow under deployment lock chatgpt-attobahn-migration-20261105. Private rollback records are in /opt/swadebase/backups/attobahn-migration-20261105.

## November 9, 2026 — migration diagnosis and candidate prepared (ChatGPT)

CURRENT STATE: PARTIAL MIGRATION; candidate not merged or deployed. User clarified the required result is an independently rebuildable GitHub handoff with all media and SWADEBASE runtime, with no remaining Lovable platform dependency.

Verified source/live main b24277be058e4f085c82e4985aa77654a24e4edf. Remaining fixes already exist in PR6, candidate 4c56999c25286a3500c5d19a021871718ed83770, but were never merged/deployed. Candidate tested on isolated /opt/swadebase-staging/attobahn-repair-20261109: npm ci, 31 frontend tests in12 files, 37-handler backend checks, public-export/media checks and production build pass; all157 dist manifest files match. All727 tracked source files were hashed for an independent review package. Existing maintenance gate remains enabled.

Authenticated legacy storage inventory now checks ALL8 buckets: all zero objects, including studio-uploads, shareholder-messages and consultant-invoices. Media is bundled in owned source public/media and src/assets. Noncredential table hash comparison:101 tables,94 identical. Seven differ: invoices, partner_analytics_events(18 legacy/17 owned), profiles, rate_limit_log(36/34), shareholder_reports, studio_organizations, user_roles. Five credential-bearing tables excluded from comparison. Do not blindly overwrite these seven: inspect ownership/auth mapping and intended owned changes first. No private data exported by this comparison.

Fresh headless Chromium against public attobahn.live returned rendered maintenance DOM, title ATTOBAHN — Intelligence. Connected., local /assets/index-Cl5IMpYC.js, no Lovable script pattern in DOM. This improves on Nov5 cached-browser blocker; signed-in journeys, full network trace and physical iPad acceptance remain unverified.

Lovable get_project still reports published; project Git unlink is not completed. Available connector has no project-disconnect/unpublish tool. Browser fallback requires user approval before accessing its private settings. No project deletion or workspace-wide revocation performed.

Automatic approval review REJECTED merging PR6: durable default-branch mutation may trigger deployment; explicit approval for exact merge required. No workaround, alternate push, merge or production deployment attempted. Candidate studio bucket migration remains unapplied. Production unchanged. Prepared review package contains full candidate source/media and prior public60-row snapshot, and explicitly excludes full private/auth/credential export; NEVER label it complete business-data handoff.

Evidence: comparison-report.json and live-verification.json in candidate stage; test/build logs /tmp/attobahn-*-20261109.log. Recovery: no runtime rollback needed; existing production release preserved. Next: explicit approval to merge PR6/deploy under lock; test/apply scoped studio bucket; reconcile seven data differences; authenticated narrow project unlink/retirement; private destination provisioning and actual signed-in/device acceptance.


## 2026-11-12T05:06:47.342120+00:00 — ATTOBAHN remodeling maintenance deployed (ChatGPT)
Owner requested and explicitly confirmed Deploy. Recovered TemporaryLaunchPage and checked attobahn database: no maintenance table/setting; page lives in source. Reused owned hero/logo/favicon in /opt/attobahn/maintenance. Server gate now serves the standalone remodeling page for EVERY website path across attobahn.live, www and zamaniwave; no public navigation or bypass, including admin/auth/unsubscribe, standalone HTML and old JS paths. Headline: We're remodeling. For what comes next. Copy aligns with current model and prepares to unveil a first for the world. Responsive layout, reduced-motion support, no external requests or paid services. App release/data/backend untouched. nginx config test and 30 HTTPS path assertions across three domains plus three exact asset checks passed; no-store enforced. Browser visual/device QA not performed. Initial immediate post-reload check failed and was rolled back; final check after reload settled passed. Production runtime overlay is saved on server; GitHub source sync pending. Rollback: restore /opt/swadebase/backups/attobahn-remodel-20261112T030847Z/nginx.conf to /etc/nginx/sites-available/attobahn.live, nginx -t and reload. Receipt and verification in /opt/swadebase/backups/attobahn-remodel-20261112T030847Z.
