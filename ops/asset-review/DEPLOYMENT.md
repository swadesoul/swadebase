# Asset Review - Master Site Bible
Version 1.0 - October 26, 2026
State: CORE WORKSPACE DEPLOYED; EXTERNAL TRANSACTION INTEGRATIONS INCOMPLETE.
URL: https://swadebase.cloud/adapters/asset-review/
Working brand: Asset Review by Swade Soul. Business owner supplied by founder: Swade Soul Holdings LLC.

## Purpose and roles
Private project intake, evidence screening, attorney review and factual contact preparation. Reuses SWADEBASE identity, Postgres, existing adapter process, native voice/model services and Backblaze.
Founder uses the existing owner session. Other users need explicit application membership and a confirmed SWADEBASE identity. Danny's supplied email is danny@dannybyers.com; a pending reviewer membership binds on verified sign-in. His existing auth account was found; no password was changed, invitation sent or sign-in impersonated. Mark's email has not been supplied; owner can add his administrator membership in Access & connections.
Owner/admin manage cases and access. Clients see their own cases. Assigned reviewers see assigned cases and private legal drafts. Owner/admin status alone does not expose private notes/drafts.

## Features shipped
Responsive cinematic homepage; case intake; encrypted original uploads; PDF text (first 30 pages), English image OCR and editable working text; integrity-checked original downloads; source-scoped instrument screening; supported public EVM/XRPL observations; private reviewer notes and versioned report drafting; engagement checks; externally confirmed $500 payment record; exact-version approval and immutable report release to client portal; contact briefings from user-supplied public-source details; digital metadata preparation export; case audit history and role grants.
CPU Llama3.2 3B is used for bounded case-grounded assistance after Qwen3 4B timed out. No paid fallback. Kokoro stock speech and the existing native transcription path are connected. Normal compute/storage costs still apply.
New evidence, corrected extraction or screening results invalidate pending report approval. Released reports remain historical versions. Evidence extraction is not issuer authentication, ownership proof or valuation.
Every case is assigned toward Danny's review queue; active review requires his engagement acceptance and a recorded payment. The $500 scope is founder-directed and still requires Danny's professional acceptance. Synthetic tests are not his acceptance or a real legal opinion.

## Not enabled
Automatic Seed LEAKER discovery/outreach, Pinhub issuance, Slither source audits, comprehensive sanctions/KYC, online fee collection, automatic report email and proposed 2.1% success-fee charging. Relevant UI states identify these gaps. Contacts and talk tracks are preparation drafts, not verified counterparties or sent messages.
Human Google consent/callback, Danny's actual signed-in journey and physical microphone/iPad permission flows remain unverified. Existing Google provider/redirect configuration already covers the route; no Google Console settings changed.

## Architecture and storage
Application: /opt/swadebase-adapters/asset-review.
Additive handler in existing /opt/swadebase-adapters/server.mjs.
No new database, identity provider, worker service or scheduler.
Tables: swadebase_ops.asset_members, asset_sessions, asset_cases, asset_evidence, asset_findings, asset_reviews, asset_reports, asset_contacts, asset_messages, asset_events. Browser-facing database roles receive no grants; access is mediated by server-side role/case checks.
Original bytes are encrypted with AES-256-GCM before Backblaze upload, under private/asset-review/<case>/<evidence>.enc. Plain originals exist only in bounded processing memory/temporary files, removed afterward. Download hash checks compare originals to recorded SHA-256.
Session tokens are encrypted; opaque cookie IDs are stored hashed. Exact-origin/CSRF checks protect mutations. Product sessions expire after one hour. Shared super-admin sessions preserve their existing lifetime and revocation.
Configuration names only: ASSET_REVIEW_FILE_KEY, ASSET_B2_ENDPOINT, ASSET_B2_KEY_ID, ASSET_B2_APPLICATION_KEY, ASSET_B2_BUCKET, ASSET_VOICE_TOKEN. Protected file /opt/swade-secrets/asset-review.env, mode 0600, loaded by an additive systemd EnvironmentFile. Never put its contents in Git or documentation.
Nginx has only a scoped /adapters/asset-review/ location with 11 MB request limit and 240-second response timeout. The existing general owner API upload limit is retained.

## Verification
Five core tests passed: encryption/tamper rejection, role/case boundaries, file-signature validation, Treasury-warning scope and exact-version/digest release.
Loopback integration tests used synthetic identities with a stubbed identity provider, real SWADEBASE tables and encrypted Backblaze storage. They passed two-client isolation, CSRF rejection, private draft exclusion, engagement/payment gates, evidence/edit approval invalidation, report release and retry deduplication. This does not certify real user sign-in.
Native case-grounded model response passed. CPU speech and native transcription roundtrip passed using synthetic audio. All thirteen existing adapter tests passed.
Public HTTPS returned 200 for homepage, JS, CSS, artwork and health; anonymous case API returned 401. Existing adapter and Brainiak health returned 200. Live desktop browser rendered the intended cinematic homepage. No private browser session was fabricated.
Synthetic records were removed through a narrowly scoped fixture cleanup routine. Remove the test-only routine after final fixture cleanup. Synthetic encrypted object cleanup is tracked separately; never bulk-delete the private storage prefix.

## Rollback
Backup: /opt/swadebase-adapters/var/asset-review-backups/20261026T170016Z.
Restore server.mjs and nginx.conf using recovery.json paths; remove only /etc/systemd/system/swadebase-adapters.service.d/asset-review.conf, daemon-reload, restart the adapter service, nginx -t then reload. Preserve tables, encrypted originals and file key for recovery. Never rotate/delete the key as a rollback step.
The existing adapter server entrypoint and unrelated routes are preserved except for the additive handler. No other product code changed.
Knowledge index retrieval of this new Bible still requires a verified refresh. Saving this file is not proof that every bot already retrieves it.
