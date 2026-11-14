# SWADE runbook

This runbook prepares SWADE on Coolify. It does not deploy it, and it does not apply a migration to a live database.

## Current state

- `SWADE_ONTOLOGY_ENABLED` defaults to `false`.
- The process answers `/health` and refuses knowledge routes while the flag is false.
- Startup does not create tables.
- The isolated database name is `swade_ontology`. Any other name is refused.
- Kumo table upload stays unset.
- Model calls use `SWADE_AI_GATEWAY_URL` only. Free callers use `auto/offline`.

## Files

| File                                | Use                                                          |
| ----------------------------------- | ------------------------------------------------------------ |
| `docker-compose.coolify.yml`        | Facade and Postgres 17. No vector extension. Port 8090 only. |
| `docker-compose.engine.yml`         | Opt-in engine profile. Internal network only.                |
| `migrations/001_swade_ontology.sql` | Credentials, audit, and full-text document refs.             |
| `scripts/rehearse_migration.py`     | Runs that script inside `BEGIN` … `ROLLBACK`.                |
| `.env.example`                      | Names only. Fill values in the Coolify secret store.         |

## Rehearse the migration

Use a disposable database whose name is `swade_ontology`. Do not point this at the SWADEBASE platform database.

```bash
SWADE_ONTOLOGY_DATABASE_URL='postgresql://swade_ontology:secret@127.0.0.1:5432/swade_ontology' \
  python3 swade/ontology/scripts/rehearse_migration.py
```

The script refuses any other database name. With no URL it only checks the file and connects to nothing. `psql` receives `BEGIN`, the script, and `ROLLBACK`. It does not send `COMMIT`.

Applying the script for real is a later operator step. This repository does not do that.

## Coolify

1. Create a new Coolify service from `swade/ontology/docker-compose.coolify.yml`.
2. Set `SWADE_ONTOLOGY_DB_PASSWORD`. Leave `SWADE_ONTOLOGY_ENABLED=false`.
3. Confirm `/health` reports `"enabled": false` and `"migrations": "not_applied"`.
4. Do not attach the service to the platform Postgres container.
5. Do not publish engine ports 3001 or 3002. The default compose does not contain those listeners.
6. Set `SWADE_AI_GATEWAY_URL` to the existing OmniRoute gateway. Do not put a hosted NVIDIA key in the environment. The process exits if it sees one.
7. Leave `SSS_BRAIN_SEARCH_URL` empty until SSS Brain exposes a tenant-scoped search. A service-role token is rejected.
8. Set `SWADEBASE_AUTH_URL` to the SWADEBASE auth base and `SWADE_ONTOLOGY_OWNER_EMAIL` to the owner's verified Google email. Do not copy `GOOGLE_SECRET` into this service.
9. Turn the flag to `true` only after the rehearsal above has been repeated against the isolated database and an operator has applied the migration on purpose.

The engine profile is separate:

```bash
docker compose -f swade/ontology/docker-compose.engine.yml --profile engine config
```

That command renders the file. It does not start containers when used with `config`. Starting the profile builds or pulls the pinned engine and a Postgres image that includes the vector extension. Do that only for the engine database.

## Credentials

The owner signs in with Google through SWADEBASE auth, then uses the admin routes. See `docs/OAUTH.md`. A new credential is `pending` and cannot read. `POST /v1/admin/credentials/{id}/approve` writes an owner approval and allows reads inside that app and tenant. `POST /v1/admin/credentials/{id}/revoke` writes a revocation and denies reads again.

Set `SWADEBASE_AUTH_URL` and `SWADE_ONTOLOGY_OWNER_EMAIL` before turning the flag on. Leave the Google client id and secret on the SWADEBASE auth service.

A credential binds:

- `app_id` to one grant in `catalog/platform.json`
- `tenant_id` and `tenant_class` (`customer` or `personal`)
- `caller_kind` `swadebots` or `app`
- `caller_id` such as `swadebots.maestro-radio`
- `plan` `free` or `paid`
- `status` `pending`, `approved`, or `revoked`

Customer rows cannot use tenant id `swade-personal`. Personal rows cannot use any other tenant id. The process keeps credentials and approvals in memory. The migration file is the durable shape and is still not applied.

## Rollback

Set `SWADE_ONTOLOGY_ENABLED=false` and redeploy the facade. Knowledge routes return `swade_ontology_disabled`. The isolated volume can be dropped without touching the platform database. The engine profile, if it was ever started, is a different compose project and a different volume.
