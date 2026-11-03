# Asset Machine knowledge release 1.0.0

The existing Asset Machine module now reads the researched asset-verification knowledge pack dated November 3, 2026. This is an educational content integration; it is not authentication of an individual asset, professional approval of a transaction, or model training.

## Content and navigation

- 52 public articles cover evidence, bonds, safe keeping receipts, standby letters of credit, inherited documents, gold, gems, wallets and tokenization.
- The public source register retains 75 citation identifiers and 74 unique primary-source URLs. Inline attribution, research dates, jurisdiction scope and editorial status remain attached to the content.
- Nine operating references and assistant rules are kept outside the public static-file allowlist in `knowledge-operations.json`.
- `#knowledge`, `#knowledge/topic/<topic>` and `#knowledge/article/<article-id>` provide search, topic filters, full references, source links and article downloads. Existing seven `#learn` starter guides remain available.
- The evidence checklist CSV contains 55 general evidence requests and their limits. It contains no case records.

## Runtime behavior

Public text and voice select bounded curated answers, article links and primary sources. The public route makes no database or model calls. Unmatched questions ask for clarification or offer relevant reading; unfamiliar instrument labels remain unclassified. The existing Kokoro/Whisper services, exact-origin checks, CSRF nonce, short-lived scoped public cookie and rate limits remain in place.

Authenticated case chat retrieves a small selection of public educational references only after existing identity, case and CSRF checks. It labels general education separately from permitted case evidence and appends versioned references to saved replies. The existing native model still produces drafts requiring appropriate human review. No additional access to attorney notes, other clients' records, accounts or wallets is granted. Legal draft approval/release and payment exemptions are unchanged.

The browser renderer escapes raw HTML and restricts links to safe HTTP(S) URLs. It resolves published citation IDs, preserves tables and lists, and prevents delayed fetches from replacing a page selected later. Source links and dates are evidence of provenance and research scope, not perpetual confirmation of legal or financial facts.

## Validation and updates

Run `node --test test/*.test.mjs` from this module. Tests cover content integrity and scope, source references, matching, public-route protection, case-context separation, safe rendering, navigation races and prior experience behavior. The HTTP tests use synthetic in-memory data; they do not certify a real customer's asset or Google session.

Update the public corpus and curated answers together. Preserve article IDs and per-body hashes, ensure every answer references public articles and valid source IDs, retain editorial/date qualifications, run the suite, update browser cache versions when scripts change, and restart the existing adapter to reload the content cache. Record the actual deployment, verification and rollback in the private Site Bible. Restore only scoped release files from the deployment backup if rollback is required; preserve all client data and unrelated changes.
