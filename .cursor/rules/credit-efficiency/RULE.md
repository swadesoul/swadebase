---
description: "Save Cursor credits: prefer small context, targeted reads/edits, and planned exploration"
alwaysApply: true
---

# Credit-efficient agent sessions

Keep context small and tool use intentional. Goal: save Cursor credits without cutting correctness.

## Do

- Prefer the smallest useful context: offsets, line ranges, `rg`, and symbols over whole files.
- Do not re-read a whole file when a slice, search, or prior summary already answers the need.
- Batch independent reads/searches in one turn; avoid serial "peek then peek again" loops.
- Skip unnecessary tools (status, list, re-fetch) when you already have the answer.
- Summarize a short plan before wide exploration or multi-file digs.
- Prefer targeted edits (minimal hunks) over rewriting large files.
- Truncate or summarize huge logs/outputs; never dump them into context.

## Don't

- Open every related file "just in case."
- Re-run the same read/search hoping for a different answer.
- Paste full build/test logs when a failing excerpt or path is enough.
