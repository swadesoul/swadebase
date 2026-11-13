import {randomUUID} from 'node:crypto';
import {ACTION_APP,ACTION_SOURCE,actionDigest,assertExecution,checkPayment,fail,hasCredential,normalizeAction,normalizePaymentRules,repositoryPath,uuid} from './action-policy.mjs';
export function makeActions({pool,guard:baseGuard,providers,clock=()=>Date.now()}){
 const isOwner=async actor=>{const r=await pool.query('select swadebase_ops.mcp_is_owner($1::uuid) ok',[actor.id]);return r.rows[0]?.ok===true;};
 const guard=async(actor,scope)=>{await baseGuard(actor,scope);if(!await isOwner(actor))throw fail('forbidden','These execution connections belong to the verified founder owner.',403);};
 async function transaction(actor,fn){
  if(!uuid(actor?.id))throw fail('forbidden','Verified owner identity is required.',403);
  const c=await pool.connect();try{await c.query('begin');await c.query("select set_config('swade.mcp.actor',$1,true)",[actor.id]);const result=await fn(c);await c.query('commit');return result;}catch(e){await c.query('rollback').catch(()=>{});throw e;}finally{c.release();}
 }
 const select=async(c,actor,id,lock=false)=>{if(!uuid(id))throw fail('invalid_input','A valid action ID is required.',400);const row=(await c.query(`select * from sssbrain.ops_actions where id=$1 and actor=$2 and app_slug=$3 and request->>'source'=$4${lock?' for update':''}`,[id,actor.id,ACTION_APP,ACTION_SOURCE])).rows[0];if(!row)throw fail('not_found','Action not found for this account.',404);return row;};
 const audit=(c,action,id,detail)=>c.query('insert into swadebase_ops.advisor_events(action,target,detail) values($1,$2,$3)',[action,id,detail]);
 const lockActor=(c,actor)=>c.query("select pg_advisory_xact_lock(hashtext('mcp-approved-actions:'||$1))",[actor.id]);
 const policy=async(c,actor)=>{const r=(await c.query(`select request->'policy' policy from sssbrain.ops_actions where actor=$1 and app_slug=$2 and action='mcp_payment_rules' and status='approved' order by approved_at desc,created_at desc limit 1`,[actor.id,ACTION_APP])).rows[0];return r?.policy||null;};
 async function reserved(c,actor,exceptId){const row=(await c.query(`select coalesce(sum((request->'snapshot'->'input'->>'amount_minor')::bigint),0)::text total from sssbrain.ops_actions where actor=$1 and app_slug=$2 and action='mcp_payment_transfer' and id<>$3 and status in ('approved','executed','failed') and result->>'stage' in ('approved','executing','unknown','transferred') and coalesce((result->>'claimed_at')::timestamptz,approved_at) >= (date_trunc('day',now() at time zone 'America/Chicago') at time zone 'America/Chicago') and (result->>'stage'<>'approved' or (result->>'approval_expires_at')::timestamptz>now())`,[actor.id,ACTION_APP,exceptId])).rows[0];return Number(row?.total||0);}
 function present(row){return {action_id:row.id,operation:row.request?.snapshot?.operation||row.action,status:row.result?.stage==='executing'?'executing':row.status,digest:row.request?.digest,proposal:row.request?.snapshot,expires_at:row.request?.expires_at,approved_at:row.approved_at,receipt:row.result||{},approval_url:'https://swadebase.cloud/adapters/mcp/actions?action='+row.id,note:'Only the signed-in owner console can approve. A connected bot cannot grant approval.'};}
 async function capabilities(actor){await guard(actor,'ecosystem:read');const rules=await transaction(actor,c=>policy(c,actor));return {operations:providers.capabilities(),targets:providers.targets?.()||{repositories:[],applications:[]},payment_rules:rules?{...rules,digest:actionDigest(rules)}:null,payments_default:'No payment is permitted without enabled owner-approved rules and separate approval of its exact details.',approval_url:'https://swadebase.cloud/adapters/mcp/actions',approval_is_not_an_mcp_tool:true};}
 async function prepare(actor,{operation,input,idempotency_key}){
  await guard(actor,'actions:prepare');if(!uuid(idempotency_key))throw fail('invalid_input','A UUID idempotency key is required.',400);
  input=normalizeAction(operation,input);const context=await providers.context(operation,input),snapshot={operation,input,context},digest=actionDigest(snapshot);
  return transaction(actor,async c=>{
   await lockActor(c,actor);const previous=(await c.query(`select * from sssbrain.ops_actions where actor=$1 and app_slug=$2 and request->>'idempotency_key'=$3`,[actor.id,ACTION_APP,idempotency_key])).rows[0];if(previous){if((previous.request.intent_digest||previous.request.digest)!==digest)throw fail('idempotency_conflict','This request key belongs to different action content.');return {...present(previous),replayed:true};}
   if(operation==='payment_transfer'){checkPayment(input,await policy(c,actor),0,clock());const prior=(await c.query(`select id from sssbrain.ops_actions where actor=$1 and app_slug=$2 and action='mcp_payment_transfer' and request->'snapshot'->'input'->>'destination'=$3 and request->'snapshot'->'input'->>'reference'=$4 and result->>'stage' in ('awaiting_approval','approved','executing','unknown','transferred') limit 1`,[actor.id,ACTION_APP,input.destination,input.reference])).rows[0];if(prior)throw fail('duplicate_payment_reference','This payee/reference already has a pending, uncertain or completed payment. Inspect action '+prior.id+' instead of preparing another payment.');}
   if(operation==='delete_draft'){const d=(await c.query(`select id,title,body_markdown,updated_at,lifecycle_status from sssbrain.brain_wiki_pages where id=$1 and user_id=$2 for update`,[input.draft_id,actor.id])).rows[0];if(!d||d.lifecycle_status==='archived')throw fail('not_found','An active owned draft was not found.',404);if(actionDigest(d)!==input.expected_digest)throw fail('stale_draft','The draft changed. Read its current preview before proposing deletion.');snapshot.context={...context,title:d.title};}
   const id=randomUUID(),request={source:ACTION_SOURCE,idempotency_key,intent_digest:digest,snapshot,digest:actionDigest(snapshot),expires_at:new Date(clock()+30*60000).toISOString()};
   const rows=(await c.query(`insert into sssbrain.ops_actions(id,actor,app_slug,action,risk,status,target,request,result,receipt) values($1,$2,$3,$4,'write','awaiting_approval',$5,$6,$7,$7) returning *`,[id,actor.id,ACTION_APP,'mcp_'+operation,input.repository||input.application||input.to||input.destination||input.draft_id,request,{stage:'awaiting_approval',execution_started:false}])).rows;
   await audit(c,'mcp_action_prepared',id,{actor_id:actor.id,operation,digest:request.digest});return present(rows[0]);
  });
 }
 async function get(actor,{action_id}){await guard(actor,'ecosystem:read');return transaction(actor,async c=>present(await select(c,actor,action_id)));}
 async function list(actor){await guard(actor,'ecosystem:read');return transaction(actor,async c=>({items:(await c.query(`select * from sssbrain.ops_actions where actor=$1 and app_slug=$2 and request->>'source'=$3 and action<>'mcp_payment_rules' order by created_at desc limit 40`,[actor.id,ACTION_APP,ACTION_SOURCE])).rows.map(present)}));}
 async function readDraft(actor,{draft_id}){await guard(actor,'ecosystem:read');if(!uuid(draft_id))throw fail('invalid_input','A valid draft ID is required.',400);return transaction(actor,async c=>{const d=(await c.query(`select id,title,body_markdown,updated_at,lifecycle_status from sssbrain.brain_wiki_pages where id=$1 and user_id=$2`,[draft_id,actor.id])).rows[0];if(!d)throw fail('not_found','Owned draft not found.',404);return {draft_id:d.id,title:d.title,lifecycle_status:d.lifecycle_status,digest:actionDigest(d),deletion_mode:'archive_only_reversible'};});}
 async function readCode(actor,input){await guard(actor,'ecosystem:read');repositoryPath(input.path);const result=await providers.readCode(input);if(hasCredential(result.content))throw fail('sensitive_source','Source contains a credential pattern and was withheld.');return result;}
 async function ownerRules(actor,{rules,confirm,confirmation}){
  if(actor?.channel!=='owner_session')throw fail('owner_session_required','Payment rules can only be changed in the signed-in owner console.',403);await guard(actor,'ecosystem:read');
  if(confirm!==true||confirmation!=='SAVE PAYMENT RULES')throw fail('confirmation_required','Confirm the exact payment rules.');rules=normalizePaymentRules(rules,clock());if(rules.enabled)await providers.verifyPaymentRules(rules);
  return transaction(actor,async c=>{await lockActor(c,actor);const request={source:ACTION_SOURCE,policy:rules};await c.query(`insert into sssbrain.ops_actions(id,actor,app_slug,action,risk,status,target,request,result,receipt,approved_by,approved_at) values($1,$2,$3,'mcp_payment_rules','write','approved','stripe_connect_transfer',$4,$5,$5,$2,now())`,[randomUUID(),actor.id,ACTION_APP,request,{stage:'rules_approved',digest:actionDigest(rules)}]);await audit(c,'mcp_payment_rules_approved',actor.id,{digest:actionDigest(rules),enabled:rules.enabled,currency:rules.currency,max_payment_minor:rules.max_payment_minor,daily_cap_minor:rules.daily_cap_minor});return {rules,digest:actionDigest(rules),every_payment_still_requires_separate_approval:true};});
 }
 async function ownerDecision(actor,{action_id,digest,decision,confirm,payment_confirmation,public_confirmation}){
  if(actor?.channel!=='owner_session')throw fail('owner_session_required','Action approval requires the signed-in owner console.',403);await guard(actor,'ecosystem:read');if(!['approve','reject'].includes(decision)||confirm!==true)throw fail('confirmation_required','Confirm approval or rejection of the displayed action.');
  return transaction(actor,async c=>{
   await lockActor(c,actor);const row=await select(c,actor,action_id,true);if(decision==='approve'&&row.status!=='awaiting_approval'||decision==='reject'&&!(row.status==='awaiting_approval'||row.status==='approved'&&row.result?.stage==='approved'))throw fail('invalid_state','This action can no longer be approved or cancelled.');if(row.request.digest!==digest||actionDigest(row.request.snapshot)!==digest)throw fail('stale_action','The action changed; reload and review it.');if(decision==='approve'&&Date.parse(row.request.expires_at)<=clock())throw fail('approval_expired','Prepare a fresh action.');
   const {operation,input}=row.request.snapshot;
   if(decision==='approve'){
    providers.ready(operation,input);
    if(row.request.snapshot.context.visibility==='public'&&public_confirmation!=='PUBLISH TO PUBLIC REPOSITORY')throw fail('public_confirmation_required','Explicitly confirm public repository publication of this exact content.');
    if(operation==='payment_transfer'){const p=await policy(c,actor);checkPayment(input,p,await reserved(c,actor,row.id),clock());if(payment_confirmation!==`PAY ${input.amount_minor} ${input.currency.toUpperCase()} TO ${input.destination}`)throw fail('payment_confirmation_required','Type the exact payment confirmation shown.');}
   }
   const result={stage:decision==='approve'?'approved':'rejected',execution_started:false,approval_expires_at:new Date(Math.min(clock()+10*60000,Date.parse(row.request.expires_at))).toISOString()};
   const updated=(await c.query(`update sssbrain.ops_actions set status=$3,approved_by=$2,approved_at=now(),result=$4,receipt=$4 where id=$1 and actor=$2 returning *`,[row.id,actor.id,decision==='approve'?'approved':'rejected',result])).rows[0];await audit(c,'mcp_action_'+decision,row.id,{actor_id:actor.id,digest});return present(updated);
  });
 }
 async function execute(actor,{action_id,digest}){
  await guard(actor,'actions:execute');
  const claim=await transaction(actor,async c=>{
   await lockActor(c,actor);const row=await select(c,actor,action_id,true);
   if(row.request.digest!==digest||actionDigest(row.request.snapshot)!==digest)throw fail('stale_action','The requested action content changed.');
   if(row.status==='executed'||row.result?.stage==='executing'||row.result?.stage==='unknown')return {replay:present(row)};
   assertExecution(row,actor,digest,clock());const {operation,input}=row.request.snapshot;providers.ready(operation,input);let paymentRules;
   if(operation==='payment_transfer'){if(!actor.scopes?.includes('payments:execute'))throw fail('forbidden','The connection lacks payments:execute.',403);paymentRules=await policy(c,actor);checkPayment(input,paymentRules,await reserved(c,actor,row.id),clock());}
   if(operation==='send_email'){const count=(await c.query(`select count(*)::int n from sssbrain.ops_actions where actor=$1 and app_slug=$2 and action='mcp_send_email' and result->>'stage' in ('executing','unknown','accepted') and executed_at>now()-interval '1 hour'`,[actor.id,ACTION_APP])).rows[0];if(count?.n>=5)throw fail('rate_limited','MCP outbound email limit is five accepted or uncertain attempts per hour.',429);}
   const result={...row.result,stage:'executing',claimed_at:new Date(clock()).toISOString(),execution_started:true};
   await c.query(`update sssbrain.ops_actions set result=$3,receipt=$3,executed_at=now() where id=$1 and actor=$2`,[row.id,actor.id,result]);await audit(c,'mcp_action_claimed',row.id,{actor_id:actor.id,digest});return {row:{...row,result},paymentRules};
  });
  if(claim.replay)return {...claim.replay,replayed:true};
  const row=claim.row,{operation,input,context}=row.request.snapshot;let result,status='executed';
  try{
   // Registry state and current caller role were checked at MCP admission; check the kill switch again after claim.
   await guard(actor,'actions:execute');
   if(operation==='delete_draft'){
    result=await transaction(actor,async c=>{const d=(await c.query(`select id,title,body_markdown,updated_at,lifecycle_status from sssbrain.brain_wiki_pages where id=$1 and user_id=$2 for update`,[input.draft_id,actor.id])).rows[0];if(!d||actionDigest(d)!==input.expected_digest)throw fail('stale_draft','Draft changed after approval.');await c.query(`update sssbrain.brain_wiki_pages set lifecycle_status='archived',updated_at=now() where id=$1 and user_id=$2`,[input.draft_id,actor.id]);return {stage:'archived',draft_id:d.id,verification:'Owned wiki draft archived; content retained for recovery.',previous_lifecycle:d.lifecycle_status};});
   }else result=await providers.execute(operation,input,{id:row.id,context,paymentRules:claim.paymentRules});
  }catch(e){status='failed';result={stage:e.code==='provider_outcome_unknown'?'unknown':'failed',error:e.code||'execution_failed',note:e.code==='provider_outcome_unknown'?'Provider outcome is uncertain. Reconcile this action before preparing another attempt.':'Execution stopped. No automatic retry will run.'};}
  result={...result,claimed_at:row.result.claimed_at,approval_expires_at:row.result.approval_expires_at,execution_started:true};
  // If this final receipt write fails, the durable executing claim remains; retries cannot dispatch again.
  return transaction(actor,async c=>{const saved=(await c.query(`update sssbrain.ops_actions set status=$3,result=$4,receipt=$4 where id=$1 and actor=$2 returning *`,[row.id,actor.id,status,result])).rows[0];await audit(c,'mcp_action_result',row.id,{actor_id:actor.id,stage:result.stage,provider_id:result.provider_id||null});return present(saved);});
 }
 async function repositoryStatus(actor,input){await guard(actor,'ecosystem:read');return providers.repositoryStatus(input);}
 async function paymentAccount(actor){if(actor.channel!=='owner_session')throw fail('owner_session_required','Owner sign-in required.',403);await guard(actor,'ecosystem:read');return providers.paymentAccount();}
 async function ownerDisablePayments(actor,{confirm,confirmation}){if(actor.channel!=='owner_session'||confirm!==true||confirmation!=='DISABLE PAYMENTS')throw fail('confirmation_required','Owner confirmation is required to disable payments.');await guard(actor,'ecosystem:read');const current=await transaction(actor,c=>policy(c,actor));if(!current)return {disabled:true};return ownerRules(actor,{confirm:true,confirmation:'SAVE PAYMENT RULES',rules:{...current,enabled:false,expires_at:new Date(clock()+86400000).toISOString()}});}
 return {isOwner,capabilities,prepare,get,list,readDraft,readCode,repositoryStatus,paymentAccount,ownerRules,ownerDisablePayments,ownerDecision,execute};
}
