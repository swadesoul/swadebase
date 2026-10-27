# Brainiak Hyperframes authoring mismatch
Evidence: Incident Guardian brainiak-hyperframes-authoring-version-20261025, status resolved; handoffs 79 and 80.
Cause: bundled skill routing and the published skill registry differed on the old pinned CLI.
Resolution recorded: create a separate production project pinned to Hyperframes 0.8.186 and read that version's installed authoring contract. Reuse existing compute and voice; do not replace or upgrade a shared adapter to fix one project.
Related fixes recorded: speech timing, malformed WebVTT newlines and versioned caption caching. Browser playback, visible captions, Backblaze persistence and HTTP range delivery were verified in the delivery record.
A pinned historical version is not a recommendation to downgrade every project. Recheck current project source and dependencies.
