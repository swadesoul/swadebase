#!/usr/bin/env python3
import subprocess,json,datetime,os
from pathlib import Path
os.umask(0o077)
r=subprocess.run(['ssh','-T','-o','BatchMode=yes','-o','ConnectTimeout=10','-o','StrictHostKeyChecking=yes','watchtower','cat /var/lib/watchtower/health-report.json'],capture_output=True,text=True,timeout=20)
root=Path('/opt/swadebase/docs/learning-approved');out=root/'watchtower-health-current.md'
if r.returncode:raise SystemExit('Watchtower status unavailable; prior dated report retained.')
d=json.loads(r.stdout);items=d['monitors'];assert isinstance(items,list) and len(items)<=500
counts=d['counts'];body='# Watchtower current observed health\n\nObserved at '+d['observed_at_utc']+'. This is a dated observation, not a current guarantee.\n\n'+d['scope']+'\n\n'+json.dumps(counts)+'\n\nBackup / restore receipts: '+json.dumps({'backup':d.get('backup'),'restore':d.get('restore')})+'\n\n| Monitor | State | Last check |\n| --- | --- | --- |\n'
for x in items:
 name=str(x['name']).replace('|',' ').replace('\n',' ')[:160]
 state={0:'down',1:'up',2:'pending',3:'maintenance'}.get(x['status'],'pending')
 body+='| '+name+' | '+state+' | '+str(x['checked_at'] or 'not yet observed')+' |\n'
tmp=out.with_suffix('.tmp');tmp.write_text(body);tmp.replace(out)
subprocess.run(['python3','/opt/swadebase/ops/knowledge-learning/sync.py'],check=True,timeout=90,stdout=subprocess.DEVNULL)
print(json.dumps({'watchtower_report_refreshed':True,'counts':counts}))
