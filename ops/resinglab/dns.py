#!/usr/bin/env python3
"""Scoped ReSingLab DNS operations using the existing owner credential store."""
import ast
import datetime
import fcntl
import json
import os
from pathlib import Path
import subprocess
import sys
import time

ZONE = 'resinglab.com'
BACKUP = Path('/opt/swadebase/backups/resinglab-migration-20261119')
OPS = Path('/opt/swadebase/ops/resinglab')

def client():
    source = Path('/opt/swadebase/signal/namecheap_dns.py')
    nodes = []
    for node in ast.parse(source.read_text()).body:
        if isinstance(node, ast.Assign) and any(isinstance(x, ast.Tuple) for x in node.targets) and any(isinstance(x, ast.Name) and x.id == 'domain' for x in ast.walk(node.targets[0])):
            break
        nodes.append(node)
    namespace = {}
    exec(compile(ast.Module(body=nodes, type_ignores=[]), str(source), 'exec'), namespace)
    return namespace['call']

def read_zone(call):
    result = call('namecheap.domains.dns.getHosts', {'SLD': 'resinglab', 'TLD': 'com'}, post=True)
    row = next(x for x in result.iter() if x.tag.rsplit('}', 1)[-1].lower() == 'domaindnsgethostsresult')
    if row.get('IsUsingOurDNS') != 'true':
        raise RuntimeError('Authoritative DNS provider changed')
    return {'domain': ZONE, 'email_type': row.get('EmailType') or 'NONE', 'hosts': [{k: h.get(k, '') for k in ['Name', 'Type', 'Address', 'MXPref', 'TTL']} for h in row.iter() if h.tag.rsplit('}', 1)[-1].lower() == 'host']}

def canonical(zone):
    return sorted((h['Name'], h['Type'], h['Address'].rstrip('.'), h.get('MXPref', '') if h['Type'] == 'MX' else '', h.get('TTL', '')) for h in zone['hosts'])

def save_zone(call, before, after, label):
    if canonical(read_zone(call)) != canonical(before):
        raise RuntimeError('DNS changed concurrently; refusing to overwrite')
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    BACKUP.mkdir(parents=True, mode=0o700, exist_ok=True)
    saved = BACKUP / ('dns-' + label + '-' + stamp + '.json')
    saved.write_text(json.dumps(before, indent=2)); saved.chmod(0o600)
    payload = {'SLD': 'resinglab', 'TLD': 'com', 'EmailType': before['email_type']}
    for i, host in enumerate(after['hosts'], 1):
        payload.update({f'HostName{i}': host['Name'], f'RecordType{i}': host['Type'], f'Address{i}': host['Address'], f'TTL{i}': host.get('TTL') or '300'})
        if host['Type'] == 'MX': payload[f'MXPref{i}'] = host.get('MXPref') or '10'
    result = call('namecheap.domains.dns.setHosts', payload, post=True)
    accepted = next(x for x in result.iter() if x.tag.rsplit('}', 1)[-1].lower() == 'domaindnssethostsresult')
    if accepted.get('IsSuccess') != 'true': raise RuntimeError('DNS update not confirmed')
    actual = read_zone(call)
    if canonical(actual) != canonical(after) or actual['email_type'] != before['email_type']:
        raise RuntimeError('DNS read-back differs from requested scoped update')
    return actual

def challenge(call, cleanup=False):
    domain = os.environ['CERTBOT_DOMAIN']
    if domain not in [ZONE, 'www.'+ZONE]: raise RuntimeError('Unexpected certificate domain')
    value = os.environ['CERTBOT_VALIDATION']
    relative = domain[:-len(ZONE)].rstrip('.')
    name = '_acme-challenge' + ('.'+relative if relative else '')
    before = read_zone(call)
    matching = lambda h: h['Name'] == name and h['Type'] == 'TXT' and h['Address'].strip('"') == value
    after = {**before, 'hosts': [h for h in before['hosts'] if not (cleanup and matching(h))]}
    if not cleanup and not any(matching(h) for h in before['hosts']):
        after['hosts'].append({'Name': name, 'Type': 'TXT', 'Address': value, 'MXPref': '10', 'TTL': '300'})
    if canonical(after) != canonical(before): save_zone(call, before, after, 'acme-cleanup' if cleanup else 'acme-auth')
    if cleanup:
        print('Removed only this certificate challenge for '+domain); return
    for attempt in range(60):
        propagated = True
        for server in ['dns1.registrar-servers.com', 'dns2.registrar-servers.com']:
            check = subprocess.run(['dig', '+time=2', '+tries=1', '+short', '@'+server, 'TXT', name+'.'+ZONE], capture_output=True, text=True, timeout=5)
            if value not in check.stdout: propagated = False
        if propagated:
            print('Certificate DNS challenge visible on both authorities for '+domain); return
        time.sleep(2)
    raise RuntimeError('Certificate challenge propagation deadline exceeded')

def cutover(call, target='2.25.74.73'):
    before = read_zone(call)
    names = {'@', 'www'}
    targets = [h for h in before['hosts'] if h['Name'] in names and h['Type'] in {'A', 'AAAA', 'CNAME', 'URL', 'URL301', 'FRAME'}]
    if any(h['Type'] != 'A' or h['Address'] not in {'185.158.133.1', '2.25.74.73'} for h in targets):
        raise RuntimeError('Unexpected current web target; stop for inspection')
    after = {**before, 'hosts': [h for h in before['hosts'] if h not in targets]}
    for name in sorted(names): after['hosts'].append({'Name': name, 'Type': 'A', 'Address': target, 'MXPref': '10', 'TTL': '300'})
    actual = save_zone(call, before, after, 'cutover' if target == '2.25.74.73' else 'rollback')
    (BACKUP/'dns-after.json').write_text(json.dumps(actual, indent=2))
    print('Apex/www web records set to '+target+'; all other DNS and email records preserved')


def main():
    OPS.mkdir(parents=True, mode=0o700, exist_ok=True)
    with open(OPS/'dns.guard', 'a') as guard:
        fcntl.flock(guard, fcntl.LOCK_EX)
        call = client()
        action = sys.argv[1]
        if action == 'auth': challenge(call)
        elif action == 'cleanup': challenge(call, cleanup=True)
        elif action == 'cutover': cutover(call)
        elif action == 'rollback': cutover(call, '185.158.133.1')
        elif action == 'inspect':
            z=read_zone(call)
            print(json.dumps({'count':len(z['hosts']), 'web':[h for h in z['hosts'] if h['Name'] in ['@','www'] and h['Type']=='A']}))
        else: raise RuntimeError('Unknown action')

if __name__ == '__main__': main()
