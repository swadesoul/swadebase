# Site Agents: decisions log

**Status: Spec v1, 2026-10-24, not built.** Decisions D-01 to D-20 were approved by Swade by voice on Oct 24, 2026 at about 2:24 AM CT. D-21 was approved by voice at about 2:25 AM CT. Recorded by Big Mamma.
**Rule:** a decided item changes only through a new dated entry here. Never edit an old entry; add a new one that supersedes it (newer wins, nothing goes back in time).

## Decided

| # | Decision | Where in the spec | Changes v0.1 | Changes the multi-bot doc |
|---|---|---|---|---|
| D-01 | **One agent per money-making site**, starting with abagale.live ("Abigail"). Each agent owns uptime, client questions and day-to-day ops, plus **standing research into open-source replacements** for the site's paid services, aiming for zero cost | SPEC §1, §10 | v0.1 had no OSS research, and its money-site list was "to confirm" | §6.6 Option C threshold is overridden for money sites (site agents regardless of load) |
| D-02 | **The site agent has override on conflicts about its own site**; other agents adapt. Shared components keep single owners, who must accommodate (nuance still open: O-01) | SPEC §2.2 | Replaces v0.1's "the owner decides, proposal path" for own-site matters | §3.4 double-check and §4.1 ownership: site agents outrank role bots on their own site |
| D-03 | **SWADEBASE is the source of truth for everything** | SPEC §2.1, §3 | Same intent, now absolute (bot memory and docs lose to SWADEBASE) | Consistent with the single-locker rule |
| D-04 | **Newer writes win; nothing goes back in time.** Versions and timestamps are monotonic, stale writes become history, and full history is kept | SPEC §4 | Replaces `If-Match` / `409` / retry-once / proposal | Appendix A versioning model |
| D-05 | **Agents write directly to their own site's record** (prior approval). There is no proposal step for own-site records | SPEC §4, §7 (A0) | Removes the `change_proposal` step for own-site records | §4.1: own-site record writes are not gated |
| D-06 | **Self-heal first, ping Swade after** | SPEC §6.1 | Replaces "L1 only after allowlist approval" and the "must ask" list, inside the self-heal envelope | §4.1: self-heal is not an approval gate |
| D-07 | **One shared budget pool** across agents (AI/tokens and service spend), with per-agent usage tracking | SPEC §8 | New | §4.6 per-bot budgets become one pool |
| D-08 | **OSS swap findings come as a comparison first** (cost, features, risk, migration effort). Swade approves before any switch | SPEC §10 | New | — |
| D-09 | **Each site agent sees its site's revenue and costs, read-only.** Finance still owns Stripe | SPEC §9 | New (v0.1 had Finance only) | Finance's role: adds the per-site feed |
| D-10 | **Per-incident alerts with a criticalness score on one shared rubric**, including when to recommend pausing a site | SPEC §6.2, §6.3 | SEV1–4 are now derived from a 0–100 score; adds pause thresholds | §4.7 incidents |
| D-11 | **Security scouting per stack** (new CVEs and zero-days), with a **fix prepared immediately**; applying it follows the approval levels. It covers PHP/Hostinger and ties into the existing AI security watch routine | SPEC §11 | New | — |
| D-12 | **A runbook per site** | SPEC §15, runbooks/ | v0.1 had nightly-generated site pages; v1 has per-site runbooks in this folder | §6.5 per-site playbooks become these runbooks |
| D-13 | **Full audit trail**, kept as long as storage allows, with older parts archived to Backblaze in the **SWADEBASE B2 folder** (`swadebase/site-agents/audit/`). Agent-to-agent conversations are included | SPEC §14 | New `sot_events`, B2 archive | §3.8 / multi-bot D11 90-day convlog retention is replaced |
| D-14 | **Per-site staging environments** | SPEC §12.1 | New | — |
| D-15 | **Version tracking of what is live** per site (commit, release id, deploy time) | SPEC §12.2 | v0.1 only noted abagale's drift | — |
| D-16 | **Dashboard at swadebase.cloud, expanding the existing build**: health, revenue, agent status, remote pause/resume per agent, a **global kill switch that also cuts the budget pool**, and resume either automatically or after Swade reviews each agent | SPEC §8.2, §8.3, §13 | New | — |
| D-17 | **A shared client intake skeleton** with per-site flavour | one-pass.md §4 | New | — |
| D-18 | **Shared clients via "one-pass"**: one client record in SWADEBASE as its own section, which every agent reads and writes | one-pass.md | New | — |
| D-19 | **Agents message each other directly through SWADEBASE**, all logged in the audit trail | SPEC §5.4 | New (v0.1 had handoffs only) | §3.3 handoffs plus direct messages; convlog keeps full text |
| D-20 | **Review the whole layer as soon as possible**, using a checklist for Swade | SPEC §17 | Replaces v0.1 §7's decision table | — |
| D-21 | **Maestro Radio (maestroradio) is not a money site** and is removed from the list. **MakeMyCoin (makemycoin) is a money site** and is added to the list and the rollout order. MakeMyCoin runs on a separate, older database, not SWADEBASE's main schema, so **bringing its data into SWADEBASE is a prerequisite**. Recommended rollout position: **6th (last)**, with its inventory and migration plan starting in parallel from Phase 0 | SPEC §1.1, §16.1, §16.2 | Replaces v0.1 D1 ("confirm makemycoin and maestroradio") | — |

**Standing rules that are unchanged and still apply:**
- Never show secrets.
- Customer-facing sends stay drafts unless Swade grants a standing permission.
- Deploys need approval.
- Big Mamma sets up and verifies every bot.
- A replacement AI gets the same knowledge and capabilities.
- Daily summaries.
- No silos.

## Still open (with recommendations)

| # | Question | Recommendation |
|---|---|---|
| O-01 | **Override vs single owners.** How far does the site override reach into shared components? | The override covers the site's **own config and data**, including its site-scoped settings inside a shared component. A change to the **shared component itself** goes to the owner, who must accommodate (done, done differently, or "cannot" with evidence straight to Swade). Two sites in conflict: the owner finds a solution, otherwise Swade |
| O-02 | Automatic pause on confirmed compromise (S = 20)? | No automatic pause at first. The agent recommends and Swade decides within minutes. Revisit after the first month |
| O-03 | Is a **rollback to the previous known-good release** a self-heal? | Yes: it is instant and reversible, and it restores a release Swade already approved. It must be logged and pinged. Until Swade says yes, it stays a gated deploy |
| O-04 | Can site agents **deploy to their own staging** without asking? | Yes: staging has no customers, no live PII and test-mode Stripe. Production stays gated |
| O-05 | Channel for SEV1/SEV2 pings to Swade | Swade picks one (for example X DM, SMS or this chat). Internal alerts only, with a standing grant for that one alert format |
| O-06 | Where the prober runs | Extend the existing SWADEBASE site guardian (no new app), and add a second vantage point on Swadebase 2 for "site down" confirmation |
| O-07 | Budget pool size and thresholds | Swade sets the monthly amount. Thresholds 50% notice, 80% ping and cheap tier, 100% stop paid calls; flag any agent above 40% |
| O-08 | Audit hot-storage trigger and pruning | Archive the oldest months when the DB disk is under 30% free or audit data exceeds 20 GB. The first prune of archived rows needs Swade's OK, then a standing approval for verified archive-then-prune |
| O-09 | What a site agent sees about another site's client | Full core record if linked to its site; other sites as links only (role, last seen). No other site's tickets, payments or notes; ask that site's agent |
| O-10 | `*`-scoped keys (abagale ×2, attobahn, ssworld) | Replace them with explicit-scope keys, check side by side, then revoke. This is a keys gate and must happen before any site agent goes live |
| O-11 | Build Phase 0 (Appendix A tables, Appendix B routes, prober and console extension) | Approve as one side-by-side build after the multi-bot `agent_handoffs` and `agent_conversation_log` |
| O-12 | Push and reconcile abagale's live branch to GitHub | Approve the push of `finish/abagale-swadebase-20261007` plus the 2 modified files, then a PR into `main` |
| O-13 | MakeMyCoin data move | Approve a read-only inventory now. The migration plan comes back for approval |
| O-14 | Carry-overs from v0.1: email owner; Stripe restricted keys; registry clean-up (teachvert/teachvirt, makemycoin .live vs .cash in the guardian directory, maestroradio, dnafront, 4 missing sites); customer-reply standing grants; Swadebase 2 upgrade | Email: CoS for policy, Big Mamma for infra. Stripe: restricted read keys for Finance's feed. Registry: fix after Swade confirms the domains. Reply grants: none yet (consider acknowledgement-only after 2 weeks). Upgrade Swadebase 2 before the 3rd site agent |

## History

- 2026-10-24: v0.1 design draft (D1–D14 open) published as `SWADE_SITE_AGENTS_SOURCE_OF_TRUTH.md` and hub PR #13.
- 2026-10-24: Spec v1. D-01 to D-21 recorded as decided; v0.1's D1, D4 and D9 are superseded by D-21, D-06 and D-05/D-19 respectively. The section moved to `docs/site-agents/`.
