"""ReSing Lab voice for Maestro DJ breaks (2026-11-21, Claude for Swade).
Swade: "We build DJ breaks on ReSing Lab ... no GPU ... bring in a voice to ReSing Lab to keep consistency."
A DJ whose ai_dj_voice row has resing_voice_id speaks through ReSing Lab's own Voicebox engine (CPU, LuxTTS):
the same engine and the same saved voice ReSing Lab's Spoken Word studio uses. DJs without it keep the old path.
speak(dj_id, text) -> (audio_bytes, content_type) or None when the DJ has no ReSing Lab voice."""
import json, time, urllib.request

VB = 'http://172.16.0.1:17600'          # Voicebox forwarder (engine on swadebase-2)
SB = 'http://127.0.0.1:18000'
_env = dict(l.rstrip('\n').split('=', 1) for l in open('/opt/swadebase/docker/.env') if '=' in l and not l.startswith('#'))
_KEY = _env['SERVICE_ROLE_KEY'].strip().strip('"')

def _get(url, headers=None, timeout=60, raw=False):
    with urllib.request.urlopen(urllib.request.Request(url, headers=headers or {}), timeout=timeout) as x:
        b = x.read(); return b if raw else json.loads(b)

def _db(schema, path):
    return _get(f'{SB}/rest/v1/{path}', {'apikey': _KEY, 'authorization': 'Bearer ' + _KEY, 'accept-profile': schema})

def voice_for(dj_id):
    """The ReSing Lab voice (Voicebox profile + engine) for a DJ, or None."""
    row = (_db('maestroradio', f'ai_dj_voice?dj_id=eq.{dj_id}&select=resing_voice_id') or [{}])[0]
    vid = row.get('resing_voice_id')
    if not vid: return None
    v = (_db('resinglab', f'resinglab_designed_voices?id=eq.{vid}&select=provider,provider_voice_id,status,speech_ready,metadata') or [None])[0]
    if not v or v.get('provider') != 'voicebox' or not v.get('provider_voice_id') or not v.get('speech_ready'):
        raise RuntimeError('ReSing Lab voice is not ready yet')
    return {'profile_id': v['provider_voice_id'], 'engine': (v.get('metadata') or {}).get('engine') or 'luxtts'}

def speak(dj_id, text, timeout=600):
    v = voice_for(dj_id)
    if not v: return None
    body = json.dumps({'profile_id': v['profile_id'], 'text': text, 'language': 'en', 'engine': v['engine'], 'max_chunk_chars': 600}).encode()
    with urllib.request.urlopen(urllib.request.Request(VB + '/generate', data=body, method='POST',
                                headers={'content-type': 'application/json'}), timeout=120) as x:
        g = json.loads(x.read())
    t0 = time.time()
    while g.get('status') not in ('completed', 'failed') and time.time() - t0 < timeout:
        time.sleep(2); g = _get(f"{VB}/history/{g['id']}")
    if g.get('status') != 'completed':
        raise RuntimeError(f"ReSing Lab voice engine {g.get('status')}: {str(g.get('error'))[:160]}")
    return _get(f"{VB}/audio/{g['id']}", timeout=300, raw=True), 'audio/wav'
