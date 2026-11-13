# Bible entry checks — release runbook

MCP **1.1.1** was installed and verified on November 7, 2026 within the coverage described below. All **14 installed paths match the release source**. Authenticated public MCP, restricted-token MCP, and GoTrue native HTTPS checks were **not run** because suitable existing credentials were unavailable; they are not included in the success claim.

## Purpose and boundary

The existing shared MCP checks the current SWADEBASE Master Site Bible and standing rules on authenticated entry and guarded work. It supplies compact, scope-appropriate context to MCP responses and the existing native SSS Brain bridges. The existing five-minute Guardian service indexes approved documents through its intended knowledge-index post-hook.

This is not a global ChatGPT conversation-start hook. It covers requests that reach this shared MCP/service and its native bridges. Unconnected clients, arbitrary external tools, and conversations that never call these paths do not pass through the check.

Reference content is information, not additional permission. The exact boundary marker remains `approved_reference_not_action_authorization`. Existing authentication, scope checks, kill switch, owner approvals, and payment controls remain in force.

The already verified shared Stripe default is **Swadez**, account **`acct_1SizGm43OPTHaIwn`**. The entry code derives that fact from the authoritative `Shared Stripe merchant` section of `STANDING_RULES.md`; it does not hardcode an alternate merchant or make a Stripe call. Account-default evidence was preserved in private ecosystem-hub PR #52, merge `850e022`. This release neither repeats the $1 payment nor changes checkout, prices, funding, or payment authorization.

## Sources and runtime paths

Canonical private source: `swadesoul/swade-ecosystem-hub`, `services/swadebase-mcp/`.

| Source file | Runtime path | Role |
|---|---|---|
| `entry-context.mjs` | `/opt/swadebase/ops/mcp/entry-context.mjs` | Bounded current-file reads, original-byte hashes, redaction, index comparison, automation state, and scope-limited context |
| `service.mjs` | `/opt/swadebase/ops/mcp/service.mjs` | Common guard, connection entry, current context, and context on service results |
| `protocol.mjs` | `/opt/swadebase/ops/mcp/protocol.mjs` | Authenticated MCP request entry and structured tool results |
| `knowledge.mjs` | `/opt/swadebase/ops/mcp/knowledge.mjs` | Current approved references and compact context in knowledge replies |
| `route.mjs` | `/opt/swadebase/ops/mcp/route.mjs` | Existing native bridges and MCP health version 1.1.1 |

The scoped indexer source is also preserved under `ops/knowledge-learning/`: `sync.py` maps to `/opt/swadebase/ops/knowledge-learning/sync.py`, and `guardian-knowledge-index.conf` supplies the exact drop-in below. The release preserves the existing `ALLOWLIST.txt` as source evidence; it does not change the live allowlist. The indexer change writes complete receipts atomically and records failures explicitly so entry checks cannot mistake an old successful receipt for a successful new attempt.

The installed scope comprises **14 production paths**: the five runtime modules above; six MCP test files (`entry-context.test.mjs`, `core.test.mjs`, `protocol.test.mjs`, `knowledge.test.mjs`, `native-knowledge.test.mjs`, and `studio-routes.test.mjs`); `sync.py`; `sync_state_test.py`; and the new Guardian drop-in. Test files are installed for maintainability, not registered as background jobs. The exact backup/hash manifest remains authoritative for installation and rollback.

The existing adapter unit is `swadebase-adapters.service`, running `/opt/swadebase-adapters/server.mjs` as `swadeops:swadeops`. Entry checks do not give that identity new write privileges.

Authoritative documents:

- `/opt/swadebase/docs/site-bibles/SWADEBASE_Master_Site_Bible.md`
- `/opt/swadebase/docs/STANDING_RULES.md`
- Affected feature Bible: `/opt/swadebase/docs/site-bibles/MCP_Actions_Master_Site_Bible.md`
- `MCP_Studio_Master_Site_Bible.md` may link to the feature; it is not a replacement primary Bible.

## Existing indexing automation

The intended, existing template is `/opt/swadebase/ops/knowledge-learning/guardian-knowledge-index.conf`. Its installed target must be exactly:

```text
/etc/systemd/system/sssbrain-guardian.service.d/guardian-knowledge-index.conf
```

Contents:

```ini
[Service]
ExecStartPost=/usr/bin/python3 /opt/swadebase/ops/knowledge-learning/sync.py
```

Preserve the existing `abagale-merch-observer.conf` post-hook. Do not replace the Guardian unit, timer, or other drop-ins.

Existing Guardian configuration: `Type=oneshot`, `Restart=no`, system-service default root identity; main command `/usr/bin/python3 /root/build/sssbrain/ops/guardian-observer.py`. Its existing timer uses `OnBootSec=2min`, `OnUnitActiveSec=5min`, `RandomizedDelaySec=15`, and `Persistent=true`. No new scheduler is introduced.

The indexer reads its existing `ALLOWLIST.txt`, updates `sssbrain.swadebase_docs`, `sssbrain.swadebase_knowledge_chunks`, and change events, generates `/opt/swadebase/docs/core/SWADEBASE_CORE_BRIEF.md`, and writes `/opt/sssbrain-ops/incident-guardian/knowledge-sync.json`. These outputs are root-owned. It does not edit Site Bible source text, generate embeddings, train a model, or call a paid provider.

The separate `swadebase-knowledge-sync.timer` runs `swadebase-initial.sql` for an incident/knowledge snapshot. It is not the Bible indexer and must not be used as evidence that this hook ran.

## Expected behavior

Each guarded operation rereads the two mandatory reference files and compares their original-byte SHA-256 values with the index. Receipt freshness is reevaluated each time. Systemd inspection is cached for at most ten seconds; document reads and hash checks are not replaced by that cache.

- Current files, matching index, active Guardian timer, exact loaded hook, and a successful receipt no older than **12 minutes** yield `status: ready` and `automation.status: healthy`.
- Stale/missing/unavailable index metadata or degraded automation yield `status: ready_live_reference`. Current filesystem references remain available and the problem is explicit.
- Missing, unsafe, oversized, changing, or invalid UTF-8 mandatory references fail with `bible_unavailable`, HTTP 503. Production tests must not damage real documents to exercise this case; use isolated fixtures.
- Receipts more than 60 seconds in the future are invalid for health. A successful systemd exit is insufficient: the existing indexer can print a failure while exiting zero.
- Actors with `ecosystem:read` receive source metadata, bounded recent decisions, and the resolved merchant reference. Restricted actors receive only `version`, `checked_at`, `status`, `automation.status`, and `reference_boundary`.
- Ambiguous or missing merchant authority returns `stripe_default.status: unresolved`. No alternate account is inferred.

## Read-only operational checks

These commands contain no secrets. They inspect existing state; they do not start a job or mutate a provider.

```bash
systemctl is-active swadebase-adapters.service sssbrain-guardian.timer
systemctl is-enabled sssbrain-guardian.timer
systemctl show sssbrain-guardian.service --property=LoadState,DropInPaths,ExecMainStatus,ExecMainExitTimestamp --no-pager
systemctl show sssbrain-guardian.timer --property=ActiveState,LastTriggerUSec,NextElapseUSecMonotonic --no-pager
curl --fail --silent --show-error https://swadebase.cloud/adapters/mcp/health
sha256sum /opt/swadebase/docs/site-bibles/SWADEBASE_Master_Site_Bible.md /opt/swadebase/docs/STANDING_RULES.md
```

Compare the two hashes against the approved index metadata:

```bash
docker exec supabase-db psql -U postgres -d postgres -X -Atc "SELECT doc_path,doc_sha,updated_at FROM sssbrain.swadebase_docs WHERE doc_path IN ('site-bibles/SWADEBASE_Master_Site_Bible.md','STANDING_RULES.md') ORDER BY doc_path;"
```

Inspect only the nonsecret receipt fields:

```bash
python3 - <<'PY'
import json
from pathlib import Path
p = Path('/opt/sssbrain-ops/incident-guardian/knowledge-sync.json')
d = json.loads(p.read_text())
keys = ['time_utc', 'status', 'sources_considered', 'added', 'changed', 'removed', 'paid_calls', 'embeddings_generated', 'model_training']
print(json.dumps({key: d.get(key) for key in keys}, indent=2))
PY
```

The first observed scheduled execution after installation passed: Guardian triggered at **2026-11-07 07:23:23 UTC**, its main command exited at **07:23:51 UTC**, and the indexer journal/receipt recorded success at **2026-11-07T07:23:51.834355Z**. It considered **135 sources**, with **0 changes, 0 removals, 0 quarantined paths, 0 paid calls, 0 embeddings, and no model training**. This verifies a scheduled run, not merely an installed configuration. For future changes, record a later successful scheduled receipt again.

## Scoped live verification harness

`live-verification.mjs` is preserved beside this runbook. It passed **207 assertions when run as `swadeops`**, using the existing verified owner and read-only database connection. Actual service/database behavior, native route code with mocked identity/transport, public MCP health **1.1.1**, and anonymous HTTPS rejection passed. No credentials were minted, and no models or payments were invoked.

It uses an existing verified owner UUID and the existing database connection, with all direct database operations in read-only transactions. It can load only `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, and `PGPASSWORD` from the already running adapter process in memory. It does not read the Stripe key or create credentials. Native knowledge checks assert that the first source is the current standing-rules file, its excerpt contains the verified default account, its SHA matches entry context, and the reply is generated=false with no paid fallback.

Required: securely supplied `SWADE_VERIFY_OWNER_ID` and existing database environment, or `SWADE_VERIFY_RUNTIME_PID`. Run as the existing adapter identity where practical. Do not paste secrets into command arguments or commit environment files.

```text
node /path/to/live-verification.mjs --run-readonly-verification
```

The native handler result proves the deployed route and database behavior with explicitly mocked identity/transport; it does not prove a real user sign-in. The three optional genuine-credential branches remained `not_run`: `live_authenticated_mcp`, `live_restricted_mcp`, and `live_native_auth`. Suitable existing MCP, restricted MCP, and GoTrue user credentials were unavailable. No temporary credentials were created to fill that gap.

The legacy `ADAPTERS_OWNER_TOKEN` login produces `swa_owner` without `userId`, so it cannot satisfy MCP's real user/super-admin checks. Existing `knowledge-sdk-smoke.mjs` uses a temporary database session; that is a separate write-based setup and is not silently repeated by this harness. Do not rerun the old general `live-smoke.mjs`: it also registers OAuth records and creates a handoff.

Optional genuine existing credential names are `SWADE_VERIFY_MCP_BEARER`, `SWADE_VERIFY_ADMIN_COOKIE` plus `SWADE_VERIFY_ADMIN_CSRF`, `SWADE_VERIFY_RESTRICTED_MCP_BEARER`, and `SWADE_VERIFY_GOTRUE_USER_TOKEN`. Never substitute a service-role key for a user token. Optional HTTP reads can perform normal service access/session bookkeeping; the harness itself creates no auth records and performs no direct SQL writes.

## Rollback

The verified pre-deployment backup is `/opt/swadebase/backups/bible-entry-20261107T072131Z`. Use its manifest to restore only the affected MCP runtime files listed above, corresponding test files, and the prior `ops/knowledge-learning/sync.py` if rolling back its receipt change. Remove `entry-context.mjs` or a new test file only if the manifest proves it was newly introduced. Restore the previous Guardian knowledge-index drop-in if one existed, or remove only the exact newly installed knowledge-index drop-in. Preserve the existing merchandise observer, live allowlist, and timer configuration.

Do not roll back the independently verified Stripe default merely to roll back this automation. Preserve user records, auth sessions, OAuth records, payment history, current Bibles, and unrelated runtime edits. Record the rollback state in the affected Bible.

After the scoped files/drop-in have been restored under the existing deployment-lock rules, these are the service commands for the release owner to execute:

```bash
systemctl daemon-reload
systemctl restart swadebase-adapters.service
systemctl is-active swadebase-adapters.service sssbrain-guardian.timer
systemctl show sssbrain-guardian.service --property=DropInPaths --no-pager
curl --fail --silent --show-error https://swadebase.cloud/adapters/mcp/health
```

A source rollback does not undo payments or grants. This feature performs neither. The restored health version should match the version recorded in the pre-deployment manifest, not an assumed hardcoded value.

## Observed release evidence

| Evidence | Recorded result |
|---|---|
| Private source review | `swadesoul/swade-ecosystem-hub` PR #53 |
| Installed source commit | `28893536105cab4b3871d03ddc200d253fc8f0d2` |
| Merge commit | `e78b21bb4dd66fe04de2011f84e38cadc4885461` |
| Installed file verification | All 14 touched paths match the release source |
| Backup | `/opt/swadebase/backups/bible-entry-20261107T072131Z` |
| Node regression | **87 passed, 0 failed, 0 skipped**, under production Node **v20.20.2** |
| Python receipt regression | **3 passed** |
| Scoped production harness | **207 assertions passed**, running as `swadeops` |
| Scheduled Guardian/index run | Trigger **07:23:23 UTC**; successful index receipt **07:23:51.834355 UTC**, November 7, 2026 |
| Canonical documentation | Three affected canonical documents updated and indexed at **2026-11-07T07:25:46.922722Z** |
| Final readback after documentation updates | As `swadeops`: entry **ready**, automation **healthy**, merchant matches, latest entry-check decisions present; all three canonical hashes match the index and all three are found by the `automatic Bible entry` full-text query |
| Private What's New | `b6a8dc5c-66bd-53f1-834d-54fce0b9bd70`, visibility **internal** |

Authenticated public MCP, restricted-token MCP, and authenticated native HTTPS remain explicitly **not run**. This release does not establish a global ChatGPT startup hook or certify the whole platform. The separate token-loyalty feature **remains disabled**; this automation release does not activate it.
