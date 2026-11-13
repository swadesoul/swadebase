# Browser Workspace Master Site Bible

Version 0.1.0 — 2026-11-11T12:09:01.710115+00:00 (America/Chicago: 2026-11-11 06:09 CST). Recorded by ChatGPT.

State: installed private beta, infrastructure and bounded workflows verified. Founder interactive Google sign-in and actual third-party login remain unverified; contract ready=false explicitly retains that gate.

Verified: 10 unit tests; 16 live HTTPS/browser acceptance groups; actual forced-RLS denial; five planted checker defect classes; saved-login fixture reuse with password/destructive/offsite denial; 129 existing MCP regression tests passed, one database suite skipped in that suite (separate actual browser-table RLS test passed). Official MCP OAuth/PKCE/consent/discovery and check submission/report polling passed; the final five-tool proposal test receipt is saved separately. No paid provider, GPU, external message, purchase, payment or DNS modification. Existing services remain separate.

The checker returned a seven-page anonymous SWADEBASE report with no detected issue; 30 inventoried controls were not clicked. This is bounded evidence, not a complete site pass. The seeded fixture did detect image, JavaScript, HTTP, mobile-overflow and inert-control review cases.

The first combined test workload exposed orphaned Chromium children; the bridge now terminates its isolated process group, and repeated open/stop, persistence and check execution passed. One parallel host fixture runner aborted; it passed when run serially under the production Node runtime. Production job concurrency remains one.

Canonical source: /opt/swadebase-adapters/browser-workspace; companion MCP source: /opt/swadebase/ops/mcp/browser.mjs, service.mjs and protocol.mjs. Private source repository: swadesoul/swade-ecosystem-hub. Primary installation backup: /opt/swadebase/backups/browser-workspace-20261111T114241Z; pre-MCP-source backup: /opt/swadebase/backups/browser-mcp-20261111T114909Z. Check actual directory names before recovery. Current documentation backup: /opt/swadebase/backups/browser-docs-20261111T120901Z. Evidence: releases/browser-workspace-20261111/.

# Swade Browser Workspace — private beta 0.1.0

Owner console: https://swadebase.cloud/adapters/browser

This shared SWADEBASE adapter runs a private Webtop desktop and Playwright on the existing Hostinger VPS. Sites link to the central owner console or call the owner-scoped backend API; they never receive the founder's browser cookies. No paid model, GPU, browser subscription or new hosting is required.

## Owner workflow

1. Sign in to the central owner console using the existing SWADEBASE identity flow.
2. Save a public HTTPS website. Open its private browser and sign in directly there, including any MFA or CAPTCHA.
3. Stop the workspace before switching sites or running a Site Checker job. Cookies remain in that website's separate profile.
4. For a proposed business task, open its website, complete sign-in, return to the console, review every exact step, then approve. The desktop pauses during execution. Reopen it afterwards if needed.

The first owner Google-login completion, real third-party account login and physical iPad Safari are acceptance steps for the owner. Synthetic deployment sessions test the infrastructure and are removed; they do not certify those external login flows. Contract `ready` remains false with that explicit blocker.

## Capabilities and limits

- One desktop or checking workload at a time. Desktop session expires after 30 minutes; launch grants are one-use and expire after 60 seconds.
- Site Checker crawls up to eight pages, checks 1440px and 390px layouts, inventories up to 200 controls per page and tries a bounded set of safe interactions. It records uncaught JavaScript errors, broken images, HTTP failures, overflow, inconclusive clicks, screenshots, reproduction steps and skipped controls. It does not certify every button or authenticated journey.
- Checks use anonymous isolated contexts, block service workers, WebSockets and non-GET/HEAD/OPTIONS website requests. POST-based reads can therefore be incomplete. Screenshots mask input fields. Raw cookies, passwords, response bodies and browser traces are not attached to the report.
- Owner-approved tasks support typed `navigate`, `click`, `fill` and `extract` steps. They copy the chosen saved login into an ephemeral isolated context in memory, block writes and off-site navigation, reject password/financial fields and committing controls, and return bounded extracted results. There is no arbitrary JavaScript, shell, sending, publishing, payment, upload or download execution.
- No general AI browser planner is installed. A connected agent supplies exact steps; the owner reviews them. Sites that require POST reads, third-party frames, restrictive automation controls or expiring sessions may need a separately verified workflow.
- Job metadata, findings, proposals and audit events use the existing private SWADEBASE Postgres schema. RLS is forced on four adapter tables; browser roles have no table grants. Report screenshots are private temporary local evidence, not a Backblaze media archive. Browser profiles and credentials are never uploaded to source control or the shared knowledge index.

## Security boundary

Only server-verified founder identities with an existing super-admin session can enter. Legacy owner-token cookies do not grant desktop access. Same-origin CSRF and exact task-digest approval are required for owner actions; agent bearer credentials cannot approve tasks or mint desktop launch grants.

The desktop has its own HTTPS origin. A one-use POST handoff establishes a host-only Secure/HttpOnly/SameSite cookie tied to the parent owner session. Every HTTP request and WebSocket handshake is authorized; established desktop sockets are rechecked every five seconds. Parent-session revocation follows the existing admin-session cache window. Stop and registry kill switch revoke access and stop browser work.

Webtop and CDP ports bind to host loopback only. The container has no Docker socket, privileged mode or application/credential-directory mounts; only its own profile volume and a dedicated bridge key are mounted. Egress blocks private ranges, metadata and non-web ports; host access is restricted to public HTTP/HTTPS. IPv6 is disabled on this dedicated Docker network. The desktop is a container inside the existing Hostinger VM, not a separate VM per site. Chromium uses `--no-sandbox` inside this restricted container; this is not the same isolation as a separate VM or a functioning Chromium sandbox. Host administrators can read the protected profile files; application users cannot.

Webtop is limited to 4 GB RAM, 2 CPUs and 512 processes. Its controller service is unprivileged, uses systemd filesystem restrictions and is capped at 512 MB RAM. Browser shutdown kills its process group to prevent leaked Chromium descendants across repeated sessions.

## Shared API and MCP

`/adapters/browser/api` and `/api/adapters/browser/v1` expose authenticated status, sites, open/stop/launch, jobs/check/cancel, tasks/propose and owner-only tasks/approve/reject. Do not embed an access token in a website. Browser cross-origin API calls are denied; use the provided central link helper, or the originating site's trusted backend with the verified owner's SWADEBASE user JWT. Caller-supplied owner/site identity overrides are rejected; `website` references a server-scoped saved record.

MCP tools installed in the existing SWADEBASE server:

- `swade_browser_sites`
- `swade_site_checker` and `swade_site_check_report`
- `swade_browser_task_propose` and `swade_browser_task_report`

All require the founder actor and the existing MCP read scope; queueing/proposals additionally require `tasks:write`. Existing registry and entry-context guards remain. Agents cannot open the desktop, approve their own task, or broaden permissions. MCP clients may need to refresh tool discovery. Native SSSBrain free-form chat wiring is not separately certified by this installation.

Example: say “Use the Site Checker on Maestro.” A connected agent lists saved websites, selects Maestro's returned identifier, queues an idempotent check and polls the report. It must disclose skipped and untested controls. If the website is not saved, open the owner console to connect it first.

## Installation and recovery

`install.py` is an additive, first-install script for the existing Hostinger layout. It checks the shared deployment lock, takes a backup, creates the dedicated service user, applies the private tables, registers the adapter, sets up isolated networking, installs the two systemd services and configures HTTPS. Existing wildcard DNS already resolved the desktop host; this release made no DNS change. Production images and npm dependencies are pinned; private keys are generated only on the server. Integrating the five MCP tools also requires the reviewed companion `services/swadebase-mcp` changes and a root-only EnvironmentFile containing the two verified founder UUIDs.

For immediate stop, disable `browser-workspace` in the existing registry. For rollback, stop only `swade-browser-workspace` and `swade-browser-desktop`, remove their three explicit SWADEBASE nginx locations and the desktop virtual host, validate/reload nginx, and restore only the backed-up MCP `service.mjs`/`protocol.mjs` plus its dedicated owner-ID drop-in. Remove the two dedicated firewall jumps only if retiring the container. Preserve the private tables, profiles, reports and audit history for review; do not drop shared schemas or overwrite unrelated service changes.

Canonical operational evidence and current acceptance status are in `Browser_Workspace_Master_Site_Bible.md` and `releases/browser-workspace-20261111/` on SWADEBASE. Nine unit checks, the existing MCP regression suite, actual HTTPS/browser acceptance, seeded-defect fixtures and official MCP SDK checks are separate evidence categories. None proves that arbitrary third-party sites always permit automation.


## Final acceptance checkpoint — 2026-11-11T12:21:15.917866+00:00

All 16 live acceptance groups passed again on the final immutable container image. Ten unit tests passed. Official MCP SDK discovered 23 total tools, including all five new browser tools; proposal/report, owner rejection, agent self-approval denial, idempotent checking and actual public check completion passed. Saved-authentication operator fixtures rejected password, destructive and offsite actions without website writes. An old desktop launch grant was rejected after stop/reopen.

A persistence test initially exposed missing last-moment state across replacement. Graceful CDP Browser.close now precedes bounded process-group termination, with stale process-lock cleanup. The same persisted marker survived an actual container replacement. Runtime image: sha256:6b27508c6fdec193f29bcfb1d61bc5cb9e6bec21110461c7895ae4ab19f61f64. Startup closes orphaned browser processes and marks interrupted tasks as errors; it does not replay business actions.

Existing SWADEBASE, SSSBrain, Maestro, SwadeSoul and HaroldWhaley public checks returned HTTP 200. Owner Google and real third-party login and physical iPad Safari remain unverified; ready=false retains that precise private-beta acceptance gate. No external paid inference, messages, payments or DNS edits.


Source publication checkpoint 2026-11-11T12:22:56.938053+00:00: automatic approval review rejected the exact commit-and-push command to private swadesoul/swade-ecosystem-hub, branch feat/browser-workspace-20261111, because that payload and destination were not explicitly authorized as a trusted external destination. No retry or alternate external upload was attempted. Tested source and staged changes remain on the owner server. The runtime is installed; GitHub publication requires explicit approval.


Final source-transfer boundary 2026-11-11T12:26:44.823898+00:00: automatic review also rejected serializing the private review ZIP through the remote connector, and rejected adding a source-download endpoint as a potential disclosure path. Neither transfer nor that endpoint change was executed. No alternate external publishing attempt was made. The exact 33-file review ZIP and staged source remain on the owner server; GitHub publication awaits explicit approval of swadesoul/swade-ecosystem-hub, branch feat/browser-workspace-20261111. ZIP SHA-256: ceb736cf846e4498364f5942f4fb9db90bacc199b914b5f0115c81d11b4e0dda.


## Android QA companion — 2026-11-11T12:53:57.822642+00:00

App Factory at https://swadebase.cloud/adapters/app-factory reuses this owner website registry and links to the existing Site Checker. Its four separate MCP tools prepare Android builds/reports and queue bounded device checks. Existing browser API, profiles, cookies, write restrictions and five browser MCP tools are unchanged. See App_Factory_Master_Site_Bible.md; browser checking is not Android-device certification.
