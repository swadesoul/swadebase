#!/usr/bin/env python3
"""Maestro Morning Mix "Tea" collector (2026-11-18, Claude for Swade).
Pulls the latest gossip and news across hip-hop, R&B, country, rock, gospel, pop/celebs and sports from outlet RSS
feeds (Google News search feeds for outlets without one: BET, AP, TMZ, ESPN, gospel) every few hours into
maestroradio.morning_mix_tea. The weekly show is written from the past 7 days of tea, ranked by how many separate
outlets carried the same story.
Rules baked in: every item keeps its source and link; WorldStarHipHop items are "viral" leads only and never air
until a news outlet has reported the same story. Timer: maestro-tea.timer. Log: journalctl -u maestro-tea."""
import re, sys, html, hashlib, datetime, urllib.request, xml.etree.ElementTree as ET, json
from email.utils import parsedate_to_datetime

ENV = open('/opt/swadebase/docker/.env').read()
SR = re.search(r'^SERVICE_ROLE_KEY=(.*)$', ENV, re.M).group(1).strip().strip('"')
DB = 'http://127.0.0.1:18000/rest/v1/morning_mix_tea'
H = {'apikey': SR, 'authorization': 'Bearer ' + SR, 'content-profile': 'maestroradio', 'accept-profile': 'maestroradio',
     'content-type': 'application/json', 'prefer': 'resolution=ignore-duplicates,return=minimal'}
UA = 'Mozilla/5.0 (compatible; MaestroRadioTea/1.0; +https://themaestroradio.com)'
Y = 'https://www.youtube.com/feeds/videos.xml?channel_id='
G = 'https://news.google.com/rss/search?hl=en-US&gl=US&ceid=US:en&q='

# (source label, genre, url, kind) kind: news | gossip | viral | podcast
FEEDS = [
    ('AllHipHop', 'hip-hop', 'https://allhiphop.com/feed/', 'news'),
    ('The Source', 'hip-hop', 'https://thesource.com/feed/', 'news'),
    ('XXL', 'hip-hop', 'https://www.xxlmag.com/feed/', 'news'),
    ('VIBE', 'hip-hop', 'https://www.vibe.com/feed/', 'news'),
    ('BET', 'hip-hop', G + 'site:bet.com+when:3d', 'news'),
    ('WorldStarHipHop', 'hip-hop', 'https://worldstarhiphop.com/rss', 'viral'),
    ('Bossip', 'r&b', 'https://bossip.com/feed/', 'gossip'),
    ('The Jasmine Brand', 'r&b', 'https://www.thejasminebrand.com/feed/', 'gossip'),
    ('The Shade Room', 'r&b', 'https://theshaderoom.com/feed/', 'gossip'),
    ('Essence', 'r&b', 'https://www.essence.com/feed/', 'news'),
    ('Taste of Country', 'country', 'https://tasteofcountry.com/feed/', 'news'),
    ('The Boot', 'country', 'https://www.theboot.com/feed/', 'news'),
    ('Loudwire', 'rock', 'https://loudwire.com/feed/', 'news'),
    ('Consequence', 'rock', 'https://consequence.net/feed/', 'news'),
    ('Rolling Stone', 'rock', 'https://www.rollingstone.com/music/music-news/feed/', 'news'),
    ('Rapzilla', 'gospel', 'https://rapzilla.com/feed/', 'news'),
    ('Gospel news', 'gospel', G + '(gospel+singer+OR+gospel+artist+OR+gospel+music)+when:3d', 'news'),
    ('Billboard', 'pop', 'https://www.billboard.com/feed/', 'news'),
    ('E! News', 'pop', 'https://www.eonline.com/syndication/feeds/rssfeeds/topstories.xml', 'gossip'),
    ('Page Six', 'pop', 'https://pagesix.com/feed/', 'gossip'),
    ('TMZ', 'pop', G + 'site:tmz.com+when:2d', 'gossip'),
    ('AP Entertainment', 'pop', G + 'site:apnews.com+entertainment+when:2d', 'news'),
    ('ESPN NFL', 'sports', 'https://www.espn.com/espn/rss/nfl/news', 'news'),
    ('ESPN NBA', 'sports', 'https://www.espn.com/espn/rss/nba/news', 'news'),
    ('AP Sports', 'sports', G + 'site:apnews.com+sports+when:2d', 'news'),
    # Podcasts (YouTube channel feeds). A title is a lead, not a quote: what a host said is only used from a transcript
    # (VideoSayWhat) and always attributed to the show.
    ('Listen & Laugh (Ice Cube & Mike Epps)', 'podcast', Y + 'UCE0T7l3JAU6E5NnZlCSHQXg', 'podcast'),
    ('Club Shay Shay (Shannon Sharpe)', 'podcast', Y + 'UCQoxJOkwaCgyzQtiuAIDcuw', 'podcast'),
    ('Nightcap (Shannon Sharpe & Chad Johnson)', 'podcast', Y + 'UCKnodHJpZd8UbSvAufDd3_g', 'podcast'),
    ('The Joe Rogan Experience', 'podcast', Y + 'UCzQUP1qoWDoEbmsQxvdjxgQ', 'podcast'),
    ('Matt Wolfe (@mreflow)', 'tech', Y + 'UChpleBmo18P08aKCIgti38g', 'podcast'),
    ('Reese Waters', 'podcast', Y + 'UCCcr-MvAMettt8yktc9t4ag', 'podcast'),
    ('Josh Johnson', 'podcast', Y + 'UCLuYADJ6hESLHX87JnsGbjA', 'podcast'),
]
STOP = set('a an the and or of to in on for with at by from is are was were be has have had after over new his her their this that it as says say video watch'.split())

def text(s): return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', s or ''))).strip()
def key_words(title):  # story fingerprint for cross-outlet matching
    w = [x for x in re.findall(r"[a-z0-9']+", title.lower()) if x not in STOP and len(x) > 2]
    return sorted(set(w))[:12]

def fetch(src, genre, url, kind):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    raw = urllib.request.urlopen(req, timeout=20).read()
    root = ET.fromstring(raw)
    out = []
    for it in root.iter():
        tag = it.tag.split('}')[-1]
        if tag not in ('item', 'entry'): continue
        g = lambda n: next((c for c in it if c.tag.split('}')[-1] == n), None)
        title = text((g('title').text if g('title') is not None else '') or '')
        link_el = g('link'); link = (link_el.text or link_el.get('href') or '').strip() if link_el is not None else ''
        pub = g('pubDate') if g('pubDate') is not None else (g('published') or g('updated'))
        try: when = parsedate_to_datetime(pub.text) if pub is not None and pub.text and ',' in pub.text else datetime.datetime.fromisoformat((pub.text or '').replace('Z', '+00:00'))
        except Exception: when = datetime.datetime.now(datetime.timezone.utc)
        if when.tzinfo is None: when = when.replace(tzinfo=datetime.timezone.utc)
        desc = g('description') if g('description') is not None else g('summary')
        outlet = src
        if url.startswith(G):  # Google News titles end with " - Outlet"
            m = re.search(r'\s+-\s+([^-]{2,40})$', title)
            if m: outlet, title = m.group(1).strip(), title[:m.start()].strip()
        if not title or not link: continue
        if datetime.datetime.now(datetime.timezone.utc) - when > datetime.timedelta(days=8): continue
        out.append({'url_hash': hashlib.sha256(link.encode()).hexdigest()[:32], 'title': title[:300], 'url': link[:1000],
                    'source': outlet[:80], 'feed': src, 'genre': genre, 'kind': kind, 'summary': text(desc.text if desc is not None else '')[:600],
                    'published_at': when.isoformat(), 'fingerprint': key_words(title)})
    return out

def main():
    rows, report = [], {}
    for f in FEEDS:
        try: items = fetch(*f); rows += items; report[f[0]] = len(items)
        except Exception as e: report[f[0]] = 'error: ' + str(e)[:60]
    for i in range(0, len(rows), 200):
        b = json.dumps(rows[i:i + 200]).encode()
        urllib.request.urlopen(urllib.request.Request(DB + '?on_conflict=url_hash', data=b, method='POST', headers=H), timeout=30)
    print(json.dumps({'fetched': len(rows), 'feeds': report}))

if __name__ == '__main__':
    main()
