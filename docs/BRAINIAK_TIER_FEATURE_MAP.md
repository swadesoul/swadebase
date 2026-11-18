# Brainiak tier-to-feature map

Created 2026-10-28, America/Chicago, per Harold. Status: PROPOSAL. Not implemented. No code, Stripe, database, config or service change. Brainiak billing is not switched on and there are no Brainiak tier products in Stripe.

Related: BRAINIAK_PRICING_AND_MARKETPLACE.md (prices, open decisions), site-bibles/Brainiak_Master_Site_Bible.md, site-bibles/SSS_Brain_Master_Site_Bible.md (Lamborghini package), SWADE_ADAPTER_CONTRACT_V1.md.

## Tiers

| Tier | Price | What it is |
|---|---|---|
| Personal | $19/month (unchanged) | One owner; memory, tasks, briefing, limited managed AI |
| Business | $79/month (unchanged) | Business workspace, widget, seats when implemented, BYOK |
| Enterprise | $1,900 (billing period to confirm with Harold) | Watered-down SSS Brain for Brainiak clients. Clients get all features, but many are switched off until they pay for upsells through the grant/feature-switch system |

Not a Brainiak tier: the full SSS Brain "Lamborghini package", $4,999, sold only on the SSS Brain website. It is everything Harold has, includes the Hostinger account with all bills included, and the client brings their own APIs. See SSS_Brain_Master_Site_Bible.md.

## Mechanism (existing schema, no change made)

- Entitlements: brainiak `product_grants` in /opt/brainiak/updates.sql: primary key (workspace, entitlement); `source` in free / paid / gifted / admin; `evidence` text; `active` boolean (default true); `expires` timestamptz. A grant counts only when `active` and (`expires` is null or in the future), the same test `sync_product_updates` already uses.
- Owner toggle per client: the owner (Harold, super admin) flips `active` on/off for a client workspace and entitlement, records the reason in `evidence`, and uses `source` = gifted or admin for free grants. Paid upsells get `source` = paid only after a verified Stripe webhook (once billing exists). Cancel or failed payment sets `active` = false after a grace period, or `expires` is set.
- Tier baseline: a tier grants its included entitlement keys (source free or paid for the tier purchase). Upsells are separate grant rows.
- Ecosystem adapters also map to SWADEBASE module slugs: `swadesoul.swade_modules` / per-site `swadesoul.swade_site_modules` (`enabled`, `config_json.provider`), per SWADE_ADAPTER_CONTRACT_V1.md. That table switches an adapter on per site; product_grants switches it on per Brainiak client workspace. Both must allow a call.
- Enforcement is server-side only. Every request is checked on the server against the grant (and site module) before work runs. A feature that is off is not served. UI labels, plan names, client flags and checkout success URLs are never trusted.

Legend: Inc = included in that tier; Upsell = toggleable paid add-on; Off = not available; P = proposal for Harold.

## Core features

| Feature | Entitlement key | Personal | Business | Enterprise | Owner toggle per client |
|---|---|---|---|---|---|
| Private memory | brainiak.core.memory | Inc | Inc | Inc | Yes |
| Projects and tasks | brainiak.core.projects_tasks | Inc | Inc | Inc | Yes |
| Daily briefing | brainiak.core.daily_briefing | Inc | Inc | Inc | Yes |
| Managed AI (limited; only after metering and caps exist) | brainiak.ai.managed | Inc | Off (P) | Off (P) | Yes |
| BYOK, one supported primary LLM | brainiak.ai.byok | Off | Inc | Inc | Yes |
| Website widget | brainiak.widget | Off | Inc | Inc | Yes |
| Seats (when team permissions exist) | brainiak.seats | 1 | up to 5 | up to 20 | Yes, seat limit per client |
| WhatsApp / Telegram (once linked) | brainiak.channels.messaging | Inc (P) | Inc (P) | Inc (P) | Yes |
| Governance and department boundaries (not implemented) | brainiak.enterprise.governance | Off | Off | Inc | Yes |

## Ecosystem adapters — Enterprise toggleable upsells

All are proposals for Harold. In Enterprise every one is present but switched off until granted. Off for Personal and Business unless Harold decides otherwise.

| Feature | Entitlement key | Personal | Business | Enterprise | Included or paid (P) | Owner toggle per client | Notes |
|---|---|---|---|---|---|---|---|
| Music Mogul game (white-label) | swade.adapter.music_mogul | Off | Off | Upsell | Paid add-on (P) | Yes | Hosting and asset cost |
| Restaurant game maker | swade.adapter.restaurant_game_maker | Off | Off | Upsell | Paid add-on (P) | Yes | GPU for splat scenes |
| Gaussian splat adapter | swade.adapter.splat | Off | Off | Upsell | Paid add-on (P), usage limit e.g. scenes/month | Yes | GPU time; VGGT/gsplat/SuperSplat/Spark stack proposed |
| God's Eye | swade.adapter.gods_eye | Off | Off | Upsell | Paid add-on (P) | Yes | Data sources need terms clearance before sale |
| Publiswade basics | swade.adapter.publiswade | Off | Off | Inc when switched on (P) | Included in Enterprise (P) | Yes | Advanced sends/volume could be paid (P) |
| Music ecosystem morning-brief database | swade.adapter.morning_brief_db | Off | Off | Inc when switched on (P) | Included in Enterprise (P) | Yes | |
| Other SWADEBASE adapters | swade.adapter.<slug> | Off | Off | Upsell | Decided per adapter (P) | Yes | Must follow SWADE_ADAPTER_CONTRACT_V1.md |

Note on Harold's direction: Enterprise is described as "all features, many switched off until paid upsells". Publiswade basics and the morning-brief database are proposed as included; Harold may instead make every ecosystem feature a paid upsell. Decision open.

## God's Eye clearance

God's Eye street-camera (CCTV), flight and location data sources each have their own terms of use. Each source must be cleared for commercial resale and in-game use before the God's Eye upsell is sold or switched on for any client.

## Super admin BYOK key panel requirement

Applies to BYOK tiers (Business, Enterprise) and is a stated requirement of the $4,999 Lamborghini package. The client's super admin area must let them plug in, replace or remove their own API keys at any time. Keys are stored server-side on the client's SWADEBASE, encrypted at rest, used only server-side, shown back masked (never in full), never placed in notes, chat, model context or logs, with rotate/revoke and an audit record. No fallback to founder credentials.

## Open for Harold

1. Enterprise $1,900: one-time or monthly; same offer as the existing SSS Brain $1,900 self-host license, or a replacement for it.
2. Overlap of the existing SSS Brain $100/month hosted BYOK and $1,900 self-host license with the $4,999 Lamborghini package.
3. Included vs paid for each ecosystem feature, and upsell prices.
4. Whether Personal and Business can buy any ecosystem upsells.

## White-label licensing add-ons — 2026-10-28, America/Chicago, per Harold

Status: PROPOSAL, docs only. Stripe/billing NOT set up; no Stripe products, prices or webhooks exist for these. No code, config, database or service change.

Clients on ANY tier can add licensed white-label versions of Harold's services (their own branded instance). Licensing fees start at $25,000 per year. This sits alongside the existing feature-grant upsell model above. One-engine rule: each white-label instance runs on the same SSS Brain engine, is switched on by a licensing grant, and is branded per tenant (logo, colors, domain). No separate scaffold per client or tier. Enforcement is server-side only, same as all grants.

Legend addition: WL = white-label licensed add-on available, from $25,000/yr.

| White-label service | Proposed entitlement key | Personal ($19/mo) | Business ($79/mo) | Enterprise / SSS Brain Lite ($1,900) | Lamborghini, full SSS Brain ($4,999) | Price | Billing | Owner toggle per client |
|---|---|---|---|---|---|---|---|---|
| Black Tales | swade.whitelabel.black_tales | WL | WL | WL | WL | from $25,000/yr | Not set up | Yes |
| Video Say What | swade.whitelabel.video_say_what | WL | WL | WL | WL | from $25,000/yr | Not set up | Yes |
| Your Own Delivery | swade.whitelabel.your_own_delivery | WL | WL | WL | WL | from $25,000/yr | Not set up | Yes |
| "Swideo" (name/product UNCONFIRMED) | swade.whitelabel.swideo (pending name) | WL | WL | WL | WL | from $25,000/yr | Not set up | Yes |

Tenant branding (per licensed instance): logo, colors, custom domain, stored as tenant configuration on the same engine.

Notes:
- "Swideo": no product of that name (or Swadeo / SwadeVideo) found in /opt/swadebase/docs. Possible matches to confirm with Harold: Audivid (/opt/audivid), SWADEBASE Motion Studio, or Video Say What itself.
- "Your Own Delivery": /opt/yourown-web exists on swadesoul; mapping not confirmed.
- The Lamborghini package is sold only on the SSS Brain website and is not a Brainiak tier; the column shows that the add-on is available to those clients too.
- The existing "Music Mogul game (white-label)" Enterprise upsell above is unchanged; whether it moves to this licensing model is open for Harold.

Open for Harold: per-service price above the $25,000/yr floor, term and renewal, whether fees stack per service, the Swideo product, and the Your Own Delivery mapping.

## Upgrade and provisioning model (Lite to Lamborghini) — 2026-10-28, America/Chicago, per Harold

Status: PROPOSAL, docs only. No code, config, database, Stripe, Hostinger or service change. Stripe/billing for Lite, the Lamborghini and upgrades is NOT set up. Full detail (automated Desktop Commander workflow, provisioning_jobs table, self-updating golden snapshot): site-bibles/SSS_Brain_Master_Site_Bible.md, same section title.

1. Price settled: 2026-10-28 update per Harold: SSS Brain Lite / Brainiak Enterprise is $1,900 one-time plus $279/month. This settles the earlier "billing period to confirm with Harold" notes, which are left in place for history.
2. Upgrade credit: everything already paid (the $1,900 plus every $279 payment) is credited toward the $4,999 Lamborghini. Balance = $4,999 minus total paid. Worked example: $1,900 + 3 x $279 = $2,737 paid, leaving $2,262. Harold's "roughly $3,000" matches $1,900 plus about 0 to 1 monthly payments ($3,099 / $2,820). FLAG: Harold to confirm the formula and whether $279/month stops after upgrading.
3. Provisioning on payment clear: two brand-new servers mirroring Harold's (an app and data server like swadesoul; an AI/GPU and worker server like swadebase-2) under a NEW Hostinger account created for the client, never an existing one. Steps: payment webhook, account and VPS creation, base image/bootstrap, content and layer sync, BYOK onboarding, health check, handover. Automated end to end by a Desktop Commander orchestrator; each step logged to a proposed provisioning_jobs table, idempotent and retryable, alerts Harold on failure, escalates to Harold after two failures.
4. Content parity: all of Harold's product content, modules, templates, styles, elevation layers and features are copied. Never copied: Harold's secrets or keys, personal data feeds (per /opt/sssbrain/docs/GODSEYE_PERSONAL_CUSTOMER_BOUNDARY.md), customer records, other clients' data. White-label or licensed add-ons only if granted.
5. BYOK/BYOC: the client plugs in their own API keys and providers through the super-admin key panel at any time. Nothing works on Harold's keys.
6. Timeline: live within THREE BUSINESS DAYS of payment clearing, for Lite or the Lamborghini; the client can add their own APIs in the key panel during that window. Client-facing wording (payment received, provisioning, content sync, live) is drafted in the SSS Brain Bible for Harold's approval.
7. Open questions: who owns and pays the Hostinger account (ties to the "all bills" flag); server sizing and cost per client; content sync frequency after launch; whether the Lamborghini is still sold only on sssbrain.live; whether a new Hostinger account can be created fully by API (may need a human or a reseller/agency account); first-access bootstrap token rotation.
