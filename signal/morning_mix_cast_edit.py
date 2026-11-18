#!/usr/bin/env python3
"""Edit the chosen cast photo with FLUX Kontext: fix Pa-Tony and give Uncle Rich his strange products.
Usage: morning_mix_cast_edit.py <source_n> <out_n> "<instruction>" """
import base64, json, re, sys, time, urllib.request
sys.path.insert(0, '/opt/swade-gpu-controller')
import voicestudio_b2 as b2  # noqa: E402
REP = next(l.split('=', 1)[1].strip().strip('"\'') for l in open('/opt/swade-secrets/yourown-web.env') if l.startswith('REPLICATE_API_TOKEN='))
ENV = open('/opt/swadebase/docker/.env').read(); SR = re.search(r'^SERVICE_ROLE_KEY=(.*)$', ENV, re.M).group(1).strip().strip('"')
src, out, instr = sys.argv[1], sys.argv[2], sys.argv[3]
def http(method, url, body=None, headers=None, raw=False):
    data = body if isinstance(body, (bytes, type(None))) else json.dumps(body).encode()
    r = urllib.request.urlopen(urllib.request.Request(url, data=data, method=method, headers={'user-agent': 'SwadeSoul-Maestro/1.0', **(headers or {})}), timeout=240).read()
    return r if raw else json.loads(r)
img = open(f'/tmp/cast-{src}.png', 'rb').read()
data_uri = 'data:image/png;base64,' + base64.b64encode(img).decode()
h = {'authorization': 'Bearer ' + REP, 'content-type': 'application/json', 'prefer': 'wait=60'}
p = http('POST', 'https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions',
         {'input': {'prompt': instr, 'input_image': data_uri, 'aspect_ratio': 'match_input_image', 'output_format': 'png', 'safety_tolerance': 2}}, h)
for _ in range(80):
    if p.get('status') in ('succeeded', 'failed', 'canceled'): break
    time.sleep(3); p = http('GET', p['urls']['get'], headers={'authorization': 'Bearer ' + REP})
if p.get('status') != 'succeeded': sys.exit(f"replicate {p.get('status')} {p.get('error')}")
o = p['output'][0] if isinstance(p['output'], list) else p['output']
res = http('GET', o, raw=True); open(f'/tmp/cast-{out}.png', 'wb').write(res)
b2.s3.put_object(Bucket=b2.BUCKET, Key=f'swadesoul/maestroradio/shows/morning-mix/cast/cast-{out}.png', Body=res, ContentType='image/png')
http('POST', f'http://127.0.0.1:18000/storage/v1/object/dj-avatars/morning-mix-cast-{out}.png', res, {'apikey': SR, 'authorization': 'Bearer ' + SR, 'content-type': 'image/png', 'x-upsert': 'true'})
print(f'cast-{out} ok {len(res)//1024} KB')
