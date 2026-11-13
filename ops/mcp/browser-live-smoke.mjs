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

 const tools=(await client.listTools()).tools.map(t=>t.name);for(const name of ['swade_browser_sites','swade_site_checker','swade_site_check_report'])assert(tools.includes(name),name);
 const sites=await client.callTool({name:'swade_browser_sites',arguments:{}});assert(!sites.isError,JSON.stringify(sites));
 const ownerHeaders={cookie:'swb_admin='+session,origin:base,'x-csrf-token':csrf};
 const registered=await req('/adapters/browser/api/sites',{label:'SWADEBASE',url:'https://swadebase.cloud'},ownerHeaders);assert.equal(registered.r.status,200);const website=registered.j.data.id;
 const proposed=await client.callTool({name:'swade_browser_task_propose',arguments:{website,goal:'Read the SWADEBASE page summary for MCP acceptance',steps:[{op:'extract',selector:'body'}]}});assert(!proposed.isError,JSON.stringify(proposed));const proposalId=proposed.structuredContent.id;
 const draft=await client.callTool({name:'swade_browser_task_report',arguments:{task_id:proposalId}});assert.equal(draft.structuredContent.status,'draft');
 const proposals=await req('/adapters/browser/api/tasks',null,ownerHeaders);const exact=proposals.j.data.find(x=>x.id===proposalId);assert(exact);
 const refused=await req('/adapters/browser/api/tasks/approve',{task:proposalId,digest:exact.digest},{Authorization:'Bearer '+token,origin:base});assert.equal(refused.r.status,401);
 const rejected=await req('/adapters/browser/api/tasks/reject',{task:proposalId,digest:exact.digest},ownerHeaders);assert.equal(rejected.r.status,200);
 sql(`delete from swadebase_ops.browser_tasks where id=${str(proposalId)};`);
 const key=randomUUID();const job=await client.callTool({name:'swade_site_checker',arguments:{website,request_key:key}});assert(!job.isError,JSON.stringify(job));taskId=job.structuredContent.job_id;
 const replay=await client.callTool({name:'swade_site_checker',arguments:{website,request_key:key}});assert.equal(replay.structuredContent.job_id,taskId);
 let report;for(let i=0;i<150;i++){report=await client.callTool({name:'swade_site_check_report',arguments:{job_id:taskId}});assert(!report.isError,JSON.stringify(report));if(['done','error','cancelled'].includes(report.structuredContent.status))break;await new Promise(r=>setTimeout(r,1000));}
 assert.equal(report.structuredContent.status,'done',JSON.stringify(report));
 const summary={time:new Date().toISOString(),mcp_tools:tools.length,new_tools:['swade_browser_sites','swade_site_checker','swade_site_check_report','swade_browser_task_propose','swade_browser_task_report'],business_proposal_and_report:'passed',agent_self_approval:'denied',oauth_pkce_consent_replay:'passed',idempotency:'passed',job_id:taskId,job_status:report.structuredContent.status,site:'swadebase.cloud',coverage:report.structuredContent.output.coverage,issues:report.structuredContent.output.summary,paid_calls:0};
 await import('node:fs/promises').then(fs=>fs.writeFile('/tmp/swade-browser-mcp-acceptance.json',JSON.stringify(summary,null,2)));
 console.log(JSON.stringify(summary));
}finally{
 await client?.close().catch(()=>{});
 sql(`delete from swadebase_ops.admin_sessions where id_hash=${str(sha(session))};`);
 if(clientId)sql(`delete from swadebase_ops.mcp_tokens where client_id=${str(clientId)};delete from swadebase_ops.mcp_codes where client_id=${str(clientId)};delete from swadebase_ops.mcp_pending where client_id=${str(clientId)};delete from swadebase_ops.mcp_clients where id=${str(clientId)};`);
}
