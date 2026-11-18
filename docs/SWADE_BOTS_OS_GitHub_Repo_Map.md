# SWADE BOTS OS — GitHub Repository Awareness

Verified by connected GitHub repository-list connector, 2026-11-14.
**Scope:** GitHub account/owner `swadesoul`, repository list page 0 size 100, next page offset 100 returned zero. This is a metadata snapshot, **not** an operational connection between SWADE BOTS runtime and the GitHub API. Nothing was cloned, deployed or edited. Some names may be old forks/experiments; do not conclude production status from repository existence.

## Important ecosystem repository candidates

| Product / system | Available repository name(s) | Mapping confidence |
|---|---|---|
| Maestro Radio | swade-radio; aimaestro; Maestroradio3; Maestroradio4; Maestro5; maestroradio-v7 | swade-radio strongly documented as source in Site Bibles; others not verified current |
| ReSingLab | resing | Documented GitHub name in ReSingLab Bible and visible in account |
| SSS Brain | sssbrain | Name match; live deployment mapping requires commit checks |
| OATHLOOM | oathloom; oathloom-app-build; oathloom-app-build-qa | oathloom in existing Site Bible; others possibly separate builds |
| ABAGALE | abagale; ABAGALE-TV-Show | Name match; verify distinct products |
| VideoSayWhat | videosaywhat | Name match; live code version unverified |
| SONIKYN | sonikyn | Name match |
| TokenCSI | tokencsi | Name match |
| MyDistribution | mydistribution; my-distribution | Two candidate repos; determine authoritative source before any actions |
| SWADE Soul World | swadesoulworld | Name match |
| Workscratcher | workscratcher | Name match |
| AttoBahn | attobahn; attomedica; attobahntech | Multiple candidates, no authoritative selection yet |
| The FREQ | Freq; thefreq | Multiple candidates, confirm production |
| SWADE platform | swadesoul; Swadesoul-web; Swadesoulhome; mainswade; Swadesoul-v6 | Several candidates, no universal source assumption |
| Android Maestro | rork-ai-maestro-mobile-app | Name match, app build not verified |
| Agent marketplace | agentmarketplacediy | Name suggests agent project; production mapping unverified |

## Mandatory next integration
The connected GitHub tool used for this snapshot is available in this ChatGPT context, **not yet certified inside the standalone SWADEBASE bot runtime**. To make all SWADE BOTS agents genuinely GitHub-aware, implement a server-side read-only GitHub adapter under SWADEBASE's Vault with a purpose-scoped GitHub App installation and per-repository grant; expose repository metadata, README, branches, latest commits, deployments and PR status to approved agents. Persist timestamps and source IDs. A capability checkbox in Fusion Builder does not grant that permission. Separate read/draft/PR-creation/merge/deployment capability scopes; owner approval for writes, merges and deployments. Never copy ChatGPT connector credentials into application code or disclose tokens in model prompts.

## Current recognition
Canonical ecosystem name aliases and indexed SWADEBASE Site Bibles can answer conceptual questions. Public website status checks are available for ten fixed destinations, but health HTTP 200 is not proof of full product function. Some Site Bibles explicitly mark features staged/not live. The Chief of Staff must distinguish documentation, repository snapshot, and verified live deployment.

## Runtime GitHub credential verification (November 14, 2026)
On SWADEBASE main VPS, /opt/swade-secrets/github.env is absent and existing lib/github.mjs reports hasToken() false. Public, unauthenticated GitHub API requests for candidate repo names resing, swade-radio, sssbrain, oathloom, abagale and videosaywhat returned HTTP404. They can still exist and be accessible via the authorized ChatGPT GitHub connector; these results do not establish a public repository. Therefore SWADE BOTS OS currently has an owner-only GitHub repository-name reference snapshot but cannot read current private source/PRs/commits directly from its runtime. Do not create tokens, copy linked ChatGPT credentials, or claim GitHub runtime integration without installing and verifying a purpose-scoped GitHub App or compatible approved connector.
