# SWADE

SWADE is the platform semantic layer for SWADEBASE. SWADEBOTS and product apps read it through this facade. The facade is off unless `SWADE_ONTOLOGY_ENABLED=true`. Issued credentials stay pending until the owner approves them. Owner sign-in is Google through SWADEBASE auth (`docs/OAUTH.md`).

New to the idea? Read [What an ontology is](docs/PRIMER.md).

The engine is [NVIDIA Auto Ontology](https://github.com/NVIDIA/auto-ontology) (Apache-2.0), pinned in `engine/PIN` and not vendored. This process does not call a hosted NVIDIA API, does not install pgvector on the SWADEBASE platform database, and does not copy SSS Brain tenant documents into the catalog.

## Layout

```text
swade/ontology
  catalog/platform.json     starter terms and app grants
  src/swade_ontology        facade, policy, MCP, full-text search
  sdk/python                Python client
  sdk/typescript            TypeScript client
  migrations                isolated database script, rehearsal only
  docker-compose.coolify.yml
  docker-compose.engine.yml engine profile, not started by default
  docs                      architecture, runbook, per-app follow-ups
```

## Tests

```bash
python3 -m unittest discover -s swade/ontology/tests -v
node --experimental-strip-types --test swade/ontology/sdk/typescript/src/client.test.ts
```

## Enable

Leave the flag false until an operator follows `docs/RUNBOOK.md`. Migrations are rehearsed with `BEGIN` … `ROLLBACK` and are not applied by this service.
