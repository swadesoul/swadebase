"""Add `include /etc/nginx/snippets/swade-legal.conf;` to the HTTPS server block of each listed site.
Backs up every file it changes into BACKUP. Idempotent. Usage: python3 wire_nginx.py BACKUP_DIR [--apply]"""
import re, sys, shutil, pathlib

SITES = {"swadebase.cloud": "swadebase.cloud"}
INC = "include /etc/nginx/snippets/swade-legal.conf;"
backup = pathlib.Path(sys.argv[1]); apply = "--apply" in sys.argv

def blocks(text):
    """Yield (start, end) of each top-level `server {` block."""
    for m in re.finditer(r"(?m)^\s*server\s*\{", text):
        depth, i = 0, m.end() - 1
        while i < len(text):
            if text[i] == "{": depth += 1
            elif text[i] == "}":
                depth -= 1
                if depth == 0: yield m.start(), i + 1; break
            i += 1

for domain, fname in SITES.items():
    path = pathlib.Path("/etc/nginx/sites-enabled") / fname
    text = path.read_text(); new = text; changed = 0
    for start, end in sorted(blocks(text), reverse=True):
        blk = text[start:end]
        names = re.search(r"server_name([^;]*);", blk)
        if not names or not re.search(r"(^|\s)" + re.escape(domain) + r"(\s|$)", names.group(1)): continue
        if "listen 443" not in blk and "ssl_certificate" not in blk: continue
        if INC in blk: continue
        sn = re.search(r"server_name[^;]*;\n?", blk)
        blk2 = blk[:sn.end()] + "    " + INC + "  # Swade Soul legal pages\n" + blk[sn.end():]
        new = new[:start] + blk2 + new[end:]; changed += 1
    print(f"{domain}: {path.name} -> {changed} https block(s) {'updated' if apply else 'would update'}")
    if apply and changed:
        backup.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path.resolve(), backup / path.name)
        path.resolve().write_text(new)
