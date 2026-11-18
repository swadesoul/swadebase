#!/usr/bin/env python3
"""Maestro Morning Mix theme: generate through ReSing Lab's own music-api (Swade's account key),
poll until done, save the full takes to B2, and cut 15-second show versions with fades.
Usage: morning_mix_theme.py generate | status <task_id>"""
import json, sys, time, urllib.request, subprocess, tempfile, os
sys.path.insert(0, '/opt/swade-gpu-controller')
import voicestudio_b2 as b2  # noqa: E402

KEY = next(l.split('=', 1)[1].strip() for l in open('/opt/swade-secrets/resinglab-master-api.env') if l.startswith('RESINGLAB_MASTER_API_KEY='))
API = 'http://127.0.0.1:18000/functions/v1/music-api'
B2DIR = 'swadesoul/maestroradio/shows/morning-mix/theme'

LYRICS = """[Intro]
(Morning Mix!)
[Hook]
Rise up, it's the Maestro Morning Mix (Morning Mix!)
Coffee in the cup, got the city on the fix
Three friends in the booth, keep it smooth, keep it real
Maestro... Morning... Mix!
[Outro]
Maestro Morning Mix"""
STYLE = ("R&B hip-hop fusion radio show theme, upbeat morning energy, catchy sung hook, smooth male and female vocal harmonies, "
         "punchy boom-bap drums, warm Rhodes keys, deep bassline, finger snaps, bright horn stabs, 95 bpm, polished radio jingle")

def call(path, body=None):
    req = urllib.request.Request(API + path, method='POST' if body is not None else 'GET',
        data=json.dumps(body).encode() if body is not None else None,
        headers={'x-api-key': KEY, 'content-type': 'application/json'})
    try: return json.load(urllib.request.urlopen(req, timeout=120))
    except urllib.error.HTTPError as e: return {'http_error': e.code, 'body': e.read().decode()[:400]}

if sys.argv[1] == 'generate':
    print(json.dumps(call('/v1/generate', {'title': 'Maestro Morning Mix Theme', 'lyrics': LYRICS, 'prompt': LYRICS,
                                              'style': STYLE, 'instrumental': False, 'duration': 60})))
elif sys.argv[1] == 'status':
    print(json.dumps(call('/v1/status?task_id=' + sys.argv[2]))[:3000])
elif sys.argv[1] == 'fetch':
    d = call('/v1/status?task_id=' + sys.argv[2])
    st = d.get('provider_status'); tracks = d.get('tracks') or []
    print('status', st, 'tracks', len(tracks))
    if st not in ('SUCCESS', 'FIRST_SUCCESS') or not tracks: sys.exit(0)
    for i, t in enumerate(tracks, 1):
        url = t.get('audioUrl') or t.get('sourceAudioUrl') or t.get('streamAudioUrl')
        if not url: continue
        with tempfile.TemporaryDirectory() as td:
            full = os.path.join(td, 'full.mp3'); urllib.request.urlretrieve(url, full)
            b2.s3.upload_file(full, b2.BUCKET, f'{B2DIR}/take{i}-full.mp3', ExtraArgs={'ContentType': 'audio/mpeg'})
            # 15 s show cut from the top (hook arrives early by design): 0.3 s fade in, 1.5 s fade out, loudness normalized
            cut = os.path.join(td, 'cut.mp3')
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', full, '-t', '15', '-af',
                            'afade=t=in:d=0.3,afade=t=out:st=13.5:d=1.5,loudnorm=I=-14:TP=-1.5:LRA=11', '-b:a', '192k', cut], check=True)
            b2.s3.upload_file(cut, b2.BUCKET, f'{B2DIR}/take{i}-15s.mp3', ExtraArgs={'ContentType': 'audio/mpeg'})
            print(f'take{i}', round(float(t.get("duration") or 0), 1), 's full ->', f'{B2DIR}/take{i}-full.mp3 and -15s.mp3')
