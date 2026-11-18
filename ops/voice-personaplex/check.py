#!/usr/bin/env python3
"""Read-only stage verification; does not connect to a paid GPU or load model weights."""
import json, pathlib, subprocess
root=pathlib.Path(__file__).parent
config=json.loads((root/'adapter.json').read_text())
assert config['adapter']=='voice.personaplex'
assert config['ready'] is False and config['enabled'] is False
assert config['cost_guard']['new_external_spend_usd']==0
assert config['deployment']['live_audio_enabled'] is False
assert (root/'personaplex'/'moshi'/'pyproject.toml').exists()
rev=subprocess.check_output(['git','-C',str(root/'personaplex'),'rev-parse','--short','HEAD'],text=True).strip()
assert rev==config['source']['revision'],(rev,config['source']['revision'])
print('PASS: source',rev,'registered as disabled, no spend, no live routing')
print('BLOCKERS:',', '.join(config['blockers']))
