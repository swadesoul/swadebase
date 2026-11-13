# Token Loyalty Master Site Bible

## Identity and owner rule

SWADEBASE shared token loyalty; owner Swade. Console: https://swadebase.cloud/adapters/loyalty. Source: private `swadesoul/swade-ecosystem-hub`, `services/swadebase-adapters/loyalty` and `services/swadebase-adapters/routes/loyalty.mjs`.

Five qualifying paid token purchases unlock 20% extra base tokens on the sixth purchase. Repeat at six-purchase milestones. This is a fixed reward, not a chance-based promotion. Six equal 1,000-token purchases yield 6,200 tokens overall (3.33% extra across the full cycle).

## Current release state — November 7, 2026

The shared engine, authenticated owner console and first explicit ABAGALE platform-credit adapter are installed. Customer rewards remain disabled (`enabled=false`, `activated_at=null`). A real Stripe sandbox Checkout-to-webhook-to-wallet exercise remains a launch gate; a live key is configured but no Stripe test key exists in the edge environment. This is a verified disabled installation, not a customer launch certification.

## Scope and existing systems reused

Reuse the existing Stripe merchant, existing five ABAGALE credit packs, workspace memberships, `platform_credits`, `platform_credits_ledger`, existing base-credit fulfillment function, raw-signature router, edge service, adapter service and authenticated owner console. No new wallet is created for customers. Other apps' wallets remain separate and require an explicit verified adapter. Provider-cost top-ups and `public.user_credits` daily quotas are not treated as paid customer wallets.

ABAGALE pack prices/currency/account were verified through read-only provider queries. All five prices are active live one-time USD prices with amounts matching the catalog; all token quantities permit an exact 20% integer bonus. The existing registered Stripe router already receives refunds and dispute events; the new narrow branch routes credit-pack adjustments to their handler.

## User and operator journeys

An ordinary customer uses the current ABAGALE credit checkout. The trusted server resolves their workspace and selected pack. After confirmed captured payment, the base grant and any sixth-purchase bonus commit together. Repeated webhook deliveries and simultaneous purchases cannot duplicate either credit or loyalty progress.

Founder and payment-exempt members return through a no-charge checkout path before any Stripe request. The owner console shows real activation state and aggregate counts; its calculator is explicitly an example and performs no customer writes.

## Data, tenancy and permissions

Private forced-RLS tables: `swadebase_ops.loyalty_programs`, `loyalty_accounts`, `loyalty_purchases`, `loyalty_awards`, `loyalty_adjustments`. Progress belongs to an application workspace wallet; shared members share that existing wallet. Payment identity includes merchant account and mode. A program's account/mode/adapter binding is immutable once history exists.

Explicit service-role-only ABAGALE RPCs add/reconcile the reward. The existing generic privileged wallet writer is hardened against direct anonymous/authenticated execution. Ordinary users cannot activate rewards or mint bonus tokens. Existing owner authentication and founder policies are retained.

## Costs and commerce

No pack price changes, provider-funding automation, paid generation, real card tests, refunds, transfers or external messages occur in this release. A reward increases usable platform tokens; it does not fund the provider account or change provider-specific consumption rates. Existing merchant fees, replacement costs, retention and abandoned-checkout mechanisms remain their existing systems.

Activation is prospective by Checkout creation time. Existing fulfilled purchases and pre-activation Checkouts are excluded; there is no historical backfill. Free credits, subscriptions and exempt grants do not advance the cycle.

## Reversals and review

Full refunds/open or lost disputes remove qualification; wins restore once. Partial refunds reduce only the affected purchase's reward target using cumulative eligible paid value. Milestones already issued remain reserved; outstanding restored milestones are fulfilled one per subsequent purchase.

A closed inquiry (`warning_closed`) can resume an earlier held purchase after current Stripe data and pack bindings are verified. It is stored as nonterminal `paid`, allowing a later formal dispute to suspend qualification. Full refunds and current active/lost disputes take precedence.

The existing wallet cannot prove token-lot spending provenance. A bonus is reversed automatically only when its original ledger is bound, the balance covers the adjustment, and the workspace has no non-loyalty debit history. Otherwise an unrecovered amount is recorded for owner review. No negative balance, seizure of unrelated paid tokens, automatic card charge or future-purchase offset is introduced.

## Operations, verification and recovery

Feature source includes calculation/HTTP/checkout/router/provider tests, an isolated PostgreSQL fixture and integration suite, browser fixture harness and live-check script. Keep simulated dependencies, real database behavior, live HTTP behavior and actual Stripe-origin payment delivery as separate evidence categories.

The registry kill switch stops new loyalty progress and grants while preserving ordinary purchased credits and adjustment reconciliation. Production installation is scoped, hash-checked and backed up. Recovery disables rewards and restores only affected code/config; financial audit history must be retained. Use the existing deploy lock and append actual source/deployment evidence after release.

## Deployment checkpoint — November 7, 2026

Source PRs: [48](https://github.com/swadesoul/swade-ecosystem-hub/pull/48), [49](https://github.com/swadesoul/swade-ecosystem-hub/pull/49), [50](https://github.com/swadesoul/swade-ecosystem-hub/pull/50). Deployed source commit: `64b1dd295338df2c3c0990523382624ed5771725`.

Verified: 108 Node tests; 26 real PostgreSQL integration tests in the isolated test database; 18 Chromium UI fixture checks; 18 hosted owner-session/HTTP/browser checks. The hosted run completed at `2026-11-07T06:51:06.934Z`. All 10 runtime file hashes match the release manifest. Production read-only checks confirm five forced-RLS loyalty tables, no anonymous/authenticated generic wallet-grant execution, service-role access retained, and zero loyalty purchases/awards at the checkpoint.

The first hosted run exposed an API-prefix routing conflict and an overly privileged catalog lookup. PR49 fixed both without granting additional wallet-schema access to the adapter role. The actual status endpoint is `/adapters/loyalty/api/status`. PR50 fixed closed-inquiry resumption while preserving later-dispute handling.

Primary backup: `/opt/swadebase/backups/token-loyalty-20261107T063914Z`; scoped follow-up backups are `status-route-fix` and `inquiry-fix` beneath it. Sanitized evidence and the activation checklist are in `docs/releases/token-loyalty-20261107` in the private source repository.

Outstanding gate: provide Stripe test-mode access through protected server configuration, verify an isolated sandbox Checkout → actual registered webhook → wallet → sixth-purchase bonus flow, including replay/refund/dispute cases, then activate prospectively. Do not replace the live credential with a test key, use a live customer wallet as a fixture, or replay historical payments. Founder exemption has simulated dependency coverage; an authenticated founder checkout, native Safari and Google OAuth completion were not exercised by this release.
