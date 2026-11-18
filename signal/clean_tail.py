# 2026-11-11 (Swade): voiced DJ breaks and ads sometimes ended in garbled babble after the last real word.
# clean_tail() transcribes the rendered audio and checks it ends with the script's last words. If extra babble
# follows, it steps back through the pauses until the audio ends on the script's ending, cuts there and fades out.
# On any failure it returns the audio unchanged, so a break is never blocked from airing.
import json, re, subprocess, tempfile, os, urllib.request, uuid

def _norm(w): return re.sub(r"[^a-z0-9]", "", w.lower())
def _words(t): return [x for x in (_norm(w) for w in re.split(r"[\s\-]+", t or '')) if x]

def _transcribe(audio, ext, vurl, vtok, timeout):
    b = 'mrb' + uuid.uuid4().hex
    body = (f'--{b}\r\nContent-Disposition: form-data; name="file"; filename="a.{ext}"\r\nContent-Type: audio/{"mpeg" if ext == "mp3" else ext}\r\n\r\n').encode() + audio + \
           f'\r\n--{b}--\r\n'.encode()
    r = urllib.request.Request(vurl + '/v1/voicebox/transcribe', data=body, method='POST',
                               headers={'authorization': 'Bearer ' + vtok, 'content-type': 'multipart/form-data; boundary=' + b})
    with urllib.request.urlopen(r, timeout=timeout) as x: return json.loads(x.read())

def ends_clean(script, heard, slack=2):
    """True when the transcript ends on the script's ending (allowing a couple of words for STT spelling)."""
    want, got = _words(script)[-4:], _words(heard)
    if not want or not got: return True
    tail = got[-(len(want) + slack):]
    hits = sum(1 for w in want if w in tail)
    return hits >= max(1, len(want) - 1) and len(got) <= len(_words(script)) * 1.2 + 4 + slack

def _pauses(src, after):
    sd = subprocess.run(['ffmpeg', '-hide_banner', '-i', src, '-af', 'silencedetect=n=-42dB:d=0.2', '-f', 'null', '-'], capture_output=True, text=True, timeout=60).stderr
    return [float(x) for x in re.findall(r'silence_start: ([\d.]+)', sd) if float(x) > after]

def clean_tail(audio, ext, script, vurl, vtok, timeout=120, pad=0.25, fade=0.18, max_probes=6):
    """Returns (audio, seconds_cut or None)."""
    try:
        if ends_clean(script, _transcribe(audio, ext, vurl, vtok, timeout).get('transcript', '')): return audio, None
        with tempfile.TemporaryDirectory() as d:
            src = os.path.join(d, 'in.' + ext); open(src, 'wb').write(audio)
            dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src], capture_output=True, text=True, timeout=30).stdout.strip())
            codec = ['-c:a', 'libmp3lame', '-b:a', '192k'] if ext == 'mp3' else []
            for p in list(reversed(_pauses(src, dur * 0.4)))[:max_probes]:   # latest pause first
                cut = min(p + pad, dur); dst = os.path.join(d, f'cut{p:.2f}.' + ext)
                subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-t', f'{cut:.3f}', '-af', f'afade=t=out:st={max(0, cut - fade):.3f}:d={fade}', *codec, dst], check=True, timeout=60)
                out = open(dst, 'rb').read()
                if ends_clean(script, _transcribe(out, ext, vurl, vtok, timeout).get('transcript', ''), slack=1): return out, round(dur - cut, 2)
    except Exception:
        pass
    return audio, None


# 2026-11-11 (Swade: "needs to sound like a DJ voice, speed matters"): some DJ voices read at ~2.1 words/sec,
# radio DJs run ~2.8-3.2. dj_polish speeds slow reads up to radio pace (pitch kept), trims dead air at the start
# and gives the voice a light on-air chain (low cut, presence, compression, -16 LUFS). Fails open.
TARGET_WPS, SLOW_WPS, MAX_SPEED = 2.95, 2.65, 1.25

def _speech_secs(src):
    sd = subprocess.run(['ffmpeg', '-hide_banner', '-i', src, '-af', 'silencedetect=n=-40dB:d=0.25', '-f', 'null', '-'], capture_output=True, text=True, timeout=60).stderr
    dur = float(re.search(r'Duration: (\d+):(\d+):([\d.]+)', sd).groups()[2]) + 60 * float(re.search(r'Duration: (\d+):(\d+)', sd).group(2))
    starts = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', sd)]; ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', sd)]
    lead = ends[0] if starts and starts[0] < 0.05 and ends else 0.0
    tail = dur - starts[-1] if starts and (not ends or starts[-1] > ends[-1]) else 0.0
    return max(0.5, dur - lead - tail), dur

def dj_polish(audio, ext, script):
    """Returns (audio, speed or None)."""
    try:
        words = len(_words(script))
        with tempfile.TemporaryDirectory() as d:
            src, dst = os.path.join(d, 'in.' + ext), os.path.join(d, 'out.' + ext); open(src, 'wb').write(audio)
            speech, _ = _speech_secs(src)
            wps = words / speech
            speed = round(min(MAX_SPEED, TARGET_WPS / wps), 3) if wps < SLOW_WPS else None
            chain = ['silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08']
            if speed: chain.append(f'atempo={speed}')
            chain += ['highpass=f=85', 'equalizer=f=3200:t=q:w=1.1:g=2.5', 'equalizer=f=140:t=q:w=0.9:g=1.5',
                      'acompressor=threshold=-20dB:ratio=3:attack=6:release=120:makeup=2', 'loudnorm=I=-16:TP=-1.5:LRA=9']
            codec = ['-c:a', 'libmp3lame', '-b:a', '192k'] if ext == 'mp3' else ['-c:a', 'pcm_s16le']
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-af', ','.join(chain), '-ar', '24000' if ext == 'wav' else '44100', *codec, dst], check=True, timeout=120)
            out = open(dst, 'rb').read()
            return (out, speed) if len(out) > 1000 else (audio, None)
    except Exception:
        return audio, None
