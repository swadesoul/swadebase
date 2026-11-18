#!/usr/bin/env python3
"""Create the standard SWADEBASE Backblaze folder layout (bucket ssworld) for every ecosystem site.
Non-destructive: only adds empty .bzEmpty folder markers + an index. Never moves/deletes files. Prints no secrets."""
import base64, json, subprocess, urllib.request, datetime

ROOT = "swadesoul/"
SUBFOLDERS = ["images", "video", "audio", "documents", "uploads", "exports", "backups"]
SITES = {  # slug: (name, domain, group)
 "swadesoul-com": ("Swade Soul", "swadesoul.com", "core"),
 "swadesoul-world": ("Swade Soul World", "swadesoul.world", "core"),
 "haroldwhaley": ("Harold Whaley", "haroldwhaley.com", "core"),
 "sssbrain": ("SSS Brain", "sssbrain.live", "control"),
 "brainiak": ("Brainiak", "", "control"),
 "swadebase": ("SWADEBASE", "swadebase.cloud", "control"),
 "swadepower": ("SwadePower", "swadepower.cloud", "control"),
 "oathloom": ("OATHLOOM", "", "control"),
 "swosting": ("SWOSTing", "", "control"),
 "swade-mail": ("Swade Mail", "mail.swadesoul.com", "control"),
 "swagents": ("SWAGENTS", "swagents.live", "control"),
 "agent-marketplace": ("Agent Marketplace", "agentmarketplace.diy", "control"),
 "sovereign-board": ("Sovereign Board", "sovereignboard.app", "business"),
 "abagale": ("ABAGALE TV", "abagale.live", "entertainment"),
 "blacktales": ("Black Tales", "blacktales.online", "entertainment"),
 "frequency-run": ("Frequency Run", "frequencyrun.space", "entertainment"),
 "beauty-culture": ("Beauty Culture", "", "entertainment"),
 "beauty-film-academy": ("Beauty Film Academy", "", "education"),
 "group-chat": ("Group Chat", "", "entertainment"),
 "swade-soul-films": ("Swade Soul Films", "", "entertainment"),
 "swideo": ("Swideo", "swideo.com", "entertainment"),
 "motion-studio": ("Motion Studio", "", "entertainment"),
 "resinglab": ("ReSing Lab", "resinglab.com", "music"),
 "maestro-radio": ("Maestro Radio", "themaestroradio.com", "music"),
 "maestro-radio-factory": ("Maestro Radio Factory", "", "music"),
 "the-league-sound": ("The League Sound", "theleaguesound.com", "music"),
 "mydistribution": ("My Distribution", "mydistribution.music", "music"),
 "sonikyn": ("Sonikyn", "sonikyn.com", "music"),
 "ai-maestro": ("AI Maestro", "", "music"),
 "shamone-swade": ("Shamone Swade", "", "music"),
 "voicestudio": ("VoiceStudio", "", "music"),
 "publiswade": ("PubliSwade", "", "music"),
 "videosaywhat": ("VideoSayWhat", "videosaywhat.com", "education"),
 "teachvirt": ("TeachVirt / VirtTeach", "teachvirt.courses", "education"),
 "groundlift": ("GroundLift", "groundlift.help", "education"),
 "dnafront": ("DNA Front", "dnafront.com", "communication"),
 "swadespace": ("SwadeSpace", "swadespace.com", "space"),
 "rhowatt": ("RhoWatt", "rhowatt.space", "space"),
 "kynavo": ("Kynavo", "kynavo.space", "space"),
 "ownmode": ("OwnMode", "ownmode.live", "business"),
 "swoney": ("Swoney", "swoney.live", "business"),
 "swadez": ("Swadez", "", "business"),
 "yourown-delivery": ("Your Own Delivery", "yourown.delivery", "business"),
 "digiseats": ("DigiSeats Pro", "digiseat.com", "business"),
 "keyvity": ("Keyvity", "", "business"),
 "thefreq": ("The Freq", "thefreq.cloud", "business"),
 "holistic-hive": ("Holistic HIVE", "", "business"),
 "seedleaker": ("SeedLeaker", "", "crypto"),
 "tokencsi": ("TokenCSI", "", "crypto"),
 "makemycoin": ("MakeMyCoin", "makemycoin.live", "crypto"),
 "xrpl-factory": ("XRPL Factory", "xrplfactory.cash", "crypto"),
 "pinhub": ("PINHUB", "pinhub.live", "crypto"),
 "digidollz": ("DigiDollz", "", "crypto"),
 "grwnx": ("GRWNx", "", "business"),
 "divyne": ("Divyne Creatives Foundation (client)", "", "client"),
}
LEGACY = {  # where older files for a site already live (left in place)
 "abagale": ["swadebase/roku-assets/", "swadebase/channel-logos/", "swadebase/bumper-assets/"],
 "blacktales": ["blacktales/", "swade-media/blacktales/", "swadebase/film-media/", "swadebase/books/"],
 "frequency-run": ["frequency-run/"],
 "maestro-radio": ["maestro/", "maestro-radio/", "maestro-alpha/", "swade-media/maestroradio/", "swadebase/maestro-radio/"],
 "resinglab": ["models/music/", "swadebase/resinglab/", "swadebase/resinglab-showcase/"],
 "sssbrain": ["sssbrain/", "paid-tools/sssbrain/"],
 "brainiak": ["media/brainiak/", "problem-fix/brainiak/"],
 "swadesoul-com": ["media/swadesoul/", "swadebase/swadesoul-site/", "brand/"],
 "swideo": ["swideo/", "swade-media/swideo/"],
 "teachvirt": ["teachvirt/", "swarvisteach/", "swadebase/course-covers/"],
 "tokencsi": ["tokencsi/"],
 "seedleaker": ["swadebase/seedleaker-project-files/"],
 "swadespace": ["swadebase/swadespace-incoming/"],
 "videosaywhat": ["swadebase/vsw-thumbnails/"],
 "swadebase": ["swadebase/", "swade-media/swadebase/", "swadebase-2/"],
}

def env(n):
    return subprocess.run(["docker", "exec", "supabase-edge-functions", "printenv", n], capture_output=True, text=True).stdout.strip()

kid, key = env("BACKBLAZE_KEY_ID"), env("BACKBLAZE_APPLICATION_KEY")
req = urllib.request.Request("https://api.backblazeb2.com/b2api/v3/b2_authorize_account",
    headers={"Authorization": "Basic " + base64.b64encode(f"{kid}:{key}".encode()).decode()})
auth = json.load(urllib.request.urlopen(req, timeout=15))
api = auth["apiInfo"]["storageApi"]; tok = auth["authorizationToken"]; url = api["apiUrl"]; bucket_id = api["bucketId"]

def call(ep, body):
    r = urllib.request.Request(f"{url}/b2api/v3/{ep}", data=json.dumps(body).encode(), headers={"Authorization": tok})
    return json.load(urllib.request.urlopen(r, timeout=30))

existing = set()
nxt = None
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
    import hashlib
    r = urllib.request.Request(up["uploadUrl"], data=data, headers={
        "Authorization": up["authorizationToken"], "X-Bz-File-Name": urllib.parse.quote(name),
        "Content-Type": ctype, "Content-Length": str(len(data)), "X-Bz-Content-Sha1": hashlib.sha1(data).hexdigest()})
    urllib.request.urlopen(r, timeout=30).read()

import urllib.parse
created = 0
for slug in SITES:
    for sub in [""] + [s + "/" for s in SUBFOLDERS]:
        folder = f"{ROOT}{slug}/{sub}"
        if folder in existing:
            continue
        put(folder + ".bzEmpty", b"", "application/octet-stream")
        created += 1

for extra in [ROOT + "swosting/sites/"]:
    if extra not in existing:
        put(extra + ".bzEmpty", b"", "application/octet-stream"); created += 1

index = {
    "bucket": "ssworld",
    "standard": "swadesoul/<site-slug>/{" + ",".join(SUBFOLDERS) + "}/...",
    "rule": "All NEW files go under swadesoul/<site-slug>/. Legacy paths stay in place until each app is migrated (moving files breaks live links).",
    "updated_utc": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "oathloom_sites": "Every site created with OATHLOOM or brought to SWOSTing (incl. client sites, migrated or hosted) is stored under swadesoul/swosting/sites/<site-slug>/{" + ",".join(SUBFOLDERS) + "}/ - SWOSTing owns these. Ecosystem-owned sites keep their own swadesoul/<site-slug>/ folder.",
    "sites": {s: {"name": n, "domain": d, "group": g, "folder": f"{ROOT}{s}/", "legacy_paths": LEGACY.get(s, [])} for s, (n, d, g) in SITES.items()},
}
put(ROOT + "_INDEX.json", json.dumps(index, indent=2).encode(), "application/json")
print(f"sites: {len(SITES)} | folder markers created: {created} | index written: {ROOT}_INDEX.json")
