# Brainiak Google sign in through SWADEBASE

Approved request: October 25, 2026.

## Entry points

- Direct SWADEBASE application: https://swadebase.cloud/brainiak
- Start Google login: https://swadebase.cloud/brainiak/auth/google
- Existing provider callback: https://swadebase.cloud/auth/v1/callback
- Application return: https://swadebase.cloud/brainiak/auth/callback
- ChatGPT review: https://brainiak.swadeswade-s-8788.chatgpt.site

Google is already enabled on the shared SWADEBASE identity service. The application's return path is under the existing swadebase.cloud allowlist. This deployment does not alter Google's client configuration, broaden the shared redirect list, restart shared authentication or replace another site's routes.

The private ChatGPT review continues to use dispatch-owned ChatGPT identity. Its new Google button opens the separate SWADEBASE-hosted application. No app-owned external OAuth stack is added to the Sites runtime.

## Authentication

The standalone Node application generates a short-lived state and PKCE verifier, stores the verifier server-side and redirects to SWADEBASE's existing Google provider. On return it checks the HttpOnly state cookie, consumes the pending state once, exchanges the code server-side and verifies the resulting user through SWADEBASE /auth/v1/user.

The browser receives an opaque Secure, HttpOnly, SameSite=Lax session cookie scoped to /brainiak. Access tokens remain in server memory. Every protected request validates its account with SWADEBASE; an identity from query parameters, an email match or an unverified decoded token never authorizes workspace access. Session state is memory-only, lasts at most one hour and is lost on application restart; a refresh-token/session persistence feature has not been added.

The shared Brainiak route/store implementation receives the verified identity through AsyncLocalStorage. Standalone builds externalize the identity module so the server and API share the same context instance. All existing workspace owner checks and origin checks remain in force.

## Data and cutover

The standalone application uses an isolated brainiak PostgreSQL schema and dedicated application role on the existing SWADEBASE database server. The ChatGPT review still uses its separate D1 database. Existing review data is not automatically copied or matched by email. A later account-link migration must prove both identities and reconcile the exported records before changing their ownership.

No existing workspaces, authentication records or shared schemas are modified by the application.

## Deployment and rollback

hostinger/build.mjs packages the SPA and reuses the same server route and command implementation for PostgreSQL. hostinger/deploy.py creates the dedicated schema/role, deploys a loopback-only service on port 18816 and adds only /brainiak routes to the existing HTTPS nginx server after a health check. It backs up the nginx configuration before changing it and restores that configuration if validation fails.

Secrets are generated or loaded locally on SWADEBASE and are never included in source or printed. The app does not need a Google client secret, a SWADEBASE service-role key or changes to the shared provider credentials.

Rollback consists of removing the marked Brainiak nginx locations after nginx validation and restoring the prior current release link if there is one. The schema and data should remain intact for recovery. Stop the isolated brainiak.service only; do not stop shared auth, gateway or database services.

## Verification

Automated tests cover state rejection, one-time callbacks, PKCE exchange, cookie flags, verified identity propagation, CSRF protection, logout and unauthorized access. Workspace tests cover data isolation and persistence.

Live Google account selection and consent require the owner to complete the sign-in. A redirect reaching Google is not by itself proof that the callback and final customer session succeeded.
