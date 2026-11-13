
# Repo Scout brief — 2026-10-30 — The Next New Thing

Video: "Copy any app, Claude does SEO, and the top 10 repos" (https://www.youtube.com/watch?v=-6SHbxdXMRU), uploaded 2026-10-30, transcribed 2026-11-07. Status: PROPOSALS awaiting Harold. Redundancy check: Site Bible names, grep of /opt/swadebase/docs and /opt/sssbrain/docs, /opt directory listing on swadesoul and the existing queue (not a deep code audit). GitHub links verified via api.github.com from swadesoul on 2026-11-07.

| # | Item | Verdict | Where it fits / what we already have | Cost | First test |
|---|---|---|---|---|---|
| 1 | Cloudflare security-audit skill — https://github.com/cloudflare/security-audit-skill (MIT) | EXTEND | SwadePower (/opt/swadepower) is our diagnostic center. Gap: a multi-phase audit with verified, machine-readable findings (less nitpick noise) as SwadePower's repo-scan step, and as the vetting step before any scout item is installed. | $0 | Run it on a disposable copy of one repo (e.g. oathloom); compare findings with SwadePower's current output |
| 2 | Claude SEO skill — https://github.com/AgriciDaniel/claude-seo (MIT) | NEW | SWADEBASE Bible states no general SEO program exists (only the ABAGALE SEMrush tracker with no key); SWOSTing promises basic on-page SEO for everyone. Free mode crawls the site and uses free Google/public data. Paid data layers stay WATCH. | $0 (free mode) | Read-only audit of SwadeSoul.com; turn findings into a SWOSTing "basic SEO" checklist |
| 3 | OpenSEO — https://github.com/every-app/open-seo (MIT) | WATCH | Open alternative to Semrush/Ahrefs, but useful keyword volume needs DataForSEO (paid). Would replace the unkeyed SEMrush connector if spend is ever approved. | Low but not $0 | None |
| 4 | Every App — https://github.com/every-app/every-app (MIT) | EXISTS + EXTEND | Hosting part EXISTS: Hostinger + Coolify self-hosting (its Cloudflare Workers paid plan conflicts with $0). Gap: use its catalog of open-source SaaS clones as a source list for SWOSTing one-click apps / swade-app-store. | $0 | Map 5 catalog apps to SWOSTing plans (docs only) |
| 5 | Superpowers persuasion principles (commitment, consistency) for agents — https://github.com/obra/superpowers | EXTEND | Superpowers itself is already queued (2026-11-06 #9). New angle: add commitment/checklist wording to Rakazo / Chief of Staff bot instructions so bots follow through. | $0 | A/B one bot's task-completion rate for a week |
| 6 | Impeccable design skill | EXISTS | Already queued (2026-11-06 #8, recommended). | — | — |
| 7 | Taste skill — https://github.com/Leonxlnx/taste-skill (MIT) | EXTEND | Add as one more contender in the OATHLOOM design bake-off (2026-10-29 #2, 2026-11-06 #5). | $0 | Same SWOSTing section, with vs without |
| 8 | 14 interface-design skills with accessibility focus (link not found) | EXISTS | Covered by queued accessibility pass in readiness monitor (2026-11-06 #13). | — | — |
| 9 | T3 Code meta-harness | EXISTS | Already queued as WATCH (2026-11-06 #6). | — | — |
| 10 | Anthropic knowledge-work plugins — https://github.com/anthropics/knowledge-work-plugins (Apache-2.0) | EXISTS | Covered by queued "Anthropic skills as cookbook" (2026-11-06 #10); add this repo to that item's reading list. | — | — |
| 11 | TradingAgents — https://github.com/TauricResearch/TradingAgents (Apache-2.0) | WATCH | Simulated trading only; possible Swoney education demo. Financial-advice risk; burns LLM calls. | Model cost | None |
| 12 | Karpathy CLAUDE.md skills — https://github.com/multica-ai/andrej-karpathy-skills (no license, last push 2026-04) | SKIP | Stale for current models; no license. | — | — |
| 13 | Multica (agents on a Kanban board) — https://github.com/multica-ai/multica | WATCH | CoS goal cards and SSS Brain task lists already queued (2026-10-29 #13). Lesson kept: agents stay disciplined only when the to-do list is built into their loop. | $0 | None |
| 14 | Omarchy Apple Dev (build/sign iPhone apps on Linux) (link not found) | WATCH | iOS support is required everywhere, but Apple terms require Mac signing; legal/ToS risk. | — | None |
| 15 | Context layer: all mail, calendar, chats, docs mined into person/company dossiers | EXTEND | SSS Brain hourly knowledge sync + RhoWatt CRM exist. Gap: entity linking (person/org) across indexed sources -> one dossier page, local model only. | $0 | Generate a dossier for one partner org from already-indexed docs |
| 16 | Agent edits a recorded call in house style | EXISTS | Queued as podcast/interview clip agent (2026-10-29 #1). | — | — |
| 17 | Zapier MCP (sponsor) | SKIP | Same as 2026-10-29 #14. | — | — |

Top 3 recommended: #1 (Cloudflare audit skill in SwadePower + scout vetting), #2 (free SEO audits for SWOSTing), #15 (dossiers from the knowledge sync).
