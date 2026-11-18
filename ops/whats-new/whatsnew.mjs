import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {ok,fail,readJson} from '../lib/http.mjs';
import {eventInput,draftInput,draftBody,digest,sendInput,senderStatus,field} from '../lib/whats-new-core.mjs';
import {esc} from '../lib/clientdoc.mjs';
import {sensitiveReason} from '../lib/sensitive.mjs';
const S='swadebase_ops';
const base='/adapters/api/whats-new';
const clean=(text)=>{if(sensitiveReason(text))throw Object.assign(Error('Remove sensitive information before saving this update.'),{status:400});return text;};
const present=d=>({...d,digest:digest(d)});
export default function whatsNewRoutes({pool,auth,log}){
 async function timeline(){
  const [manual,deploy,adapters]=await Promise.all([
   pool.query(`select 'manual:'||id::text event_id,site,process,title,description,release_state,created_at from ${S}.whats_new_events order by created_at desc limit 100`),
   pool.query(`select 'deploy:'||id::text event_id,service site,'Deployment' process,coalesce(subject,service||' deployment') title,'Revision: '||sha description,'shipped' release_state,deployed_at created_at from ${S}.deploy_log order by deployed_at desc limit 100`),
   pool.query(`select 'adapter:'||a.id::text event_id,coalesce(r.owner_site,'SWADEBASE') site,'Adapter registration' process,coalesce(r.display_name,a.adapter_id) title,coalesce(r.purpose,'Adapter registered') description,'internal' release_state,a.created_at from ${S}.adapters_registry_audit a left join ${S}.adapters_registry r on r.id=a.adapter_id where a.action='register' order by a.created_at desc limit 100`)
  ]);
  return [...manual.rows,...deploy.rows,...adapters.rows].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,150);
 }
 async function audit(action,id,detail){await pool.query(`insert into ${S}.advisor_events(action,target,detail) values($1,$2,$3)`,[action,String(id),detail]);}
 return async(req,res,url,session)=>{
  const p=url.pathname;
  const page=p==='/adapters/whats-new',js=p==='/adapters/whats-new.js';
  if(!page&&!js&&!p.startsWith(base))return false;
  if(!session){if(page){res.writeHead(302,{location:'/adapters/login?next=%2Fadapters%2Fwhats-new','cache-control':'no-store'});return res.end();}return fail(res,401,'unauthorized','Owner login required.');}
  if((page||js)&&req.method==='GET'){
   const file=js?'whats-new.js':'whats-new.html';
   const body=await readFile(new URL('../public/'+file,import.meta.url));
   res.writeHead(200,{'content-type':js?'text/javascript':'text/html; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"});return res.end(body);
  }
  if(p===base&&req.method==='GET'){
   const [events,press,deliveries]=await Promise.all([timeline(),pool.query(`select * from ${S}.advisor_press_drafts where source_ref like 'whats-new:%' order by created_at desc limit 60`),pool.query(`select id,draft_id,recipient,status,provider_id,created_at from ${S}.press_release_deliveries order by created_at desc limit 60`)]);
   return ok(res,{events,press:press.rows.map(present),deliveries:deliveries.rows,mail:senderStatus(process.env),timezone:'America/Chicago'});
  }
  if(req.method!=='POST')return fail(res,405,'method_not_allowed','Use GET or POST.');
  if(!auth.csrfOk(req,session))return fail(res,403,'forbidden','CSRF check failed.');
  const b=await readJson(req,30000);
  if(p===base+'/events'){
   const e=eventInput(b);clean(Object.values(e).join('\n'));
   const row=(await pool.query(`insert into ${S}.whats_new_events(site,process,title,description,release_state) values($1,$2,$3,$4,$5) returning *`,[e.site,e.process,e.title,e.description,e.release_state])).rows[0];
   await audit('whats_new_created',row.id,{site:e.site,process:e.process});return ok(res,row,201);
  }
  if(p===base+'/press'){
   const event=(await timeline()).find(e=>e.event_id===b.event_id);
   if(!event)return fail(res,404,'not_found','Select an available update.');
   const title=clean(field(b.title,240,3)),summary=clean(field(b.public_summary,10000,10));
   const ref='whats-new:'+event.event_id;
   const row=(await pool.query(`insert into ${S}.advisor_press_drafts(source_kind,source_ref,title,body) values('manual',$1,$2,$3) on conflict(source_ref) do nothing returning *`,[ref,title,draftBody(title,summary,event.created_at)])).rows[0];
   const saved=row||(await pool.query(`select * from ${S}.advisor_press_drafts where source_ref=$1`,[ref])).rows[0];
   if(row)await audit('whats_new_press_created',row.id,{event_id:event.event_id});return ok(res,present(saved));
  }
  const m=p.match(/^\/adapters\/api\/whats-new\/press\/(\d+)\/(save|approve|send)$/);
  if(!m)return fail(res,404,'not_found','Not found.');
  const id=m[1],action=m[2];
  const c=await pool.connect();let delivery;
  try{
   await c.query('begin');
   const d=(await c.query(`select * from ${S}.advisor_press_drafts where id=$1 and source_ref like 'whats-new:%' for update`,[id])).rows[0];
   if(!d){await c.query('rollback');return fail(res,404,'not_found','Unknown release.');}
   if(b.digest!==digest(d)){await c.query('rollback');return fail(res,409,'conflict','This release changed. Reload and review it.');}
   if(action==='save'){
    const input=draftInput(b);clean(input.title+'\n'+input.body);
    const row=(await c.query(`update ${S}.advisor_press_drafts set title=$2,body=$3,status='draft',updated_at=now() where id=$1 returning *`,[id,input.title,input.body])).rows[0];
    await c.query('commit');await audit('whats_new_press_saved',id,{approval_reset:true});return ok(res,present(row));
   }
   if(action==='approve'){
    if(b.confirm!==true){await c.query('rollback');return fail(res,400,'confirm_required','Confirm approval of this release.');}
    const row=(await c.query(`update ${S}.advisor_press_drafts set status='approved_by_swade',updated_at=now() where id=$1 returning *`,[id])).rows[0];
    await c.query('commit');await audit('whats_new_press_approved',id,{digest:digest(row)});return ok(res,present(row));
   }
   const input=sendInput(b),mail=senderStatus(process.env);
   if(d.status!=='approved_by_swade'){await c.query('rollback');return fail(res,409,'approval_required','Approve the current release first.');}
   if(!mail.configured){await c.query('rollback');return fail(res,503,'mail_not_configured','Existing outbound email is not configured for this service.');}
   // Serialize admissions and enforce persistent caps, including pending/unknown outcomes.
   await c.query("select pg_advisory_xact_lock(hashtext('swadebase-whats-new-press-send'))");
   const existing=(await c.query(`select * from ${S}.press_release_deliveries where id=$1 or (draft_id=$2 and recipient=$3 and content_digest=$4)`,[input.request_id,id,input.recipient,input.digest])).rows[0];
   if(existing){await c.query('rollback');if(String(existing.draft_id)!==String(id)||existing.recipient!==input.recipient||existing.content_digest!==input.digest)return fail(res,409,'conflict','Request ID already belongs to another delivery.');return ok(res,{delivery:existing,replayed:true});}
   const counts=(await c.query(`select count(*) filter(where created_at>now()-interval '1 hour')::int hourly,count(*)::int daily from ${S}.press_release_deliveries where created_at>now()-interval '24 hours'`)).rows[0];
   if(counts.hourly>=5||counts.daily>=20){await c.query('rollback');return fail(res,429,'rate_limited','Press email limit reached (5/hour, 20/day).');}
   delivery=(await c.query(`insert into ${S}.press_release_deliveries(id,draft_id,recipient,content_digest,status) values($1,$2,$3,$4,'pending') returning *`,[input.request_id,id,input.recipient,input.digest])).rows[0];
   await c.query('commit');
   try{
    const response=await fetch('https://api.resend.com/emails',{method:'POST',signal:AbortSignal.timeout(20000),headers:{authorization:'Bearer '+process.env.RESEND_API_KEY,'content-type':'application/json','idempotency-key':'press-'+delivery.id},body:JSON.stringify({from:mail.from,to:[input.recipient],reply_to:mail.reply_to,subject:d.title,text:d.body,html:'<div style="white-space:pre-wrap;font-family:Georgia,serif">'+esc(d.body)+'</div>'})});
    const result=await response.json().catch(()=>({}));
    const status=response.ok&&result.id?'accepted':response.status>=500||response.ok?'unknown':'rejected';
    await pool.query(`update ${S}.press_release_deliveries set status=$2,provider_id=$3,updated_at=now() where id=$1`,[delivery.id,status,typeof result.id==='string'?result.id.slice(0,200):null]);
    await audit('whats_new_press_delivery',id,{delivery_id:delivery.id,status});return ok(res,{delivery_id:delivery.id,status,note:status==='accepted'?'Email provider accepted the message; inbox delivery is not yet verified.':status==='unknown'?'Outcome uncertain. Reconcile this delivery before retrying.':'Provider rejected the message.'});
   }catch{
    await pool.query(`update ${S}.press_release_deliveries set status='unknown',updated_at=now() where id=$1`,[delivery.id]);return ok(res,{delivery_id:delivery.id,status:'unknown',note:'Provider outcome uncertain. Reconcile before retrying.'});
   }
  }catch(e){await c.query('rollback').catch(()=>{});throw e;}finally{c.release();}
 };
}
