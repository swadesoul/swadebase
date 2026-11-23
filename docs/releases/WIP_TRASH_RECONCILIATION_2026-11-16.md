# SWADEBASE Web Family — WIP Dashboard Trash & Reconciliation (2026-11-16)
Status: internal release; dashboard updates deployed and read-only migration analysis extended. No permanent deletion.

Founder requested ability to remove unnecessary projects from dashboard, then clarified that the system should first determine what is live, already migrated, incomplete, duplicated or missing. Reuse existing Web Family and WIP reports.

Implementation:
- Owner-authorized /adapters/api/web-family/wip: returns 104 reports and reversible Trash status.
- POST /adapters/api/web-family/wip/trash and /restore: exact project ID, confirmation and server-side project name match for trash; signed owner or verified superadmin, CSRF, append-only events. Two private tables swadebase_ops.web_family_wip_trash and _events with least-privilege grants. These actions affect ONLY the WIP dashboard; never delete Lovable, Github, backend, customer content or hosting.
- Dashboard shows Remove from dashboard, View Trash, Restore project. No automatic removal, per founder's latest request.
- Existing SWADEBASE Site Bibles reconciled with the 104 Lovable project IDs: seven exact ID appearances in Site Bibles, ten title/name-based matches. All migration statuses remain unverified (cross-reference is not proof of parity). Six specifically mapped public homepages responded HTTP 200: swadesoul.com, swideo.com, teachvirt.courses, pinhub.live, seedleaker.com, haroldwhaley.com. Public homepage 200 does not certify migration or full customer workflows.
- Source reports /opt/swadebase/docs/releases/lovable-wip-reports-20261116.json, scripts /opt/swadebase/ops/lovable-wip-reconcile.mjs and lovable-wip-http-evidence.mjs. Interface /adapters/wip-intake.

Verification: Node syntax checks passed. Mocked router passed 104-record listing, remove (confirmed exact name), restore, name-mismatch denial, anonymous denial; database role privilege checks passed; no real project removed (trash count initially zero). Health200, signed-out page redirect302 and API denial401 previously checked. Actual authenticated browser click-to-trash and real recovery remain unverified. No paid models, Lovable credits, DNS changes, production migrations or customer communications. Rollback: preserve live records, restore scoped route/UI from /opt/swadebase/backups/wip-trash-20261116, use deploy lock before restart; new tables and audit history can remain inert.

Next actions: reconcile exact Github repos and environment fingerprints for every project; compare actual capabilities, identify same-host backend/data parity, verify sessions/payments/media; classify documented active vs migrated vs WIP vs feature merge only on source+runtime evidence. Do not treat project name, Published, Site Bible or HTTP200 as proof of migration.
