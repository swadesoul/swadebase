#!/usr/bin/env python3
# AI DJ voice renderer (host side, no time limit): segments marked 'rendering' -> Voice Studio -> radio engine playlist.
import base64, fcntl, json, re, sys, urllib.request, urllib.error
sys.path.insert(0, '/opt/swadebase/signal')
from clean_tail import clean_tail, dj_polish
import resing_voice   # 2026-11-21: ReSing Lab voice for DJ breaks   # 2026-11-11: cut garbled babble after the last word; DJ pace + sound
lock = open('/tmp/dj_render.lock', 'w')
try: fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
except OSError: sys.exit(0)
ENV = open('/opt/swadebase/docker/.env').read(); FENV = open('/opt/swadebase/docker/functions.env').read()
g = lambda s, k: re.search(r'^%s=(.*)$' % k, s, re.M).group(1).strip().strip('"')
SR = g(ENV, 'SERVICE_ROLE_KEY'); VURL = g(FENV, 'VOICE_SERVICE_URL').rstrip('/'); VTOK = g(FENV, 'VOICE_SERVICE_TOKEN')
AKEY = open('/root/azuracast-api-key.txt').read().strip()
def http(method, url, body=None, headers=None, raw=False, timeout=60):
    data = body if isinstance(body, (bytes, type(None))) else json.dumps(body).encode()
    r = urllib.request.Request(url, data=data, headers=headers or {}, method=method)
    with urllib.request.urlopen(r, timeout=timeout) as x:
        b = x.read(); return (b, x.headers.get('content-type', '')) if raw else (json.loads(b) if b else None)
DBH = {'apikey': SR, 'authorization': 'Bearer ' + SR, 'accept-profile': 'maestroradio', 'content-profile': 'maestroradio', 'content-type': 'application/json'}
db = lambda m, path, body=None: http(m, 'http://127.0.0.1:18000/rest/v1/' + path, body, {**DBH, 'prefer': 'return=representation'})
EH = {'X-API-Key': AKEY, 'Host': 'radio.themaestroradio.com', 'X-Forwarded-Proto': 'https', 'content-type': 'application/json'}
eng = lambda m, path, body=None: http(m, 'http://127.0.0.1:10080' + path, body, EH, timeout=300)

RETIRED_GAME = re.compile(r'\b(?:music[\s_-]*mogul|velvet[\s_-]*vance)\b|themaestroradio(?:\.com| dot com)\s*(?:/|slash\s*)play\b', re.I)
for seg in db('GET', 'ai_dj_segments?status=eq.rendering&order=created_at&limit=5') or []:
    try:
        if RETIRED_GAME.search(seg.get('script') or ''):
            db('PATCH', f"ai_dj_segments?id=eq.{seg['id']}", {'status': 'rejected', 'error': 'Retired Music Mogul script cannot be broadcast.'})
            print('blocked retired game script', seg['id'][:8], flush=True)
            continue
        dj = db('GET', f"ai_djs?id=eq.{seg['dj_id']}")[0]
        voice = (db('GET', f"ai_dj_voice?dj_id=eq.{dj['id']}") or [{}])[0].get('voice_profile_id')
        st = db('GET', f"stations?id=eq.{dj['station_id']}")[0]; sid = st['azuracast_station_id']
        if not voice or not sid: raise RuntimeError('DJ needs a voice and a station on the radio engine')
        # 2026-11-21: DJs with a ReSing Lab voice speak through ReSing Lab's Voicebox (CPU, no GPU); others keep the old path.
        rs = resing_voice.speak(dj['id'], seg['script'])
        audio, ctype = rs if rs else http('POST', VURL + '/v1/voicebox/speak', {'text': seg['script'], 'voice_profile_id': voice},
                            {'authorization': 'Bearer ' + VTOK, 'content-type': 'application/json'}, raw=True, timeout=1500)
        ext = 'mp3' if 'mpeg' in ctype else 'wav'
        audio, cut = clean_tail(audio, ext, seg['script'], VURL, VTOK)
        if cut: print('trimmed', cut, 's of garbled tail from', seg['id'][:8], flush=True)
        audio, sp = dj_polish(audio, ext, seg['script'])
        if sp: print('paced', seg['id'][:8], f'x{sp}', flush=True)
        path = f"AI DJ/{dj.get('slug') or dj['id']}/seg-{seg['id']}.{ext}"
        up = eng('POST', f'/api/station/{sid}/files', {'path': path, 'file': base64.b64encode(audio).decode()})
        mid = (up or {}).get('id') or ((up or {}).get('media') or {}).get('id')
        if mid: eng('PUT', f'/api/station/{sid}/file/{mid}', {'artist': 'Maestro Radio', 'title': f"{dj['name']} on the mic", 'album': f"seg-{seg['id'][:8]}"})
        if (seg.get('facts') or {}).get('prepare_only'):
            sys.path.insert(0, '/opt/maestro-assistant/factory')
            import factory as planner_archive
            planner_archive.ENV = planner_archive.load_env()
            archive_key = f"maestro/stations/{st['id']}/planner-voice/{seg['id']}.{ext}"
            planner_archive.store(archive_key, audio, ctype)
            facts = {**(seg.get('facts') or {}), 'planner_ready': True, 'planner_audio_key': archive_key}
            media = eng('GET', f'/api/station/{sid}/file/{mid}') if mid else {}
            db('PATCH', f"ai_dj_segments?id=eq.{seg['id']}", {'status': 'approved', 'facts': facts, 'azuracast_path': path, 'azuracast_media_id': mid, 'azuracast_song_id': (media or {}).get('song_id'), 'audio_bytes': len(audio), 'error': None})
            print('prepared private planner voice', seg['id'], flush=True)
            continue
        want = {'name': f"AI DJ: {dj['name']}", 'type': 'once_per_x_songs', 'play_per_songs': dj.get('break_every_songs') or 3, 'source': 'songs',
                'order': 'sequential', 'is_enabled': True, 'include_in_requests': False, 'avoid_duplicates': False}
        pid = dj.get('azuracast_playlist_id')
        try:
            if not pid: raise RuntimeError
            eng('PUT', f'/api/station/{sid}/playlist/{pid}', want)
        except Exception:
            pid = eng('POST', f'/api/station/{sid}/playlists', want)['id']; db('PATCH', f"ai_djs?id=eq.{dj['id']}", {'azuracast_playlist_id': pid})
        eng('PUT', f'/api/station/{sid}/files/batch', {'do': 'playlist', 'currentDirectory': '', 'files': [path], 'dirs': [], 'playlists': [pid]})
        media = eng('GET', f'/api/station/{sid}/file/{mid}') if mid else {}
        db('PATCH', f"ai_dj_segments?id=eq.{seg['id']}", {'status': 'queued', 'azuracast_path': path, 'azuracast_media_id': mid, 'azuracast_song_id': (media or {}).get('song_id'),
           'audio_bytes': len(audio), 'queued_at': __import__('datetime').datetime.utcnow().isoformat() + 'Z', 'error': None})
        print('queued', seg['id'], len(audio), 'bytes')
    except Exception as e:
        msg = (e.read().decode()[:200] if isinstance(e, urllib.error.HTTPError) else str(e))[:300]
        db('PATCH', f"ai_dj_segments?id=eq.{seg['id']}", {'status': 'failed', 'error': msg}); print('failed', seg['id'], msg)
