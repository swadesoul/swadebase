# BYERS — Product Audit, Competitive Review and Build Blueprint
Prepared November 16, 2026 (America/Chicago). Owner working document.

## 1. What BYERS should become
BYERS should combine a civil-rights-focused legal workspace, current-law research, a human legal-team service, and a practical case-navigation system. Its core promise should be: understand the situation, organize the record, see what is missing, and prepare the next step with appropriate human review.

Priority practices: discrimination; hate crimes and bias incidents; LGBTQ+ rights; elder rights; exoneration/wrongful conviction; wrongful detention. These are distinct workflows, not six labels on the same generic chat.

Do not position software as a licensed lawyer, guarantee protection, imply a judge can be selected at will, or promise universal court/custody coverage. Research, court filings, legal opinions, attorney engagements and signed contracts have different authorization requirements.

## 2. Audit evidence and present state
Inspected the actual Sites project, its bound source at commit 8277c8a4eaa0f3b0979c7880978d2ddd1c0781a6, the public site, current SWADEBASE and Cochrane Site Bibles, standing rules, November 16 integration/watch designs, and existing SWADEBASE evidence, extraction and signing components.

The pre-change publication is a static browser demonstration, not a production legal AI platform. Its matters use sessionStorage; uploads retain document names and sizes; briefs are deterministic templates; research links open other websites; review approval is a local demonstration marker. The matter application had zero fetch calls to a case/research backend. There is no implemented server application in this Site source. The separate read-only oracle example is not legal research or physical-asset authentication. Its three existing data-validation tests passed.

SWADEBASE has reusable components: identity, PostgreSQL, encrypted private evidence storage, document extraction, native speech, Asset Review engagement/reviewer queues and exact-version release controls, and SWADE Sign. Their existence does not establish connection to BYERS.

Both swadesoul@gmail.com and [redacted-email] have confirmed identities in the existing authentication store. Danny also has an active pending Asset Review reviewer membership that is not yet bound through that application's verified sign-in. This is not an active BYERS superadmin grant. Preserve that reviewer role while adding separately scoped BYERS roles; do not overwrite it or grant global platform power by matching a display string.

This is an application/source/architecture audit and vendor-document comparison. It is not a penetration test, attorney opinion, or a hands-on benchmark of competitor accuracy.

## 3. Competitors and verified pricing
Prices observed November 16, 2026. Products, bundles, countries, user counts and contract terms differ; request comparable quotes before making savings claims.

| Product | Documented strength | Verified price position | Gap BYERS must close |
|---|---|---|---|
| Harvey | Matter spaces/memory, document vaults, agents, contract workflows, integrations, and Horizon Scanning | Official FAQ describes several hundred dollars per user/month on average; exact products/seats/term require a quote | Secure matters, source-grounded research, background work, review workflow and governance |
| CoCounsel / Westlaw | Research/drafting/document analysis backed by Westlaw/Practical Law; relevant plans include KeyCite | A specific in-house CoCounsel Legal offer advertises starting at $1,694.90/month. This is not a universal per-seat quote | Authoritative content, treatment checking, drafting quality and Word workflows |
| Lexis+ with Protégé | Lexis primary/secondary sources, Shepard's, drafting, private documents and DMS links | Customized by organization, features and licensed content | Verified authority, editorial content, citator and document integrations |
| Vincent by Clio (vLex) | Global legal database, cited research, jurisdiction comparisons and customizable workflows | No current standalone dollar price established from the reviewed official pages; obtain a quote. Clio's general starting price is not Vincent's price | International content depth, coverage transparency and professional workflow integration |
| Spellbook | Contract review/drafting, Word add-in, clause benchmarks, playbooks and multi-document work | Official pricing is custom by team members; no fixed dollar amount published on the reviewed pricing page | Native Word redlines, clause comparison, playbooks and negotiation history |
| Paxton | U.S. research, drafting, facts/timelines and evidence summaries; enterprise connectors | $499/user/month or $2,999/user/year paid annually; enterprise custom. Annual equivalent approximately $249.92/month | Accessible matter workflow, substantive research and evidence-linked drafting |

Harvey already markets regulatory horizon scanning, memory, intake and agents. Those are baseline competitive requirements, not features we can honestly claim it lacks. Its Horizon Scanning launch article describes early access; feature availability must be confirmed for an actual contract.

The stronger BYERS opportunity is a coherent civil-rights and justice workflow that connects local procedure, lawful case/custody records, public-defense navigation, contextual judge information and human review. These are proposed differentiation targets, not proof that every competitor lacks them.

## 4. Observed gaps and required fixes
Priority: P0 before real confidential client work; P1 before paid professional positioning; P2 after a bounded pilot.

| Priority | Gap | Concrete fix / evidence required |
|---|---|---|
| P0 | Browser-only matter records | Durable server-side matter storage; refresh/recovery/concurrency tests |
| P0 | No BYERS identity/role enforcement | Reuse verified identity; firm/matter roles, revocation, audit and tenant-bound access |
| P0 | Founders' product permissions unimplemented | BYERS superadmin grants for the two confirmed accounts; server-enforced exemptions before every charge/gate |
| P0 | No confidential file ingestion | Reuse encrypted originals, integrity hashes, malware/type/size checks and scoped downloads |
| P0 | Filename inventory is not document analysis | Real OCR/text extraction with page anchors, supported-format limits and failure states |
| P0 | No authorized research retrieval | Primary-source adapters, jurisdiction filters and source receipts |
| P0 | No current-treatment verification | Authorized citator or explicitly limited counsel-reviewed treatment checks; citation matching alone is insufficient |
| P0 | No legal effective-date model | Version statutes/rules, commencement, repeal, amendments, stays and historical applicability |
| P0 | No automatic Law Watch | Source registry, scheduler, hashing/diffs, change classification, monitoring receipts and outage alerts |
| P0 | No production attorney review | Verified reviewer, engagement/conflict/jurisdiction checks, exact draft digest and invalidation after edits |
| P0 | No secure client release | Immutable approved report versions, recipient access checks and auditable release |
| P0 | No private/shared memory separation | Public authority, firm playbooks, matter evidence and lessons in separate permission scopes |
| P0 | No retention/consent program | Matter-level consent, retention/deletion/legal-hold controls and access revocation |
| P0 | Legal-team governance undefined | Verify licenses, geography, permitted paralegal scope, supervision, engagements and professional-service contracts |
| P0 | No high-risk fail-safe | Unknown/stale source blocks reliance and escalates; do not invent an answer or silently modify customer terms |
| P1 | Drafting lacks substantive AI and citations | Evidence-grounded document builder with supported templates, citation/quotation checks and opposing analysis |
| P1 | No document-quality workflow | DOCX/PDF export, native revision history, tracked changes, reusable templates and accessible formatting |
| P1 | No verified deadlines | Court/rule/calendar sources, service method, holidays, time zones and attorney confirmation; no unchecked countdown |
| P1 | U.S.-state-only intake structure | Country → state/province → county/locality → court/district, plus matter date and governing law |
| P1 | No case-number connector | Court-qualified identifiers, exact matching, docket events, documents and current verification receipts |
| P1 | No custody connector | Separate federal/state/county/immigration providers; source-specific identity and update checks |
| P1 | No professional directory | Verified office/attorney identity, service area, availability, license and correction workflow |
| P1 | No contextual judge database | Stable people/position IDs, current and former terms, assignments, official updates and coverage status |
| P1 | No reviewed outcome analytics | Defined denominators, case-type filters, missing-data disclosure and human-audited outcome coding |
| P1 | No CMS | Draft/review/publish states, translations, source expiry, version rollback and scoped editor roles |
| P1 | No credit ledger | Transactional reserve/capture/refund ledger, usage quotes, caps, idempotency and signed payment events |
| P1 | No plan gifting | Audited product-scoped grants with expiry, reason, issuer and revocation; no cash-out |
| P1 | No dependable voice backend | Connect approved SWADEBASE speech behind server authorization; no browser-exposed provider keys |
| P1 | No quality evaluation program | Counsel-authored test set by practice/jurisdiction; measure retrieval, quotations, treatment, abstention and privacy |
| P1 | Pricing is uncosted | Benchmark OCR/storage/inference/licensing/support and actual professional-service costs before checkout |
| P2 | Limited professional integrations | Prioritize DOCX/Word and one existing DMS/mail route, then calendar/e-filing where authorized |
| P2 | No production recovery proof | Restore drills, backups, operational alerts, logs, cost limits and incident response |
| P2 | Unverified accessibility/device flows | Keyboard/screen reader, contrast, reduced motion, large touch targets and real iPad Safari/mic testing |
| P2 | Brand/legal identity cleanup | BYERS product branding; confirm legal operator and trademarks with counsel. A UI rename is not a company-registration amendment |

## 5. Global Legal Watch: how it should work
Use the existing SWADEBASE scheduler and data/approval stack. No duplicate global database, paid feed purchase or model-training service is needed for the initial pilot.

1. Register a jurisdiction pack: actual government/court authority, geographic extent, topics, source URL, retrieval/license terms, document types, freshness goal and known exclusions.
2. Fetch permitted official feeds/APIs/documents on a bounded schedule. Use conditional requests and content hashes; unchanged documents should not trigger LLM work.
3. Store an immutable source snapshot or permitted reference, document identifier, publication/update dates, effective dates, checked time, language, hash and source status.
4. Distinguish proposed bills, enacted acts, regulations, guidance, judgments and administrative notices. A detected text change is not automatically a legal change.
5. Determine what changed, when it applies and which provisions it affects. Track repeal, supersession, future commencement, court stays and appeals separately.
6. Map the change to affected matters, policies, business entities and sites. Produce precise proposed wording and operational tasks, not just a generic alert.
7. Update the internal legal index automatically after provenance checks. Keep disputed/unknown material flagged. Never silently rewrite signed agreements or publish live policies.
8. Route material legal conclusions to appropriately qualified counsel and live-publication actions to the owner. Store exact approved versions and approval receipts.
9. Show a coverage dashboard: watched/current, late, blocked, license-limited, manual review, or not covered. A green light means specified checks passed, not complete legal compliance.

Suggested pilot scope: U.S. federal plus actual operating/matter jurisdictions, initially bounded state/local packs; then U.K. and EU sources, with national/local sources added explicitly. EU law does not replace national law. Do not call a country-wide feed complete municipal coverage.

Official examples explain why freshness needs more than a timestamp: UK XML can contain unapplied amendments; EUR-Lex consolidated texts are documentation rather than legally effective originals. Texas statutes, administrative rules and court rules are separate source families. NC publishes county/court-specific local rules. A source that cannot be reached remains unknown.

For memory: preserve the public authority's versions and valid-from/valid-to dates. Keep private matter evidence isolated. Store retrieval and permission metadata, not an unsupported claim that the model has learned every law.

## 6. Case Navigator: case number to next-step preparation
Required identification: country, state/province, county/district, exact court, case number and year. Case numbers are not globally unique. Confirm the correct person and case before importing or exposing records.

Workflow:
- User identifies their role and lawful authorization.
- Find the case through an approved official source or licensed provider.
- Show the proposed match for confirmation; never merge solely by name.
- Build a source-linked docket timeline, charges as alleged, filing dates, motions, orders, counsel and hearings.
- Identify missing charging documents, service dates, orders and procedural information.
- Prepare a plain-language status summary, questions for counsel and a draft task list; legal conclusions and deadlines require appropriate review.
- Preserve document versions, source receipts and the last successful check.
- Never label charges as convictions or a missing docket result as a clean record.

What to bring: charging document or complaint; arrest/citation records if available; latest court order; upcoming hearing notice; bond/custody paperwork; existing counsel details; relevant correspondence; previous filings; evidence inventory and chronology. Do not request unnecessary SSNs, passwords or private portal credentials.

Custody is a separate query. Federal BOP records, state corrections, county sheriff booking systems and immigration detention systems have different coverage. Court records may not show the current facility. BOP itself warns release dates can be stale and absence from BOP custody does not exclude custody elsewhere. Use exact available identifiers, source time and a confirmed/possible/unknown result; no universal people-tracking claim.

PACER may charge for searches and documents. Add no charge-bearing retrieval without a quoted budget and authorization. Sealed, juvenile, restricted and otherwise unavailable records must remain unavailable unless an authorized lawful route exists.

## 7. Judicial Intelligence and former judges
Competitors already exist: Lex Machina and Trellis document judge profiles and ruling/outcome analytics. Lex Machina's published coverage excludes criminal cases; that is a potential gap for our justice-focused product, subject to obtaining lawful, sufficiently complete criminal data.

Maintain a person record separately from positions/terms:
- Stable judge ID, name/aliases, court IDs and source references.
- Appointment/election/retention route, term dates, office start date and status.
- Current, senior, retired, resigned, former, deceased or unknown, as supported.
- Former terms stay searchable with effective dates; a successor creates a new position relationship rather than overwriting history.
- Official roster, judicial commission/governor, legislature confirmation and election-results sources as applicable.
- Election win date and actual assumption of office are different events. Article III federal judges are appointed rather than elected.
- Assigned judge must come from an actual case record/order; local roster membership is not assignment proof.

Useful metrics: motion-type grant/deny/partial rates, case duration, hearing milestones, bench/jury dispositions, bail/pretrial outcomes where legally and reliably available, and appeal outcomes. Define the denominator, date range, case mix, exclusions and sample size; suppress or label insufficient samples. A jury verdict or prosecutor charging decision must not be described as the judge's personal conviction decision. Reversal rate alone is not a quality score.

Use transparent source coverage and verified professional records. Keep client-experience reviews separate from adjudicated disciplinary findings. Moderate allegations, provide correction/response channels, and do not publish private addresses or unsubstantiated claims of bias.

Freshness example: the FJC biographical directory currently says updates are paused and data are current only through October 23, 2026. It can seed historical federal records, but must not be the sole current-judge monitor.

## 8. GitHub components worth assessing
| Component | What it supplies | What it does not supply |
|---|---|---|
| Free Law Project CourtListener | People, court positions, opinions, dockets and citation relationships | Complete state/local/criminal coverage or a complete judge-rating product |
| CourtListener API client / MCP | A smaller integration route to people, positions, opinions and dockets | Automatic free commercial data entitlement, unrestricted provider access or permission to expose private cases |
| eyecite | Citation extraction and normalization; repository describes a permissive BSD license | Current-treatment certification, merits analysis or a replacement for Shepard's/KeyCite |
| Existing SWADEBASE extraction/approval/signing | Private evidence handling, versioned approval, signatures and operational reuse | A connected BYERS production backend by mere reuse planning |

CourtListener's full platform is AGPL-3.0-only. Review the exact selected release and deployment obligations before copying/modifying it. A lightweight approved API adapter may fit better than deploying a second platform. Provider API/bulk/webhook access can depend on commercial agreements or memberships. No purchase or new dependency installation was made for this research.

Juriscraper and courts-db are additional candidates for exact-version license and coverage review; do not call them installed or verified end-to-end.

## 9. Defense Navigator and professional reviews
Charge for research, organization and explanation, not access to government-appointed counsel. Keep official application routes and urgent-help information publicly accessible.

A useful paid report can include confirmed office/court service area, official contact, appointment/application process, current license/discipline references, documented practice experience, published case involvement, and contextual outcomes with dates/sources. Public defender assignment or availability must not be promised.

For case outcomes, distinguish dismissal, acquittal, plea, conviction, diversion, partial relief, appeal and exoneration. Show whether the attorney actually handled the relevant stage, incomplete records, case complexity and observation period. A plea is not automatically poor representation. Do not invent win rates, imply an office-wide outcome measures an individual attorney, or hide the denominator.

Reviews need an actual-client/engagement verification process, consent, moderation, conflict/sponsorship labels and a correction/appeal route. Do not expose clients' case details to verify a public review. Sponsored placements must not change research findings or imply better outcomes.

## 10. The human legal team
| Role | Appropriate service design | Required gate |
|---|---|---|
| AI assistant | Organize, retrieve, draft, compare and surface missing facts with sources | Task scope, privacy, source checks and human review where needed |
| Paralegal / legal assistant | Chronologies, document preparation, administrative support and permitted research | Verified identity, lawful scope and appropriate attorney supervision |
| Licensed attorney | Legal advice, strategy, approved legal documents and representation | License/jurisdiction, conflicts, scope, availability and accepted engagement |
| Public defender / legal aid navigator | Locate official offices, explain application routes and prepare research | No promise of eligibility, appointment, choice or representation |
| Specialist counsel | Civil rights, elder issues, post-conviction, criminal defense, immigration or cross-border law | Appropriate expertise and jurisdiction; Danny is not assumed licensed worldwide |

ABA Formal Opinion 512 discusses competence, confidentiality, review and fees for lawyers using generative AI. Applicable local professional rules govern implementation. Counsel must review professional-service contracting, referrals, fee sharing and advertising before launch.

## 11. Recommended prices — proposed, not active offers
Use a low-cost public entry without forcing a stressed visitor into a recurring subscription.

| Offering | Suggested software/research price | Scope |
|---|---:|---|
| Public education | Free | Plain-language guides, official help routes and coverage explanations |
| One-matter preparation pass | $29 one time | Bounded self-service fact organization and an export; no attorney service or guaranteed live records |
| Legal Desk | $99/user/month | Secure intake, document organization and bounded draft preparation once connected |
| Counsel Pro | $249/user/month | Source-grounded research/drafting, reusable templates and defined usage |
| Firm | $999/month, five seats | Shared private matters, team roles, pooled allowance and approval workflows |
| Scoped Law Watch | From $299/organization/month | Named topics/jurisdictions/sources, defined freshness and review workflow—not all global law |
| Defense/Judge research packet | From $49 per scoped packet | Source-backed curation for a named court/area; only where sufficient lawful data exist |
| White label / institutional | From $2,500/month plus setup quoted separately | Tenant isolation, branding, permissions, integration and a support agreement after production readiness |
| Danny's project review | Previously proposed $500/project | Separate, explicitly bounded engagement and availability; not full representation or every kind of case |

These are positioning recommendations, not validated production economics or contracted professional rates. Licensed content, paid court retrieval, exceptional OCR/inference and human services require explicit scope/allowances. Avoid unlimited global research and bundled unlimited attorney time. Do not sell unfinished integrations as working services.

At an 80% software contribution-margin target, variable delivery-cost ceilings are $19.80 for $99, $49.80 for $249, and $199.80 for $999. Include allocated compute, storage, retrieval/licensing, support, processing/refunds and third-party charges. If licensed research alone exceeds a tier budget, change the tier, obtain a permitted client-owned license, or exclude that content. A client's subscription is not automatically an API/redistribution license.

## 12. Credit system and founder controls
Recommended initial planning structure: Legal Desk 500 processing credits/month; Counsel Pro 2,000; Firm 10,000 pooled. Validate quotas against a real measured task set before launch. Credits are internal, non-transferable software usage units, not money, tokens or legal-service retainers.

Proposed task examples: quick grounded query 2 credits; extract an additional 10 pages 3 credits; review up to 25 parsed pages 12 credits; prepare a bounded first draft 25 credits; expanded research brief 60 credits with a preflight estimate. These are proposed task units, not tested rates or a promise of arbitrary document length/quality. Long documents need page/token bounds and explicit continuation approval.

Top-up positioning: 250 credits/$25, 1,000/$90, 5,000/$400. Offer clear previews and no automatic top-up by default. Let the user add documents to an existing matter without purchasing another matter; charge only for new processing. Exact duplicate files and cached unchanged sources should not be reprocessed at full cost. Keep originals and permit download when a processing balance is exhausted, subject to disclosed retention terms.

Ledger: immutable grant/reserve/capture/refund/expiry events; unique task idempotency; a transactional balance; concurrent-request tests; stale reservation cleanup; no debit for a failed or empty retrieval; cost caps and per-matter usage receipts. Never trust a browser-supplied balance or payment success page. Plan fulfillment uses verified, replay-safe payment events.

Monthly allowance could roll forward up to one extra month's allowance; purchased credits could last 12 months, subject to counsel-approved consumer terms and jurisdiction rules. Show expiry before purchase. Gifted grants need reason, issuer, recipient, scope, expiry and revocation history; they are not cash transfers.

Owner-directed target roles: swadesoul@gmail.com and [redacted-email] are BYERS superadmins and payment-exempt once product roles are wired. Every server-side gate must check the exemption first and log exempt/$0. They can manage plans, credits, grants, CMS and scoped staff roles. Preserve matter ethical walls and separately assigned attorney authority. Exemption does not remove real vendor spending caps or confer global ecosystem privileges.

## 13. CMS and calm user experience
CMS sections: public pages; EN/ES/FR translations; source/jurisdiction registry; legal guides; reviewed templates; provider/judge professional profiles; service catalog; prices/allowances; coupons/gifts; alerts; versions; audit and correction queue. Editors draft, reviewers approve, publishers publish; signed terms are immutable historical versions. No general-purpose arbitrary-script editor.

The user journey should start with: What do you need help with? Then choose the issue, gather what you know, and prepare the next step. Use large touch targets, a single primary action, plain language, save/resume once secure storage exists, optional voice, clear status and readable exports. Technical/legal detail belongs in expandable evidence/source views. Give a professional view without making everyone navigate a law-firm dashboard.

No implied live monitoring: show current verified coverage, last check, unavailable records and unverified items. Avoid countdowns, predicted odds, intimidating dashboards and false reassurance.

## 14. Voice orb
Approved design: charcoal disc, champagne-gold edge, ASK BYERS centered, a restrained gold pulse while speaking, a distinct listening state, reduced-motion support, keyboard/text alternative and an obvious stop control.

The initial web guide can provide deterministic navigation/preparation help. Production legal voice needs server-authorized SWADEBASE speech/research, explicit mic/provider consent, transcript review, bounded retention and no hidden recording. Browser speech recognition may send audio to its provider and is not supported everywhere. Do not expose native voice tokens in the browser or pretend a browser guide is a live legal-research agent.

## 15. Build order and acceptance gates
1. Ship the BYERS identity and calm rights-focused product preview; preserve existing working flows and the current domain.
2. Connect verified identity, the two scoped superadmins, durable encrypted matters and consent. Demonstrate cross-tenant denial, revocation, founder exemptions and recovery.
3. Add extraction and evidence-grounded drafting with counsel-reviewed examples, exact-version approvals and client release.
4. Launch one verified local/federal research pack and watch source. Demonstrate proposed/enacted/effective/stale/repealed distinctions and no silent policy publication.
5. Add one court-qualified docket source and one custody provider with confirmed/possible/unknown matching. Quote any retrieval cost first.
6. Add official judge/defender records with history and contextual outcomes; seed only verified data, never fake profiles/metrics.
7. Activate metered plans, grants and professional-service booking after concurrency/refund/payment tests and counsel-approved terms.
8. Expand jurisdictions and languages with visible coverage, licensed sources and reviewers. Benchmark against competitor workflows using the same permitted inputs.

## 16. Official research references
- Harvey features/pricing: https://help.harvey.ai/articles/harvey-faq
- Harvey Horizon Scanning: https://www.harvey.ai/blog/horizon-scanning-in-harvey
- Harvey memory/spaces: https://www.harvey.ai/blog/introducing-harvey-ii
- Harvey Vault: https://www.harvey.ai/platform/vault
- Harvey security: https://www.harvey.ai/security
- CoCounsel in-house offer: https://legal.thomsonreuters.com/en/c/compare-cocounsel-plans-for-your-legal-team
- Westlaw/CoCounsel plan capabilities: https://sales.legalsolutions.thomsonreuters.com/en-us/products/cocounsel-legal/300/plans-pricing
- Lexis+ with Protégé: https://www.lexisnexis.com/en-us/products/lexis-plus-protege.page
- Lexis pricing approach: https://www.lexisnexis.com/en-us/solutions/ai.page
- Vincent: https://vlex.com/vincent-ai
- Vincent in Word: https://help.clio.com/hc/en-us/articles/49815360439835-Clio-for-Word-and-Vincent
- Spellbook pricing: https://spellbook.com/pricing
- Paxton pricing: https://www.paxton.ai/pricing
- Lex Machina judge analytics: https://help.lexmachina.com/hc/en-us/articles/56318020708635-Getting-to-Know-Judges-in-Lex-Machina
- Lex Machina coverage: https://help.lexmachina.com/hc/en-us/articles/13449740222875-Coverage-Summary
- Trellis judge analytics: https://trellis.law/judge-analytics
- FJC directory and update warning: https://www.fjc.gov/history/judges
- Federal judge appointment types: https://www.uscourts.gov/about-federal-courts/types-federal-judges
- CourtListener: https://github.com/freelawproject/courtlistener
- CourtListener API client: https://github.com/freelawproject/courtlistener-api-client
- API access terms/context: https://wiki.free.law/c/courtlistener/help/api
- eyecite: https://github.com/freelawproject/eyecite
- Federal case access: https://www.uscourts.gov/court-records/find-a-case-pacer
- PACER fees: https://www.pacer.uscourts.gov/pacer-pricing-how-fees-work
- PACER unavailable/sealed records: https://pacer.uscourts.gov/help/faqs/what-information-available-through-pacer
- BOP custody and freshness limits: https://www.bop.gov/inmateloc/
- Tarrant County custody source example: https://inmatesearch.tarrantcounty.com/
- Public-defense appointment: https://www.uscourts.gov/about-federal-courts/defender-services
- Financial eligibility: https://www.uscourts.gov/forms-rules/forms/financial-affidavit
- ABA AI ethics: https://www.americanbar.org/content/dam/aba/administrative/professional_responsibility/ethics-opinions/aba-formal-opinion-512.pdf
- EEOC intake: https://www.eeoc.gov/how-file-charge-employment-discrimination
- EEOC deadlines: https://www.eeoc.gov/time-limits-filing-charge
- DOJ hate crime/incident information: https://www.justice.gov/hatecrimes/report-a-hate-crime
- DOJ elder support: https://www.justice.gov/elderjustice/find-help-or-report-abuse
- NIJ wrongful convictions: https://nij.ojp.gov/topics/justice-system-reform/wrongful-convictions
- NC local rules: https://www.nccourts.gov/documents/local-rules-and-forms
- Texas statutes source scope: https://statutes.capitol.texas.gov/information/
- Texas court rules: https://www.txcourts.gov/rules-forms/rules-standards
- Congress API: https://api.congress.gov/
- UK legislative XML/status: https://www.legislation.gov.uk/developer/formats/xml
- EUR-Lex consolidation limits: https://eur-lex.europa.eu/collection/eu-law/consleg.html?locale=en
- Browser recognition privacy/availability: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition

All future implementation claims require production evidence. This document records findings, scope and recommended economics; it does not activate a legal service, watch job, paid plan, account grant, professional referral or records purchase.

## 17. Criminal-defense layer — added November 16
Criminal defense is a dedicated seventh preparation path alongside the six civil-rights/justice areas. The current interface organizes questions and records; it is not a staffed criminal-defense practice.

The production workflow should cover investigation/arrest; complaint/information/indictment; counsel and custody/bond; initial appearance/arraignment; discovery and evidentiary challenges; counsel-reviewed motions; plea/trial preparation; sentencing; appeal/post-conviction; and documented collateral issues where relevant. Preserve federal, state, local, juvenile and immigration distinctions. Do not automatically recommend a plea, predict guilt or treat every stage as applicable to every case.

For each case collect jurisdiction/court, case identifier, charging document and alleged counts, known custody/bond conditions, counsel, hearing notices, orders, discovery inventory and procedural stage. Link each extracted claim to a page/source. Keep allegations, findings, verdicts and final judgments separate.

Initial official research references:
- Federal process: https://www.uscourts.gov/about-federal-courts/types-cases/criminal-cases
- Official rules portal: https://www.uscourts.gov/forms-rules/current-rules-practice-procedure/federal-rules-criminal-procedure
- Linked federal rules document: https://www.uscourts.gov/sites/default/files/document/federal-rules-of-criminal-procedure.pdf
- Northern District of Texas process outline: https://www.txnd.uscourts.gov/node/10649
- Texas criminal procedure: https://statutes.capitol.texas.gov/GetStatute.aspx?Code=CR&Value=1.01
- North Carolina criminal guide: https://www.nccourts.gov/help-topics/criminal-law/criminal-cases
- Nevada Title14: https://www.leg.state.nv.us/Division/Legal/LawLibrary/NRS/index.html
- Oklahoma Title22: https://www.oscn.net/applications/oscn/index.asp?ftdb=STOKST22&level=1
- Wyoming criminal rules and amendment orders: https://www.wyocourts.gov/court-rules/wyoming-rules-of-criminal-procedure/

These are initial source packs, not complete jurisdictional research or a claim that the full texts have been ingested and kept current. The federal portal's descriptive amendment date must be checked against its actual linked rulebook and later orders. Wyoming's page separately lists signed and effective dates, demonstrating why both belong in Law Watch.

## 18. Everyday legal needs and homeowners — current-demand research
Evidence supports prioritizing housing and financial problems. LSC's 2025 grantee data, released July29,2026, says housing accounted for35.7% of closed cases, consumer/finance cases increased13.7%, and domestic-violence-related cases increased5.4%. These are low-income civil legal-aid caseloads, not a ranking of every American's legal needs.
Source: https://www.lsc.gov/press-release/new-lsc-report-shows-rise-cases-involving-domestic-violence-growing-demand-financial-and-consumer

CFPB's 2025 report, published March31,2026, separately documents substantial consumer-reporting complaints and other financial disputes. Complaint volume is not a count of unique victims or confirmed legal violations.
Source: https://www.consumerfinance.gov/data-research/research-reports/2025-consumer-response-annual-report/

Recommended product priorities, based on those signals plus the founder's intended users:
| Priority cluster | Problems to organize | Useful BYERS deliverable |
|---|---|---|
| Homeowners and housing | Foreclosure/notices, mortgage servicing, HOA disputes, insurance denials/nonrenewal, contractor problems, property/title issues, eviction and repair disputes | Notice/document timeline, policy/contract clause comparison, evidence checklist and correct agency/counsel route |
| Debt, credit and scams | Debt collection, credit-report disputes, identity theft, repossession and financial fraud | Dispute chronology, alleged errors and supporting records, source-linked complaint preparation |
| Family safety and care | Protective orders, domestic violence, custody/support, elder exploitation and caregiving authority | Safety-sensitive intake, authorized contacts, document checklist and qualified local support |
| Criminal defense and civil rights | Charges/custody, discrimination, bias incidents, exoneration and wrongful detention | Case/readiness packet and licensed specialist review |
| Employment | Wage, discrimination, retaliation, termination and benefits disputes | Employment chronology, relevant notices/policies, questions and filing-route review |
| Benefits and healthcare | Benefit notices, denials, appeals and administrative deadlines | Notice extraction and a review task list; no automatic eligibility decision |
| Probate and inheritance | Authority to act, estates, ownership records and disputed documents | Document inventory, missing authority checklist and local counsel preparation |
| Small-business/legal documents | Vendor/customer contracts, payment disputes, licensing and IP | Reviewed templates, issue lists, redlines and approved correspondence |

Homeowners must have subroutes because the responsible body varies. NAIC identifies insurance complaint categories and state insurance departments. Texas insurance guidance distinguishes insurers/adjusters from contractors, roofers and mortgage servicers. A single generic complaint destination would misroute users.
- https://content.naic.org/consumer/how-to-file-complaint
- https://content.naic.org/article/how-do-i-file-complaint-against-my-insurance-company
- https://agate.tdi.texas.gov/consumer/homeowners-renters-insurance-complaint.html

Suggested calm entry choices: My home or housing; My money or debt; My work or benefits; My family or care; A criminal case or my rights; A business or document. Keep specialty paths and professional tools underneath this shared intake/research/review backbone, rather than building isolated applications.

For urgent notices, present the source date, hearing/response information, known gaps and appropriate human/official help. Do not promise that an AI draft stops eviction, foreclosure, arrest or a legal deadline. Keep basic official help routes accessible without a subscription.

## 19. Midterms, government changes and the lawyer-up reference
The November5,2026 PBS interview with Representative Robert Garcia identifies the election-night lawyer-up statement in the context of planned congressional oversight. It is not a general requirement that every citizen hire a lawyer.
Source: https://www.pbs.org/video/rep-garcia-democrats-have-mandate-to-pursue-accountability-1793922249/

Product inference: add a nonpartisan Government Notice & Rights route for people who actually receive a subpoena, agency notice, benefits change, immigration/custody notice, employment or civil-rights issue. Organize the actual document, issuing body, service/receipt date, jurisdiction, response terms, records-preservation needs and qualified reviewer. Do not generate advice from party affiliation or political headlines.

Law Watch must distinguish an election result, announced policy, introduced bill, enacted law, implementing rule, effective date and court order/stay. Changes in congressional membership do not themselves amend statutes. Any political-development summary should link the actual measure/order and show what is operative, proposed, blocked or unknown.

BYERS can provide accessible legal preparation and appropriate human escalation. Market that tangible service, rather than promising to replace licensed representation or protect every person from every change.
