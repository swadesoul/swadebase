from pathlib import Path
import json,urllib.request,urllib.error,subprocess,uuid,secrets,hashlib,tempfile
root=Path('/opt/swadebase/ops/imagineswade');record=json.loads((root/'fixture-receipt.json').read_text());actor=record['actor'];project=record['project'];token=secrets.token_urlsafe(48);th=hashlib.sha256(token.encode()).hexdigest()
record.setdefault('token_hashes',[]).extend([record['token_hash'],th]);record['token_hash']=th
q="insert into public.imagineswade_tokens(hash,enabled) values('"+th+"',true);"
subprocess.run(['docker','exec','supabase-db','psql','-U','postgres','-d','postgres','-c',q],check=True,capture_output=True)
def api(action,body={}):
 req=urllib.request.Request('https://swadebase.cloud/functions/v1/imagineswade',data=json.dumps({'token':token,'actor':actor,'email':'fixture@example.invalid','action':action,'body':body}).encode(),headers={'Content-Type':'application/json'})
 with urllib.request.urlopen(req,timeout=125) as r:return json.load(r)
try:
 state=api('workspace');j=next(j for j in state['jobs'] if j['id']==record['job_id']);assert j['status']=='complete',j.get('error')
 aid=j['output_asset_id'];record['assets'].append(aid);target=api('asset_get',{'id':aid})['url']
 with tempfile.TemporaryDirectory() as td:
  p=Path(td)/'master.mp4'
  with urllib.request.urlopen(target,timeout=40) as r:p.write_bytes(r.read())
  m=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(p)]))
  record['output_seconds']=float(m['format']['duration']);record['audio']=any(x['codec_type']=='audio' for x in m['streams']);record['output_sha256']=hashlib.sha256(p.read_bytes()).hexdigest();assert abs(record['output_seconds']-3.5)<.15 and record['audio']
 record['checks']+=['durable_queue_cpu_worker_complete','download_master_b2_timing_audio_verified']
 voices=state['voices'];assert len(voices)>=65;voice=next(v for v in voices if v['kind']=='kokoro');record['stock_voice_count']=len(voices)
 p=api('list')['projects'][0];cid=str(uuid.uuid4());lid=str(uuid.uuid4());p['characters']=[{'id':cid,'name':'Fixture narrator','scope':'video','scopeName':'Test','wardrobe':'None','referenceIds':[],'revision':1,'voiceId':voice['id'],'voiceLabel':voice['label']}];p['shots'][0]['dialogue']=[{'id':lid,'characterId':cid,'text':'Hello Swade.','delivery':'offscreen'}];p=api('save',p)['project'];aid=str(uuid.uuid4());record['assets'].append(aid)
 v=api('voice_generate',{'projectId':p['id'],'sceneId':p['shots'][0]['id'],'lineId':lid,'assetId':aid});assert v['asset']['state']=='ready' and v['asset']['bytes']>44;record['checks'].append('voice_studio_cpu_line_saved_to_b2')
 record['status']='passed';record.pop('error',None)
except urllib.error.HTTPError as e:record['status']='failed';record['error']='HTTP '+str(e.code)+' '+e.read(500).decode(errors='replace')
except Exception as e:record['status']='failed';record['error']=str(e)
finally:
 (root/'fixture-receipt.json').write_text(json.dumps(record,indent=2));print(json.dumps({k:v for k,v in record.items() if k not in ['actor','token_hash','token_hashes','assets']}))
