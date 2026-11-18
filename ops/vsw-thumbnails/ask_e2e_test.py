#!/usr/bin/env python3
"""End-to-end test of transcript-ask through the public URL, as the super admin, on a real long transcript.
Signs a short-lived (5 min) user JWT with the server's JWT secret. Prints timing only, never secrets."""
import base64, hashlib, hmac, json, subprocess, sys, time, urllib.request

ENV = '/opt/swadebase/docker/.env'
def env(k):
    for l in open(ENV):
        if l.startswith(k + '='):
            return l.split('=', 1)[1].strip().strip('"')

def psql(sql):
    return subprocess.run(['docker', 'exec', '-i', 'supabase-db', 'psql', '-U', 'postgres', '-d', 'postgres', '-Atq'],
                          input=sql, capture_output=True, text=True, check=True).stdout.strip()

b64 = lambda b: base64.urlsafe_b64encode(b).rstrip(b'=').decode()
uid = psql("select user_id from videosaywhat.user_roles where role='super_admin' limit 1")
now = int(time.time())
head = b64(json.dumps({'alg': 'HS256', 'typ': 'JWT'}).encode())
body = b64(json.dumps({'sub': uid, 'role': 'authenticated', 'aud': 'authenticated', 'iat': now, 'exp': now + 300}).encode())
sig = b64(hmac.new(env('JWT_SECRET').encode(), f'{head}.{body}'.encode(), hashlib.sha256).digest())
token = f'{head}.{body}.{sig}'
anon = env('ANON_KEY')

row = psql("select json_build_object('n', file_name, 't', transcript_text) from videosaywhat.transcriptions "
           "where user_id = '%s' and transcript_text is not null order by abs(length(transcript_text)-6000) limit 1" % uid)
tr = json.loads(row)
mode = sys.argv[1] if len(sys.argv) > 1 else 'chat'
payload = {'transcriptText': tr['t'], 'fileName': tr['n'], 'mode': mode,
           'messages': [{'role': 'user', 'content': 'How do I set this up and what tools are needed?'}]}
print(f"video: {tr['n'][:60]} | transcript chars: {len(tr['t'])} | mode: {mode}")
req = urllib.request.Request(__import__('os').environ.get('ASK_URL','https://swadebase.cloud/functions/v1/transcript-ask'), data=json.dumps(payload).encode(), method='POST',
                             headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}', 'apikey': anon})
t0 = time.time(); first = None; text = ''
with urllib.request.urlopen(req, timeout=290) as r:
    print('status', r.status, 'context', r.headers.get('x-vsw-context'))
    while True:
        c = r.read1(256) if hasattr(r, 'read1') else r.read(256)
        if not c:
            break
        if first is None:
            first = time.time() - t0
        text += c.decode('utf-8', 'ignore')
print(f'first words after {first:.1f}s, finished after {time.time() - t0:.1f}s, {len(text)} chars')
print('--- answer start ---'); print(text[:700]); print('--- end ---')
