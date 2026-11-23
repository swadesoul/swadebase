# BYERS Global Law Watch Agent — SWADEBASE
Date: 2026-11-16. State: founder-approved design, monitoring NOT DEPLOYED.

Mission: monitor official laws, regulations, court developments and agency guidance relevant to each SWADEBASE business and operating jurisdiction. Global coverage is incremental; never represent partial coverage as all laws worldwide.

Loop: (1) inventory verified official sources per jurisdiction, authority and topic; (2) track proposals separately from enacted law, regulation, guidance and case law; (3) record effective dates, transitional requirements, amendment/repeal status, source URL, content hash and last verification; (4) compare with prior revisions; (5) map each verified change to products, entities, jurisdictions and data; (6) draft precise terms/privacy/consent/marketing/contract diffs, operational actions and lawful revenue opportunities; (7) send in-app risk alerts and source links to BYERS and SSS Brain/Chief of Staff; (8) recheck before material launches.

Automation boundary: the agent may update the internal research index, change-watch records, source citations, draft queue and proposed wording. It must NOT silently publish terms or privacy notices, change existing signed contracts, deploy code, send notifications to customers, alter financial terms or disable consumer rights. Owner approval is required for execution, and qualified counsel is required where legal advice or material regulated judgment is involved. Never infer attorney representation, privilege or signoff.

Source priority: US Federal Register, Congress.gov, official U.S. Code and relevant FTC/CFPB/Copyright Office/SEC sources; then state legislatures and agencies where sites operate; EUR-Lex/EDPB for EU-facing operations; additional official primary sources for actual markets. Licensing and multilingual translation require verification. Court rulings need jurisdiction and precedential status checking.

Reuse: SWADEBASE PostgreSQL, adapter registry, secured identity and permissions, encrypted Backblaze, existing legal templates, SWADE Sign, Asset Review attorney review, existing MCP founder approval, Chief of Staff notifications, and On Your Terms if validated. No new paid providers. Use cached rules/feeds and bounded inference.

Review fields: source authority, URL, jurisdiction, type (proposal/enacted/regulation/guidance/judgment), effective date, supersession, verification time, affected sites, policy version, risk priority, exact draft diff, reviewer status, consent records, approval ID and audit log. Include coverage gaps and unknown status. Tenant/customer data must be isolated.

UI goal: featured BYERS Legal Protection Center page with Ask BYERS, Law Watch, Policies, Agreements, Risk Queue, Revenue Opportunities, and Audit. First local question preparation is not a live AI consultation.

Test criteria: synthetic enacted vs proposed law, repealed law, conflicting sources, inaccessible source, effective date, jurisdiction mapping, tenant boundaries, missing counsel, approval replay, no silent publish, bounded cost and source provenance.

Current implementation: interface draft exists; official-source ingestion, automatic revision queue and attorney workflow integration are not yet deployed. Read COCHRANE_LEGAL_LAYER_INTEGRATION_20261116.md and affected site Bibles before integration.