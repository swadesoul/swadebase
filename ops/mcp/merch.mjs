import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
export const MERCH_STORE='57e6a7d2-7392-4a34-ae3b-606d1e5dd775',MERCH_SHOP='27971409';
const err=(code,message)=>Object.assign(Error(message),{code});
export function makeMerch({pool,guard,readSnapshot=async()=>JSON.parse(await readFile('/opt/sssbrain-ops/merch/catalog.json','utf8'))}){
 async function snapshot(){const d=await readSnapshot();if(d.store_id!==MERCH_STORE||d.shop_id!==MERCH_SHOP||!Array.isArray(d.items)||d.items.length>200)throw err('unavailable','The scoped catalog snapshot is unavailable.');return d;}
 async function catalog(actor,{limit=10,offset=0}={}){
  await guard(actor,'merch:read');if(!Number.isInteger(limit)||limit<1||limit>20||!Number.isInteger(offset)||offset<0||offset>200)throw err('invalid_input','Invalid catalog page.');
  const d=await snapshot();return {shop_id:MERCH_SHOP,store_id:MERCH_STORE,as_of:d.checked_at,approved_logo:d.approved_logo??null,items:d.items.slice(offset,offset+limit),next_offset:d.items.length>offset+limit?offset+limit:null,source:'SWADEBASE catalog snapshot; freshness and visual QA are separate',production_enabled:false};
 }
 async function report(actor,input){
  await guard(actor,'merch:report');const {idempotency_key,product_ids=[],outcome,summary}=input;
  if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(idempotency_key||'')||!Array.isArray(product_ids)||product_ids.length>10||typeof summary!=='string'||summary.trim().length<20||summary.length>4000||!['blocked','needs_revision','ready_for_human_review'].includes(outcome))throw err('invalid_input','Supply a UUID key, scoped products, outcome and evidence summary.');
  const d=await snapshot(),known=new Set(d.items.map(p=>p.id));if(product_ids.some(id=>typeof id!=='string'||!known.has(id)))throw err('forbidden','Product is outside the authorized ABAGALE store.');
  const clean={product_ids:[...new Set(product_ids)].sort(),outcome,summary:summary.trim()},digest=createHash('sha256').update(JSON.stringify(clean)).digest('hex');
  const c=await pool.connect();try{
   await c.query('begin');await c.query('select pg_advisory_xact_lock(hashtext($1))',['abagale-merch:'+actor.id+':'+idempotency_key]);
   const existing=(await c.query("select id,status,meta from swadebase_ops.handoff_log where source='abagale-merch-mcp' and meta->>'actor_id'=$1 and meta->>'idempotency_key'=$2",[actor.id,idempotency_key])).rows[0];
   if(existing){if(existing.meta?.digest!==digest)throw err('conflict','The key was already used for a different review.');await c.query('commit');return {receipt_id:String(existing.id),status:existing.status,delivery:'queued_not_acknowledged',replayed:true,production_started:false};}
   const meta={actor_id:actor.id,idempotency_key,digest,shop_id:MERCH_SHOP,store_id:MERCH_STORE,...clean,approval:'human_review_required',delivery:'queued_unacknowledged'};
   const row=(await c.query("insert into swadebase_ops.handoff_log(kind,source,target_agent,title,body,meta,status,needs_approval) values('note','abagale-merch-mcp','cos',$1,$2,$3,'open',false) returning id,status",['ABAGALE merchandise QA: '+outcome,clean.summary,meta])).rows[0];await c.query('commit');return {receipt_id:String(row.id),status:row.status,delivery:'queued_not_acknowledged',production_started:false};
  }catch(e){await c.query('rollback');throw e;}finally{c.release();}
 }
 return {catalog,report};
}

