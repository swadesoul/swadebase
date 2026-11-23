#!/usr/bin/env python3
"""Maestro Radio week grid -> station engine schedules (2026-11-19, Swade).

The week grid (maestroradio.station_week_grid) says what plays in every time slot of all seven days.
This script writes that into the engine's playlist schedules, then reads them back.

  week_grid_sync.py mirror            refresh the playlist list the editor shows (names, song counts)
  week_grid_sync.py seed              fill an empty grid with the default week (only if the grid is empty)
  week_grid_sync.py plan              show what would change (no writes to the engine)
  week_grid_sync.py apply             write + read back, back up the old schedules first
  week_grid_sync.py auto              mirror, then apply only if settings.pending_sync (what the timer runs)

Rules: a slot plays its music playlist when that playlist has at least min_songs songs, otherwise its fallback.
Only playlists the grid uses (plus the old daypart music playlists) are managed; a managed playlist with no slots
left is disabled so it can't leak into general rotation. Ads, DJ spots, shows and books are never touched.
"""
import datetime as dt, json, os, sys
sys.path.insert(0, '/opt/maestro-assistant/factory')
import factory as f  # noqa: E402

f.ENV = f.load_env()
BACKUPS = '/opt/swadebase/var/week-grid'
DAYS = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
GOSPEL_NAME = 'Gospel Sunday · Music'


def st():
    s = f.station(); return s['id'], s['azuracast_station_id']


def playlists(sid):
    return f.engine(f'/api/station/{sid}/playlists')


def mirror():
    station_id, sid = st(); pls = playlists(sid)
    grid = f.db('station_week_grid', filters={'station_id': 'eq.' + station_id}, select='music_playlist_id,fallback_playlist_id', limit=2000)
    used = {g[k] for g in grid for k in ('music_playlist_id', 'fallback_playlist_id') if g.get(k)}
    rows = [{'station_id': station_id, 'engine_id': p['id'], 'name': p['name'], 'type': p['type'], 'num_songs': p.get('num_songs') or 0,
             'is_enabled': p['is_enabled'], 'managed_by_grid': p['id'] in used, 'synced_at': dt.datetime.now(dt.timezone.utc).isoformat()} for p in pls]
    f.db('station_engine_playlists', 'POST', rows, upsert=True)
    return pls


def ensure_gospel(sid, pls):
    g = next((p for p in pls if p['name'] == GOSPEL_NAME), None)
    if g: return g['id']
    made = f.engine(f'/api/station/{sid}/playlists', 'POST', {'name': GOSPEL_NAME, 'type': 'default', 'source': 'songs', 'order': 'shuffle',
                                                           'is_enabled': True, 'weight': 3, 'include_in_requests': True, 'schedule_items': []})
    print('created engine playlist', made.get('id'), GOSPEL_NAME); return made['id']


def seed():
    station_id, sid = st()
    if f.db('station_week_grid', filters={'station_id': 'eq.' + station_id}, select='id', limit=1):
        print('grid already has slots; seed skipped'); return
    pls = playlists(sid); by = {p['name']: p['id'] for p in pls}
    gospel = ensure_gospel(sid, pls)
    P = lambda n: by[n]
    ON, MO, MI, DR, NI = P('Overnight · Music'), P('Maestro Mornings · Music'), P('Midday Mix · Music'), P('Drive Time · Music'), P('Maestro Nights · Music')
    WK, PARTY, SOUL = P('Weekend Wake-Up · Music'), P('Saturday Night Party · Music'), P('Sunday Soul · Music')
    BASE = {'fallback_playlist_id': None, 'min_songs': 40, 'show_slug': None, 'show_edition': None, 'talk_tone': 'standard', 'notes': ''}
    S = lambda d, a, b, label, music, **k: {**BASE, 'station_id': station_id, 'day': d, 'start_hm': a, 'end_hm': b, 'label': label, 'music_playlist_id': music, **k}
    rows = []
    for d in range(1, 6):  # Monday - Friday
        rows += [S(d, 0, 600, 'Overnight', ON), S(d, 600, 800, 'Maestro Mornings', MO),
                 S(d, 800, 900, 'The Maestro Morning Mix', MO, show_slug='morning-mix', show_edition='weekly', notes='New episode Mondays, replays daily. Music plays here until episodes air.'),
                 S(d, 900, 1000, 'Maestro Mornings', MO), S(d, 1000, 1500, 'Midday Mix', MI, notes='Jump It or Stomp It airs at 10 AM and 1 PM.'),
                 S(d, 1500, 1900, 'Drive Time', DR, notes='Jump It or Stomp It airs at 4 PM.'), S(d, 1900, 2300, 'Maestro Nights', NI, notes='Jump It or Stomp It airs at 7 PM.'),
                 S(d, 2300, 2400, 'Morning Mix replay', NI, show_slug='morning-mix', show_edition='weekly', talk_tone='late-night')]
    rows += [S(6, 0, 600, 'Overnight', ON), S(6, 600, 800, 'Weekend Wake-Up', WK),
             S(6, 800, 900, 'The Maestro Morning Mix', WK, show_slug='morning-mix', show_edition='weekly'),
             S(6, 900, 1200, 'Weekend Wake-Up', WK), S(6, 1200, 1500, 'Midday Mix', MI), S(6, 1500, 2000, 'Drive Time', DR),
             S(6, 2000, 2300, 'Saturday Night Party', PARTY, talk_tone='party'),
             S(6, 2300, 2400, 'Morning Mix replay', PARTY, show_slug='morning-mix', show_edition='weekly', talk_tone='late-night')]
    G = dict(fallback_playlist_id=SOUL, min_songs=150, talk_tone='spiritual')
    rows += [S(7, 0, 600, 'Overnight', ON), S(7, 600, 800, 'Gospel Sunday Morning', gospel, **G),
             S(7, 800, 900, 'The Maestro Morning Mix: Sunday Edition', gospel, show_slug='morning-mix', show_edition='sunday', **G),
             S(7, 900, 1600, 'Gospel Sunday', gospel, **G), S(7, 1600, 2100, 'Gospel Sunday Evening', gospel, **G),
             S(7, 2100, 2300, 'Sunday Soul', SOUL, talk_tone='spiritual'),
             S(7, 2300, 2400, 'Morning Mix replay: Sunday Edition', SOUL, show_slug='morning-mix', show_edition='sunday', talk_tone='spiritual')]
    f.db('station_week_grid', 'POST', rows)
    f.db('station_week_settings', 'POST', {'station_id': station_id}, upsert=True)
    print('seeded', len(rows), 'slots')


def desired(station_id, pls):
    count = {p['id']: p.get('num_songs') or 0 for p in pls}
    grid = f.db('station_week_grid', filters={'station_id': 'eq.' + station_id}, order='day.asc,start_hm.asc', limit=2000)
    eff = []  # (day, start, end, playlist)
    for g in grid:
        m, fb = g.get('music_playlist_id'), g.get('fallback_playlist_id')
        use = m if (m and count.get(m, 0) >= g['min_songs']) or not fb else fb
        if use: eff.append((g['day'], g['start_hm'], g['end_hm'], use, g['label'], m != use))
    # merge back-to-back ranges on the same day and playlist
    merged = []
    for e in eff:
        if merged and merged[-1][0] == e[0] and merged[-1][3] == e[3] and merged[-1][2] == e[1]:
            merged[-1] = (e[0], merged[-1][1], e[2], e[3], merged[-1][4], merged[-1][5] or e[5])
        else: merged.append(e)
    want = {}
    for d, a, b, pid, *_ in merged:
        want.setdefault(pid, {}).setdefault((a, 0 if b == 2400 else b), []).append(d)
    items = {pid: sorted([{'start_time': a, 'end_time': b, 'days': sorted(days), 'start_date': None, 'end_date': None, 'loop_once': False}
                          for (a, b), days in r.items()], key=lambda x: (x['days'][0], x['start_time'])) for pid, r in want.items()}
    return items, eff, grid


def norm(items):
    return sorted((tuple(sorted(i.get('days') or [])), int(i['start_time']), int(i['end_time'])) for i in items)


def fmt(items):
    return ['%s %04d-%04d' % (','.join(DAYS[d] for d in i[0]) or 'all', i[1], i[2]) for i in norm(items)] or ['(no schedule)']


def plan(verbose=True):
    station_id, sid = st(); pls = playlists(sid); by = {p['id']: p for p in pls}
    items, eff, grid = desired(station_id, pls)
    if not grid: raise SystemExit('the week grid is empty; nothing will be changed (run seed first)')
    days_covered = {g['day'] for g in grid}
    if days_covered != set(range(1, 8)): raise SystemExit(f'the week grid is missing days {sorted(set(range(1, 8)) - days_covered)}; refusing to change the engine')
    legacy = {p['id'] for p in pls if p['name'].endswith('· Music') and p['type'] == 'default' and p.get('schedule_items')}
    referenced = {g[k] for g in grid for k in ('music_playlist_id', 'fallback_playlist_id') if g.get(k)}
    managed = set(items) | legacy | referenced
    changes = []
    for pid in sorted(managed):
        p = by.get(pid)
        if not p: changes.append({'playlist': pid, 'error': 'playlist not found in engine'}); continue
        new = items.get(pid, []); enable = bool(new)
        if norm(p.get('schedule_items') or []) != norm(new) or p['is_enabled'] != enable:
            changes.append({'playlist': pid, 'name': p['name'], 'enable': enable, 'old': fmt(p.get('schedule_items') or []), 'new': fmt(new), 'items': new})
    fallbacks = sorted({(DAYS[e[0]], e[4]) for e in eff if e[5]})
    if verbose:
        for c in changes:
            print(f"\n{c.get('name', c['playlist'])}  {'ENABLED' if c.get('enable') else 'DISABLED (no slots)'}")
            print('  now :', '; '.join(c.get('old', [])) if 'old' in c else c.get('error'))
            print('  grid:', '; '.join(c.get('new', [])))
        if fallbacks: print('\nUsing fallback (music playlist below its minimum):', ', '.join(f'{d} {l}' for d, l in fallbacks))
        if not changes: print('engine already matches the grid')
    return changes, sid, pls, fallbacks


def apply():
    changes, sid, pls, fallbacks = plan()
    if not changes: return {'changed': 0, 'fallbacks': fallbacks}
    if any('error' in c for c in changes): raise SystemExit('refusing to apply: ' + json.dumps([c for c in changes if 'error' in c]))
    os.makedirs(BACKUPS, exist_ok=True)
    stamp = dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    json.dump([{'id': p['id'], 'name': p['name'], 'is_enabled': p['is_enabled'], 'schedule_items': p.get('schedule_items') or []} for p in pls],
              open(f'{BACKUPS}/engine-schedules-{stamp}.json', 'w'), indent=1)
    for c in changes:
        f.engine(f"/api/station/{sid}/playlist/{c['playlist']}", 'PUT', {'schedule_items': c['items'], 'is_enabled': c['enable']})
    # read back
    after = {p['id']: p for p in playlists(sid)}; bad = []
    for c in changes:
        p = after[c['playlist']]
        if norm(p.get('schedule_items') or []) != norm(c['items']) or p['is_enabled'] != c['enable']: bad.append(c['name'])
    result = {'changed': len(changes), 'verified': not bad, 'mismatch': bad, 'backup': f'engine-schedules-{stamp}.json', 'fallbacks': fallbacks}
    station_id, _ = st()
    f.db('station_week_settings', 'PATCH', {'pending_sync': bool(bad), 'last_sync_at': dt.datetime.now(dt.timezone.utc).isoformat(), 'last_sync_result': result},
         filters={'station_id': 'eq.' + station_id})
    print('\n' + json.dumps(result)); return result


if __name__ == '__main__':
    cmd = (sys.argv[1:] or ['plan'])[0]
    if cmd == 'mirror': mirror(); print('mirrored')
    elif cmd == 'seed': seed(); mirror()
    elif cmd == 'plan': plan()
    elif cmd == 'apply': apply(); mirror()
    elif cmd == 'auto':
        mirror(); station_id, _ = st()
        s = (f.db('station_week_settings', filters={'station_id': 'eq.' + station_id}) or [{}])[0]
        if s.get('pending_sync') and s.get('apply_mode', 'auto') == 'auto': apply(); mirror()
    else: print(__doc__)
