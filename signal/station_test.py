#!/usr/bin/env python3
# Live test: create a station, SFTP login (and real SFTP login over the internet port), share a song into it; then remove everything.
import json, re, subprocess, uuid, urllib.request, urllib.error
ENV = open('/opt/swadebase/docker/.env').read(); env = lambda k: re.search(r'^%s=(.*)$' % k, ENV, re.M).group(1).strip()
ANON, SR = env('ANON_KEY'), env('SERVICE_ROLE_KEY'); BASE = 'http://127.0.0.1:18000'; FN = BASE + '/functions/v1/dj-studio'
K = open('/root/azuracast-api-key.txt').read().strip()
psql = lambda q: subprocess.run(['docker', 'exec', 'supabase-db', 'psql', '-U', 'postgres', '-At', '-c', q], capture_output=True, text=True).stdout.strip()
def req(m, url, body=None, h=None):
    hh = {'apikey': ANON, 'content-type': 'application/json'}; hh.update(h or {})
    r = urllib.request.Request(url, data=json.dumps(body).encode() if body is not None else None, headers=hh, method=m)
    try:
        with urllib.request.urlopen(r, timeout=300) as x: return x.status, json.loads(x.read() or b'{}')
    except urllib.error.HTTPError as e: return e.code, json.loads(e.read() or b'{}')
def eng(m, p):
    r = urllib.request.Request('http://127.0.0.1:10080' + p, headers={'X-API-Key': K, 'Host': 'radio.themaestroradio.com', 'X-Forwarded-Proto': 'https'}, method=m)
    with urllib.request.urlopen(r, timeout=120) as x: return x.read()
res = []
def check(n, c, i=''): c = bool(c); res.append(c); print(('PASS ' if c else 'FAIL ') + n, '' if c else str(i)[:300])
tag = uuid.uuid4().hex[:5]; email = f'st-test-{tag}@example.com'; pw = uuid.uuid4().hex + 'Aa1!'; uid = None; st = None
try:
    s, u = req('POST', BASE + '/auth/v1/admin/users', {'email': email, 'password': pw, 'email_confirm': True}, {'apikey': SR, 'authorization': 'Bearer ' + SR}); uid = u['id']
    A = {'authorization': 'Bearer ' + req('POST', BASE + '/auth/v1/token?grant_type=password', {'email': email, 'password': pw})[1]['access_token']}
    s, r = req('POST', FN, {'action': 'create_station', 'name': 'Nope'}, A); check('non-manager cannot create stations', s == 403, r)
    psql(f"insert into maestroradio.user_roles(user_id, role) values ('{uid}','station_manager')")
    s, r = req('POST', FN, {'action': 'create_station', 'name': f'Test Station {tag}', 'genre': 'R&B'}, A); st = r.get('station') or {}
    check('station created on the engine and in Maestro', s == 200 and st.get('azuracast_station_id'), r)
    s, r = req('POST', FN, {'action': 'create_sftp_login', 'station_id': st.get('id'), 'label': 'owner'}, A); sftp = r.get('sftp') or {}
    check('SFTP login created', s == 200 and sftp.get('password'), r)
    if sftp.get('password'):
        out = subprocess.run(['sshpass', '-p', sftp['password'], 'sftp', '-o', 'StrictHostKeyChecking=no', '-o', 'UserKnownHostsFile=/dev/null', '-P', '2022', f"{sftp['username']}@2.25.74.73"],
                             input='ls\nbye\n', capture_output=True, text=True, timeout=60)
        check('SFTP login works over the public port', out.returncode == 0, (out.stdout + out.stderr)[-200:])
    main = psql("select id from maestroradio.stations where slug='maestro-radio'")
    s, r = req('POST', FN, {'action': 'station_media', 'station_id': main, 'dir': 'Artist Music/ameyea'}, A)
    mid = next((x['media']['id'] for x in r.get('items', []) if x.get('media')), None); check('browse station media', s == 200 and mid, r)
    s, r = req('POST', FN, {'action': 'share_to_station', 'from_station_id': main, 'to_station_id': st.get('id'), 'media_ids': [mid]}, A)
    check('song shared into the new station', s == 200 and r.get('shared') and r['shared'][0].get('new_media_id'), r)
    s, r = req('POST', FN, {'action': 'station_media', 'station_id': st.get('id'), 'dir': ''}, A)
    check('receiving station sees "Shared from" folder', s == 200 and any('Shared from' in (x.get('path') or '') for x in r.get('items', [])), r)
finally:
    if st and st.get('azuracast_station_id'):
        try: eng('DELETE', f"/api/admin/station/{st['azuracast_station_id']}")
        except Exception as e: print('cleanup engine station', e)
        psql(f"delete from maestroradio.stations where id='{st['id']}'")
    if uid:
        psql(f"delete from maestroradio.user_roles where user_id='{uid}'"); psql(f"delete from maestroradio.audit_log where user_id='{uid}'")
        req('DELETE', BASE + f'/auth/v1/admin/users/{uid}', None, {'apikey': SR, 'authorization': 'Bearer ' + SR})
    left_users = psql("select count(*) from auth.users where email='%s'" % email)
    left_st = psql('select count(*) from maestroradio.stations')
    print('\n%d/%d passed; leftovers: users=%s stations=%s' % (sum(res), len(res), left_users, left_st))
