#!/usr/bin/env python3
"""Import the founder's own ElevenLabs voices into ReSing Lab (schema resinglab).

Brings in voices he made (cloned, his own professional clone, generated/designed).
Skips ElevenLabs stock voices and other people's library voices.
Archives a reference clip per voice into SWADEBASE storage so the voice can later
be re-trained on our own engine. Safe to re-run: existing voices are updated.
Keys are read from the running containers / .env at run time, never stored here.
"""
import json, subprocess, sys, urllib.request, urllib.error

FOUNDER = "f6e059a4-ea87-46ac-9b8e-cda2b047b979"
BUCKET = "resinglab"
STORAGE = "http://127.0.0.1:18000/storage/v1/object"

def sh(*a, inp=None):
    return subprocess.run(a, input=inp, capture_output=True, text=True)

XI = sh("docker", "exec", "supabase-edge-functions", "printenv", "ELEVENLABS_API_KEY").stdout.strip()
SERVICE = ""
for line in open("/opt/swadebase/docker/.env"):
    if line.startswith("SERVICE_ROLE_KEY="):
        SERVICE = line.split("=", 1)[1].strip()
if not XI or not SERVICE:
    sys.exit("missing ElevenLabs key or service key")

def get(url, headers=None, raw=False):
    r = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(r, timeout=90) as f:
        b = f.read()
    return b if raw else json.loads(b)

def put(path, data, ctype):
    r = urllib.request.Request(f"{STORAGE}/{BUCKET}/{path}", data=data, method="POST", headers={
        "Authorization": f"Bearer {SERVICE}", "apikey": SERVICE, "Content-Type": ctype, "x-upsert": "true"})
    with urllib.request.urlopen(r, timeout=180) as f:
        f.read()

def psql(sql):
    p = sh("docker", "exec", "-i", "supabase-db", "psql", "-U", "postgres", "-At", "-v", "ON_ERROR_STOP=1", inp=sql)
    if p.returncode:
        raise RuntimeError(p.stderr.strip()[:300])
    return p.stdout.strip()

def q(s):
    return "'" + str(s).replace("'", "''") + "'"

voices = get("https://api.elevenlabs.io/v2/voices?page_size=100", {"xi-api-key": XI})["voices"]
mine = [v for v in voices if v.get("category") in ("cloned", "generated")
        or (v.get("category") == "professional" and v.get("samples"))]
print(f"{len(voices)} voices on the account, {len(mine)} created by the founder")

ok = 0
for v in mine:
    vid, name, cat = v["voice_id"], v["name"].strip(), v.get("category")
    refs = []
    try:
        for s in (v.get("samples") or [])[:3]:
            audio = get(f"https://api.elevenlabs.io/v1/voices/{vid}/samples/{s['sample_id']}/audio", {"xi-api-key": XI}, raw=True)
            path = f"{FOUNDER}/voices/elevenlabs/{vid}/sample-{s['sample_id']}.mp3"
            put(path, audio, s.get("mime_type") or "audio/mpeg")
            refs.append(path)
        if v.get("preview_url"):
            path = f"{FOUNDER}/voices/elevenlabs/{vid}/preview.mp3"
            put(path, get(v["preview_url"], raw=True), "audio/mpeg")
            refs.append(path)
    except Exception as e:  # keep the voice even if a clip cannot be archived
        print(f"  ! {name}: clip archive problem: {str(e)[:120]}")
    labels = v.get("labels") or {}
    desc = (v.get("description") or "").strip()
    if len(desc) < 20:
        desc = (f"{name}. Imported ElevenLabs {cat} voice. " + " ".join(f"{k}: {val}." for k, val in labels.items())).strip()
    desc = desc[:1000].ljust(20, ".")
    meta = json.dumps({"imported_from": "elevenlabs", "category": cat, "labels": labels,
                       "reference_clips": refs, "bucket": BUCKET, "imported_by": "founder_request"})
    try:
        psql(f"""
with up as (
  update resinglab.resinglab_designed_voices
     set name={q(name)}, voice_description={q(desc)}, status='saved', speech_ready=true,
         metadata=metadata || {q(meta)}::jsonb, updated_at=now()
   where user_id={q(FOUNDER)} and provider='elevenlabs' and provider_voice_id={q(vid)}
   returning 1)
insert into resinglab.resinglab_designed_voices
  (user_id, name, voice_description, provider, provider_voice_id, attestation_no_impersonation, speech_ready, status, metadata)
select {q(FOUNDER)}, {q(name)}, {q(desc)}, 'elevenlabs', {q(vid)}, true, true, 'saved', {q(meta)}::jsonb
 where not exists (select 1 from up);""")
        ok += 1
        print(f"  ok  {cat:12} {name}  ({len(refs)} clips)")
    except Exception as e:
        print(f"  FAIL {name}: {e}")
print(f"imported {ok}/{len(mine)}")
