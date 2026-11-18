import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {randomUUID,timingSafeEqual} from 'node:crypto';
const exec=promisify(execFile);
export const BASE='/api/adapters/pet-muzik-voice';
const PAGE='/adapters/pet-muzik-voice/';
const ORIGIN='https://swadebase.cloud';
const PROJECT='appgprj_6ae11e774ba88191ba4898e90c08dea6';
const fail=(status,message)=>Object.assign(Error(message),{status});
const equal=(a,b)=>{const x=Buffer.from(String(a||'')),y=Buffer.from(String(b||''));return x.length>0&&x.length===y.length&&timingSafeEqual(x,y)};
export default function voiceRoutes({pool,admin,fetchImpl=fetch,voiceToken=process.env.ASSET_VOICE_TOKEN,staticDir=join(dirname(fileURLToPath(import.meta.url)),'public'),convert=toWav}){
 let busy=false;
 const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data))};
 async function bytes(req,limit){let n=0,chunks=[];for await(const c of req){n+=c.length;if(n>limit)throw fail(413,'Record up to 30 seconds and 2 MB.');chunks.push(c)}return Buffer.concat(chunks)}
 return async(req,res,url,session)=>{
  const p=url.pathname;
  if(p===PAGE.slice(0,-1)){res.writeHead(303,{Location:PAGE});res.end();return true}
  if(p.startsWith(PAGE)){
   const file=p.slice(PAGE.length)||'index.html';
   if(req.method!=='GET'||!['index.html','bridge.js'].includes(file))return send(res,404,{error:'Not found'});
   const data=await readFile(join(staticDir,file));res.writeHead(200,{'Content-Type':file.endsWith('.js')?'text/javascript':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; media-src blob:; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",'Cross-Origin-Opener-Policy':'unsafe-none','X-Content-Type-Options':'nosniff'});res.end(data);return true;
  }
  if(!p.startsWith(BASE+'/'))return false;
  try{
   // A legacy owner-token cookie must not shadow the verified shared Google session.
   if(!session?.userId||session.via!=='swadebase'){const cookie=String(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('swb_admin='))?.slice(10);if(cookie&&admin.lookup){const verified=await admin.lookup(cookie);if(verified)session={...verified,via:'swadebase'}}}
   if(!session?.userId||session.via!=='swadebase')throw fail(401,'Connect your SWADEBASE owner account.');
   if(session.email?.toLowerCase()!=='swadesoul@gmail.com'||!await admin.isSuperAdmin(session.userId))throw fail(403,'This PET MUZIK studio is owner-private.');
   if(req.method==='GET'&&p===BASE+'/session')return send(res,200,{connected:!!voiceToken,project_id:PROJECT,csrf:session.csrf,max_seconds:30,provider:'SWADEBASE Voice Studio',speech:'CPU Kokoro',transcription:'CPU Whisper',paid_fallback:false});
   if(!['/speak','/transcribe'].includes(p.slice(BASE.length))||req.method!=='POST')throw fail(404,'Not found.');
   if(req.headers.origin!==ORIGIN||!equal(req.headers['x-csrf-token'],session.csrf))throw fail(403,'Reconnect Voice Studio before recording.');
   if(!voiceToken)throw fail(503,'The native voice connection is unavailable. Typing remains ready.');
   if(busy)throw fail(429,'Voice Studio is busy. Please retry shortly.');
   busy=true;let ledger,requestId;
   try{
    const q=await pool.query("select count(*) filter(where occurred_at>now()-interval '1 hour')::int as hour,count(*)::int as day from swadebase_ops.ai_usage_ledger where project='pet-muzik' and user_id=$1 and occurred_at>now()-interval '1 day'",[session.userId]);
    if(q.rows[0].hour>=120||q.rows[0].day>=300)throw fail(429,'Your voice allowance is reached. Typing remains available.');
    const speaking=p.endsWith('/speak');let text,wav,duration;
    if(speaking){const raw=await bytes(req,5000);let b;try{b=JSON.parse(raw)}catch{throw fail(400,'Invalid voice request.')}if(typeof b.text!=='string'||!b.text.trim()||b.text.length>600||b.project_id!==PROJECT)throw fail(400,'Choose a short PET MUZIK follow-up question.');text=b.text.trim()}
    else{const raw=await bytes(req,2100000);let form;try{form=await new Request('http://localhost',{method:'POST',headers:{'Content-Type':req.headers['content-type']||''},body:raw}).formData()}catch{throw fail(400,'Choose a short audio recording.')}const file=form.get('file');if(form.get('project_id')!==PROJECT||!file||typeof file.arrayBuffer!=='function'||file.size<100||file.size>2000000||!/^audio\/(webm|mp4|mpeg|wav|x-wav|ogg)(;|$)/.test(file.type))throw fail(400,'Use an audio recording up to 30 seconds and 2 MB.');({wav,duration}=await convert(Buffer.from(await file.arrayBuffer())))}
    const id=randomUUID();requestId=id;
    // Persistent reservation before CPU work; no customer transcript or audio enters the ledger.
    const r=await pool.query("select swadebase_ops.pet_muzik_record_voice($1,$2,$3::jsonb,$4) as ledger_id",[session.userId,speaking?'voice-follow-up':'voice-intake',JSON.stringify(speaking?{character:text.length}:{audio_second:duration}),id]);ledger=r.rows[0].ledger_id;
    let upstream;
    if(speaking){upstream=await fetchImpl('http://172.16.0.1:8790/v1/speak',{method:'POST',headers:{Authorization:'Bearer '+voiceToken,'Content-Type':'application/json'},body:JSON.stringify({text,engine:'kokoro',voice:'kokoro:af_alloy',language:'en',format:'mp3'}),signal:AbortSignal.timeout(90000)});if(!upstream.ok||upstream.headers.get('x-engine')!=='kokoro')throw fail(503,'Native speech could not finish. No paid fallback was used.');const data=Buffer.from(await upstream.arrayBuffer());if(data.length<500||data.length>4000000)throw fail(503,'Invalid speech response.');await pool.query("select swadebase_ops.pet_muzik_finish_voice($1,$2,$3,'ok')",[ledger,session.userId,requestId]);res.writeHead(200,{'Content-Type':'audio/mpeg','Content-Length':data.length,'Cache-Control':'no-store','X-Voice-Engine':'kokoro-cpu'});res.end(data)}
    else{const form=new FormData();form.append('file',new Blob([wav],{type:'audio/wav'}),'voice.wav');form.append('language','en');upstream=await fetchImpl('http://172.16.0.1:8790/v1/voicebox/transcribe',{method:'POST',headers:{Authorization:'Bearer '+voiceToken},body:form,signal:AbortSignal.timeout(90000)});if(!upstream.ok)throw fail(503,'Transcription could not finish. Please retry or type your answer.');const data=await upstream.json();await pool.query("select swadebase_ops.pet_muzik_finish_voice($1,$2,$3,'ok')",[ledger,session.userId,requestId]);send(res,200,{text:String(data.transcript||'').trim().slice(0,5000),engine:'whisper-cpu',duration,stored:false,request_id:id})}
   }catch(e){if(ledger)await pool.query("select swadebase_ops.pet_muzik_finish_voice($1,$2,$3,'failed')",[ledger,session.userId,requestId]).catch(()=>{});throw e}finally{busy=false}
  }catch(e){send(res,e.status||503,{error:e.status?e.message:'Voice Studio could not finish. Typing remains available.'})}
  return true;
 };
}
export async function toWav(data){let dir;try{dir=await mkdtemp(join(tmpdir(),'pet-muzik-voice-'));const input=join(dir,'input'),output=join(dir,'voice.wav');await writeFile(input,data,{mode:0o600});await exec('/usr/bin/ffmpeg',['-v','error','-nostdin','-protocol_whitelist','file,pipe','-format_whitelist','mov,matroska,webm,wav,ogg,mp3','-i',input,'-t','31','-vn','-ac','1','-ar','16000','-y',output],{timeout:15000,maxBuffer:100000});const probe=await exec('/usr/bin/ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',output],{timeout:5000,maxBuffer:10000});const duration=Number(probe.stdout.trim());if(!Number.isFinite(duration)||duration<=0||duration>30.1)throw fail(400,'Keep recordings under 30 seconds.');return{wav:await readFile(output),duration}}catch(e){if(e.status)throw e;throw fail(400,'This audio could not be read. Please record again.')}finally{if(dir)await rm(dir,{recursive:true,force:true})}}
