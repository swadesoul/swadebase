#!/usr/bin/env python3
"""Jump It or Stomp It engine (2026-11-19).

  jos_engine.py clips    -> cut a 45-second clip for every Artist Discovery song that is scheduled/active and has no
                            Jump It or Stomp It entry yet; store it in the public 'jump-or-stomp' bucket; open a voting round.
  jos_engine.py decide   -> close rounds whose window ended. Under min votes on round 1 -> one extended round.
                            Otherwise: jump % >= threshold -> 'hot', else 'stomped'. Also crowns Hot Artist of the Month
                            on the 1st (top hot verdict of the previous month by jump %, then votes).
  jos_engine.py all      -> clips then decide (what the timer runs).

Audio source: Artist Discovery's own B2 vault (factory.signed(audio_key)), so nothing is re-uploaded by artists.
Secrets come from the existing env files; nothing is printed.
"""
import datetime as dt, json, os, re, subprocess, sys, tempfile, urllib.request
sys.path.insert(0, '/opt/maestro-assistant/factory')
import factory  # noqa: E402

factory.ENV = factory.load_env()
ENV = open('/opt/swadebase/docker/.env').read()
SR = re.search(r'^SERVICE_ROLE_KEY=(.*)$', ENV, re.M).group(1).strip().strip('"')
PUBLIC = 'https://swadebase.cloud/storage/v1/object/public/jump-or-stomp/'
now = lambda: dt.datetime.now(dt.timezone.utc)
db = factory.db


def cfg():
    return db('jos_settings', filters={'id': 'eq.1'})[0]


def put(name, data, ctype):
    req = urllib.request.Request(f'http://127.0.0.1:18000/storage/v1/object/jump-or-stomp/{name}', data=data, method='POST',
        headers={'apikey': SR, 'authorization': 'Bearer ' + SR, 'content-type': ctype, 'x-upsert': 'true', 'cache-control': 'max-age=86400'})
    return urllib.request.urlopen(req, timeout=120).status


def probe(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path], capture_output=True, text=True).stdout
    try: return float(out.strip())
    except ValueError: return 0.0


def clips(limit=20, rows=None):
    c = cfg(); seconds = int(c.get('clip_seconds') or 45); start_at = int(c.get('clip_start_seconds') or 30)
    have = {r['enrollment_id'] for r in db('jos_entries', select='enrollment_id', limit=5000)}
    if rows is None:
        rows = [r for r in db('discovery_enrollments', filters={'status': 'in.(scheduled,active)', 'audio_key': 'not.is.null'}, order='created_at.asc', limit=500) if r['id'] not in have][:limit]
    made = 0
    for r in rows:
        with tempfile.TemporaryDirectory() as tmp:
            src, out = os.path.join(tmp, 'src'), os.path.join(tmp, 'clip.mp3')
            urllib.request.urlretrieve(factory.signed(r['audio_key']), src)
            dur = probe(src)
            if dur < 15: print('skip (too short)', r['id']); continue
            ss = start_at if dur >= start_at + seconds else max(0.0, (dur - seconds) / 2)
            length = min(seconds, dur - ss)
            af = f"afade=t=in:d=0.6,afade=t=out:st={max(length - 1.8, 0):.2f}:d=1.8,loudnorm=I=-14:TP=-1.5:LRA=11"
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{ss:.2f}', '-t', f'{length:.2f}', '-i', src, '-af', af,
                            '-ac', '2', '-ar', '44100', '-b:a', '160k', out], check=True)
            name = f"clips/{r['id']}.mp3"
            put(name, open(out, 'rb').read(), 'audio/mpeg')
        opens = now(); closes = opens + dt.timedelta(days=int(c.get('run_days') or 30))
        db('jos_entries', 'POST', {'enrollment_id': r['id'], 'clip_url': PUBLIC + name, 'round': 1,
                                   'opens_at': opens.isoformat(), 'closes_at': closes.isoformat()})
        made += 1; print('clip + round opened', r['id'], f'{ss:.0f}s-{ss + length:.0f}s')
    return made


def decide():
    c = cfg(); t = now(); decided = 0
    min_votes = int(c.get('min_votes') or 25); threshold = float(c.get('jump_threshold') or 50); run_days = int(c.get('run_days') or 30)
    for e in db('jos_entries', filters={'verdict': 'is.null', 'closes_at': 'lte.' + t.isoformat()}, limit=200):
        tally = (db('jos_tally', filters={'enrollment_id': 'eq.' + e['enrollment_id']}) or [{}])[0]
        total = int(tally.get('total_votes') or 0); pct = float(tally.get('jump_pct') or 0)
        if total < min_votes and int(e.get('round') or 1) == 1:
            db('jos_entries', 'PATCH', {'round': 2, 'closes_at': (t + dt.timedelta(days=run_days)).isoformat()}, filters={'enrollment_id': 'eq.' + e['enrollment_id']})
            print('extended', e['enrollment_id'], f'{total} votes'); continue
        verdict = 'hot' if total > 0 and pct >= threshold else 'stomped'
        db('jos_entries', 'PATCH', {'verdict': verdict, 'jump_pct': round(pct, 1), 'total_votes': total, 'decided_at': t.isoformat()},
           filters={'enrollment_id': 'eq.' + e['enrollment_id']})
        decided += 1; print(verdict, e['enrollment_id'], f'{pct:.0f}% of {total}')
    # Hot Artist of the Month: on the 1st (Central), crown last month's best hot verdict once.
    local = t.astimezone(factory.ZoneInfo('America/Chicago'))
    if local.day == 1:
        first = local.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        prev = (first - dt.timedelta(days=1)).replace(day=1)
        already = db('jos_entries', filters={'hot_of_month': 'eq.true', 'decided_at': f'gte.{prev.astimezone(dt.timezone.utc).isoformat()}'}, select='enrollment_id')
        if not already:
            cands = db('jos_entries', filters={'verdict': 'eq.hot', 'decided_at': f'gte.{prev.astimezone(dt.timezone.utc).isoformat()}'}, limit=500)
            cands = [x for x in cands if dt.datetime.fromisoformat(x['decided_at'].replace('Z', '+00:00')) < first.astimezone(dt.timezone.utc)]
            if cands:
                top = max(cands, key=lambda x: (float(x.get('jump_pct') or 0), int(x.get('total_votes') or 0)))
                db('jos_entries', 'PATCH', {'hot_of_month': True}, filters={'enrollment_id': 'eq.' + top['enrollment_id']})
                print('hot artist of the month', top['enrollment_id'])
    return decided


if __name__ == '__main__':
    cmd = (sys.argv[1:] or ['all'])[0]
    if cmd in ('clips', 'all'): print('clips made:', clips())
    if cmd in ('decide', 'all'): print('verdicts:', decide())
