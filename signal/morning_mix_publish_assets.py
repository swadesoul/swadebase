#!/usr/bin/env python3
"""Publish Morning Mix page assets to SWADEBASE public bucket dj-avatars (2026-11-17).
Final cast photo (cast-10), per-host square crops cut from it (so faces match everywhere), theme intro mp3."""
import re, subprocess, urllib.request, io
from PIL import Image
ENV = open('/opt/swadebase/docker/.env').read(); SR = re.search(r'^SERVICE_ROLE_KEY=(.*)$', ENV, re.M).group(1).strip().strip('"')

def put(name, data, ctype):
    req = urllib.request.Request(f'http://127.0.0.1:18000/storage/v1/object/dj-avatars/{name}', data=data, method='POST',
        headers={'apikey': SR, 'authorization': 'Bearer ' + SR, 'content-type': ctype, 'x-upsert': 'true', 'cache-control': 'max-age=3600'})
    print(name, urllib.request.urlopen(req, timeout=60).status, len(data) // 1024, 'KB')

im = Image.open('/tmp/cast-10.png').convert('RGB')
W, H = im.size; s = W / 1024
buf = io.BytesIO(); im.save(buf, 'PNG', optimize=True); put('morning-mix-cast-final.png', buf.getvalue(), 'image/png')
faces = {'barnabas': (210, 290), 'surrinda': (405, 300), 'pa-tony': (560, 262), 'uncle-rich': (850, 255)}
side = int(250 * s)
for slug, (fx, fy) in faces.items():
    x = max(0, min(W - side, int(fx * s) - side // 2)); y = max(0, min(H - side, int(fy * s) - int(side * 0.42)))
    c = im.crop((x, y, x + side, y + side)).resize((640, 640), Image.LANCZOS)
    b = io.BytesIO(); c.save(b, 'PNG', optimize=True); c.save(f'/tmp/mm-crop-{slug}.png'); put(f'morning-mix-{slug}.png', b.getvalue(), 'image/png')

import sys; sys.path.insert(0, '/opt/swade-gpu-controller')
import voicestudio_b2 as b2  # noqa: E402
mp3 = '/tmp/mm-theme-intro-30s.mp3'
b2.s3.download_file(b2.BUCKET, 'swadesoul/maestroradio/shows/morning-mix/theme/theme-intro-30s.mp3', mp3)
import shutil, os; os.makedirs('/opt/work/maestro-podcasts-20261117/public/morning-mix', exist_ok=True); shutil.copy(mp3, '/opt/work/maestro-podcasts-20261117/public/morning-mix/theme-intro.mp3'); print('theme copied to site public/')
