#!/usr/bin/env python3
"""SWADE migration kit - turn on routing for an app.

usage: kit_route.py <app_schema> <lovable_project_id> <domain[,domain...]> [function names...]

 - exposes the schema through the REST API
 - maps the app's browser origins (its domains, www, and its Lovable preview) to the schema
 - gives the app an internal gateway port and points its edge functions at it
Idempotent: safe to re-run. Function names already claimed by another app are reported, not stolen.
"""
import json, re, subprocess, sys

app, pid, domains, fns = sys.argv[1], sys.argv[2], [d for d in sys.argv[3].split(',') if d], sys.argv[4:]
CONF = '/etc/nginx/conf.d/swade-app-schemas.conf'
ROUTES = '/opt/swadebase/docker/volumes/functions/main/app-routes.json'
FNDIR = '/opt/swadebase/docker/volumes/functions'

s = open(CONF).read()
routes = json.load(open(ROUTES))
port = None
if app in routes:
    port = routes[app].get('port') or (max([v.get('port', 18100) for v in routes.values()] + [18100]) + 1)
else:
    used = [v.get('port', 18100) for v in routes.values()]
    port = max(used + [18100]) + 1

lines = []
for d in domains:
    lines.append('    "~^https://(www\\.)?%s$" %s;' % (re.escape(d).replace('\\-', '-'), app))
lines.append('    "~^https://[a-z0-9-]*%s[a-z0-9.-]*$" %s;' % (pid, app))
new = [l for l in lines if l not in s]
if new:
    s = s.replace('map $http_origin $swade_app_schema {\n    default "";', 'map $http_origin $swade_app_schema {\n    default "";\n' + "\n".join(new), 1)
if f'listen 172.16.6.1:{port};' not in s:
    s += f"""
server {{
    listen 172.16.6.1:{port};
    server_name _;
    client_max_body_size 100m;
    location /rest/v1/ {{
        proxy_pass http://127.0.0.1:18000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Accept-Profile {app};
        proxy_set_header Content-Profile {app};
    }}
    location / {{
        proxy_pass http://127.0.0.1:18000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 3600s;
    }}
}}
"""
open(CONF, 'w').write(s)

claimed = {f: a for a, v in routes.items() for f in v['functions'] if a != app}
import os
mine = set(routes.get(app, {}).get('functions', []))
taken, absent = [], []
for f in fns:
    if f in claimed:
        taken.append(f'{f}->{claimed[f]}')
    elif not os.path.isdir(os.path.join(FNDIR, f)):
        absent.append(f)
    else:
        mine.add(f)
routes[app] = {'url': f'https://swadebase.cloud/app/{app}', 'port': port, 'functions': sorted(mine)}
json.dump(routes, open(ROUTES, 'w'), indent=1)

# expose schema in PostgREST (compose env) if needed
env = '/opt/swadebase/docker/.env'
e = open(env).read()
m = re.search(r'^PGRST_DB_SCHEMAS=(.*)$', e, re.M)
changed = False
if m and app not in m.group(1).split(','):
    e = e.replace(m.group(0), m.group(0) + ',' + app)
    open(env, 'w').write(e)
    changed = True
print(f'app={app} port={port} origins_added={len(new)} functions={len(mine)} name_collisions={taken} not_deployed={absent} postgrest_env_changed={changed} env_var_found={bool(m)}')
r = subprocess.run(['nginx', '-t'], capture_output=True, text=True)
print('nginx:', 'ok' if r.returncode == 0 else r.stderr[-300:])
if r.returncode == 0:
    subprocess.run(['systemctl', 'reload', 'nginx'])
