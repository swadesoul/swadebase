// On-demand trusted operator entry point. No daemon, timer, broad repository or shell tool.
import {readFile,writeFile,mkdir,copyFile,chmod} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {makePool} from '../../../swadebase-adapters/lib/db.mjs';
import {REQUEST,SOURCE} from './route.mjs';
const exec=promisify(execFile),root='/opt/swadebase-adapters/var/openhands/jobs';
if(process.getuid()!==0)throw Error('Run through the existing authorized server operator.');
const pid=(await exec('systemctl',['show','swadebase-adapters','--property=MainPID','--value'])).stdout.trim();
for(const item of (await readFile('/proc/'+pid+'/environ','utf8')).split('\0')){const i=item.indexOf('=');if(['PGHOST','PGPORT','PGDATABASE','PGUSER','PGPASSWORD'].includes(item.slice(0,i)))process.env[item.slice(0,i)]=item.slice(i+1);}
const pool=makePool(),c=await pool.connect();let id,locked=false;
try {
 locked=(await c.query('select pg_try_advisory_lock(18795,5801) locked')).rows[0].locked;if(!locked)throw Error('Another OpenHands pilot is active.');
 const enabled=(await c.query('select enabled from swadebase_ops.adapters_registry where id=$1',[SOURCE])).rows[0]?.enabled;if(!enabled)throw Error('Pilot paused or unregistered.');
 if(process.argv[2]==='--create'){
  const n=(await c.query(`select count(*)::int n from swadebase_ops.handoff_log where source=$1 and created_at>now()-interval '24 hours'`,[SOURCE])).rows[0].n;if(n>=5)throw Error('Daily pilot limit reached.');
  id=(await c.query(`insert into swadebase_ops.handoff_log(kind,source,target_agent,title,body,meta,needs_approval) values('task',$1,'cos','OpenHands voice pilot',$2,$3,false) returning id`,[SOURCE,REQUEST,{approval:'founder_authorized_session',openhands:{state:'queued_for_operator'}}])).rows[0].id;
 } else {id=process.argv[2];if(!/^\d+$/.test(id||''))throw Error('Usage: node cli.mjs --create | JOB_ID');}
 const row=(await c.query(`update swadebase_ops.handoff_log set status='claimed',updated_at=now(),meta=jsonb_set(meta,'{openhands}',jsonb_build_object('state','running','production_deployed',false)) where id=$1 and source=$2 and status='open' and not needs_approval and meta->>'approval' in ('founder_confirmed_fixed_pilot','founder_authorized_session') returning body`,[id,SOURCE])).rows[0];
 if(!row||row.body!==REQUEST)throw Error('Task is not an approved fixed voice pilot.');
 const path=root+'/'+id;await mkdir(path,{recursive:false,mode:0o755});
 for(const file of ['voice-session.mjs','voice-session.test.mjs'])await copyFile(new URL('./'+file,import.meta.url),path+'/'+file);
 await writeFile(path+'/request.txt',REQUEST,{mode:0o644});
 let error;
 try{const out=await exec('/opt/swadebase-openhands-venv/bin/python',[new URL('./agent.py',import.meta.url).pathname,path],{timeout:600000,maxBuffer:300000,env:{PATH:'/usr/bin:/bin',HOME:path,OPENHANDS_SUPPRESS_BANNER:'1',DO_NOT_TRACK:'1',ANONYMIZED_TELEMETRY:'false',LITELLM_LOCAL_MODEL_COST_MAP:'True'}});await writeFile(path+'/worker.log',out.stdout+out.stderr,{mode:0o600});}catch(e){error=e.killed?'Worker exceeded ten-minute limit':String(e.message).slice(0,300);}
 let result;try{result=JSON.parse(await readFile(path+'/result.json','utf8'));}catch{result={state:'blocked_model_or_tests',error:error||'Worker did not produce a result',production_deployed:false};}
 result.finished_at=new Date().toISOString();
 await c.query(`update swadebase_ops.handoff_log set status='done',updated_at=now(),meta=jsonb_set(meta,'{openhands}',$2::jsonb) where id=$1 and source=$3`,[id,JSON.stringify(result),SOURCE]);
 console.log(JSON.stringify({job_id:id,...result}));
} finally {if(locked)await c.query('select pg_advisory_unlock(18795,5801)');c.release();await pool.end();}
