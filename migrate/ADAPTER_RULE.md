# Standing rule: everything from outside becomes a SWADEBASE adapter

Status: **standing rule, given by Harold (Swade) on 2026-10-28 (America/Chicago)**. Documentation only:
writing this file changed no code, config, nginx, docker, database, key or service.

## The rule

Anything brought in from GitHub, or built outside SWADEBASE (open-source tools, models, pipelines,
third-party services, code written elsewhere), is **wrapped as a SWADEBASE adapter** before any site
uses it. No site embeds an outside tool directly. Each adapter is written once and any site (Music Mogul,
Maestro Radio, swadesoul.world, ReSing Lab, the restaurant game maker, and future sites) plugs it in.

This rule extends, and does not replace, what already exists:

- `/opt/swadebase/docs/SWADE_ADAPTER_CONTRACT_V1.md` (approved 2026-10-24): transport, auth, `status`,
  job envelope, error shape, signed callbacks, registration, and the test gate before `ready:true`.
  **Every adapter under this rule follows Contract v1.** Where this file and the contract differ, the
  contract wins until Harold approves a change.
- `/opt/swadebase/docs/STANDING_RULES.md` rule 8 (adapters follow Contract v1, side-by-side, one tool at a
  time) and rule 11 (Bible-first reuse gate: check the registry and existing adapters first; build only
  the verified gap).
- The adapter registry and kill switch in `swadebase-adapters.service`
  (`swadebase_ops.adapters_registry`, `/opt/swadebase-adapters/README.md`, `docs/ADAPTER_KILL_SWITCH.md`).
- The one-database, schema-per-site layout in `README.md` in this folder.

## What every adapter must have

| # | Requirement | How it is done on SWADEBASE today |
| --- | --- | --- |
| 1 | **Its own schema** in the shared Postgres | Schema named after the adapter (short, lowercase, e.g. `splat`). Never `public` (SSS Brain / control plane). Never a site's schema. Add it to `PGRST_DB_SCHEMAS` in `/opt/swadebase/docker/.env` **only** if browsers must read it through PostgREST; a server-only adapter keeps its schema private and is reached through its own service. Note: several existing adapters (Asset Machine, Veteran Bridge, Stripe, Maps) keep prefixed tables in the private `swadebase_ops` schema instead; new outside-tool adapters use their own schema per this rule. |
| 2 | **Routed through the SWADEBASE web server** (nginx) | Public path under `https://swadebase.cloud/adapters/<name>/` in `/etc/nginx/sites-enabled/swadebase.cloud`. The catch-all `location ^~ /adapters/` goes to `swadebase-adapters.service` (127.0.0.1:18795) with a 64k body limit, so an adapter with uploads or its own process gets a dedicated `location ^~ /adapters/<name>/` block placed **before** the catch-all (pattern: `/adapters/asset-review/`, 11m body, 240s timeout). Host services bind to loopback or 172.16.0.1 only. `swade-app-schemas.conf` (Origin -> site schema) and `app-routes.json` (edge-function gateways) are for **sites**; touch them only if the adapter ships as an edge function. |
| 3 | **Keys only on SWADEBASE** | Provider/service secrets in `/opt/swade-secrets/<adapter>.env` (root, chmod 600) or `functions.env`. Never in a client site, a Lovable project, a browser bundle, a repo, a response, a log or an error. Secret values are never printed. |
| 4 | **Documented API contract** | Contract v1 shape: `status` (auth required), `{ok,data,request_id}`, async jobs with `queued/running/done/error/cancelled` and `progress` 0-1, error object, `X-Swade-Signature` callbacks. Written in the adapter's README / DESIGN. |
| 5 | **Upstream license recorded** | Every upstream component (code, weights, models, data) with its license, link and commercial-use verdict in a `LICENSES.md` or table in the design. Only commercial-OK components ship. Non-commercial (CC BY-NC*, research-only), AGPL (for network services) and "ask us" licenses are blocked unless Harold approves in writing. |
| 6 | **Version pinning** | Git commit SHA or release tag, package lockfile, container image digest and model-weight checksum recorded. No `latest`, no floating branches. Upgrades are a new pinned version, tested, then switched side by side. |
| 7 | **Per-site access list / keys** | A site uses the adapter only when enabled: `swadesoul.swade_site_modules` row (`enabled`, `config_json` with no secrets) plus a SWADE Connect key (`X-SWADE-API-KEY`, sha256 in `swadesoul.swade_api_keys`, `site_id` + `scopes`) or a SWADEBASE user JWT. Site and owner are derived server-side, never taken from the caller. Per-site quotas and settings may live in the adapter schema; key material does not. |
| 8 | **A README** | `README.md` next to the adapter: what it does, upstream + license + pinned version, endpoints, secrets file name (not value), schema, storage, ops (start/stop, logs, kill switch), cost, rollback. |

Also required: a module slug in `swadesoul.swade_modules`, an entry in the adapter registry with its kill
switch, durable outputs in Backblaze B2 (existing storage policy), bounded cost (no paid provider call
without an approved budget), and a Site Bible update after any material change (standing rule 11).

## Adapter checklist (mirrors the migration kit: open, push, build, upload, verify, route, close)

Nothing in this list is run by writing this file. Each step needs Harold's go-ahead when it changes the server.

1. **Open** - Bible-first check: read the SWADEBASE Master Site Bible, `SWADE_ADAPTER_CONTRACT_V1.md` and
   the registry; confirm no existing adapter already does this. Pick the name / module slug. Write
   `DESIGN.md` under `/opt/swadebase/migrate/adapters/<name>/`. Record upstream licenses and the commercial
   verdict. Get Harold's approval of the design.
2. **Push** - Bring the upstream in at a pinned version (commit SHA / tag / image digest / weight
   checksum) into its own folder (e.g. `/opt/swadebase-adapters/<name>` or `/opt/<name>-adapter`), never
   into a site repo. Record versions in the README.
3. **Build** - Back up first (database schema dump, nginx config, env files, to
   `/opt/swadebase/backups/adapter-<name>-<ts>/`). Create the adapter schema with grants for its service
   role only. Create `/opt/swade-secrets/<name>.env` (chmod 600, values never printed). Wrap the tool
   behind the Contract v1 envelope. Install a systemd unit bound to loopback.
4. **Upload** - Seed static assets/models; durable outputs go to B2 under an adapter prefix. Register the
   module slug, the registry entry (kill switch off by default) and per-site `swade_site_modules` rows.
5. **Verify** - Contract v1 test gate: `status` 401 without auth, 403 wrong scope; a disposable job runs
   end to end; polling works; signed callback verifies and a tampered one is rejected; caller-supplied
   site/owner rejected; test data cleaned up. Only then `ready:true`.
6. **Route** - Add the dedicated `location ^~ /adapters/<name>/` block before the `/adapters/` catch-all,
   `nginx -t`, graceful reload (restore the backup if the test fails). Add the schema to
   `PGRST_DB_SCHEMAS` only if browsers need PostgREST access (then `docker compose up -d rest`, never during
   a migration push). Enable the first site.
7. **Close** - Update the adapter README, the SWADEBASE Master Site Bible (capability, route, tests,
   rollback), What's New and the daily summary. Remove temporary test users/keys. Leave the kill switch
   documented.

## Adapters under this rule

| Adapter | Folder | State |
| --- | --- | --- |
| `splat` - photos to walkable Gaussian splat scene | `adapters/gaussian-splat/DESIGN.md` | Design only, pending Harold's approval. Nothing built. |
