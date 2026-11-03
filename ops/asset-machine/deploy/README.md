# Asset Machine domain

The public landing page is served at https://assetmachine.live/ using the existing SWADEBASE adapter process. www and HTTP redirect to the HTTPS apex. Its sign-in action hands off to the canonical private workspace at https://swadebase.cloud/adapters/asset-machine/#workspace. Domain-bound SWADEBASE sessions and Google OAuth remain unchanged.

The landing domain returns an anonymous session and blocks private API routes. Auth paths redirect to the canonical SWADEBASE origin. The app login guard prevents cross-origin sign-in/CSRF mismatches.

The Nginx configuration references certificate paths only; no certificate private key is included. The existing Certbot account issued a certificate for apex and www. The scoped deploy hook reloads Nginx after this certificate renews. Use the existing renewal scheduler; no duplicate timer.

DNS zone snapshots and registrar credentials remain privately on SWADEBASE. No secret values or client data are stored in this repository.

Verified October 27, 2026: valid HTTPS landing; HTTP/www 301 redirects; private landing API denied; browser sign-in handoff reaches the canonical workspace login. Actual Google consent remains user-only/unverified.
