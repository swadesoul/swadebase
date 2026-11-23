# BYERS as SWADEBASE legal assurance layer — founder directive
Date: 2026-11-16. State: FOUNDER POLICY / INTEGRATION DESIGN, NOT DEPLOYED.

## Objective
Integrate the EXISTING BYERS product as the reusable legal-assurance capability inside SWADEBASE. Keep its separately branded customer frontend/domain; migrate only after full source, auth, records and rollback review. Do not create a duplicate legal product or database. This directive covers SWADEBASE-controlled workflows, not all conversations in ChatGPT or unrelated third-party systems.

## Reuse inventory
- BYERS sample: site-bibles/Cochrane_Master_Site_Bible.md. Public Sites domain in 2026-10-27 record: cochranailaw.live (not cochraneailaw.live). Production legal backend and client identity pending.
- Existing SWADEBASE Asset Review: /opt/swadebase-adapters/asset-review. Has encrypted B2 evidence, scoped case permissions, exact-version lawyer approval, and reports. Avoid treating its attorney queue as confirmed attorney engagement.
- SWADE Sign / Labs shared trust adapter: exact-version signatures, consent and approval evidence; reuse.
- Existing legal package: docs/legal/README.md, terms/privacy/product terms on nine sites as of Oct 30; six additional site deployments then pending; legal@brainiak.live mailbox. Verify current state before reuse.
- On Your Terms: existing product identified for potential SWADEBASE migration in docs/legal/README.md; inspect its authoritative project and source before choosing a policy-drafting implementation.
- Existing MCP owner approval workflow and capability registry; preserve boundaries.

## Proposed review trigger
Preflight via authenticated, server-to-server event on: site launch/major feature release; changes to ToS, privacy, pricing, payments, refunds, subscriptions, marketing/advertising, AI/voice cloning, music rights/licensing, employment, fundraising, financial assets, credit/debt services, charity, regulated data, customer disputes, contracts, IP and cross-border data flows. Routine low-risk operations run a lightweight cached policy check instead of a paid LLM review. Do not send every prompt or confidential matter into a shared model.

## Required contract
legal.review.request: {operation_id, site_id, actor_id, tenant_id, workflow_type, jurisdiction[], change_digest, policy_version, redacted_facts, data_classification, cost_budget, requested_action}
legal.review.response: {review_id, status: pass|needs_changes|counsel_required|blocked|unknown, findings[], source_links[], source_checked_at, risk_level, suggested_draft_changes[], version_digest, assigned_reviewer, expiry}.
Create explicit client/matter consents; PII and privileged evidence held privately with ethics wall and per-matter roles. Never infer representation or privilege from mere use.

## Approval/enforcement
Automatic: checklist, citation-grounded analysis, document diff drafting, detection of missing policies, dependency checks, assign issue, suggest PR, rollback proposal.
Requires authorized owner approval: merge, publish, deploy, modify live agreements, send communications, adjust payment rules, data sharing or third-party integrations.
Requires appropriately licensed counsel sign-off: personalized legal conclusions, court filings, regulated advice, material contracts/rights, high-risk jurisdictional assessments. Never silently edit signed contracts or retroactively alter consent terms.
Unknown or unreachable BYERS: high-risk release fails closed to review queue; existing live services remain operational; no unapproved destructive rollback.
Audit: immutable request+response digests, exact legal source/date, policy snapshot, reviewer identity, consent and owner approval receipts; retention and deletion rules by matter/jurisdiction.
Human ownership, attorney-client engagement and conflict screening before attorney workflow.

## Execution stages and validation
1. Inventory BYERS Sites source, existing On Your Terms and Asset Review components and live dependencies; determine legal entity and correct domain via authoritative company records. No assumption of legal-service authorization.
2. Implement additive scoped adapter with authenticated endpoint, tenant isolation, deterministic rules first, redaction, idempotency, bounded inference and audit.
3. Integrate BYERS frontend with SWADEBASE sign-in, private evidence storage, legal dashboard; retain current frontend until migration passes equivalence tests.
4. Wire deployment/contract/payment/product triggers individually behind feature flags; start report-only, then approvals, then gated enforcement.
5. Test cross-tenant isolation, confidentiality, blocked high-risk release, stale law, bad citations, no-counsel state, approval replay, site rollback and no unexpected LLM charges.
6. Deploy only after verification, record production receipts, update both Site Bibles and What's New.

## State
No code, DNS, deployments, contracts, financial transfers, attorney invitations, real user data or legal-policy publications were changed by this directive. No assurance of automatic legal compliance.