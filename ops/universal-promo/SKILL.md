---
name: swade-universal-promo
description: Add, customize, connect, test and roll out the shared SWADE campaign promotion on ecosystem home and hero pages. Use for universal promo add-ons, site-aware campaign messaging, Soft/Medium/Heavy promotion, and the SWADEBASE promo adapter.
---

# SWADE Universal Promo

Read the current SWADEBASE and affected Site Bibles, standing rules, adapter registry and existing embed records first. Reuse the installed public promotion adapter; add no service, database, scheduler or model.

## Preserve the host site

Treat the founder's requirement as mandatory: every design must fit the aesthetics of its host. Preserve its hero, interactive scroll, audio, navigation, authentication and current content. Match body/heading typography, foreground/surface colors, primary-action accent and shape, spacing and motion. Use the host's computed design values and the site's configured composition. Keep component CSS isolated. A universal content contract does not mean a universal visual skin.

FOUNDER RULE (2026-11-16): place the promo at the BOTTOM of the page, immediately above the site footer (fallback: end of main, then end of body) - never at or near the top. Use a compact site-specific introduction. Keep the detailed standard promotion behind a clear link. Mount only on the configured public homepage paths, once per page; remove it from other SPA routes. Keep keyboard navigation, phone layout, reduced motion and manual-only audio. Never autoplay a promotional song or cover the main CTA.

## Reuse the adapter

Canonical implementation: `/opt/swadebase/ops/universal-promo` inside the existing adapter service. Public assets and config: `https://swadebase.cloud/adapters/promo/`; protected instructions: `/api/adapters/swade-universal-promo/skill`. Check registry `swade-universal-promo`; a disabled adapter must suppress promo content. Use `references/adapter.md` for exact integration and verification.

Generate a site-specific script tag using `scripts/embed_tag.py SITE_ID`. Install it through the actual deployed frontend source and ordinary deployment workflow. Do not confuse a dirty checkout, registry URL, backend-only deployment, redirect or staged PR with the public homepage. Where necessary, add only the exact trusted SWADEBASE origin to script/style/connect CSP directives; preserve all other policy. Do not introduce wildcard/eval permissions. Preserve old adapter fields and existing sub_filter directives.

Register/reuse the site connection in `swadesoul.ecosystem_embed_widgets` where its canonical site ID exists. Distinguish configured, source-connected, deployed and visually verified. Exclude stale, expired-sale, API-only or unknown domains. Do not migrate DNS merely to install a promo. Preserve missing Bibles as a discovery gap and document scoped source evidence.

## Keep claims and costs accurate

Use site-specific examples from verified product purpose, plus one shared standard description of relevant business campaigns, prepaid allowances, Soft/Medium/Heavy intensity and an optional company theme up to 60 seconds. Separate a campaign plan from purchased delivery. Heavy expands eligible relevant reach within budget; it does not promise customers, impressions or automatic superiority.

Current adapter is an Alpha planning preview, with checkout and paid production disabled. Keep that state visible until campaign billing, verified domains, approvals, budgets, placement measurement, radio inventory and song production are tested. Do not publish illustrative Alpha/Beta click prices, package examples or lifetime-license prices as live offers. Treat Alpha price protection and BYOK lifetime options as terms requiring explicit final offers. Include song/revision replacement costs in final packages; never promise unlimited company-funded generation.

Do not read private notes, users, mailbox/repository content or cookies to select promo copy. Expose only approved public config. Keep no personal tracking or ad billing in this component. Use Backblaze references for future durable campaign media; do not duplicate originals across sites.

## Verify and document

Test unknown-site behavior, kill switch, protected instructions, public config, duplicate mount, SPA path guards, host-theme inheritance, narrow CSP, details link, phone overflow, keyboard controls and local brief generation. Run existing service regression checks. Verify each actual public homepage with dated evidence and report pending deployments separately. Update relevant Bibles, knowledge records, rollout manifest, What's New and daily handoff with source/deployment/recovery evidence. Keep backups and rollback only the scoped hook or adapter change.
