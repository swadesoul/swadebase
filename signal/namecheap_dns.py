#!/usr/bin/env python3
# Add records to a Namecheap domain WITHOUT dropping existing ones (setHosts replaces the whole set, so we read, back up, merge).
# usage: namecheap_dns.py <domain> '<json list of {type,host,address,mxpref?,ttl?}>'  [--dry]
import json, re, sys, time, urllib.request, urllib.parse, xml.etree.ElementTree as ET
F = open('/opt/swadebase/docker/functions.env').read()
g = lambda k: re.search(r'^%s=(.*)$' % k, F, re.M).group(1).strip().strip('"')
USER, KEY, IP = g('NAMECHEAP_API_USER'), g('NAMECHEAP_API_KEY'), g('NAMECHEAP_CLIENT_IP')
NS = '{http://api.namecheap.com/xml.response}'
def call(cmd, extra, post=False):
    p = {'ApiUser': USER, 'ApiKey': KEY, 'UserName': USER, 'ClientIp': IP, 'Command': cmd, **extra}
    data = urllib.parse.urlencode(p).encode() if post else None
    url = 'https://api.namecheap.com/xml.response' + ('' if post else '?' + urllib.parse.urlencode(p))
    root = ET.fromstring(urllib.request.urlopen(url, data=data, timeout=60).read())
    err = root.find(f'.//{NS}Errors/{NS}Error')
    if err is not None: raise SystemExit('Namecheap error: ' + (err.text or ''))
    return root
domain, adds = sys.argv[1], json.loads(sys.argv[2]); dry = '--dry' in sys.argv
sld, tld = domain.split('.', 1)
root = call('namecheap.domains.dns.getHosts', {'SLD': sld, 'TLD': tld})
res = root.find(f'.//{NS}DomainDNSGetHostsResult')
email_type = res.get('EmailType')
hosts = [{'type': h.get('Type'), 'host': h.get('Name'), 'address': h.get('Address'), 'mxpref': h.get('MXPref'), 'ttl': h.get('TTL')} for h in res.iter(f'{NS}host')]
json.dump({'domain': domain, 'email_type': email_type, 'hosts': hosts}, open(f'/opt/backups/dns-{domain}-{int(time.time())}.json', 'w'), indent=1)
print(f'{domain}: {len(hosts)} existing records, EmailType={email_type}')
for a in adds:
    if any(h['type'] == a['type'] and h['host'] == a['host'] and h['address'].rstrip('.') == a['address'].rstrip('.') for h in hosts): print('  exists', a['type'], a['host']); continue
    hosts.append({'type': a['type'], 'host': a['host'], 'address': a['address'], 'mxpref': str(a.get('mxpref', 10)), 'ttl': str(a.get('ttl', 1800))}); print('  add', a['type'], a['host'], '->', a['address'][:60])
params = {'SLD': sld, 'TLD': tld, 'EmailType': 'MX' if any(h['type'] == 'MX' for h in hosts) else (email_type or 'NONE')}
for i, h in enumerate(hosts, 1):
    params.update({f'HostName{i}': h['host'], f'RecordType{i}': h['type'], f'Address{i}': h['address'], f'TTL{i}': h['ttl'] or '1800'})
    if h['type'] == 'MX': params[f'MXPref{i}'] = h['mxpref'] or '10'
if dry: print('dry run, nothing changed'); sys.exit(0)
ok = call('namecheap.domains.dns.setHosts', params, post=True).find(f'.//{NS}DomainDNSSetHostsResult').get('IsSuccess')
print('saved:', ok)
