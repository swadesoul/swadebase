# App Factory Master Site Bible

Version 0.1.0 — 2026-11-11T12:53:57.822642+00:00; recorded by ChatGPT.

State: INSTALLED PRIVATE BETA. Real Maestro preview generated; Play publication and physical Android acceptance are not complete.

Verified: 10 Node access/input tests; 3 Python generator regression tests; 12 live HTTPS/database/worker/artifact/browser acceptance groups; official MCP SDK OAuth/PKCE/consent discovery and invocation of the four new tools; existing MCP regression suite 129 passed and one skipped DB suite. Separate live forced-RLS checks cover the new apps and job reports.

The systemd worker built cloud.swade.maestro.preview version 1 and its APK signature, package/version/target API and permission checks passed. All seven private artifact downloads matched SHA-256. Source ZIP had 14 generated project files without credential/keystore files; the release AAB was checked as unsigned. Actual Chromium layouts at 1440/820/390 pixels and report interaction passed without page exceptions or overflow. Existing public service probes returned 200. No actual owner Google login, installed Android user journey, media/background acceptance or human closed test occurred.

Pilot app: 147ec482-7a58-4077-86c0-0cfecbf59bcb; build: 00ceb631-7a2d-446f-b811-5d11ce7397ad. The APK is a debug preview with a temporary icon. It is not a Play-ready release. Device QA returned blocked rather than fabricating coverage.

Existing capability discovery found the PWA Sideload foundation and GhostRep Android SDK/Gradle/Bubblewrap workflow. The new shared adapter reuses SDK/cache and the existing Google helper dependency; it does not copy GhostRep app source, icons, release binaries, signing keys or secrets. No source changes were made to Maestro Radio. Capacitor native integration is not installed.

Known fixes: cached dependency metadata required retaining the existing jcenter repository identity alongside google/mavenCentral for offline resolution; missing release-lint dependencies were seeded once, and the actual live offline build passed with lint enabled. Android user storage is pinned inside the worker data directory. A placeholder replacement collision with JavaVersion was fixed and given a regression test.

# SWADE App Factory + Android QA
Private beta 0.1.0. Owner-approved November 11, 2026.

Owner console: https://swadebase.cloud/adapters/app-factory
API aliases: /adapters/app-factory/api and /api/adapters/app-factory/v1.

Reuses the existing owner sessions, private Postgres/RLS, browser site registry, Site Checker, MCP, Android SDK and installed Gradle dependency cache. The first engine is a fixed Google Android Browser Helper Trusted Web Activity template. It does not execute repository code or convert arbitrary server programs into native applications. Capacitor/native feature implementation is a future per-app integration, not installed by this release.

## Supported workflow
1. Save the public HTTPS application in Browser Workspace.
2. Register an app name and unique immutable Android package identifier in App Factory.
3. Build an Android test app. The worker emits a debug-signed test APK, unsigned release AAB, generated source ZIP, package report, draft domain association and store/test-plan documents.
4. Use Website QA to open the existing Site Checker. Its controls, queue, coverage and write restrictions are unchanged.
5. Request Android QA on a completed build. Without a configured authorized device, the job ends as blocked. Initial connected-device automation installs this exact generated APK, launches its fixed activity, sends Home and reopens it. Acknowledged activity launch does not prove page rendering, media or login.
6. Review actual evidence before preparing production signing, branding, store disclosures, billing and Play Console connection.

## Agent tools
- swade_app_factory: inventory and readiness.
- swade_android_build_test: queue build or android-qa with app_id, kind, request_key and build_id for QA.
- swade_android_report: read this owner's exact job and coverage.
- swade_android_cancel: cancel only a queued job.
Existing swade_site_checker and swade_site_check_report handle the website layer.

Use a stable request UUID across retries. Agent scopes are ecosystem:read and tasks:write for mutations; founder IDs are checked server-side. These tools never publish, send messages, spend or impersonate human closed-test participants. Refresh connected MCP tool discovery if needed. Native SSSBrain chat interpretation is not separately certified.

## Runtime
API runs in the existing swadebase-adapters service. swade-app-factory is one unprivileged systemd worker with a fixed build template, no paid models, 150% CPU quota, 2300 MB memory cap, 256 tasks, 600-second advertised build limit/610-second group termination, strict filesystem protection and a private temporary directory. Three pending jobs per owner and twelve submissions per rolling 24 hours. Builds block below 2 GB free space. Downloaded dependencies were seeded once with release lint enabled; recurring builds are offline and one Gradle worker.

Private metadata: swadebase_ops.app_factory_apps/jobs/events, forced owner RLS, no anon/authenticated table grants. Package identifiers are globally unique. Three tables use the existing adapter DB role; the build subprocess receives only a minimal tool environment and no DB/provider credentials.

Artifacts remain private on the existing server under /var/lib/swade-app-factory/jobs. This beta has no Backblaze artifact mirror or automatic retention cleanup; use protected server backups and monitor disk usage. The existing media archival API supports media formats rather than APK/AAB, so it was not widened. Local artifacts are not advertised as a cloud archive. API allows only seven named artifact downloads attached to a completed owner build. There is no arbitrary filesystem or existing-site-source download endpoint.

## Device connection
APP_FACTORY_ADB_SERIAL is deliberately unset. A separately authorized, preferably dedicated Android test device and a private ADB transport must be configured before device jobs can run. Do not open unauthenticated ADB to the Internet. The worker cannot accept a caller-supplied serial, shell command, app source or Android package to launch. It uses the fixed package stored on the selected parent build. No physical-device acceptance was performed during installation.

## Release gates
ready=false is intentional. Current output uses a neutral preview icon and debug signing; production signing and Google Play account connection are not configured. assetlinks.json contains the debug certificate for preview association only; Play App Signing requires the real distribution certificate fingerprint. Domain association is a draft; no website association was published. Without verification the TWA may open with browser chrome. Privacy/Data Safety, account deletion where applicable, rights, rating/audience, per-market billing, final icons/screenshots and genuine tester feedback require review. TWA generation does not guarantee Google approval.

## Recovery
Disable app-factory in the existing registry to deny new operations and terminate active runner groups within the polling window. Queued work remains pending and can be cancelled after re-enabling; restart marks interrupted running jobs as error instead of replaying them.
For rollback: stop only swade-app-factory; remove its exact factoryRoutes import/handler from server.mjs, remove the makeAppFactory import/instance/spread and four exact registerTool lines from existing MCP files, remove the App Factory navigation link; syntax-check and restart swadebase-adapters. Compare current files against the saved backup before restoring, since other approved work may have changed them. Retain metadata and artifacts. Do not drop shared tables or restore unrelated service code.
The backup path is in backup-path.txt. Canonical evidence and documentation: /opt/swadebase/docs/releases/app-factory-20261111 and site-bibles/App_Factory_Master_Site_Bible.md.


Evidence: releases/app-factory-20261111/acceptance.json, mcp-acceptance.json, mcp-tests.log, source-manifest.json and source-review.tar.gz. Installed code is on the owner server; this session did not publish it to GitHub. Backup: /opt/swadebase/backups/app-factory-20261111T123346Z.
