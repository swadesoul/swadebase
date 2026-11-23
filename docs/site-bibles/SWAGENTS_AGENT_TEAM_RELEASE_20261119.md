<!-- swagents-team-20261120:start -->
# SWAGENTS agent team and scoped connections checkpoint

Release date: **November 19, 2026, Central time** / November 20 UTC. Internal release identifier: `swagents-team-20261120`. The live customer entry is `https://swagents.live/team`, also linked from the homepage and account area. This checkpoint records the core release, its separate homepage script-cache correction, and the final retained source. It does not certify full GROKBOT parity.

## What is connected

The Team room saves private tasks, specialist contributions, handoffs and CROWN summaries for the signed-in owner. A task can select up to three specialists. Each specialist receives the contributions already saved for that same task, and CROWN produces the combined result. The owner can inspect progress and cancel work. The durable worker uses leases and records interrupted work as failed; it does not silently replay an interrupted task.

The existing central encrypted vault now supports separate customer connection metadata and per-agent grants. The owner may assign a connection directly to an agent or assign it to CROWN with explicit allowed recipient agents, uses, origins and expiry. Through the owner controls, a narrower child grant can then be created for an allowed specialist. Child access cannot broaden the parent scope or delegate again. Revoking a connection or a CROWN parent grant blocks subsequent checks using that access. Legacy founder/admin vault items remain separate and are not automatically assigned to customer agents.

Passwords and keys are not supplied to the language model, conversation history, client DTOs or ordinary logs. The private broker resolves a secret only for an active server-persisted task with the matching owner, agent, exact operation, grant, connection and lease. The database independently checks those bindings, current-agent execution, expiry and revocation. Conversational/advisory tasks never confer credential authority. The application role is neither superuser nor able to bypass RLS; all six new tables have forced row-level security. The general Vault storage remains unavailable to that role.

Connected credential execution is deliberately narrow: owner-requested **read-only GitHub and ElevenLabs authentication checks** against fixed HTTPS endpoints. No arbitrary URLs, redirects, provider response bodies or account data are returned to the agent. Stored website passwords can be assigned, but **automatic browser login, password filling and general account actions are not connected**. CROWN delegation is controlled through the owner's grant interface; the model cannot independently authorize itself or choose a credential task.

## Capacity controls and measured evidence

The worker admits at most two active tasks globally and one per owner. Team model turns use one local inference lane; tasks have a 120-second deadline. Team generation has no paid-model fallback. These controls bound this release; they are not a claim about all other platform workers or hosting capacity.

The **historical core release passed 321 checks**: 58 Node 20 checks, 18 real PostgreSQL team checks, 23 vault SQL checks, 21 actual worker/vault integration checks, 189 browser UI checks, nine real local-model checks and three assembled-server checks. The local-model smoke test used two synthetic owners, two tasks and 6 successful specialist/CROWN turns. Both tasks completed in approximately **64 and 71 seconds**, with zero observed model or task errors. Two tasks were admitted concurrently while the local team inference lane stayed at one. This is a small smoke sample, not a service-level commitment or load-capacity benchmark.

Database checks used the actual nonprivileged application role in a guarded temporary database. Credential fixtures were synthetic; no real customer passwords or keys were used. Browser coverage used automated desktop/mobile Chromium scenarios. Real customer Google sign-in and physical iPad/Safari acceptance were not performed. Telephone calling, specialist email delivery and unrelated existing account/browser integrations are **not certified by this release**.

## Core release and cache correction are separate evidence

The core manifest covers 12 application files and nine shared files. Six existing application paths changed; six application paths and nine shared files were new. The release protected the 217-file baseline, installed both additive schemas transactionally, restarted only SWAGENTS, checked actual team/vault attachment, verified six public files and required signed-out team API access to return 401. Rollback retains additive database records rather than deleting credentials.

A returning-browser issue was found after core deployment: the homepage still referenced `/app.js?v=20261120identity1` although `app.js` had changed. The separately reviewed cache follow-up changes that one reference to `/app.js?v=20261120team1`. The character-art cache reference retains its own existing value. The follow-up changes no JavaScript bytes, backend, database, service configuration or credentials. Its three exact public-byte proofs cover the homepage, `index.html` and the newly versioned app-script URL.

The final homepage hash is `d84d8fce93bbb00cf8a904af13e423d2cdd6fec5fb89e3ae8d8c908a68c8d1df`. It supersedes only the homepage entry in the historical core manifest. The original 321 checks remain historical core evidence; they are not relabeled as a new complete test run after the cache-tag correction.

## Retained source and SSS Brain

Site Design Repair imports all **54** public source files. Core reviewed source version 11 remains preserved; version 12 retains it before the cache correction. Final reviewed version **13** has source hash `d116ac033d48314a9ff8a687dab4295ba1a8a2c89cc3b509f82e893cd61b8534`, is saved in the existing private project, and is mirrored to SSS Brain. All 54 final live public source files were checked against that retained source. The shared source-binding workflow remains `fe9491022931f2e23142fb7520af956599bb0748bf31c263620848a8a3a64d61`; normal redesign protections were not bypassed. The exact reviewed `app.js` remains protected and `team.js` is protected as well. Earlier versions, conversations and receipts remain intact.

Verified source publication: draft [SWAGENTS PR #4](https://github.com/swadesoul/swagents/pull/4) at `715e8fa8f66395b2e454c76f21d21b27c53f5f7d` and draft [ecosystem hub PR #76](https://github.com/swadesoul/swade-ecosystem-hub/pull/76) at `3537b7688bb7f3219b0bd5da255b2eacdb7f01ff`. The SWAGENTS branch includes the cache-reference follow-up; neither main branch was merged. The pinned readback verifies all candidate blobs and preserves unrelated files.

## Pinned evidence

All operations receipts below are under `/opt/swadebase/ops/swagents-team-20261120` unless an absolute path is shown.

| Evidence | SHA-256 |
| --- | --- |
| `TEAM_RELEASE_MANIFEST.json` | `d986fc6048d2f5df981418273da9836c28f2f9747037a750010709859226c6b9` |
| `TEAM_DEPLOYMENT.json` | `ffbb8566d9b098c2d87e9441f74fb72c5fd5971bc832d299cb0ecc9c9e9e82c0` |
| `RELEASE_ACCEPTANCE.json` — original 321 checks | `f3c4b2674fa7374f784ccaf8f5f11eda52f76ada3419b7b38673faa0a42a21cb` |
| `TEAM_SOURCE_BINDING_DEPLOYMENT.json` | `5c73f0e0747b63cd6f810b59b15c9d18ab1eff5225d1965e85681b82bc59d3ac` |
| `TEAM_CACHE_RELEASE.json` — one-reference follow-up | `580c2df84cf0e2077becce7c89e5e5444685ab18ff655c736d82f7e11c1401a2` |
| `/opt/swadebase-adapters/var/site-design-repair-team-cache-reviewed-release.json` — final version 13 | `0eaaf096ac60545beea527754a4ffb1eb728f69eb5fbf3d3a9b813e8fe62b99f` |
| `SOURCE_PUBLICATION.json` — final Git readback | `40f561a4fddf3fa33ff300c58edfc7a32c113daa156dc5ff37e754236de2c4c7` |

The version-11 source receipt remains at `/opt/swadebase-adapters/var/site-design-repair-team-reviewed-release.json`, hash `d84031d9bd8fef57d490dae24b787daaf63926a58743c5937a85072d6b3ce5bc`. The original source publication receipt remains `SOURCE_PUBLICATION_CORE.json`; the final receipt adds the cache correction instead of rewriting the original evidence.

Canonical context is appended to the SWAGENTS, SWADEBASE, SWADE_BOTS and Site Design Repair Bibles and `daily/2026-11-19.md`. This compact standalone checkpoint stays below the existing 250,000-byte indexing cap. Full Bibles retain their complete history even when an oversized Bible is excluded from the existing index. The private release event and documentation sync send no external messages and make no paid-model calls.
<!-- swagents-team-20261120:end -->
