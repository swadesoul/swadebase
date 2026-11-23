import test from "node:test";
import assert from "node:assert/strict";
import { createSiteControlStore, validateSiteControlPatch, SITE_CAPABILITIES } from "./site-controls.mjs";
const owner="42f1cc0d-5c49-443d-85ea-5b51c930b18a";
const source="mail_machine",id="f27afba7-8bf7-4f75-b60f-680561c7aab2";
const registry=[{source,id,name:"ABAGALE",url:"https://abagale.live"}];
const ready={verified:true,capabilities:["site_read","chat","voice"]};
const stub=({registered=registry,dbRow=null,health=ready,rowCount=1}={})=>{
 const seen=[];
 const db={query:async(sql,args=[])=>{
   seen.push({sql,args});
   if(sql.includes("mail_machine_registered_sites()"))return{rows:registered};
   if(sql.includes("from swadebase_ops.site_agent_controls"))return{rows:dbRow?[dbRow]:[]};
   if(sql.includes("insert into swadebase_ops.site_agent_controls"))return{rowCount,rows:rowCount?[{version:1}]:[]};
   return{rows:[],rowCount:1};
 }};
 const store={actor:async session=>session?.owner,scoped:async(actor,fn)=>fn(db)};
 const api=createSiteControlStore({store,allowedAgents:async()=>["crown","broadcast"],engineHealth:async()=>health});
 return {api,seen,session:{owner}};
};
test("known capability schema contains phone, computer and vault",()=>["phone","computer","vault"].forEach(x=>assert.ok(SITE_CAPABILITIES.includes(x))));
test("empty patch can never enable capabilities",()=>assert.deepEqual(validateSiteControlPatch({},{}),{}));
test("unrecognized capability rejected",()=>assert.throws(()=>validateSiteControlPatch({features:{root_access:true}},{ready}),/invalid_features/));
test("unrecognized agent rejected",()=>assert.throws(()=>validateSiteControlPatch({agentEnabled:{arbitrary:true}},{allowedAgents:["crown"],ready}),/invalid_agents/));
test("unsigned admin flag rejected",()=>assert.throws(()=>validateSiteControlPatch({admin:true},{ready}),/invalid_control_patch/));
test("enable requires healthy runtime",()=>assert.throws(()=>validateSiteControlPatch({features:{site_read:true}},{ready:{verified:false,capabilities:[]}}),/runtime_not_verified/));
test("unavailable capability cannot be enabled",()=>assert.throws(()=>validateSiteControlPatch({features:{phone:true}},{ready}),/runtime_capability_unavailable/));
test("disabling remains legal if engine offline",()=>assert.deepEqual(validateSiteControlPatch({features:{phone:false},enabled:false},{ready:{verified:false,capabilities:[]}}),{features:{phone:false},enabled:false}));
test("missing signed owner session denied",async()=>assert.rejects(stub().api.get({owner:"not-a-uuid"},source,id),/verified_site_owner_required/));
test("registered website owner sees default-off control",async()=>{const x=await stub().api.get({owner},source,id);assert.equal(x.site.name,"ABAGALE");assert.equal(x.control.enabled,false);assert.equal(x.control.version,0);});
test("nonregistered website cannot be controlled",async()=>assert.rejects(stub({registered:[]}).api.get({owner},source,id),/site_not_registered_for_owner/));
test("valid owner can enable verified read only, with atomic site key",async()=>{
 const {api,seen}=stub();
 const result=await api.save({owner},source,id,{engine:"rakazo",features:{site_read:true},agentEnabled:{broadcast:true}},0);
 assert.equal(result.control.features.site_read,true);
 assert.equal(result.control.agentEnabled.broadcast,true);
 const insert=seen.find(x=>x.sql.includes("insert into swadebase_ops.site_agent_controls"));
 assert.deepEqual(insert.args.slice(0,3),[owner,source,id]);
 assert.equal(insert.args[7],1);
});
test("stale version denied",async()=>assert.rejects(stub({dbRow:{engine:"rakazo",enabled:false,features:{},agent_enabled:{},version:3}}).api.save({owner},source,id,{enabled:false},1),/stale_site_controls/));
test("write conflict denied rather than overwritten",async()=>assert.rejects(stub({rowCount:0}).api.save({owner},source,id,{enabled:false},0),/stale_site_controls/));
test("runtime offline still allows emergency disable and increments revision",async()=>{
 const {api}=stub({health:{verified:false,capabilities:[]}});
 const result=await api.save({owner},source,id,{enabled:false,features:{computer:false,phone:false,vault:false}},0);
 assert.equal(result.control.version,1);
 assert.equal(result.control.features.computer,false);
});
test("runtime offline prevents enabling new site",async()=>assert.rejects(stub({health:{verified:false,capabilities:[]}}).api.save({owner},source,id,{enabled:true},0),/runtime_not_verified/));
