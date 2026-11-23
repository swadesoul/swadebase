# Swail — SWADE SOUL MAIL (swail.live) — Master Site Bible
Version 0.1 — 2026-11-17 16:15 CT. Status: CONCEPT APPROVED FOR PLANNING, NOT BUILT. Recorded by Claude from Swade's direction in chat.

## 1. What it is
A real mail website (Gmail / Zoho / Outlook / Yahoo class) that is the front end for mail engines SWADEBASE already runs — not a new mail server.
- **Mailcow** (mail.swadesoul.com) = mailboxes: receive, store, personal send (IMAP/SMTP). See SwadeMail_Master_Site_Bible.md.
- **Postal** (postal.swadebase.cloud, server4) = SWADEBASE's self-hosted Resend: app/transactional sending, newsletters, delivery/open tracking, webhooks. "Mail Machine" orgs per site. See Postal_Master_Site_Bible.md.
- **Swail** = the one place to read, write, broadcast, sell and grow, across every ecosystem site.

## 2. Domain
- swail.live registered 2026-11-17 on Namecheap (account swadesoul, Namecheap DNS, WhoisGuard on, AutoRenew OFF — recommend turning on). Expires 2027-11-17.
- Namecheap API: NAMECHEAP_USERNAME / NAMECHEAP_API_KEY in SWADEBASE-2 Coolify shared variables; API calls work from SWADEBASE-2 (2.25.96.150, whitelisted). Registry showed NXDOMAIN at 16:10 CT (fresh registration propagating).
- Planned DNS: swail.live → SWADEBASE main 2.25.74.73 (own hosting, not Lovable). Mail for @swail.live via Mailcow (MX mail.swadesoul.com). Per-Room outreach subdomains on separate Postal lanes (rule 25e).

## 3. Product structure — four lanes
1. **Conversations** — person-to-person mail (threads, search, labels, attachments) on Mailcow.
2. **Rooms** — one per ecosystem brand (Maestro, VideoSayWhat, Black Tales, SWAGENTS, SWOSTing, ReSingLab, yourown.delivery, FrontDesk DNA/DNA Front, ABAGALE, TeachVirt…). Each Room: its own addresses, signature, team, playbook, growth agent, triage desk. Super admin switches Rooms in one tap; includes the artist mailboxes already BCC'd to swadesoul@gmail.com.
3. **Broadcasts** — the Mail Machine side: newsletters, welcome series, Morning Mix reminders; step-by-step carousel with live preview (Swade's preferred pattern, no long forms); sends through Postal; delivered/opened/bounced.
4. **Signals** — all automatic system mail (receipts, sign-ups, alerts, Stripe, "your song aired") as a calm feed instead of inbox clutter.

## 4. Growth layer
### 4a. Room growth agent (one per Room)
Loop: Positioning (playbook: what the Room sells — enterprise and single-user packages — who buys, price ladder, proof) → Prospecting (ranked list with a reason per prospect, in-house data first) → Outreach (short specific emails in the Room's voice + follow-up sequence) → Reply handling (read thread, classify intent: interested / pricing / timing / not now / unsubscribe; draft or send per rule 25; forward to swadesoul@gmail.com with who / what they want / next step) → Close (Swade Stripe checkout or plan link, booking, handoff to onboarding).
### 4b. Triage desk (per Room)
Hot replies needing Swade · drafts awaiting approval · deals in motion · **$10K/week scoreboard** (pipeline value, closed this week, gap to $10,000, agent's next move). The $10K/week figure is an internal target, never promised to prospects.
### 4c. The Swail Connector (one brain behind all Rooms)
- **Shared contact map** in SSS Brain (extends sssbrain.brain_crm_contacts): prospects, clients, artists, sponsors, labels, partners, investors; needs, purchases, touch history.
- **Fit analysis** on every contact against the whole ecosystem → bundle recommendation with estimated deal value, routed to the right Rooms.
- **One owner per contact** (rule 25f) — the lead Room carries other Rooms' offers.
- **ReSingLab song invites** — custom short song as the opening touch for top-tier prospects, delivered as a private listening link; Connector proposes, Swade approves each (credits).
- **Money-finding lane** — sponsors/advertisers (Maestro, Black Tales, ABAGALE), partners/resellers, grants and contracts, investors (identified and organized; investment messages go to Swade + attorney first).
- **Company rollup** for swadesoul@gmail.com: total pipeline, closed this week by company vs $10K target, top cross-sell opportunities, top five conversations needing Swade today.

## 5. Guardrails (STANDING_RULES.md rule 25 — authoritative text lives there)
Auto: replies to inbound within playbook, unsubscribes, forwards. Campaign-level approval: cold sequences (audience, templates, daily cap approved once). Always Swade: custom pricing/contracts, investment/financing language (attorney), song invites, press, complaints, new domains/IPs. Legal floor: CAN-SPAM (identity, LLC postal address, honest subjects, unsubscribe), CASL/GDPR consent (skip unless opted in), no earnings claims. Deliverability: separate outreach subdomains/lanes, start 25/day/Room, auto-pause at bounce ≥2% or complaints ≥0.1%. Spend: in-house first, cheapest model tier, rule 13 applies.

## 6. Integration (reuse, don't rebuild)
- **Shared mail adapter** on SWADEBASE: generalize functions/vsw-_shared/mail.ts (Postal first, Mailcow fallback, Resend-shaped) into one adapter every site imports; sites still on Resend switch with a one-line import change.
- **Domains page**: add a domain → exact DNS records shown → verified via Postal + Namecheap API (the manual step done for themaestroradio.com on 2026-11-17).
- SWADEBASE auth and super admin (rule 15/21), gifting, scoped roles + audit log; Swade Stripe for paid plans; SWOSTing plans can bundle Swail mailboxes; SWAGENTS agents power Room voices; Voice Studio for voice replies and read-aloud; SSS Brain for triage/memory; OmniRoute for model routing at the lowest tier that does the job.

## 7. Build order
1. Shell + unified inbox (Swade's own mailboxes, read/send) + Rooms.
2. Broadcasts, Signals, Domains page, shared mail adapter → **Maestro switches to Postal here** (staged: /opt/work/maestro-postal/index.ts; Postal server 4 kept Development/held per Swade 2026-11-17 16:01).
3. Growth agent in one pilot Room (prove the loop).
4. Swail Connector (contact map, fit analysis, song invites, money lane), then every Room joins.
5. Public product + pricing.

## 8. Working defaults until Swade says otherwise
Pilot Room: Maestro (labels, artists, sponsors). Start cap 25 new contacts/day/Room. Outreach subdomains: yes, one per Room. Audience: Swade + roster first, public sign-up in phase 5.

## 9. Change log
- 2026-11-17 16:15 CT — v0.1 concept, guardrails (rule 25), domain confirmed. No code, DNS or sending changes.

## 10. Founder inputs 2026-11-17 16:13 CT + proposals (PENDING APPROVAL)
- Audience: Swade + roster first, built for public sign-up too.
- Daily send cap: Swade set **500,000/day**. Recorded as the platform's capacity target for opted-in Broadcasts, reached by warm-up (dedicated warmed IPs, weeks of ramp). Cold outreach stays on the rule 25e ramp (starts 25/day/Room, grows only with clean bounce/complaint numbers); 500k/day of cold mail would get server4's IPs blocklisted and risks the Hostinger anti-spam terms. Swade to confirm this split.
- Proposed Swail plans: Free (invite only) $0 · Starter $12/mo · Growth $49/mo · Business $149/mo · Enterprise from $499/mo. Add-ons: extra mailbox $3/mo, dedicated sending IP $49/mo, +10k broadcast sends $10, ReSingLab song invite (price TBD with ReSingLab costs), SWAGENTS Phone $15/mo (DNA Front).
- Free sign-up gift: one personal address on a domain the user picks from a list (Mailcow domains today: swail.live once added, themaestroradio.com, blacktales.online, ghostrep.live, brainiak.live, swagents.live, artists.swadesoul.com). Free addresses are personal only: no Broadcasts or outreach from them, ~50 sends/day, reserved names blocked (admin, support, billing, founder, roster artist names), inactive 180 days = reclaimed after warning. Brand reputation protected.
- Invite codes: Roster codes (Swade-issued, full Growth free), Partner codes (labels/agencies, 60 days Business free), Member codes (every user gets 3; inviter earns 1 free month per paid sign-up), Gift codes via the admin gifting pattern (rule 15). One-use, expiring, tracked to inviter.

## 11. Lead Vault — data inventory (read-only scan 2026-11-17 16:25 CT, nothing changed)
Swade: PubliSwade, MYDistribution and SeedLeaker are valuable databases; all data must be reachable in the back end so leads can be sold through Swail. PubliSwade still needs cleaning (SeedLeaker cleaned; Pollstar data added to MYDistribution by Swade).
- publiswade.contacts 64,068 (not cleaned yet; fields: name, email, phone, station/show/DJ-MD, org, role, city/state, health_score)
- musiceco.places 1,974 (daily music brief since 2026-10-28: 460 community radio, 371 potential customers, 242 blogs, 144 press, ...; 749 with email) + musiceco.contacts 417 + brief_entries 2,189
- sssbrain.brain_crm_contacts 215; sssbrain.money_bar_opportunities 26; swadebase_ops.cos_revenue_opportunities 5
- seedleaker.investors 12; attobahn.investors 3, attogrid_waitlist_leads 10; groundlift.directory_organizations 12
- Pollstar (in MYDistribution): licensed data, likely no resale; internal outreach only unless attorney clears it.
- NOT FOUND on SWADEBASE: the Black-owned business list and daily financial leads collected in ChatGPT briefings. Location to be confirmed by Swade (ChatGPT, Google Drive, other).
Plan: clean PubliSwade into a side-by-side cleaned copy (originals kept), tag every contact (source, category, quality, resale rights), Lead Vault view across all sources; buyers reach leads through Swail campaigns by default (raw list never leaves), file export only for rights-clear data. Data-broker registration (CA, TX) + attorney review before sales.
- 2026-11-17 16:27 CT — Pollstar decision (Swade, founder override): Swade paid for Pollstar and considers the data his; Pollstar contacts will be released to paying users in tiered quantities (contacts per plan), not sold as a whole database. Claude flagged once that redistribution may be limited by the Pollstar license; Swade overrode. Build Pollstar as a shareable Lead Vault source with per-plan contact allowances; keep source tag "pollstar" on every record so it can be switched to reach-only with one setting if ever needed.

## 12. PubliSwade quality check — 2026-11-17 16:30 CT (read-only; script /opt/work/publiswade-clean/profile.sql; nothing changed)
- 64,068 rows, all is_system, imported 2025-12-13..21, health_score flat 50 (never scored).
- Real music-industry contacts: 744 (radio_station 366, investor 209, reviewer 62, record_label 60, music_manager 27, promoter 20).
- 63,324 rows labeled "associated_press" are NOT press: California small businesses (99% CA; realtors e.g. Coldwell Banker, insurance e.g. State Farm, auto dealers, mortgage, contractors), email + city only (city on 62,449, website on 18,717), no person name, org, phone or role. Heavy AOL/Yahoo/Earthlink/SBCGlobal = an older list; expect high bounce.
- 3,323 duplicate rows (2,467 emails repeated); 639 malformed cells (mostly two-three emails joined by "^^" or ", ", some with spaces/underscores); 5,428 generic addresses (info@, sales@...); 16,661 distinct email domains; 901 missing phone overall.
- Proposed clean (side-by-side copy publiswade.contacts_clean, originals untouched): split multi-email cells into rows; normalize; dedupe; relabel the 63,324 as "CA small business" with org derived from website/email domain; DNS/MX check per domain (16,661, DNS only, no mail sent); flag generics; real quality score. Do not cold-send this segment before MX check + a small warm test (rule 25e 2% bounce limit).

## 13. Google Drive data map — 2026-11-17 16:40 CT (titles/metadata only, no file contents read, nothing moved)
- Investor/finance lists (~90 xlsx, mostly in a folder owned by [redacted-email], dated 2021-2024): global VC (45k, 50k "clean", 38k), family offices (global, USA, $500M-1B, $1B+ AUM, pre-seed, real estate, construction), angels (individual, LinkedIn 1k+, SaaS, Canada), PitchBook and Crunchbase exports, crypto VCs/funds/LPs/Dubai brokers, pension funds, endowments, investment banks, private placement agencies, "10,000 Contacts Looking For Investment Opportunities", "Main Leads Databased 6.22.23", Corporate Database Master 2022, Real Estate Investors Clean 2024, Food & Beverage. -> SeedLeaker / Swail money lane. PitchBook/Crunchbase exports carry those vendors' licenses; ages 2-5 years -> verify before use.
- Black-owned businesses: "Fort Worth Metropolitan Black Chamber of Commerce - Member Directory" (sheet, Sep 2026).
- Music industry: Ultimate DJs and Labels List, 2025 College Radio Directory (PDF), Music Distribution Directory, Housing Complex FM & LPFM Research, Station Audio Library folders.
- Swade-owned IP: Swade Soul Lyrics/Suno folders, DEEMO S01E01 cuts, Miller London documentary, The Man Who Sold Motown, Urban Network Ep2, PET MUZIK explainers, Token CSI reports/briefings, Swoney decks/game docs, ABAGALE Investor Financial Package, Recording and Personal Services Agreements (3 .doc), Adult + Children coloring-book prompt sheets, Educational AI Tutoring case studies, Daily Summaries, SWADESOUL_DATAROOM per-brand folders.
- Public research data: incarceration trends (county/state, jail construction, BJS corrections spending, 2024 jail/prison) from [redacted-email].
- Third-party copyrighted books: ~40+ "For Dummies" PDFs (Wiley), "Dirty Little Secrets of the Record Business" -> reference/reading only; not for narration, courses, resale or AI training into products.

## 14. Founder decision — 2026-11-17 16:32 CT: reach-only for ALL lead data
- Users never receive contact emails/phones from any Lead Vault source (Pollstar, PubliSwade, Drive investor lists, music brief, Black Chamber, etc.). They buy reach; Swail sends for them. Supersedes the "file export" option in section 11 and makes the section 10 Pollstar note moot (Pollstar is reach-only like everything else).
- Every user signs up and gets yourname@swail.live (replaces the "pick a domain from a list" free gift in section 10; ecosystem brand domains stay reserved for staff/roster).
- Proposed protection for swail.live reputation: a user's identity/inbox is yourname@swail.live; cold campaigns go out from a sending subdomain (e.g. yourname@reach.swail.live) on the outreach Postal lane with Reply-To back to their swail.live inbox, so one bad sender can't sink everyone's normal mail. Per-user daily caps, auto-pause on bounces/complaints, recipient-level unsubscribe across all users. Working default: reach.swail.live sending subdomain (protects everyone's normal swail.live mail); Swade can override.
- DECIDED (Swade 2026-11-17 16:36 CT: "once they answer they get that email address") — recipients in replies: when a contact replies, the conversation (and that contact's address) is visible to the user in their inbox — a contact who engages becomes the user's own relationship.

## 15. Gap + security audit — 2026-11-17 16:50 CT (Claude; read-only checks, nothing changed)
Live findings on our own mail stack:
- Postal server4 PTR = srv2121798.hstgr.cloud but SMTP hostname = mx.postal.swadesoul.com -> forward/reverse DNS mismatch (Gmail/Yahoo require valid FCrDNS). Fix: set PTR in Hostinger panel to mx.postal.swadesoul.com. Main 2.25.74.73 PTR = mail.swadesoul.com (OK).
- DMARC p=none on swadesoul.com, themaestroradio.com, blacktales.online; swadesoul.com DMARC reports still go to dmarcreports@lovable.dev (Lovable leftover). videosaywhat.com (LIVE on Postal) has NO DMARC and its root SPF lacks the Postal include. No MTA-STS/TLS-RPT anywhere.
- Mailcow: 23 mailboxes, 0 with two-factor; POP3 110 and IMAP 143 open on all interfaces.
Competitive baseline (Instantly/Smartlead/Apollo/Gmail/Zoho/Superhuman/Proton/Tuta): unlimited mailboxes + automated warmup networks, inbox rotation, placement testing, built-in lead DBs (Instantly ~450M claimed, Apollo ~240-275M), AI reply agents, CRM sync; free mail providers fight abuse with CAPTCHA/phone/email verification and new-account holds (Tuta ~48h review).
Required before public launch (security first): 2FA/passkeys for all Swail + Mailcow accounts; signup abuse gate (invite code + phone or card verify + new-account send hold); per-user and per-domain rate limits with auto-suspend; one-click unsubscribe (RFC 8058) + global suppression list honored within 2 days; DMARC p=quarantine->reject with our own rua inbox; MTA-STS + TLS-RPT; PTR fix; Postmaster Tools + Yahoo CFL monitoring; complaint target <0.1% (hard stop 0.3%); app passwords per mailbox stored encrypted server-side; audit log on every super-admin mailbox read (rule 15); Lead Vault rows never sent to browser (server-side merge only); backups of mail to Backblaze encrypted; spam/phishing inbound filtering (Rspamd already in Mailcow) + attachment scanning; abuse@ and postmaster@ mailboxes.
Product gaps vs competitors: warmup + placement testing, inbox rotation across reach subdomains, reply classification (have planned), CRM sync, mobile apps (PWA first), calendar/booking, LinkedIn/SMS channels (SMS via DNA Front/Twilio later), deliverability dashboard.
Our edge to lean on: owned lead data + reach-only, Rooms per brand, cross-ecosystem Connector, ReSingLab song invites, voice replies, own infrastructure (no per-seat SaaS fees).

## 16. Direct connection to SWOSTing — founder direction 2026-11-17 16:39 CT
Swail is SWOSTing's mail layer, not a separate product silo.
- One account: Swail signs in through the same SWADEBASE GoTrue identity SWOSTing uses (swosting app /opt/swosting/app, swosting.service :18850, central auth callback). A SWOSTing customer is a Swail user automatically; a Swail sign-up can add hosting later without a second account.
- One tenant: swail tables carry the SWOSTing customer/site ids (swosting.app_sites) so mail, domains and Rooms belong to the hosted business.
- One entitlement system: plan grants written to the existing cross-product grants table (brainiak.product_grants pattern already used for swosting.tier.*), keys swail.tier.* / swail.reach.*.
- Bundles (proposed): SWOSTing Home $29 -> Swail Starter included (3 mailboxes on the customer's own domain + yourname@swail.live); Business $79 -> Swail Growth included (1 Room + growth agent, outreach subdomain, reach credits); Studio $249 -> Swail Business included (Rooms per client, white-label). Standalone Swail plans stay for non-hosting users.
- Domains: when SWOSTing hosts a domain (Namecheap API already used by SWOSTing), Swail auto-creates the Mailcow domain, DKIM, SPF/DMARC/MTA-STS and Postal records in one step; the SWOSTing care agent watches and repairs mail DNS like site issues.
- Security shared: SWOSTing Shield / CrowdSec + SwadePower feed Swail abuse signals; Swail abuse events (bounces, complaints, suspicious logins) go to the same Protection tab and incident flow.
- Billing: Swade Stripe adapter, one invoice through SWOSTing.

- 2026-11-20 (Claude): Swail code versioned locally: /opt/swail/app is a git repo (main, 4d36596; .gitignore excludes node_modules and env/key files; secrets live in /opt/swade-secrets/swail.env, not in repo). Not on GitHub yet - no repo swadesoul/swail exists and no API token available here; create the empty private repo and push.
- 2026-11-20 (Claude): PubliSwade cleaned copy BUILT: publiswade.contacts_clean (rebuild: /opt/work/publiswade-clean/clean.sql; MX: mx_check.py, DNS only). 64,068 -> 61,072 unique emails (969 split from multi-email cells, 3,501 duplicates merged). Segments: ca_small_business 60,433 (avg quality 59, 15,588 legacy-ISP addresses), music_industry 639 (radio 287, investor 187, reviewer 61, label 60, manager 26, promoter 18). RLS on, no policies, revoked from anon/authenticated. resale_rights=reach_only. Originals untouched.
- 2026-11-20 (Claude): MX check done (DNS only): contacts mx 49,769 / a_only 4,384 (mailable 54,153); nxdomain 4,419 + no mail route 2,359 = 6,778 dead (quality -40); lookup error 141. Rule 25e still applies: small warm test before any cold send to ca_small_business.
- 2026-11-21 00:50Z (Claude): Swail code on GitHub: github.com/swadesoul/swail-mail (repo created by Swade), main = 4d36596, pushed from /opt/swail/app (origin github-all:swadesoul/swail-mail.git). Secret scan clean; env/key files excluded by .gitignore; secrets stay in /opt/swade-secrets/swail.env.

## Status snapshot 2026-11-21 (Claude)
- Live: swail.live phase 1 mail client, plus the security fixes: DMARC quarantine on 4 domains, POP3 and plain IMAP closed, Postal PTR set.
- Source: github.com/swadesoul/swail-mail (main 4d36596). Server copy /opt/swail/app tracks it.
- Lead Vault: publiswade.contacts_clean built, 61,072 unique, MX-checked, reach-only.
- Maestro mail runs on Postal: unifiedMail plus server 4 Live.
- Still open:
  - 2FA (0 of 23 mailboxes)
  - signup abuse gate before public launch
  - Phase 2: Broadcasts, Signals, Domains page
  - Phase 3: growth agent pilot in the Maestro Room
  - Phase 4: Connector
  - Phase 5: public launch plus pricing (proposed Free / $12 / $49 / $149 / $499+, not confirmed)
  - free-domain list
  - the 500k split between Broadcasts and cold outreach
  - investor-list merge into SeedLeaker and the Black Chamber import
  - founder mailbox password handoff (/root/.swail_founder_mailbox)
