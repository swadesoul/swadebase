import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import mcpRoutes from './route.mjs';
async function fixture(run,{paused=false,entryFails=false}={}) {
 const reads=[];let entryChecks=0;
 const entryContext={check:async()=>{entryChecks++;if(entryFails)throw Object.assign(Error('Site Bible unavailable.'),{code:'bible_unavailable',status:503});return {status:'ready',automation:{status:'healthy'},stripe_default:{account_id:'acct_fixture'}};}};
 const client={async query(sql,args){reads.push({sql,args});return {rows: sql.includes('WITH wanted')?[{doc_path:'private-knowledge/fixture',doc_title:'Private fixture',excerpt:'Actor-scoped knowledge',evidence_state:'source_record',visibility:'private'}]:[]};},release(){}};
 const pool={connect:async()=>client,query:async(sql)=>{reads.push({sql});return {rows:sql.includes("where id='swadebase-mcp'")?[{enabled:!paused,status:'live'}]:[]};}};
 const handle=mcpRoutes({pool,entryContext,auth:{csrfOk:()=>false},admin:{
  verifyAccessToken:async raw=>raw==='valid.owner.jwt'?{id:'owner'}:raw==='valid.customer.jwt'?{id:'customer'}:null,
  isSuperAdmin:async id=>id==='owner'
 }});
 const app=http.createServer(async(req,res)=>{try{await handle(req,res,new URL(req.url,'https://swadebase.cloud'),null);}catch(e){res.writeHead(e.status||500,{'content-type':'application/json'});res.end(JSON.stringify({error:e.code||'failed'}));}});
 await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
 const post=(body={},headers={})=>fetch('http://127.0.0.1:'+app.address().port+'/adapters/operator/knowledge',{method:'POST',headers:{host:'swadebase.cloud','content-type':'application/json',...headers},body:JSON.stringify(body)});
 try{await run(post,reads,()=>entryChecks);}finally{await new Promise(resolve=>app.close(resolve));}
}
test('native knowledge denies missing, expired, customer, MCP tokens and hostile origins before reads',()=>fixture(async(post,reads,entryChecks)=>{
 for(const authorization of ['', 'Bearer expired.jwt.token','Bearer valid.customer.jwt','Bearer swmcp_untrusted'])assert.equal((await post({question:'Maestro'},{authorization})).status,403);
 assert.equal((await post({question:'Maestro'},{authorization:'Bearer valid.owner.jwt',origin:'https://attacker.test'})).status,403);
 assert.equal(reads.length,0);
 assert.equal(entryChecks(),0);
}));
test('owner reuses scoped read-only knowledge without a model or paid fallback',()=>fixture(async(post,reads)=>{
 const response=await post({question:'Maestro',generate:true,actor_id:'other'},{authorization:'Bearer valid.owner.jwt'});
 assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
 const data=(await response.json()).data;assert.equal(data.status,'retrieval_only');assert.equal(data.paid_fallback,false);
 assert.equal(data.entry_context.stripe_default.account_id,'acct_fixture');
 assert.equal(data.execution_authorized,false);assert.equal(data.sources[0].visibility,'private');
 const search=reads.find(r=>r.sql.includes('WITH wanted'));assert.equal(search.args[1],'owner');
 assert(reads.every(r=>!/insert|update|delete/i.test(r.sql.replaceAll('updated_at','time'))));
}));
test('kill switch and secret intake still apply',()=>fixture(async(post)=>{
 assert.equal((await post({question:'Maestro'},{authorization:'Bearer valid.owner.jwt'})).status,503);
},{paused:true}));
test('credentials in questions are rejected',()=>fixture(async(post)=>{
 assert.equal((await post({question:'api_key=synthetic-not-real'},{authorization:'Bearer valid.owner.jwt'})).status,400);
}));

test('native knowledge runs the Bible check before retrieval and fails without private reads',()=>fixture(async(post,reads,entryChecks)=>{
 const response=await post({question:'Which Stripe account?'},{authorization:'Bearer valid.owner.jwt'});
 assert.equal(response.status,503);assert(entryChecks()>0);assert(!reads.some(r=>r.sql.includes('WITH wanted')));
},{entryFails:true}));
