"""ImagineSwade CPU assembler. No provider inference and no GPU lifecycle operations."""
import hashlib,json,os,subprocess,tempfile,time,urllib.request,urllib.error,uuid
from pathlib import Path
BASE='https://swadebase.cloud/functions/v1/imagineswade'
TOKEN=os.environ.get('IMAGINESWADE_WORKER_TOKEN','')
def rpc(operation,body=None):
 req=urllib.request.Request(BASE,data=json.dumps({'token':TOKEN,'action':'worker','operation':operation,'body':body or {}}).encode(),headers={'Content-Type':'application/json'})
 with urllib.request.urlopen(req,timeout=45) as r:return json.load(r)
def probe(path):
 p=subprocess.run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(path)],capture_output=True,timeout=30,check=True)
 return json.loads(p.stdout)
def duration(path):return float(probe(path)['format'].get('duration',0))
def ff(args,timeout=300):
 p=subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-nostdin','-y','-threads','2','-filter_complex_threads','1']+args,capture_output=True,timeout=timeout)
 if p.returncode:raise ValueError('Media processing failed: '+p.stderr.decode(errors='replace')[-700:])
def active(job):
 if rpc('status',{'jobId':job['id']})['status']!='running':raise ValueError('Export cancelled')
def stage(job,label):active(job);rpc('stage',{'jobId':job['id'],'stage':label})
def validate_dialogue(scene,characters,assets):
 for line in scene.get('dialogue',[]):
  c=characters.get(line.get('characterId'))
  if not c or not c.get('voiceId') or c.get('revision')!=line.get('voiceRevision'):raise ValueError('Character voice revision requires approval')
  if line.get('delivery')=='onscreen' and c['id'] not in scene.get('castIds',[]):raise ValueError('On-screen speaker missing from cast')
  if line.get('audioAssetId') not in assets:raise ValueError('Approved dialogue audio missing')
  offset=float(line.get('offset',0))
  if offset<0 or offset>=float(scene['duration']):raise ValueError('Dialogue starts outside scene')
def assemble(snapshot,assets,folder,progress=lambda x:None):
 scenes=snapshot['shots'];characters={x['id']:x for x in snapshot.get('characters',[])}
 if not 1<=len(scenes)<=60:raise ValueError('Invalid scene count')
 w,h={'16:9':(1280,720),'9:16':(720,1280),'1:1':(720,720)}[snapshot['format']]
 parts=[]
 for i,s in enumerate(scenes):
  progress(f'Preparing scene {i+1} of {len(scenes)}')
  validate_dialogue(s,characters,assets);visual=assets[s['clipAssetId']];path=visual['local'];d=float(s['duration']);start=float(s.get('trimIn',0));image=visual['mime'].startswith('image/')
  if d<=0 or d>30 or start<0:raise ValueError('Invalid scene duration')
  info=probe(path);has_audio=any(x['codec_type']=='audio' for x in info['streams'])
  if not image and duration(path)+0.08<start+d:raise ValueError(f'Scene {i+1}: source clip is shorter than the selected trim range')
  args=(['-loop','1','-framerate','24'] if image else ['-ss',str(start)])+['-protocol_whitelist','file,pipe','-i',str(path),'-f','lavfi','-i','anullsrc=r=48000:cl=stereo']
  for line in s.get('dialogue',[]):
   audio=assets[line['audioAssetId']]['local'];offset=float(line.get('offset',0))
   if duration(audio)+offset>d+0.08:raise ValueError(f'Scene {i+1}: dialogue is longer than its scene. Extend or edit it first.')
   args+=['-protocol_whitelist','file,pipe','-i',str(audio)]
  vf=f'[0:v]scale={w}:{h}:force_original_aspect_ratio=decrease,pad={w}:{h}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=24,trim=duration={d},setpts=PTS-STARTPTS,format=yuv420p[v]'
  original=has_audio and s.get('sourceAudio',False) and not image
  af=f'[{0 if original else 1}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=duration={d},asetpts=PTS-STARTPTS,volume={0.25 if original and s.get("dialogue") else 1}[base]'
  labels=['[base]']
  for n,line in enumerate(s.get('dialogue',[])):
   delay=round(float(line.get('offset',0))*1000);af+=f';[{n+2}:a]aresample=48000,aformat=channel_layouts=stereo,adelay={delay}|{delay}[l{n}]';labels.append(f'[l{n}]')
  af+=';'+''.join(labels)+f'amix=inputs={len(labels)}:normalize=0:duration=longest,apad,atrim=duration={d}[a]'
  out=folder/f'scene-{i}.mp4';ff(args+['-filter_complex',vf+';'+af,'-map','[v]','-map','[a]','-t',str(d),'-c:v','libx264','-preset','veryfast','-crf','23','-c:a','aac','-b:a','160k','-movflags','+faststart',str(out)])
  parts.append(out)
 master=parts[0];total=float(scenes[0]['duration'])
 for i in range(1,len(parts)):
  s=scenes[i];transition=s.get('transition','cut');overlap=min(float(s.get('transitionSeconds',0.5)),float(s['duration'])/2,float(scenes[i-1]['duration'])/2) if transition!='cut' else 0
  progress(f'Stitching scene {i+1} of {len(parts)}');out=folder/f'joined-{i}.mp4'
  if overlap>0:
   effect='fadeblack' if transition=='fade' else 'fade'
   graph=f'[0:v][1:v]xfade=transition={effect}:duration={overlap}:offset={total-overlap}[v];[0:a][1:a]acrossfade=d={overlap}:c1=tri:c2=tri[a]'
  else:graph='[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[v][a]'
  ff(['-i',str(master),'-i',str(parts[i]),'-filter_complex',graph,'-map','[v]','-map','[a]','-c:v','libx264','-preset','veryfast','-crf','23','-c:a','aac','-movflags','+faststart',str(out)],900)
  master=out;total+=float(s['duration'])-overlap
 info=probe(master)
 if abs(float(info['format']['duration'])-total)>0.15:raise ValueError('Export timing verification failed')
 if not any(x['codec_type']=='audio' for x in info['streams']):raise ValueError('Export audio track missing')
 return master

def work(data):
 job=data['job'];snapshot=job['snapshot'];used=set()
 for s in snapshot['shots']:
  used.add(s['clipAssetId']);used.update(l['audioAssetId'] for l in s.get('dialogue',[]))
 with tempfile.TemporaryDirectory(prefix='imagineswade-') as tmp:
  folder=Path(tmp);assets={a['id']:a for a in data['assets'] if a['id'] in used}
  if used!=set(assets):raise ValueError('A source asset is unavailable')
  stage(job,'Downloading owned source media')
  for i,a in enumerate(assets.values()):
   active(job);url=a.pop('url');path=folder/f'input-{i}'
   with urllib.request.urlopen(url,timeout=120) as r,path.open('wb') as f:
    remaining=52428801
    while remaining>0:
     chunk=r.read(min(1048576,remaining))
     if not chunk:break
     f.write(chunk);remaining-=len(chunk)
   if path.stat().st_size!=a['bytes'] or path.stat().st_size>52428800:raise ValueError('Source size verification failed')
   a['local']=path
  result=assemble(snapshot,assets,folder,lambda label:stage(job,label))
  stage(job,'Saving master to media library');size=result.stat().st_size
  if size>52428800:raise ValueError('Master exceeds the current 50 MB export limit. Export fewer scenes.')
  aid=str(uuid.uuid4());target=rpc('output',{'jobId':job['id'],'assetId':aid,'bytes':size})
  req=urllib.request.Request(target['url'],data=result.read_bytes(),method='PUT',headers={'Content-Type':'video/mp4'})
  with urllib.request.urlopen(req,timeout=180) as r:
   if r.status!=200:raise ValueError('Master upload failed')
  active(job);rpc('complete',{'jobId':job['id'],'assetId':aid})
def main():
 while True:
  data=None
  try:
   data=rpc('claim')
   if data.get('job'):work(data)
  except Exception as e:
   if isinstance(e,urllib.error.HTTPError):
    try: e=ValueError('HTTP '+str(e.code)+' '+e.read(800).decode(errors='replace'))
    except Exception: pass
   if data and data.get('job'):
    try:rpc('fail',{'jobId':data['job']['id'],'error':str(e)[:900]})
    except Exception:pass
   print('CPU job failed; sanitized receipt in job record',flush=True)
  time.sleep(5)
if __name__=='__main__':main()
