# 2026-11-11 (Swade: re-voice SSS Brain; garbled endings): the voice engine sometimes fails to stop on long reads and
# loops or babbles at the end. voice_by_sentence() voices one sentence at a time, checks each take with the transcriber,
# re-takes any sentence that comes back wrong, cuts babble after its last word, and joins them with short natural gaps.
import difflib, io, os, re, subprocess, tempfile, requests
from clean_tail import _transcribe, _words, clean_tail

def sentences(text):
    parts = re.split(r'(?<=[.!?])\s+(?=[A-Z"\'])', text.strip())
    out = []
    for p in parts:   # glue very short bits ("SSS Brain.") to the next sentence so the read keeps its flow
        if out and len(_words(out[-1])) < 4: out[-1] = out[-1] + ' ' + p
        else: out.append(p)
    return out

def _letters(t):   # compare letters, not words: "triple S brain dot live" == "triple sbrain.live"
    t = re.sub(r'\bdot\b', '', t.lower()).replace('a.i.', 'ai')
    return re.sub(r'[^a-z0-9]', '', t)

def _score(want, heard):
    a, b = _letters(want), _letters(heard)
    extra = round((len(b) - len(a)) / 5)   # ~5 letters per word
    return difflib.SequenceMatcher(None, a, b).ratio(), extra

def voice_by_sentence(text, voice_id, vurl, vtok, tries=3, gap=0.28, alt=None, log=print):
    """alt: {sentence: [alternate wordings]} tried if a sentence keeps failing. Returns (wav_bytes, report)."""
    report = []
    with tempfile.TemporaryDirectory() as d:
        pieces = []
        for n, s in enumerate(sentences(text)):
            best = None
            for wording in [s] + list((alt or {}).get(s, [])):
                for t in range(tries):
                    r = requests.post(vurl + '/v1/voicebox/speak', headers={'authorization': 'Bearer ' + vtok, 'content-type': 'application/json'},
                                      json={'text': wording, 'voice_profile_id': voice_id}, timeout=600)
                    r.raise_for_status(); ext = 'mp3' if 'mpeg' in r.headers.get('content-type', '') else 'wav'
                    audio, cut = clean_tail(r.content, ext, wording, vurl, vtok, max_probes=4)
                    heard = _transcribe(audio, ext, vurl, vtok, 120).get('transcript', '')
                    sc, extra = _score(wording, heard)
                    ok = sc >= 0.8 and extra <= 2
                    log(f'  sentence {n + 1} take {t + 1}: score {sc:.2f} extra {extra} {"OK" if ok else "retry"} | {heard[-70:]}')
                    if best is None or (sc - max(0, extra) * 0.05) > best[0]: best = (sc - max(0, extra) * 0.05, audio, ext, heard, wording)
                    if ok: break
                if best and best[0] >= 0.78: break
            p = os.path.join(d, f'raw{n:02d}.{best[2]}'); open(p, 'wb').write(best[1])
            w = os.path.join(d, f'p{n:02d}.wav')   # normalise each piece: trim edge silence, same format
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', p, '-af', 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,'
                            'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.12,areverse', '-ar', '24000', '-ac', '1', w], check=True)
            pieces.append(w); report.append({'sentence': s, 'used': best[4], 'heard': best[3], 'score': round(best[0], 2)})
        gapf = os.path.join(d, 'gap.wav')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', f'anullsrc=r=24000:cl=mono', '-t', str(gap), gapf], check=True)
        lst = os.path.join(d, 'list.txt')
        open(lst, 'w').write(''.join(f"file '{p}'\nfile '{gapf}'\n" for p in pieces[:-1]) + f"file '{pieces[-1]}'\n")
        out = os.path.join(d, 'joined.wav')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c:a', 'pcm_s16le', out], check=True)
        return open(out, 'rb').read(), report
