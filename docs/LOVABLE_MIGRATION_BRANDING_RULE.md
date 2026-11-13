# Lovable migration: owner-controlled production branding

Version 1.0. Founder instruction: Harold Whaley, October 29, 2026 (America/Chicago).
State: APPROVED POLICY. Per-site cleanup and automated enforcement require independent evidence.

Apply this to every Swade ecosystem site built, migrated, repaired or redeployed from Lovable onto owner-controlled hosting. Extend the existing migration workflow; do not create a second migration system.

1. Read the current SWADEBASE and affected Site Bibles. Inventory source, production origin, built output, favicon/manifest assets and runtime requests.
2. Remove Lovable “Built with” and “Edit with” badges, bottom-right branding overlays, badge-only scripts, production development injectors and remote badge-setting dependencies. Production branding must not depend on a Lovable subscription, credits, account or remote toggle. Do not rely on CSS hiding alone.
3. Keep each site's approved product branding. Replace inherited builder favicons, touch icons, manifest icons, browser titles and default social metadata. Use a documented ecosystem fallback only where no approved site asset exists. Version icon URLs and update service-worker/CDN/browser caches together.
4. Do not remove authentication, working application SDKs, payments, audio, licensed attribution or functional integrations merely because they mention Lovable. Inspect actual badge injection separately.
5. Add a source/build check for known badge injectors and inherited assets. Verify fresh and returning sessions, direct pages and SPA navigation; wait for delayed injection. Check public and authenticated views, desktop and iPad Safari-compatible behavior. A source scan alone is not a verified browser pass.
6. Record every production domain separately: source SHA/image, icon asset and hash, removed injector, cache handling, test results, verification time, deployment state, exceptions and rollback.
7. If a builder-hosted preview or external origin remains, identify it as a migration exception. This policy does not control another provider's hosting. Preserve the working site until an authorized cutover passes.
8. Recheck after every rebuild, dependency upgrade, deployment and migration. Update the affected Site Bible, SWADEBASE Bible and private What's New; refresh the shared knowledge index and verify retrieval.

Existing skill: lovable-to-hostinger, updated with references/production-branding.md, audit checks and migration acceptance criteria. The swadebase-build-first skill also requires this gate.

Current scope includes favicon cleanup and removal of builder-controlled footer/corner badges across the ecosystem. Do not report “all sites clean” until each actual production domain has current evidence.
