# Divyne Creatives Master Site Bible

## Domain outage repaired — 2026-11-07T12:24:03.847722+00:00

Acting AI: ChatGPT. Owner authorized repair of divynecreatives.com.
Verified cause: apex and www already resolved to SWADEBASE-2 (2.25.96.150); no matching deployment/router existed there, producing default HTTP 503 and a self-signed default certificate. DNS was not modified.

Restored the original swadesoul/divynecreatives source tree 8ebab35ba10ede1b19f863af2c3ecc96eb78ffc1 (129 source files verified against Git blob hashes). Host: swadebase-2. Source: /opt/divyne-recovery/source. Runtime: divynecreatives.service, unprivileged dynamic user, read-only filesystem, memory cap 384 MB, Node 22, listens on Docker bridge gateway 172.16.1.1:3198. Existing Traefik file provider watches /data/coolify/proxy/dynamic/divynecreatives.yaml. HTTP redirects to HTTPS; existing letsencrypt resolver issued a valid certificate covering apex and www, expires February 5 2027. No shared proxy restart or DNS mutation was needed.

Build adaptation: replaced provider-specific Vite config with standard TanStack Start, React, Tailwind and Nitro node-server preset. Added a site-colored crown SVG favicon and changed favicon reference. These recovery overrides are retained on the server; upstream repository sync remains outstanding. Original source is recoverable from GitHub. No backend/schema/data/payment/auth permission changes. Existing SWADEBASE divyne schema and B2 image endpoint remain in use. No new external hosting or paid services.

Verification: production build succeeded; existing Vitest routing test passed; home, music, foundation, nail studio, auth, admin shell and crown SVG returned HTTP 200; all 11 homepage JS/CSS assets returned 200. Apex/www independently verified from swadesoul with certificate validation enabled. Live Chrome confirmed original hero design and actual portrait; no visible provider badge or known badge injector in rendered HTML. B2 hero image followed redirect to HTTP 200. Runtime active after hardening restart. Evidence: /opt/divyne-recovery/verification.json, build.log, test.log on swadebase-2.

Scope limits: this restores public availability. Signed-in transactions, payment fulfillment, admin operations and native iPad Safari were not end-to-end tested. Founder exemption was not changed or recertified. Fresh Chrome session verified; returning session/native Safari not verified. Source integration code contains optional legacy preview error-report hooks, with no active injected provider script in this owner-hosted build.

Rollback: remove only /data/coolify/proxy/dynamic/divynecreatives.yaml and stop/disable divynecreatives.service. This restores the prior outage; retain source/output/logs for recovery. Do not restart the shared proxy or alter DNS. Original Vite config and favicon reference are in the pinned GitHub source. Service and router are new scoped files, not overwrites of an existing site.
