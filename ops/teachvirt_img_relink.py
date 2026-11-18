#!/usr/bin/env python3
"""TeachVirt image relink (2026-10-28).
Files already exist in SWADEBASE storage; DB still points at old Lovable cloud
(cjrdumbalppujuqqkiqw). Backs up, re-signs forge-images paths with SWADEBASE's
key, rewrites teachvirt.lessons.content and teachvirt.courses.thumbnail_url.
Usage: teachvirt_img_relink.py [--apply]   (dry run by default). Never prints secrets.
"""
import json, re, subprocess, sys, urllib.request

APPLY = "--apply" in sys.argv
DOCKER = "/opt/swadebase/docker"
OLD = "https://cjrdumbalppujuqqkiqw.supabase.co/storage/v1"
NEW = "https://swadebase.cloud/storage/v1"
TEN_YEARS = 60 * 60 * 24 * 365 * 10

def env(name):
    for line in open(f"{DOCKER}/.env"):
        if line.startswith(name + "="):
            return line.split("=", 1)[1].strip().strip('"')
    raise SystemExit(f"{name} missing")

def psql(sql, tuples=True):
    args = ["docker", "compose", "exec", "-T", "db", "psql", "-U", "postgres", "-v", "ON_ERROR_STOP=1"]
    if tuples: args += ["-tA"]
    r = subprocess.run(args, input=sql, cwd=DOCKER, capture_output=True, text=True)
    if r.returncode: raise SystemExit("psql error: " + r.stderr[:500])
    return r.stdout

key = env("SERVICE_ROLE_KEY")
paths = [p for p in psql("""
select distinct split_part(m[1],'?',1) from teachvirt.lessons l,
regexp_matches(l.content::text, 'cjrdumbalppujuqqkiqw\\.supabase\\.co/storage/v1/object/(?:sign|public)/forge-images/([^\\s\\)"''\\\\]+)', 'g') m;
""").splitlines() if p]
print("paths to re-sign:", len(paths))

mapping = {}
for i in range(0, len(paths), 100):
    chunk = paths[i:i+100]
    req = urllib.request.Request(
        "http://localhost:18000/storage/v1/object/sign/forge-images",
        data=json.dumps({"paths": chunk, "expiresIn": TEN_YEARS}).encode(),
        headers={"Authorization": f"Bearer {key}", "apikey": key, "Content-Type": "application/json"})
    for item in json.load(urllib.request.urlopen(req)):
        if item.get("error") or not item.get("signedURL"):
            raise SystemExit(f"sign failed for {item.get('path')}: {item.get('error')}")
        mapping[item["path"]] = NEW + item["signedURL"]
print("signed:", len(mapping))

# verify a sample actually serves
sample = next(iter(mapping.values()))
code = urllib.request.urlopen(urllib.request.Request(sample, method="GET")).status
print("sample fetch:", code)
if code != 200: raise SystemExit("sample did not serve; aborting")

if not APPLY:
    print("dry run only; re-run with --apply"); sys.exit(0)

pat = re.compile(r'https://cjrdumbalppujuqqkiqw\.supabase\.co/storage/v1/object/(?:sign|public)/forge-images/([^?\s)"\'\\]+)(?:\?token=[A-Za-z0-9._\-]+)?')
out = psql("select json_build_object('id',id,'c',content::text) from teachvirt.lessons where content::text like '%cjrdumbalppujuqqkiqw%';")
stmts, missing = [], 0
for line in out.splitlines():
    if not line.strip(): continue
    row = json.loads(line)
    def sub(m):
        global missing
        u = mapping.get(m.group(1))
        if not u: missing += 1; return m.group(0)
        return u
    c = pat.sub(sub, row["c"])
    if "$tvx$" in c: raise SystemExit("delimiter collision")
    stmts.append(f"update teachvirt.lessons set content = $tvx${c}$tvx$::jsonb where id = '{row['id']}';")
print("lessons to update:", len(stmts), "unmapped urls:", missing)
if missing: raise SystemExit("unmapped urls; aborting")
sql = ("begin;\n"
 "create table if not exists teachvirt._bak_lessons_content_20261028 as select id, content from teachvirt.lessons;\n"
 "create table if not exists teachvirt._bak_courses_thumb_20261028 as select id, thumbnail_url from teachvirt.courses;\n"
 + "\n".join(stmts) +
 f"\nupdate teachvirt.courses set thumbnail_url = replace(thumbnail_url, '{OLD}', '{NEW}') where thumbnail_url like '{OLD}%';\n"
 "select 'lessons still old: ' || count(*) from teachvirt.lessons where content::text like '%cjrdumbalppujuqqkiqw%';\n"
 "select 'covers still old: ' || count(*) from teachvirt.courses where thumbnail_url like '%cjrdumbalppujuqqkiqw%';\n"
 "commit;\n")
print(psql(sql))
