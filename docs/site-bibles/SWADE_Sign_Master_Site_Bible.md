# SWADE Sign Master Site Bible

## Seedleaker integration status — 2026-11-09T05:07:31.185052+00:00

**Checkpoint SEEDLEAKER-NATIVE-04-20261109; recorded by ChatGPT. Native revision 04 is installed and verified. Public launch is NOT certified.**

The existing SWADEBASE migration program deployed app source cfba840c7178fd59e1a0ac1fa1dc67f14354ffec, draft PR 3, as job 20261108-04. Its source inventory has 449 local files, corresponding to 445 published leaves plus four unchanged local verification artifacts; the production build contains 17 files and the backend has 37 namespaced handlers. Fresh backup/restore verified 72 tables and 151 rows, equal fingerprints, and temporary-container removal. Actual-origin Chromium verified three home widths (320, 390, 1440) and the signed-out policy route redirect, with no overflow, JavaScript error, early video request, consent call or mutation. Native Safari, real owner/member consent and actual Google completion remain unverified.

The four-purpose native key issuer and owner UI are installed, with exact private scopes for extraction, signup, signing and Labs. The private extraction capability is installed and both native/public endpoints return its specific authentication-required response. No key was issued, no extraction key was bound, and no owned-document extraction was executed. The registry correction preserves the distinct live registry and all unrelated routes; the actual owning EnvironmentFile was changed only at its module-value span. Historical failed attempts and their verified recoveries remain unchanged.

The Seed frontend and handler for explicit current-policy acceptance are installed but disabled: all six protected signup configuration names are absent. Twenty-three Node contracts, 12 Chromium component fixtures and 27 isolated assertions in the exact native Edge image passed. A legitimate confirmed email change preserves the original signed receipt on retry; phone-only/generic account confirmation cannot replace email confirmation; unavailable local storage cannot break the flow. These are scoped fixture results, not a live member acceptance. A real registered Seed policy, same-site private key and independently trusted signing public key are required before activation. Acceptance records the actual current action, never an invented historical signup time.

Shared Sign/Labs remains the existing original private beta. Seed higher-tier membership mapping is not verified; no entitlement, policy acceptance, agreement signature or contribution credit was created. Details and exact evidence are in SEEDLEAKER_Master_Site_Bible.md and releases/2026-11-09_SEEDLEAKER_Launch_Readiness.json. Public apex/www DNS remains 185.158.133.1; no payment, transfer, customer-plan change or outbound message occurred.

## Purpose and ownership

SWADE Sign is an original shared SWADEBASE signing, consent and signup-evidence capability. The founder authorized building it into the SWADEBASE Bible as an adapter usable by every ecosystem site, including SEEDLEAKER. It does not run Documenso or DocuSign code, contact a signing-vendor API, require a vendor account, or check a vendor license server. Node's maintained cryptographic implementation and the existing Postgres driver are reused; cryptographic algorithms are not invented.

Source: private `swadesoul/swade-ecosystem-hub`, `services/swadebase-adapters/trust/`. Runtime: the existing `swadebase-adapters.service`, loopback port 18795. UI: `https://swadebase.cloud/adapters/sign`. Server adapter: `https://swadebase.cloud/adapters/api/trust/`. Module and registry ID: `swade-sign`; registry display name: `Swade Sign`. Shared experiments live in the companion SWADE Labs Bible.

Deployment evidence and exact verification status are recorded in the dated release checkpoint. Source implementation alone does not establish live acceptance or installation on another site's frontend.

## Reuse decision and verified gap

Reuse SWADEBASE GoTrue identity, confirmed accounts, super-admin lookup, owner adapter service, private `swadebase_ops` schema, existing site registry/API-key hashes, shared module enables, adapter kill switch, existing B2 account, and existing knowledge index. Existing Asset Review remains responsible for OCR and document intelligence. Existing signup booleans and mutable site cookie-consent rows are not a substitute for version-bound signing evidence.

Build only the missing document lifecycle, exact-version consent receipts, authenticated site signup attestation, cryptographic evidence and portable verifier. There is no new hosted authentication account, database subscription, model call, billing system, scheduler or signing subscription. Existing hosting and storage operations still apply.

## Three distinct records

| Record | What is recorded | What it does not establish |
| --- | --- | --- |
| Agreement signature | Assigned confirmed account, exact document, typed signing name, affirmative intent and electronic-delivery action, server time, recent authentication, ordered events | Independently proofed real-world identity, notarization, qualified certificate or externally trusted time |
| Policy acceptance | Exact immutable wording, purpose, version, content hash, confirmed account action, time and signed receipt | Consent to unrelated purposes or a silently changed policy |
| Site signup proof | The originating site's authenticated backend attests to its confirmed user's acceptance of an exact signup-purpose policy | Independent observation or original time of the registration transaction; the Seed bridge records the user's actual current acceptance after confirmation and never backdates historical registration |

Marketing must have its own optional policy/action. Required terms cannot silently imply marketing permission. A changed policy receives a new version. Old receipts remain accessible. Withdrawal appends a new signed receipt; the originating site must apply the preference change to its own business workflow. Prior evidence is not erased by withdrawal.

## Agreement lifecycle

`draft → open → completed`, with `draft/open → voided`. Original bytes, title, purpose, assigned identities and expiry cannot be edited in place. Corrections require a new envelope. A completed envelope cannot be rewritten or voided; cancellation is a separate agreement or business record.

Supported originals: exact UTF-8 text up to 512 KiB, or PDF up to 5 MiB; 1–20 named email recipients; expiry 1–90 days. The PDF check verifies size, canonical base64 and the PDF header. It is not a malware scanner or a claim of full PDF conformance. Originals download as attachments under a restrictive security policy. No untrusted PDF script executes inside the application page.

The recipient signs through a confirmed SWADEBASE account matching the assigned address. Both intent and electronic delivery start unchecked. Signing requires recent server-validated authentication. A random, five-minute, single-use challenge is bound to the account, site, envelope, recipient and exact document hash. The database locks and consumes it atomically with the signature. Stable idempotency keys make retrying the same request return its existing result; changed input cannot reuse the key.

Opening an agreement creates a shareable signing path. This release does not send invitation emails automatically. The creator chooses how and when to share it.

## Security boundaries

- GoTrue validates the exact bearer before any decoded authentication claims are used. Account confirmation, deletion and ban checks are repeated against authoritative records.
- A legacy owner passphrase is not a human signer identity. Existing owner sessions must resolve to a real confirmed super-admin account; signing still requires recent authentication.
- Browser sessions use encrypted bearer storage, opaque Secure/HttpOnly/SameSite cookies, same-origin mutations and a CSRF value. Passwords are forwarded only to existing GoTrue and are not stored.
- Site servers supply both `X-SWADE-API-KEY` and the current user's bearer. The key hash, revoked/expired status, environment, optional IP restrictions and scopes are verified. Site and actor come from those credentials. Caller-supplied site, owner, actor, tier and privilege fields are rejected recursively.
- `sign:read`, `sign:write` and `signup:write` scopes separate operations. A browser must not receive a site API key. The server-only SDK is `trust/sdk/swade-sign.server.mjs`.
- Private tables have forced site RLS, no public/browser grants, and application-level owner/recipient authorization. Scoped access is transaction-local so pooled connections cannot retain another site's context.
- Every action checks the shared registry and the site's module enable. The adapter reads the same authoritative registry inside the existing service and fails closed. Site flags also permit a bounded rollout.
- Event and receipt rows are append-only for the service role. Signed recipients and completed envelopes have mutation guards. These controls do not make a privileged database operator incapable of replacing all records.
- File payloads use authenticated AES-256-GCM encryption with site/envelope/hash as authenticated context. Ed25519 evidence signatures use a separate key. Uploads are read back, decrypted and hash-verified before a successful database transition.
- Login and signing challenges are rate-limited. No arbitrary callback URL is fetched and no external webhook delivery is implemented in this release.

## Evidence and independent verification

The document identifier binds its MIME type and raw-byte SHA-256. Events include ordered sequence, previous hash and event hash; the final signed manifest commits both the event count and root. Each recipient has an independently signed receipt. The completed manifest includes those receipts and the full event chain.

The ZIP package contains original bytes, `evidence.json`, a printable completion record, verifier source and a README. It preserves original PDF bytes; it does not insert a certificate into the PDF. Run the verifier with an independently obtained trusted public key or trusted keyring. Never treat the key inside an untrusted package as sufficient evidence of who issued it. Historic public keys must survive rotation.

Example, using a trusted copy of the verifier:

```sh
node verify.mjs evidence.json original.pdf independently-trusted-key.pem
```

No network request, npm install, signing-vendor connection or live SWADEBASE connection is needed for this verification. A complete exported package is necessary for independent retention.

Legal effect depends on the transaction and applicable law. The implementation records evidence; it does not claim universal enforceability, qualified electronic signatures, legal identity proofing, trusted external timestamps or superiority to another vendor. Consumer electronic-delivery disclosures, excluded document types and jurisdiction-specific requirements need transaction-specific treatment before using this preview for regulated workflows.

## Adapter contract

All business operations require authentication. Success is `{ok:true,data,request_id}`; errors use `{ok:false,error:{code,message,retryable},request_id}`. `GET sign/status` implements contract version 1 with capabilities, blockers and actual readiness. Public key discovery is reference material, not unauthenticated business status.

| Endpoint under `/adapters/api/trust` | Method | Purpose |
| --- | --- | --- |
| `/sign/status` | GET | Authenticated readiness and capabilities |
| `/envelopes` | GET / POST | Own/assigned list; create draft |
| `/envelopes/:id` | GET | Authorized document and recipient state |
| `/envelopes/:id/open`, `/void` | POST | Creator lifecycle action |
| `/envelopes/:id/challenge`, `/sign` | POST | Recent-auth challenge and explicit signing |
| `/envelopes/:id/document`, `/evidence`, `/package` | GET | Authorized original, signed receipt and completion ZIP |
| `/policies` | GET / POST | Active policy versions; super-admin publication |
| `/consents` | GET / POST | Own receipts; affirmative acceptance |
| `/signup-proof` | POST | Originating site's authenticated signup attestation |
| `/consents/:id/withdraw` | POST | Append withdrawal receipt |

The contract is synchronous; async polling and callback-delivery gates are not applicable. Evidence-signature tampering, replay, wrong-tenant access, authority overrides, disabled module behavior and disposable end-to-end execution are the relevant gates. `ready:true` requires recorded acceptance and passing dependency probes.

## Connecting another site

1. Reuse or create that site's canonical `ecosystem_sites` row after duplicate checks. Map its existing OnePass app explicitly when Labs is needed.
2. Enable `swade-sign` in `swade_site_modules` and the private feature configuration. Reuse a correctly scoped live key or provision one through the existing owner-approved connection flow. Keep it on the site's backend.
3. Pass the current verified SWADEBASE user bearer to the server adapter. Do not mint an owner identity, share a session across sites, or accept a site ID from browser metadata.
4. Publish the site's actual approved policy wording/version. Display it to the user, record an explicit action and submit its exact policy hash. Use a stable idempotency identifier stored with the originating registration/action.
5. Call `recordSignup` only after real registration succeeds. If evidence storage fails, preserve a pending evidence job with that same identifier and surface the incomplete state; do not invent proof or repeat registration/payment.
6. Save the returned receipt reference, expose download/status to that user, and apply later withdrawal events to the site's preferences.
7. Verify denied cross-site access and a disposable signup/signature before declaring the site's integration live.

Adapter availability across the ecosystem is separate from installing the UI hook on every existing site. SEEDLEAKER's OnePass app was found; its deployed frontend source was not established during initial discovery. Its signup hook must not be described as live without a real registration test.

## Operations, keys and recovery

Key material lives only in protected owner-controlled files and is passed to the existing service through protected configuration/credentials. The file-encryption key and signing key are separate. Keep a protected backup of both keys, the private database and encrypted document objects; public key history is not secret. Do not rotate an encryption key without migrating/versioning stored objects. Do not remove an old verification key merely because a new signing key is active.

Restore the matching database, encrypted objects and encryption key together. Verify a retained sample package with its independently pinned public key. Before reinstating writes, test tenant denial, signing and encrypted round trips. The first release has no automatic evidence-deletion schedule; retention periods and jurisdiction-specific holds remain an owner policy decision. Database rollback after a completed object upload can leave an orphan encrypted object. Reconcile only the exact `private/swade-sign/` namespace against known records; do not add broad automatic deletion.

Rollback disables the module/site feature first, restores only the backed-up adapter import/navigation/config, and preserves evidence tables, keys and objects. Do not reset the dirty `/opt/swadebase` checkout or overwrite unrelated runtime adapters.

## References

- SWADE Adapter Contract v1 and standing rules 11, 12, 20, 21.
- [Electronic Signatures in Global and National Commerce Act, 15 USC 7001](https://uscode.house.gov/us/usc/119-124/t15/s7001/).
- [NIST SP 800-63A, identity proofing](https://pages.nist.gov/800-63-4/sp800-63a.html).
- [Node.js cryptography](https://nodejs.org/api/crypto.html).

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
