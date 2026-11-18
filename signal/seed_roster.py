#!/usr/bin/env python3
# Create Artist Signal pages for the Swade Fam SI roster from the songs already on Maestro Radio. Idempotent.
import json, re, unicodedata, urllib.request, urllib.parse
ENV = open('/opt/swadebase/docker/.env').read(); SR = re.search(r'^SERVICE_ROLE_KEY=(.*)$', ENV, re.M).group(1).strip()
K = open('/root/azuracast-api-key.txt').read().strip()
OWNER = 'f6e059a4-ea87-46ac-9b8e-cda2b047b979'  # Swade's account
DB = {'apikey': SR, 'authorization': 'Bearer ' + SR, 'accept-profile': 'maestroradio', 'content-profile': 'maestroradio', 'content-type': 'application/json'}
def http(m, url, body=None, h=None):
    r = urllib.request.Request(url, data=json.dumps(body).encode() if body is not None else None, headers=h or {}, method=m)
    with urllib.request.urlopen(r, timeout=60) as x: b = x.read(); return json.loads(b) if b else None
db = lambda m, p, b=None, prefer='return=representation': http(m, 'http://127.0.0.1:18000/rest/v1/' + p, b, {**DB, 'prefer': prefer})
eng = lambda p: http('GET', 'http://127.0.0.1:10080' + p, None, {'X-API-Key': K, 'Host': 'radio.themaestroradio.com', 'X-Forwarded-Proto': 'https'})
def norm(s):
    s = unicodedata.normalize('NFKD', (s or '').lower()); s = ''.join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r'\s*[\(\[](feat|ft|featuring|prod|explicit|clean|radio edit)[^\)\]]*[\)\]]', '', s); s = re.sub(r'\s+(feat\.?|ft\.?|featuring)\s+.*$', '', s)
    s = s.replace('&', ' and '); s = re.sub(r'[^a-z0-9 ]+', ' ', s); return re.sub(r'\s+', ' ', s).strip()
ROSTER = {'ameyea': 'Ameyea Swade', 'reggie': 'Reggie Swade', 'karriann': 'KarriAnne Swade', 'shamone': 'Shamone Swade', 'mason': 'Mason Swade',
          'nevaborya': 'Nevaborya Swade', 'granada': 'Granada Swade', 'suki': 'Suki Swade', 'ty': 'Ty Swade', 'steemo': 'Steemo Swade', 'noble-rayne': 'Noble Rayne Swade'}
FAM = {'noble-rayne': 'SWADE Soul Frequency Fam'}
station = db('GET', 'stations?slug=eq.maestro-radio&select=id')[0]['id']
made = []
for folder, name in ROSTER.items():
    items = [x for x in eng('/api/station/1/files/list?' + urllib.parse.urlencode({'currentDirectory': f'Artist Music/{folder}'})) if (x.get('media') or {}).get('id')]
    if not items: print('no songs on air for', name, '- skipped'); continue
    slug = name.lower().replace(' ', '-')
    art = f"https://radio.themaestroradio.com/api/station/maestro_radio/art/{items[0]['media']['unique_id']}"
    fam = FAM.get(folder, 'Swade Fam')
    profile = {'slug': slug, 'display_name': name, 'artwork_url': art, 'artist_type': 'si', 'owner_user_id': OWNER,
               'biography': f'{name} is an SI artist from the {fam} roster on Swade Soul, an AI record label.',
               'disclosure': f'{name} is an SI (AI-generated) artist created and produced by Swade Soul. Vocals and music are made with AI tools under Swade Soul\'s creative direction.',
               'consent_at': '2026-10-21T14:40:00Z', 'active': True, 'verified': True}
    p = db('POST', 'artist_signal_profiles?on_conflict=slug', profile, 'return=representation,resolution=merge-duplicates')[0]
    n = 0
    for x in items:
        m = x['media']; title = m.get('title') or x.get('path_short', '').rsplit('.', 1)[0]
        db('POST', 'artist_signal_tracks?on_conflict=match_artist,match_title', {'profile_id': p['id'], 'title': title, 'match_artist': norm(name), 'match_title': norm(title),
           'station_ids': [station], 'active': True}, 'return=minimal,resolution=merge-duplicates'); n += 1
    db('POST', 'audit_log', {'user_id': OWNER, 'action': 'artist_signal.seed_roster_profile', 'table_name': 'artist_signal_profiles', 'record_id': p['id'],
       'new_values': {'slug': slug, 'tracks': n, 'approved': 'owner chat approval 2026-10-21'}}, 'return=minimal')
    made.append((name, n)); print(f'{name}: page /artist/{slug} with {n} songs')
print('done:', len(made), 'artists')
