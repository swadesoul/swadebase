# REA console (owner page) and SSS Brain intake

## Page
- URL: `https://swadebase.cloud/rea/` (nginx `location /rea/` on the swadebase.cloud vhost proxies to the
  swade-app-store-api service on `127.0.0.1:4186`). Not public: owner passphrase sign-in.
- Sign-in: passphrase in env var `REA_CONSOLE_PASSPHRASE`; session cookie `rea_console` (HttpOnly, Secure,
  SameSite=Strict, Path=/rea, 30 days) signed with `REA_CONSOLE_SESSION_SECRET`. Both live in
  `/opt/swade-secrets/swade-app-store-api.env`. This is separate from `ADMIN_TOKEN`, which is unchanged.
- `REA_CONSOLE_HOSTS` (optional, comma list) limits which Host headers may serve `/rea/`.
- Prompt template, always shown with inline fields:
  `Understand how [feature] works in the [site] app. Show me the evidence and build a similar feature for my project.`
  `[site]` is required (URL or bare domain such as `loops.so`); `[feature]` defaults to `its core feature set`.
  The plain "paste a URL" box uses the same template with the default feature.
- Each submission starts a normal REA run (`kind: url`, `target: site`, `notes: filled prompt`) through the
  existing `createRea` flow; the REA review logic is unchanged. An optional screenshot is shrunk on the device
  by `shrink.js` (generated from `frontend/src/oathloom/shrinkImage.ts`, `npm run build:console-shrink`).
- History is stored in `public.rea_submissions` (migration `20261024150000_rea_console_submissions.sql`) on
  SWADEBASE and journaled to `rea-console.json` in the service state directory. Status comes from `rea_runs`:
  queued, running (analyzing/building/testing), passed, failed. The page refreshes every 4 s while anything is
  running, otherwise every 20 s.

Session API (same origin, cookie): `POST /rea/api/login {passphrase}`, `POST /rea/api/logout`,
`GET /rea/api/session`, `GET /rea/api/submissions`, `POST /rea/api/submissions {site, feature?, screenshot?}`,
`GET /rea/api/runs/:runId` (run + receipts).

## SSS Brain intake
- `POST https://appstore-api.swadebase.cloud/api/rea/intake`
- Header: `Authorization: Bearer $REA_SSSBRAIN_INTAKE_KEY` (server-side only, never in a browser).
- Body (JSON, max 20 KB): `{ "url": "loops.so" | "https://…", "feature"?: string, "prompt"?: string (≤2000, used
  verbatim instead of the template), "requested_by"?: string, "external_id"?: string }`
- 201 `{ submission: { id, site_url, prompt, source: "sssbrain", status, rea_run_id, submitted_at, … } }`;
  400 bad URL; 401 missing/wrong key.
- `GET /api/rea/intake?source=sssbrain|page|all` lists submissions with status; `GET /api/rea/intake/:id`
  returns one submission plus its run and receipts.
- The key lives in `/opt/swade-secrets/swade-app-store-api.env` (var `REA_SSSBRAIN_INTAKE_KEY`). SSS Brain needs
  the same value in its own server-side env under the same name.
