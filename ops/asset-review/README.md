# Asset Review

Private asset-evidence and attorney-review application for SWADEBASE. Working brand: Asset Review by Swade Soul.

Deployment target: the existing swadebase-adapters service, mounted at `/adapters/asset-review/`. This is an additive module, not a second identity system or database. The existing owner session is accepted; confirmed SWADEBASE users need an explicitly granted application role. Danny's supplied email has a pending reviewer grant, which binds only after verified sign-in. No invitation or password is created by deployment.

## Implemented
- Cinematic responsive homepage, project intake, encrypted original uploads, PDF text/image OCR, editable working transcription and integrity-checked downloads.
- Deterministic instrument-screening checklist and Treasury-warning overlap; supported EVM/XRPL public observations.
- Case-scoped native local-model assistance, bounded native Kokoro speech and short Whisper dictation.
- Assigned reviewer queue, engagement checks, private notes, versioned drafts, native AI assistance, exact-version approval and immutable released reports.
- Client portal reports, externally confirmed $500 review-payment records, user-entered prospect diligence and downloadable talk tracks.
- Digital metadata preparation export, activity history and administrator access grants.

## Explicitly unavailable
Seed LEAKER automatic prospect discovery, live Pinhub minting, Slither audits, comprehensive sanctions/KYC or ownership verification, online review checkout, automatic email delivery and the proposed 2.1% success-fee charging. These remain disabled and visibly labeled. No final legal opinion or guarantee is generated automatically.

## Security
Server-verified SWADEBASE identity; product session tokens encrypted with AES-256-GCM and random session IDs stored hashed. CSRF tokens and exact origin checks on mutations. Role and case checks run for every request. Owner/administrator roles do not read private reviewer notes or unreleased drafts. Originals are encrypted before durable Backblaze storage; downloads verify their recorded hash. OCR uses bounded temporary files removed after processing. File type/signature and size limits, request budgets and upstream timeouts apply.

Environment names only: `ASSET_REVIEW_FILE_KEY` (32 bytes hex), `ASSET_B2_ENDPOINT`, `ASSET_B2_KEY_ID`, `ASSET_B2_APPLICATION_KEY`, `ASSET_B2_BUCKET`, `ASSET_VOICE_TOKEN`. Values stay in the protected server environment. No model-provider API key or paid fallback is required. Infrastructure still has operating costs.

Initial extraction supports PDF text for the first 30 pages, PNG/JPEG English OCR and UTF-8 text. Scanned PDFs without embedded text need page-image uploads or manual transcription in this release. The app describes OCR limitations; it never treats extraction as authenticity.

## Install / rollback
1. Back up the existing adapter entrypoint and service configuration.
2. Apply schema.sql to existing SWADEBASE Postgres as the database administrator. Tables grant only the existing server role; browser-facing database roles receive no grants.
3. Copy this folder to `/opt/swadebase-adapters/asset-review`; import routes.mjs in the existing server and append its handler to the existing handlers array.
4. Add a protected systemd EnvironmentFile containing the named values and restart only the existing adapter service after syntax and integration checks.
5. Rollback restores the prior entrypoint and drops only the additive systemd override; retain case tables and encrypted objects for recovery. Do not drop records or rotate the file key during rollback.

Run `node --test test/core.test.mjs`. HTTP/database acceptance tests should exercise two clients, a reviewer and an administrator with synthetic data, ensuring cross-case denial, CSRF rejection, draft privacy, stale approval rejection and immutable report delivery.

External human sign-in, Danny's engagement acceptance, actual payments, real legal reviews and browser microphone-device permission flows require their respective users. No one should represent those as completed by synthetic tests.
