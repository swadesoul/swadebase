#!/usr/bin/env python3
"""Maestro Morning Mix audience counter + schedule rule (2026-11-18, Claude for Swade).
Swade's rule: weekly show now; every other day once there are 500+ consistent listeners; daily at 1,000+.
- Every 5 min during Morning Mix airings (8-9 AM and 11 PM-midnight Central) it records unique listeners on Maestro Radio.
- Sundays at 9 PM Central it computes the week's number: the average of each airing's peak unique listeners.
- "Consistent" = that weekly number at or above the threshold 4 weeks in a row. Then it emails Swade (once per stage).
  It never changes the schedule itself: cadence changes only when the founder approves (more episodes = more cost).
Timer: maestro-mm-audience.timer (every 5 min). Log: journalctl -u maestro-mm-audience."""
import re, json, datetime, urllib.request
from zoneinfo import ZoneInfo
TZ = ZoneInfo('America/Chicago')
ENV = open('/opt/swadebase/docker/.env').read(); FENV = open('/opt/swadebase/docker/functions.env').read()
g = lambda s, k: re.search(r'^%s=(.*)$' % k, s, re.M).group(1).strip().strip('"')
SR = g(ENV, 'SERVICE_ROLE_KEY')
H = {'apikey': SR, 'authorization': 'Bearer ' + SR, 'content-profile': 'maestroradio', 'accept-profile': 'maestroradio', 'content-type': 'application/json'}
REST = 'http://127.0.0.1:18000/rest/v1/'

def db(method, path, body=None):
    r = urllib.request.urlopen(urllib.request.Request(REST + path, data=json.dumps(body).encode() if body is not None else None, method=method,
                               headers={**H, 'prefer': 'return=representation'}), timeout=30)
    t = r.read(); return json.loads(t) if t else None

def listeners():
    req = urllib.request.Request('http://127.0.0.1:10080/api/nowplaying/maestro_radio', headers={'Host': 'radio.themaestroradio.com', 'X-Forwarded-Proto': 'https'})
    return int(json.loads(urllib.request.urlopen(req, timeout=20).read())['listeners'].get('unique') or 0)

def email(subject, html):
    key = g(FENV, 'MAESTRO_POSTAL_API_KEY'); base = g(FENV, 'MAESTRO_POSTAL_URL').rstrip('/'); frm = g(FENV, 'MAESTRO_POSTAL_FROM')
    to = db('GET', 'morning_mix_config?select=founder_email&id=eq.1')[0]['founder_email']
    body = json.dumps({'from': f'"Maestro Morning Mix" <{frm}>', 'to': [to], 'subject': subject, 'html_body': html}).encode()
    urllib.request.urlopen(urllib.request.Request(base + '/api/v1/send/message', data=body, method='POST',
                           headers={'X-Server-API-Key': key, 'Content-Type': 'application/json'}), timeout=30)

def main():
    now = datetime.datetime.now(TZ)
    slot = 'live' if now.hour == 8 else 'replay' if now.hour == 23 else None
    if slot:
        db('POST', 'morning_mix_audience', {'airing_date': now.date().isoformat(), 'slot': slot, 'unique_listeners': listeners()})
        print('sampled', slot)
    if now.weekday() == 6 and now.hour == 21 and now.minute < 5:   # Sunday 9 PM: weekly number + rule check
        week = (now.date() - datetime.timedelta(days=6)).isoformat()
        rows = db('GET', f'morning_mix_audience?select=airing_date,slot,unique_listeners&airing_date=gte.{week}') or []
        peaks = {}
        for r in rows: k = (r['airing_date'], r['slot']); peaks[k] = max(peaks.get(k, 0), r['unique_listeners'])
        avg = round(sum(peaks.values()) / len(peaks)) if peaks else 0
        db('POST', 'morning_mix_audience_weeks', {'week_start': week, 'airings': len(peaks), 'avg_peak_listeners': avg})
        cfg = db('GET', 'morning_mix_config?select=*&id=eq.1')[0]
        last4 = [w['avg_peak_listeners'] for w in (db('GET', 'morning_mix_audience_weeks?select=avg_peak_listeners&order=week_start.desc&limit=4') or [])]
        steady = min(last4) if len(last4) == 4 else 0
        for stage, need in (('daily', cfg['daily_threshold']), ('every_other_day', cfg['every_other_day_threshold'])):
            if steady >= need and cfg['cadence'] != stage and stage not in (cfg['notified_stages'] or []):
                if stage == 'every_other_day' and cfg['cadence'] == 'daily': break
                email(f'Morning Mix hit {need}+ consistent listeners: ready for {stage.replace("_", " ")} shows?',
                      f'<p>Big Swade, the Maestro Morning Mix has averaged at least <b>{steady:,}</b> listeners at its peak for 4 weeks straight.</p>'
                      f'<p>Your rule says that\'s the mark to go <b>{stage.replace("_", " ")}</b>. Nothing changes until you say so. Just tell Claude "go {stage.replace("_", " ")}".</p>')
                db('PATCH', 'morning_mix_config?id=eq.1', {'notified_stages': (cfg['notified_stages'] or []) + [stage]})
                print('notified', stage); break
        print('week', week, 'avg_peak', avg, 'steady4', steady)

if __name__ == '__main__':
    main()
