#!/usr/bin/env python3
# Configure Mailcow: domain, DKIM, mailboxes, BCC copies to the super admin. Idempotent. Passwords only go to /root/artist-mailboxes.txt.
import json, os, secrets, ssl, string, subprocess, urllib.request
K = open('/root/mailcow-api-key.txt').read().strip()
CTX = ssl._create_unverified_context()  # local loopback to the mailcow container
DOMAIN = 'artists.swadesoul.com'; SUPER = 'swadesoul@gmail.com'; ARCHIVE = f'admin@{DOMAIN}'
def api(m, path, body=None):
    r = urllib.request.Request('https://127.0.0.1:18444/api/v1/' + path, data=json.dumps(body).encode() if body is not None else None,
                               headers={'X-API-Key': K, 'content-type': 'application/json'}, method=m)
    with urllib.request.urlopen(r, timeout=60, context=CTX) as x: return json.loads(x.read() or b'null')
def ok(res, what):
    items = res if isinstance(res, list) else [res]
    bad = [i for i in items if isinstance(i, dict) and i.get('type') not in ('success', None)]
    print(('ok   ' if not bad else 'warn ') + what, '' if not bad else str(bad)[:200])

if not any(d.get('domain_name') == DOMAIN for d in (api('GET', 'get/domain/all') or [])):
    ok(api('POST', 'add/domain', {'domain': DOMAIN, 'description': 'Swade Soul artists', 'aliases': 50, 'mailboxes': 50, 'defquota': 2048, 'maxquota': 10240,
                                  'quota': 102400, 'active': 1, 'rl_value': 200, 'rl_frame': 'h', 'backupmx': 0, 'relay_all_recipients': 0}), 'add domain')
dk = api('GET', f'get/dkim/{DOMAIN}') or {}
if not dk.get('dkim_txt'):
    ok(api('POST', 'add/dkim', {'domains': DOMAIN, 'dkim_selector': 'dkim', 'key_size': 2048}), 'generate DKIM')
    dk = api('GET', f'get/dkim/{DOMAIN}')
open('/opt/swadebase/signal/dkim_artists.txt', 'w').write(dk['dkim_txt'])

people = {'admin': 'Super admin archive', 'ameyea': 'Ameyea Swade', 'reggie': 'Reggie Swade', 'shamone': 'Shamone Swade', 'granada': 'Granada Swade',
          'nevaborya': 'Nevaborya Swade', 'steemo': 'Steemo Swade', 'mason': 'Mason Swade', 'suki': 'Suki Swade', 'karrianne': 'KarriAnne Swade',
          'ty': 'Ty Swade', 'noblerayne': 'Noble Rayne Swade'}
existing = {m.get('username') for m in (api('GET', 'get/mailbox/all') or [])}
store = '/root/artist-mailboxes.txt'; lines = open(store).read().splitlines() if os.path.exists(store) else []
alphabet = string.ascii_letters + string.digits
for local, name in people.items():
    addr = f'{local}@{DOMAIN}'
    if addr in existing: continue
    pw = ''.join(secrets.choice(alphabet) for _ in range(20)) + '!9a'
    ok(api('POST', 'add/mailbox', {'local_part': local, 'domain': DOMAIN, 'name': name, 'quota': 2048, 'password': pw, 'password2': pw, 'active': 1,
                                   'force_pw_update': 0, 'tls_enforce_in': 0, 'tls_enforce_out': 0}), f'mailbox {addr}')
    lines.append(f'{addr}\t{pw}\t{name}')
old = os.umask(0o077); open(store, 'w').write('\n'.join(lines) + '\n'); os.umask(old); os.chmod(store, 0o600)

# BCC: copy every artist's incoming and outgoing mail to the super admin's Gmail and the on-server archive
maps = api('GET', 'get/bcc/all') or []
have = {(m.get('local_dest'), m.get('type'), m.get('bcc_dest')) for m in maps}
for local in people:
    if local == 'admin': continue
    addr = f'{local}@{DOMAIN}'
    for typ in ('sender', 'rcpt'):
        for dest in (SUPER, ARCHIVE):
            if (addr, typ, dest) in have: continue
            ok(api('POST', 'add/bcc', {'local_dest': addr, 'type': typ, 'bcc_dest': dest, 'active': 1}), f'bcc {typ} {local} -> {dest.split("@")[0]}@…')
print('mailboxes:', len([l for l in lines if l.strip()]), '| DKIM saved to dkim_artists.txt')
