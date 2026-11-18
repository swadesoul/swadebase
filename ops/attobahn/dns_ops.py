#!/usr/bin/env python3
"""Scoped ATTOBAHN DNS operations using the existing owner credential store."""
import ast
import datetime
import fcntl
import json
import os
from pathlib import Path
import subprocess
import sys
import time

ZONE = 'attobahn.live'
BACKUP = Path('/opt/swadebase/backups/attobahn-migration-20261105')
OPS = Path('/opt/swadebase/ops/attobahn')

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
    result = call('namecheap.domains.dns.getHosts', {'SLD': 'attobahn', 'TLD': 'live'}, post=True)
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
    payload = {'SLD': 'attobahn', 'TLD': 'live', 'EmailType': before['email_type']}
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
    if domain not in [ZONE, 'www.'+ZONE, 'zamaniwave.'+ZONE]: raise RuntimeError('Unexpected certificate domain')
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

def cutover(call):
    before = read_zone(call)
    names = {'@', 'www', 'zamaniwave'}
    targets = [h for h in before['hosts'] if h['Name'] in names and h['Type'] in {'A', 'AAAA', 'CNAME', 'URL', 'URL301', 'FRAME'}]
    if any(h['Type'] != 'A' or h['Address'] not in {'185.158.133.1', '2.25.74.73'} for h in targets):
        raise RuntimeError('Unexpected current web target; stop for inspection')
    after = {**before, 'hosts': [h for h in before['hosts'] if h not in targets]}
    for name in sorted(names): after['hosts'].append({'Name': name, 'Type': 'A', 'Address': '2.25.74.73', 'MXPref': '10', 'TTL': '300'})
    actual = save_zone(call, before, after, 'cutover')
    (BACKUP/'dns-after.json').write_text(json.dumps(actual, indent=2))
    print('Web records migrated to SWADEBASE; all other DNS and email records preserved')

LEGACY_VERIFICATION_SHA256 = {'_lovable': ['ca2e908f99bf1987ca4d0ebe0ffda52a87b4dbd1a87518f69bfce70818df1e80'], '_lovable-email': ['b8a490dc8e5d67c671c856e4b5619bb0b00468290b791b41d272a472e76689cb'], '_lovable.www': ['32d05b2083f4e0b14bd58378d4721ec4300dd198724c1a7de9d92f4b17060a3c'], '_lovable.zamaniwave': ['775f57fa267f93b57986abdbb49a8c71984cfb477b8b710d01753fddc7b77ebc']}


def retire_legacy(call):
    """Retire only reviewed legacy records after all owned web hosts have moved."""
    import hashlib

    before = read_zone(call)
    names = {'@', 'www', 'zamaniwave'}
    web_types = {'A', 'AAAA', 'CNAME', 'URL', 'URL301', 'FRAME', 'NS'}
    for name in names:
        targets = [h for h in before['hosts'] if h['Name'] == name and h['Type'] in web_types]
        if len(targets) != 1 or targets[0]['Type'] != 'A' or targets[0]['Address'] != '2.25.74.73':
            raise RuntimeError('All web hosts must already point only to SWADEBASE before DNS retirement: ' + name)

    def txt_value(address):
        value = address.strip()
        return value[1:-1] if len(value) >= 2 and value[0] == '"' and value[-1] == '"' else value

    removed_txt, removed_ns, dmarc_updates = [], [], 0
    hosts = []
    for host in before['hosts']:
        name, kind, address = host['Name'], host['Type'], host['Address']
        if kind == 'TXT' and name in LEGACY_VERIFICATION_SHA256:
            value = txt_value(address)
            digest = hashlib.sha256(value.encode()).hexdigest()
            if digest in LEGACY_VERIFICATION_SHA256[name]:
                removed_txt.append(name)
                continue
            if value.startswith(('lovable_verify=', 'lovable_email_verify=')):
                raise RuntimeError('Legacy verification value changed; inspect before removal: ' + name)
        if kind == 'NS' and name == 'notify' and address.rstrip('.').lower() in {'ns3.lovable.cloud', 'ns4.lovable.cloud'}:
            removed_ns.append(address.rstrip('.').lower())
            continue
        if kind == 'TXT' and name == '_dmarc':
            value = txt_value(address)
            parts = value.split(';')
            if parts[0].strip().lower() == 'v=dmarc1':
                new_parts, removed = [], False
                for part in parts:
                    key, separator, values = part.strip().partition('=')
                    if separator and key.lower() == 'rua':
                        reports = [v.strip() for v in values.split(',')]
                        retained = [v for v in reports if v != 'mailto:dmarcreports@lovable.dev']
                        if len(retained) != len(reports):
                            removed = True
                            if retained:
                                new_parts.append(key + '=' + ','.join(retained))
                            continue
                    new_parts.append(part)
                if removed:
                    rebuilt = ';'.join(new_parts).strip()
                    if address.strip().startswith('"') and address.strip().endswith('"'):
                        rebuilt = '"' + rebuilt + '"'
                    host = {**host, 'Address': rebuilt}
                    dmarc_updates += 1
        hosts.append(host)

    after = {**before, 'hosts': hosts}
    changed = canonical(after) != canonical(before)
    actual = save_zone(call, before, after, 'retire-legacy') if changed else before
    BACKUP.mkdir(parents=True, mode=0o700, exist_ok=True)
    snapshot = BACKUP / 'dns-after-retire-legacy.json'
    snapshot.write_text(json.dumps(actual, indent=2))
    snapshot.chmod(0o600)
    print(json.dumps({
        'action': 'retire-legacy', 'changed': changed,
        'removed_verification_names': sorted(removed_txt),
        'removed_notify_nameservers': sorted(removed_ns),
        'dmarc_records_updated': dmarc_updates,
        'web_hosts_verified': sorted(names),
        'unrelated_dns_and_email_mode_preserved': True,
        'mail_configuration_changed': False,
        'replacement_sender_and_queue': 'remain pending separate configuration and acceptance',
    }))


def main():
    OPS.mkdir(parents=True, mode=0o700, exist_ok=True)
    action = sys.argv[1]
    with open(OPS/'dns.guard', 'a') as guard:
        fcntl.flock(guard, fcntl.LOCK_EX)
        call = client()
        if action == 'auth': challenge(call)
        elif action == 'cleanup': challenge(call, cleanup=True)
        elif action == 'cutover': cutover(call)
        elif action == 'retire-legacy': retire_legacy(call)
        elif action == 'inspect': print(json.dumps(read_zone(call), indent=2))
        else: raise RuntimeError('Unknown action')

if __name__ == '__main__': main()
