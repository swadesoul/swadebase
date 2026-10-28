import test from 'node:test';import assert from 'node:assert/strict';
import {scopeList,redirectUri,pkce,opaque,sha,requireScope,routePrograms} from './core.mjs';
import {makeService} from './service.mjs';
const actor={id:'11111111-1111-4111-8111-111111111111',scopes:['ecosystem:read','operator:plan','tasks:write']};
test('PKCE, token hashing, redirects and scope dependencies',()=>{
 const v=opaque();assert.equal(v.length,43);assert.equal(pkce(v).length,43);assert.equal(sha(v).length,64);
 assert.equal(redirectUri('https://example.com/callback'),'https://example.com/callback');
 for(const u of ['javascript:alert(1)','https://user:pass@example.com/callback','https://example.com/callback#token','http://example.com/callback'])assert.throws(()=>redirectUri(u));
 assert.throws(()=>scopeList('tasks:write'));assert.throws(()=>scopeList('operator:plan'));assert.throws(()=>scopeList('admin:*'));
 assert.deepEqual(scopeList('ecosystem:read operator:plan tasks:write'),actor.scopes);
 assert.throws(()=>requireScope({scopes:['ecosystem:read']},'tasks:write'));
});
test('routing selects known existing programs for multi-program outcomes',()=>{
 const ids=routePrograms('Prepare a school basketball entrance song and promotional video').map(x=>x.id);
 assert(ids.includes('theleaguesound'));assert(ids.includes('resinglab'));assert(ids.includes('videosaywhat'));
 assert.deepEqual(routePrograms('Hello there').map(x=>x.id),['sssbrain']);
});
function fixture({enabled=true,missing=false,classifier}={}){
 let writes=0;const tasks=[];
 const pool={async query(sql,args){
  if(sql.includes("where id='swadebase-mcp'"))return {rows:[{enabled,status:'live'}]};
  if(sql.includes('from sssbrain.swadebase_docs'))return {rows:missing||args[1]!=='swadebase'?[]:[{doc_path:'site-bibles/SWADEBASE_Master_Site_Bible.md',doc_sha:'fixture-sha',title:'SWADEBASE'}]};
  if(sql.includes('select heading,content'))return {rows:[{heading:'Memory',content:'Read Bible, reuse existing services and protect access.'}]};
  if(sql.includes('select id,display_name'))return {rows:[{id:'swade-music-gpu-adapter',status:'inactive',enabled:true}]};
  if(sql.startsWith('select')&&sql.includes('source=\'swadebase-mcp\'')&&sql.includes("meta->>'idempotency_key'"))return {rows:tasks.filter(x=>x.actor===args[0]&&x.key===args[1])};
  if(sql.startsWith('insert into')){writes++;const row={id:'1',status:'open',body:args[1],actor:args[2].actor_id,key:args[2].idempotency_key,plan:args[2].plan};tasks.push(row);return {rows:[row]};}
  if(sql.includes('where id=$1'))return {rows:tasks.filter(x=>x.id===args[0]&&x.actor===args[1])};
  return {rows:[]};
 }};return {service:makeService({pool,classifier}),writes:()=>writes};
}
test('Bible-first planning reports missing project knowledge and inactive production',async()=>{
 const {service}=fixture();const p=await service.plan(actor,{request:'Create a team song'});assert.equal(p.status,'prepared');assert.equal(p.execution_authorized,false);assert.equal(p.knowledge_version,'fixture-sha');assert(p.steps.some(x=>x.bible_state==='missing_bible'));assert(p.steps.flatMap(x=>x.adapters).some(x=>x.state==='inactive'));
});
test('missing main Bible blocks planning; disabled MCP blocks reads',async()=>{
 assert.equal((await fixture({missing:true}).service.plan(actor,{request:'Create a song'})).status,'blocked');
 await assert.rejects(fixture({enabled:false}).service.bible(actor,{}),/paused/);
});
test('invalid local model output cannot introduce unknown programs',async()=>{
 const {service}=fixture({classifier:async()=>({programs:['invented-program']})});const p=await service.plan(actor,{request:'Create a song'});assert.equal(p.method,'rules');assert(!p.steps.some(x=>x.program==='invented-program'));
});
test('tasks reuse existing queue, are idempotent, isolated and do not start production',async()=>{
 const f=fixture();const input={request:'Prepare a team song',idempotency_key:'fixture-key'};const a=await f.service.createTask(actor,input),b=await f.service.createTask(actor,input);assert.equal(a.task.id,b.task.id);assert.equal(f.writes(),1);assert.equal(a.execution_started,false);assert.equal(a.status,'awaiting_approval');
 await assert.rejects(f.service.createTask(actor,{...input,request:'Different request'}),/different request/);
 await assert.rejects(f.service.getTask({...actor,id:'22222222-2222-4222-8222-222222222222'},{task_id:a.task.id}),/not found/);
});

test('native chat rules-only routing never invokes the local model',async()=>{let calls=0;const {service}=fixture({classifier:async()=>{calls++;throw Error('unexpected')}});const p=await service.plan(actor,{request:'Create a school anthem',rules_only:true});assert.equal(calls,0);assert.equal(p.method,'rules');});

test('merch-only scopes are narrow and require report/read dependency',()=>{assert.deepEqual(scopeList('merch:read merch:report'),['merch:read','merch:report']);assert.throws(()=>scopeList('merch:report'));assert.throws(()=>requireScope({scopes:['merch:read','merch:report']},'ecosystem:read'));assert.throws(()=>requireScope({scopes:['merch:read','merch:report']},'tasks:write'));});

