#!/usr/bin/env python3
"""Maestro DJ avatars: generate once (Replicate flux-schnell, prepaid credits), keep forever.
Master -> Backblaze swadesoul/maestroradio/djs/<slug>/avatar.webp ; public copy -> SWADEBASE storage
bucket 'dj-avatars' ; URL written to maestroradio.ai_djs.avatar. Skips DJs that already have an avatar.
Usage: dj_avatars.py [slug ...]   (no args = every DJ in PROMPTS without an avatar)"""
import json, re, subprocess, sys, time, urllib.request, urllib.error
sys.path.insert(0, '/opt/swade-gpu-controller')
import voicestudio_b2 as b2  # noqa: E402

ENV = open('/opt/swadebase/docker/.env').read()
SR = re.search(r'^SERVICE_ROLE_KEY=(.*)$', ENV, re.M).group(1).strip().strip('"')
REP = next(l.split('=', 1)[1].strip().strip('"\'') for l in open('/opt/swade-secrets/yourown-web.env') if l.startswith('REPLICATE_API_TOKEN='))
SB = 'http://127.0.0.1:18000'
PUBLIC = 'https://swadebase.cloud/storage/v1/object/public/dj-avatars'

STYLE = ("professional portrait photo, radio DJ in a modern dark broadcast studio with warm amber and gold accent lights, "
         "studio microphone and headphones, shallow depth of field, cinematic lighting, sharp focus on the face, "
         "natural skin texture, looking at camera, square composition, no text, no logos, no watermark")
PROMPTS = {
    'maestro-radio-shane': "35-year-old white man, relaxed easygoing smile, light stubble, casual flannel shirt over a tee, headphones around his neck, laid-back vibe",
    'maestro-radio-pa-tony': "24-year-old Indian man, bright curious expression, neat short hair, smart casual knit sweater, clever confident grin",
    'maestro-radio-surrinda': "32-year-old Black woman, confident smooth smile, stylish natural hair, chic modern outfit with gold hoop earrings, warm elegant presence",
    'maestro-radio-layla': "28-year-old white woman, witty knowing smile, shoulder-length hair, oversized vintage denim jacket, phone in hand, sharp playful expression",
    'maestro-radio-markie-c': "27-year-old Black man, big energetic grin, fresh fade haircut, stylish streetwear jacket and gold chain, hype party-host energy, mid-gesture",
}

def psql(sql):
    return subprocess.run(['docker', 'exec', 'supabase-db', 'psql', '-U', 'postgres', '-Atc', sql], capture_output=True, text=True, check=True).stdout.strip()

def http(method, url, body=None, headers=None, raw=False, timeout=120):
    data = body if isinstance(body, (bytes, type(None))) else json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, method=method, headers=headers or {})
    try:
        r = urllib.request.urlopen(req, timeout=timeout).read()
        return r if raw else (json.loads(r) if r else {})
    except urllib.error.HTTPError as e:
        raise RuntimeError(f'{method} {url.split("?")[0]} -> {e.code}: {e.read().decode()[:300]}')

def ensure_bucket():
    h = {'apikey': SR, 'authorization': 'Bearer ' + SR, 'content-type': 'application/json'}
    try:
        http('POST', SB + '/storage/v1/bucket', {'id': 'dj-avatars', 'name': 'dj-avatars', 'public': True,
             'file_size_limit': 5242880, 'allowed_mime_types': ['image/webp', 'image/png', 'image/jpeg']}, h)
    except RuntimeError as e:
        if 'already exists' not in str(e) and '409' not in str(e): raise

def generate(prompt):
    h = {'authorization': 'Bearer ' + REP, 'content-type': 'application/json', 'prefer': 'wait=60'}
    p = http('POST', 'https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions',
             {'input': {'prompt': prompt + ', ' + STYLE, 'aspect_ratio': '1:1', 'output_format': 'webp',
                        'output_quality': 90, 'num_outputs': 1, 'go_fast': True}}, h)
    for _ in range(40):
        if p.get('status') in ('succeeded', 'failed', 'canceled'): break
        time.sleep(3); p = http('GET', p['urls']['get'], headers={'authorization': 'Bearer ' + REP})
    if p.get('status') != 'succeeded': raise RuntimeError(f"replicate: {p.get('status')} {p.get('error')}")
    out = p['output'][0] if isinstance(p['output'], list) else p['output']
    return http('GET', out, raw=True)

def main():
    ensure_bucket()
    slugs = sys.argv[1:] or list(PROMPTS)
    for slug in slugs:
        has = psql(f"select coalesce(avatar,'') from maestroradio.ai_djs where slug='{slug}'")
        if has: print(f'{slug}: already has avatar, skipped'); continue
        img = generate(PROMPTS[slug])
        b2.s3.put_object(Bucket=b2.BUCKET, Key=f'swadesoul/maestroradio/djs/{slug}/avatar.webp', Body=img, ContentType='image/webp')
        http('POST', f'{SB}/storage/v1/object/dj-avatars/{slug}.webp', img,
             {'apikey': SR, 'authorization': 'Bearer ' + SR, 'content-type': 'image/webp', 'x-upsert': 'true'})
        url = f'{PUBLIC}/{slug}.webp'
        psql(f"update maestroradio.ai_djs set avatar='{url}', updated_at=now() where slug='{slug}'")
        print(f'{slug}: {len(img)//1024} KB -> {url}')

if __name__ == '__main__':
    main()
