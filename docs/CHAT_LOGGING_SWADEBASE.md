# Chat logging into SWADEBASE (Big Mamma / ChatGPT / Claude)

Built Friday Oct 30, 2026, ~5:20 AM CT by Grok Bot (Big Mamma executor, voice call-79d4cce7). Status: **live on SWADEBASE** (VPS 1796059, supabase-db).
Rules followed: deploy lock taken and released (rule 20), and the SWADEBASE Master Site Bible was updated with a backup and rollback steps (rule 17).

## What existed before (checked first)
- `swadesoul.agent_handoffs`: **still does not exist.**
- `swadebase_ops.handoff_log` (60 rows): a task/fix queue (kinds limited to fix_request/task/note). Not a chat store.
- `swadebase_ops.console_*`, `sssbrain.messages`, `swadesoul.chat_*`, `oathloom.dc_session_transcripts`: each is an in-app chat table for one product (per-user rows under RLS). None holds Big Mamma, ChatGPT or Claude history.
- Daily summaries: `/opt/swadebase/docs/daily/*.md` (Oct 24–30).
→ Nothing fit, so I created one new, clearly named schema: **`chat_archive`**.

## What I built
**Postgres schema `chat_archive`** (supabase-db, additive, no restarts):
| Object | Purpose |
|---|---|
| `conversations` | one row per chat: `assistant` (big_mamma / chatgpt / claude / other), `source`, `external_id`, title, started_at, updated_at, model, message_count, summary, meta. Unique on `(assistant, external_id)` |
| `messages` | seq, role (user/assistant/system/tool/summary), content (**already redacted**), created_at, content_hash, redaction count, full-text `search` column (GIN). Unique on `(conversation_id, external_id)` → dedup |
| `ingest_runs` | log of every import (file sha256, counts, redactions) |
| `ingest_conversation(jsonb)` | idempotent upsert; returns the number of new messages |
| `v_conversations`, `v_timeline` | browsing views with times in America/Chicago |
| `search(text)` | keyword search with highlighted snippets |
Security: RLS is on with no policies, and all grants are revoked from anon/authenticated, so only the owner/service role can read. No public API exposes it.

**Tools** in `/opt/swadebase/tools/chat-archive/`:
- `ingest.py chatgpt|claude|bigmamma|daily <file>` (add `--dry-run` to test without saving). Parses:
  - ChatGPT official export ZIP or `conversations.json`, including the 2026 sharded `conversations-NNN.json`. It follows `current_node` so abandoned regenerations and edits are skipped, and hidden/system/browsing nodes are dropped.
  - Claude official export ZIP: `conversations.json` or `.jsonl`, `chat_messages`, with human→user. Thinking blocks are dropped; tool use and attachments become short markers.
  - Big Mamma session JSON/JSONL (format below).
  - Daily summaries (one message per `##` section, refreshed on every run).
- **Secret redaction runs before anything is saved.** It catches OpenAI/Anthropic `sk-…` keys, Stripe sk/rk/pk/whsec, GitHub ghp_/gho_/github_pat_, Slack xox*, AWS, Google AIza, Resend `re_…`, HuggingFace, JWTs, `Bearer …`, private-key blocks, passwords in URLs, `PASSWORD=`/`API_KEY:`/`token=` assignments, and Luhn-valid card numbers. Each hit becomes `[REDACTED:type]`.
- `export_md.py`: rebuilds **browsable Markdown** at `/opt/swadebase/docs/chats/INDEX.md` plus one file per conversation (`chats/<assistant>/<date>_<title>_<id>.md`, times in CT).
- `run_inbox.sh` plus **`swadebase-chat-archive.timer`** (at :07 and :37 past each hour). It ingests anything dropped in `/opt/swadebase/chat-imports/inbox/{chatgpt,claude,bigmamma}/`, moves each file to `processed/` or `failed/`, re-ingests the daily summaries, and rebuilds the docs.

**Seeded now:** 8 Big Mamma daily summaries (Oct 24–30, 58 sections). Tested end to end with ChatGPT/Claude/Big Mamma sample files: dedup on re-import worked, branch handling worked, redaction worked. I deleted the test rows afterward.

## Each assistant: what's possible
### 1) Big Mamma (Grok Bot)
- No outside API is needed. The archive is ready, but **nothing pushes full conversation transcripts in automatically yet.** A subagent can't read the main chat's transcript (ReadTranscript only reads a bot's own run or sessions it is allowed to see), so the push has to come from Big Mamma's own sessions/routines.
- Ingest path (ready): write a JSON file to `/opt/swadebase/chat-imports/inbox/bigmamma/<session-id>.json` over SSH. The timer picks it up within 30 minutes, or run `python3 /opt/swadebase/tools/chat-archive/ingest.py bigmamma <file>`.
  ```json
  {"external_id":"call-79d4cce7","title":"Voice call: REA report + chat logging","channel":"voice",
   "started_at":"2026-10-30T04:40:00-05:00","summary":"…",
   "messages":[{"role":"user","content":"…","created_at":"2026-10-30T04:41:00-05:00"},
               {"role":"assistant","content":"…","created_at":"…"}]}
  ```
  JSONL (one message per line with `session_id`) also works. Re-sending the same session only adds new messages.
- **Recommended (needs the parent/Swade to set it up):** (a) at the end of each voice call or chat, Big Mamma drops a session file (transcript, or summary plus key exchanges). (b) Extend the nightly 11:45 PM CT daily-summary routine so it uses ReadTranscript on that day's readable sessions and drops one file per session. Daily summaries are already archived automatically.

### 2) ChatGPT
- **There's no API for ChatGPT chat history.** The OpenAI API doesn't expose ChatGPT conversations. Enterprise has a Compliance API, but that doesn't apply to a personal/Plus account. Browser-session scrapers exist, but they rely on session tokens, so I didn't use them.
- Supported path: the **official export**. **Swade's one step:** ChatGPT → Settings → Data controls → **Export data** → Confirm. An email ("Your data export is ready") arrives at his ChatGPT login email, usually within minutes (up to 7 days). The link expires after 24 hours and must be downloaded while signed in to ChatGPT. Then either save the ZIP and send it to Big Mamma, or Big Mamma downloads it in the box browser (Swade signs in once) and copies it to `inbox/chatgpt/`. The import is automatic after that.
- To stay current, repeat the export now and then (for example monthly). Re-imports dedupe.

### 3) Claude
- **There's no API for personal claude.ai chat history.** The Anthropic Compliance API (`/v1/compliance/apps/chats`) exists, but only for Team/Enterprise org owners with a compliance key. If Swade ever moves to a Claude Team/Enterprise org, I can add a scheduled API pull that needs no manual step.
- Supported path: the **official export**. **Swade's one step:** claude.ai (web or Desktop, not the phone app) → Settings → **Privacy** → **Export data**. The download link is emailed to the Claude account email, expires after 24 hours, and needs him signed in. Then it goes into `inbox/claude/` the same way as ChatGPT.
- Note: Claude Code / agent sessions that Claude runs on SWADEBASE are separate. If Swade wants those archived, the agent can drop a session JSON in `inbox/bigmamma/`-style format with `assistant: claude` (small extension; not built).

## How Swade (or any agent) reviews it
- Browse: `/opt/swadebase/docs/chats/INDEX.md`, newest first, grouped by assistant. Each conversation is one readable page.
- Query (on SWADEBASE):
  ```sql
  select * from chat_archive.v_conversations order by started_ct desc limit 20;
  select * from chat_archive.search('omniroute deploy');
  select at_ct, assistant, role, left(content,200) from chat_archive.v_timeline
   where at_ct::date = '2026-10-29' order by at_ct;
  ```
  Shell: `docker exec -it supabase-db psql -U postgres -d postgres -c "select * from chat_archive.search('rea')"`

## Blockers / open items
1. **ChatGPT export:** Swade has to click Export once (and the ZIP download needs his ChatGPT sign-in).
2. **Claude export:** same, from Settings → Privacy (web or Desktop).
3. **Big Mamma transcripts:** the parent/Swade needs to approve adding the "drop session file" step to call wrap-ups and to the nightly routine. Until then, only daily summaries flow in.
4. Not yet mirrored to the hub repo (swade-ecosystem-hub). The tools live only on SWADEBASE (`/opt/swadebase/tools/chat-archive`). Copy of the sources: box `/workspace/chat-archive/`. A docs/tools PR to the hub is the suggested next step.
5. No UI in SSS Brain yet. An owner-only "Chat archive" page reading `chat_archive.v_conversations` would be a small follow-up.
6. Privacy: exports contain everything Swade ever typed. Redaction covers common secret formats, but not every possible secret (for example a password typed in plain prose). Access stays owner-only.

## Rollback
`systemctl disable --now swadebase-chat-archive.timer; rm /etc/systemd/system/swadebase-chat-archive.*; docker exec supabase-db psql -U postgres -d postgres -c "drop schema chat_archive cascade"; rm -r /opt/swadebase/tools/chat-archive /opt/swadebase/docs/chats /opt/swadebase/chat-imports`
