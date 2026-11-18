#!/usr/bin/env python3
# Set each song's on-air artist name from its Backblaze folder (canonical roster spellings). Records old values for undo.
import json, urllib.request, urllib.parse
K = open('/root/azuracast-api-key.txt').read().strip()
H = {'X-API-Key': K, 'Host': 'radio.themaestroradio.com', 'X-Forwarded-Proto': 'https', 'content-type': 'application/json'}
def api(m, p, body=None):
    r = urllib.request.Request('http://127.0.0.1:10080' + p, data=json.dumps(body).encode() if body else None, headers=H, method=m)
    with urllib.request.urlopen(r, timeout=60) as x: return json.loads(x.read() or b'null')
NAMES = {'ameyea': 'Ameyea Swade', 'reggie': 'Reggie Swade', 'karriann': 'KarriAnne Swade', 'shamone': 'Shamone Swade', 'mason': 'Mason Swade',
         'nevaborya': 'Nevaborya Swade', 'granada': 'Granada Swade', 'suki': 'Suki Swade', 'ty': 'Ty Swade', 'steemo': 'Steemo Swade',
         'noble-rayne': 'Noble Rayne Swade', 'swade-swade': 'Swade', 'floyd-smith': 'Floyd Smith', 'leyco': 'Leyco', 'sabria': 'Sabria', 'battles': 'Battles'}
undo = []
for folder in api('GET', '/api/station/1/files/list?' + urllib.parse.urlencode({'currentDirectory': 'Artist Music'})):
    if folder.get('type') != 'directory': continue
    key = folder['path'].split('/')[-1]; name = NAMES.get(key)
    if not name: print('skip folder', key); continue
    for f in api('GET', '/api/station/1/files/list?' + urllib.parse.urlencode({'currentDirectory': folder['path']})):
        m = f.get('media') or {}
        if not m.get('id') or m.get('artist') == name: continue
        undo.append({'id': m['id'], 'artist': m.get('artist'), 'title': m.get('title')})
        api('PUT', f"/api/station/1/file/{m['id']}", {'artist': name})
json.dump(undo, open('/opt/backups/azuracast-artist-tags-undo.json', 'w'), indent=1)
print('updated', len(undo), 'songs; undo list saved')
