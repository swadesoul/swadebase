#!/usr/bin/env python3
"""Maestro Morning Mix TALK BED (2026-11-19, Claude for Swade).
Swade: a custom, low, pleasant hip-hop/R&B instrumental that plays under ALL the conversation, the same track every
week so listeners get used to it; it must never pull attention from the cast.
Generated with ReSing Lab's own music-api (same engine/account as the Take 2 theme), instrumental only, in the theme's
style family. Each take is saved full to B2, then turned into a show-ready bed:
  - loop-friendly cut (crossfaded tail into head), loudness ~-30 LUFS so it sits far under speech,
  - low-passed a touch and mid-scooped (2-4 kHz, where voices live) so words stay clear.
Usage: morning_mix_bed.py generate | fetch <task_id>
Files: swadesoul/maestroradio/shows/morning-mix/bed/takeN-full.mp3, takeN-bed.mp3, takeN-demo.mp3 (bed under the cast test)"""
import json, sys, os, tempfile, subprocess, urllib.request
sys.path.insert(0, '/opt/swadebase/signal')
import morning_mix_theme as theme   # reuses KEY, API and call() for ReSing's music-api
sys.path.insert(0, '/opt/swade-gpu-controller')
import voicestudio_b2 as b2  # noqa: E402

B2DIR = 'swadesoul/maestroradio/shows/morning-mix/bed'
STYLE = ("instrumental lo-fi R&B hip-hop talk bed for a morning radio show, laid-back and warm, soft boom-bap drums with "
         "brushed snare, mellow Rhodes chords, round sub bass, gentle vinyl texture, light finger snaps, no vocals, no melody "
         "leads that compete with talking, steady 88 bpm groove, smooth, pleasant, unobtrusive background music, seamless loop")

def ff(*a): subprocess.run(['ffmpeg', '-v', 'error', '-y', *a], check=True)

if __name__ == '__main__':
    if sys.argv[1] == 'generate':
        print(json.dumps(theme.call('/v1/generate', {'title': 'Maestro Morning Mix Talk Bed', 'prompt': STYLE, 'style': STYLE,
                                                     'instrumental': True, 'duration': 180})))
    elif sys.argv[1] == 'fetch':
        d = theme.call('/v1/status?task_id=' + sys.argv[2]); st = d.get('provider_status'); tracks = d.get('tracks') or []
        print('status', st, 'tracks', len(tracks))
        if st not in ('SUCCESS', 'FIRST_SUCCESS') or not tracks: sys.exit(0)
        cast = '/tmp/mm-cast-test.mp3'
        for i, t in enumerate(tracks, 1):
            url = t.get('audioUrl') or t.get('sourceAudioUrl') or t.get('streamAudioUrl')
            if not url: continue
            with tempfile.TemporaryDirectory() as td:
                full = os.path.join(td, 'full.mp3'); urllib.request.urlretrieve(url, full)
                b2.s3.upload_file(full, b2.BUCKET, f'{B2DIR}/take{i}-full.mp3', ExtraArgs={'ContentType': 'audio/mpeg'})
                bed = os.path.join(td, 'bed.mp3')
                # trim lead-in/out, scoop the voice band, soften highs, sit very low (~-30 LUFS), fade edges for looping
                ff('-ss', '2', '-i', full, '-t', '170', '-af',
                   'equalizer=f=3000:t=q:w=1.2:g=-6,lowpass=f=9000,afade=t=in:d=2,areverse,afade=t=in:d=3,areverse,'
                   'loudnorm=I=-30:TP=-9:LRA=7', '-b:a', '192k', bed)
                b2.s3.upload_file(bed, b2.BUCKET, f'{B2DIR}/take{i}-bed.mp3', ExtraArgs={'ContentType': 'audio/mpeg'})
                if os.path.exists(cast):   # demo: the bed under the cast test, with gentle extra ducking while they talk
                    demo = os.path.join(td, 'demo.mp3')
                    ff('-i', bed, '-i', cast, '-filter_complex',
                       '[1:a]loudnorm=I=-16:TP=-1.5,asplit=2[v1][v2];[0:a][v1]sidechaincompress=threshold=0.03:ratio=3:attack=80:release=900[b];'
                       '[b][v2]amix=inputs=2:duration=shortest:normalize=0,alimiter=limit=0.95[m]', '-map', '[m]', '-b:a', '192k', demo)
                    b2.s3.upload_file(demo, b2.BUCKET, f'{B2DIR}/take{i}-demo.mp3', ExtraArgs={'ContentType': 'audio/mpeg'})
                print(f'take{i}', round(float(t.get('duration') or 0), 1), 's -> bed + demo saved')
