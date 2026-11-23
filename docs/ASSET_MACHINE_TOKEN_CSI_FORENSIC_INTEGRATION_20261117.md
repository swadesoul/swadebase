# Asset Machine — Fraud & Provenance Intelligence Integration
Status: DESIGN / NOT DEPLOYED
Owner direction: November 17, 2026
Components: Asset Machine + Token CSI + existing SWADEBASE Asset Review, SWADE Sign, Cochrane
Budget: $0 external spend

## Purpose
Add evidence-centered counterfeit, crypto/token, and document provenance findings into Asset Machine. Token CSI acts only as an INTERNAL READ-ONLY investigation adapter, not a public navigation redirect, token deployment authority, payment tool or authentication issuer.

## Verified source constraints
- Asset Machine currently supports authenticated cases, encrypted original uploads, SHA-256 integrity checks, OCR, scoped findings, private attorney drafts and versioned report release. Direct bank/issuer attestations are not connected.
- Token CSI's Github README describes contract, liquidity, wallet, forensic scores and downloadable reports, but is not proof that each engine is live/accurate.
- The existing Token CSI sssbrain-bridge 'analyze_token' and 'trace_wallet' paths prompt a language model from a user-provided address and create a score without verified indexed chain evidence. These results MUST be marked unsubstantiated and cannot grant authenticity/clearance.
- Token CSI deploy-token source emits mock addresses and transaction hashes, then labels some records certified. That source MUST NEVER be connected to any Asset Machine release, custody, settlement, ownership or issuance check.
- Token CSI is Lovable/Supabase-origin source. Do not introduce another Supabase database. Migrate only a minimal verified read-only adapter to the existing SWADEBASE backend, subject to further approval/testing.

## Internal case workflow
1. Intake original file/statement/transaction hash/chain/contract address with claimant, declared jurisdiction and authorized case scope. Preserve encrypted original and SHA-256 receipt.
2. Analyze document internals, revisions, PDF signatures and certificate trust, fonts/object anomalies, OCR discrepancies, document number syntax, suspicious logo changes, cross-page inconsistencies; no visual heuristic proves fraud.
3. Check C2PA when present using local/open tooling and qualified trust anchors; record valid/invalid/absent/unsupported. Absence does NOT prove human origin; presence does NOT prove truth. AI-text classifier is weak triage only, never a conclusive accusation.
4. Cross-reference issuer/custodian government/registry data via official allowed sources. Independently confirm submitted account-specific bond/SBLC details with issuer/authorized bank when such a connection exists; never infer ownership from a CUSIP or bank name.
5. Token CSI read-only subtask: derive chain and network, validate contract/address syntax, pull independent chain RPC/indexer evidence with block height, chain ID, tx hash, timestamp, source URL and data quality. Compare token issuer claims, smart contract privileges, token supply, holders, freeze/mint rights, liquidity claims and linked transaction flow with attached representations. Reject chains unsupported by verified readers.
6. Cross-check claimed asset-to-token bridge; a token or NFT referencing a bond or gold instrument does not prove underlying asset ownership, issuer endorsement, collateral, legal right to redeem or custodian authorization.
7. Produce separated determinations: file integrity, provenance, issuer confirmation, legal title/custody, chain/contract facts, wallet linkage (attributed vs unknown), fraud indicators, and residual uncertainty.
8. Escalate inconsistencies or missing primary evidence to human reviewer; never auto-label a named party fraudulent. Freeze workflow permission for further monetization/marketing, not wallets or customer funds.
9. On independent reviewer release, export counsel-ready case PDF + permitted encrypted originals + source snapshot provenance + SHA-256 manifest + append-only case events, with explicit reviewer and approval scope.

## Output vocabulary
- Verified fact: independently captured, reproducible from named authoritative source and timestamp.
- Corroborated claim: two or more relevant independent sources, but not definitive.
- Unverified claim: missing authority or unavailable verification.
- Material discrepancy: conflicting evidenced facts.
- Suspicious indicator: evidence for inquiry, NOT proof of fraud.
- AI provenance detected/none detected/unsupported/indeterminate; never 'X% AI-written' absent a validated, meaningful test.
- Transaction blocked for review: internal state only, no transfer attempted.
- Never show green 'SAFE' solely from a model hallucination or absence of negative findings.

## Essential gates / tests
- Fake bank PDF vs genuine sample; typography-only false positive; C2PA legitimate AI-assisted PDF; unsigned PDF; altered C2PA signed document; mismatched CUSIP vs verified Treasury source; spoofed institution and unsupported issuer contact.
- Real read-only chain test (known token, chain ID, block, contract and transaction) and fake chain/address fixture; duplicated token symbol; wrong network; proxy contract upgrades; malicious mint/freeze permissions; stale RPC response.
- Assert no real token minting, no wallet signature, no paid calls, no external messages, no privileged data leakage, no reviewer signoff by AI, no change to existing client case access and exemptions.
- Signed-in client and reviewer tenant isolation, report evidence invalidation and iPad Safari upload/download need live acceptance.
- Preserve snapshots and backout, exact source citations and date; use deterministic scanners before optional local AI explanation.

## Remaining work / current state
Research and design documented only; no adapter, route, schema, billing, monitoring schedule or live page added. Public sample reports remain illustrative. Before production, inspect Token CSI contract readers and existing Asset Review and verification adapters in runtime, build bounded read-only evidence adapter, add fixtures and independent-chain test, connect the existing report path and obtain legal review of claims.
