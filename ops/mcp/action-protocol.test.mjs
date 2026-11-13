import test from 'node:test';import assert from 'node:assert/strict';import http from 'node:http';
import {Client,StreamableHTTPClientTransport} from '@modelcontextprotocol/client';import {serveProtocol} from './protocol.mjs';
async function fixture(scopes,run){
 let dispatches=0;const actions={capabilities:async()=>({operations:[]}),get:async()=>({status:'awaiting_approval'}),list:async()=>({items:[]}),repositoryStatus:async()=>({}),readCode:async()=>({}),readDraft:async()=>({}),prepare:async()=>({status:'awaiting_approval',execution_started:false}),execute:async()=>{dispatches++;throw Object.assign(Error('Approve through owner console.'),{code:'approval_required'});}};
 const app=http.createServer((req,res)=>serveProtocol(req,res,{actions},{id:'11111111-1111-4111-8111-111111111111',scopes}));await new Promise(r=>app.listen(0,'127.0.0.1',r));
 const client=new Client({name:'action-test',version:'1.0.0'});try{await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${app.address().port}/mcp`)));await run(client,()=>dispatches);}finally{await client.close();await new Promise(r=>app.close(r));}
}
test('existing read scope does not silently acquire action execution',()=>fixture(['ecosystem:read'],async client=>{const list=(await client.listTools()).tools;assert(list.some(t=>t.name==='swade_action_capabilities'));assert(!list.some(t=>t.name==='swade_execute_approved_action'));assert(!list.some(t=>t.name.startsWith('swade_prepare_send')));}));
test('action discovery includes exact preparation and execution but no approval tool',()=>fixture(['ecosystem:read','actions:prepare','actions:execute'],async(client,dispatches)=>{
 const list=(await client.listTools()).tools;assert(list.some(t=>t.name==='swade_prepare_payment_transfer'));assert(list.some(t=>t.name==='swade_execute_approved_action'));assert(!list.some(t=>/approve_action|set_payment_rules/.test(t.name)));
 const prepare=await client.callTool({name:'swade_prepare_send_email',arguments:{input:{to:'owner@example.test',subject:'Fixture',text:'Body'},idempotency_key:'33333333-3333-4333-8333-333333333333'}});assert.equal(prepare.structuredContent.execution_started,false);
 const invalid=await client.callTool({name:'swade_execute_approved_action',arguments:{action_id:'33333333-3333-4333-8333-333333333333',digest:'a'.repeat(64),approved:true}});assert.equal(invalid.isError,true);assert.equal(dispatches(),0);
}));
