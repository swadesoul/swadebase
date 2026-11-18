#!/usr/bin/env python3
"""List Backblaze buckets and top-level / second-level folders using SWADEBASE's key. Prints no secrets."""
import base64, json, subprocess, sys, urllib.request

def env(n):
    return subprocess.run(["docker", "exec", "supabase-edge-functions", "printenv", n], capture_output=True, text=True).stdout.strip()

kid, key = env("BACKBLAZE_KEY_ID"), env("BACKBLAZE_APPLICATION_KEY")
cfg_bucket = env("BACKBLAZE_BUCKET_NAME")
req = urllib.request.Request("https://api.backblazeb2.com/b2api/v3/b2_authorize_account",
    headers={"Authorization": "Basic " + base64.b64encode(f"{kid}:{key}".encode()).decode()})
auth = json.load(urllib.request.urlopen(req, timeout=15))
api = auth["apiInfo"]["storageApi"]
tok, acct, url = auth["authorizationToken"], auth["accountId"], api["apiUrl"]
print("key restricted to bucket:", api.get("bucketName") or "(all buckets)", "| configured BACKBLAZE_BUCKET_NAME:", cfg_bucket)

def call(ep, body):
    r = urllib.request.Request(f"{url}/b2api/v3/{ep}", data=json.dumps(body).encode(), headers={"Authorization": tok})
    return json.load(urllib.request.urlopen(r, timeout=30))

buckets = call("b2_list_buckets", {"accountId": acct, **({"bucketId": api["bucketId"]} if api.get("bucketId") else {})})["buckets"]
for b in buckets:
    print(f"\nBUCKET {b['bucketName']} ({b['bucketType']})")
    res = call("b2_list_file_names", {"bucketId": b["bucketId"], "delimiter": "/", "maxFileCount": 1000})
    tops = [f["fileName"] for f in res["files"]]
    print("  top-level:", " ".join(tops) or "(empty)")
    for t in tops:
        if t.endswith("/"):
            sub = call("b2_list_file_names", {"bucketId": b["bucketId"], "prefix": t, "delimiter": "/", "maxFileCount": 1000})
            names = [f["fileName"][len(t):] for f in sub["files"]]
            print(f"  {t} -> {len(names)} items: " + " ".join(names[:80]))
