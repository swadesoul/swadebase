# SEEDLEAKER — Master Site Bible

Version 2026-11-09.3 — 2026-11-09T05:07:31.185052+00:00 — recorded by ChatGPT.
Current verification marker: SEEDLEAKER-NATIVE-04-20261109.

## Current launch status

**Native revision 04 is installed and technically verified. Seedleaker is NOT 100% launch-ready and public DNS has not been cut over.** This is the current operational record. Earlier November 8/9 checkpoints are preserved verbatim at archive/seedleaker/SEEDLEAKER_Master_Site_Bible_before_20261109_revision04.md and in protected backups. The archive is excluded by the existing knowledge-index rule; a refresh of the current documents will be verified separately.

| Component | Verified state | Remaining boundary |
| --- | --- | --- |
| Application source | Private draft PR 3; commit cfba840c7178fd59e1a0ac1fa1dc67f14354ffec; 445 published leaves; exact-head GitHub production build passed | Main remains 7b2d453277bb20384bb3504a3bebad83a14826d8 |
| Existing migration program | Program 04 source 88ba841faf7e4a7e4e21998d6356d8c3efb743b4; job 20261108-04; 449 source files / 17 frontend files / 37 handlers | Complete migration reconciliation and public cutover remain open |
| Native deployment | Database, functions, frontend and direct-origin technical verification passed | Technical checks do not certify every customer workflow |
| Backup and restore | Actual 72-table/151-row restore; matching source/restored fingerprints; temporary container removed | Database rollback is never an automatic destructive restore |
| Private-key controls | Four-purpose native owner issuer/UI installed, genuine owner and site-management authority required | No key issued or protected server binding performed |
| Document extraction | Private CPU PDF/OCR capability installed; specific native/public 401 verified | Same-site extraction key and owned-file acceptance pending |
| Signup-purpose policy evidence | Explicit acceptance frontend/handler deployed; configuration absent and disabled | Approved registered Seed policy, protected key/public-key pin and real member acceptance pending |
| SWADE Sign/Labs | Existing original shared private beta available | Seed paid-tier mapping and complete site-specific signed-in journeys remain unverified |
| Public domain | Apex/www still 185.158.133.1; intended native origin 2.25.74.73 | Final cutover, public acceptance and unattended certificate renewal pending |

The protected extraction-binding procedure has been independently reviewed and prepared, with 22 focused tests and an actual network-isolated Compose fixture. It is not installed or applied; no key was read or issued and no override was created. Review evidence: extraction-binding-root-review.json. Its readiness checks do not activate extraction.

## Founder direction and shared architecture

The founder approved original SWADE Sign and SWADE Labs as reusable adapters across all ecosystem sites and requested migration of Seedleaker through the existing SWADEBASE migration program. Reuse the owner's native identity, database, site registry, encrypted storage, AI gateway, CPU transcription, PDF/OCR, billing broker and knowledge index. No signing-vendor runtime, account, license connection or new hosted signing subscription is required.

Shared UI: https://swadebase.cloud/adapters/sign and https://swadebase.cloud/adapters/labs. Native private-key controls: https://swadebase.cloud/connect/admin.html. A site backend supplies a verified user and its exact scoped private site key. Browser code must never contain the private key or claim a paid tier.

| Key purpose | Exact private scopes |
| --- | --- |
| Document extraction | documents:extract |
| Signup proof | sign:read and signup:write |
| Document signing | sign:read and sign:write |
| Labs | labs:read and labs:write |

All four purposes require the existing genuine native owner/admin and site-management checks. No session token is extracted, owner identity impersonated or key inserted behind those controls. The one-time owner key must reach the protected server channel; it must not be pasted into chat or put in the client bundle.

## Exact signup-consent behavior

The installed route is /account/signup-consent, linked from signup confirmation and Profile. It requires an authenticated, email-confirmed native account and its Seed profile. It fetches the exact registered signup-policy ID, version and wording hash before showing an unchecked acceptance control. Login, account creation, profile changes and marketing choices do not silently accept this policy.

The server uses a stable site/user/policy/hash idempotency key and verifies returned Ed25519 evidence with an independently pinned trusted public key. Account and policy changes clear stale confirmation state; ambiguous writes require an explicit retry. Optional local storage contains only pending bindings, never credentials, email or a fabricated accepted flag. Denied local storage is supported. A later confirmed email change reuses the original signed receipt; the original recorded email, time and receipt remain intact.

This bridge records current policy acceptance after account confirmation. It does not independently observe or backdate an old registration transaction. Required terms and optional marketing purposes remain separate. All six SEEDLEAKER_SIGNUP_CONSENT settings were absent in the actual running Edge container during the verified browser check; their values were not read. The feature remains disabled until the exact policy, private key and trusted public key are configured.

## What the verification establishes

The actual revision 04 deployment verified all 37 namespaced handlers at the unauthenticated boundary and matched installed artifacts to the reviewed source/build. Four fresh signed-out Chromium navigations used the native HTTPS origin with certificate validation: three home sizes and the protected-policy route redirect. No consent request, application mutation, unexpected network request, early media request, horizontal overflow or JavaScript error was accepted by that check. This is not native iPad/Safari, Google completion, email delivery or real-member consent evidence.

The new consent implementation passed 23 Node contract tests, 12 actual Chromium component fixtures and 27 isolated assertions in the exact deployed Edge image with networking disabled. The only native Sign-core compatibility change is the explicit node:buffer import; the original cryptographic implementation is retained. These fixtures use synthetic account/policy responses and must not be described as production policy acceptance.

Revision03's unchanged SQL/core evidence is inherited with its original statuses. Native core v5 completed 54 successful checks, including owner/cross-user private-file isolation, preservation of referenced object bytes and native AI, then stopped because the test harness called an absent speech executable. That original run remains failed-and-cleaned. A separate, reviewed audio tail passed native STT and eight rollback-only message authorization assertions (14 recorded checks including setup). Both have 30-scope zero-remnant cleanup proofs. Normal security audit history remains. Actual owner/legacy login and all paid workflows are still separate launch gates.

## Source and data continuity

Repository: swadesoul/investor-ai-connect-10edddb7. Lovable project: dca56fc3-81c0-4789-a808-be3da1731600. Legacy hosted database reference: pryjmmuxpepxogptphla. The original source/audit is preserved at /opt/swadebase-staging/seedleaker-20261107. Rebuilt, published source and immutable evidence are under /opt/swadebase-staging/seedleaker-rebuild-20261108.

The November8 23:50–23:53 source refresh observed 58 application tables and 115 original rows across seven nonempty tables. All original content matched the native copy, with the established founder profile/project subject normalization verified separately and 27 newer native consent records retained. This is inherited point-in-time evidence; a final consistent refresh/write boundary is required for cutover.

Safe November9 source metadata observed three private buckets with zero objects, four auth users/identities (three Google and one email), zero cron jobs, empty four email queues and their four archives, zero pending network requests, scoped SQL/trigger metadata, and 142 policies. It is partial and non-atomic. No password hashes, tokens, identity_data, email values, queued messages, secret values, HTTP response bodies or raw function bodies were collected for that metadata inventory.

Actual deployed source function versions/settings, configured secret/environment NAME bindings, Auth hooks/provider/redirect settings and external provider scheduler/webhook registrations remain unverified. The Lovable connector exposes source/SQL but not those control-plane records; the verified project editor showed a private-project sign-in wall. Repository declarations are not a substitute for actual deployment inventory. Full source/destination manifests across tables, objects, users, functions, jobs, webhooks, secrets and permissions must retain provenance and truthful completeness before the existing reconciler can certify them.

## Labs and contributor recognition

Higher-tier access uses server-verified positive labs_access, labs.access or experimental_programs features tied to the site's actual OnePass app. Founder exemption is checked first. An empty/unmapped plan catalog is not authority to create customer subscriptions or assume a tier.

Feedback proceeds through submitted, reviewing, accepted, implemented and released states. Credit is issued only for a contribution that actually shipped in a recorded release. Acceptance/release notices are private in-app. Public naming requires opt-in; private signed evidence supports truthful portfolio or résumé statements and persists after tier downgrade. Ordinary signers do not need a paid Labs subscription. No contribution credit or membership entitlement was fabricated in this migration.

## Remaining launch gates

1. The exact approved Seed signup policy, genuine owner-created scoped private keys, protected server binding and actual explicit member receipt/extraction acceptance.
2. Actual higher-tier feature mapping and site-specific signed-in Sign/Labs journeys.
3. Existing-customer billing reconciliation, exact site-scoped prices and the real subscription, portal, cancellation and signed-webhook lifecycle.
4. Approved Seed investment agreement, actual receiving destination and verified payment/authorization/capture/release/refund behavior before live financial transactions.
5. Real invited registration, confirmation, legacy-user sign-in, password recovery, Google completion, delivered transactional email and native iPad/Safari upload behavior.
6. Complete eight-category migration reconciliation with a fresh cutover snapshot, controlled DNS cutover, public verification and actual unattended TLS-renewal proof.

Automatic approval review rejected sending the four existing Seed profile email addresses to Stripe for exact-email customer reconciliation. None were sent. The existing Swadez merchant remains selected; do not reconnect or choose another account. Required approval is specifically for those four addresses to Stripe, inspection of the returned customers' site metadata/subscriptions, and no changes or charges.

The shared legal package exists, but Seed is absent from its explicit coverage schedule and no actual Seed investment agreement/destination was found. Do not invent a deal, consent, recipient, billing entitlement or financial authorization. Investment checkout/release/refund, unverified Swoney/OnePass handoff/account creation, AI compliance certificates and declared unfinished/retired legacy queues/scrapers/referral commissions remain disabled. Disabling a required capability does not mark it passed.

## Deployment, recovery and retained history

Existing program: /opt/swade-migration-bridge. Current job: state/jobs/seedleaker/20261108-04. Plan SHA256: eff643fb11c963051cdb575f53d35f841b53e19a78085d7f5963732f1882e0eb. Source PR: https://github.com/swadesoul/investor-ai-connect-10edddb7/pull/3. Shared program/source PR: https://github.com/swadesoul/swade-ecosystem-hub/pull/58. Both remain draft; public main has not been merged by this work.

The native issuer v1/v2 operations and jobs 01/02/03 remain unchanged. Extraction attempt 1 failed during an immediate startup-readiness check and was independently reconciled/cleaned; attempt 2 fully rolled back after exposing an overridden module setting. Successful capability 03 uses only the effective root-owned mode 0600 EnvironmentFile value span and bounded read-only startup probes. Original failure/recovery/rollback receipts remain intact. The live registry's unrelated routes, original drop-in, 17 other configuration sources and Edge runtime were preserved.

The apex/www certificate expires February 6, 2027 at 22:47:30 GMT. Public A records have not moved; the current renewal method is not certified for unattended use. Any future DNS update must preserve the entire freshly read Namecheap editable zone and forwarding mode. Recovery uses exact, drift-safe source/config backups and prior immutable releases; never restore a database automatically over later user writes.

Canonical machine-readable status: releases/2026-11-09_SEEDLEAKER_Launch_Readiness.json. Full private evidence and protected backups stay on SWADEBASE. Do not mirror internal Bibles or credentials into external repositories. No live charge, transfer, customer-plan change, email or external message was performed.
