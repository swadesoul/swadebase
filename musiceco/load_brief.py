#!/usr/bin/env python3
"""Load one day's music ecosystem brief into SWADEBASE (schema: musiceco).

usage: load_brief.py <entries.json> [--date YYYY-MM-DD] [--base https://swadebase.cloud] [--dry-run] [--counts]

- <entries.json>: JSON array of entries (section, category, name, website, description, fit, location,
  email, contact_page, phone, socials, address, contact_person_name, contact_person_title,
  contact_person_linkedin, source_urls, optional recommended_services / recommended_reason /
  contact_person_email / contact_person_phone).
- --date defaults to today in America/Chicago.
- Goes through the web server: POST <base>/rest/v1/rpc/load_brief with Content-Profile: musiceco,
  authenticated with the existing SWADEBASE service-role key read from /opt/swadebase/docker/.env
  (override path with SWADE_ENV). The key is never printed.
- Nulls, empty strings/lists/socials and placeholders ("not public", "n/a") are dropped before
  sending, so the raw enriched file loads as-is and a rerun never blanks a stored value.
- Idempotent: places upsert on dedupe_key, contacts dedupe on email / linkedin / name+place,
  brief_entries is keyed on (brief_date, place_id). Re-running the same file changes nothing new.
"""
import argparse, datetime, json, os, sys, urllib.request, urllib.error

try:
    from zoneinfo import ZoneInfo
    TODAY = datetime.datetime.now(ZoneInfo('America/Chicago')).date().isoformat()
except Exception:
    TODAY = datetime.date.today().isoformat()

SECTIONS = {'places', 'potential_customers'}


def service_key():
    path = os.environ.get('SWADE_ENV', '/opt/swadebase/docker/.env')
    for line in open(path):
        if line.startswith('SERVICE_ROLE_KEY='):
            return line.split('=', 1)[1].strip().strip('"').strip("'")
    sys.exit('SERVICE_ROLE_KEY not found in ' + path)


def call(base, key, method, path, body=None, extra=None):
    h = {'apikey': key, 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json',
         'Accept-Profile': 'musiceco', 'Content-Profile': 'musiceco'}
    h.update(extra or {})
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(base.rstrip('/') + path, data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return r.status, r.headers, r.read().decode()
    except urllib.error.HTTPError as ex:
        sys.exit(f'HTTP {ex.code} on {path}: {ex.read().decode()[:500]}')


def validate(entries):
    if not isinstance(entries, list):
        sys.exit('input must be a JSON array')
    bad = []
    for i, e in enumerate(entries):
        if not isinstance(e, dict) or not str(e.get('name') or '').strip():
            bad.append(f'#{i}: missing name')
        elif (e.get('section') or 'places') not in SECTIONS:
            bad.append(f'#{i} {e.get("name")}: section must be places or potential_customers')
        for f in ('source_urls', 'recommended_services'):
            if e.get(f) is not None and not isinstance(e.get(f), list):
                bad.append(f'#{i} {e.get("name")}: {f} must be a list')
        if e.get('socials') is not None and not isinstance(e.get('socials'), dict):
            bad.append(f'#{i} {e.get("name")}: socials must be an object')
    if bad:
        sys.exit('invalid entries:\n  ' + '\n  '.join(bad[:50]))


BLANK = {'', 'n/a', 'na', 'none', 'null', 'not public', 'not found', 'unknown', '-'}


def clean(v):
    """Drop nulls, empty values and placeholders like "not public" so a rerun never blanks stored data."""
    if isinstance(v, str):
        v = v.strip()
        return None if v.lower() in BLANK else v
    if isinstance(v, dict):
        v = {k: c for k, c in ((k, clean(x)) for k, x in v.items()) if c is not None}
        return v or None
    if isinstance(v, list):
        v = [c for c in (clean(x) for x in v) if c is not None]
        return v or None
    return v


def normalize(entries):
    return [{k: c for k, c in ((k, clean(x)) for k, x in e.items()) if c is not None} for e in entries]


def counts(base, key):
    out = {}
    for t, q in (('places', 'section=eq.places'), ('potential_customers', 'section=eq.potential_customers'),
                 ('contacts', ''), ('brief_entries', ''), ('outreach', '')):
        table = 'places' if t == 'potential_customers' else t
        _, hdr, _ = call(base, key, 'HEAD', f'/rest/v1/{table}?select=*&{q}', extra={'Prefer': 'count=exact'})
        out[t] = int((hdr.get('Content-Range') or '*/0').split('/')[-1])
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('file', nargs='?')
    ap.add_argument('--date', default=TODAY)
    ap.add_argument('--base', default=os.environ.get('SWADE_BASE', 'https://swadebase.cloud'))
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--counts', action='store_true', help='print table counts (alone or after a load)')
    a = ap.parse_args()
    datetime.date.fromisoformat(a.date)
    key = None
    if a.file:
        entries = json.load(open(a.file))
        validate(entries)
        entries = normalize(entries)
        print(f'{len(entries)} entries valid for brief_date {a.date}')
        if a.dry_run:
            return
        key = service_key()
        total = {}
        for i in range(0, len(entries), 200):
            _, _, body = call(a.base, key, 'POST', '/rest/v1/rpc/load_brief',
                              {'entries': entries[i:i + 200], 'd': a.date})
            for k2, v in json.loads(body).items():
                total[k2] = total[k2] + v if isinstance(v, int) and k2 in total else v
        print('loaded:', json.dumps(total))
    if a.counts or not a.file:
        key = key or service_key()
        print('table counts:', json.dumps(counts(a.base, key)))


if __name__ == '__main__':
    main()
