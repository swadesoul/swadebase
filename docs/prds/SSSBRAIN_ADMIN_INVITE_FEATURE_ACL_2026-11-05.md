# SSS Brain — Admin invite + feature ACL + COS onboarding (inventory & gaps)

America/Chicago · 2026-11-05 ~7:20 AM CT · Grok Bot inventory (no code shipped).

## Standing constraints
- Public launch drip (first 100 / 5 invites / waitlist) = Promo Paul — **HOLD** until Swade says go.
- This task = **admin invite tooling** only.
- Every new SSS Brain must start isolated from Swade's personal knowledge (train from scratch).
- New-user flow must open with a COS that structures who-they-are / what-they-do via talk-in (~2 min intervals, new conversations allowed) and paste, then connect everything.
- Live source is GitHub: https://github.com/swadesoul/sssbrain.git — changes via CloudAgent PR, not Lovable AI edits / not this inventory agent cloning.
- Production Coolify app on SWADEBASE-2: `g1406wexcvceencavj1fuo0u` → https://sssbrain.live (image commit `37890e4` as of 2026-11-05).
- iPad Safari upload flows must keep working if onboarding/COS touches uploads.

## What already exists (verified)

### Invite gate (partial / broken in DB)
- Table: `sssbrain.invite_codes` (code, note, max_uses, uses, expires_at, revoked, created_by, created_at). **No features/ACL columns.** Count on SWADEBASE: **0 rows**.
- App UI signup still collects invite_code (`src/routes/auth.tsx`) and expects `invite_required` / `invite_invalid` exceptions.
- **MISSING on SWADEBASE:** function + BEFORE INSERT trigger `enforce_invite_only_signup` on `auth.users`. Only live auth.users trigger for SSS Brain today is `enqueue_workspace_provision` (AFTER INSERT). Memory that invite-only was live is **stale relative to current DB** — gate is not enforcing.
- Source migration (historical public schema): `supabase/migrations/20260826041630_ad2d1331-9a5b-49be-935a-1a7cb36f75f8.sql` — needs sssbrain-schema re-apply / repair, not assumed present.

### Admin invite UI (codes only)
- Route: `/admin` → tab **invites** (`src/routes/_authenticated/admin.tsx` Invites panel).
- Server fns: `listInvites` / `createInvite` / `revokeInvite` in `src/lib/admin.functions.ts`.
- Creates codes; does **not** collect recipient email; does **not** call Resend; UI copy says share manually or ask Swarvis.

### Email invite (chat tool only)
- Swarvis tool `send_invite` in `src/routes/api/chat.ts` (admin-only): inserts code + optional CRM contact + `sendInviteEmail`.
- Helper: `src/lib/invite-email.server.ts` → Resend; signup link `https://sssbrain.live/auth`.
- Coolify env has Resend configured (key present; do not log).

### Feature ACL (separate from invites)
- Catalog: `sssbrain.whitelabel_addon_catalog` (11 active add-ons).
- Entitlements: `sssbrain.whitelabel_entitlements` + owners `sssbrain.whitelabel_owners`.
- Admin UI: `/admin-products` (`src/routes/_authenticated/admin-products.tsx`) — toggle add-ons for an **existing** owner. Not available on invite create.
- Runtime gate: `src/lib/product-access.functions.ts` + authenticated shell `enforceProductAccess` → `/locked`.

### Auto workspace on signup (starter rows, not a new physical DB)
- Migration applied: `swade/swadebase-migrations/20261103180000_workspace_provisioning.sql` → `sssbrain.provisioning_jobs` + AFTER INSERT enqueue trigger.
- App: `ensureMyWorkspace` / `useWorkspaceProvision` on first signed-in shell load; seeds wiki/knowledge/journal/task/vault/welcome thread; skips founder; does **not** copy Swade constellation knowledge.
- Live jobs (2026-11-05): founder `swadesoul@gmail.com` = skipped; one E2E test user `oathloom-e2e-…@swadebase.invalid` = **pending attempts=0 since 2026-11-04** (never completed).
- Gap vs Swade wording "new isolated database": current model is **RLS-isolated rows in shared `sssbrain` schema**, not a separate Postgres database per customer. Confirm desired tenancy with Swade before CloudAgent builds true DB-per-tenant.

### COS / onboarding (form only — not talk-in COS)
- `/onboarding` five-field form → `saveOnboardingProfile` writes one `knowledge_entries` row.
- `/guide`, IntroVideoCard four-minute walkthrough marketing copy.
- Corporate Operating Manual defines Founder Chief of Staff role conceptually; **no** new-user COS script that walks talk-in (~2 min), paste, and connect-everything (`/connections`) end-to-end.

## Gaps vs Swade requirements (implement via CloudAgent on swadesoul/sssbrain)
1. Admin invite **section** with email send from panel (reuse `sendInviteEmail` + Resend).
2. Invite panel **feature ACL** (persist intended add-ons / Core on the invite; grant on accept / first sign-in into `whitelabel_owners` + `whitelabel_entitlements`).
3. Auto-open new isolated SSS Brain on accept (repair invite gate; complete provisioning; resolve whether shared-schema RLS is enough or true DB-per-tenant).
4. COS detailed onboarding walkthrough (talk-in + paste + connections) and force/route new users through it.
5. Re-apply / verify `enforce_invite_only_signup` in `sssbrain` schema on SWADEBASE (backup first).
6. Clear or complete stuck `provisioning_jobs` pending row for the E2E invalid user after intentional test.

## Do not
- Launch Promo Paul public drip.
- Touch VideoSayWhat / Maestro lyrics in this PR.
- Message Swade from agents; parent reports.
