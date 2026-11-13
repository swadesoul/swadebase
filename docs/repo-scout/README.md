# Repo Scout — daily AI-news to ecosystem upgrades

Created 2026-10-29, America/Chicago, per Harold. Status: ACTIVE (fetch + brief only). Nothing is installed, deployed or bought by the scout.

## What it does
1. Daily, checks watched YouTube channels (list: /opt/swadebase-adapters/var/repo-scout/channels.txt; first channel @thenextnewthingai).
2. New video -> free auto-captions via the existing VideoSayWhat yt-dlp + vsw-warp route (no AssemblyAI cost). Script: /opt/swadebase/ops/repo-scout/fetch.py. Transcripts: /opt/swadebase-adapters/var/repo-scout/transcripts/.
3. Analysis: every tool, repo, model or idea in the video is checked against what already exists BEFORE it is proposed (redundancy check, rule 11): site Bibles in docs/site-bibles, STANDING_RULES, docs/*, /opt directory names, adapter registry, swade_modules.
4. Writes one brief per video to docs/learning-approved/repo-scout-<date>-<videoId>.md and updates the queue docs/learning-approved/repo-scout-queue.md. The hourly knowledge sync indexes both, so SSS Brain can answer "what did the scout find?" and walk Harold down the list.
5. Harold approves or declines items in conversation with SSS Brain, Claude, ChatGPT or Grok. Whichever AI receives the decision updates the queue (status + date + who). Approved items are then built under normal rules (reuse first, approval gates, deploy only approved, update the affected Site Bible).

## Verdict labels (one per item)
- EXISTS — we already have it; name where. No action.
- EXTEND — we have part of it; propose the small gap only.
- NEW — not in the ecosystem; worth adding. Give fit, cost, risk, first test.
- WATCH — interesting, not usable yet (unreleased, license unclear, costs money).
- SKIP — not a fit.

## Brief format per item
Name | what it is | link (only if in the video or verified) | verdict | where it fits (which site/system) | cost and whether it replaces something paid | risk | first test.

## Rules
- $0 external spend (rule 13): paid tools are WATCH unless Harold approves spending.
- Never claim a repo exists without checking the link; unknown links say "link not found".
- Never install, clone into production, deploy, post or message anyone from the scout.
- Later owner: Chief of Staff (Rakazo) once swadebase-2 is healthy; until then a daily Claude scheduled task runs it through Desktop Commander.
