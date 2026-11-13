# Connected Maestro Artist Office

Owner requested the Artist Office build and reaffirmed that features must connect into the existing site journey. Extends the live Artist Studio source; no replacement artist renderer, backend, broadcaster, scheduler or paid model.

## Connections

| Entry | Connected action | Shared context |
|---|---|---|
| Main For artists navigation | Artist Office | Existing sign-in |
| Artist Office / Label Office | Select owned artist | Server-authorized artist page ID |
| Artist page editor | Return to office | Same artist ID |
| Office music upload | Existing submission form | Artist ID and prefilled display name; existing rights/upload checks |
| Office radio discovery | Existing free discovery enrollment | Artist ID carried in return links |
| Radio and Maestro Mix drawer | Work on today's starter mission | Selected artist ID and story prompt |
| Office prompt suggestions | Saved reviewable campaigns | Published artist revision, music details, tone and goals |
| Campaign review | Activate or pause tracked invitation | Server-issued random share token |
| Fan invitation | Shared radio, public artist music and private response | Campaign identity; signed-in participation |
| Fan activity | Office results | Deduplicated fan/day/campaign arrivals and responses |
| Office / education | Publishing, identifiers, ad-sales lessons | Return to artist workflow |
| Existing artist dashboard | Office | Owner chooses authorized linked artist |
| Story preferences | Editorial intake | Explicit opt-in, approved ideas and excluded topics; no voice permission |

Label view selects artists owned by the same account. Cross-user label team delegation is not implemented. Existing profile links are preserved; no duplicate artist identities are created. Existing Artist Studio images/references/editor/B2/publishing and managed artist aliases remain accessible from the office.

Local Ollama only; bounded generation, request size, concurrency and per-user rate limit. Deterministic templates remain available if the local model is busy or fails. No paid fallback. Office is preview access; pricing, subscriptions, credit rewards, external messaging and automatic radio-story synchronization are inactive. No fees or paid providers were invoked.

Campaign drafts remain private until explicit activation. Only the reviewed headline/message and published artist identity are returned publicly. Pausing or hiding the artist revokes invitation access. Responses remain private in the owner office. Counts are signed-in arrivals and fan responses, not verified audio listening, social reach, royalties or guaranteed fan growth. Self-activity is rejected. Repeated same-day actions are idempotent. Story supporter is a participation badge only, with no financial entitlement.

## Verification and recovery

See office-unit.log, office-ui-report.json, office-typecheck.log, office-build.log, office-live-report.json and office-live-browser.json. UI fixtures are distinct from real synthetic-account production acceptance. No physical iPad Safari or personal founder Google sign-in is claimed.

Installer requires unchanged live baseline, tests, deploy lock, backup and public/auth checks. It changes only the native Maestro factory handler, two additive RLS tables, two existing campaign columns, and the static Maestro release. It restarts maestro-factory only. Radio engine, shared edge runtime, DNS and mail are untouched. On failed checks it restores the previous frontend and factory source. Preserve additive metadata and audit/customer records during rollback. Exact prior release/files are in office-deployment.json and the backup receipt.

Source is committed locally to feat/artist-office-20261113. Existing Artist Studio source-publication hold must be respected; no upstream push is attempted without explicit destination/branch approval. Record actual release state in canonical Bibles/What's New and refresh existing knowledge index.
