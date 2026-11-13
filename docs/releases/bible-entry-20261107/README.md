# SWADEBASE Bible entry checks — deployed release

**MCP 1.1.1 is installed and verified within the coverage below.** Authenticated shared MCP entry and guarded work now check current Bible/rule files, document hashes, and the indexing automation. Existing native bridges receive the same compact reference context. The existing five-minute Guardian now runs the intended Bible-index post-hook; a later scheduled execution was observed successfully.

This is a shared SWADEBASE entry/work mechanism, **not a global ChatGPT conversation-start hook**. Requests that never reach the shared service are outside its coverage.

## Release identity

| Item | Value |
|---|---|
| Private repository | `swadesoul/swade-ecosystem-hub` |
| Source review | [PR #53](https://github.com/swadesoul/swade-ecosystem-hub/pull/53) |
| Installed source | `28893536105cab4b3871d03ddc200d253fc8f0d2` |
| Merge commit | `e78b21bb4dd66fe04de2011f84e38cadc4885461` |
| Installed scope | **14 paths**, all matching the release source |
| Recovery backup | `/opt/swadebase/backups/bible-entry-20261107T072131Z` |
| Public health version | **1.1.1** |
| Internal What's New | `b6a8dc5c-66bd-53f1-834d-54fce0b9bd70` |

## Verified results

- **87 Node tests passed**, with **0 failures and 0 skips**, using production Node **v20.20.2**.
- **3 Python receipt tests passed**.
- The production harness passed **207 assertions as `swadeops`**, using the existing verified owner and read-only database. It checked actual service behavior, source/index hashes, merchant context, automation health, restricted service scopes, native route code with explicitly mocked identity/transport, and actual anonymous public HTTPS rejection.
- The native knowledge result's first source was the current standing-rules file. Its excerpt contained the verified default Stripe account, its hash matched entry context, and the response used **generated=false with no paid fallback**.
- Guardian triggered on **2026-11-07 at 07:23:23 UTC**; its main command exited at **07:23:51 UTC**. The indexer's journal and receipt recorded success at **2026-11-07T07:23:51.834355Z**: **135 sources, 0 changes, 0 removals, 0 quarantined paths, 0 paid calls, 0 embeddings, and no model training**.
- The SWADEBASE Master Bible, standing rules, and MCP Actions Bible were updated and indexed at **2026-11-07T07:25:46.922722Z**.
- Final readback after those updates passed as `swadeops`: entry **ready**, automation **healthy**, the correct merchant and latest entry-check decisions present, all three canonical document hashes matching the index, and all three discoverable through the `automatic Bible entry` full-text query.

No credentials were minted, no models or payments were invoked, no reminder was created, and no new scheduler or service was introduced for this release. The live knowledge allowlist was preserved unchanged.

## Explicit verification limits

The following three authenticated public checks were **not run** because suitable existing credentials were unavailable:

| Coverage branch | Recorded result |
|---|---|
| Authenticated MCP over public HTTPS | `not_run_no_existing_credential` |
| Restricted-token MCP over public HTTPS | `not_run_no_existing_restricted_credential` |
| Native bridge over public HTTPS with a genuine GoTrue user token | `not_run_no_existing_gotrue_user_token` |

Actual service/database checks and native route checks with mocked identity are useful evidence, but they are not a substitute for those real authentication boundaries. No complete platform or universal client-sign-in claim is made.

The separate token-loyalty feature **remains disabled**. This release does not activate rewards or change customer token balances, prices, checkout, or provider funding.

## Default Stripe merchant and authority

The already verified shared default is **Swadez**, account **`acct_1SizGm43OPTHaIwn`**. The entry mechanism reads that default from the current `Shared Stripe merchant` section of `STANDING_RULES.md` and includes it only for actors with the appropriate read scope. The independent account-default evidence was preserved in PR #52, merge `850e022`; no new $1 payment was run for this feature.

The context boundary is `approved_reference_not_action_authorization`. Existing permissions, registry pause, approval rules, and payment controls continue to apply. Ambiguous merchant references remain unresolved instead of selecting another account.

## Release documents

- [RUNBOOK.md](RUNBOOK.md): actual runtime paths, existing Guardian configuration, safe checks, observed evidence, and rollback.
- [COVERAGE.md](COVERAGE.md): passed, simulated, regression-only, unrun, and out-of-scope boundaries.
- [live-verification.mjs](live-verification.mjs): the scoped read-only verification harness; no credential creation or payment calls.
- [evaluation.xml](evaluation.xml): ten deterministic evaluation questions for this feature. Its expected answers are not an additional executed production test count.

Sanitized deployment, live-check, scheduled-run, documentation, and test receipts are preserved separately by the release owner alongside these documents for detailed evidence. No credentials or customer records belong in those receipts.
