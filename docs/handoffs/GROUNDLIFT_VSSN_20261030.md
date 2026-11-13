# GroundLift / VSSN change and answer record
Date: October 30, 2026. Author: ChatGPT / Codex.
Status: SOURCE CHANGES PREPARED; not deployed. PR: https://github.com/swadesoul/groundlift-20df925d/pull/3

## Definitions and responsibility
GroundLift is an informational, community engagement and connection platform. SafePlace is its resource discovery directory. A basic program-referral feature exists, but a complete accountable case-navigation service and VSSN data exchange are not verified.
Harold Whaley remains Founder. VSSN and Daisy Tate are recognized as Co-Founding Partners; Daisy is not designated GroundLift Board Chair. Pass the Cup is a VSSN campaign developed with GroundLift, with both as founding partners.
Proposed responsibility agreement, subject to signatures: GroundLift owns platform operation, access controls, directory provenance and technical incident handling; VSSN owns its charitable funds, approved intake, navigator assignment, service decisions and delivery oversight. Participating providers own their eligibility and actual service decisions. Name an accountable VSSN case owner and backup before offering managed navigation.

## Prepared code
- Homepage retains six cups and cupboard; adds Donate Through VSSN / Give a Cup of Joy at https://givebutter.com/passthecup and separate information link https://www.vetsupportnet.org/cupofjoy.
- Homepage and About remove claims that VSSN manages all GroundLift.
- About fixes Daisy's fallback and database-fed public titles; no authorization roles changed.
- SafePlace explains anonymous browsing, absence of automatic case assignment and no guaranteed assistance; links to VSSN's existing support intake https://www.vetsupportnet.org/starttherapy.
- No query parameters or participant details are sent by the new navigation link; noreferrer suppresses browser referrer. VSSN receives ordinary connection metadata when visited.
- No new donation processor, wallet, payout, fee split or case database is introduced. Existing needs/sponsorship/payment routes require separate review to ensure VSSN-managed programming cannot collect elsewhere. Do not claim that enforcement is completed.

## Answers to Daisy's questions
### Navigation
I Need Help currently opens SafePlace search, not an automatic individualized request. Basic signed-in program-referral submission exists elsewhere; it does not prove staffed intake or accepted referral.
No live guiding agent or assigned navigator has been verified. Proposed automated role: explain public resources, assist search and prepare a minimal summary with consent. It must not decide clinical risk, approve assistance, promise availability or close cases independently.
VSSN's existing intake is the new handoff destination. Reception, staffing and acceptance must be confirmed with VSSN. Clicking a link does not establish receipt. VSSN should designate the case owner and backup and retain responsibility until another organization explicitly accepts a handoff.
Non-emergency 24–72-hour follow-up is Daisy's requested operational standard; no automatic timer or service-level commitment is claimed built.

### Resource provenance and verification
The October 28 Bible records 12 DFW listings and no California coverage. This is historical evidence, not a fresh count. OpenStreetMap ingestion code exists; the prior database audit found zero ingestion log rows. Actual per-listing origin must be inspected; do not assume all records came from OpenStreetMap.
Verification badges and correction controls exist. Source, dates, eligibility and responsible updater must be audited record by record. A current provider contact and verification owner are required for reliable connections.
NEEDS VERIFICATION, expiry rules and authorized VSSN editing permissions require verification or implementation. Unconfirmed listings must never be portrayed as guaranteed services.

### Identity and continuity
A referral record identifier exists, but a continuous participant/case reference across VSSN and providers is unverified.
Anonymous directory search and consented case intake must remain distinct. Do not identify anonymous browsers or infer consent from sign-in.
Proposed: one internal case ID; separate recipient-scoped referral references; a history of consent, assignment, acceptance, contact, outcome and closure. Restrict previous-case retrieval to authorized assigned staff.
Share only agreed contact details, requested assistance, necessary eligibility facts and explicit consent scope. No public case IDs, sensitive notes or global partner access.

### Security and privacy
The Bible identifies the existing SWADEBASE self-hosted backend, schema groundlift; frontend was documented as Lovable-hosted behind Cloudflare. This is not a verified complete processor inventory. Inspect runtime destinations, backups, logs, messaging, email, storage and AI providers.
HTTPS is observed for public links; database/disk/backup encryption and key management need scoped evidence. General platform documentation cannot certify GroundLift.
Partner roles/scoped API capabilities exist; least-privilege navigator/admin separation, record-access audit, export logging, Google account recovery and MFA need end-to-end validation.
Corrections, consent withdrawal, retention, deletion, backups, incident response and partnership termination require approved documented procedures and tested implementation. Withdrawal stops future optional sharing; retention and deletion exceptions must be handled under the approved policy.
No assertion is made that participant data is excluded from every external AI service today. Establish and test a default prohibition on sensitive-case transmission and training, with explicit approved exceptions and processor terms.
Urgent safety submissions require an approved human escalation procedure, monitored hours, safe contact preferences and emergency routing. General housing need is not automatically an emergency dispatch request. Do not represent a form or AI agent as monitored emergency response.
No HIPAA or other confidentiality compliance certification is claimed. Evaluate actual data, organizational roles, required agreements, access and incident obligations before sensitive-case use.
On partnership termination: revoke access/tokens, preserve audit/legal records, transfer only authorized records securely, reconcile open cases and agree deletion/retention responsibilities.

### Needs, offers and outcomes
Public need/offer routes exist. Their review queue, staff ownership, identity masking and delivery confirmation remain unverified.
Required flow: private submission -> authorized review -> verified supply/eligibility -> consented private match -> named coordinator -> delivery -> confirmation -> outcome.
If an offer is withdrawn, expire it, notify the coordinator through approved channels, reopen matching and keep the participant informed; never count a withdrawn offer as delivered assistance.
Count verified delivery separately from pledges, matches, referrals and self-reported outcomes. Track evidence source and date.
The requested VSSN dashboard should show unassigned requests, overdue follow-ups, expiring resources, pending offers, accepted referrals and confirmed outcomes with organization-scoped access. Not claimed built.

### Giving and receipts
Givebutter publicly supports automated donation confirmations and receipts. VSSN's campaign-specific settings, receipt entity/EIN, deductible portions and a real receipt journey remain to be checked by its authorized administrator. No charge was made to test.
GroundLift may measure aggregate cup selections, outbound donation clicks and share actions with appropriate privacy controls. A click is not a donation, and an opened share sheet is not proof of sharing.
Donor identity, payment records and receipts stay with VSSN/Givebutter unless an explicit authorized integration requires a minimal subset. No shared-donor import is introduced.

## Three walkthroughs
1. Emergency housing: person searches privately; provider availability must be checked directly. If requesting navigation, VSSN intake obtains consent, VSSN accepts and assigns the request, navigator confirms eligibility/availability, provider accepts the referral and follow-up records actual assistance or reassignment. Only search and an outbound intake link are prepared here; case tracking is pending.
2. Business offers 25 meals: verify business, quantity, pickup/distribution time, dietary and food-handling constraints. VSSN coordinator identifies appropriate consenting recipients without publishing identities, confirms distribution and records meals actually delivered. Pledge 25 is not delivery 25.
3. Pass the Cup: choose any cup, optionally donate on Givebutter, share and return. GroundLift's aggregate engagement stays separate from VSSN financial records. Donation receipt and donor administration belong to VSSN/Givebutter. No donation or sign-in is required for nonfinancial participation.

## Intended data flow
GroundLift anonymous directory [public resources; no case] -> VSSN intake [participant submits contact/need/consent directly] -> VSSN navigator [restricted assigned case] -> authorized provider [minimum referral data] -> outcome to responsible navigator [authorized summary].
This is the intended accountable workflow, not a currently verified cross-system integration.

## November 9 launch gate
Test Daisy Google login/roles and forwarding; all three homepage paths; six cups; two campaign links; anonymous search and VSSN intake handoff; mobile/keyboard/reduced-motion; consent/privacy notices; emergency information; admin record isolation; no unintended VSSN collection route.
Keep new sensitive-case collection, automatic sharing, payouts and guaranteed-response claims inactive until their safeguards and operational owners are approved and tested.
Preserve existing unrelated services. Do not submit real sensitive participant data in launch tests.

## Evidence, deployment and recovery
Read canonical SWADEBASE Bible, standing rules and GroundLift Bible on swadesoul. Source: swadesoul/groundlift-20df925d main b96bcbf74b935e28af4b0b328846142ea75a3ff3. Reviewed existing referral component/MCP references and route inventory. Reviewed VSSN's public campaign and support pages.
Existing deployment SSH key could not authenticate this repository. GitHub connector writes succeeded on the isolated branch. Full repository build and live publication not yet verified. Do not claim deployed or that all questions are resolved.
Before publication: verify current hosting owner/pipeline, required branding checks, CI/build and fresh/returning mobile/browser behavior. Respect /opt/swadebase/docs/DEPLOY_LOCK.md for any deploy/restart/config reload. No such operation was done in this change.
Rollback prepared source by reverting this PR if merged; no database migration or financial transaction to undo.
