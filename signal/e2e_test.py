#!/usr/bin/env python3
# End-to-end test of artist-signal on live SWADEBASE. Creates a temporary user/artist and removes them afterward.
import json, os, re, subprocess, time, uuid, base64, urllib.request, urllib.error
from datetime import datetime, timezone, timedelta

ENV = open('/opt/swadebase/docker/.env').read()
def env(k): return re.search(r'^%s=(.*)$' % k, ENV, re.M).group(1).strip()
ANON, SR = env('ANON_KEY'), env('SERVICE_ROLE_KEY')
BASE = 'http://127.0.0.1:18000'
FN = BASE + '/functions/v1/artist-signal'
def psql(sql):
    return subprocess.run(['docker', 'exec', 'supabase-db', 'psql', '-U', 'postgres', '-At', '-c', sql], capture_output=True, text=True).stdout.strip()

def req(method, url, body=None, headers=None):
    h = {'apikey': ANON, 'content-type': 'application/json', 'origin': 'https://themaestroradio.com'}
    h.update(headers or {})
    r = urllib.request.Request(url, data=json.dumps(body).encode() if body is not None else None, headers=h, method=method)
    try:
        with urllib.request.urlopen(r, timeout=90) as res: return res.status, json.loads(res.read() or b'{}')
    except urllib.error.HTTPError as e: return e.code, json.loads(e.read() or b'{}')

results = []
def check(name, cond, info=''):
    results.append((name, bool(cond))); print(('PASS ' if cond else 'FAIL ') + name, ('' if cond else info))

tag = uuid.uuid4().hex[:8]
email, pw = f'signal-test-{tag}@example.com', uuid.uuid4().hex + 'Aa1!'
slug = f'signal-test-{tag}'
uid = None
try:
    s, u = req('POST', BASE + '/auth/v1/admin/users', {'email': email, 'password': pw, 'email_confirm': True}, {'apikey': SR, 'authorization': 'Bearer ' + SR})
    uid = u.get('id'); check('create temp user', s in (200, 201) and uid, u)
    s, t = req('POST', BASE + '/auth/v1/token?grant_type=password', {'email': email, 'password': pw})
    jwt = t.get('access_token'); check('sign in', jwt, t)
    A = {'authorization': 'Bearer ' + jwt}
    P = {'authorization': 'Bearer ' + ANON}

    s, r = req('POST', FN, {'action': 'follow', 'slug': slug}, P); check('anon cannot follow', s == 401, r)
    s, r = req('POST', FN, {'action': 'upsert_track', 'slug': slug, 'track': {}}, A); check('non-admin blocked from admin action', s in (403, 404), r)

    psql(f"insert into maestroradio.user_roles(user_id, role) values ('{uid}','admin')")
    s, r = req('POST', FN, {'action': 'upsert_profile', 'profile': {'slug': slug, 'display_name': 'Signal Test Artist', 'genre': 'R&B', 'consent': True, 'active': True, 'verified': True}}, A)
    check('admin creates active profile', s == 200 and r.get('profile', {}).get('active'), r)
    s, r = req('POST', FN, {'action': 'upsert_profile', 'profile': {'slug': slug + 'x', 'display_name': 'No Consent', 'active': True}}, A)
    check('activation without consent refused', s == 400, r)
    s, r = req('POST', FN, {'action': 'upsert_track', 'slug': slug, 'track': {'title': f'After The Rain {tag}', 'broadcast_artist': 'Signal Test Artist'}}, A)
    track = r.get('track', {}); check('admin adds track', s == 200 and track.get('id'), r)
    station = psql("select id from maestroradio.stations where slug='maestro-radio'")

    s, r = req('GET', FN + f'?action=profile&slug={slug}', None, P)
    check('public profile loads', s == 200 and r['artist']['display_name'] == 'Signal Test Artist' and r.get('vapid_public_key'), r)
    check('no fake countdown when nothing scheduled', r.get('next_airplay') is None, r.get('next_airplay'))

    s, r = req('POST', FN, {'action': 'follow', 'slug': slug, 'source': 'qr-test'}, A); check('fan follows', s == 200, r)
    s, r = req('POST', FN, {'action': 'follow', 'slug': slug}, A); check('follow is idempotent', s == 200, r)
    s, r = req('POST', FN, {'action': 'preferences', 'set': True, 'slug': slug, 'advance_minutes': 5, 'actual_playback_alerts': True, 'timezone': 'America/Chicago'}, A)
    check('fan sets preferences', s == 200 and r['preferences'][0]['advance_minutes'] == 5, r)
    s, r = req('POST', FN, {'action': 'preferences', 'set': True, 'advance_minutes': 7}, A); check('bad lead time refused', s == 400, r)

    # a syntactically valid browser subscription pointing at FCM with a token FCM will reject
    from cryptography.hazmat.primitives.asymmetric import ec
    from cryptography.hazmat.primitives import serialization
    k = ec.generate_private_key(ec.SECP256R1())
    raw = k.public_key().public_bytes(serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint)
    b64u = lambda b: base64.urlsafe_b64encode(b).decode().rstrip('=')
    sub = {'endpoint': f'https://fcm.googleapis.com/fcm/send/signaltest-{tag}', 'keys': {'p256dh': b64u(raw), 'auth': b64u(os.urandom(16))}}
    s, r = req('POST', FN, {'action': 'subscribe', 'subscription': {'endpoint': 'https://evil.example/x', 'keys': sub['keys']}}, A)
    check('unknown push host refused', s == 400, r)
    s, r = req('POST', FN, {'action': 'subscribe', 'subscription': sub, 'device_label': 'test phone'}, A); check('device subscribes', s == 200, r)

    at = (datetime.now(timezone.utc) + timedelta(minutes=3)).isoformat()
    s, r = req('POST', FN, {'action': 'schedule_airplay', 'airplay': {'track_id': track['id'], 'station_id': station, 'scheduled_at': at}}, A)
    ap = r.get('airplay', {}); check('admin schedules airplay', s == 200 and ap.get('status') == 'scheduled', r)
    s, r = req('GET', FN + f'?action=profile&slug={slug}', None, P)
    check('countdown shows the real scheduled time', r.get('next_airplay', {}).get('id') == ap.get('id'), r.get('next_airplay'))

    out = subprocess.run(['/opt/swadebase/signal/tick.sh'], capture_output=True, text=True).stdout
    tick = json.loads(out.strip().splitlines()[-1]); print('  tick:', json.dumps(tick)[:300])
    check('tick queued the 5-minute alert', tick.get('advance_queued', 0) >= 1, tick)
    job = psql(f"select status||'|'||attempts||'|'||coalesce(last_error,'') from maestroradio.artist_signal_notification_jobs where airplay_id='{ap.get('id')}' and notification_type='advance'")
    print('  advance job:', job[:200])
    check('push attempted and push-service answer recorded', job.split('|')[0] in ('sent', 'failed', 'pending') and int(job.split('|')[1]) >= 1, job)
    out2 = subprocess.run(['/opt/swadebase/signal/tick.sh'], capture_output=True, text=True).stdout
    dupes = psql(f"select count(*) from maestroradio.artist_signal_notification_jobs where airplay_id='{ap.get('id')}'")
    check('second tick does not duplicate alerts', dupes == '1', dupes)

    # reschedule clears pending advance alerts; cancel cancels pending ones
    psql(f"update maestroradio.artist_signal_push_subscriptions set enabled=true where endpoint like '%signaltest-{tag}'")
    later = (datetime.now(timezone.utc) + timedelta(minutes=20)).isoformat()
    s, r = req('POST', FN, {'action': 'schedule_airplay', 'airplay': {'id': ap['id'], 'track_id': track['id'], 'scheduled_at': later}}, A)
    check('reschedule marks airplay rescheduled', s == 200 and r['airplay']['status'] == 'rescheduled', r)

    # real start arrives through the ingest webhook
    tok = psql("select value from maestroradio.artist_signal_settings where key='ingest_token'")
    if not tok:
        s, r = req('GET', FN + '?action=ingest_url', None, A); tok = psql("select value from maestroradio.artist_signal_settings where key='ingest_token'")
    s, r = req('POST', FN + '?action=ingest', {'station_slug': 'maestro-radio', 'artist': 'Signal Test Artist', 'title': f'After the Rain {tag}'}, {'x-signal-token': 'wrong'})
    check('ingest with wrong token refused', s == 401, r)
    s, r = req('POST', FN + '?action=ingest', {'station_slug': 'maestro-radio', 'artist': 'Signal Test Artist feat. Someone', 'title': f'After the Rain {tag} (Radio Edit)', 'event_id': f'evt-{tag}'}, {'x-signal-token': tok})
    check('real start matched to the scheduled airplay', s == 200 and r.get('matched') and r.get('airplay_id') == ap['id'], r)
    check('now-playing alert queued', r.get('queued', 0) >= 1, r)
    s, r2 = req('POST', FN + '?action=ingest', {'station_slug': 'maestro-radio', 'artist': 'Signal Test Artist', 'title': f'After the Rain {tag}', 'event_id': f'evt-{tag}'}, {'x-signal-token': tok})
    check('repeated event is ignored', s == 200 and r2.get('changed') is False, r2)
    st = psql(f"select status from maestroradio.artist_signal_airplays where id='{ap['id']}'")
    check('airplay is playing', st == 'playing', st)
    s, r = req('POST', FN + '?action=ingest', {'station_slug': 'maestro-radio', 'artist': 'Someone Else', 'title': 'Different Song'}, {'x-signal-token': tok})
    st = psql(f"select status||'|'||(actual_ended_at is not null) from maestroradio.artist_signal_airplays where id='{ap['id']}'")
    check('next song ends the airplay', st == 'played|true', st)
    s, r = req('POST', FN + '?action=ingest', {'station_slug': 'maestro-radio', 'artist': 'Unknown', 'title': 'Not In Catalog'}, {'x-signal-token': tok})
    check('unknown songs never announced', s == 200 and not r.get('matched'), r)

    s, r = req('POST', FN, {'action': 'artist_stats', 'slug': slug}, A)
    check('artist stats separate measured numbers', s == 200 and 'measured' in r and r['measured']['followers_total'] == 1, r)
    s, r = req('POST', FN, {'action': 'admin_overview'}, A); check('admin overview', s == 200 and 'jobs_pending' in r, r)
    s, r = req('POST', FN, {'action': 'delete_my_data'}, A)
    check('fan deletes their data', s == 200 and r['deleted']['follows'] == 1 and r['deleted']['push_subscriptions'] == 1, r)
    left = psql(f"select (select count(*) from maestroradio.artist_signal_follows where fan_id='{uid}')+(select count(*) from maestroradio.artist_signal_push_subscriptions where fan_id='{uid}')")
    check('nothing left for that fan', left == '0', left)
    s, r = req('GET', BASE + '/rest/v1/artist_signal_push_subscriptions?select=*', None, {'authorization': 'Bearer ' + ANON, 'accept-profile': 'maestroradio'})
    check('device table unreadable from browser', s in (401, 403, 404) or r == [], (s, r))
    s, r = req('GET', BASE + '/rest/v1/artist_signal_settings?select=*', None, {'authorization': 'Bearer ' + jwt, 'accept-profile': 'maestroradio'})
    check('settings (keys) unreadable from browser', s in (401, 403, 404) or r == [], (s, r))
finally:
    # cleanup
    psql(f"delete from maestroradio.artist_signal_profiles where slug like 'signal-test-{tag}%'")
    if uid:
        psql(f"delete from maestroradio.user_roles where user_id='{uid}'")
        psql(f"delete from maestroradio.audit_log where user_id='{uid}'")
        psql(f"delete from maestroradio.artist_signal_events where fan_id='{uid}'")
        req('DELETE', BASE + f'/auth/v1/admin/users/{uid}', None, {'apikey': SR, 'authorization': 'Bearer ' + SR})
    psql("delete from maestroradio.artist_signal_station_sources where last_seen_text like '%Not In Catalog%' or last_seen_text like '%Different Song%'")
    leftovers = psql(f"select count(*) from auth.users where email='{email}'")
    print('cleanup: temp user remaining =', leftovers)
    print(f"\n{sum(ok for _, ok in results)}/{len(results)} passed")
