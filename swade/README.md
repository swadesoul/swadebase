# SWADE in this repository

This repository's default branch is still the upstream Supabase fork. SWADE code stays in this directory so it does not mix with `apps/`, `packages/`, `docker/`, or Supabase migrations.

| Directory        | Owner                 | What it is                                                                              |
| ---------------- | --------------------- | --------------------------------------------------------------------------------------- |
| `swade/ontology` | SWADE semantic facade | Platform terms, the read API, and the MCP server. Flagged off.                          |
| `swade/bots`     | SWADEBOTS console     | Reserved for the console agent. This ontology change does not create or edit that tree. |

SWADE is the user-facing name of the semantic layer. `swade-ontology` is the service id because a bare `swade` package would collide with the SWADE AI gateway (`SWADE_AI_GATEWAY_URL`). SWADEBOTS are the agents that read SWADE.
