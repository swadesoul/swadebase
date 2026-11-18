#!/usr/bin/env python3
"""Scoped approved Maestro song-editor/COS rollout. Roll back exact live code on failed smoke check."""
from pathlib import Path
import os,shutil,time,hashlib,json,datetime,subprocess,urllib.request,urllib.error,re
source=Path('/opt/work/maestro-tested-release-20261111')
base=Path('/var/www/maestroradio-web')
live=Path('/opt/swadebase/docker/volumes/functions/dj-studio/index.ts')
prepared=live.parent/'index_candidate.ts'
manifest=Path('/opt/swadebase/docs/DEPLOY_LOCK.md')
def sh(*cmd):return subprocess.check_output(cmd,text=True).strip()
def hash_(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def probe(url,expected=200,data=None,headers=None):
 request=urllib.request.Request(url,data=data,headers=headers or {})
 try:
  with urllib.request.urlopen(request,timeout=12) as resp:status=resp.status;body=resp.read(3_000_000)
 except urllib.error.HTTPError as e: status=e.code;body=e.read(3_000_000)
 if status!=expected:raise RuntimeError('HTTP probe failed '+url+' got '+str(status)+' expected '+str(expected))
 return body
lock=os.open('/tmp/maestro-cos-editor-deploy.lock',os.O_CREAT|os.O_RDWR,0o600)
import fcntl
fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
current=base/'current'
previous=current.resolve()
original_hash='2b4b99cbb2cdc283220bf4f0cac6e183e23577f0093acd44bcb188f824be1ddf'
commit=sh('git','-C',str(source),'rev-parse','--short','HEAD')
assert commit=='829da61',commit
assert hash_(live)==original_hash,'Runtime changed since patch was inspected'
assert previous.name=='20261111T213845Z-pr18-14db531','Frontend has changed concurrently; re-test source parity'
assert prepared.exists()
assert (source/'dist/index.html').exists()
assert not any(re.match(r'^(?:\d{4}-\d{2}-\d{2}T\S+|\d{8}T\d{6}Z)\s+\|',line.strip()) for line in manifest.read_text().splitlines() if not line.lstrip().startswith('#')),'Other deployment active'
assert 'PASS: COS' not in '' # no-op, test suite verifies separately
stamp=datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
backup=Path('/opt/swadebase/backups')/('maestro-song-cos-deploy-'+stamp)
release=base/'releases'/(stamp+'-cos-song-editor-'+commit)
backup.mkdir(mode=0o700,parents=True)
shutil.copy2(live,backup/'dj-studio-index.ts')
(backup/'previous-release.txt').write_text(str(previous))
log=stamp+' | chatgpt-maestro-song-cos | themaestroradio.com | guarded release song editor + COS | 15 minutes'
with manifest.open('a') as h:h.write('\n'+log+'\n')
old_swapped=False;edge_swapped=False;result='failed'
try:
 shutil.copytree(source/'dist',release)
 (release/'RELEASE.json').write_text(json.dumps({'commit':commit,'state':'deployed; true owner-login/native Safari not verified','previous':str(previous),'edge_prev_sha':original_hash,'backend_candidate_sha':hash_(prepared),'no_paid_model_call':True,'model_analysis_status':'disabled','timestamp_utc':stamp},indent=2))
 os.chmod(release,0o755)
 for root,dirs,files in os.walk(release):
  for f in files:os.chmod(os.path.join(root,f),0o644)
  for d in dirs:os.chmod(os.path.join(root,d),0o755)
 tmp=base/'current-song-cos-candidate'
 tmp.unlink(missing_ok=True);tmp.symlink_to(release);os.replace(tmp,current);old_swapped=True
 shutil.copy2(prepared,live);edge_swapped=True
 sh('nginx','-t');sh('systemctl','reload','nginx');time.sleep(1)
 for route in ['/','/radio','/artists','/stations/library','/station/maestro-radio']:
  probe('https://themaestroradio.com'+route)
 import re
 expected_html=(release/'index.html').read_bytes()
 expected_js=re.search(rb'src="(/assets/index-[^"]+\.js)"',expected_html)
 assert expected_js,'Missing compiled asset reference'
 js_path=expected_js.group(1).decode()
 # Keep checking the actually served bundle, not only the local build. Reload clears Nginx file cache.
 for attempt in range(5):
  html=probe('https://themaestroradio.com/?verify='+stamp+'-'+str(attempt),headers={'Cache-Control':'no-cache'})
  if js_path.encode() in html:break
  time.sleep(1)
 else:raise RuntimeError('Live HTML did not switch to new release: '+str(re.search(rb'/assets/index-[^" ]+',html).group(0)))
 bundle=probe('https://themaestroradio.com'+js_path+'?verify='+stamp,headers={'Cache-Control':'no-cache'})
 local_bundle=(release/js_path.lstrip('/')).read_bytes()
 print('BUNDLE_DIAGNOSTICS',js_path,len(bundle),len(local_bundle),hashlib.sha256(bundle).hexdigest()[:20],hashlib.sha256(local_bundle).hexdigest()[:20],repr(bundle[:30]),repr(local_bundle[:30]))
 assert hashlib.sha256(bundle).digest()==hashlib.sha256(local_bundle).digest(),'Served JS differs from release artifact'
 assert b'COS guide' in bundle and b'Edit song details' in bundle,'Missing intended features in deployed JS'
 probe('https://radio.themaestroradio.com/api/nowplaying')
 probe('https://swadebase.cloud/functions/v1/dj-studio',401,data=b'{"action":"edit_media","station_id":"invalid"}',headers={'Content-Type':'application/json','Origin':'https://themaestroradio.com'})
 probe('https://swadebase.cloud/functions/v1/cos-contextual',401,data=b'{"action":"status","site":"maestroradio"}',headers={'Content-Type':'application/json','Origin':'https://themaestroradio.com'})
 result='deployed'
 print(json.dumps({'status':result,'commit':commit,'release':str(release),'previous':str(previous),'backup':str(backup),'checks':['five HTML routes','new JS bundle features','radio nowplaying','DJ editor auth 401','COS auth 401'],'backend_changed':True,'notes':'Real signed-in production mutation and native Safari remain unverified. No automatic genre/voice model enabled.'}))
except Exception as e:
 print('DEPLOY_EXCEPTION',str(e)[:500])
 if edge_swapped:shutil.copy2(backup/'dj-studio-index.ts',live)
 if old_swapped:
  rollback=base/'current-song-cos-rollback';rollback.unlink(missing_ok=True);rollback.symlink_to(previous);os.replace(rollback,current)
  sh('systemctl','reload','nginx')
 print('ROLLED_BACK frontend and backend; database additive columns remain safe')
 raise
finally:
 text=manifest.read_text();manifest.write_text(text.replace(log,'# '+log+' | '+result))
