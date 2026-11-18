#!/usr/bin/env python3
"""Write the chat archive as browsable Markdown: /opt/swadebase/docs/chats/<assistant>/... + INDEX.md.
Times are America/Chicago (CT). Regenerates everything each run (source of truth is Postgres)."""
import json, os, re, shutil, subprocess, sys
PSQL = os.environ.get("CHAT_ARCHIVE_PSQL", "docker exec -i supabase-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 -At -q").split()
OUT = sys.argv[1] if len(sys.argv) > 1 else "/opt/swadebase/docs/chats"
LABEL = {"big_mamma": "Big Mamma (Grok Bot)", "chatgpt": "ChatGPT", "claude": "Claude", "other": "Other"}

def q(sql):
    r = subprocess.run(PSQL, input=sql.encode(), capture_output=True, check=True)
    return json.loads(r.stdout.decode() or "null") or []

convs = q("""select json_agg(x order by x.started desc nulls last) from (
  select id, assistant, title, source, model, message_count,
         to_char(started_at at time zone 'America/Chicago','YYYY-MM-DD HH24:MI') as started,
         to_char(updated_at at time zone 'America/Chicago','YYYY-MM-DD HH24:MI') as updated
  from chat_archive.conversations) x;""")
tmp = OUT + ".tmp"
shutil.rmtree(tmp, ignore_errors=True); os.makedirs(tmp)
rows = []
for c in convs:
    msgs = q(f"""select json_agg(json_build_object('role',role,'content',content,
              'at',to_char(created_at at time zone 'America/Chicago','YYYY-MM-DD HH24:MI')) order by seq)
              from chat_archive.messages where conversation_id='{c['id']}';""")
    slug = re.sub(r"[^a-z0-9]+", "-", (c["title"] or "untitled").lower()).strip("-")[:50] or "untitled"
    day = (c["started"] or "undated")[:10]
    rel = f"{c['assistant']}/{day}_{slug}_{c['id'][:8]}.md"
    os.makedirs(os.path.join(tmp, c["assistant"]), exist_ok=True)
    with open(os.path.join(tmp, rel), "w") as f:
        f.write(f"# {c['title'] or 'Untitled'}\n\n- Assistant: {LABEL.get(c['assistant'], c['assistant'])}\n"
                f"- Started: {c['started'] or '?'} CT · Last message: {c['updated'] or '?'} CT\n"
                f"- Messages: {c['message_count']} · Source: {c['source']}" + (f" · Model: {c['model']}" if c.get('model') else "") +
                f"\n- Archive id: `{c['id']}`\n\n---\n")
        for m in msgs:
            who = {"user": "**Swade**", "assistant": f"**{LABEL.get(c['assistant'],'Assistant')}**", "summary": "**Summary**"}.get(m["role"], f"**{m['role']}**")
            f.write(f"\n{who} · {m['at'] or ''} CT\n\n{m['content']}\n")
    rows.append((c, rel))
with open(os.path.join(tmp, "INDEX.md"), "w") as f:
    f.write("# Chat archive (SWADEBASE)\n\nEvery saved conversation with Big Mamma (Grok Bot), ChatGPT and Claude, newest first. "
            "Times are Central (CT). Secrets were removed before saving. Source of truth: Postgres schema `chat_archive` "
            "(see /opt/swadebase/docs/CHAT_LOGGING_SWADEBASE.md).\n\n")
    for a in ("big_mamma", "chatgpt", "claude", "other"):
        sub = [r for r in rows if r[0]["assistant"] == a]
        f.write(f"## {LABEL[a]} ({len(sub)})\n\n")
        if not sub: f.write("_Nothing imported yet._\n\n"); continue
        f.write("| Started (CT) | Title | Messages |\n|---|---|---|\n")
        for c, rel in sub:
            t = (c["title"] or "Untitled").replace("|", "/")
            f.write(f"| {c['started'] or '?'} | [{t}]({rel}) | {c['message_count']} |\n")
        f.write("\n")
shutil.rmtree(OUT, ignore_errors=True); os.rename(tmp, OUT)
print(json.dumps({"written": len(rows), "dir": OUT}))
