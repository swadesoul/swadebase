# GroundLift Master Site Bible

Version 1.0 — October 28, 2026, America/Chicago
State: public site live on groundlift.help; many features built but with little or no live data; CA directory coverage not loaded. Read-only research; no code, site, database or Lovable changes were made to produce this Bible.

Source key: [LIVE] = seen on https://groundlift.help on 2026-10-28 (curl + headless browser render). [DB] = read-only query of schema `groundlift` in supabase-db on swadesoul, 2026-10-28. [CODE] = GitHub swadesoul/groundlift-20df925d (Lovable-synced app, main, last push 2026-10-21). [PRD] = GitHub swadesoul/groundlift docs/PRD.md (plan only). [REG] = SWADEBASE registry tables. Anything marked TO CONFIRM WITH HAROLD is unverified.

## 1. Identity and ownership
- Name: GroundLift ("Small acts. Real possibility."). Domain https://groundlift.help. [LIVE]
- Founder: Harold Whaley (hw@groundlift.help). Founding Partner / Sr. Admin: Daisy Tate (daisy@groundlift.help). [LIVE /about]
- Managing nonprofit shown on site: Veterans Supplemental Support Network (VSSN), described as GroundLift's "501(c) nonprofit home"; Pass the Cup is described as one of VSSN's own community programs. VSSN: Temecula, California; 415-779-8776; vetsupportnet.org. [LIVE /about, homepage]
- PRD lists product owner as "Swade Soul". [PRD] Legal entity, ownership split, and the written VSSN agreement: TO CONFIRM WITH HAROLD.

## 2. Purpose
- Site statement: "GroundLift connects people who need help today with neighbors, organizations and businesses who want to give it: shelter, food, water, rides, learning and work." It claims to be "mobile-first, voice-ready and usable in 20+ languages". [LIVE /about] (see section 11 on the language claim)
- PRD vision: image-first, voice-first opportunity platform: Learn → Practice → Get Certified → Paid Work → Income → Support → Housing. [PRD]
- Homepage campaign: Pass the Cup — launch goal of 100 people sharing a cup message on November 9, 2026; site states "100 is our launch goal, not a verified sign-up count." [LIVE]

## 3. Features — live status
Public, no sign-in [LIVE]:
- Homepage "cupboard" (Pass the Cup), three entry paths: I need help / I want to give / Let's partner; 911/988/211 crisis bar on every page.
- /safeplace — SafePlace directory: 30+ categories (shelter, food, basic needs, health, ID/legal/benefits, work, transport, storage, pet), filters (cost, provider type incl. Nonprofit/Government/Healthcare/Workforce/Legal/Housing), verification badges (Official / Partner / Community-verified / Needs re-check), "Report a correction". Data: 12 resources, all Dallas–Fort Worth TX (official, verified 2026-08-10). No California listings. [DB]
- /kiosk — shared-device kiosk, "Free help. No account needed", screen clears itself on a timer (83 s countdown observed). [LIVE]
- /alerts — weather alerts by SMS/WhatsApp (phone, ZIP, state). NWS broadcasts recorded in DB for AK, AZ, CA, CO, ID, MD, NM, UT, VA (54 rows, last 2026-10-21) with 0 recipients; 0 alert subscribers. [DB] Twilio delivery: TO CONFIRM.
- /give (offers board, 20 offer types), /give/widget (embeddable philanthropist signup widget) — 0 active offers. [LIVE][DB]
- /needs (post a specific need) — 0 needs. /sponsor (sponsor packages that credit member wallets) — 0 packages. [LIVE][DB]
- /learn GED Forward — 6 stages, 16 lessons seeded, 5-question placement quiz; /tutors — no approved tutors. [LIVE][DB]
- /own Ownership & Enterprise — RV park / land listings with deal calculator; GroundLift states it is not a broker/lender. [LIVE]
- /vendors — paid options kept separate from free results; none listed. /kb Help Center — 0 articles. [LIVE][DB]
- /developers + Partner API v1 (OpenAPI at https://groundlift.help/api/public/v1/openapi.json): register orgs, philanthropist profiles, locations and live pings, offers, offers/nearby, invite users; API keys scoped. 0 API clients registered. [LIVE][DB]
Sign-in required (Google or email) [LIVE, contents from CODE]: /dashboard, /partner (create organization, invite staff), /veteran ("Veteran Bridge partners with VSOs, HUD-VASH case managers, and Vet Centers"), /family, /elder, /health, /homepath (housing application), /community, /work (paid missions), /connect (personal phone number with voicemail transcripts), /liftid, /wallet, /vault, /billing, /inbox.
- Program referral form (program types: health, elder, veteran, homepath, family, youth, disability) writes to program_referrals: 0 referrals. [CODE][DB]
- SMS/WhatsApp keyword router (FOOD, SHELTER, SHOWER, CLINIC, MENTAL, LEGAL, JOB, ID, WARM, DV, VET + ZIP). [CODE] Live number/Twilio status: TO CONFIRM.
- MCP server (/mcp) tools: create-offer, create-program-referral, get-me, list-my-offers, search-kb, search-missions, search-offers. [CODE]
- Voice "Read page" guide using browser speech; language menu has 8 options (en-US, en-GB, es, fr, ar, zh, hi, sw). [CODE]
- Resource ingestion from OpenStreetMap (Overpass) exists in code; resource_ingestion_log has 0 rows (never run against SWADEBASE DB). [CODE][DB]
Planned only (PRD phases 2–3, not verified built): delivery dispatch, work pods, Open Badges, multilingual voice tutoring, multi-city rollout, land-bank integrations, tiny-home marketplace, employer API, international support. [PRD]

## 4. User and organization engagement
- Individuals: browse SafePlace/kiosk/alerts without an account; create account (Google or email) to post needs, request program referrals, save GED placement, use Connect/Wallet/Vault. [LIVE][CODE]
- Givers ("philanthropists"): guided setup choosing offer types and radius, post offers; share widget. [LIVE]
- Organizations: Partner portal (create org, invite staff), Partner API keys, sponsor packages, vendor listing, live location pings (food trucks, outreach vans). [LIVE][CODE]
- Current usage: 1 profile, 1 philanthropist profile, 0 partner orgs, 0 offers, 0 needs, 0 referrals. [DB 2026-10-28]

## 5. Target audience
People experiencing homelessness or housing instability; veterans and military families (veteran pathway, VSSN); families, elders, youth, people with disabilities (program kinds); givers, nonprofits, businesses, churches, sponsors. [LIVE][CODE][PRD]

## 6. Geographic reach
- Directory markets defined: Dallas–Fort Worth TX, Los Angeles CA, San Diego CA, Las Vegas NV. Only DFW has listings (12). [DB]
- Weather alert monitoring spans multiple states (see section 3). [DB]
- PRD lists multi-city and international support as Phase 3. [PRD]
- Actual service area, CA rollout date, and languages beyond the 8-voice menu: TO CONFIRM WITH HAROLD.

## 7. Source, hosting and backend
- Frontend: Lovable project 99efcd56-e65d-4e86-a2f4-efdec45eeff6 (published, public), TanStack Start/React; synced repo swadesoul/groundlift-20df925d (private). Served via Cloudflare. [Lovable][CODE][LIVE headers]
- Backend: SWADEBASE self-hosted Supabase at swadebase.cloud, schema `groundlift` (93 tables). [LIVE bundle][DB]
- Older planning repo swadesoul/groundlift (README, docs/PRD.md, design CSS; open issue #1 "Implement GroundLift"). PRD names Vercel/Hostinger hosting — superseded by Lovable; TO CONFIRM.
- OnePass SSO: foundation only, "production SSO not enabled yet" (docs/ONEPASS_ROLLOUT.md). [CODE]

## 8. Place in the SWADEBASE ecosystem
- swadesoul.ecosystem_sites: slug groundlift, status active, platform lovable, category Help Services, module_mode live, health endpoint /api/health (never checked). [REG]
- swadesoul.swade_site_modules: auth module enabled (usage audit 2026-10-24). [REG]
- sssbrain.ecosystem_sites: Lovable import, stage "building", bottleneck "Code, live flows, domain and deploy status not yet audited", inactive. [REG]
- Not in swadebase_ops.adapters_registry, stripe_sites, maps_sites; not in the store site-readiness.json. [REG][store]
- Related: Veteran Bridge ("powered by GroundLift") — /opt/swadebase/docs/site-bibles/Veteran_Bridge_Master_Site_Bible.md. Listed as a future knowledge source in /opt/swadebase/docs/KNOWLEDGE_LEARNING.md. PRD Phase 2 mentions ABAGALE success stories, TeachVirt and Swoney integrations (planned). [docs][PRD]

## 9. Fit with VSSN programs (Care Navigator Co-Pilot, Daisy Link, Pass the Cup)
- Pass the Cup already runs on the GroundLift homepage and is credited as VSSN's program. [LIVE]
- Possible integration points that exist in code: Partner API, program_referrals (incl. veteran), partner org/staff invites, MCP tools, SMS keyword VET. No data exchange with VSSN systems exists today. [CODE][DB]
- VSSN's Care Navigator Co-Pilot and Daisy Link: no references found anywhere in GroundLift code, docs or DB. TO CONFIRM WITH HAROLD/DAISY.

## 10. Verification and known gaps (2026-10-28)
- Live: site and all public routes return HTTP 200; sitemap and robots present.
- Gaps: no California resources; empty offers/needs/sponsors/tutors/KB; 0 alert subscribers; ingestion never run; Twilio/SMS live status unknown; payments may be in test mode (PaymentTestModeBanner exists) — TO CONFIRM.

## 11. Risky to promise
- "Usable in 20+ languages" (/about) — code shows an 8-language voice menu; no translated UI found.
- Any California/statewide or national coverage, live SMS/WhatsApp help line, weather alerts actually delivered, partner/organization counts, or VSSN data integration.
- VSSN impact figures (45,500+, 36,500+, 950+) are VSSN's own reported numbers.

## 12. Decisions, sources and next review
- Created 2026-10-28 by read-only research at Harold's request; backup of docs folder at /opt/swadebase/backups/groundlift-bible-20261029T001304Z.
- Open: legal/ownership relationship with VSSN; CA data plan; language scope; SMS number status; whether Veteran Bridge and GroundLift /veteran are one product.

## 13. Harold's stated vision for Pass the Cup and engagement (per Harold, 2026-10-28 — NOT verified as built)
- Pass the Cup should raise money for people in need. Harold would invite space-economy investors and wealthy donors from his own contact database to give.
- Each donation would be split: part to the space mission, part to VSSN programs.
- Other nonprofits and partners can join.
- Philanthropists and businesses can sign up to donate things such as a food truck, hotel rooms for a night, phone service, or restaurant food gift cards.
- Copernic Space is a long-term add-on partner, not the core of GroundLift.
Build status against this vision (2026-10-28):
- Built: philanthropist signup and offers (/give, /give/join, /give/widget) with offer types incl. Hot Meal, Motel Night, Phone Charging, Wi-Fi Hotspot, Rent Help; organization registration via Partner portal/API incl. org kind food_truck and live location pings; vendor listings incl. Food truck and Hostel; Stripe contribution checkout only for a posted need or a sponsor package; site states "Contribution recipient and terms are always shown before any payment." [LIVE][CODE]
- Not built / not found: any donation split between a space mission and VSSN; a Pass the Cup donation or fundraising page (the homepage says "No donation required"); gift-card or phone-service offer types as named; donor/investor outreach tooling; any Copernic Space reference in the GroundLift code or site; multi-nonprofit fund routing. Charitable-receipt and fiscal-sponsor handling through VSSN: TO CONFIRM WITH HAROLD (PRD section 16 says charitable donations must route through a qualified nonprofit or fiscal sponsor). [CODE][PRD]

## 14. Pass the Cup and Philanthropist Program (Harold's spec, 2026-10-28, NOT BUILT)
Appended 2026-10-28 (America/Chicago) from Harold's spoken spec. Docs only: nothing here has been built, and no code, Lovable, Stripe, database or live-site change was made. Backup taken first: /opt/swadebase/backups/groundlift-passcup-20261029T002335Z/. "Exists today" refers to the read-only audit in sections 3 and 13 ([LIVE]/[CODE]/[DB], 2026-10-28).

### 14.1 Planned features
| # | Planned feature (Harold's spec) | What already exists in code/site | Gap to build | Owner | Status |
|---|---|---|---|---|---|
| 1 | Philanthropist backend: every giver gets a unique Philanthropist ID number | /give offers board, /give/join guided setup, /give/widget embeddable signup; philanthropist profiles via Partner API v1 (1 profile in DB) | Human-readable giver ID, giver dashboard/history, admin giver records | Harold (product); build TBD | Planned, not built |
| 2 | Phone QR scanner: givers or partners scan a person's card to deliver help | Nothing found for QR scan/delivery confirmation | Camera QR scan in mobile web, scan-to-confirm delivery event, privacy rules (consent, minimal data on card) | TBD | Planned, not built |
| 3 | 3D digital card for each person being helped | /liftid route exists behind sign-in (contents not tested); /wallet, /vault | 3D card design (ties to cinematic UI, item 10), QR payload, offline/kiosk use, lost-card reissue | TBD | Planned, not built |
| 4 | Food trucks in region act as delivery partners, not nonprofits | Partner API org kind food_truck + live location pings; vendor listings incl. Food truck | Delivery-partner role and flow (accept a delivery, confirm via QR), make sure food trucks are never listed or paid as charities | TBD | Partly exists (registration/pings only) |
| 5 | Recurring contributions via Stripe Connect: platform fee to GroundLift, remainder to the charity (VSSN etc.) | Stripe checkout only for a posted need or a sponsor package; PaymentTestModeBanner exists (live/test status TO CONFIRM); site says recipient and terms are shown before payment | Stripe Connect accounts for each charity, recurring subscriptions, application-fee split, payout reporting | Harold + VSSN (financial/legal); build TBD | Planned, not built |
| 6 | Tight records and audit trail | Standard DB tables per feature; no dedicated audit log confirmed | Append-only audit log for gifts, scans, deliveries, role changes, payouts; exportable reports for VSSN | TBD | Planned, not built |
| 7 | Roles: Harold super admin; Daisy Tate charity-data admin; other admins and city teams for a national layer | Partner portal (create org, invite staff); scoped API keys. Site standard SWADE_SITE_STANDARD_V1.md (rule 15) defines super admin = Harold, PROPOSED, not approved | Role model: super admin / charity-data admin / city-team admin / partner staff; city/region scoping | Harold (approve standard); Daisy (charity data) | Planned, not built |
| 8 | Stronger research and phone-number lookup tools for resources | SafePlace directory (12 DFW listings), OpenStreetMap ingestion code (never run), "Report a correction", /connect personal number | Resource research/verification tooling, phone-number lookup/verification, CA and national data loading | TBD | Planned, not built |
| 9 | GED education leveled up to high-end | GED Forward: 6 stages, 16 lessons, 5-question placement quiz; /tutors (0 approved) | Richer lessons, practice tests, progress/credentials, tutor supply; possible TeachVirt tie-in (PRD) | TBD | Planned, partly exists |
| 10 | Cinematic UI aiming for AWWWARDS level, keeping the existing cupboard with hanging ceramic cups on hooks and soft clink sounds | Homepage cupboard (Pass the Cup) is live | Visual/motion upgrade per /opt/swadebase/motion/CINEMATIC_STANDARD.md; keep the cupboard, cups on hooks and soft clink audio (respect reduced-motion and sound-off settings) | TBD | Planned, not built |
| 11 | Space-investor donors: gifts split between the space mission and VSSN; Copernic is a long-term add-on only | No donation split, no Pass the Cup donation page (homepage says "No donation required"), no Copernic reference in code or site | Campaign page, split rules, donor outreach from Harold's database, disclosures | Harold | Planned, not built |

Integrations status: OneSignal (push) and Twilio (SMS/WhatsApp) delivery status UNKNOWN; TO CONFIRM.

### 14.2 Open items on payments (must be settled before any money moves)
- Platform fee percentage to GroundLift, and whether it is shown to donors.
- Charitable receipts and tax deductibility: which entity issues receipts (VSSN as 501(c) / fiscal sponsor?). PRD section 16 says charitable donations must route through a qualified nonprofit or fiscal sponsor.
- How the space-mission share is treated: likely not tax-deductible, so it may need a separate, clearly labeled payment.
- Stripe Connect KYC/onboarding for each charity (VSSN first), who owns the platform account, payout schedule.
- Refunds, chargebacks and failed recurring payments: who absorbs them and how they are recorded.
- Written GroundLift–VSSN agreement covering all of the above.

### 14.3 Suggested phased build order (pilot first)
1. Phase 0 — Agreements and decisions: VSSN collaboration agreement, fee %, receipts/fiscal sponsor, approve SWADE_SITE_STANDARD_V1.md, confirm Stripe/Twilio/OneSignal status.
2. Phase 1 — Pilot with VSSN in one city (suggested Temecula/San Diego area, where VSSN is based): load real CA resources, roles (Harold super admin, Daisy charity-data admin), philanthropist ID numbers, audit log, one-time gifts to VSSN only.
3. Phase 2 — Delivery loop: digital card with QR, phone QR scanner, food trucks as delivery partners, delivery confirmation records.
4. Phase 3 — Recurring giving via Stripe Connect with platform fee, donor reports and receipts.
5. Phase 4 — Pass the Cup campaign and space-investor giving with the split, outreach from Harold's database.
6. Phase 5 — National layer: city teams and admins, research and phone-lookup tools, more markets.
7. Ongoing — GED high-end upgrade and cinematic UI pass (can run in parallel after Phase 1); Copernic as a long-term add-on only.

### 14.4 Open questions for Harold
1. Is there a signed agreement with VSSN, given the site already calls VSSN GroundLift's managing nonprofit?
2. What platform fee percentage, and does VSSN issue all charitable receipts?
3. How is the space-mission share handled legally and for taxes, and who receives it?
4. Which city should the pilot start in?
5. What does the person's digital card show, and what data may a scanner see (consent and privacy)?
6. How do food-truck deliveries get paid or reimbursed, and by whom?
7. What exactly can Daisy see and change as charity-data admin, and who appoints city teams?
8. Are Stripe live mode, the Twilio number and OneSignal set up for GroundLift?
9. Which GED provider or curriculum counts as "high-end" (e.g., TeachVirt tie-in, official practice tests)?
10. Is Copernic named publicly at all now, or held back until later?


## October 30, 2026 — VSSN partnership correction (ChatGPT / Codex)
State: PREPARED IN DRAFT PR; NOT DEPLOYED. https://github.com/swadesoul/groundlift-20df925d/pull/3 . Source branch fix/vssn-partnership-20261030.
Owner requested Daisy Tate's attached changes. Harold remains Founder; VSSN and Daisy are Co-Founding Partners, not platform management/Board Chair. Pass the Cup is VSSN's campaign developed with GroundLift. Prepared homepage/About wording, direct Givebutter campaign and separate information links, and anonymous-directory explanation plus VSSN existing intake link in SafePlace. All six cups retained. No auth role changes or new payment/case integration.
This supersedes earlier proposed donation-split/Stripe plans for VSSN-managed Pass the Cup programming: funds route directly through VSSN approved campaign; no separate collection/disbursement without written agreement and VSSN approval. Existing unrelated payment routes still require review; enforcement is not certified.
Basic program referrals exist, but accountable cross-system case navigation is unverified. See docs/handoffs/GROUNDLIFT_VSSN_20261030.md for all questions, proposed responsibilities, three walkthroughs and launch gates. Hosting last documented as Lovable; current publish pipeline and full build/browser checks pending. Repository deploy SSH key failed authentication; connector branch writes succeeded. No deployment, restart, migration or config reload performed.
Rollback: discard draft branch or revert PR after merge; no database changes. Prior Bible preserved under /opt/swadebase/backups/groundlift-vssn-20261030/. Knowledge-index refresh/retrieval and What's New entry pending; no shared runtime changes.


## Publication requested 2026-10-30T15:28:17.530741+00:00
Owner explicitly instructed Make live. PR3 merged as a49c599824543b7c6c7f4d8972318b7ba36981ff. Lovable default source confirmed updated; existing hosting publish requested, deployment 072b1b83-255c-4894-a71f-4f379f4c29e6 returned pending. No AI editing turn or paid generation requested. Browser live homepage still served prior copy on first check. Publication verification remains in progress. External Lovable origin is a branding/migration exception; no owner-hosted cleanup certified. Existing Claude swadebase-2 lock preserved; this scope uses only GroundLift existing publication.


## LIVE VERIFIED 2026-10-30T15:30:08.582622+00:00 — ChatGPT / Codex
Owner-approved PR3 merged as a49c599824543b7c6c7f4d8972318b7ba36981ff. After source synchronization/preview rebuild, publication c22180a8-d2b2-45f9-bae2-4f02d2b4abfa was requested. Live cloud-browser verification at https://groundlift.help/ showed the six cups, Give a Cup of Joy through VSSN (givebutter.com/passthecup), separate Learn About Pass the Cup, and co-founding partnership copy. /about showed Harold Founder, Daisy Co-Founding Partner and revised VSSN campaign responsibilities. /safeplace showed directory/no-automatic-case explanation and VSSN existing intake link. These supersede prior pending publication state. No donation, form submission or participant record changed.
Scope limits: no complete case-navigation integration, auth/email acceptance test or campaign receipt test performed. Existing Lovable hosting remains the documented migration/branding exception. No new paid AI editing session. Rollback: revert PR3 and republish the prior source b96bcbf74b935e28af4b0b328846142ea75a3ff3. Knowledge-index and private Whats New sync remain pending; this entry records actual publication evidence.
