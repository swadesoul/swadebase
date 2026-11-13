"""Build the Swade Soul legal pages (Oct 30, 2026, Claude for Swade).
Sources: ./src/*.md (edit these, or regenerate from On Your Terms later). Output: /var/www/swade-legal/*.html
Served on every site that includes /etc/nginx/snippets/swade-legal.conf at /terms, /privacy, /product-terms.
Run: .venv/bin/python build.py"""
import re, pathlib, markdown

HERE = pathlib.Path(__file__).parent
OUT = pathlib.Path("/var/www/swade-legal")
PAGES = {"terms": ("Terms of Service", "01-master-terms.md"),
         "product-terms": ("Product Terms", "02-product-terms.md"),
         "privacy": ("Privacy Policy", "03-privacy-policy.md")}
CSS = """
:root{--bg:#ffffff;--text:#1b1d22;--muted:#5d6370;--line:#e3e5ea;--accent:#7a4ad8;--soft:#f5f6f8}
@media (prefers-color-scheme:dark){:root{--bg:#0f1115;--text:#e9ebef;--muted:#9aa1ad;--line:#262a33;--accent:#b79bff;--soft:#171a20}}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--text);font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
header{border-bottom:1px solid var(--line);position:sticky;top:0;background:var(--bg);z-index:2}
.bar{max-width:820px;margin:0 auto;padding:12px 16px;display:flex;gap:16px;align-items:center;flex-wrap:wrap}
.brand{font-weight:700;letter-spacing:.02em;margin-right:auto}
nav a{color:var(--muted);text-decoration:none;font-size:14px;margin-left:14px}nav a.on,nav a:hover{color:var(--text)}
#back{font-size:14px;color:var(--accent);text-decoration:none}
main{max-width:820px;margin:0 auto;padding:24px 16px 72px}
h1{font-size:30px;line-height:1.2;margin:8px 0 4px}h2{font-size:22px;margin:40px 0 8px;padding-top:12px;border-top:1px solid var(--line)}h3{font-size:18px;margin:28px 0 6px}
a{color:var(--accent)}
table{border-collapse:collapse;width:100%;margin:12px 0;font-size:15px}th,td{border:1px solid var(--line);padding:8px 10px;text-align:left}th{background:var(--soft)}
footer{max-width:820px;margin:0 auto;padding:24px 16px 48px;color:var(--muted);font-size:13px;border-top:1px solid var(--line)}
@media print{header,#back{display:none}}
"""

def build():
    OUT.mkdir(parents=True, exist_ok=True)
    for slug, (title, src) in PAGES.items():
        md = (HERE / "src" / src).read_text()
        md = re.sub(r"^# .*\n", "", md, count=1)
        body = markdown.markdown(md, extensions=["tables", "sane_lists"])
        nav = "".join(f'<a href="/{s}"{" class=on" if s == slug else ""}>{t}</a>' for s, (t, _) in PAGES.items())
        page = f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title} · Swade Soul</title><meta name="description" content="{title} for Swade Soul Enterprise LLC services."><style>{CSS}</style></head>
<body><header><div class="bar"><span class="brand">Swade Soul</span><a id="back" href="/">← Back</a><nav>{nav}</nav></div></header>
<main><h1>{title}</h1>{body}</main>
<footer>Swade Soul Enterprise LLC · 30 N Gould St, Ste R, Sheridan, WY 82801 · <a href="mailto:legal@brainiak.live">legal@brainiak.live</a></footer>
<script>try{{var h=location.hostname.replace(/^www\\./,'');document.getElementById('back').textContent='← Back to '+h;}}catch(e){{}}</script>
</body></html>"""
        (OUT / f"{slug}.html").write_text(page)
        print(slug, len(page))

if __name__ == "__main__":
    build()
