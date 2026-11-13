# REA "Build this" (adapter `rea.build`)

Turns a **passed** REA review into a build brief. A click only creates a `rea_builds` row with status
`ready` and logs it. **Nothing is generated or run**: the dispatcher is a disabled no-op behind
`REA_BUILD_DISPATCH_ENABLED=false`.

## Where the button is

- REA page: `https://swadebase.cloud/rea/` → History → any item with status PASSED shows **Build this**.
  After a click the item shows a `BUILD READY` pill instead.
- SSS Brain: REA panel (see the sssbrain repo), which calls the endpoint below from its server.

## Endpoints

| Caller | Route | Auth |
| --- | --- | --- |
| REA page | `POST /rea/api/builds` `{ "submission_id": "<uuid>" }`, `GET /rea/api/builds` | `rea_console` session cookie, same-origin JSON |
| SSS Brain / internal | `POST https://appstore-api.swadebase.cloud/api/rea/builds` `{ "submission_id" \| "rea_run_id", "requested_by"? }` | `Authorization: Bearer $REA_SSSBRAIN_INTAKE_KEY` (server-side only) |
| | `GET /api/rea/builds?submission_id=&requested_from=`, `GET /api/rea/builds/:id` | same |
| | `GET /api/rea/builds/status` (Contract v1 `status`) | same |

Internal routes use SWADE Adapter Contract v1 envelopes: `{ok:true, job_id, status, status_path, data:{build}, request_id}`
and `{ok:false, error:{code,message,retryable}, request_id}`. Contract `status` maps `ready`→`queued`, `failed`→`error`.

Rules: only passed reviews (409 otherwise); one open brief per review (a repeat request returns the existing brief with 200);
missing or wrong key returns 401.

## Table `rea_builds`

Migration `supabase/migrations/20261024170000_rea_builds.sql`: `id, submission_id, rea_run_id, site_url, feature, prompt,
brief (jsonb), evidence_refs (jsonb: receipt id, stage, status, sha256), requested_from page|sssbrain, requested_by,
status ready|queued|running|done|failed, adapter (jsonb), dispatch_log (jsonb), error, sync_status, created_at, updated_at`.
Rows are also journaled to the REA console journal file so nothing is lost if SWADEBASE is briefly unreachable.

## Adapter

Manifest: `adapters/rea.build.manifest.json`. Registered in `swadesoul.swade_modules` as slug `rea.build`
(category `automation`, requires `agents`), `ready:false`.

Target executor (not wired): a Cursor cloud coding agent working on a new repo or branch under `swadesoul`
(suggested names are in `brief.target`), triggered by Big Mamma or the Chief of Staff picking up the brief through the
SWADEBASE handoff log (`swadesoul.agent_handoffs`, `kind='build_request'`) once that log exists and Swade approves
turning on dispatch. Until then `REA_BUILD_DISPATCH_ENABLED` stays `false` and every brief records `dispatch_skipped`.
Each brief is also written as one JSON line (`"evt":"rea_build_brief"`) to the service log (`journalctl -u swade-app-store-api`).
