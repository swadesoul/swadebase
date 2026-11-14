# SWADEBOTS console

SWADEBOTS is the console for the ecosystem's bots. It lives in the top-level `swadebots/` directory so it stays apart from the upstream Supabase fork in this repository. The console is off unless `SWADEBOTS_CONSOLE_ENABLED=true`.

The ontology primer in [SWADE_ONTOLOGY_PRIMER.md](SWADE_ONTOLOGY_PRIMER.md) is injected into every bot's base instructions and shown in the About SWADE panel. The hub copy of that file was not on `swade-ecosystem-hub` main when this was written. This file uses the owner's specified wording. If the hub file lands with different wording, replace this copy so the two stay identical.

Every credential use, SWADE knowledge query, and URL fetch appends an information-use record. The record stores the bot, task, ontology terms, sources, vault entry ids, tools, and purpose. It does not store secret values. Records are frozen and the API does not offer update or delete.

## Not finished in this change

- HttpOnly session cookies are sketched in `swadebots/src/sessions.mjs` and are not yet the sign-in path. The console still accepts a bearer token.
- A bot's grants are not yet limited to an explicit controlled-system list, and wildcard grants are not yet rejected.
- The SWADE knowledge facade is not merged. Calls go through the adapter in `swadebots/src/knowledge.mjs` and return an empty stub until `SWADE_FACADE_URL` is set.
- Migrations are not applied. Do not deploy this service.
