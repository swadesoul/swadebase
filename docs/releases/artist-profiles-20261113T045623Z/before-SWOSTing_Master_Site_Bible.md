# SWOSTing Master Site Bible

Version 0.2 — November 7, 2026. Status: PUBLIC SETUP INTAKE LIVE; paid fulfillment remains disabled. The October 29 proposal below is historical; current state is the dated release section at the end. Builds on SWOSTing_Capability_Assessment_2026-10-25 (owner file) and follows STANDING_RULES.md (rules 4, 11, 12, 13, 15).

## Identity
- Name: SWOSTing (Swade + Hosting). Tagline: "Your website. Taken care of." Powered by SSS Brain.
- Look: approved concept — gold woven-S logo, cinematic charcoal / champagne / ivory, serif display headline, glass "Your website is online" status card.
- Hosting rule (Harold, 2026-10-29): the SWOSTing site is stored and run entirely on SWADEBASE infrastructure (GitHub source, Coolify deploy, SWADEBASE auth/data, Backblaze media). No Lovable, no hosted Supabase.
- Front door (Harold, 2026-10-29): customers set up hosting and build/change their site by talking to Brainiak / SSS Brain. No traditional control panel.
- Management (Harold, 2026-10-29): the Chief of Staff (Rakazo, SWADE_MULTI_BOT_SYSTEM.md) manages everything SWOSTing does, through the existing agent adapter system.

## Offer and launch pricing (proposal, 80% gross-margin target)
Margin rule from BRAINIAK_USAGE_LIMITS_AND_JOB_BUDGETS.md: target 80%, minimum 60%, stretch 90%. price >= (C + 0.30) / (1 - 0.036 - m). Cost budget at 80% = 0.164 x price - 0.30.

| Offer | Price | Includes | Est. delivery cost | Est. margin |
|---|---:|---|---:|---:|
| Home | $29/mo | 1 site, status screen, daily off-server backup, SSL, monitoring, 5 Brainiak changes/mo | ~$4.25 | ~80% |
| Business | $79/mo | 3 sites, 20 changes, repair receipts, contacts/forms, monthly video recap | ~$12.60 | ~80% |
| Studio (agencies) | $249/mo | 10 sites, white-label client workspaces, 60 changes | ~$40 | ~80% |
| Brainiak Build (OATHLOOM) | $399 one-time | Brainiak interview, OATHLOOM build, human review, launch | ~$55 | ~82% |
| Bring my website | from $149 | Migration of a supported site; apps with databases quoted | labor | 70%+ |
| Extra changes | 10 for $15 | | ~$1.50 | ~85% |
| Add-on modules | $19–39/mo | voice line (DNA Front), media, courses (TeachVirt), radio (Maestro), newsletter (PubliSwade), direct ordering (Your Own Delivery) | per module | priced to 80% |

Cost assumptions (unverified, measure before launch): compute = share of a KVM 4 at ~$31–43/mo carrying 30–50 small sites; change cost ~$0.15 on T1 (Moxie measured $0.002–0.008 per routine run); support allocation is the largest variable. Never sell unlimited changes, AI, storage or uptime. Domains and pro email at cost plus a fixed fee. Annual = 2 months free. One-time purchases never include perpetual hosting.

Entitlements: each tier and add-on is a set of keys in product_grants (swosting.tier.home|business|studio, swosting.module.<slug>), enforced server-side, plus per-site swade_site_modules. Same mechanism as BRAINIAK_TIER_FEATURE_MAP.md.

## Reuse map (build only the gap — rule 11)
| Need | Existing component |
|---|---|
| Conversational setup and changes | SSS Brain / Brainiak (front door) |
| Site building | OATHLOOM (limits in the capability assessment: single-HTML output, visual editor unmounted) |
| Repair to draft PR, exact-commit Coolify deploy, approvals, receipts | MCP Actions + MCP Studio (deployed 2026-10-28) |
| Every customer site gets its own MCP | SWADEBASE MCP (services/swadebase-mcp) |
| Identity and roles | SWADEBASE Google sign-in / OnePass; Site Standard v1 (founder god mode, admin, CMS, data room) |
| Entitlements and billing | product_grants + shared Stripe (routes/stripe.mjs); billing stays off until tested |
| Monthly video recap | swadebase-hyperframes (live) + media-core |
| Media and backups | Backblaze B2 (swadesoul/swosting/...) |
| Restaurant ordering vertical | Your Own Delivery (/opt/yourown-web) |
| Newsletters | PubliSwade |
| Cost metering | ai_usage_ledger + ai_rate_cards |

## Chief of Staff management model
The CoS coordinates SWOSTing; no new competing agent platform.
- CoS: daily SWOSTing section in the morning brief (sites up/down, open incidents, repair receipts, approvals waiting, new signups, MRR, margin per tier), dispatches work and reviews outputs.
- Finance bot: Stripe read, MRR per tier, cost per site from ai_usage_ledger, flags any tier below 60% margin.
- Marketing bot: prospect lists, drafts outreach (sending gated, rule 5), no-cost promotion (rule 13).
- Video bot: monthly customer recap videos and promo clips.
- Future "Site Care" bot (Option C promotion rule, set up by Big Mamma per R1): deterministic checks, incident to evidence to approved runbook repair to verify to receipt. Automatic repair only within owner-approved runbooks; everything else escalates.
- All work through agent_handoffs / conversation log once approved; SWOSTing tasks carry site_slug.

## New capabilities proposed (from the Oct 29 AI-news review)
1. Agent-ready sites: each customer site ships an MCP so ChatGPT, Claude, Grok and other agents can book, order or ask. Headline feature.
2. Earn on payments: optional Stripe Connect checkout on customer sites with a small platform fee; can make low tiers cheaper.
3. Your site this month: 60-second HyperFrames video report instead of a PDF.
4. Subscription cut audit: Brainiak lists tools the customer pays for (forms, booking, newsletters, link pages, analytics) and shows which SWOSTing modules replace them, with yearly savings. Sales hook.
5. Revenue by traffic source: built-in analytics showing which posts and sources make money.
6. Circle to change: customer circles part of their live page and says what to change; the screenshot and note become the Brainiak change request.
7. Trust badge: "Cared for by SWOSTing" badge linked to a verified uptime/receipt page (extends SWADE Signature).
8. Song for a prospect: Marketing drafts a short custom song about a prospect's business through the music adapters; sending stays gated.
9. Own it, leave anytime: full export plus open-source style templates; customers pay for care, not lock-in.
10. Voice watch: local speech-to-speech models (e.g. Block's announced model) for Brainiak voice once downloadable; test, do not depend.

## Capacity and risk
- swadebase-2 (2 vCPU, 8 GB, swap 91% on 2026-10-24) did not respond to Desktop Commander on 2026-10-29 ~19:40 CT. It runs Coolify and Rakazo. Do not add customer sites there.
- Do not host customer sites on SWADEBASE (the locker).
- Customer sites need their own server (proposal: one Hostinger KVM 4 per 30–50 sites). That is new external spending: blocked by rule 13 until Harold approves.

## Proof required before paying customers
From the capability assessment: tenant isolation test; one site deployed with served revision verified; payment-to-entitlement and cancellation with signed, duplicate-safe webhooks; off-server backup restored in isolation; one approved repair plus one forced failure escalating; one customer receipt and authorized notification; one domain and certificate journey; one full export and exit.

## Open decisions for Harold
1. Business at $79 matches Brainiak Business at $79: bundle (SWOSTing Business includes a Brainiak Business workspace) or keep separate?
2. Approve a dedicated customer-site server (spending exception to rule 13).
3. Approve building the SWOSTing marketing site and app on SWADEBASE (GitHub repo + Coolify), section by section.
4. Payment fee percentage for Stripe Connect checkout, if adopted.
5. Which of the 10 new capabilities go into launch vs later.

## Decisions — 2026-10-29 ~19:47 CT, per Harold (recorded by Claude; backup .bak-20261030T* beside this file)
1. SWOSTing Business includes a Brainiak Business workspace (entitlements swosting.tier.business + brainiak business keys in product_grants). Margin note: Brainiak Business is BYOK, so added cost is mostly platform (~$5 est.). At $79 the bundle is ~74% (above the 60% floor, below the 80% target); $99 would restore ~78–80%. Price left at $79 until Harold decides.
2. APPROVED: a dedicated customer-site server (spending exception to rule 13). Exact purchase still needs Harold's exact approval of plan, term, amount and currency per the October 28 payment rule. Hostinger catalog read 2026-10-29: KVM 4 (4 vCPU, 16 GB, 200 GB) 1-year $179.88 first year then $371.88/yr; monthly $25.99 first month then $42.99/mo; 2-year $311.76 then $695.76. Recommended: KVM 4 1-year, Ubuntu 24.04 with Coolify template.
3. APPROVED: build the SWOSTing site on SWADEBASE infrastructure (GitHub repo + Coolify), section by section. Design skills: elayadesign/ai-design-skills (landing-page-design) and elayadesign/redesign-skill, both MIT; no "match-cut" repo exists under elayadesign (checked via GitHub API).
4. Operational note: swadebase-2 shows "running" in Hostinger but its Desktop Commander agent timed out three times on 2026-10-29 evening (memory pressure suspected). Coolify for SWOSTing should run on the new customer server, not swadebase-2.

## Decision update — 2026-10-29 ~19:50 CT, per Harold (supersedes decision 2 above)
- NO new server purchase. SWOSTing goes on existing servers. Rule 13 ($0 external spend) stands.
- Placement (Claude recommendation, measured 2026-10-30 00:49 UTC): swadesoul (KVM 8) has ~17 GB RAM available and 219 GB disk free, and its host nginx already serves ecosystem sites on 80/443. swadebase-2 (KVM 2, 8 GB) is under memory pressure and its agent is unresponsive; do not add load there.
- So: the SWOSTing site/app runs on swadesoul behind the existing host nginx, with SWADEBASE auth and data.
- Pilot customer sites also on swadesoul under guardrails, because swadesoul is the locker (keys, DB, auth): one container per customer site, its own Docker network, CPU/RAM limits, no host or secret mounts, no access to supabase-db, static/simple sites first, pilot cap ~10 sites. Move customer sites to a dedicated server once paying customers cover its cost (2–3 Home plans cover a KVM 4).

## Storage rule — 2026-10-29 ~19:50 CT, per Harold
All graphics and stored content (SWOSTing site images/video, customer site media and uploads, backups, generated recap videos) live on Backblaze B2 under swadesoul/swosting/... and are served from B2/CDN; uploads use pre-signed PUT URLs. Servers hold only code and running containers, never the durable copy. This also keeps swadesoul's disk free for the pilot. Backup cost is already in the plan pricing (B2 storage share).

## Talking Support Desk — design v1 (PROPOSAL, 2026-10-29 ~19:55 CT, per Harold's request)
Harold's goal: customers talk to an AI, say where the problem is; the AI checks it and fixes it. If the fix takes a while it says so and emails them when done. It must always be able to act on problems in the system.

Reuse (rule 11), build only the gap:
- Phone: OATHLOOM Receptionist (/opt/oathloom-receptionist; Twilio ConversationRelay, Ollama llama3.2:3b, email verification, tickets, async diag.py). Its diag.py states "no automatic fixes ... no sanctioned redeploy API wired in". That gap is now filled by MCP Actions.
- Web/app voice: "Talk to support" button on the SWOSTing dashboard via self-hosted LiveKit (running) and the SSS Brain GPT Live / Talkback voice. Preferred channel: no per-minute phone cost.
- Fixing: MCP Actions (repair to draft PR, exact-commit Coolify deploy, receipts), Incident Guardian, B2 backups, Playwright checks.
- Records: tickets + operation_receipts; CoS sees every ticket in its brief.

Flow: customer signs in (or is verified by email on the phone) -> says the problem -> AI repeats it back -> instant checks on THEIR site only (HTTP, SSL, container, last deploy, error logs) -> picks a tier:
- Tier 1, fixed during the conversation (seconds): restart the site container, clear cache, renew SSL, re-run the last deploy, roll back to the last good version, restore a file from the B2 backup. Automatic, own site only, snapshot first, verify after, receipt.
- Tier 2, "this will take a while, we'll email you": code or content fix -> draft fix -> test on a disposable copy -> deploy the exact commit -> verify the user journey -> email receipt (what broke, what changed, checks passed, how to undo).
- Tier 3, cannot be fixed safely by the AI: possible data loss, payments, DNS at another registrar, security breach, shared infrastructure or SWADEBASE itself. The AI says so honestly, gives a time estimate and escalates to Harold/CoS with the full diagnosis.

Honest limit: "always able to fix any problem" is not safe on swadesoul (the locker). The desk can always diagnose, always open a tracked ticket and always act within approved runbooks. Anything outside them is escalated, never forced. Every action is scoped to the caller's own site; it can never touch another customer, the database server or secrets.

Gaps to build: (1) connect Receptionist tickets to MCP Actions plus a runbook library for Tier 1; (2) LiveKit web voice for signed-in customers; (3) ticket status page + templated emails via existing mail (Resend/mailcow); (4) a stronger model for diagnosis planning (llama3.2:3b is fine for talking, weak for fix planning).

Decisions needed from Harold:
A. Standing grant for Tier 2: auto-deploy customer-site fixes that pass tests and have a rollback (rule 4 otherwise requires Harold to approve each deploy).
B. Standing grant for support emails: templated status emails only to the customer who opened the ticket (rule 5 otherwise requires approval per email).
C. Fix-planning model: free local model (slower, weaker) vs the T1 economy model Rakazo already uses (~$0.005 per run; conflicts with rule 13 unless approved).

Support Desk decisions — 2026-10-29 ~19:58 CT, per Harold: A = YES (auto-deploy tested customer-site fixes), B = YES (templated emails to the ticket's customer only), C = YES (T1 economy model for fix planning, capped). Recorded as STANDING_RULES.md rule 19. Status: design approved, not built.

## DEPLOYED — Network outage page (2026-10-29 ~20:00 CT, by Claude, per Harold)
- What: a cinematic "We'll be right back" page (charcoal/champagne, slow light, self-refreshing every 30 s, "Your data is safe", "Cared for by SWOSTing") shown whenever an app behind nginx is down (502/503/504). Real status code is kept (no SEO damage); Retry-After 60; no-store.
- Files: page /opt/swosting/outage/__swosting_outage.html (self-contained, no external assets, so it works even when Backblaze or fonts are unreachable: deliberate exception to the B2 storage rule). Snippet /etc/nginx/snippets/swosting-outage.conf. Installer /opt/swosting/ops/apply-outage-page.py.
- Applied to 30 sites / ~59 server blocks in /etc/nginx/sites-enabled (not leslie-original-domain: its server block format did not match; add by hand if wanted). New sites must include the snippet (part of the customer-site template).
- Verified: nginx -t OK, reload OK; 10 live domains still return 200/302/307 as before; a temporary test server proxying to a dead port returned 502 with the page; test server removed.
- Rollback: tar xzf /opt/swadebase/backups/nginx-before-swosting-outage-20261030T005914Z.tar.gz -C / && nginx -t && systemctl reload nginx
- Limit: if swadesoul itself or its network is down, nothing on it can serve this page. A whole-server outage page needs the same page hosted off-server (Backblaze/other host) with DNS failover: future item.

## SWOSTing Shield — security design (PROPOSAL, 2026-10-29)
Finding 2026-10-30 00:59 UTC: on swadesoul only ufw is active; fail2ban, CrowdSec and ClamAV are not running. No automatic attack blocking exists today on the locker server.
Selected open source (GitHub checked 2026-10-29: license, stars, last push):
- CrowdSec engine (crowdsecurity/crowdsec, MIT, ~15.4k stars, active): reads nginx/SSH logs, detects attacks (scans, brute force, exploits), shares a free community blocklist; includes an AppSec/WAF component using OWASP CRS. Bouncers block IPs (firewall bouncer at the network layer, or cs-nginx-bouncer, MIT). Its local API gives alerts/decisions per site = the data for the customer dashboard.
- OWASP Core Rule Set (Apache-2.0) via CrowdSec AppSec, or Coraza (Apache-2.0) / ModSecurity (Apache-2.0) if a dedicated WAF is needed.
- Daily scanners: Trivy (Apache-2.0) for container/dependency CVEs; OSV-Scanner (Apache-2.0) for source dependencies; Nuclei (MIT) external scan of our own and opted-in customer sites; ClamAV for uploaded files; Lynis (GPL-3.0) weekly host audit.
- Not chosen: BunkerWeb (AGPL-3.0, replaces nginx; AGPL obligations when sold as a service), Wazuh (heavy, needs ~8 GB+), fail2ban (superseded by CrowdSec).
Architecture: CrowdSec protects every site on the server (it protects us, so it is on for everyone). Results flow to SwadePower (the ecosystem security center), Incident Guardian, the Support Desk and the CoS brief. We build our own "Protection" tab in each customer admin (Site Standard v1 admin area): attacks blocked, attacker IPs and countries, what they targeted, block/unblock/allowlist buttons, export, saved history. Detection engine = CrowdSec; product, UI and per-site data = ours.
Offer: everyone gets network protection included. "SWOSTing Shield" upsell $19/mo (included in Studio): the Protection dashboard, per-site WAF tuning, custom block and allow lists, daily scan report, monthly security video, priority incident response. Delivery cost ~$0–1/site (CPU only) -> ~90% margin.
Rollout (needs Harold's approval, production change on the locker): install CrowdSec + firewall bouncer in observe-only mode 48 h, allowlist Harold's IPs, Hostinger, Stripe/Twilio/GitHub webhook ranges and our own servers, review false positives, then enforce; then the daily scanners; then the dashboard.

## Domain + showcase — 2026-11-07
- swosting.com: Namecheap, parked; connect once the site is deployed (see SWADEBASE Bible, 2026-11-07 1:35 AM).
- OATHLOOM now publishes showcase entries to swosting.showcase_entries (SWADEBASE); the SWOSTing site renders /showcase/<subdomain>. Expose schema swosting to PostgREST when the site goes live.


## November 7, 2026 — SWOSTing public setup intake

Updated by ChatGPT at 2026-11-07T08:18:32.175904+00:00. Live URL: https://swosting.com/. Namecheap apex and www web records now point to the existing SWADEBASE swadesoul server; the previous parking records are backed up in /opt/swosting/backups. HTTPS is installed with automatic renewal and a scoped nginx reload hook. Existing email mode and unrelated records were preserved. The site uses the supplied gold logo and cinematic reference. No new host, subscription or paid generation was purchased.

The app at /opt/swosting/app runs as swadeops on loopback port 18850 under swosting.service with resource limits. It reuses existing SWADEBASE GoTrue, the existing PostgreSQL service and public OATHLOOM showcase table. A central /swosting/auth/callback location avoids changing shared Google redirect configuration. PKCE, a one-time 60-second handoff, encrypted server-held access tokens, secure HttpOnly cookies, origin/CSRF checks, parameterized queries and forced tenant RLS protect saved requests. App database permissions exclude auth.users and shared app data. Founder privilege requires verified identity, an allowlisted founder email and the existing shared is_super_admin function. Billing remains off for everyone; founder-facing bill reads exempt $0. No customer may grant themselves an active paid plan.

Implemented: responsive public page, monthly/annual plan display, migration/build/agent setup forms, authenticated customer request tracking, customer-visible progress updates, founder request review/export, privacy/terms, showcase rendering and shared Brainiak links. Source is in the verified private swadesoul/swade-ecosystem-hub repository, services/swosting, branch codex/swosting-launch-20261107, PR57. Automatic approval review blocked its merge to main; no merge claimed. Private operational scripts, full Bibles and evidence remain on SWADEBASE rather than GitHub.

Verified: 15 source tests, 30 real PostgreSQL assertions using mocked identity (including tenant isolation, duplicate-safe requests, CSRF, logout, OAuth handoff and denial of core identity-table access); 14 origin HTTPS checks; both originals uploaded to private B2 with roundtrip SHA-256 checks. Desktop browser verified artwork, onboarding dialog, annual pricing, interactive example, workspace entry and Google account chooser. Source hashes match the staged GitHub application files. Disposable test requests/sessions/audit rows were removed by their exact fixture IDs.

NOT A FULL PAID-HOSTING LAUNCH: real owner Google completion, native iPad Safari/mobile visuals, customer provisioning, off-server restore, site export, paid checkout-to-entitlement/cancellation, automated repair, support email, voice, purchased agents/transfers and connector execution remain unverified or unimplemented. Page explicitly accepts setup requests without collecting payments. Do not advertise these pending services as active. Site-specific CMS/scoped admin assignments and the shared signature component remain gaps; shared Brainiak links and a generic footer do not certify those capabilities.

Recovery: stop only swosting.service; restore its prior source and media cache from the B2 originals; restore its web DNS records from /opt/swosting/backups/dns-before-* only after comparing concurrent records; remove only its nginx vhost and its marked central callback location, validate nginx, then reload. Canonical evidence and hashes: /opt/swosting/release.json. No shared auth/database restart was performed.


## SWOSTing PR57 merged — 2026-11-07T11:13:14.136148+00:00

Swade explicitly approved the merge. ChatGPT merged PR57 into the private swadesoul/swade-ecosystem-hub main branch; merge commit 06f56b37d10dca2cca24690fd3f2a0aff43e3c19. The tested head was 851a87e61bfd2958c6e4060567d5951572ec7cd4. The merge confirms source integration; it does not activate billing, provisioning, voice, automated repairs or agent execution. The existing public setup-intake deployment remains the recorded release. Canonical receipt: /opt/swosting/release.json. Prior documentation and receipt versions were preserved.


## Cinematic artist-page rollout — 2026-11-10T23:47:57.477964+00:00 (2026-11-10 17:47 CST; ChatGPT)

**Public pages LIVE; owner dashboard STAGED.** Founder requested an individual page for every existing artist using uploaded imagery with varied cinematic backgrounds. The existing OATHLOOM artist-site renderer, SWOSTing fallback routes, SWADEBASE records/auth and native storage were reused. No second service, database, paid model on page views or scheduler was added.

49 canonical page records now exist: 17 published and 32 private drafts, with 75 links to existing platform identities. Public directory: https://swosting.com/artists. Eight cinematic palettes, integrated artist portrait, actual available tracks, one persistent audio element, editorial biography, approved video links and artist connections. Empty sections are omitted; no fabricated subscription form, songs, statistics or badges. Existing explicit legacy design looks remain supported; cinematic palettes are server-renderer defaults.

Nevaborya uses the founder-uploaded purple-suit reference through a separate identity-preserving cinematic derivative. Her original remains unchanged. Royal Banks and Rivan portraits were recovered from their existing public source assets and copied into native storage. All three selected page portrait variants also have verified durable copies through the existing B2 media core; protected receipts are in the backup folder. Old source assets and original artist records were preserved.

55 recordings returned HTTP 200 from native artist storage. Six published-title references with absent exact recordings retain external artist links rather than false direct play controls or substituted mixes. Thirty-two drafts remain unpublished: 18 private/incomplete SONIKYN records, ten Maestro artist records without a usable portrait, three inactive creator records and the ReSingLab Royal entry whose portrait/canonical Royal Banks linkage is not verified. No other user's private references were published.

Source: swadesoul/oathloom branch feat/cinematic-artist-rollout-20261110. Public renderer/rollout c50aae9 (initial faaa832). Owner inventory, draft reopen endpoint and matching preview built at c2298e5; image oathloom-frontend:c2298e5-cinema. Automatic approval review REJECTED the attempted OATHLOOM frontend container replacement plus production artist-site handler update, citing service-disruption risk beyond explicit artist-page build approval. That call did not execute. Owner inventory/load action remains staged; live frontend remains oathloom-frontend:8f745eb-artists. Do not describe its new inventory or preview as shipped. Existing public pages and directory are already independently live.

Validation: 8 Bun tests / 29 assertions; Deno handler typecheck; successful production frontend build; 34 real public Chromium layouts at 1440/390px with no overflow, broken displayed image or page exception; all 49 URL visibility checks (17 HTTP 200, 32 HTTP 404); directory lists exactly 17 pages. Actual audio decoded/advanced and paused on Nevaborya, Granada and Reggie. Staged owner UI fixture passed at 1440/820/390px with no production writes forwarded. Fixture auth is not real Google/owner login certification; native physical iPad Safari and authenticated owner inventory lifecycle remain unverified.

Recovery: protected baseline, initial table/link snapshots, runtime function copies, rollback-initial.sql, next-phase rollback.sql, immutable source, image receipts and test reports at /opt/swadebase/backups/artist-cinema-20261110. Review for edits since rollout before any rollback. To undo public rollout, restore the backed-up artist-site/_artistsite sources and reconcile/restore initial page/link snapshot using rollback-initial.sql; preserve new customer edits and durable media. Do not execute the staged OATHLOOM frontend swap without approval of that exact live switch. No DNS, payment, radio-engine or shared edge-runtime restart occurred. Full receipt: releases/2026-11-10_Artist_Cinematic_Pages.json.


### Owner editor reconciliation checkpoint — 2026-11-10T23:55:56.095752+00:00 (ChatGPT)

The newer upstream cinematic editor ef1371f was found on feat/builder-studio-layout and preserved. Draft/revision/restore controls were reused instead of replacing them with a second inventory. Source conflicts are resolved in 6ecbace; phone-width chooser fix and template compatibility tests are in **04a6087**, draft PR https://github.com/swadesoul/oathloom/pull/45. Source-only renderer compatibility keeps the existing cinema-* pages on their current stored design, and an explicit v2 upgrade retains their colors. The initial rollout renderer is isolated in _artistsite/rollout.ts; the upstream cinematic.ts remains intact.

**Prepared candidate supersedes c2298e5:** oathloom-frontend:04a6087-cinema. Production build, Deno typecheck and ten Bun tests /33 assertions passed. Reconciled owner chooser, draft reopen and preview passed 1440/820/390px browser fixtures with zero forwarded production writes, no overflow or script exceptions. The v2 additive revision migration passed in a rolled-back transaction: 17 existing published HTML snapshots matched byte-for-byte, revision table RLS was on and anonymous SELECT was denied. No revision schema was activated in production.

The public directory and 17 published/32 draft records remain as recorded above. OATHLOOM live frontend is still 8f745eb; automatic approval review blocked the live replacement. The only pending approval is the exact tested artist-management rollout: additive revision-history schema, reconciled function/template files and the staged OATHLOOM frontend switch. Do not execute it through an alternate path while blocked. Owner login completion, customer publishing/restore lifecycle and physical iPad Safari remain unverified.

## Maestro Artist Studio — 2026-11-12T22:47:41.442621+00:00 / ChatGPT

LIVE: https://themaestroradio.com/artist-studio. Source e1618d31e9c860167baf901fda9c8f0e2459428b in /opt/work/maestro-growth-20261112, branch feat/artist-growth-20261112. Release /var/www/maestroradio-web/releases/20261112T224521Z-artist-studio; previous /var/www/maestroradio-web/releases/20261112T224344Z-artist-studio; backup /opt/swadebase/backups/maestro-artist-studio-20261112T224521Z. Owner explicitly requested implementation of the branded cinematic artist builder, references/prompt edits and connected promotion/identity workflow.

Reused existing OATHLOOM artist renderer/editor (04a6087), 34-look catalog, SWADEBASE identity/database, oathloom-upload/B2, Mailcow artist domain and Maestro host service. Native Maestro session; no OATHLOOM customer branding/link-out or frontend container replacement. Existing published HTML is unchanged. Full editor includes portrait/gallery/music/bio/consent, focal control, palettes/looks, ordered sections, desktop/phone preview, private drafts, atomic revisions, restore and unpublish. Draft name/image changes no longer leak through the public artist directory; existing page URLs stay stable. Prompt edits use only existing local Ollama llama3.2:3b with bounded inputs/output, concurrency/rate limits and sanitized structured style changes. No paid provider fallback. References provide image color sampling, not screenshot-to-HTML or visual model analysis; reference URLs are not included in public gallery, but underlying media URLs remain publicly readable through the established media service.

Published artist snapshots generate owner-scoped downloadable campaign drafts. This is NOT delivered advertising, directory submission, third-party signup or an activated external promotion network. No prices/subscriptions, payment flows, external messages or paid listing/model orders changed. A customer can activate a unique per-site artist alias on existing artists.swadesoul.com; TLS/API verification and readback confirm routing to the existing managed artist inbox. No new mailbox/password or catch-all is created, and foreign-account activation is denied. Existing Mail Center remains the operator inbox; third-party registrations still need provider eligibility/consent. Label team delegation and account-management integrations are not inferred from this release.

Verification: 15 Bun tests/52 assertions, Python alias safety/idempotence tests, actual local CPU-model structured response, TypeScript app typecheck, production build and Deno check; rolled-back PostgreSQL atomic publish/revision failure/privacy/grant tests. Browser fixtures at 1440/820/390 cover prompt/undo/reference uploads/draft settings/previews with no production writes. Actual live synthetic accounts via a temporary two-use invite tested sign-in, cross-account denials, save/reopen/publish/private draft/restore/unpublish, campaign snapshots and identity requests, real managed alias creation/readback/idempotence/tenant denial, B2 upload+byte readback+foreign-owner denial, desktop/phone signed-in and returning-session UI, anonymous sign-in gate and absence of builder badges. Fixture accounts/pages/invite/media/aliases removed; expected audit history retained. Physical iPad Safari and Harold's personal Google OAuth completion remain unverified. Existing public radio/education/pricing/planner/artist routes healthy; radio engine and shared edge runtime were not restarted.

During acceptance, fixed a local-model recommendation that could hide unspecified music sections; visibility now stays unchanged unless explicitly requested. Alias activation originally attempted an audit through a non-exposed database schema; corrected to existing Maestro audit_log and retested successfully. Do not claim per-artist mailboxes: these are unique managed aliases.

Source synchronization BLOCKED: automatic approval review rejected git push to configured origin because exact destination/branch authorization was not explicit. No alternate publication attempted. Tested code is committed locally on the server; not on GitHub main. Require explicit owner approval to push these implementation commits to swadesoul/swade-radio, branch feat/artist-growth-20261112. Future builds must preserve this live source until synchronization/merge is approved; building an older main would remove the editor.

Rollback: restore previous Maestro current symlink and backed-up artist-site/_artistsite/factory.py/artist_design.py/artist_identity.py files; restart maestro-factory only. Preserve additive revision/design/campaign/identity tables and customer records. Review concurrent changes before source restoration. Mail aliases already activated are real identities; do not delete customer aliases during rollback. See ARTIST_STUDIO_RELEASE.md, deploy-artist-studio.py, deployment.json, studio-ui-report.json, studio-live-report.json and studio-live-browser.json in the workspace. No broad rollback of older artist-page snapshots is authorized.
