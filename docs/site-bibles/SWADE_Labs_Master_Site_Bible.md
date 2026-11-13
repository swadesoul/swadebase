# SWADE Labs Master Site Bible

## Seedleaker integration status — 2026-11-09T05:07:31.185052+00:00

**Checkpoint SEEDLEAKER-NATIVE-04-20261109; recorded by ChatGPT. Native revision 04 is installed and verified. Public launch is NOT certified.**

The existing SWADEBASE migration program deployed app source cfba840c7178fd59e1a0ac1fa1dc67f14354ffec, draft PR 3, as job 20261108-04. Its source inventory has 449 local files, corresponding to 445 published leaves plus four unchanged local verification artifacts; the production build contains 17 files and the backend has 37 namespaced handlers. Fresh backup/restore verified 72 tables and 151 rows, equal fingerprints, and temporary-container removal. Actual-origin Chromium verified three home widths (320, 390, 1440) and the signed-out policy route redirect, with no overflow, JavaScript error, early video request, consent call or mutation. Native Safari, real owner/member consent and actual Google completion remain unverified.

The four-purpose native key issuer and owner UI are installed, with exact private scopes for extraction, signup, signing and Labs. The private extraction capability is installed and both native/public endpoints return its specific authentication-required response. No key was issued, no extraction key was bound, and no owned-document extraction was executed. The registry correction preserves the distinct live registry and all unrelated routes; the actual owning EnvironmentFile was changed only at its module-value span. Historical failed attempts and their verified recoveries remain unchanged.

The Seed frontend and handler for explicit current-policy acceptance are installed but disabled: all six protected signup configuration names are absent. Twenty-three Node contracts, 12 Chromium component fixtures and 27 isolated assertions in the exact native Edge image passed. A legitimate confirmed email change preserves the original signed receipt on retry; phone-only/generic account confirmation cannot replace email confirmation; unavailable local storage cannot break the flow. These are scoped fixture results, not a live member acceptance. A real registered Seed policy, same-site private key and independently trusted signing public key are required before activation. Acceptance records the actual current action, never an invented historical signup time.

Shared Sign/Labs remains the existing original private beta. Seed higher-tier membership mapping is not verified; no entitlement, policy acceptance, agreement signature or contribution credit was created. Details and exact evidence are in SEEDLEAKER_Master_Site_Bible.md and releases/2026-11-09_SEEDLEAKER_Launch_Readiness.json. Public apex/www DNS remains 185.158.133.1; no payment, transfer, customer-plan change or outbound message occurred.

## Founder direction

Every capability treated as an evaluation program belongs in a private SWADEBASE experimental-program area available to eligible higher-tier members. Members may test, suggest improvements and track decisions. When an implemented suggestion ships, the contributor receives truthful launch credit and portable evidence they can use in a portfolio or résumé. Public naming is optional. The founder's existing super-admin/payment exemption remains server-enforced.

This is a shared adapter for all ecosystem sites, not a separate experimental application installed on each site. UI: `https://swadebase.cloud/adapters/labs`; API prefix `/adapters/api/trust`; module/registry ID `swade-labs`, display name `Swade Labs`. Source resides beside SWADE Sign in the existing private ecosystem repository and adapter service.

## Existing capabilities reused

Reuse SWADEBASE identity, site connections, OnePass entitlement/subscription records, private Postgres, adapter registry, existing owner navigation and knowledge index. Oathloom already has beta testers/comments/votes tied to change records; it lacks shared per-site enrollment, server-enforced higher-tier feature mapping, implementation/release linkage and opt-in contribution evidence. Existing site notification tables remain site-local. This module adds the missing shared lifecycle and private in-app notices without introducing another email provider, billing system, scheduler or model call.

## Eligibility and privacy

Each site's configuration maps explicitly to its existing OnePass app. The canonical SWADEBASE hub alone can recognize a positive Labs feature from any explicitly mapped, enabled ecosystem app; other site connections remain restricted to their own app. Access is granted by an active, unexpired positive `labs_access`, `labs.access` or `experimental_programs` entitlement, or an active user subscription whose active plan features explicitly enable Labs. The browser cannot claim a paid tier. Unknown/missing app mapping or entitlements deny member access. The verified founder/super-admin exemption is checked first.

OnePass plans/subscriptions were not populated in the initial inspected central plan catalog. That is a mapping gap, not authority to create paid subscriptions or invent price tiers. An existing site must connect its actual higher-tier entitlement to this explicit feature before its customers receive access. No customer plan is changed by enabling the adapter.

The shared module and per-site feature switches are checked before work. Program data, feedback, notifications and evidence remain private behind server checks and site RLS. A static sign-in shell does not expose experimental program content. Site credentials never enter browser bundles.

## Program and contribution lifecycle

Programs identify their purpose, capability, evaluation/beta phase, test instructions/terms and supported launch path. An enrollment records affirmative acceptance against the exact current terms hash. Enrollment is separate from general account signup and unrelated marketing consent.

Feedback progresses through `submitted → reviewing → accepted → implemented → released`, with a reasoned decline available before release. Acceptance means SWADE intends to use the idea. Implementation requires a concrete change/reference. Release requires an explicit administrator-confirmed version, release URL and notes. A release URL is recorded as owner-attested; the application does not pretend that an arbitrary external URL was independently verified.

Only implemented feedback included in a recorded release receives contribution credit. Submitting, voting or having an idea accepted is not represented as shipping a feature. Feedback ownership and its decision history persist. In-app notices tell the contributor when their suggestion is accepted and when it ships. No real person receives an email or external message merely because this feature was deployed.

## Public attribution and résumé evidence

Default: private. A member chooses their display name and whether to publish contribution credit. The public verification page exposes only the approved contribution fields and release context, not an email address, private account ID, private draft, full feedback text or internal review thread. Turning off public attribution unpublishes the page; an already downloaded or shared copy cannot be recalled.

An immutable, server-signed contribution receipt links the contributor's actual contribution to a program and release. It establishes that SWADE recorded this contribution; it is not an employment certificate, professional license, independent skill assessment or promise of compensation. Public credit and private receipt are separate views. Independently pinned SWADE public keys verify the evidence; do not trust a key solely because it accompanies a receipt.

Illustrative résumé wording: “Contributed a usability improvement incorporated into [program], release [version], through SWADE Labs.” Wording must reflect the actual recorded contribution. Do not award “developer,” “co-founder,” “employee” or professional certification merely for feedback.

## Adapter contract

All private operations require the verified user and, for another site's backend, its scoped site key. `labs:read` and `labs:write` scopes apply. Server eligibility is rechecked; hiding a navigation link is not authorization.

| Endpoint under `/adapters/api/trust` | Method | Purpose |
| --- | --- | --- |
| `/labs/status` | GET | Authenticated capabilities/readiness |
| `/programs` | GET / POST | Eligible member list; admin creates program |
| `/programs/:id` | GET | Program, own/authorized feedback and exact enrollment terms |
| `/programs/:id/enroll` | POST | Affirmative current-terms enrollment |
| `/programs/:id/feedback` | POST | Idempotent idea, issue or improvement submission |
| `/feedback/:id/review` | POST | Administrator decision and implementation reference |
| `/programs/:id/release` | POST | Explicit release and implemented contribution credits |
| `/profile` | GET / POST | Display name and opt-in attribution |
| `/notifications` | GET | Private acceptance/release notices |
| `/credits` | GET | Own contributions |
| `/credits/:id/evidence` | GET | Own signed contribution evidence |

`/adapters/contributions/:id` is a public opt-in verification page. Private/unpublished credits return no public content. The server-only SDK shares the same connection contract as SWADE Sign.

## Evaluation policy

Record a candidate before committing to deployment. Each evaluation should state the problem missing from current SWADEBASE, the existing capability checked for reuse, expected user benefit, licensing/dependency findings, bounded operating cost, test scope and the evidence required to promote it. Reuse proven monitoring, hosting, AI routing, knowledge indexing and document intelligence already present. A repository mentioned in a video is a candidate, not permission to install a duplicate system or enable a paid provider.

The first program is the original SWADE Sign/consent/signup-evidence preview. Future programs use the same lifecycle. Higher-tier early access is an experimental privilege; evidence/consent obligations for ordinary signers must not become a paid gate. Invitees may access and sign their own agreements without purchasing a Labs subscription.

## Operations and limits

No paid provider or automatic external message is needed for this lifecycle. Existing infrastructure and normal storage apply. Do not promise an exact percentage of ChatGPT usage; the application itself does not invoke a model to sign, collect feedback, decide eligibility or issue credit.

Back up private program, enrollment, feedback, notice, profile and credit records with the existing database. Preserve signing key history for exported receipts. Disable the module to pause new work; retain already issued evidence. A downgrade removes experimental access while preserving the contributor's own receipts, notices and profile/opt-out controls. These archive controls also remain available when the Labs module is paused. Public attribution disappears while the site/module is disabled. A fully disabled site configuration prevents authenticated feature access and hides its public credits.

## Release checkpoint

Version `1.0.0-beta.1` passed 42 automated checks including the isolated real-Postgres lifecycle, plus 13 actual GoTrue/encrypted-B2/HTTP integration checks. The temporary auth account, one-use invitation and four exact synthetic B2 object versions were removed. These are staged acceptance results; the production installation checkpoint is recorded separately after deployment.

## Production release checkpoint — approved private beta

**LIVE PRIVATE BETA `1.0.0-beta.1`.** Verified November 06, 2026, 11:52 PM America/Chicago. The founder's explicit “Approve” authorized the prepared production deployment and resolved the earlier automatic-review block. The reviewed installer completed successfully; its prior rejection was not bypassed.

Source: private [PR 42](https://github.com/swadesoul/swade-ecosystem-hub/pull/42), feature commit `26c6ae4bcbe516c9874049f5fa98e16cb6db4638`, merge `b1046e4c401265e2854191e0e01fa217c8058d29`. Installation used `/opt/swadebase-staging/trust-20261107/deploy.py`. The protected backup is `/opt/swadebase/backups/swade-trust/20261107T054822Z`. Twenty installed runtime files exactly match the deployed source manifest. Only the existing adapter import/handler/navigation, scoped Nginx locations, systemd credential configuration and feature schemas/registrations were added; the existing adapter service recovered healthy.

Production verification passed 11 public HTTPS checks and 20 authenticated/access checks. A temporary account used the existing one-use invitation and real GoTrue login; no administrator privilege was granted. The native `swadeops` service returned signing `ready:true` with no blockers after reading, decrypting and hash-verifying its B2 health object using the installed credentials. Unsigned-in private requests were denied. An unentitled member could not list programs or create a native preview agreement; archive/profile reads remained available. CSRF and caller-authority overrides were denied, logout revoked the session, and a new account saw no other agreements. The temporary account, sessions and invitation were removed; no email was sent and no production agreement or contribution was fabricated.

The actual `swadebase_adapters` database connection saw no unscoped agreement/program rows. Thirteen evidence/Labs tables enforce tenant RLS with no anonymous or browser-role CRUD grants. The runtime role is neither a superuser nor an RLS-bypass role. Founder Labs access was confirmed through the authoritative database function. Both shared adapter registry records are `live`, enabled and enforcing. The private release record `4ad0d9de-0e50-43ac-ad47-247858afd412` is `internal`, reflecting a private preview rather than a general customer rollout.

SWADEBASE, SEEDLEAKER and SSSBrain are registered for shared adapter use. The native hub has three initial programs: **SWADE Sign and signup evidence**, **Contributor recognition**, and **Self-hosted capability evaluations**. Site backend integration and actual paid-tier feature mapping must still be verified per site. The central OnePass plan catalog remains empty; existing founder exemption is preserved, and no paid subscription was created or changed. SEEDLEAKER's deployed frontend source has not yet been established.

Earlier staged acceptance remains valid: 42 automated checks including real disposable PostgreSQL, 13 actual GoTrue/encrypted-B2/HTTP integration checks, and 38 browser fixture checks. Production Chromium smoke passed four real page/viewports (Sign and Labs at 1440px desktop and 390px phone) plus two Google-entry redirect checks. No overflow, JavaScript/CSP errors or missing app assets were observed. External Google login was not followed. These live checks are separate from the 38 staged browser fixture checks. Native Safari and completion of the owner's interactive Google login remain unverified. Full signing, release and contribution-evidence lifecycles were exercised in the isolated acceptance environment; production smoke checks did not create real signatures or credits.

Structured evidence: [private-beta deployment verification](../releases/2026-11-07_SWADE_Sign_Labs_Private_Beta.json). Runtime manifest: `/opt/swadebase-adapters/var/swade-trust-deployment.json`. Staging verification: `/opt/swadebase-staging/trust-20261107/production-*-checks.json`. No signing-vendor account, new hosted provider subscription, application model call or outbound notification was introduced. Existing hosting and storage costs still apply.
