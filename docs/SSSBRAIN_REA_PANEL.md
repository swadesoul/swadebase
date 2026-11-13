# REA panel (owner only)

Route: `/rea` (nav: Systems → "◎ rea lab", admin only). Owner check is the same as Downloads:
`swadesoul@gmail.com` plus a `super_admin` or `god_mode` role.

The panel talks to REA Lab on SWADEBASE only through server functions in `src/lib/rea/rea.functions.ts`.
`src/lib/rea/client.server.ts` sends `Authorization: Bearer $REA_SSSBRAIN_INTAKE_KEY` from the server.
The key never reaches the browser.

- List reviews: `GET /api/rea/intake?source=all`, which includes each review's `build` summary.
- Start a review: `POST /api/rea/intake {url, feature}`, which uses the REA prompt template.
- Build this: `POST /api/rea/builds {submission_id}`. This creates a `rea_builds` record with status `ready`.
  The dispatcher is disabled (`REA_BUILD_DISPATCH_ENABLED=false` on swade-app-store-api), so no code is generated or run.

Server env: `REA_API_URL` (default `https://appstore-api.swadebase.cloud`) and `REA_SSSBRAIN_INTAKE_KEY`.
The details live in swadesoul/swadesoul-app-store: `docs/REA_BUILDS.md` and `adapters/rea.build.manifest.json`.
