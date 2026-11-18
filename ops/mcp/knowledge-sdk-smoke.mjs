import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {Client,StreamableHTTPClientTransport} from '@modelcontextprotocol/client';
import {opaque,sha,RESOURCE} from './core.mjs';
const sql=s=>execFileSync('docker',['exec','-i','supabase-db','psql','-U','postgres','-X','-v','ON_ERROR_STOP=1','-At'],{input:s,encoding:'utf8'}).trim();
const str=s=>"'"+String(s).replaceAll("'","''")+"'";
const actor=sql("select id from auth.users where email='swadesoul@gmail.com' and swadebase_ops.is_super_admin(id)");
const session=opaque(),csrf=opaque();let client;
try{
 sql(`insert into swadebase_ops.admin_sessions(id_hash,user_id,email,csrf,expires_at,absolute_expires_at) values(${str(sha(session))},${str(actor)},'swadesoul@gmail.com',${str(csrf)},now()+interval '3 minutes',now()+interval '3 minutes');`);
 client=new Client({name:'knowledge-release-check',version:'1.0.0'});
 await client.connect(new StreamableHTTPClientTransport(new URL(RESOURCE),{requestInit:{headers:{cookie:'swb_admin='+session,origin:'https://swadebase.cloud','x-csrf-token':csrf}}}));
 const tools=await client.listTools();assert(tools.tools.some(t=>t.name==='swade_ask_knowledge'));
 const result=await client.callTool({name:'swade_ask_knowledge',arguments:{question:'Brainiak HTTP 413 upload',generate:false}});assert(!result.isError,JSON.stringify(result));assert(result.structuredContent.sources.length);assert.equal(result.structuredContent.generated,false);
 const search=await client.callTool({name:'swade_search_knowledge',arguments:{query:'Knowledge Studio',limit:4}});assert(!search.isError);assert(search.structuredContent.items.some(s=>s.doc_path.includes('knowledge-studio')));
 console.log(JSON.stringify({official_sdk:'live HTTPS discovery and knowledge tool call passed',tools:tools.tools.length,source_search:'Knowledge Studio source discovered',paid_calls:0}));
}finally{await client?.close().catch(()=>{});sql(`delete from swadebase_ops.admin_sessions where id_hash=${str(sha(session))};`);}

