#!/usr/bin/env python3
"""Ship Music Mogul to themaestroradio.com/play/ and allow canvas use of station art. Idempotent; backs up nginx first."""
import shutil, subprocess, time, sys, os
ts = time.strftime('%Y%m%d-%H%M%S')
SITE = '/etc/nginx/sites-available/themaestroradio'
ENGINE = os.path.realpath('/etc/nginx/sites-enabled/maestro-radio-engine')
os.makedirs('/opt/backups', exist_ok=True)
for f in (SITE, ENGINE):
    shutil.copy2(f, f'/opt/backups/{os.path.basename(f)}-{ts}.conf')

# static files
subprocess.run(['rsync', '-a', '--delete', '/opt/swadebase/mogul/app/dist/', '/var/www/maestro-play/'], check=True)
subprocess.run(['chown', '-R', 'www-data:www-data', '/var/www/maestro-play'], check=True)

PLAY = '''  # Music Mogul game (static build from /opt/swadebase/mogul/app)
  location = /play { return 301 /play/; }
  location ^~ /play/assets/ {
    alias /var/www/maestro-play/assets/;
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
  location ^~ /play/ {
    alias /var/www/maestro-play/;
    try_files $uri $uri/ /play/index.html;
    add_header Cache-Control "no-cache";
  }

'''
s = open(SITE).read()
if '/var/www/maestro-play' not in s:
    i = s.index('  location / {')
    s = s[:i] + PLAY + s[i:]
    open(SITE, 'w').write(s)

ART = '''  # station artwork usable in canvas (Music Mogul posters)
  location ~ ^/api/station/[^/]+/art/ {
    proxy_pass http://127.0.0.1:10080;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_hide_header Access-Control-Allow-Origin;
    add_header Access-Control-Allow-Origin * always;
  }
'''
e = open(ENGINE).read()
if '/art/ {' not in e:
    i = e.index('  # live audio streams')
    e = e[:i] + ART + e[i:]
    open(ENGINE, 'w').write(e)

r = subprocess.run(['nginx', '-t'], capture_output=True, text=True)
if r.returncode != 0:
    print('nginx -t FAILED, restoring backups\n', r.stderr)
    shutil.copy2(f'/opt/backups/{os.path.basename(SITE)}-{ts}.conf', SITE)
    shutil.copy2(f'/opt/backups/{os.path.basename(ENGINE)}-{ts}.conf', ENGINE)
    sys.exit(1)
subprocess.run(['systemctl', 'reload', 'nginx'], check=True)
print('deployed', ts)
