# Bible entry coverage matrix

MCP **1.1.1** is installed. The production harness passed **207 assertions as `swadeops`**. The results below distinguish actual production reads, isolated regression fixtures, mocked authentication, and the three authenticated HTTPS checks that were not run.

| Boundary | Expected behavior | Verification route | Production status |
|---|---|---|---|
| MCP connection/request | Authenticated dispatch performs entry checks before protocol handling | Protocol regression plus optional genuine credential through official SDK | Regression passed; authenticated public HTTPS **not run** |
| MCP guarded tools | Source hashes and scope-appropriate context accompany results | Actual deployed service, real Bible read and `entry_context` | Direct service/database passed; authenticated public SDK branch **not run** |
| Native planning bridge | Existing planning service receives current context; rules-only path uses no model | Actual service/database rules-only plan and regression tests | Passed at service level; authenticated public native bridge **not run** |
| Native knowledge bridge | First source is live standing rules containing the default merchant, source SHA matches context, generated=false and no paid fallback | Actual route + real DB with explicitly mocked identity/transport | Passed within that boundary; genuine GoTrue HTTPS **not run** |
| Current references | Current files and canonical documentation remain retrievable with matching hashes | Actual filesystem, index metadata, and targeted full-text retrieval as `swadeops` after final documentation updates | Passed: all three canonical hashes match and all three match `automatic Bible entry`; entry ready, automation healthy |
| Current merchant | Authorized context resolves Swadez / `acct_1SizGm43OPTHaIwn` from standing rules | Source/response assertion and first native source; no Stripe request | Passed |
| Restricted scopes | No document metadata/text, decisions, or merchant details | Actual service scope denial and isolated protocol fixtures | Passed at service/regression level; genuine restricted-bearer HTTPS **not run** |
| Missing authentication | MCP 401, native bridge 403, no reference leakage | Actual anonymous public HTTPS | Passed |
| Missing mandatory file | `bible_unavailable`, HTTP 503 before work | Isolated fixtures only | Regression passed; production files were not removed |
| Stale index/receipt | Explicit degraded automation, current-file context remains `ready_live_reference` | Isolated source/index/receipt fixtures | Regression passed; production was not deliberately degraded |
| Guardian indexing | Exact loaded post-hook, existing five-minute timer, real successful receipt | Unit state and actual scheduled run | Passed: trigger 07:23:23 UTC, index receipt 07:23:51.834355 UTC |
| Private paths/secrets | Approved paths only; redaction; no raw credentials in outputs | Isolated path/secret fixtures and source review | Regression passed |
| Paid work | Entry checks/indexer invoke no paid provider, embedding, or training operation | Scoped harness and actual scheduled index receipt | Passed: no models/payments in harness; scheduled receipt reports 0 paid calls/embeddings and no training |
| External ChatGPT sessions | No universal conversation-start hook is installed | Scope statement and architecture review | Out of scope; never claim supported |

## Release and regression evidence

- Installed source: `28893536105cab4b3871d03ddc200d253fc8f0d2`, PR #53; merge `e78b21bb4dd66fe04de2011f84e38cadc4885461`.
- All **14 installed paths** match. Backup: `/opt/swadebase/backups/bible-entry-20261107T072131Z`.
- Exact production Node **v20.20.2** rerun: **87 passed, 0 failed, 0 skipped**. Python receipt tests: **3 passed**.
- Scoped live harness: **207 assertions passed** as `swadeops`, using the existing verified owner and read-only database.
- Public health reported **1.1.1**. Anonymous MCP/native HTTPS checks passed.
- Actual scheduled index success at **2026-11-07T07:23:51.834355Z**: **135 sources**, **0 changes**, **0 removals**, **0 quarantined paths**, **0 paid calls**, **0 embeddings**, **no training**.
- Three affected canonical documents were updated and indexed at **2026-11-07T07:25:46.922722Z**. Internal What's New: `b6a8dc5c-66bd-53f1-834d-54fce0b9bd70`.
- Final readback after those updates passed as `swadeops`: entry **ready**, automation **healthy**, correct merchant, latest entry-check decisions present, all three canonical hashes matching the index, and all three documents found by the `automatic Bible entry` full-text query.
- No credentials were minted to manufacture an authenticated public result. No models or payments were invoked by the verification.

## Interpretation of harness coverage labels

- `direct_service_and_database`: **passed** using the actual implementation, existing verified owner, and read-only database. This is not a new authentication session.
- `native_handler`: **passed** using actual route/database code with explicitly mocked identity and transport. It does not prove GoTrue sign-in or the public native HTTP boundary.
- `live_anonymous_https`: **passed**, including actual unauthenticated network rejection.
- `live_authenticated_mcp`: **not_run_no_existing_credential**.
- `live_restricted_mcp`: **not_run_no_existing_restricted_credential**.
- `live_native_auth`: **not_run_no_existing_gotrue_user_token**.

`scoped_checks_passed` is a statement about completed rows and their explicit labels. It is not permission to turn skipped authenticated coverage into a passed end-to-end result.

## Authority and spending

Reference context never adds permissions. Existing scopes, registry pause, founder approvals, and payment rules still apply. This release does not create a new Stripe account, payment, refund, transfer, provider top-up, reminder, scheduler, or model-training job.

The separate token-loyalty installation **remains disabled**. These results certify the stated Bible-entry and indexing coverage, not 100% of the platform or every client sign-in journey.
