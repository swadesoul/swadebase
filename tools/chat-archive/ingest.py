#!/usr/bin/env python3
"""SWADEBASE chat archive ingest.

Usage (on SWADEBASE, as root):
  ingest.py chatgpt  <export.zip | conversations.json>
  ingest.py claude   <export.zip | conversations.json | conversations.jsonl>
  ingest.py bigmamma <session.json | session.jsonl>
  ingest.py daily    [/opt/swadebase/docs/daily]      # Big Mamma daily summaries
  ingest.py --dry-run ...                             # parse + redact, print counts, write nothing

Secrets are redacted BEFORE anything leaves this process. Re-running is safe (dedup on ids).
"""
import hashlib, io, json, os, re, secrets, subprocess, sys, zipfile
from datetime import datetime, timezone

PSQL = os.environ.get("CHAT_ARCHIVE_PSQL", "docker exec -i supabase-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 -At -q").split()

# ---------------------------------------------------------------- redaction
_PATTERNS = [
    ("private_key", re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----.*?-----END [A-Z ]*PRIVATE KEY-----", re.S)),
    ("openai_key", re.compile(r"\bsk-(?:proj-|ant-|svcacct-)?[A-Za-z0-9_\-]{20,}")),
    ("stripe_key", re.compile(r"\b(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]{16,}")),
    ("stripe_webhook", re.compile(r"\bwhsec_[A-Za-z0-9]{16,}")),
    ("github_token", re.compile(r"\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})")),
    ("slack_token", re.compile(r"\bxox[abprs]-[A-Za-z0-9\-]{10,}")),
    ("aws_key", re.compile(r"\b(?:AKIA|ASIA)[0-9A-Z]{16}\b")),
    ("google_key", re.compile(r"\bAIza[0-9A-Za-z_\-]{35}\b")),
    ("resend_key", re.compile(r"\bre_[A-Za-z0-9]{8,}_[A-Za-z0-9]{16,}")),
    ("hf_token", re.compile(r"\bhf_[A-Za-z0-9]{30,}")),
    ("jwt", re.compile(r"\beyJ[A-Za-z0-9_\-]{10,}\.eyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}")),
    ("bearer", re.compile(r"(?i)\b(bearer\s+)[A-Za-z0-9._~+/\-]{20,}=*")),
    ("url_password", re.compile(r"(\b[a-z][a-z0-9+.\-]*://[^\s:/@]+:)[^\s@/]{3,}(@)", re.I)),
    ("assignment", re.compile(r"(?i)\b((?:[A-Z0-9_]*_)?(?:password|passwd|pwd|secret|api[_\-]?key|access[_\-]?key|auth[_\-]?token|token|passphrase|client[_\-]?secret|private[_\-]?key)[A-Z0-9_]*\s*[:=]\s*[\"']?)([^\s\"']{6,})")),
]
_CARD = re.compile(r"\b\d(?:[ \-]?\d){12,18}\b")

def _luhn(d):
    s, alt = 0, False
    for ch in reversed(d):
        n = int(ch)
        if alt:
            n *= 2
            if n > 9: n -= 9
        s += n; alt = not alt
    return s % 10 == 0

def redact(text):
    if not text: return "", 0
    count = 0
    for name, rx in _PATTERNS:
        def sub(m, name=name):
            nonlocal count; count += 1
            if name in ("bearer",): return m.group(1) + "[REDACTED:token]"
            if name == "url_password": return m.group(1) + "[REDACTED]" + m.group(2)
            if name == "assignment": return m.group(1) + "[REDACTED]"
            return f"[REDACTED:{name}]"
        text = rx.sub(sub, text)
    def card(m):
        nonlocal count
        digits = re.sub(r"\D", "", m.group(0))
        if re.match(r"20\d{2}(0[1-9]|1[0-2])([0-2]\d|3[01])", digits):  # timestamps like 20261026T...
            return m.group(0)
        if 13 <= len(digits) <= 19 and digits[0] in "3456" and _luhn(digits):
            count += 1; return "[REDACTED:card]"
        return m.group(0)
    text = _CARD.sub(card, text)
    return text, count

# ---------------------------------------------------------------- helpers
def ts(v):
    if v in (None, "", 0): return None
    if isinstance(v, (int, float)): return datetime.fromtimestamp(float(v), tz=timezone.utc).isoformat()
    s = str(v)
    try: return datetime.fromisoformat(s.replace("Z", "+00:00")).isoformat()
    except ValueError: return None

def sha(*parts): return hashlib.sha256("\x1f".join(str(p) for p in parts).encode()).hexdigest()

def msg(seq, role, content, created_at=None, ext_id=None, author=None, meta=None):
    clean, n = redact(content)
    h = sha(clean)
    return {"seq": seq, "role": role, "content": clean, "created_at": created_at, "content_hash": h,
            "external_id": ext_id or sha(role, created_at, h), "author": author, "redactions": n, "meta": meta or {}}

def read_inputs(path, want):
    """Yield (name, bytes) for json/jsonl files inside a zip, or the file itself."""
    if zipfile.is_zipfile(path):
        with zipfile.ZipFile(path) as z:
            for n in sorted(z.namelist()):
                b = os.path.basename(n).lower()
                if b.endswith((".json", ".jsonl")) and want(b): yield n, z.read(n)
    else:
        with open(path, "rb") as f: yield path, f.read()

def load_json_any(raw):
    raw = raw.decode("utf-8", "replace").strip()
    if not raw: return []
    try: return json.loads(raw)
    except json.JSONDecodeError:
        return [json.loads(l) for l in raw.splitlines() if l.strip()]

# ---------------------------------------------------------------- ChatGPT
def _gpt_text(content):
    if not content: return ""
    ct = content.get("content_type")
    if ct in ("tether_browsing_display", "tether_quote", "system_error"): return ""
    out = []
    for p in content.get("parts") or []:
        if isinstance(p, str): out.append(p)
        elif isinstance(p, dict):
            if p.get("content_type") == "image_asset_pointer": out.append("[image]")
            elif "text" in p: out.append(str(p["text"]))
            elif p.get("content_type"): out.append(f"[{p['content_type']}]")
    if not out and content.get("text"): out.append(content["text"])
    if not out and ct == "user_editable_context": return ""
    return "\n".join(x for x in out if x).strip()

def parse_chatgpt(path):
    def want(b): return b.startswith("conversations") or b == "chatgpt-export.json"
    for _, raw in read_inputs(path, want):
        data = load_json_any(raw)
        if isinstance(data, dict): data = data.get("conversations", [])
        for conv in data:
            inner = conv.get("conversation") if isinstance(conv.get("conversation"), dict) else conv
            mapping = inner.get("mapping") or {}
            if not mapping: continue
            node = inner.get("current_node") or conv.get("current_node")
            chain = []
            seen = set()
            while node and node in mapping and node not in seen:
                seen.add(node); chain.append(mapping[node]); node = mapping[node].get("parent")
            if not chain:  # fallback: time order
                chain = sorted(mapping.values(), key=lambda n: ((n.get("message") or {}).get("create_time") or 0))
            else:
                chain.reverse()
            msgs = []
            for n in chain:
                m = n.get("message")
                if not m: continue
                md = m.get("metadata") or {}
                if md.get("is_visually_hidden_from_conversation"): continue
                role = (m.get("author") or {}).get("role", "assistant")
                if role not in ("user", "assistant", "system", "tool"): role = "tool"
                text = _gpt_text(m.get("content"))
                if not text or (role == "system" and not text.strip()): continue
                msgs.append(msg(len(msgs), role, text, ts(m.get("create_time")), m.get("id") or n.get("id"),
                                (m.get("author") or {}).get("name"), {"model": md.get("model_slug")} if md.get("model_slug") else None))
            cid = conv.get("id") or conv.get("conversation_id") or inner.get("conversation_id") or sha(conv.get("title"), conv.get("create_time"))
            title, _ = redact(conv.get("title") or inner.get("title") or "")
            yield {"assistant": "chatgpt", "source": "chatgpt_export", "external_id": cid, "title": title,
                   "started_at": ts(conv.get("create_time") or inner.get("create_time")),
                   "updated_at": ts(conv.get("update_time") or inner.get("update_time")),
                   "model": inner.get("default_model_slug"), "messages": msgs,
                   "meta": {"gizmo_id": inner.get("gizmo_id")} if inner.get("gizmo_id") else {}}

# ---------------------------------------------------------------- Claude
def _claude_text(m):
    parts = []
    for c in m.get("content") or []:
        t = c.get("type")
        if t == "text" and c.get("text"): parts.append(c["text"])
        elif t == "tool_use": parts.append(f"[tool_use {c.get('name','')}]")
        elif t == "tool_result": parts.append("[tool_result]")
        elif t == "thinking": continue
    text = "\n".join(parts).strip() or (m.get("text") or "").strip()
    for a in (m.get("attachments") or []) + (m.get("files") or []):
        name = a.get("file_name") or a.get("file_uuid") or "file"
        text += f"\n[attachment: {name}]"
    return text.strip()

def parse_claude(path):
    def want(b): return b.startswith("conversations")
    for _, raw in read_inputs(path, want):
        data = load_json_any(raw)
        if isinstance(data, dict): data = data.get("conversations", [data])
        for conv in data:
            if "chat_messages" not in conv: continue
            msgs = []
            for m in sorted(conv.get("chat_messages") or [], key=lambda x: (x.get("created_at") or "", x.get("index") or 0)):
                text = _claude_text(m)
                if not text: continue
                role = {"human": "user", "assistant": "assistant"}.get(m.get("sender"), "assistant")
                msgs.append(msg(len(msgs), role, text, ts(m.get("created_at")), m.get("uuid")))
            title, _ = redact(conv.get("name") or "")
            yield {"assistant": "claude", "source": "claude_export", "external_id": conv.get("uuid") or sha(title, conv.get("created_at")),
                   "title": title, "started_at": ts(conv.get("created_at")), "updated_at": ts(conv.get("updated_at")),
                   "model": conv.get("model"), "summary": (redact(conv.get("summary") or "")[0] or None), "messages": msgs,
                   "meta": {"project_uuid": (conv.get("project") or {}).get("uuid")} if conv.get("project") else {}}

# ---------------------------------------------------------------- Big Mamma (Grok Bot) sessions
def parse_bigmamma(path):
    """Accepts:
       - JSON: {"external_id","title","started_at","channel","summary","messages":[{"role","content","created_at"}]}
       - JSONL: one message per line with "session_id" (+ optional "title","channel"), grouped by session_id."""
    data = load_json_any(open(path, "rb").read())
    sessions = {}
    if isinstance(data, dict): data = [data]
    for row in data:
        if "messages" in row:
            sessions[row.get("external_id") or row.get("session_id")] = row
        else:
            sid = row.get("session_id") or "unknown"
            s = sessions.setdefault(sid, {"external_id": sid, "title": row.get("title", ""), "channel": row.get("channel"), "messages": []})
            s["messages"].append(row)
    for sid, s in sessions.items():
        msgs = []
        for m in s.get("messages") or []:
            role = m.get("role", "assistant")
            if role not in ("user", "assistant", "system", "tool", "summary"): role = "assistant"
            if not (m.get("content") or "").strip(): continue
            msgs.append(msg(len(msgs), role, m["content"], ts(m.get("created_at")), m.get("id")))
        times = [m["created_at"] for m in msgs if m["created_at"]]
        title, _ = redact(s.get("title") or "")
        yield {"assistant": "big_mamma", "source": s.get("source") or "grokbot_session", "external_id": str(sid or sha(title)),
               "title": title, "started_at": ts(s.get("started_at")) or (min(times) if times else None),
               "updated_at": max(times) if times else ts(s.get("started_at")),
               "summary": redact(s.get("summary") or "")[0] or None, "messages": msgs,
               "meta": {k: s[k] for k in ("channel", "call_id") if s.get(k)}}

def parse_daily(folder):
    folder = folder or "/opt/swadebase/docs/daily"
    for name in sorted(os.listdir(folder)):
        if not re.match(r"\d{4}-\d{2}-\d{2}.*\.md$", name): continue
        text = open(os.path.join(folder, name), encoding="utf-8", errors="replace").read()
        day = name[:10]
        # one message per top-level section so the archive is browsable
        chunks = [c for c in re.split(r"\n(?=## )", text) if c.strip()]
        msgs = [msg(i, "summary", c.strip(), f"{day}T23:45:00-05:00", f"{name}#{i}") for i, c in enumerate(chunks)]
        yield {"assistant": "big_mamma", "source": "grokbot_daily_summary", "external_id": f"daily:{name}",
               "title": f"Daily work summary {name[:-3]}", "started_at": f"{day}T00:00:00-05:00",
               "updated_at": f"{day}T23:59:00-05:00", "messages": msgs, "replace_messages": True,
               "meta": {"file": f"/opt/swadebase/docs/daily/{name}"}}

# ---------------------------------------------------------------- write
def write(convs, assistant, source_file, dry):
    stmts, nconv, nred = [], 0, 0
    for c in convs:
        nconv += 1
        nred += sum(m["redactions"] for m in c["messages"])
        tag = "j" + secrets.token_hex(6)
        stmts.append(f"select chat_archive.ingest_conversation(${tag}${json.dumps(c, ensure_ascii=False)}${tag}$::jsonb);")
    fsha = None
    if source_file and os.path.isfile(source_file):
        fsha = hashlib.sha256(open(source_file, "rb").read()).hexdigest()
    if dry:
        print(json.dumps({"assistant": assistant, "conversations": nconv, "messages": sum(1 for s in stmts), "redactions": nred, "dry_run": True}))
        return
    sql = "\n".join(stmts)
    out = subprocess.run(PSQL, input=sql.encode(), capture_output=True)
    if out.returncode != 0:
        sys.stderr.write(out.stderr.decode()); sys.exit(1)
    new = sum(int(x) for x in out.stdout.decode().split() if x.strip().isdigit())
    log = (f"insert into chat_archive.ingest_runs(assistant, source_file, file_sha256, conversations, new_messages, redactions) "
           f"values ('{assistant}', $f${source_file or ''}$f$, {('$h$'+fsha+'$h$') if fsha else 'null'}, {nconv}, {new}, {nred});")
    subprocess.run(PSQL, input=log.encode(), check=True, capture_output=True)
    print(json.dumps({"assistant": assistant, "conversations": nconv, "new_messages": new, "redactions": nred}))

def main(argv):
    dry = "--dry-run" in argv
    argv = [a for a in argv if a != "--dry-run"]
    if len(argv) < 1: print(__doc__); sys.exit(2)
    kind, path = argv[0], (argv[1] if len(argv) > 1 else None)
    parsers = {"chatgpt": (parse_chatgpt, "chatgpt"), "claude": (parse_claude, "claude"),
               "bigmamma": (parse_bigmamma, "big_mamma"), "daily": (parse_daily, "big_mamma")}
    if kind not in parsers: print(__doc__); sys.exit(2)
    fn, assistant = parsers[kind]
    write(fn(path), assistant, path, dry)

if __name__ == "__main__":
    main(sys.argv[1:])
