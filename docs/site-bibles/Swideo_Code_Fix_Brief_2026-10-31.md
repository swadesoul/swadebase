# Swideo code-fix brief (October 31, 2026)

Repo: https://github.com/swadesoul/swideo (main = live on swideo.com through Lovable). Back end: SWADEBASE (https://swadebase.cloud), schema `swideo`.
Rules for the agent: open ONE PR, do not merge (Harold approves). No service-role key in Lovable or the browser. Keep SWIDEO_USE_SWADE_VIDEO and SWIDEO_VIDEO_ROUTER_LIVE off. No Stripe/payment setting changes. Do not touch draft PRs #2 and #4. Do not duplicate the RunPod LTX/Wan scene-picker work (separate agent, bc-10e58eaa). Do not try to remove the Lovable badge.
Helpers that already exist: `src/integrations/swadebase/server.ts` (`swadebaseUserClient(token)`, `swadebaseAnonClient()`, `swadebaseConfig()`), `src/integrations/swadebase/auth-middleware.ts` (`authenticateBearer(header)`, `requireSwadebaseAuth`).
Server-side already done (Oct 31): admin read policies on profiles/mvstudio_projects/user_credits/credit_transactions; admin write on credits; RPC `swideo.admin_gift_credits(_email text, _amount int)`; anon read of published SceneWorld projects/scenes/actions and their media in bucket `sceneworld` (paths `<user_id>/<project_id>/…` or `<user_id>/<slug>/…`); 0-balance credit rows for non-admins plus triggers.

## P0 (money and broken features)

1. Credits: missing credits row must not mean unlimited.
   - File: `src/lib/mvstudio/credits.server.ts`, `consumeCredits()`.
   - Change: when `consume_credits` returns false, throw "Not enough credits…" whether or not a row exists (remove the `if (!row) return;` grandfather branch). Keep the admin exemption (`has_role` for master_super_admin, super_admin, admin).
   - Test: unit test with a mocked client: non-admin + no row -> throws; admin -> returns without calling consume_credits; non-admin with balance -> ok.

2. Voice preview `/api/tts` uses Lovable Cloud auth (always 401 now).
   - File: `src/routes/api/tts.ts`.
   - Change: replace `authenticate()` with `authenticateBearer(request.headers.get("authorization"))` from `@/integrations/swadebase/auth-middleware` (catch -> 401). Charge or gate it like other paid calls: admins free; others call `consumeCredits(supabase, userId, 1, "tts_preview")` before the upstream request.
   - Test: POST without token -> 401; with a bad token -> 401; signed-in admin -> audio stream.

3. Public SceneWorld media signing without a user token.
   - File: `src/lib/storage/backblaze.server.ts`, `resolveRef()`.
   - Change: when there is no user token, sign `sbsw:` refs with `swadebaseAnonClient()` instead of throwing "Needs SWADEBASE server adapter" (RLS now allows anon only for published worlds; return null on error). Keep `vd:` refs token-only (return null without token, do not throw).
   - Also add legacy URL handling: a value matching `^https://apeuzjzkqibspkvuzkkl\.supabase\.co/storage/v1/object/public/(sceneworld|vision-director|user-assets|storyform-audio)/(.+)$` (old Lovable Cloud storage, now dead) is signed from the same bucket/path on SWADEBASE (user client if a token exists, else anon). All 19 such URLs today belong to the published world `noble-rayne`, and the files exist in SWADEBASE bucket `sceneworld`.
   - Also sign `video_website_assets.file_url` the same way where assets are shown.
   - Test: open https://swideo.com/w/noble-rayne logged out: background images, music and intro video load (no ORB/404 in the console). An unpublished world still shows "World not found".

4. Suno callback writes to the old Lovable Cloud DB and its URL redirects.
   - Files: `src/routes/api/public/suno-callback.ts`, `src/lib/mvstudio/music.server.ts` (`CALLBACK_BASE`).
   - Change: `CALLBACK_BASE = "https://swideo.com/api/public/suno-callback"` (swideo.lovable.app 302-redirects). Since there is no service role, make the callback advisory only: validate the payload, then return 200 without DB writes (polling via `pollMusicBed` stays authoritative), OR add a per-job random `callback_token` column and a SECURITY DEFINER RPC (needs Harold's OK for SQL). Remove the `supabaseAdmin` import so nothing uses Lovable Cloud.
   - Test: POST `{}` -> 200 `{received:true}`; a music bed still completes through polling.

## P1 (security and correctness)

5. Stripe webhook writes credits to Lovable Cloud (`src/routes/api/public/payments/webhook.ts`, `getSupabase()` uses SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY of Lovable Cloud).
   - Do NOT change Stripe settings. Report-only unless Harold approves a SWADEBASE path. Proposed: a SWADEBASE edge function `swideo-stripe-credits` (service role stays on swadesoul) that verifies the Stripe signature and calls `swideo.grant_subscription_credits`; the Lovable route forwards the raw body to it.
   - Note: until then, paid subscriptions do not add credits in SWADEBASE.

6. Admin dashboard: use the new RPC for gifting.
   - File: `src/lib/vd/admin.functions.ts` (gift handler).
   - Change: call `supabase.rpc("admin_gift_credits", { _email, _amount })` instead of read-then-upsert (avoids a race and the double insert). Show "forbidden" as "Only the master super admin can gift credits".
   - Test: as Harold, gift 5 credits to a test account -> balance +5 and one `admin_gift` transaction.

7. MCP tools (`src/lib/mv2/mcp/tools.ts`, `src/routes/api/mcp.ts`).
   - Change: accept a SWADEBASE user JWT as the bearer (owner = token `sub`, drop the X-Owner-Id header trust), and use `swadebaseUserClient(token)` in `db()`. Keep `MCP_SECRET` only as an optional extra check.
   - Test: call `list_projects` with a valid user token -> that user's mv2_projects; bad token -> 401.

8. Lovable email queue route (`src/routes/lovable/email/queue/process.ts`).
   - SWADEBASE has no pgmq and auth emails go through SWADEBASE. Change: return 410 Gone (or delete the route) so it cannot 500. Leave the swideo email tables alone.

9. Credits UI: show 0 credits correctly.
   - Files: `src/lib/vd/credits.functions.ts`, Director credits pill. A 0-balance row now exists for non-admins; make sure the pill says "0 credits · Get credits" and does not say "Unlimited" for non-admins.

## P2 (cleanup)

10. Remove dead Lovable Cloud server clients: `src/integrations/supabase/client.server.ts` and `src/integrations/supabase/auth-middleware.ts` once nothing imports them (after items 2 and 4). Add a lint rule or test that fails if `client.server` is imported.
11. `use-auth.tsx`: create the profile when it is missing, not only when the user has no roles (`select id from profiles where id = uid` first).
12. Regenerate `src/integrations/supabase/types.ts` from SWADEBASE schema `swideo` so the runtime schema cast (`'swideo' as 'public'`) stays honest; include `admin_gift_credits`.

## Test plan for the PR
- `bun run build` and `NODE_ENV=test bun test` pass.
- Logged out: https://swideo.com/w/noble-rayne shows media; /api/tts POST -> 401; all server functions -> "Unauthorized".
- Signed in as Harold: Admin shows all users and projects; Gift credits works; Director shows Unlimited; voice preview plays.
- Signed in as a normal test user: generation actions say "Not enough credits"; nothing paid runs.
