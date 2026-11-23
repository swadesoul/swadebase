#!/usr/bin/env python3
"""Maestro DJ voice seeding - ElevenLabs once, our own system forever.

Phase 1  ONE ElevenLabs render (~25 s) of the DJ's seed script with the given ElevenLabs voice.
Phase 2  Seed saved permanently to Backblaze: swadesoul/maestroradio/voices/<slug>/seed-elevenlabs.mp3
Phase 3  Seed cloned into the Swade voice service (indextts2 on RunPod serverless, ref in B2).
Phase 4  Test line rendered through the CLONE (no ElevenLabs) and saved next to the seed.
Phase 5  (--apply) DJ switched to the clone in maestroradio.ai_dj_voice; previous voice kept in the log.

Usage:
  dj_voice_seed.py <dj_id> <elevenlabs_voice_id> [--script "text"] [--apply]
  dj_voice_seed.py <dj_id> --apply-profile <voice_service_profile_id>   # switch later, no new render
Never re-renders on ElevenLabs if a seed already exists for that DJ (no wasted credits).
"""
import argparse, io, json, sys, time, urllib.request, urllib.error, uuid, subprocess
from pathlib import Path

sys.path.insert(0, '/opt/swade-gpu-controller')
import voicestudio_b2 as b2  # noqa: E402  (shared B2 client used by the voice service)

def envfile(p):
    return {k: v.strip().strip('\'"') for k, v in (l.split('=', 1) for l in open(p) if '=' in l and not l.startswith('#'))}

XI_KEY = envfile('/opt/swadebase/docker/functions.env')['ELEVENLABS_API_KEY']  # 2026-11-19: one ElevenLabs account (Coolify-synced key)
VENV = envfile('/opt/swade-secrets/voice-service.env')
VURL = 'http://172.16.0.1:8790'
VTOK = VENV['VOICE_SERVICE_TOKEN']
LOG = Path('/opt/swadebase/signal/dj_voice_seed.log.jsonl')

def psql(sql):
    return subprocess.run(['docker', 'exec', 'supabase-db', 'psql', '-U', 'postgres', '-Atc', sql],
                          capture_output=True, text=True, check=True).stdout.strip()

def dj_info(dj_id):
    row = psql(f"select row_to_json(t) from (select d.id, d.name, d.slug, d.style, d.persona_brief, d.catchphrases, "
               f"(select voice_profile_id from maestroradio.ai_dj_voice v where v.dj_id=d.id) voice "
               f"from maestroradio.ai_djs d where d.id='{dj_id}') t")
    if not row: sys.exit(f'DJ {dj_id} not found')
    return json.loads(row)

def default_script(dj):
    c = dj.get('catchphrases') or []
    line1 = c[0] if c else "Stay locked in"
    line2 = c[1] if len(c) > 1 else "This is Maestro Radio"
    return (f"What's goin' on, Maestro Radio! This is {dj['name']}, and you already know... {line2} "
            f"I got the hottest records, the funniest stories, and the realest conversation in the city, "
            f"so turn it up and roll them windows down. Hold up, hold up... you hear that? "
            f"That's the sound of your day gettin' better. {line1} Stay right here, we're just gettin' started.")

def b2_key(slug, name): return f'swadesoul/maestroradio/voices/{slug}/{name}'

def b2_exists(key):
    try: b2.s3.head_object(Bucket=b2.BUCKET, Key=key); return True
    except Exception: return False

def b2_put(key, data, ctype):
    b2.s3.put_object(Bucket=b2.BUCKET, Key=key, Body=data, ContentType=ctype)

def b2_get(key):
    return b2.s3.get_object(Bucket=b2.BUCKET, Key=key)['Body'].read()

def eleven(voice_id, text):
    req = urllib.request.Request(
        f'https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=mp3_44100_128',
        data=json.dumps({'text': text, 'model_id': 'eleven_multilingual_v2',
                         'voice_settings': {'stability': 0.45, 'similarity_boost': 0.85, 'style': 0.35}}).encode(),
        headers={'xi-api-key': XI_KEY, 'content-type': 'application/json', 'accept': 'audio/mpeg'})
    try:
        return urllib.request.urlopen(req, timeout=120).read()
    except urllib.error.HTTPError as e:
        sys.exit(f'ElevenLabs {e.code}: {e.read().decode()[:300]}')

def clone(name, mp3, owner_app='maestroradio'):
    bnd = uuid.uuid4().hex
    parts = []
    for k, v in (('name', name), ('app', owner_app), ('language', 'en')):
        parts.append(f'--{bnd}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
    parts.append(f'--{bnd}\r\nContent-Disposition: form-data; name="sample"; filename="seed.mp3"\r\n'
                 f'Content-Type: audio/mpeg\r\n\r\n'.encode() + mp3 + b'\r\n')
    parts.append(f'--{bnd}--\r\n'.encode())
    req = urllib.request.Request(VURL + '/v1/voicebox/profiles', data=b''.join(parts), method='POST',
                                 headers={'authorization': f'Bearer {VTOK}', 'content-type': f'multipart/form-data; boundary={bnd}'})
    return json.load(urllib.request.urlopen(req, timeout=300))

def speak_clone(profile_id, text):
    req = urllib.request.Request(VURL + '/v1/speak', method='POST',
        data=json.dumps({'text': text, 'voice': profile_id, 'format': 'mp3'}).encode(),
        headers={'authorization': f'Bearer {VTOK}', 'content-type': 'application/json'})
    r = urllib.request.urlopen(req, timeout=900)
    return r.read(), r.headers.get('X-Engine'), r.headers.get('X-Audio-Seconds')

def apply(dj, profile_id):
    psql(f"insert into maestroradio.ai_dj_voice (dj_id, voice_profile_id, updated_at) values ('{dj['id']}', '{profile_id}', now()) "
         f"on conflict (dj_id) do update set voice_profile_id=excluded.voice_profile_id, updated_at=now()")
    log({'event': 'applied', 'dj': dj['name'], 'dj_id': dj['id'], 'previous_voice': dj.get('voice'), 'new_voice': profile_id})
    print(f"APPLIED: {dj['name']} now uses voice-service clone {profile_id} (previous: {dj.get('voice')})")

def log(entry):
    entry['at'] = int(time.time())
    with LOG.open('a') as f: f.write(json.dumps(entry) + '\n')

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('dj_id'); ap.add_argument('eleven_voice_id', nargs='?')
    ap.add_argument('--script'); ap.add_argument('--apply', action='store_true')
    ap.add_argument('--apply-profile')
    a = ap.parse_args()
    dj = dj_info(a.dj_id); slug = dj['slug'] or dj['id']

    if a.apply_profile:
        return apply(dj, a.apply_profile)
    if not a.eleven_voice_id: sys.exit('ElevenLabs voice id required for seeding')

    seed_key = b2_key(slug, 'seed-elevenlabs.mp3')
    if b2_exists(seed_key):
        print('Seed already exists in B2 - reusing it, no ElevenLabs credits spent.')
        seed = b2_get(seed_key); script = None
    else:
        script = a.script or default_script(dj)
        seed = eleven(a.eleven_voice_id, script)
        b2_put(seed_key, seed, 'audio/mpeg')
        b2_put(b2_key(slug, 'seed-script.txt'), script.encode(), 'text/plain')
        log({'event': 'eleven_seed', 'dj': dj['name'], 'eleven_voice': a.eleven_voice_id, 'chars': len(script), 'b2': seed_key})
        print(f'PHASE 1-2: ElevenLabs seed rendered ({len(script)} chars) and saved to B2 {seed_key}')

    prof = clone(f"{dj['name']} (Maestro DJ)", seed)
    pid = prof['profile_id']
    log({'event': 'cloned', 'dj': dj['name'], 'profile_id': pid, 'eleven_voice': a.eleven_voice_id})
    print(f'PHASE 3: cloned into voice service -> profile {pid}')

    test_line = (f"Maestro Radio, this is {dj['name']} coming to you from our own studio now. "
                 f"Same voice, no outside credits. Let's ride!")
    audio, engine, secs = speak_clone(pid, test_line)
    test_key = b2_key(slug, 'clone-test.mp3')
    b2_put(test_key, audio, 'audio/mpeg')
    log({'event': 'clone_test', 'dj': dj['name'], 'profile_id': pid, 'engine': engine, 'seconds': secs, 'b2': test_key})
    print(f'PHASE 4: clone test rendered on {engine} ({secs}s) -> B2 {test_key}')

    if a.apply: apply(dj, pid)
    else: print(f'NOT APPLIED YET. To switch: dj_voice_seed.py {dj["id"]} --apply-profile {pid}')

if __name__ == '__main__':
    main()
