import test from 'node:test';
import assert from 'node:assert/strict';
import {knowledgeQuery,formatEvidence,validateCitations,makeKnowledge} from './knowledge.mjs';
const actor={id:'11111111-1111-4111-8111-111111111111',scopes:['ecosystem:read']};
function fixture({rows=[{doc_path:'learning-approved/upload.md',doc_title:'Upload limit',excerpt:'HTTP 413 was fixed by a bounded upload limit.',evidence_state:'approved_reference',visibility:'shared_reference'}],answerer=async()=> 'The proxy upload limit caused HTTP 413. [S1]',fail=false,referenceContext,readReference}={}){const calls=[];let inference=0,released=false;const c={async query(sql,args){calls.push({sql,args});if(fail&&sql.includes('WITH wanted'))throw Error('db');return {rows:sql.includes('WITH wanted')?(typeof rows==='function'?rows(args[1],args):rows):[]};},release(){released=true;}};const pool={async connect(){return c;}};const guard=async a=>{if(!a?.scopes?.includes('ecosystem:read'))throw Error('forbidden');};return {service:makeKnowledge({pool,guard,referenceContext,readReference,answerer:async x=>{inference++;return answerer(x);}}),calls,inference:()=>inference,released:()=>released};}
test('query bounds, stop words and credentials are handled before inference',()=>{assert.equal(knowledgeQuery('What caused the Brainiak upload HTTP 413?'),'caused OR brainiak OR upload OR http OR 413');assert.throws(()=>knowledgeQuery('x'));assert.throws(()=>knowledgeQuery('a'.repeat(2001)));assert.throws(()=>knowledgeQuery('api_key=private-value'));});
test('source budgets keep citation labels contiguous',()=>{const s=formatEvidence(Array.from({length:20},(_,i)=>({doc_title:String(i),excerpt:'a'.repeat(3000)})));assert(s.reduce((n,x)=>n+x.excerpt.length,0)<=6000);assert(s.every((x,i)=>x.label==='S'+(i+1)));assert(validateCitations('Answer [S1]',s));assert(!validateCitations('Answer [S99]',s));assert(!validateCitations('Uncited assertion',s));});
test('read-only transaction sets actor on the same connection and parameterizes owner',async()=>{const f=fixture();await f.service.search(actor,{query:'upload'});assert(f.calls.some(x=>x.sql==='begin read only'));assert(f.calls.some(x=>x.sql.includes('set_config')&&x.args[0]===actor.id));const q=f.calls.find(x=>x.sql.includes('WITH wanted'));assert(q.sql.includes('user_id=$2::uuid'));assert.equal(q.args[1],actor.id);assert(f.calls.some(x=>x.sql==='commit'));assert(f.released());});
test('database errors roll back and release owner context',async()=>{const f=fixture({fail:true});await assert.rejects(f.service.search(actor,{query:'upload'}));assert(f.calls.some(x=>x.sql==='rollback'));assert(f.released());});
test('read permission is mandatory even for extract-only requests',async()=>{const f=fixture();await assert.rejects(f.service.ask({id:actor.id,scopes:['merch:read']},{question:'upload',generate:false}),/forbidden/);assert.equal(f.inference(),0);});
test('no accessible evidence means no model call',async()=>{const f=fixture({rows:[]});const a=await f.service.ask(actor,{question:'upload'});assert.equal(a.status,'insufficient_evidence');assert.equal(f.inference(),0);});
test('extract-only mode is explicit and never trains or invokes model',async()=>{const f=fixture();const a=await f.service.ask(actor,{question:'upload',generate:false});assert.equal(a.status,'retrieval_only');assert.equal(f.inference(),0);assert.equal(a.training_used,false);assert.equal(a.paid_fallback,false);});
test('invalid citations fall back to the exact accessible extracts',async()=>{const f=fixture({answerer:async()=> 'A fabricated answer [S99]'});const a=await f.service.ask(actor,{question:'upload'});assert.equal(a.generated,false);assert.equal(a.reason,'citation_validation_failed');assert(a.answer.includes('bounded upload limit'));});
test('local failure falls back without a paid provider',async()=>{const f=fixture({answerer:async()=>{throw Error('offline');}});const a=await f.service.ask(actor,{question:'upload'});assert.equal(a.reason,'local_model_unavailable');assert.equal(a.paid_fallback,false);});
test('valid source labels permit bounded local synthesis',async()=>{const f=fixture();const a=await f.service.ask(actor,{question:'upload'});assert.equal(a.generated,true);assert.equal(a.status,'answered');assert.equal(a.execution_authorized,false);});

const currentSha='a'.repeat(64),currentTime='2026-11-07T12:00:00.000Z';
function currentDocument(doc_path,content,doc_sha=currentSha){return {doc_path,content,doc_sha,updated_at:currentTime,source:'live_file'};}
function merchantContext(account='acct_current'){
 return {version:1,status:'ready_live_reference',documents:[{doc_path:'STANDING_RULES.md',doc_sha:currentSha,updated_at:currentTime,index_status:'stale'}],
  stripe_default:{status:'resolved',name:'Current Merchant',account_id:account,source_doc_path:'STANDING_RULES.md',reference_excerpt:`The default Stripe merchant is Current Merchant, account ${account}. Existing prices and separate payment approvals still apply.`}};
}
function indexedReference(doc_path,excerpt='The old Stripe merchant was acct_old'){
 return {doc_path,doc_title:'Site Bible',heading:'Payment setup',excerpt,doc_sha:'b'.repeat(64),updated_at:'2026-11-01T00:00:00.000Z',evidence_state:'approved_reference',visibility:'shared_reference'};
}

test('stale indexed merchant content is replaced with a current matched excerpt and current SHA',async()=>{
 const docPath='site-bibles/SWADEBASE_Master_Site_Bible.md';
 const content='# Current Bible\n'+('Unrelated introduction and operating notes.\n'.repeat(180))+'\n## Current Stripe merchant\nThe default Stripe merchant is Current Merchant, account acct_current.\n'+('Additional context.\n'.repeat(130));
 let reads=0;
 const f=fixture({rows:[indexedReference(docPath)],readReference:async p=>{reads++;assert.equal(p,docPath);assert(f.released());return currentDocument(p,content);}});
 const result=await f.service.search(actor,{query:'Stripe merchant'});
 assert.equal(reads,1);assert.equal(result.items.length,1);
 assert.match(result.items[0].excerpt,/acct_current/);assert.doesNotMatch(result.items[0].excerpt,/acct_old/);
 assert(result.items[0].excerpt.length<=2000);assert.equal(result.items[0].doc_sha,currentSha);
 assert.equal(result.items[0].updated_at,currentTime);assert.equal(result.items[0].source,'live_file');
 assert.equal(result.items[0].index_status,'stale');assert.equal(f.inference(),0);
});

test('unsafe, missing and no-longer-matching shared references are withheld while private and approved lessons survive',async()=>{
 const privateItem={doc_path:'private-knowledge/owned',doc_title:'Owned note',excerpt:'My merchant question',doc_sha:'private-sha',visibility:'private',evidence_state:'source_record'};
 const lesson={doc_path:'learning-approved/payments.md',doc_title:'Approved lesson',excerpt:'Payment merchant setup',visibility:'shared_reference',evidence_state:'approved_reference'};
 const reads=[];
 const f=fixture({rows:[indexedReference('site-bibles/../../secrets.md'),indexedReference('site-bibles/Missing.md'),indexedReference('site-bibles/Changed.md'),privateItem,lesson],readReference:async p=>{
  reads.push(p);if(p.endsWith('Missing.md'))throw Error('missing');return currentDocument(p,'Only unrelated audio production guidance remains.');
 }});
 const result=await f.service.search(actor,{query:'merchant',limit:10});
 assert.deepEqual(result.items,[privateItem,lesson]);
 assert.deepEqual(reads.sort(),['site-bibles/Changed.md','site-bibles/Missing.md']);
 assert.equal(f.inference(),0);
});

test('current reference matching uses terms rather than unrelated substrings',async()=>{
 const f=fixture({rows:[indexedReference('site-bibles/Example.md')],readReference:async p=>currentDocument(p,'The word merchantability concerns another topic. Some unstripeable pattern is also unrelated.')});
 assert.deepEqual((await f.service.search(actor,{query:'merchant stripe'})).items,[]);
});

test('current references are read once per document within a query and are refreshed again on the next query',async()=>{
 const docPath='site-bibles/Example.md';let reads=0;let account='acct_first';
 const f=fixture({rows:[indexedReference(docPath),indexedReference(docPath)],readReference:async p=>{reads++;return currentDocument(p,`Stripe merchant ${account}`,account==='acct_first'?currentSha:'c'.repeat(64));}});
 const first=await f.service.search(actor,{query:'Stripe'});assert.equal(reads,1);assert(first.items.every(item=>item.excerpt.includes('acct_first')));
 account='acct_second';const second=await f.service.search(actor,{query:'Stripe'});
 assert.equal(reads,2);assert(second.items.every(item=>item.excerpt.includes('acct_second')&&item.doc_sha==='c'.repeat(64)));
});

test('filtered public search retains raw pagination and never prepends the default to later pages',async()=>{
 const raw=[indexedReference('site-bibles/Removed.md'),
  {doc_path:'private-knowledge/one',doc_title:'One',excerpt:'Merchant note one',visibility:'private'},
  {doc_path:'private-knowledge/two',doc_title:'Two',excerpt:'Merchant note two',visibility:'private'}];
 let contexts=0;
 const f=fixture({rows:(_id,args)=>raw.slice(args[3],args[3]+args[2]),referenceContext:()=>{contexts++;return merchantContext();},readReference:async p=>currentDocument(p,'Only unrelated material remains.')});
 const first=await f.service.search(actor,{query:'merchant',limit:1,offset:0});assert.deepEqual(first.items,[]);assert.equal(first.next_offset,1);
 const second=await f.service.search(actor,{query:'merchant',limit:1,offset:first.next_offset});assert.deepEqual(second.items,[raw[1]]);assert.equal(second.next_offset,2);
 const third=await f.service.search(actor,{query:'merchant',limit:1,offset:second.next_offset});assert.deepEqual(third.items,[raw[2]]);assert.equal(third.next_offset,null);
 assert.equal(contexts,0);assert.equal(f.inference(),0);
 assert.deepEqual(f.calls.filter(call=>call.sql.includes('WITH wanted')).map(call=>call.args.slice(2)),[[2,0],[2,1],[2,2]]);
});

test('current Stripe default is labeled evidence before the answerer runs, even without an indexed rules hit',async()=>{
 const context=merchantContext();let observed=false;
 const f=fixture({rows:[],referenceContext:a=>{assert.equal(a.id,actor.id);return context;},answerer:async input=>{
  observed=true;assert.equal(input.entry_context,context);assert.equal(input.sources[0].label,'S1');
  assert.equal(input.sources[0].doc_path,'STANDING_RULES.md');assert.equal(input.sources[0].doc_sha,currentSha);
  assert.match(input.sources[0].excerpt,/acct_current/);return 'Current Merchant uses acct_current. [S1]';
 }});
 const answer=await f.service.ask(actor,{question:'Which Stripe merchant handles our payment?'});
 assert(observed);assert.equal(answer.generated,true);assert.equal(answer.paid_fallback,false);
 assert.match(answer.answer,/acct_current/);assert.equal(f.inference(),1);
});

test('answer retrieval replaces duplicated rules hits while retaining private evidence and approved lessons',async()=>{
 const privateItem={doc_path:'private-wiki/owned',doc_title:'Private billing note',excerpt:'Owner-specific billing preference.',visibility:'private'};
 const lesson={doc_path:'learning-approved/billing.md',doc_title:'Billing lesson',excerpt:'Approved payment lesson.',visibility:'shared_reference'};
 const f=fixture({rows:[indexedReference('STANDING_RULES.md'),indexedReference('STANDING_RULES.md'),privateItem,lesson],referenceContext:()=>merchantContext(),readReference:async p=>currentDocument(p,'Stripe merchant acct_current')});
 const result=await f.service.searchForAnswers(actor,{query:'Stripe payment',limit:4});
 assert.equal(result.items.filter(item=>item.doc_path==='STANDING_RULES.md').length,1);
 assert.equal(result.items[0].doc_path,'STANDING_RULES.md');assert(result.items.includes(privateItem));assert(result.items.includes(lesson));
 assert.equal(f.inference(),0);
});

test('default evidence is restricted to relevant billing queries and stays bounded',async()=>{
 const f=fixture({rows:[],referenceContext:()=>merchantContext()});
 for(const query of ['Stripe','billing','merchant','payment','$1','one dollar test'])assert.equal((await f.service.searchForAnswers(actor,{query})).items.length,1,query);
 for(const query of ['music arrangement','camera movement','$10'])assert.equal((await f.service.searchForAnswers(actor,{query})).items.length,0,query);
 const crowded=fixture({rows:Array.from({length:20},(_,i)=>({doc_path:`private-knowledge/${i}`,doc_title:`Note ${i}`,excerpt:'payment note',visibility:'private'})),referenceContext:()=>merchantContext()});
 const result=await crowded.service.searchForAnswers(actor,{query:'payment',limit:100});
 assert.equal(result.items.length,11);assert.equal(result.items[0].doc_path,'STANDING_RULES.md');
 assert.equal(crowded.inference(),0);
});

test('unresolved or unsupported default metadata cannot become labeled evidence',async()=>{
 for(const change of [
  c=>{c.stripe_default.status='unresolved';},
  c=>{c.documents=[];},
  c=>{c.stripe_default.reference_excerpt='No supporting account is included here.';},
  c=>{c.stripe_default.source_doc_path='private-wiki/other';},
 ]){
  const context=merchantContext();change(context);const f=fixture({rows:[],referenceContext:()=>context});
  assert.equal((await f.service.searchForAnswers(actor,{query:'Stripe merchant'})).items.length,0);
 }
});

test('answer context remains actor-specific and permission denial occurs before any context or reference read',async()=>{
 const other={id:'22222222-2222-4222-8222-222222222222',scopes:['ecosystem:read']};
 const visited=[];
 const f=fixture({rows:id=>[{doc_path:`private-knowledge/${id}`,doc_title:'Owned billing note',excerpt:`Private evidence for ${id}`,visibility:'private'}],referenceContext:a=>{visited.push(a.id);return merchantContext(a.id===actor.id?'acct_owner_a':'acct_owner_b');}});
 const [a,b]=await Promise.all([f.service.searchForAnswers(actor,{query:'Stripe'}),f.service.searchForAnswers(other,{query:'Stripe'})]);
 assert.match(a.items[0].excerpt,/acct_owner_a/);assert.doesNotMatch(JSON.stringify(a),/acct_owner_b|22222222/);
 assert.match(b.items[0].excerpt,/acct_owner_b/);assert.doesNotMatch(JSON.stringify(b),/acct_owner_a|11111111/);
 assert.deepEqual(visited.sort(),[actor.id,other.id]);
 let refs=0,contexts=0;
 const denied=fixture({referenceContext:()=>{contexts++;return merchantContext();},readReference:()=>{refs++;throw Error('should not read');}});
 await assert.rejects(denied.service.searchForAnswers({id:other.id,scopes:['merch:read']},{query:'Stripe'}),/forbidden/);
 assert.equal(refs,0);assert.equal(contexts,0);assert.equal(denied.calls.length,0);
});

test('fresh default evidence survives local generation failure without a paid fallback',async()=>{
 const f=fixture({rows:[],referenceContext:()=>merchantContext(),answerer:async()=>{throw Error('local engine unavailable');}});
 const answer=await f.service.ask(actor,{question:'Stripe merchant'});
 assert.equal(answer.generated,false);assert.equal(answer.reason,'local_model_unavailable');assert.equal(answer.paid_fallback,false);
 assert.match(answer.answer,/acct_current/);assert.equal(answer.sources[0].label,'S1');assert.equal(f.inference(),1);
});

test('an unavailable current reference never falls back to the old indexed excerpt or invokes inference',async()=>{
 const f=fixture({rows:[indexedReference('STANDING_RULES.md')],readReference:async()=>{throw Error('unsafe current reference');}});
 const answer=await f.service.ask(actor,{question:'Stripe merchant'});
 assert.equal(answer.status,'insufficient_evidence');assert.equal(answer.generated,false);assert.equal(f.inference(),0);
 assert.doesNotMatch(JSON.stringify(answer),/acct_old/);
});
