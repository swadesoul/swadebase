import http from 'node:http';
import {spawn} from 'node:child_process';
import {randomUUID,timingSafeEqual} from 'node:crypto';
import {mkdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {createKillSwitch} from './killswitch.mjs';
const PORT=Number(process.env.PORT||8787);
const TOKEN=process.env.HYPERFRAMES_ADAPTER_TOKEN;
if(!TOKEN || TOKEN.length<24){console.error('HYPERFRAMES_ADAPTER_TOKEN must be set (24+ chars)');process.exit(1);}
const root=path.resolve('/opt/swadebase/hyperframes-adapter');
const engine=path.join(root,'engine');
const jobs=new Map();
// Kill switch (SWADE Adapter Contract v1 amendment §8): refuse new work when the owner switches this adapter off.
const killSwitch=createKillSwitch({adapterId:'swadebase-hyperframes'});
const allowedSites=new Set((process.env.HYPERFRAMES_SITES||'teachvirt,sssbrain').split(',').map(s=>s.trim()));
function json(res,status,data){res.writeHead(status,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(data));}
function auth(req){const supplied=(req.headers.authorization||'').replace(/^Bearer /,'');const a=Buffer.from(supplied);const b=Buffer.from(TOKEN);return a.length===b.length&&timingSafeEqual(a,b);}
const server=http.createServer(async(req,res)=>{
if(req.url==='/health'&&req.method==='GET')return json(res,200,{status:'ok',engine:'hyperframes',consumers:[...allowedSites]});
if(!auth(req))return json(res,401,{error:'unauthorized'});
const url=new URL(req.url,'http://localhost');
if(req.method==='GET' && url.pathname.startsWith('/v1/jobs/') && /^[a-f0-9-]+$/.test(url.pathname.split('/').pop())){const job=jobs.get(url.pathname.split('/').pop());return json(res,job?200:404,job||{error:'not_found'});}
if(req.method==='POST'&&url.pathname==='/v1/renders'){
 const gate=await killSwitch.check();if(!gate.enabled)return json(res,503,killSwitch.disabledBody(gate.reason));
 let raw='';for await(const part of req){raw+=part;if(raw.length>8192)return json(res,413,{error:'request_too_large'});}
 let input;try{input=JSON.parse(raw);}catch{return json(res,400,{error:'invalid_json'});}
 const site=String(input.site||'');const template=String(input.template||'starter');
 if(!allowedSites.has(site))return json(res,403,{error:'site_not_allowed'});
 if(template!=='starter')return json(res,400,{error:'unknown_template'});
 if([...jobs.values()].filter(j=>j.status==='rendering').length>=1)return json(res,429,{error:'worker_busy'});
 const id=randomUUID(),output=path.join(root,'jobs',id+'.mp4');await mkdir(path.dirname(output),{recursive:true});
 const job={id,site,template,status:'rendering',createdAt:new Date().toISOString()};jobs.set(id,job);
 const child=spawn(path.join(engine,'node_modules/.bin/hyperframes'),['render','--output',output],{cwd:engine,env:{...process.env},stdio:['ignore','pipe','pipe']});
 let error='';child.stderr.on('data',c=>error=(error+c.toString()).slice(-800));child.on('error',e=>{job.status='failed';job.error=e.message;});
 child.on('close',async code=>{if(job.status==='failed')return;try{const file=await stat(output);job.status=code===0&&file.size>0?'completed':'failed';if(job.status==='completed'){job.sizeBytes=file.size;job.outputPath=output;}else job.error=error||('exit '+code);}catch{job.status='failed';job.error=error||('exit '+code);}});
 return json(res,202,{id,status:job.status,statusPath:'/v1/jobs/'+id});
}
return json(res,404,{error:'not_found'});
});
server.listen(PORT,'127.0.0.1',()=>console.log('hyperframes adapter listening on loopback:'+PORT));
