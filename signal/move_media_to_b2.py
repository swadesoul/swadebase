#!/usr/bin/env python3
# Step 1: copy Maestro Radio's station media to Backblaze; Step 2: create Backblaze storage locations in the radio engine.
# Prints no secrets. Writes only under swadebase/maestro-radio/ in the bucket.
import json, os, re, sys, urllib.request, boto3
F = open('/opt/swadebase/docker/functions.env').read()
env = {k: v.strip().strip('"') for k, v in re.findall(r'^(BACKBLAZE_[A-Z_]+)=(.*)$', F, re.M)}
REGION, BUCKET = env['BACKBLAZE_REGION'], env['BACKBLAZE_BUCKET_NAME']
ENDPOINT = f'https://s3.{REGION}.backblazeb2.com'
s3 = boto3.client('s3', endpoint_url=ENDPOINT, region_name=REGION, aws_access_key_id=env['BACKBLAZE_KEY_ID'], aws_secret_access_key=env['BACKBLAZE_APPLICATION_KEY'])
ROOT = 'swadebase/maestro-radio'
LOCAL = os.popen("docker volume inspect azuracast_station_data -f '{{.Mountpoint}}'").read().strip() + '/maestro_radio/media'

n = size = 0
for d, _, files in os.walk(LOCAL):
    for f in files:
        if f.startswith('.'): continue
        p = os.path.join(d, f); rel = os.path.relpath(p, LOCAL); key = f'{ROOT}/stations/maestro_radio/media/{rel}'
        try:
            if s3.head_object(Bucket=BUCKET, Key=key)['ContentLength'] == os.path.getsize(p): n += 1; continue
        except Exception: pass
        s3.upload_file(p, BUCKET, key); n += 1; size += os.path.getsize(p)
print(f'media in Backblaze: {n} files ({size/1e6:.0f} MB uploaded this run)')
if '--copy-only' in sys.argv: sys.exit(0)

K = open('/root/azuracast-api-key.txt').read().strip()
H = {'X-API-Key': K, 'Host': 'radio.themaestroradio.com', 'X-Forwarded-Proto': 'https', 'content-type': 'application/json'}
def api(m, path, body=None):
    r = urllib.request.Request('http://127.0.0.1:10080' + path, data=json.dumps(body).encode() if body else None, headers=H, method=m)
    with urllib.request.urlopen(r, timeout=120) as x: return json.loads(x.read() or b'null')
made = {}
existing = api('GET', '/api/admin/storage_locations')
for typ, sub in [('station_media', 'stations/maestro_radio/media'), ('station_recordings', 'stations/maestro_radio/recordings'),
                 ('station_podcasts', 'stations/maestro_radio/podcasts'), ('backup', 'engine-backups')]:
    hit = next((l for l in existing if l['type'] == typ and l['adapter'] == 's3' and l['path'] == f'{ROOT}/{sub}'), None)
    if hit: made[typ] = hit['id']; continue
    loc = api('POST', '/api/admin/storage_locations', {'type': typ, 'adapter': 's3', 'path': f'{ROOT}/{sub}', 's3Bucket': BUCKET, 's3Region': REGION,
        's3Endpoint': ENDPOINT, 's3Version': 'latest', 's3UsePathStyle': True, 's3CredentialKey': env['BACKBLAZE_KEY_ID'], 's3CredentialSecret': env['BACKBLAZE_APPLICATION_KEY']})
    made[typ] = loc['id']
print('backblaze storage locations:', made)
json.dump(made, open('/opt/swadebase/signal/b2_locations.json', 'w'))
