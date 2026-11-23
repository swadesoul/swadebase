# Maestro Artist Studio — November 12, 2026

Owner requested a cinematic artist-page builder embedded in Maestro, using existing SWADEBASE/OATHLOOM services invisibly, image references and prompt edits, promotion preparation and managed artist identity.

## Implemented
- Native /artist-studio route and navigation, using Maestro's existing session and SWADEBASE protocol client. Owned OATHLOOM renderer/editor components reused at source commit 04a6087.
- Existing cinematic renderer, look catalog, themes, sections, music, biography, uploaded portraits, focal positioning, desktop/phone preview, consent, drafts, revision history, restore and unpublish.
- Design requests through fixed local Ollama llama3.2:3b only, bounded prompt/context/output, three requests/minute per account and one concurrent request, sanitized style/section recommendations. No arbitrary code or external provider fallback. Supported deterministic controls remain available on model failure. Reference uploads guide palette sampling; this is not visual model analysis.
- Reference URLs/design history are saved with drafts; reference images are not silently added to public gallery. Existing upload service serves media publicly to anyone with its URL; do not claim private object storage delivery.
- Atomic publish+revision RPC, stable page address and published-snapshot directory prevent draft leakage.
- Campaign kits created from published snapshots, downloadable copy, owner-scoped campaign history, idempotent managed-email requests and activation of unique per-artist aliases on the existing artists.swadesoul.com domain through Mailcow. Aliases route to the existing managed artist inbox; passwords and API keys remain server-side.
- Existing site roles, founder exemption, no billing change. Artist page service remains free as previously offered; no new subscriptions/prices or paid providers were introduced.

## Explicit limits
Promotion kits are drafts, not directory submissions or delivered ads. Managed artist aliases can be activated after publication. They are managed aliases, not separate customer mailboxes; outside account registrations remain unexecuted. No third-party signup, external message, paid listing or automatic distribution has been executed. Existing program accounts require provider-supported management, ownership checks and explicit consent. Reference analysis extracts colors, not a screenshot-to-HTML reconstruction. Local prompt edits change supported typography/colors/sections; arbitrary new layouts/components require a separate build.
Native physical iPad Safari and Harold's personal Google login remain unverified unless separately recorded. Browser fixtures are labeled mocked; live synthetic-account testing is distinct.

## Validation
See studio-unit.log (15 tests / 52 assertions), studio-typecheck.log, studio-build.log, studio-deno.log, studio-db-test.log (rolled-back atomic publish/draft privacy/failure preservation/grant tests), studio-ui-report.json (1440/820/390, mocked uploads/auth, no production writes), studio-local-model.log (actual existing CPU model). Deployment and authenticated live receipt are recorded separately, never inferred from build tests.

## Deployment and rollback
Installer deploy-artist-studio.py checks source/test evidence, live release and factory hash and takes the shared deploy lock. It preserves all existing published HTML, backs up artist-site/_artistsite/factory files, applies additive schema, installs scoped sources, restarts only maestro-factory and swaps Maestro's static release. No OATHLOOM frontend replacement or shared edge/radio-engine restart.
Rollback: restore previous Maestro symlink and backed-up artist handler/renderer/factory files, restart maestro-factory. Retain additive tables/columns and customer revision/campaign records. Check concurrent edits before restoring source. No customer data deletion.
