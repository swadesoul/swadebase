#!/usr/bin/env python3
"""Cut the chosen theme (take 2) into show pieces + a ducking demo.
  theme-intro-30s.mp3 : 0:00-0:30 full volume (the intro)
  theme-bed.mp3       : 0:30-end, the music bed that plays under the hosts' opening talk
  theme-demo-ducked.mp3: intro, then the bed auto-ducked under a sample host line (sidechain),
                        so Swade can hear how the opening will feel."""
import os, subprocess, sys, tempfile
sys.path.insert(0, '/opt/swade-gpu-controller')
import voicestudio_b2 as b2  # noqa: E402
D = 'swadesoul/maestroradio/shows/morning-mix/theme/'
VOICE = 'swadesoul/maestroradio/voices/maestro-radio-barnabas/clone-test.mp3'

def ff(*args): subprocess.run(['ffmpeg', '-v', 'error', '-y', *args], check=True)
with tempfile.TemporaryDirectory() as td:
    full, voice = os.path.join(td, 'full.mp3'), os.path.join(td, 'voice.mp3')
    b2.s3.download_file(b2.BUCKET, D + 'take2-full.mp3', full)
    b2.s3.download_file(b2.BUCKET, VOICE, voice)
    intro, bed, demo = (os.path.join(td, n) for n in ('intro.mp3', 'bed.mp3', 'demo.mp3'))
    # Intro: first 30 s, short tail fade so the cut lands clean; radio loudness.
    ff('-i', full, '-t', '30', '-af', 'afade=t=out:st=29.4:d=0.6,loudnorm=I=-14:TP=-1.5:LRA=11', '-b:a', '192k', intro)
    # Bed: 30 s to the end, gentle fade in/out, kept at full level (the mixer ducks it under speech).
    ff('-ss', '30', '-i', full, '-af', 'afade=t=in:d=0.4,areverse,afade=t=in:d=2.5,areverse,loudnorm=I=-14:TP=-1.5:LRA=11', '-b:a', '192k', bed)
    # Demo: intro, then bed with the host voice entering 1.5 s in; sidechain compression ducks the bed
    # about 12-15 dB while he talks and lets it swell back up in the gaps.
    ff('-i', bed, '-i', voice, '-filter_complex',
       '[1:a]adelay=1500|1500,apad,asplit=2[v1][v2];'
       '[0:a][v1]sidechaincompress=threshold=0.02:ratio=10:attack=40:release=600:makeup=1[ducked];'
       '[ducked][v2]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5[mix]',
       '-map', '[mix]', '-b:a', '192k', os.path.join(td, 'bedmix.mp3'))
    ff('-i', intro, '-i', os.path.join(td, 'bedmix.mp3'), '-filter_complex', '[0:a][1:a]concat=n=2:v=0:a=1[o]', '-map', '[o]', '-b:a', '192k', demo)
    for src, key in ((intro, 'theme-intro-30s.mp3'), (bed, 'theme-bed.mp3'), (demo, 'theme-demo-ducked.mp3')):
        b2.s3.upload_file(src, b2.BUCKET, D + key, ExtraArgs={'ContentType': 'audio/mpeg'})
        dur = subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src]).decode().strip()
        print(key, round(float(dur), 1), 's')
    for key in ('theme-intro-30s.mp3', 'theme-demo-ducked.mp3'):
        print('LINK', key, b2.s3.generate_presigned_url('get_object', Params={'Bucket': b2.BUCKET, 'Key': D + key}, ExpiresIn=14400))
