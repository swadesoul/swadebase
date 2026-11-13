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

 const tools=(await client.listTools()).tools.map(t=>t.name);
 const names=['swade_app_factory','swade_android_build_test','swade_android_report','swade_android_cancel'];for(const n of names)assert(tools.includes(n),n);
 const overview=await client.callTool({name:'swade_app_factory',arguments:{}});assert(!overview.isError,JSON.stringify(overview));assert.equal(overview.structuredContent.ready,false);
 const app=overview.structuredContent.apps.find(a=>a.package_name==='cloud.swade.maestro.preview');assert(app);
 const build=overview.structuredContent.jobs.find(j=>j.app_id===app.id&&j.kind==='build'&&j.status==='done');assert(build,'Pilot build must finish before MCP smoke');
 const report=await client.callTool({name:'swade_android_report',arguments:{job_id:build.id}});assert(!report.isError);assert.equal(report.structuredContent.job.result.package_checks.passed,true);
 const key=randomUUID();const input={app_id:app.id,kind:'android-qa',build_id:build.id,request_key:key};
 const q=await client.callTool({name:'swade_android_build_test',arguments:input});assert(!q.isError,JSON.stringify(q));
 const repeat=await client.callTool({name:'swade_android_build_test',arguments:input});assert.equal(repeat.structuredContent.job_id,q.structuredContent.job_id);
 let qa;for(let i=0;i<20;i++){qa=await client.callTool({name:'swade_android_report',arguments:{job_id:q.structuredContent.job_id}});if(['blocked','done','error'].includes(qa.structuredContent.job.status))break;await new Promise(r=>setTimeout(r,1000));}
 assert.equal(qa.structuredContent.job.status,'blocked');
 const summary={time:new Date().toISOString(),tools:tools.length,factory_tools:names,oauth_pkce_consent:'passed',overview:'passed',real_build_report:'passed',idempotency:'passed',unconnected_device:'blocked honestly',paid_calls:0};
 await import('node:fs/promises').then(fs=>fs.writeFile('/opt/swadebase/docs/releases/app-factory-20261111/mcp-acceptance.json',JSON.stringify(summary,null,2)));console.log(JSON.stringify(summary));
}finally{
 await client?.close().catch(()=>{});
 sql(`delete from swadebase_ops.admin_sessions where id_hash=${str(sha(session))};`);
 if(clientId)sql(`delete from swadebase_ops.mcp_tokens where client_id=${str(clientId)};delete from swadebase_ops.mcp_codes where client_id=${str(clientId)};delete from swadebase_ops.mcp_pending where client_id=${str(clientId)};delete from swadebase_ops.mcp_clients where id=${str(clientId)};`);
}
