#!/usr/bin/env python3
"""Design a voice on our own voice service (voxcpm2 'instruct'), then clone the result into a
permanent profile - zero ElevenLabs credits. Sample + profile saved to B2 under
swadesoul/maestroradio/voices/<key>/. Usage: design_voice.py <key> "<name>" "<voice description>" "<sample line>" """
import json, sys, time, urllib.request, uuid
sys.path.insert(0, '/opt/swadebase/signal')
from dj_voice_seed import VURL, VTOK, b2_put, b2_exists, b2_get, clone, log

key, name, desc, line = sys.argv[1:5]
sample_key = f'swadesoul/maestroradio/voices/{key}/design-sample.mp3'
if b2_exists(sample_key):
    audio = b2_get(sample_key); print('reusing existing design sample')
else:
    req = urllib.request.Request(VURL + '/v1/speak', method='POST',
        data=json.dumps({'text': line, 'instruct': desc, 'engine': 'voxcpm2', 'format': 'mp3'}).encode(),
        headers={'authorization': f'Bearer {VTOK}', 'content-type': 'application/json'})
    t0 = time.time(); r = urllib.request.urlopen(req, timeout=900); audio = r.read()
    b2_put(sample_key, audio, 'audio/mpeg')
    b2_put(f'swadesoul/maestroradio/voices/{key}/design-brief.txt', (desc + '\n\n' + line).encode(), 'text/plain')
    print(f'designed {key}: {r.headers.get("X-Audio-Seconds")}s in {time.time()-t0:.0f}s')
prof = clone(name, audio)
log({'event': 'designed_voice', 'key': key, 'profile_id': prof['profile_id'], 'b2': sample_key})
print(f'PROFILE {key} {prof["profile_id"]}')
