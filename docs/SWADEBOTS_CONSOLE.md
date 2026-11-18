# SWADEBOTS console

SWADEBOTS is the console for the ecosystem's bots. It lives in the top-level `swadebots/` directory so it stays apart from the upstream Supabase fork in this repository. The console is off unless `SWADEBOTS_CONSOLE_ENABLED=true`.

The ontology primer in [SWADE_ONTOLOGY_PRIMER.md](SWADE_ONTOLOGY_PRIMER.md) is the text from hub pull request 65 (`cursor/swade-naming-swadebots-5cb0`). It is injected into every bot's base instructions and shown in About SWADE.

Browser sign-in is `GET /api/auth/google` from the vendored `@swade/session` package (`swadebots/vendor/swade-session`, hub pull request 66). Cookies are host-only, HttpOnly, Secure, and SameSite=Lax. Vault reveal, grants, approvals, billing, admin, and key issuance need a Google sign-in from the last 10 minutes.

Each bot has a role and a controlled-systems list. A grant names one system and is read or write. Wildcard grants are rejected, including when the owner tries to approve one. Role templates suggest the smallest scopes and leave them pending until approval.

Every credential use, SWADE knowledge query, and URL fetch appends an information-use record. The record stores the bot, task, ontology terms, sources, vault entry ids, tools, and purpose. It does not store secret values.

## Not finished in this change

- The SWADE knowledge facade is not merged. Calls go through the adapter in `swadebots/src/knowledge.mjs` and return an empty stub until `SWADE_FACADE_URL` is set.
- Migrations are not applied. Do not deploy this service.
