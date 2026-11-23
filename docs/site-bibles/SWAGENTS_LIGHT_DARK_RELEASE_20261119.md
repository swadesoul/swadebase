<!-- swagents-light-dark-20261119:start -->
# SWAGENTS light and dark mode checkpoint

Release date: November 19 Central / November 20 UTC, 2026. All 11 SWAGENTS pages now have a native, keyboard-accessible theme button. A synchronous head script applies a valid saved choice before styles load, or follows the device preference when no choice is saved. The independent device-local key is `swagents-theme-v1`.

Explicit choices are remembered when storage is available and synchronized across tabs. Removing or clearing the choice in another tab returns the receiving tab to device mode. Device changes apply only while no explicit choice is active. If saving is denied, the selected mode remains active in that tab without promising persistence. Missing browser preference support falls back to the existing dark appearance.

The scoped release changes 11 HTML files and adds only `theme.js` and `theme.css`. Original artwork and existing application scripts, APIs, voices, character controls and provider behavior are retained. The theme code makes no network or paid-provider calls.

Evidence: 13 public files verified against manifest `6eec18a27d91e5a8e0e0fc88455164988de4fdccdaaafdc6f56d6561a20b302b`; **539** successful staged-browser assertions against those exact files; and the private source/memory receipt. Browser coverage includes all 11 pages on desktop/mobile layouts and two concurrent synthetic Chromium sessions. This does not certify physical iPad/Safari behavior or production capacity.

Site Design Repair retains all 51 source files as reviewed version **9**, hash `e28546799727dd5b2508a80ff84098e2ff9287ea71bfc7a4f2e68b9649e3659d`, with earlier versions and conversation preserved. `theme.js` joins protected JavaScript; the source binding is `0ffe86cb67dffa4bead4d0124f12a8cb1e007e861facd57ed8de3cb6add342ba`. The reviewed operation is mirrored to SSS Brain.

Verified source publication: https://github.com/swadesoul/swagents/pull/3 at `ae018774a9e7b0c4246fbbb915d6d036dc0e64e9`; https://github.com/swadesoul/swade-ecosystem-hub/pull/75 at `2bb4069147548d2732f5a050d7758610e13e1ebe`. Publication status is taken from the pinned GitHub readback receipt; this private recorder makes no GitHub changes.

Canonical context: the SWAGENTS, SWADEBASE and Site Design Repair Bibles plus `daily/2026-11-20.md`. This compact checkpoint is stored under the existing indexed `site-bibles/*.md` path; full Bibles are retained even when they exceed the knowledge index’s 250,000-byte cap.
<!-- swagents-light-dark-20261119:end -->
