import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {opaque,sha} from './core.mjs';
const sql=s=>execFileSync('docker',['exec','-i','supabase-db','psql','-U','postgres','-X','-v','ON_ERROR_STOP=1','-At'],{input:s,encoding:'utf8'}).trim();
const str=s=>"'"+String(s).replaceAll("'","''")+"'";
const actor=sql("select id from auth.users where email='swadesoul@gmail.com' and swadebase_ops.is_super_admin(id)");assert.match(actor,/^[a-f0-9-]{36}$/);
const session=opaque(),csrf=opaque(),base='https://swadebase.cloud';
async function request(path,body,headers={}){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{...(body?{'content-type':'application/json'}:{}),...headers},body:body?JSON.stringify(body):undefined,redirect:'manual',signal:AbortSignal.timeout(80000)});const j=await r.json().catch(()=>({}));return {status:r.status,j};}
try{
 sql(`insert into swadebase_ops.admin_sessions(id_hash,user_id,email,csrf,expires_at,absolute_expires_at) values(${str(sha(session))},${str(actor)},'swadesoul@gmail.com',${str(csrf)},now()+interval '5 minutes',now()+interval '5 minutes');`);
 const headers={cookie:`swb_admin=${session}`,origin:base,'x-csrf-token':csrf};
 assert.equal((await request('/adapters/mcp/knowledge',{question:'upload HTTP 413',generate:false})).status,401);
 assert.equal((await request('/adapters/mcp/knowledge',{question:'upload HTTP 413',generate:false},{...headers,origin:'https://example.com'})).status,403);
 assert.equal((await request('/adapters/mcp/knowledge',{question:'upload HTTP 413',generate:false},{...headers,'x-csrf-token':'wrong'})).status,401);
 const extracts=await request('/adapters/mcp/knowledge',{question:'Brainiak upload HTTP 413',generate:false},headers);assert.equal(extracts.status,200,JSON.stringify(extracts.j));assert(extracts.j.data.sources.length>0);assert(extracts.j.data.answer.includes('413'));assert.equal(extracts.j.data.training_used,false);
 const empty=await request('/adapters/mcp/knowledge',{question:'zzqvnonexistentnebula948',generate:false},headers);assert.equal(empty.j.data.status,'insufficient_evidence');
 const privateRead=await request('/adapters/mcp/knowledge',{question:'Swarvis companion persona',generate:false},headers);assert.equal(privateRead.status,200);assert(privateRead.j.data.sources.some(s=>s.visibility==='private'));
 const secret=await request('/adapters/mcp/knowledge',{question:'api_key=synthetic-not-a-real-key',generate:false},headers);assert.equal(secret.status,400);
 const model=await request('/adapters/mcp/knowledge',{question:'What caused the Brainiak voice upload HTTP 413, and what fixed it?'},headers);assert.equal(model.status,200);assert(['answered','retrieval_only'].includes(model.j.data.status));assert(model.j.data.sources.length);assert.equal(model.j.data.paid_fallback,false);
 console.log(JSON.stringify({https_auth:'unauthenticated, bad origin and bad CSRF denied',retrieval:'approved lesson and private owner sources passed',unknown:'no evidence explicitly reported',secret_input:'rejected',model_status:model.j.data.status,model_reason:model.j.data.reason||null,answer:model.j.data.answer.slice(0,1400),sources:model.j.data.sources.map(s=>({label:s.label,path:s.doc_path})),training_used:false,paid_calls:0}));
}finally{sql(`delete from swadebase_ops.admin_sessions where id_hash=${str(sha(session))};`);}

