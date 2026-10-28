import test from 'node:test';import assert from 'node:assert/strict';import http from 'node:http';
import {Client,StreamableHTTPClientTransport} from '@modelcontextprotocol/client';
import {serveProtocol} from './protocol.mjs';
test('official SDK client discovers and invokes deployed-shaped tools/resources/prompts',async()=>{
 const service={askKnowledge:async()=>({status:'retrieval_only',sources:[]}),bible:async()=>({status:'available',content:'# Fixture Bible'}),search:async()=>({items:[]}),capabilities:async()=>({items:[]}),plan:async()=>({status:'prepared',execution_authorized:false}),createTask:async()=>({status:'awaiting_approval'}),getTask:async()=>({task:{id:'1'}})};
 const app=http.createServer((req,res)=>serveProtocol(req,res,service,{id:'fixture',scopes:[]}));await new Promise(r=>app.listen(0,'127.0.0.1',r));
 const client=new Client({name:'fixture-client',version:'1.0.0'});try{await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${app.address().port}/mcp`)));
  const tools=await client.listTools();assert.equal(tools.tools.length,7);assert(tools.tools.some(t=>t.name==='swade_route_request'));
  const result=await client.callTool({name:'swade_route_request',arguments:{request:'Prepare a song'}});assert.equal(result.structuredContent.status,'prepared');
  const bad=await client.callTool({name:'swade_route_request',arguments:{request:'x'}});assert.equal(bad.isError,true);
  const resources=await client.listResources();assert.equal(resources.resources.length,1);const read=await client.readResource({uri:'swadebase://bibles/swadebase'});assert.equal(read.contents[0].text,'# Fixture Bible');
  const prompts=await client.listPrompts();assert.equal(prompts.prompts.length,1);
 }finally{await client.close();await new Promise(r=>app.close(r));}
});


test('official SDK discovers read-only Studio and validates its bounds',async()=>{
 const service={studioOverview:async()=>({release_state:'read_only_inventory',inventory:{total:1}})};
 const app=http.createServer((req,res)=>serveProtocol(req,res,service,{id:'fixture',scopes:['ecosystem:read']}));await new Promise(r=>app.listen(0,'127.0.0.1',r));
 const client=new Client({name:'studio-fixture-client',version:'1.0.0'});try{
  await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${app.address().port}/mcp`)));
  const list=await client.listTools();const tool=list.tools.find(t=>t.name==='swade_studio_overview');assert(tool);assert.equal(tool.annotations.readOnlyHint,true);
  const result=await client.callTool({name:'swade_studio_overview',arguments:{period:'mtd'}});assert.equal(result.structuredContent.release_state,'read_only_inventory');
  const bad=await client.callTool({name:'swade_studio_overview',arguments:{limit:500}});assert.equal(bad.isError,true);
 }finally{await client.close();await new Promise(r=>app.close(r));}
});
