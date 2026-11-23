#!/usr/bin/env python3
"""Morning Mix voice import (2026-11-18, Claude for Swade). ElevenLabs once, SWADEBASE forever.
Swade designed the DJ voices in ElevenLabs (collection "MAESTRO RADIO DJs") and generated one ID clip per character.
This pulls those exact clips from his ElevenLabs HISTORY (downloading past generations costs no credits),
files each in its own folder in Backblaze:
    swadesoul/maestroradio/shows/morning-mix/voices/<dj>/elevenlabs-id.mp3   (+ voice.json with the ElevenLabs voice id)
clones each into the Swade voice service, renders a test line through the clone (no ElevenLabs), and records the
cast -> voice mapping in maestroradio.morning_mix_voices. It does NOT switch any live station DJ's on-air voice.
Usage: morning_mix_voice_import.py --dry-run | --run"""
import sys, json, time, urllib.request, re, os
sys.path.insert(0, '/opt/swadebase/signal')
import dj_voice_seed as seed   # XI_KEY, b2_put/b2_get/b2_exists, clone(), speak_clone(), psql()

CAST = {  # slug: (display name, name patterns to match the ElevenLabs voice / history item)
    'barnabas': ('Barnabas', r'barnab'), 'surrinda': ('Surrinda', r'surrinda'), 'pa-tony': ('Pa-Tony', r'pa.?tony'),
    'uncle-rich': ('Uncle Rich', r'uncle.?rich'), 'shane': ('Shane', r'\bshane'), 'layla': ('Layla', r'layla'),
    'markie-c': ('Markie C', r'markie'),
}
BASE = 'swadesoul/maestroradio/shows/morning-mix/voices'
TEST = {'barnabas': "Good morning Maestro family, it's Barnabas, and y'all are not ready for this week's show.",
        'surrinda': "Hey hey, it's Surrinda. Grab your coffee, because this week's tea is piping hot.",
        'pa-tony': "Pa-Tony here with the receipts. I checked it twice, and the numbers do not lie.",
        'uncle-rich': "Maestro family, it's your Uncle Rich, and baby, I found the future at a gas station in Tokyo.",
        'shane': "Hey, it's Shane. I watched way too much YouTube this week, so you don't have to.",
        'layla': "Hi, it's Layla. The timeline was undefeated this week, and I screenshotted everything.",
        'markie-c': "Yo yo yo, Markie C on Maestro Radio, and this week we going crazy, let's go!"}

def xi(path):
    req = urllib.request.Request('https://api.elevenlabs.io' + path, headers={'xi-api-key': seed.XI_KEY})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()

def my_voices():
    out, token = [], None
    for _ in range(10):
        q = '/v2/voices?page_size=100&include_total_count=false' + (f'&next_page_token={token}' if token else '')
        j = json.loads(xi(q)); out += j.get('voices', [])
        token = j.get('next_page_token')
        if not j.get('has_more'): break
    return out

def history():
    items, last = [], None
    for _ in range(5):
        j = json.loads(xi('/v1/history?page_size=100' + (f'&start_after_history_item_id={last}' if last else '')))
        items += j.get('history', [])
        if not j.get('has_more'): break
        last = j.get('last_history_item_id')
    return items

def main():
    run = '--run' in sys.argv
    voices = my_voices()
    coll = [v for v in voices if any('maestro' in str(c).lower() for c in (v.get('collection_ids') or v.get('collections') or []))]
    print('voices in account:', len(voices), '| tagged with a Maestro collection:', len(coll))
    hist = history()
    since = time.time() - 3 * 86400
    plan = {}
    for slug, (name, pat) in CAST.items():
        v = next((v for v in (coll or voices) if re.search(pat, v.get('name', ''), re.I)), None)
        h = sorted([i for i in hist if i.get('date_unix', 0) > since and (
            (v and i.get('voice_id') == v['voice_id']) or re.search(pat, i.get('voice_name') or '', re.I))],
            key=lambda i: i['date_unix'], reverse=True)
        # prefer the generation that reads that character's ID script (it says their name)
        pick = next((i for i in h if re.search(pat, i.get('text') or '', re.I)), h[0] if h else None)
        plan[slug] = {'voice': v and {'id': v['voice_id'], 'name': v['name']}, 'history_item': pick and pick['history_item_id'],
                      'chars': pick and len(pick.get('text') or ''), 'when': pick and time.strftime('%Y-%m-%d %H:%M', time.gmtime(pick['date_unix']))}
        print(f"{slug:11} voice={plan[slug]['voice']} | clip={plan[slug]['history_item']} ({plan[slug]['when']}, {plan[slug]['chars']} chars)")
    if not run: return
    for slug, p in plan.items():
        name = CAST[slug][0]
        local = f'/opt/swadebase/var/morning-mix-seeds/{slug}.mp3'
        import os
        if os.path.exists(local): mp3 = open(local, 'rb').read(); src = 'founder upload (ElevenLabs MAESTRO RADIO DJs)'
        elif p['history_item']: mp3 = xi(f"/v1/history/{p['history_item']}/audio"); src = 'ElevenLabs history'
        else: print(slug, 'SKIP: no clip'); continue
        key = f'{BASE}/{slug}/elevenlabs-id.mp3'
        seed.b2_put(key, mp3, 'audio/mpeg')
        seed.b2_put(f'{BASE}/{slug}/voice.json', json.dumps({'dj': name, 'source': src, 'elevenlabs_collection': 'MAESTRO RADIO DJs',
                    'elevenlabs_voice': p['voice'], 'imported_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}, indent=2).encode(), 'application/json')
        res = seed.clone(f'{name} (Morning Mix)', mp3)
        prof = res.get('id') or res.get('profile_id') or (res.get('profile') or {}).get('id')
        tkey, engine, secs = None, None, None
        for attempt in range(0 if os.environ.get('SKIP_TEST') else 4):   # RunPod serverless can 503 while cold-starting; the clone itself is already saved
            try:
                audio, engine, secs = seed.speak_clone(prof, TEST[slug])
                tkey = f'{BASE}/{slug}/clone-test.mp3'; seed.b2_put(tkey, audio, 'audio/mpeg'); break
            except Exception as ex:
                print(slug, 'test render attempt', attempt + 1, 'failed:', str(ex)[:60], flush=True); time.sleep(45)
        ev = ((p['voice'] or {}).get('id') or '') if slug == 'barnabas' else ''
        seed.psql("insert into maestroradio.morning_mix_voices(slug,display_name,elevenlabs_voice_id,seed_b2_key,voice_profile_id,test_b2_key,notes) "
                  f"values ('{slug}','{name.replace(chr(39), chr(39)*2)}',nullif('{ev}',''),'{key}','{prof}',nullif('{tkey or ''}',''),'{src}') on conflict (slug) do update set "
                  "seed_b2_key=excluded.seed_b2_key, voice_profile_id=excluded.voice_profile_id, test_b2_key=excluded.test_b2_key, notes=excluded.notes, updated_at=now()")
        print(slug, 'cloned ->', prof, '| test', engine, secs, 's', flush=True)

if __name__ == '__main__':
    main()
