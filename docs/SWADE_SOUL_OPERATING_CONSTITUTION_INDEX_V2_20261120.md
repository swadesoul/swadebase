# SWADE Soul Operating Constitution and Site Bible Index — v2
Status: STRUCTURE APPROVED BY FOUNDER; documented only, deployment and provider purchase automation not verified.
Effective: 2026-11-20 America/Chicago
DO NOT replace the existing ~1,864-line SWADEBASE Master Site Bible with a summary. Preserve its dated releases, historical evidence, rollback notes and Site Bibles. This document is a NEW navigational front door and operating architecture; original canonical evidence remains under site-bibles.

## A. Corporate hierarchy (not a new corporation)
1. **SWADE SOUL**: umbrella company and business owner. Holds original product IP/brands, defines licensing policies, signs agreements via authorized entities, oversees sales, partners and standards.
2. **SWADEBASE** (swadebase.cloud): central control plane and sole authoritative shared catalog of sites, adapters, license lineage, approved capabilities, permissions, entitlements, price versions, operational and audit evidence; no duplicate foundational databases.
3. **SSS BRAIN** (sssbrain.live): personal voice/text operator and knowledge companion for interacting with SWADEBASE. Explains, plans, retrieves, proposes, waits for required authorization, dispatches only through approved typed connections and reports verified results. Not an unrestricted root or financial executor.
4. **ORIGINAL PRODUCTS** (e.g. GhostRep, Maestro Radio, ReSingLab, SWAGENTS): product-level operational and support owners. Parent dashboards show license portfolio metrics from SWADEBASE, not unrestricted raw tenant data.
5. **CUSTOMER WHITE LABELS**: branded, independently hosted licensee instances derived from approved original product, with customer-scoped CMS/admin, COS onboarding, applicable features and signed update channel.

## B. Single registry record for every connection
Required fields: connection_id, name, provider/product, company_legal_owner, connected_site_ids, purpose_in_plain_English, upstream/downstream flow, adapter registry ID, endpoint_or_private_document_reference (never secret), credential_owner, authentication_model, allowed operations, prohibited operations, approval_required, data classification, tenant scope, usage meter, customer-funded vs company-funded, current_verified_status, tested_at, evidence_receipt, outage_contact, rollback/revocation, maintenance owner, parent Site Bible.
Separate statuses: LIVE VERIFIED, SOURCE VERIFIED, CONFIGURED NOT TESTED, PLANNED, BLOCKED, UNKNOWN. Provider brand labels do not certify current purchasing APIs. A missing key or endpoint cannot be guessed.

## C. Core connection matrix (inventory of responsibilities; operational evidence per associated Bible)
| System | Role | Reuse/connection | Evidence caution |
|---|---|---|---|
| SWADEBASE PostgreSQL/GoTrue | shared identity/tenant data, license and roles | existing backend | every customer operation needs tenant RLS and tests |
| SWADEBASE adapter registry/MCP | typed workflows and approvals | existing registry, scoped actions | not universal auto-execution |
| OATHLOOM | new site templates and verified design versions | existing Studio/OATHLOOM projects | white-label installer not yet implemented |
| Site Design Repair/Impeccable/Ollama | quality checks and reviewed design repairs | existing live super-admin adapter | tenant/customer edition NOT currently authorized |
| SWOSTING | deployment intake, web hosting services, customer operations | existing live SWOSTING site | commercial provisioning/payment not yet proven |
| Hostinger VPS | customer-owned always-on web/app server | existing Hostinger account/servers | cannot claim new customer VPS purchasing API is integrated |
| Hostinger GPU | paid optional compute by actual runtime | existing provider policy | purchase/start/stop workflow not verified |
| Runpod Serverless/Pods | optional usage-based or dedicated media compute | existing ecosystem media patterns | per-customer purchase/credentials require verified adapter |
| Namecheap | domain search, registration and DNS | existing protected API and confirmed DNS management | domain purchase via customer checkout NOT yet end-to-end verified |
| SSS Brain | owner conversational interface and knowledge | live app/operator bridge | tools execute only within explicitly granted approval scopes |
| Stripe/approved processor | signed billing events/renewal and tax evidence | reuse existing payment services when ready | customer merchant-of-record and tax remittance require independent verification |
| Backblaze B2 | durable object media/backup | existing central integration | each independent customer needs ownership/isolation terms |
| SWADE Sign / Cochrane | agreements/versioned consents, legal workflow | existing signing capability and legal project | AI legal review is not a substitute for counsel |
| Mail Center/approved sender | invitation/receipt and incident notifications | existing mail infrastructure | sending requires verified endpoint, customer consent and event state |
| Site Bibles/knowledge index | approved per-product identity and operations memory | current docs/index | preserve originals; reindex every material change |
| Watchtower/health and repair | operations metrics, problem detection | existing monitors where enrolled | per-customer end-to-end health unverified |

## D. Customer storefront as one guided purchase
Step 1 Choose originating product from founder-approved licensable catalog; compare Basic, Business, Full and permitted add-ons. Display independent hardware, support, annual renewal and platform usage without confusing base license with operating expenses.
Step 2 Select brand name, logo upload or create, background image reference or text description, business bio, audience and domain idea. Keep draft through checkout.
Step 3 Add-on wizard chooses only necessary services. CPU Hostinger VPS is default; GPU choice is automatic based on product capability and forecasted jobs, with an understandable opt-in quote showing Serverless, dedicated Pod or Hostinger GPU. Domain search through authorized Namecheap connection; use existing credentials only within approved server-side methods, no client/browser exposure. Provide actual availability/quote before charge.
Step 4 Show full quote: initial software license, first-year provider costs at actual term, recurring yearly license fee, domains, VPS renewal pricing, optional GPU usage, storage/media/AI allowances and overage, taxes and processor charges; clearly distinguish estimated usage from fixed purchase. Founder and designated verified admin platform charge exemptions still require accounting for third-party spend.
Step 5 Verify purchaser email and necessary identity; customer signs agreement, authorizes account creation/verified provider quotes, confirms payment and customer billing ownership. Where provider cannot expose a supported purchasing API or needs a human account step, display a simple owner-authorized provider handoff rather than claim one-click purchase. Never silently charge an existing founder account or use founder keys as customer defaults.
Step 6 SWADEBASE creates an audited provisioning job with exact product manifest/license SKU and rollback; grants account-bound service adapter permissions; SWOSTING configures owner-held server, Namecheap DNS, optional compute, HTTPS/backup; OATHLOOM generates and Site Design Repair checks branded preview. Nothing is live merely because an invoice succeeded.
Step 7 Customer reviews preview and launches following tests, backup, restore, security, media and license heartbeat validation. Only then send celebratory ready-to-use onboarding email (or an earlier distinct 'purchase complete, setup pending' receipt).
Step 8 Site's COS walks through first task; deep CMS, help center, auto-repair preview, business plan, sales materials and marketing prompts are provided. Admin sees usage, pricing, taxes, licenses, add-ons, upgrades, backups and incident handling.

## E. White-label family terms
- Original parent brand mandatory visible Powered by ORIGINAL BRAND attribution on supported customer sites and receipts, not mistaken for optional SWADE Signature badge; preserve required third-party notices.
- Customer-chosen public brand, logo, domain and imagery are scoped overlay; not allowed to edit centrally owned license, signed lineage, audit API or attribution using supported CMS/AI.
- No unbreakable tamper-proof promise on customer-owned VPS. Server root owners can alter local software. Use centrally held signing keys, signed manifests, authenticated transaction reporting, telemetry health, license grant validation, tamper alerts and contractual remedies. Protect user privacy and data export rights.
- Source product parent dashboard plus central SWADEBASE portfolio manager plus limited customer instance dashboard use one source of verified reconciled records. Off-platform sales require merchant integration to measure. Do not invent unseen sales or tax filings.
- Authorized white-label sublicense price ceiling is 120% of matching founder-approved SKU before legally applicable taxes, pending competition/franchise/resale-price legal review; downstream everyday service prices not assumed capped. Licensee keeps its proceeds, separately pays software renewals, hosting and metered services.
- Signed versioned source release -> preview and compatibility tests -> preserving branded overlay and user data -> safe release window/consent based on severity -> rollback. Add-on features and lower tiers require independent entitlements, not unconditional grants.
- Deep CMS/role-scoped admin/COS and tenant-safe Repair Center on every released package. Existing founder-only repair adapter must not be exposed directly to customers.
- Founder super-admin can manage licenses, gifts, invitations, activation and offboarding with audit and safe reversible operations; destructive customer deletion needs verified authority, clear confirmation, retention and exit rights. No silent broad deletion.

## F. Bible directory and update discipline
00_THIS_INDEX: company-to-runtime hierarchy, canonical decisions, change status.
01_CORPORATE: entities, products, licenses, brand/identity standards.
02_PRODUCT_CATALOG: every product -> source Site Bible, canonical domain, owner, rights, support level, readiness.
03_CONNECTION_REGISTRY: normalized integration contracts and evidence by provider and originating site.
04_INFRASTRUCTURE: Hostinger, SWOSTING, Runpod, Namecheap, B2, monitoring, recovery.
05_IDENTITY_SECURITY: user/tenant role boundaries, server-side grants, founder lock, signed telemetry and credential vault references.
06_COMMERCE: original price catalog, white-label license/resale ceiling, recurring renewal, feature tiers, usage/overage, taxes, merchant-of-record, fulfillment and reconciliation.
07_SITE_FACTORY: source manifest, OATHLOOM builder, Site Design Repair, deep CMS, COS, signed releases, hosted installation.
08_PARENT_CHILD: originating product parent management, tenant API metrics, dashboards, updates, attribution, data privacy.
09_CUSTOMER_PACK: manual, business plan, annual cost estimator, ads/social prompts, scripts, support and repair training.
10_SSS_BRAIN: voice commands, operation proposals, agent handoffs, bounded approved execution, result receipts.
11_OPERATIONS: incident alerts, staged deploy, backup/restore, tests, rollback, SLA and offboarding.
12_EVIDENCE_HISTORY: preserve existing dated release notes, current verified truth, immutable receipts and original Bibles.

Every affected product retains its OWN Master Site Bible. Link rather than copy cross-product private materials. New releases must cite exact source/version, approval, test, deployed state, rollback, and update this index if architecture changes.

## POLICY SUPERSESSION 2026-11-20 — pricing and affiliate system
The founder WITHDREW all mandatory resale price matching and maximum 20% markup rules. Customer licensees independently determine their downstream resale and service retail prices. SWADE controls its original software license, annual renewals, optional modules and metered services. Target 60-90% CONTRIBUTION MARGIN (default 80%, floor 60%) after attributable service and affiliate costs; calculate true ROI separately and escalate exceptions. One SWADEBASE controlled affiliate engine should serve two scoped network types: original-product sales partners and licensee-owned optional Affiliate Center upsell for their end users. Legal and payment/attribution workflows must be verified before production. Detailed requirements: `/opt/swadebase/docs/SWADE_WHITE_LABEL_STUDIO_PRD_20261120.md`. All earlier fixed/120% resale-price references are superseded historical notes, NOT current rules. Documentation only; no customer sale or payout activated.
