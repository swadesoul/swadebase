#!/usr/bin/env python3
"""Find each SWADEBASE app's published *.lovable.app address, verify it really is that app,
then (with --apply) allow it for login redirects and map it to the app's schema.

Why verify: allowing a lovable.app address we do not own would let a stranger's site receive
sign-ins. A slug is accepted only when its live page talks to swadebase.cloud AND either serves
the same build as the app's own domain, or was seen calling SWADEBASE in our own logs / is named
after the app.  No blanket *.lovable.app wildcard is ever added.
usage: add_published_slugs.py [--apply] [schema=slug ...]   (extra pairs are still verified)
"""
import re, subprocess, sys, urllib.request, concurrent.futures as cf

MAP = '/etc/nginx/conf.d/swade-app-schemas.conf'
ENV = '/opt/swadebase/docker/.env'
EXTRA = {
    'mydistribution': ['omnidigitaldistribution', 'my-distribution'], 'swadesoulcom': ['idonfts', 'ido-nfts'],
    'ladyrocket': ['lady-rocket'], 'sovereignboard': ['sovereign-board'], 'tokencsi': ['token-csi', 'csi'],
    'workscratcher': ['work-scratcher'], 'agentmarketplace': ['agentmarketplacediy', 'agent-marketplace'],
    'swdzsite': ['swdz', 'swadez'], 'ssworld': ['swadesoulworld', 'swadesoul-world'], 'thefreq': ['the-freq', 'freq'],
    'jazzedivyne': ['jazze-divyne'], 'yourown': ['your-own', 'yourowndelivery'], 'xrpltoken': ['xrpl-token'],
    'aitrading': ['ai-trading'], 'cryptomail': ['crypto-mail'], 'videosaywhat': ['video-say-what'],
    'resinglab': ['resing'], 'teachvirt': ['virtteach'], 'publiswade': ['publi-swade'],
}

def get(url, n=400000):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 swadebase-check'})
        with urllib.request.urlopen(req, timeout=12) as r:
            return r.geturl(), r.read(n).decode('utf-8', 'ignore')
    except Exception:
        return None, ''

def page(host):
    """-> (final_host, main bundle name, talks_to_swadebase)"""
    final, html = get(f'https://{host}/')
    if not html:
        return None
    fh = re.sub(r'^https://([^/]+).*', r'\1', final or '')
    m = re.search(r'/assets/(index-[A-Za-z0-9_-]+\.js)', html)
    talks = 'swadebase.cloud' in html
    if m and not talks:
        _, js = get(f'https://{fh}/assets/{m.group(1)}', 6000000)
        talks = 'swadebase.cloud' in js
    return fh, (m.group(1) if m else None), talks

apps = {}
for l in open(MAP):
    r = re.match(r'\s*"~\^(.*)\$"\s+(\w+);', l)
    if not r:
        continue
    pat, app = r.groups()
    a = apps.setdefault(app, {'domains': [], 'have': set()})
    if 'lovable' in pat or re.search(r'[0-9a-f]{8}-[0-9a-f]{4}', pat):
        s = re.match(r'https://([a-z0-9-]+)\\\.lovable\\\.app', pat)
        if s:
            a['have'].add(s.group(1))
    else:
        a['domains'].append(pat.replace('https://(www\\.)?', '').replace('\\', ''))

seen = set()
try:
    for l in open('/root/build/origins.txt'):
        s = re.search(r'https://(?:preview--)?([a-z0-9-]+)\.lovable\.app', l)
        if s:
            seen.add(s.group(1))
except FileNotFoundError:
    pass

manual = dict(x.split('=', 1) for x in sys.argv[1:] if '=' in x)
jobs = []
for app, a in apps.items():
    cands = [app] + EXTRA.get(app, []) + [d.split('.')[0] for d in a['domains']]
    if app in manual:
        cands.insert(0, manual[app])
    cands += [s for s in seen if app[:5] in s or s[:5] in app]
    for c in dict.fromkeys(cands):
        jobs.append((app, c))

with cf.ThreadPoolExecutor(12) as ex:
    dom = dict(zip([d for a in apps.values() for d in a['domains']],
                   ex.map(page, [d for a in apps.values() for d in a['domains']])))
    res = list(ex.map(lambda j: page(f'{j[1]}.lovable.app'), jobs))

found = {}
for (app, slug), p in zip(jobs, res):
    if not p or not p[2]:
        continue
    final, bundle, _ = p
    own = [dom.get(d) for d in apps[app]['domains'] if dom.get(d)]
    same_build = bool(bundle) and any(o[1] == bundle for o in own)
    lands_home = any(final in (d, 'www.' + d) for d in apps[app]['domains'])
    named = slug == app or slug in EXTRA.get(app, []) or slug in seen or manual.get(app) == slug
    if same_build or lands_home or named:
        why = 'same build as its domain' if same_build else 'redirects to its domain' if lands_home else 'named for the app and talks to SWADEBASE'
        found.setdefault(app, []).append((slug, why))

for app in sorted(apps):
    got = found.get(app, [])
    print(f"{app:18} " + ('; '.join(f'{s}.lovable.app ({w})' for s, w in got) if got else 'NOT FOUND'))

if '--apply' not in sys.argv:
    sys.exit(0)

conf = open(MAP).read()
env = open(ENV).read()
m = re.search(r'^ADDITIONAL_REDIRECT_URLS=(.*)$', env, re.M)
cur = [x for x in m.group(1).split(',') if x]
lines, urls = [], []
for app, got in found.items():
    for slug, _ in got:
        pat = f'    "~^https://(preview--)?{re.escape(slug).replace(chr(92) + "-", "-")}\\.lovable\\.app$" {app};'
        if f'{slug}\\.lovable\\.app$"' not in conf:
            lines.append(pat)
        for u in (f'https://{slug}.lovable.app/**', f'https://preview--{slug}.lovable.app/**'):
            if u not in cur and u not in urls:
                urls.append(u)
if lines:
    conf = conf.replace('    default "";', '    default "";\n' + '\n'.join(lines), 1)
    open(MAP, 'w').write(conf)
if urls:
    open(ENV, 'w').write(env.replace(m.group(0), 'ADDITIONAL_REDIRECT_URLS=' + ','.join(cur + urls)))
print(f'map lines added: {len(lines)}; redirect addresses added: {len(urls)}')
