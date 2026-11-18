#!/usr/bin/env python3
# Live test of dj-studio: temp admin user -> AI DJ -> show -> draft -> approve -> voice -> on engine; live DJ create/disable. Cleans up.
import json, re, subprocess, uuid, urllib.request, urllib.error, time
ENV = open('/opt/swadebase/docker/.env').read()
env = lambda k: re.search(r'^%s=(.*)$' % k, ENV, re.M).group(1).strip()
ANON, SR = env('ANON_KEY'), env('SERVICE_ROLE_KEY'); BASE = 'http://127.0.0.1:18000'; FN = BASE + '/functions/v1/dj-studio'
psql = lambda q: subprocess.run(['docker', 'exec', 'supabase-db', 'psql', '-U', 'postgres', '-At', '-c', q], capture_output=True, text=True).stdout.strip()
def req(m, url, body=None, h=None):
    hh = {'apikey': ANON, 'content-type': 'application/json'}; hh.update(h or {})
    r = urllib.request.Request(url, data=json.dumps(body).encode() if body is not None else None, headers=hh, method=m)
    try:
        with urllib.request.urlopen(r, timeout=600) as x: return x.status, json.loads(x.read() or b'{}')
    except urllib.error.HTTPError as e: return e.code, json.loads(e.read() or b'{}')
res = []
def check(n, c, i=''): c = bool(c); res.append(c); print(('PASS ' if c else 'FAIL ') + n, '' if c else str(i)[:400])
tag = uuid.uuid4().hex[:6]; email = f'dj-test-{tag}@example.com'; pw = uuid.uuid4().hex + 'Aa1!'; uid = None; dj_id = None; live = None
K = open('/root/azuracast-api-key.txt').read().strip()
def eng(m, path):
    r = urllib.request.Request('http://127.0.0.1:10080' + path, headers={'X-API-Key': K, 'Host': 'radio.themaestroradio.com', 'X-Forwarded-Proto': 'https'}, method=m)
    with urllib.request.urlopen(r, timeout=60) as x: return x.status
try:
    s, u = req('POST', BASE + '/auth/v1/admin/users', {'email': email, 'password': pw, 'email_confirm': True}, {'apikey': SR, 'authorization': 'Bearer ' + SR}); uid = u.get('id')
    s, t = req('POST', BASE + '/auth/v1/token?grant_type=password', {'email': email, 'password': pw}); A = {'authorization': 'Bearer ' + t['access_token']}
    s, r = req('POST', FN, {'action': 'upsert_dj', 'dj': {'name': 'Test DJ'}}, A); check('non-manager cannot create DJ', s == 403, r)
    psql(f"insert into maestroradio.user_roles(user_id, role) values ('{uid}','station_manager')")
    s, r = req('POST', FN, {'action': 'voices'}, A); voices = r.get('voices', []); check('voice list loads', s == 200 and len(voices) > 0, r)
    station = psql("select id from maestroradio.stations where slug='maestro-radio'")
    s, r = req('POST', FN, {'action': 'upsert_dj', 'dj': {'name': f'DJ Test {tag}', 'slug': f'dj-test-{tag}', 'persona_brief': 'Smooth late-night host from Fort Worth', 'style': 'smooth R&B',
        'tier': 'low', 'station_id': station, 'voice_profile_id': voices[0]['id'] if voices else None, 'is_active': True}}, A)
    dj_id = r.get('dj', {}).get('id'); check('manager creates AI DJ with voice', s == 200 and dj_id, r)
    s, r = req('POST', FN, {'action': 'upsert_dj', 'dj': {'id': dj_id, 'auto_mode': True}}, A); check('auto mode refused without a daily limit', s == 400, r)
    s, r = req('POST', FN, {'action': 'upsert_show', 'show': {'dj_id': dj_id, 'title': 'Late Night Smooth', 'start_time': '22:00', 'end_time': '02:00', 'segment_types': ['backsell', 'station_id']}}, A)
    check('show created', s == 200 and r.get('show', {}).get('id'), r)
    s, r = req('POST', FN, {'action': 'draft_segment', 'dj_id': dj_id, 'segment_type': 'backsell'}, A)
    seg = r.get('segment', {}); check('script drafted from live station facts', s == 200 and seg.get('status') == 'draft' and len(seg.get('script', '')) > 10, r)
    print('  script:', seg.get('script', '')[:300]); print('  facts used:', json.dumps(seg.get('facts', {}).get('just_played'))[:200])
    s, r = req('POST', FN, {'action': 'render_segment', 'id': seg.get('id')}, A); check('voice blocked until approved', s == 400, r)
    s, r = req('POST', FN, {'action': 'approve_segment', 'id': seg.get('id')}, A); check('approve', s == 200, r)
    t0 = time.time(); s, r = req('POST', FN, {'action': 'render_segment', 'id': seg.get('id')}, A)
    check('voice render requested (runs server-side)', s == 200 and r.get('rendering'), r)
    out = subprocess.run(['python3', '/opt/swadebase/signal/dj_render.py'], capture_output=True, text=True, timeout=1600); print('  renderer:', (out.stdout + out.stderr)[-300:])
    check(f'voice generated and queued on the radio engine ({time.time()-t0:.0f}s)', psql(f"select status from maestroradio.ai_dj_segments where id='{seg.get('id')}'") == 'queued')
    row = psql(f"select status||'|'||coalesce(azuracast_media_id::text,'')||'|'||coalesce(audio_bytes::text,'') from maestroradio.ai_dj_segments where id='{seg.get('id')}'"); print('  segment row:', row)
    s, r = req('POST', FN, {'action': 'studio', 'dj_id': dj_id}, A); check('studio view', s == 200 and r.get('voice_selected') and len(r.get('segments', [])) == 1, r)
    s, r = req('POST', FN, {'action': 'create_live_dj', 'username': f'test_{tag}', 'display_name': 'Test Live DJ'}, A)
    live = r.get('live_dj', {}); check('live DJ account created on the engine', s == 200 and r.get('connection', {}).get('password') and live.get('azuracast_streamer_id'), r)
    s, r = req('POST', FN, {'action': 'set_live_dj', 'id': live.get('id'), 'active': False}, A); check('live DJ can be disabled', s == 200 and r.get('status') == 'disabled', r)
finally:
    if live and live.get('azuracast_streamer_id'):
        try: eng('DELETE', f"/api/station/1/streamer/{live['azuracast_streamer_id']}")
        except Exception as e: print('cleanup streamer', e)
    if dj_id:
        for mid in psql(f"select azuracast_media_id from maestroradio.ai_dj_segments where dj_id='{dj_id}' and azuracast_media_id is not null").split():
            try: eng('DELETE', f'/api/station/1/file/{mid}')
            except Exception as e: print('cleanup file', e)
        pl = psql(f"select azuracast_playlist_id from maestroradio.ai_djs where id='{dj_id}'")
        if pl:
            try: eng('DELETE', f'/api/station/1/playlist/{pl}')
            except Exception as e: print('cleanup playlist', e)
        psql(f"delete from maestroradio.ai_djs where id='{dj_id}'")
    if uid:
        psql(f"delete from maestroradio.live_dj_accounts where created_by='{uid}'"); psql(f"delete from maestroradio.user_roles where user_id='{uid}'"); psql(f"delete from maestroradio.audit_log where user_id='{uid}'")
        req('DELETE', BASE + f'/auth/v1/admin/users/{uid}', None, {'apikey': SR, 'authorization': 'Bearer ' + SR})
    print(f'\n{sum(res)}/{len(res)} passed; temp user left:', psql(f"select count(*) from auth.users where email='{email}'"))
