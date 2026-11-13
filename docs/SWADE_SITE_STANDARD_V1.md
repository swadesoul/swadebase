# SWADE Site Standard v1

**Status: APPROVED by Harold 2026-10-28 (no code changes yet).** Drafted Oct 28, 2026 (America/Chicago). Documentation only; nothing has been built, configured or deployed from this.

## Scope
Applies to every site Harold builds in the SWADEBASE ecosystem. Sits alongside the standing rules (`STANDING_RULES.md`), the adapter rule (`SWADE_ADAPTER_CONTRACT_V1.md`), the one-engine rule (features built once, gated by SWADEBASE grants) and the keys-on-SWADEBASE rule (rule 3).

## Requirements
1. **Admin area.** Every site has an authenticated back-office admin area.
2. **Data room.** Every site has a data room inside the back admin area (documents, metrics, exports; contents to confirm).
3. **Super admin = Harold.** Super admin is always Harold, `swadesoul@gmail.com`. Google sign-in always recognizes him via a **server-side allowlist on SWADEBASE** (verified Google ID token email + `email_verified`, ideally pinned to Google `sub`), never a client-side check.
4. **Badge, god mode, payment exemption.** Super admin shows a visible badge, has god mode (every feature and grant unlocked), and is exempt from all payments on every site (checkout bypassed server-side; no charge created).
5. **Gifting.** Super admin can gift credits and gift plans to users; each gift is recorded as a grant with `source = gifted`.
6. **Admin roles.** Super admin can assign other admins with scoped roles. Proposed set:
   - `owner` / `super_admin` (Harold only; not assignable)
   - `admin` (manage users, content, settings; no role changes to super admin, no payment settings)
   - `editor` (CMS content only)
   - `support` (view users, resend onboarding, issue limited gifts if allowed)
   - `viewer` (read-only admin + data room)
   Every role change, gift, god-mode action and exemption is written to an append-only **audit log** (who, what, target, before/after, timestamp).
7. **CMS.** Every site layout includes a robust CMS so all content is visible and manageable from the admin area.
8. **COS onboarding.** Every new site includes a COS onboarding system that teaches each new user the program from the start: shown once only, skippable, replayable from Help.
9. **SWADE Signature (added per Harold 2026-10-28).** Every site carries the SWADE Signature "AI + SI built in" mark with its own project's digits from the signature registry (`signature-registry.json`; `79233` is reserved for SWADEBASE itself). The visible badge is on by default. White-label client sites may opt out (client's choice); SWADEBASE sites must keep it on. Checked by the Site readiness monitor. Full text: `/opt/swadebase/docs/SWADE_SIGNATURE_STANDARD_V1.md`.

## Tie-in to existing rules
- **Adapter rule:** admin, data room, CMS, COS, gifting and roles are built once as shared SWADEBASE modules/adapters per SWADE Adapter Contract v1, routed through the web server; sites enable them, not re-implement them.
- **One-engine rule:** god mode, gifts and plans are grants on the shared engine; no per-site duplicates.
- **Keys on SWADEBASE:** the super-admin allowlist, OAuth client secrets and any payment keys stay on SWADEBASE.
- **Payments rule (STANDING_RULES, Oct 28):** the exemption only removes charges to Harold; it does not change any payment authority or settings.

## Mapping to existing pieces (from docs, not re-verified live)
- `brainiak.product_grants` (BRAINIAK_TIER_FEATURE_MAP.md): key (workspace, entitlement), `source` free/paid/gifted/admin, `evidence`, `active` - natural home for god mode (`admin`) and gifts (`gifted`).
- `swadesoul.swade_modules` / `swade_site_modules` (`enabled`, `config_json`): register admin, data-room, cms, cos-onboarding as modules enabled per site.
- Brainiak founder CMS (BRAINIAK_FOUNDER_CMS_AND_AUTOMATIC_UPDATES.md): existing CMS + gifted-account updates (free/paid/gifted gifting tests passed Oct 25) - candidate shared CMS base.
- Google sign-in via SWADEBASE (BRAINIAK_GOOGLE_SIGN_IN.md) and One Pass (`site-agents/one-pass.md`, incl. `onepass_onboarding_deliveries`) - candidate shared sign-in and onboarding-delivery base.
- TeachVirt Bible already names swadesoul@gmail.com as super admin.

## Current coverage (doc-based, partial)
- Brainiak: admin/founder CMS, grants, gifting, Google sign-in documented. Data room, role set, COS not documented.
- TeachVirt: super admin documented; rest not confirmed.
- Other sites: not assessed.

## Open questions for Harold
1. Does the payment exemption also cover third-party costs (API usage, AI generation, Hostinger, Stripe fees), or only the site's own prices?
2. Gift limits: caps per gift, per user or per month? Expiry? Can `support`/`admin` gift, or only super admin?
3. Data room contents: investor docs, metrics, user exports, contracts? Who besides super admin can see it?
4. Is the proposed role set right? Should any role touch billing?
5. Should the super-admin badge be visible to other users publicly or only in admin views?
6. Should a backup super-admin identity exist in case swadesoul@gmail.com is locked out?
7. COS: one shared onboarding engine with per-site scripts? Should existing users see it once at rollout?
8. Does this apply to client/white-label sites (Lamborghini provisioning), where the client would be super admin?


## Owner-controlled builder branding — October 29, 2026

Apply LOVABLE_MIGRATION_BRANDING_RULE.md to every Lovable-origin production build and migration. Use approved site-owned favicons, manifest/touch icons, titles and social metadata. Remove provider badge-only scripts and bottom-corner overlays; branding must not be controlled by a builder paid plan or credits. Preserve approved SWADE Signature branding, licensed notices and functional integrations. Require per-domain build/browser evidence and cache handling before marking migrated or ready. Existing externally hosted or unreachable sites remain exceptions until verified.

## COS implementation evidence 2026-11-11 (one-site pilot)
Shared backend `/functions/v1/cos-contextual`, registered module and `swadesoul.cos_onboarding_progress` live. Maestro first frontend pilot shipped (commit829da61) with role-specific steps, target highlighting, skip/completion and Help replay. No other site is certified integrated. Real owner-authenticated action and native Apple Safari still need acceptance; simulated browser and public smoke tested. See SWADEBASE/Maestro Bibles for full limits and rollback.
