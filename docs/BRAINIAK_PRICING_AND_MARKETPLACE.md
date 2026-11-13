# Brainiak commercial draft — October 25, 2026

Status: proposal, no billing activation. Shared SWADEBASE Stripe account verified as acct_1SizGm43OPTHaIwn; no Brainiak products found. Existing SSS Brain $100/month hosted BYOK and $1,900 self-host license remain separate and unchanged.

## Proposed monthly plans

| Plan | USD/month | Proposed scope | Customer-owned provider keys | Maximum total monthly delivery cost for 80% gross margin |
|---|---:|---|---|---:|
| Personal | 19 | One owner, memories, tasks, briefing and limited managed AI | No at initial launch | 3.80 |
| Business | 79 | Business workspace, widget, up to five seats when team permissions are implemented | OpenAI, Anthropic, Gemini, xAI | 15.80 |
| Enterprise | 1,900 (billing period to confirm with Harold; replaces the earlier "299 starting" placeholder) | Watered-down SSS Brain for Brainiak clients: clients get all features, but many are switched off until they pay for upsells through the grant/feature-switch system (see BRAINIAK_TIER_FEATURE_MAP.md). Up to twenty seats when implemented, governance, department boundaries; custom SLA/compute quoted separately | OpenAI, Anthropic, Gemini, xAI | 380.00 if monthly; to recalculate once billing period is confirmed |

Not a Brainiak tier: the full SSS Brain "Lamborghini package" ($4,999) is sold only on the SSS Brain website. See the section "Sold on SSS Brain site, not Brainiak" below and SSS_Brain_Master_Site_Bible.md.

These are proposed entitlements, not claims of implemented team access, provider adapters, SSO or SLAs. No managed AI allowance is sold before cost metering and caps exist. Unlimited AI, voice, video, agent loops or customer support is not included.

## Cost evidence and margin

No audited Brainiak customer usage ledger, support allocation or current Hostinger invoice was found during this task. Existing shared infrastructure is not zero cost: allocate VPS, database, backups, monitoring, storage/bandwidth, support and operations, retries, provider tokens/tools, voice and media.

Gross margin = (revenue - direct delivery costs - transaction/billing costs) / revenue. This is not net profit or ROI. At 60/80/90% margin, total cost must stay within 40/20/10% of revenue. With illustrative US domestic card pricing 2.9% + $0.30 plus Stripe Billing pay-as-you-go 0.7%, non-payment cost budget at 80% = 0.164 * monthly price - 0.30: $2.82 Personal, $12.66 Business, $48.74 Enterprise (calculated on the superseded $299 placeholder; at $1,900/month it would be $311.30, and a one-time $1,900 needs a separate per-month allocation — recalculate once Harold confirms the billing period). Actual merchant contract, payment method, tax handling, refunds, FX, disputes and metering contract can differ. Metronome charges must be counted if applicable; do not double-count overlapping billing contracts.

Customer API keys: provider bills customer directly; Brainiak sells its platform, memory and orchestration. Do not charge our model-token wallet for customer-key usage. Keep platform operations bounded. Customer ChatGPT subscriptions are separate from OpenAI API billing; do not promise subscription access via an API key. Keys must be encrypted at rest with isolated workspace access, masked display, server-side execution, revoke/rotate and audit, never stored in ordinary notes or chat. Explicit consent is required to switch from customer-funded to company-funded models, or to route private data to another provider.

Recommended managed usage: opt-in prepaid spend with reservations before a job, reconciliation after actual usage, per-model cost records and a hard stop at the limit. Use cache, bounded retrieval and small models for routine work. Video, premium speech and expensive autonomous runs need separate priced allowances. Validate real costs with the first 20–50 accounts before annual discounts or a margin guarantee.

## Updates marketplace

Included: security fixes, bug repairs, compatibility, reliability and routine maintenance for the subscribed/purchased service. Never reclassify repairs as a paid feature.

Optional new products: workflow packs proposed from $29 one-time; specialist agents proposed from $19/month; ecosystem connection packs proposed from $49 one-time. Development recovery, ongoing operation, support and external provider costs must be reflected in each final offer. No sale or installation is available in this draft.

Each listing needs exact version, compatibility, scopes, install prerequisites, included future maintenance, third-party costs, changelog and rollback. New system/product purchases require explicit checkout. Existing purchases retain their entitlement under the original terms. A one-time license cannot promise perpetual company-funded compute; recurring services/consumption need separate terms.

Automatic free updates apply only to verified compatible low-risk releases. Snapshot or backup, staging checks, health verification, rollback and a plain-language receipt are required. Do not silently migrate destructive schemas or expand permissions. A vulnerability with no verified safe patch must be escalated, not reported as fixed.

## SWADEBASE billing design

Use the shared merchant account with app-scoped product/price namespace, Brainiak user/workspace ID, orders, subscriptions, signed webhook endpoint, durable usage ledger and entitlements. Server-side authorization only; never trust UI plan labels or success URLs. Transactional idempotency must protect event retries and concurrent deliveries. Test renewals, cancellation, refunds/disputes and paid upgrade/rollback behavior before enabling checkout.

Existing Metronome adapter readiness has not been verified for Brainiak. Do not introduce a duplicate metering service; inspect/reuse the central adapter and reconcile its records against SWADEBASE before marking billing ready.

Source registry: swade/billing.json (checkoutEnabled false). The UI marketplace is a browsable preview, not an update installer or a payment integration.

Sources reviewed: https://stripe.com/pricing ; https://stripe.com/billing/pricing ; https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform ; https://developers.openai.com/api/docs/pricing ; https://ai.google.dev/gemini-api/docs/pricing ; https://docs.x.ai/developers/pricing .

## Change note — 2026-10-28, America/Chicago, per Harold

PLAN CHANGE ONLY. No code, Stripe, database, config or service change. Brainiak billing is still not switched on and there are still no Brainiak products in Stripe. Backup of the prior version: BRAINIAK_PRICING_AND_MARKETPLACE.md.bak-20261028T231950Z.

- Brainiak has three tiers: Personal $19/month (unchanged), Business $79/month (unchanged), Enterprise $1,900 (billing period to confirm with Harold).
- The Enterprise $1,900 price replaces the earlier proposed "$299/month starting" placeholder.
- Enterprise is a watered-down SSS Brain for Brainiak clients, not the full SSS Brain.
- The full SSS Brain "Lamborghini package" is not a Brainiak tier. It is sold only on the SSS Brain website at $4,999.
- Tier-to-feature map created: BRAINIAK_TIER_FEATURE_MAP.md.

## Enterprise = watered-down SSS Brain with toggleable paid upsells (per Harold, 2026-10-28)

- Price: $1,900 (billing period to confirm with Harold: one-time or monthly).
- Description: clients get all features, but many are switched off until they pay for upsells through the grant/feature-switch system.
- Upsells are drawn from Harold's ecosystem: Music Mogul game, restaurant game maker, Gaussian splat adapter, God's Eye, Publiswade, the music ecosystem morning-brief database and other SWADEBASE adapters. Each is an entitlement key in Brainiak product_grants (source free/paid/gifted/admin, active, expires), toggled per client by the owner and enforced server-side only. Included-vs-paid assignments are proposals for Harold; see BRAINIAK_TIER_FEATURE_MAP.md.
- Customer-owned provider keys (BYOK) as already documented above; one supported primary LLM.
- Still unimplemented: seats/team permissions, governance and department boundaries, SSO and SLAs remain proposed, not shipped.

## Sold on SSS Brain site, not Brainiak — full SSS Brain "Lamborghini package" (per Harold, 2026-10-28)

Canonical record: SSS_Brain_Master_Site_Bible.md, section "Lamborghini package". Summary kept here so Brainiak pricing is not confused with it.

- What it is: the full SSS Brain, everything Harold has.
- Price: $4,999. Sold only on the SSS Brain website. Not sold on brainiak.live and not a Brainiak tier.
- Includes the Hostinger account with all bills included (recorded as Harold stated it).
- The buyer brings their own APIs (BYOK) and connects their own situation.
- Build requirement: a super admin area where the buyer can plug in, replace or remove their own API keys at any time. Keys are stored server-side on the buyer's SWADEBASE, encrypted at rest, and never shown back in full (masked display only).

## Open decisions for Harold (flagged, not changed)

1. Enterprise billing period: is $1,900 one-time or per month? Margin figures above must be recalculated once confirmed.
2. $1,900 match: the Enterprise $1,900 matches the existing SSS Brain $1,900 self-host license (status line at top). That license may be the same offer, or may be replaced by this one. Not changed; Harold to decide.
3. Overlap with $4,999: the existing SSS Brain $100/month hosted BYOK and $1,900 self-host license (status line at top) now overlap with the $4,999 Lamborghini package. Not changed; Harold to decide whether they remain, merge or are retired.
4. "All bills included" in the $4,999 package: for how long, and which services (hosting, domains, storage, email, GPU)? A one-time price cannot fund indefinite recurring costs (see the one-time license rule in Updates marketplace above). Recorded as stated; terms to confirm.
5. Related figure: BRAINIAK_HEALTHCARE_READINESS_REQUIREMENTS.md and the Brainiak Bible mention a "standard $5,000/$500 offer". Its relation to the $4,999 package is not documented here; Harold to confirm.
