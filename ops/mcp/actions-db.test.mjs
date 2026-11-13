import test from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
import {makeActions} from './actions.mjs';import {actionDigest} from './action-policy.mjs';
const enabled=Boolean(process.env.MCP_ACTIONS_TEST_DB);
test('approved actions: real PostgreSQL RLS, caps, claims and recovery',{skip:!enabled},async t=>{
 if(!/^swade_mcp_actions_fixture_[0-9]+$/.test(process.env.MCP_ACTIONS_TEST_DB))throw Error('Refusing a non-fixture database.');
 const require=createRequire('/opt/swadebase-adapters/package.json'),{Pool}=require('pg');
 const pool=new Pool({database:process.env.MCP_ACTIONS_TEST_DB,max:6});
 const actor={id:'11111111-1111-4111-8111-111111111111',scopes:['ecosystem:read','actions:prepare','actions:execute','payments:execute']},other={...actor,id:'22222222-2222-4222-8222-222222222222'},owner={...actor,channel:'owner_session'};
 let sends=0,paused=false,unknown=false,failReceipt=false;
 const providers={context:async operation=>({fixture:operation,...(operation==='publish_release'?{visibility:'public'}:{})}),ready:()=>{},capabilities:()=>[],verifyPaymentRules:async()=>{},execute:async()=>{sends++;await new Promise(r=>setTimeout(r,15));if(unknown)throw Object.assign(Error('uncertain'),{code:'provider_outcome_unknown'});return {stage:'accepted',provider_id:'fixture'};}};
 const guard=async(a,scope)=>{if(!a.scopes.includes(scope)||paused)throw Object.assign(Error('forbidden'),{code:'forbidden'});};
 const wrapped={query:(...args)=>pool.query(...args),connect:async()=>{const c=await pool.connect();return {release:()=>c.release(),query:async(sql,args)=>{if(failReceipt&&sql.includes('set status=$3,result=$4')){failReceipt=false;throw Error('fixture receipt outage');}return c.query(sql,args);}};}};
 const actions=makeActions({pool:wrapped,guard,providers});
 let n=0;const key=()=>`33333333-3333-4333-8333-${String(++n).padStart(12,'0')}`;
 const email=()=>actions.prepare(actor,{operation:'send_email',input:{to:'owner@example.test',subject:'Fixture',text:'Exact approved fixture body'},idempotency_key:key()});
 const approve=a=>actions.ownerDecision(owner,{action_id:a.action_id,digest:a.digest,decision:'approve',confirm:true});
 const execute=a=>actions.execute(actor,{action_id:a.action_id,digest:a.digest});
 try{
  await t.test('MCP actor cannot approve or change payment rules',async()=>{
   const a=await email();await assert.rejects(actions.ownerDecision(actor,{action_id:a.action_id,digest:a.digest,decision:'approve',confirm:true}),/owner console/);
   await assert.rejects(actions.ownerRules(actor,{rules:{},confirm:true,confirmation:'SAVE PAYMENT RULES'}),/owner console/);
   await assert.rejects(execute(a),/Approve this exact action/);assert.equal(sends,0);
  });
  await t.test('idempotency is content-bound; another actor cannot read an action',async()=>{
   const idempotency_key=key(),input={to:'owner@example.test',subject:'Same',text:'Same body'};const a=await actions.prepare(actor,{operation:'send_email',input,idempotency_key}),b=await actions.prepare(actor,{operation:'send_email',input,idempotency_key});assert.equal(a.action_id,b.action_id);
   await assert.rejects(actions.prepare(actor,{operation:'send_email',input:{...input,text:'changed'},idempotency_key}),/different action/);
   await assert.rejects(actions.get(other,{action_id:a.action_id}),/owner/);await assert.rejects(actions.list(other),/owner/);
  });
  await t.test('simultaneous calls dispatch an approved action exactly once',async()=>{
   const a=await email();await approve(a);const before=sends;const out=await Promise.all([execute(a),execute(a),execute(a)]);assert.equal(sends-before,1);assert(out.some(r=>r.replayed));assert.equal((await actions.get(actor,{action_id:a.action_id})).receipt.stage,'accepted');
  });
  await t.test('receipt failure leaves a durable non-retryable claim',async()=>{
   const a=await email();await approve(a);failReceipt=true;const before=sends;await assert.rejects(execute(a),/receipt outage/);const replay=await execute(a);assert.equal(replay.replayed,true);assert.equal(replay.status,'executing');assert.equal(sends-before,1);
  });
  await t.test('uncertain external outcomes never dispatch again',async()=>{
   const a=await email();await approve(a);unknown=true;const before=sends;const r=await execute(a);unknown=false;assert.equal(r.receipt.stage,'unknown');assert.equal((await execute(a)).replayed,true);assert.equal(sends-before,1);
  });
  await t.test('registry pause prevents execution after approval',async()=>{
   const a=await email();await approve(a);paused=true;const before=sends;await assert.rejects(execute(a),/forbidden/);paused=false;assert.equal(sends,before);
  });
  await t.test('deletion is owner-bound and archives content without erasing it',async()=>{
   const draft_id='44444444-4444-4444-8444-444444444444',preview=await actions.readDraft(actor,{draft_id});
   await assert.rejects(actions.readDraft(other,{draft_id}),/owner/);
   const idempotency_key=key(),args={operation:'delete_draft',input:{draft_id,expected_digest:preview.digest},idempotency_key};
   const a=await actions.prepare(actor,args);assert.equal((await actions.prepare(actor,args)).action_id,a.action_id);await approve(a);const r=await execute(a);assert.equal(r.receipt.stage,'archived');
   const after=await actions.readDraft(actor,{draft_id});assert.equal(after.lifecycle_status,'archived');assert.notEqual(after.digest,preview.digest);
  });
  await t.test('payment rules reserve the daily cap under concurrent approvals',async()=>{
   const p={enabled:true,currency:'usd',max_payment_minor:100,daily_cap_minor:150,source_account:'acct_source1234',mode:'test',payees:[{account:'acct_payee1234',name:'Fixture payee'}],expires_at:new Date(Date.now()+3600000).toISOString()};
   await actions.ownerRules(owner,{rules:p,confirm:true,confirmation:'SAVE PAYMENT RULES'});
   const input={destination:'acct_payee1234',amount_minor:100,currency:'usd',purpose:'Fixture approved test',reference:'invoice-a',rules_digest:actionDigest(p)};
   const a=await actions.prepare(actor,{operation:'payment_transfer',input,idempotency_key:key()}),b=await actions.prepare(actor,{operation:'payment_transfer',input:{...input,reference:'invoice-b'},idempotency_key:key()});
   await assert.rejects(actions.prepare(actor,{operation:'payment_transfer',input,idempotency_key:key()}),/already has/);
   const decision=x=>actions.ownerDecision(owner,{action_id:x.action_id,digest:x.digest,decision:'approve',confirm:true,payment_confirmation:'PAY 100 USD TO acct_payee1234'});
   const results=await Promise.allSettled([decision(a),decision(b)]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.filter(r=>r.status==='rejected').length,1);
   const approved=results[0].status==='fulfilled'?a:b;await assert.rejects(actions.execute({...actor,scopes:['ecosystem:read','actions:prepare','actions:execute']},{action_id:approved.action_id,digest:approved.digest}),/payments:execute/);
   await actions.ownerRules(owner,{rules:{...p,enabled:false},confirm:true,confirmation:'SAVE PAYMENT RULES'});await assert.rejects(execute(approved),/rules/);
  });
  await t.test('the owner can revoke an approved action before dispatch',async()=>{
   const a=await email();await approve(a);await actions.ownerDecision(owner,{action_id:a.action_id,digest:a.digest,decision:'reject',confirm:true});const before=sends;await assert.rejects(execute(a),/Approve this exact action/);assert.equal(sends,before);
  });
  await t.test('public publication requires a separate exact owner confirmation',async()=>{
   const a=await actions.prepare(actor,{operation:'publish_release',input:{repository:'fixture',commit:'a'.repeat(40),tag:'v1',title:'Fixture release',notes:'Exact approved public notes'},idempotency_key:key()});
   await assert.rejects(approve(a),/public repository/);await actions.ownerDecision(owner,{action_id:a.action_id,digest:a.digest,decision:'approve',confirm:true,public_confirmation:'PUBLISH TO PUBLIC REPOSITORY'});await actions.ownerDecision(owner,{action_id:a.action_id,digest:a.digest,decision:'reject',confirm:true});
  });
  await t.test('unbound SQL sessions cannot read actor rows after pool reuse',async()=>{const r=await pool.query('select count(*)::int n from sssbrain.ops_actions');assert.equal(r.rows[0].n,0);});
 }finally{await pool.end();}
});
