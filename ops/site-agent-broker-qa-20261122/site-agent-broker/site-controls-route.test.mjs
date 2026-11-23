import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import siteAgentControlsRoutes from "../routes/site-agent-controls.mjs";
const origin="https://swadebase.cloud";
const u=new URL(origin+"/adapters/api/site-agent-controls?source=mail_machine&site=abagale");
const session={userId:"42f1cc0d-5c49-443d-85ea-5b51c930b18a",csrf:"test"};
const req=(method="GET",data=null)=>Object.assign(Readable.from(data?[JSON.stringify(data)]:[]),{method,headers:{"content-type":"application/json",origin}});
function response(){return{status:null,headers:null,body:null,writeHead(status,headers){this.status=status;this.headers=headers;},end(data){this.body=JSON.parse(data);}};}
function create({csrf=true}={}) {
 const calls=[],result={site:{source:"mail_machine",id:"abagale"},control:{enabled:false,features:{},version:0}};
 const handler=siteAgentControlsRoutes({pool:{},
   auth:{csrfOk:()=>csrf},
   storeFactory:()=>({}),
   controlsFactory:()=>({
      get:async(...args)=>{calls.push({kind:"read",args});return result;},
      save:async(...args)=>{calls.push({kind:"write",args});return result;}
   })});
 return {handler,calls};
}
test("unmatched route remains untouched",async()=>{const {handler}=create(),res=response();assert.equal(await handler(req(),res,new URL(origin+"/other"),session),false);assert.equal(res.status,null);});
test("anonymous site controls denied",async()=>{const {handler}=create(),res=response();await handler(req(),res,u,null);assert.equal(res.status,401);assert.equal(res.body.ok,false);});
test("authenticated read uses trusted store",async()=>{const {handler,calls}=create(),res=response();await handler(req(),res,u,session);assert.equal(res.status,200);assert.equal(calls[0].kind,"read");assert.deepEqual(calls[0].args,[session,"mail_machine","abagale"]);});
test("missing site identity denied",async()=>{const {handler}=create(),res=response();await handler(req(),res,new URL(origin+"/adapters/api/site-agent-controls"),session);assert.equal(res.status,400);});
test("method other than GET/POST denied",async()=>{const {handler}=create(),res=response();await handler(req("DELETE"),res,u,session);assert.equal(res.status,405);});
test("POST without CSRF denied",async()=>{const {handler,calls}=create({csrf:false}),res=response();await handler(req("POST",{version:0,patch:{enabled:false}}),res,u,session);assert.equal(res.status,403);assert.equal(calls.length,0);});
test("POST body must only include patch and version",async()=>{const {handler,calls}=create(),res=response();await handler(req("POST",{version:0,patch:{enabled:false},ownerAdmin:true}),res,u,session);assert.equal(res.status,400);assert.equal(calls.length,0);});
test("proper scoped POST forwards optimistic version",async()=>{const {handler,calls}=create(),res=response();await handler(req("POST",{version:0,patch:{phone:false}}),res,u,session);assert.equal(res.status,200);assert.equal(calls[0].kind,"write");assert.deepEqual(calls[0].args.slice(1),["mail_machine","abagale",{phone:false},0]);});
test("runtime unavailable fails closed",async()=>{
 const handler=siteAgentControlsRoutes({pool:{},auth:{csrfOk:()=>true},storeFactory:()=>({}),
 controlsFactory:()=>({get:async()=>{},save:async()=>{throw Error("runtime_not_verified");}})});
 const res=response();await handler(req("POST",{version:0,patch:{enabled:true}}),res,u,session);
 assert.equal(res.status,503);
});
