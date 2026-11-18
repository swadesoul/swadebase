from pathlib import Path
import subprocess,urllib.request,urllib.parse,urllib.error,json,tempfile,uuid,secrets,hashlib,time
root=Path('/opt/swadebase/ops/imagineswade');token=secrets.token_urlsafe(48);actor=hashlib.sha256(('fixture-'+str(uuid.uuid4())).encode()).hexdigest();project=str(uuid.uuid4());base='https://swadebase.cloud/functions/v1/imagineswade'
def sql(q):
 r=subprocess.run(['docker','exec','-i','supabase-db','psql','-U','postgres','-d','postgres','-At','-v','ON_ERROR_STOP=1'],input=q,text=True,capture_output=True)
 if r.returncode:raise RuntimeError(r.stderr[-800:])
 return r.stdout.strip()
def api(action,body={}):
 req=urllib.request.Request(base,data=json.dumps({'token':token,'actor':actor,'email':'fixture@example.invalid','action':action,'body':body}).encode(),headers={'Content-Type':'application/json'})
 with urllib.request.urlopen(req,timeout=40) as r:return json.load(r)
hash=hashlib.sha256(token.encode()).hexdigest();sql("insert into public.imagineswade_tokens(hash,enabled) values('"+hash+"',true);")
assets=[];record={'actor':actor,'project':project,'token_hash':hash,'assets':assets,'checks':[]};root.joinpath('fixture-receipt.json').write_text(json.dumps(record))
try:
 with tempfile.TemporaryDirectory() as td:
  folder=Path(td);shots=[]
  for i in range(2):shots.append({'id':str(uuid.uuid4()),'title':'Fixture '+str(i),'prompt':'Disposable test color','duration':2,'transition':'dissolve' if i else 'cut','transitionSeconds':.5})
  doc={'id':project,'title':'Disposable end-to-end fixture','description':'No customer media','format':'16:9','look':'Cinematic','shots':shots}
  saved=api('save',doc)['project'];record['checks'].append('save_http')
  for i,color in enumerate(['red','blue']):
   clip=folder/(str(i)+'.mp4');subprocess.run(['ffmpeg','-v','error','-nostdin','-y','-f','lavfi','-i','color=c='+color+':s=320x180:r=24:d=3','-f','lavfi','-i','sine=frequency=440:duration=3','-shortest','-c:v','libx264','-c:a','aac',str(clip)],check=True)
   aid=str(uuid.uuid4());assets.append(aid);root.joinpath('fixture-receipt.json').write_text(json.dumps(record))
   q=urllib.parse.urlencode({'id':aid,'project':project,'name':'fixture-'+str(i)+'.mp4','role':'clip'})
   req=urllib.request.Request(base+'?'+q,data=clip.read_bytes(),headers={'Content-Type':'video/mp4','x-imagine-action':'upload','x-imagine-token':token,'x-imagine-actor':actor,'x-imagine-email':'fixture@example.invalid'})
   with urllib.request.urlopen(req,timeout=120) as r:res=json.load(r)
   if res.get('error'):raise RuntimeError(res['error'])
   shots[i]['clipAssetId']=aid
  record['checks'].append('two_video_uploads_b2')
  saved=api('save',{**saved,'shots':shots})['project'];rid=str(uuid.uuid4());job=api('assemble',{'projectId':project,'revision':saved['revision'],'requestId':rid})['job'];record['job_id']=job['id']
  root.joinpath('fixture-receipt.json').write_text(json.dumps(record))
  for _ in range(50):
   state=api('workspace');j=next(j for j in state['jobs'] if j['id']==job['id'])
   if j['status'] in ['complete','failed','cancelled']:break
   time.sleep(2)
  if j['status']!='complete':raise RuntimeError('Export did not complete: '+str(j.get('error') or j['stage']))
  assets.append(j['output_asset_id']);record['checks'].append('durable_queue_cpu_worker_complete')
  target=api('asset_get',{'id':j['output_asset_id']})['url'];out=folder/'master.mp4'
  with urllib.request.urlopen(target,timeout=40) as r:out.write_bytes(r.read())
  media=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(out)]))
  record['output_seconds']=float(media['format']['duration']);record['audio']=any(s['codec_type']=='audio' for s in media['streams']);record['output_sha256']=hashlib.sha256(out.read_bytes()).hexdigest()
  assert abs(record['output_seconds']-3.5)<.15 and record['audio']
  record['checks'].append('download_master_b2_timing_audio_verified');record['status']='passed'
except urllib.error.HTTPError as e:record['status']='failed';record['error']='HTTP '+str(e.code)+' '+e.read(1000).decode(errors='replace')
except Exception as e:record['status']='failed';record['error']=str(e)
finally:
 root.joinpath('fixture-receipt.json').write_text(json.dumps(record,indent=2));print(json.dumps({k:v for k,v in record.items() if k not in ['actor','token_hash','assets']}))
