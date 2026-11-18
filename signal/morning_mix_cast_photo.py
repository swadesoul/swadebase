#!/usr/bin/env python3
"""Maestro Morning Mix cast photo: 3 hosts + Uncle Rich holding strange products, in a unique Texas booth.
Generates 3 candidates (Replicate flux-dev, prepaid credits), saves to B2 and the public dj-avatars bucket."""
import json, re, sys, time, urllib.request
sys.path.insert(0, '/opt/swade-gpu-controller')
import voicestudio_b2 as b2  # noqa: E402
REP = next(l.split('=', 1)[1].strip().strip('"\'') for l in open('/opt/swade-secrets/yourown-web.env') if l.startswith('REPLICATE_API_TOKEN='))
ENV = open('/opt/swadebase/docker/.env').read(); SR = re.search(r'^SERVICE_ROLE_KEY=(.*)$', ENV, re.M).group(1).strip().strip('"')
PROMPT = ("Exactly four people. Wide cinematic group photo of four radio show hosts laughing together like close friends inside a one-of-a-kind Texas morning radio studio: "
 "warm wood paneling, a glowing red ON AIR light box, a big window with a Texas sunrise skyline, string lights, coffee mugs, studio microphones and headphones, a small Texas flag pennant. "
 "Left: a big, jovial man in his early 40s, the funny ringmaster, mid-laugh with headphones around his neck, casual button-up shirt. "
 "Center-left: a stylish 32-year-old Black woman with natural hair and gold hoop earrings, smooth confident smile, holding a coffee mug. "
 "Center-right: a young South Asian Indian man, only 24 years old, clean-shaven with short black hair, slim, in a gray knit sweater, holding a tablet, smart playful grin. "
 "Right: an older African American man with dark brown skin, about 68, retired DJ with a short gray beard, loud tropical shirt and a straw fedora, proudly holding up toward the camera two ridiculous gadgets clearly visible in his hands: "
 "a phone case shaped like a waffle iron and a pair of glow-in-the-dark socks, with a travel neck pillow around his neck and luggage tags on his shoulder bag. "
 "Everyone is clearly having fun together, candid natural expressions, editorial photography, shallow depth of field, rich warm color grade, high detail, no text, no logos, no watermark")

def http(method, url, body=None, headers=None, raw=False):
    data = body if isinstance(body, (bytes, type(None))) else json.dumps(body).encode()
    r = urllib.request.urlopen(urllib.request.Request(url, data=data, method=method, headers={'user-agent': 'SwadeSoul-Maestro/1.0', **(headers or {})}), timeout=180).read()
    return r if raw else json.loads(r)

h = {'authorization': 'Bearer ' + REP, 'content-type': 'application/json', 'prefer': 'wait=60'}
p = http('POST', 'https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions',
         {'input': {'prompt': PROMPT, 'aspect_ratio': '16:9', 'output_format': 'png', 'prompt_upsampling': False, 'safety_tolerance': 2}}, h)
for _ in range(60):
    if p.get('status') in ('succeeded', 'failed', 'canceled'): break
    time.sleep(3); p = http('GET', p['urls']['get'], headers={'authorization': 'Bearer ' + REP})
if p.get('status') != 'succeeded': sys.exit(f"replicate {p.get('status')} {p.get('error')}")
outs = p['output'] if isinstance(p['output'], list) else [p['output']]
START = int(sys.argv[1]) if len(sys.argv) > 1 else 4
for i, url in enumerate(outs, START):
    img = http('GET', url, raw=True)
    b2.s3.put_object(Bucket=b2.BUCKET, Key=f'swadesoul/maestroradio/shows/morning-mix/cast/cast-{i}.png', Body=img, ContentType='image/png')
    http('POST', f'http://127.0.0.1:18000/storage/v1/object/dj-avatars/morning-mix-cast-{i}.png', img,
         {'apikey': SR, 'authorization': 'Bearer ' + SR, 'content-type': 'image/png', 'x-upsert': 'true'})
    open(f'/tmp/cast-{i}.png', 'wb').write(img)
    print(f'cast-{i}: {len(img)//1024} KB -> https://swadebase.cloud/storage/v1/object/public/dj-avatars/morning-mix-cast-{i}.png')
