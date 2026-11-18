# SWADE Site Agents: section index

**Status: Spec v1, 2026-10-24, not built.** This is a specification only. No tables, routes, keys, services or sites have been created or changed. All SQL is marked **NOT APPLIED**.

This folder is the source-of-truth section for the per-site agent layer. Its canonical home is `/opt/swadebase/docs/site-agents/` on SWADEBASE. It is mirrored in `swadesoul/swade-ecosystem-hub` under `docs/site-agents/`, and dated archive copies go to Backblaze B2 under the SWADEBASE prefix `swadebase/site-agents/archive/<YYYY-MM-DD>/`.

| File | What it is |
|---|---|
| [SPEC.md](SPEC.md) | The full spec. It covers ownership and override, the data model on SWADEBASE, check-in and messaging, newer-writes-win versioning, self-heal and escalation, the criticalness score, budget pool and kill switch, security scouting, open-source swap research, staging, release tracking, the dashboard, audit trail and archive, rollout, and Swade's review checklist |
| [one-pass.md](one-pass.md) | One-pass: one shared client record across all sites, plus the shared client intake skeleton with per-site flavour |
| [runbooks/abagale.md](runbooks/abagale.md) | The per-site runbook template, filled in for abagale.live |
| [DECISIONS.md](DECISIONS.md) | The approved decisions log (Swade, Oct 24, 2026), what each one changes in v0.1 and in the multi-bot doc, and the items still open |

**Money sites (decided):** abagale.live first, then videosaywhat, teachvirt, resinglab, tokencsi and makemycoin. MakeMyCoin's data has to move into SWADEBASE before its agent can start; it runs on a separate, older database. Maestro Radio is **not** a money site and stays with the role bots.

**Related:** [../SWADE_MULTI_BOT_SYSTEM.md](../SWADE_MULTI_BOT_SYSTEM.md) (role bots, handoffs, approval gates), [../STANDING_RULES.md](../STANDING_RULES.md), [../SWADE_ADAPTER_CONTRACT_V1.md](../SWADE_ADAPTER_CONTRACT_V1.md).
The superseded v0.1 draft path `SWADE_SITE_AGENTS_SOURCE_OF_TRUTH.md` is now a pointer to this folder.

These docs contain no secret values. Credentials are named only.
