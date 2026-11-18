#!/usr/bin/env python3
"""Parse music-places-master.md into the load_brief.py JSON shape, with rule-based recommended_services.
usage: parse_master.py <master.md> <out.json> [--only-date YYYY-MM-DD]"""
import json, re, sys

SERVICES = ['Maestro Radio station building', 'ReSing Lab', 'MyDistribution', 'Publiswade', 'PET MUZIK',
            'TeachVirt', 'ABA.gold', 'Play on Maestro Radio', 'Music Mogul']
CATEGORY_PRIOR = {
    'radio stations': ['Maestro Radio station building'], 'blogs': ['Publiswade'],
    'playlist': ['Publiswade'], 'media outlets': ['Publiswade'], 'sync': ['ReSing Lab'],
    'distribution': ['MyDistribution'], 'education': ['TeachVirt'], 'record pools': ['Music Mogul'],
    'ai music': ['ReSing Lab'],
    'potential customers': ['Maestro Radio station building'],
}
KEYWORDS = [
    (r'maestro radio|\bstations?\b|\bradio\b|lpfm|part 15|housing-complex', 'Maestro Radio station building'),
    (r'resing|ai song|ai[- ]artist|song creation', 'ReSing Lab'),
    (r'mydistribution|\bdistribution\b', 'MyDistribution'),
    (r'publiswade|\bpress\b|publicist|\bpitch|coverage', 'Publiswade'),
    (r'pet muzik|\bpets?\b|dogs|cats', 'PET MUZIK'),
    (r'teachvirt|\bcourses?\b|\bschool\b|\bstudents?\b|curriculum', 'TeachVirt'),
    (r'aba\.gold', 'ABA.gold'),
    (r'play on maestro|airplay|\bpromoters?\b', 'Play on Maestro Radio'),
    (r'music mogul|\brungs?\b|\bdjs?\b|booking agent|\ba&r\b', 'Music Mogul'),
]
NP = lambda v: None if v is None or v.strip().lower() in ('', 'not public') else v.strip().rstrip('.')

def recommend(category, description, fit):
    text = f'{description} {fit}'.lower()
    out = []
    for k, svcs in CATEGORY_PRIOR.items():
        if k in category.lower():
            out += svcs
    for pat, svc in KEYWORDS:
        if re.search(pat, text) and svc not in out:
            out.append(svc)
    out = [s for s in SERVICES if s in out]
    if not out:
        return [], 'No clear match to a Harold service from the brief text.'
    reason = f'Based on the brief: {fit}' if fit else f'Based on the brief: {description}'
    return out, reason

def main():
    src, dst = sys.argv[1], sys.argv[2]
    only = sys.argv[sys.argv.index('--only-date') + 1] if '--only-date' in sys.argv else None
    entries, category = [], None
    item = re.compile(r'^- \[(?P<name>[^\]]+)\]\((?P<url>[^)]+)\) — (?P<rest>.*?)\s*\(added (?P<date>\d{4}-\d{2}-\d{2})\)\s*$')
    for line in open(src, encoding='utf-8'):
        h = re.match(r'^## (.+?)(?: \(\d+\))?\s*$', line)
        if h:
            category = h.group(1).strip(); continue
        m = item.match(line.rstrip('\n'))
        if not m or not category:
            continue
        if only and m['date'] != only:
            continue
        rest = m['rest']
        pc = category.lower().startswith('potential customers')
        e = {'section': 'potential_customers' if pc else 'places', 'category': category, 'name': m['name'].strip(),
             'website': m['url'].strip(), 'description': None, 'fit': None, 'location': None, 'email': None,
             'contact_page': None, 'phone': None, 'socials': {}, 'address': None, 'contact_person_name': None,
             'contact_person_title': None, 'contact_person_linkedin': None, 'source_urls': [m['url'].strip()],
             'first_listed': m['date']}
        if pc:
            cp = re.search(r'Contact page:\s*(\S+)', rest); em = re.search(r'Email:\s*([^ ]+?)\.?\s+Contact page', rest)
            ph = re.search(r'Phone:\s*(.+?)\.\s+Email:', rest)
            head = re.split(r'\s+Fit:\s+', rest, maxsplit=1)
            fit = re.split(r'\s+Phone:', head[1], maxsplit=1)[0].strip() if len(head) > 1 else None
            loc_desc = head[0]
            # "City, ST. Description." / "City, ST (multi-state). Description."
            lm = re.match(r'^(.*?\b[A-Z]{2}\b(?: \([^)]*\))?)\.\s+(.*)$', loc_desc)
            e['location'], e['description'] = (lm.group(1), lm.group(2).strip()) if lm else (None, loc_desc.strip())
            e['fit'] = fit
            e['phone'] = NP(ph.group(1)) if ph else None
            e['email'] = NP(em.group(1)) if em else None
            e['contact_page'] = cp.group(1).strip() if cp else None
        else:
            parts = re.split(r'\s+Fit:\s+', rest, maxsplit=1)
            e['description'] = parts[0].strip()
            e['fit'] = parts[1].strip() if len(parts) > 1 else None
        e['recommended_services'], e['recommended_reason'] = recommend(category, e['description'] or '', e['fit'] or '')
        entries.append(e)
    json.dump(entries, open(dst, 'w'), indent=1, ensure_ascii=False)
    print(len(entries), 'entries ->', dst)

if __name__ == '__main__':
    main()
