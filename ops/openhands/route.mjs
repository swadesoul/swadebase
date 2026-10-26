import {readFile} from 'node:fs/promises';
import {ok,fail,readJson,send} from '../../../swadebase-adapters/lib/http.mjs';
export const SOURCE='swade-openhands-pilot';
export const REQUEST='Fix cancellation in the shared voice lifecycle candidate: suppress stale transcription, release stale synthesized audio without playing it, preserve the exported API, and pass the fixed recovery/cancellation tests. This is a staged candidate, not a production deployment.';
export default function openhandsRoutes({pool,auth}) {
 const q=async(sql,args=[]) => (await pool.query(sql,args)).rows;
 return async(req,res,url,session)=>{
  const page=url.pathname==='/adapters/openhands';
  if(!page&&!url.pathname.startsWith('/adapters/api/openhands'))return false;
  if(!session){if(page){res.writeHead(302,{location:'/adapters/login?next=%2Fadapters%2Fopenhands'});res.end();return;}return fail(res,401,'unauthorized','Owner sign-in required.');}
  if(req.headers.origin&&req.headers.origin!=='https://swadebase.cloud')return fail(res,403,'forbidden','Bad origin.');
  if(req.method!=='GET'&&!auth.csrfOk(req,session))return fail(res,403,'forbidden','CSRF check failed.');
  if(page&&req.method==='GET')return send(res,200,await readFile(new URL('./console.html',import.meta.url),'utf8'),{'content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; frame-ancestors 'none'; base-uri 'none'"});
  if(url.pathname==='/adapters/api/openhands/script'&&req.method==='GET'){res.writeHead(200,{'content-type':'text/javascript','cache-control':'no-store'});res.end(await readFile(new URL('./console.js',import.meta.url)));return;}
  if(url.pathname==='/adapters/api/openhands'&&req.method==='GET')return ok(res,{csrf:session.csrf,mode:'operator_dispatch',scope:'shared-voice-lifecycle-candidate',jobs:await q(`select id,title,status,needs_approval,meta->'openhands' result,created_at,updated_at from swadebase_ops.handoff_log where source=$1 order by id desc limit 20`,[SOURCE])});
  if(url.pathname==='/adapters/api/openhands'&&req.method==='POST'){
   const b=await readJson(req,2000);if(b.confirm!==true)return fail(res,400,'confirm_required','Confirm the bounded local pilot.');
   if(typeof b.idempotency_key!=='string'||!/^[-a-f0-9]{36}$/.test(b.idempotency_key))return fail(res,400,'invalid_key','Use a fresh UUID.');
   const c=await pool.connect();try{
    await c.query('begin');await c.query('select pg_advisory_xact_lock(18795,5802)');
    const existing=(await c.query(`select id from swadebase_ops.handoff_log where source=$1 and meta->>'idempotency_key'=$2`,[SOURCE,b.idempotency_key])).rows[0];
    if(existing){await c.query('commit');return ok(res,existing);}
    const enabled=(await c.query(`select enabled from swadebase_ops.adapters_registry where id=$1`,[SOURCE])).rows[0]?.enabled;
    if(!enabled){await c.query('rollback');return fail(res,503,'paused','OpenHands pilot is paused.');}
    const count=(await c.query(`select count(*)::int n from swadebase_ops.handoff_log where source=$1 and created_at>now()-interval '24 hours'`,[SOURCE])).rows[0].n;
    if(count>=5){await c.query('rollback');return fail(res,429,'daily_limit','Pilot limit: five jobs per 24 hours.');}
    const row=(await c.query(`insert into swadebase_ops.handoff_log(kind,source,target_agent,title,body,meta,needs_approval) values('task',$1,'cos','OpenHands shared voice lifecycle pilot',$2,$3,false) returning id`,[SOURCE,REQUEST,JSON.stringify({actor_id:session.userId||'owner-session',idempotency_key:b.idempotency_key,approval:'founder_confirmed_fixed_pilot',openhands:{state:'queued_for_operator',production_deployed:false}})])).rows[0];
    await c.query('commit');return ok(res,row,201);
   }catch(e){await c.query('rollback');throw e;}finally{c.release();}
  }
  const m=url.pathname.match(/^\/adapters\/api\/openhands\/(\d+)\/candidate$/);
  if(m&&req.method==='GET'){
   const row=(await q(`select meta->'openhands' result from swadebase_ops.handoff_log where id=$1 and source=$2`,[m[1],SOURCE]))[0];
   if(!row?.result?.state||!['review_ready','blocked_model_or_tests'].includes(row.result.state))return fail(res,404,'not_ready','No completed candidate.');
   const candidate=await readFile('/opt/swadebase-adapters/var/openhands/jobs/'+m[1]+'/voice-session.mjs','utf8');
   res.writeHead(200,{'content-type':'text/plain','cache-control':'no-store','content-disposition':'attachment; filename="voice-session-candidate.mjs"'});res.end(candidate.slice(0,16000));return;
  }
  return fail(res,404,'not_found','Unknown pilot action.');
 };
}
