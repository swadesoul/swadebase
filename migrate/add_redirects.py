#!/usr/bin/env python3
"""Add Lovable preview origins and site domains to SWADEBASE's allowed login redirects.

Google sign-in returns to SWADEBASE, which then sends the browser back to the site. A destination that is
not on this list is refused and the user lands on the default site instead - which is why sign-in failed
inside the Lovable sandbox. Each project gets exactly its own preview addresses (no blanket wildcard).
usage: add_redirects.py <project id ...>   (domains come from the routing map + OnePass registry)
"""
import re, subprocess, sys
ENV = '/opt/swadebase/docker/.env'
e = open(ENV).read()
m = re.search(r'^ADDITIONAL_REDIRECT_URLS=(.*)$', e, re.M)
cur = [x for x in m.group(1).split(',') if x]
have = set(cur)
add = []
for pid in sys.argv[1:]:
    for u in (f'https://id-preview--{pid}.lovable.app/**', f'https://{pid}.lovableproject.com/**', f'https://preview--{pid}.lovable.app/**'):
        if u not in have:
            add.append(u); have.add(u)
doms = set(re.findall(r'\(www\\\.\)\?([a-z0-9.\\-]+)\$', open('/etc/nginx/conf.d/swade-app-schemas.conf').read()))
doms = {d.replace('\\', '') for d in doms}
reg = subprocess.run(['docker', 'exec', 'supabase-db', 'psql', '-U', 'postgres', '-At', '-c',
                      "select distinct substring(u from 'https://([^/]+)') from public.onepass_clients, unnest(redirect_uris) u"],
                     capture_output=True, text=True).stdout.split()
for d in sorted(doms | set(reg)):
    for u in (f'https://{d}/**', f'https://www.{d}/**'):
        if u not in have:
            add.append(u); have.add(u)
if add:
    open(ENV, 'w').write(e.replace(m.group(0), 'ADDITIONAL_REDIRECT_URLS=' + ','.join(cur + add)))
print(f'had={len(cur)} added={len(add)} total={len(cur)+len(add)}')
print('new domains:', sorted({re.sub(r"^https://(www\.)?|/\*\*$", "", u) for u in add if "lovable" not in u}))
