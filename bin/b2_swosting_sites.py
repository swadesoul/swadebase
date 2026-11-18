#!/usr/bin/env python3
"""SWOSTing storage provisioner (runs every 10 min via systemd timer on swadesoul).
Rule: every site created with OATHLOOM or brought to SWOSTing gets
  swadesoul/swosting/sites/<site-slug>/{images,video,audio,documents,uploads,exports,backups}/
in Backblaze bucket ssworld. Non-destructive: only adds empty folder markers + a manifest. Prints no secrets."""
import base64, datetime, hashlib, json, re, subprocess, urllib.parse, urllib.request

ROOT = "swadesoul/swosting/sites/"
SUBFOLDERS = ["images", "video", "audio", "documents", "uploads", "exports", "backups"]

def sh(args):
    return subprocess.run(args, capture_output=True, text=True).stdout

def env(n):
    return sh(["docker", "exec", "supabase-edge-functions", "printenv", n]).strip()

def q(sql):
    out = sh(["docker", "exec", "supabase-db", "psql", "-U", "postgres", "-d", "postgres", "-t", "-A", "-F", "\t", "-c", sql])
    return [l.split("\t") for l in out.splitlines() if l.strip()]

def slugify(s):
    s = re.sub(r"[^a-z0-9]+", "-", (s or "").lower()).strip("-")
    return s[:63].strip("-")

def host_slug(url):
    host = urllib.parse.urlparse(url if "://" in (url or "") else f"https://{url}").hostname or ""
    return slugify(host)

sites = {}  # slug -> info
def add(slug, info):
    slug = slugify(slug)
    if slug and slug not in sites:
        sites[slug] = info

for pid, slug, pub, sub, name in q("select id, coalesce(slug,''), coalesce(public_slug,''), coalesce(showcase_subdomain,''), coalesce(name,'') from oathloom.projects_v2"):
    add(sub or pub or slug or name, {"source": "oathloom", "project_id": pid, "name": name})
for sid, name, url in q("select id, coalesce(name,''), coalesce(url,'') from swosting.app_sites"):
    add(host_slug(url) if url else name, {"source": "swosting", "site_id": sid, "name": name, "url": url})
for eid, sub, title, url in q("select id, coalesce(subdomain,''), coalesce(title,''), coalesce(url,'') from swosting.showcase_entries"):
    add(sub or title, {"source": "swosting-showcase", "entry_id": eid, "name": title, "url": url})

kid, key = env("BACKBLAZE_KEY_ID"), env("BACKBLAZE_APPLICATION_KEY")
auth = json.load(urllib.request.urlopen(urllib.request.Request(
    "https://api.backblazeb2.com/b2api/v3/b2_authorize_account",
    headers={"Authorization": "Basic " + base64.b64encode(f"{kid}:{key}".encode()).decode()}), timeout=15))
api = auth["apiInfo"]["storageApi"]; tok = auth["authorizationToken"]; url = api["apiUrl"]; bucket_id = api["bucketId"]

def call(ep, body):
    return json.load(urllib.request.urlopen(urllib.request.Request(
        f"{url}/b2api/v3/{ep}", data=json.dumps(body).encode(), headers={"Authorization": tok}), timeout=30))

existing, nxt = set(), None
while True:
    body = {"bucketId": bucket_id, "prefix": ROOT, "maxFileCount": 10000}
    if nxt: body["startFileName"] = nxt
    res = call("b2_list_file_names", body)
    for f in res["files"]:
        parts = f["fileName"][len(ROOT):].split("/")
        for i in range(1, len(parts)):
            existing.add(ROOT + "/".join(parts[:i]) + "/")
    nxt = res.get("nextFileName")
    if not nxt: break

up = call("b2_get_upload_url", {"bucketId": bucket_id})
def put(name, data, ctype):
    urllib.request.urlopen(urllib.request.Request(up["uploadUrl"], data=data, headers={
        "Authorization": up["authorizationToken"], "X-Bz-File-Name": urllib.parse.quote(name),
        "Content-Type": ctype, "Content-Length": str(len(data)),
        "X-Bz-Content-Sha1": hashlib.sha1(data).hexdigest()}), timeout=30).read()

created, new_sites = 0, []
for slug in sorted(sites):
    if ROOT + slug + "/" not in existing:
        new_sites.append(slug)
    for sub in [""] + [s + "/" for s in SUBFOLDERS]:
        folder = f"{ROOT}{slug}/{sub}"
        if folder not in existing:
            put(folder + ".bzEmpty", b"", "application/octet-stream"); created += 1

manifest = {
    "rule": "Every site created with OATHLOOM or brought to SWOSTing lives under swadesoul/swosting/sites/<site-slug>/{" + ",".join(SUBFOLDERS) + "}/",
    "updated_utc": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "sources": ["oathloom.projects_v2", "swosting.app_sites", "swosting.showcase_entries"],
    "sites": {s: {**sites[s], "folder": f"{ROOT}{s}/"} for s in sorted(sites)},
}
data = json.dumps(manifest, indent=2).encode()
put(ROOT + "_SITES.json", data, "application/json")
print(f"[{manifest['updated_utc']}] sites={len(sites)} new_sites={len(new_sites)} markers_created={created}" + (f" new: {' '.join(new_sites)}" if new_sites else ""))
