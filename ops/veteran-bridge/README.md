# Veteran Bridge

Independent veteran navigation powered by GroundLift. Shared SWADEBASE backend; no separate AI service or hosted Supabase dependency.

## Deployment

- Sites frontend: https://veteran-bridge.swadeswade-s-8788.chatgpt.site
- Authenticated workspace: https://swadebase.cloud/adapters/veteran-bridge/
- API prefix: https://swadebase.cloud/api/adapters/veteran-bridge/
- Backend source: /opt/swadebase/ops/veteran-bridge, imported by the existing swadebase-adapters service.
- Sites source includes exact backend module, schema and tests for recovery. Frontend assets are identical in both deployments.

## Live capabilities

SWADEBASE email sign-in, existing Google OAuth with S256 PKCE, per-user Bridge reference IDs, generic plan storage with optimistic concurrency, and consented local Ollama navigation. Existing model llama3.2:3b; one concurrent request, 5 messages per 15 minutes and 20 attempts per server day per verified user; 2,000-character input and 260 output-token cap; no paid-provider fallback. Account tokens stay in memory and rotate while the tab remains open; PKCE verifier is single-use sessionStorage state. Refresh requires signing in again.

The ChatGPT-hosted frontend links to the existing SWADEBASE workspace for its identity flow; it does not add app-owned Google OAuth to ChatGPT Sites or request Sites identity privileges. Google callback remains https://swadebase.cloud/auth/v1/callback. Existing shared allowlist already covers the workspace; no shared Google configuration or credentials changed.

PDF/text viewing and structured editable letter drafting remain browser-only. No medical records upload or AI document analysis is active. Source-linked resource discovery and GroundLift/Pass the Cup draft exports are preserved. No letters, claims, requests, donations, or payments are sent or filed.

## Security and data

Every private API call verifies its Bearer token with SWADEBASE Auth. Never derive identity or privileges from client fields. Only generic plan IDs/checkmarks, reference ID, timestamps and daily request count are stored. Conversation content is not saved in application database/logs. Users explicitly consent to local-AI processing. RLS denies direct anonymous/authenticated table access; the adapter DB role is granted only these new tables and filters every profile/plan query by verified user ID. Registry kill switch is checked before operations. Exact-origin CORS, bounded requests and model timeout; raw model links/contact numbers are replaced with a pointer to trusted source references.

No credentials were copied into frontend or source. Public publishable auth key is intentional and grants no administrative access. Existing service uses existing database configuration.

## Verification

10 authorization/routing tests pass. Public HTTPS smoke: anonymous and foreign-origin rejection, email authentication with two temporary admin-created test accounts, distinct Bridge IDs, cross-user plan isolation, version conflict rejection, consent enforcement, actual local AI completion (~10 seconds), existing adapter health, and removal of both temporary accounts. Source/static browser check confirmed account and local-AI gates. Full Google consent/callback with a real user, actual iPad Safari, optional microphone, and durable clinical-data readiness are unverified.

## External access still pending

VA Patient Health API production access, relevant approved OAuth client IDs/secrets/scopes, and separate ID.me affiliation verification (if needed). SWADEBASE identity does not verify veteran status or grant VA records. Accredited claims partners, document submission, donation payments, and cloud medical-record storage remain disabled. No rating guarantees or clinical decisions.

## Recovery

Disable `veteran-bridge` in the existing adapter registry to block private operations. Remove only its handler import/registration from swadebase-adapters/server.mjs to disable the module, after checking concurrent changes. Existing service/nginx baselines: /root/veteran-bridge-backups/20261027T050236Z. Keep database rows/history; do not blindly restore whole shared files or drop shared tables. Sites can redeploy the preceding saved version; its prior source commit is 82b7af8fa184076294d142d83ed38873542968df.
