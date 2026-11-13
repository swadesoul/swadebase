# Artist Gift Box — Maestro / ReSingLab inventory
Status: **PRD (docs only, short)** — 2026-11-05 America/Chicago. No product code in this pass.
Recorded: 2026-11-05 ~09:15 America/Chicago
Approval context: Swade GO **t825u** (pointer from Maestro Mix Bible align); gift-box inventory rule from Trend/Suno pack clarifications (**t819u**) + today’s Mix chat direction.
Owner surfaces: Maestro Mix Rewards / artist commerce; ReSingLab create inventory.
Sibling: `MAESTRO_MIX_REPLACE_MOGUL_2026-11-05.md`, `TREND_TOP40_CREATE_PIPELINE_2026-11-05.md` (unreleased twin policy).

## Problem
Suno packs yield two clips; the non-chosen twin is inventory, not trash. Artists also need a bounded way to gift past work and access extras (passes, tickets, Zoom) without dumping full catalogs onto radio.

## Goal
Define an **Artist Gift Box** as a 3D presentable box product that can hold:
1. **Unreleased Suno twins / B-sides** (alternate clip from pack generate — sellable or giftable; not auto on-air).
2. Up to **≤5 past-catalog non-radio uploads** (artist-owned tracks not pushed to rotation).
3. Optional extras from today’s chat direction: **passes / tickets / Zoom invites** (event or session access tokens — packaging TBD; not live).

## Non-goals / rejects
- No gift-box checkout UI, Stripe SKUs, or 3D storefront build in this pass.
- Do not auto-publish unreleased twins to AzuraCast / Maestro Rotation.
- Do not exceed **5** past non-radio uploads per box instance without a later policy change.
- Do not invent royalty splits beyond Mix PROPOSED ledger (see Mix PRD).

## Inventory rules (captured)
- Pack create via Suno MCP: default A/B alternate pick; **non-chosen clip = UNRELEASED** twin retained (Trend PRD).
- Released ↔ unreleased pair recorded for each gen.
- Gift box may surface unreleased twins + ≤5 past uploads + optional passes/tickets/Zoom invites.
- Radio fill continues via Station DNA / Trend pipelines — gift box is commerce/gift, not the on-air fill engine.

## UX sketch (PROPOSED)
- 3D box open/close presentation (visual only until build OK).
- Clear labels: Unreleased B-side vs past upload vs access pass.
- Claim / gift / sell flows deferred; require rights + processor review.

## Open items
- Exact 3D asset pipeline and storefront host (Maestro vs ReSingLab vs shared).
- Legal: gifting copyrighted audio, ticket/pass refunds, Zoom invite abuse.
- Caps beyond ≤5 past uploads; stacking multiple boxes.
- Tie-in to Maestro Mix Rewards Vault grants.

## Success later
Artist can package unreleased twin + bounded past uploads (+ optional passes) without putting them on radio; Mix/ReSingLab reference the same inventory IDs.

## Rollback
Docs-only; delete this file if superseded. No runtime change.
