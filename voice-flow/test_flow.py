#!/usr/bin/env python3
"""A/B test: the same Barnabas break written with and without the Swade Voice Flow core,
on Maestro's capped OmniRoute key (combo/swade-cheap)."""
import json, subprocess, urllib.request

env = {k: v.strip() for k, v in (l.split('=', 1) for l in open('/opt/swade-secrets/omniroute-maestro.env') if '=' in l and not l.startswith('#'))}

def psql(sql):
    return subprocess.run(['docker', 'exec', 'supabase-db', 'psql', '-U', 'postgres', '-Atc', sql], capture_output=True, text=True, check=True).stdout.strip()

overlay = ("Barnabas, drive-time DJ on Maestro Radio. Funny, high-energy comedian; witty and fast-paced. "
           "Catchphrases (use at most one per break): \"Get ready to ride that beat!\", \"This is Drive Time — no nap zone!\", "
           "\"You're not just listening… you're feeling it!\"")
core = psql("select public.swade_voice_flow_prompt($o$" + overlay + "$o$)")
task = ("Write a 20-second on-air break. Facts you may use (nothing else): just played 'Midnight Ride' by Shamone Swade; "
        "up next 'Golden Hour' by PET MUZIK; it's 5:40 PM in Fort Worth, 72 degrees. Output only the words to speak.")

def ask(system):
    msgs = ([{'role': 'system', 'content': system}] if system else []) + [{'role': 'user', 'content': task}]
    req = urllib.request.Request(env['OMNIROUTE_URL'], method='POST',
        data=json.dumps({'model': env['OMNIROUTE_MODEL'], 'messages': msgs, 'max_tokens': 1200, 'temperature': 0.9}).encode(),
        headers={'authorization': 'Bearer ' + env['OMNIROUTE_API_KEY'], 'content-type': 'application/json'})
    r = json.load(urllib.request.urlopen(req, timeout=60))
    msg = r['choices'][0].get('message') or {}
    txt = msg.get('content') or ''
    if isinstance(txt, list): txt = ' '.join(x.get('text', '') for x in txt if isinstance(x, dict))
    return r.get('model', '?'), (txt.strip() or 'EMPTY: ' + json.dumps(r)[:400])

for label, system in (('WITHOUT core', 'You are Barnabas, a radio DJ.'), ('WITH Swade Voice Flow', core)):
    m, out = ask(system)
    print(f'=== {label}  [{m}]\n{out}\n')
