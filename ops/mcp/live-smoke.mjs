import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {Client,StreamableHTTPClientTransport} from '@modelcontextprotocol/client';
import {opaque,sha,pkce,RESOURCE,SCOPES} from './core.mjs';
const sql=s=>execFileSync('docker',['exec','-i','supabase-db','psql','-U','postgres','-v','ON_ERROR_STOP=1','-At'],{input:s,encoding:'utf8'}).trim();
const str=s=>"'"+String(s).replaceAll("'","''")+"'";
const actor=sql("select id from auth.users where email='swadesoul@gmail.com' and swadebase_ops.is_super_admin(id)");assert.match(actor,/^[a-f0-9-]{36}$/);
const session=opaque(),csrf=opaque(),verifier=opaque();let client,clientId,token,taskId;
const base='https://swadebase.cloud';
async function req(path,body,headers={},redirect='follow'){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{...(body?{'content-type':'application/json'}:{}),...headers},body:body?JSON.stringify(body):undefined,redirect});let j;try{j=await r.json();}catch{}return {r,j};}
try{
 sql(`insert into swadebase_ops.admin_sessions(id_hash,user_id,email,csrf,expires_at,absolute_expires_at) values(${str(sha(session))},${str(actor)},'swadesoul@gmail.com',${str(csrf)},now()+interval '5 minutes',now()+interval '5 minutes');`);
 const registration=await req('/adapters/mcp/oauth/register',{client_name:'Deployment smoke (temporary)',redirect_uris:['https://example.com/swade-smoke'],token_endpoint_auth_method:'none'});assert.equal(registration.r.status,201);clientId=registration.j.client_id;
 const params=new URLSearchParams({client_id:clientId,redirect_uri:'https://example.com/swade-smoke',response_type:'code',resource:RESOURCE,scope:SCOPES.join(' '),state:'deployment-smoke',code_challenge:pkce(verifier),code_challenge_method:'S256'});
 const auth=await req('/adapters/mcp/oauth/authorize?'+params,null,{},'manual');assert.equal(auth.r.status,303);const pending=auth.r.headers.get('set-cookie').match(/swade_mcp_pending=([^;]+)/)[1];
 const headers={cookie:`swb_admin=${session}; swade_mcp_pending=${pending}`,origin:base,'x-csrf-token':csrf};
 const forbidden=await req('/adapters/api/mcp-connect/consent',{request_id:pending,confirm:true},{...headers,'x-csrf-token':'bad'});assert.equal(forbidden.r.status,403);
 const consent=await req('/adapters/api/mcp-connect/consent',{request_id:pending,confirm:true},headers);assert.equal(consent.r.status,200);const target=new URL(consent.j.data.redirect);assert.equal(target.searchParams.get('state'),'deployment-smoke');
 const grant={grant_type:'authorization_code',resource:RESOURCE,client_id:clientId,redirect_uri:'https://example.com/swade-smoke',code:target.searchParams.get('code'),code_verifier:verifier};
 assert.equal((await req('/adapters/mcp/oauth/token',{...grant,code_verifier:opaque()})).r.status,400);
 const exchanged=await req('/adapters/mcp/oauth/token',grant);assert.equal(exchanged.r.status,200);token=exchanged.j.access_token;
 assert.equal((await req('/adapters/mcp/oauth/token',grant)).r.status,400);
 client=new Client({name:'deployment-smoke',version:'1.0.0'});await client.connect(new StreamableHTTPClientTransport(new URL(RESOURCE),{requestInit:{headers:{Authorization:'Bearer '+token}}}));
 assert.equal((await client.listTools()).tools.length,6);
 const bible=await client.callTool({name:'swade_get_site_bible',arguments:{program:'swadebase'}});assert.equal(bible.structuredContent.status,'available');
 const search=await client.callTool({name:'swade_search_knowledge',arguments:{query:'Bible',limit:2}});assert(search.structuredContent.items.length>0);
 const plan=await client.callTool({name:'swade_route_request',arguments:{request:'Prepare a school basketball entrance song and promo video'}});assert.equal(plan.structuredContent.status,'prepared');assert.equal(plan.structuredContent.execution_authorized,false);
 const input={request:'DEPLOYMENT TEST ONLY: prepare a school basketball entrance song; do not execute or contact anyone.',idempotency_key:randomUUID()};
 const task=await client.callTool({name:'swade_create_task',arguments:input});assert(!task.isError,JSON.stringify(task));taskId=task.structuredContent.task.id;assert.equal(task.structuredContent.execution_started,false);
 const replay=await client.callTool({name:'swade_create_task',arguments:input});assert.equal(replay.structuredContent.task.id,taskId);
 const read=await client.callTool({name:'swade_get_task',arguments:{task_id:String(taskId)}});assert.equal(read.structuredContent.task.needs_approval,true);
 await req('/adapters/mcp/oauth/revoke',{token});assert.equal((await req('/adapters/mcp/plan',{request:'Read Bible'},{Authorization:'Bearer '+token})).r.status,401);
 console.log(JSON.stringify({oauth:'registration, consent, CSRF, PKCE, replay protection passed',mcp:'six tools, Bible retrieval, search, routing, idempotent task and revocation passed',routing_method:plan.structuredContent.method,task_status:'test handoff dropped during cleanup',external_spending:0}));
}finally{
 await client?.close().catch(()=>{});
 if(taskId)sql(`update swadebase_ops.handoff_log set status='dropped',updated_at=now() where id=${str(taskId)} and source='swadebase-mcp';`);
 sql(`delete from swadebase_ops.admin_sessions where id_hash=${str(sha(session))};`);
 if(clientId)sql(`delete from swadebase_ops.mcp_tokens where client_id=${str(clientId)};delete from swadebase_ops.mcp_codes where client_id=${str(clientId)};delete from swadebase_ops.mcp_pending where client_id=${str(clientId)};delete from swadebase_ops.mcp_clients where id=${str(clientId)};`);
}

