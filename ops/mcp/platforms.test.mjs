import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_PLATFORM,platformInput,platformAllows,makePlatforms} from './platforms.mjs';
test('SWADEBASE default uses the existing production endpoint',()=>{assert.equal(DEFAULT_PLATFORM.endpoint,'https://swadebase.cloud/adapters/mcp');assert.equal(DEFAULT_PLATFORM.is_default,true);});
test('callback and scopes validated without accepting secrets or arbitrary endpoint fetching',()=>{
 const x=platformInput({name:'My AI app',redirect_uris:['https://app.example/oauth/callback'],scopes:['ecosystem:read']});assert.deepEqual(x.scopes,['ecosystem:read']);
 for(const b of [{name:'x'},{name:'Valid',redirect_uris:['javascript:alert(1)']},{name:'Valid',redirect_uris:['https://a.example/cb'],scopes:[]},{name:'Valid',redirect_uris:['https://a.example/cb'],scopes:['operator:plan']},{name:'Valid',redirect_uris:['https://a.example/cb'],scopes:['ecosystem:read','actions:prepare','actions:execute','payments:execute']}])assert.throws(()=>platformInput(b));
});
test('disabled connections and scope elevation fail closed',()=>{
 assert.equal(platformAllows({enabled:false},['ecosystem:read']),false);
 assert.equal(platformAllows({enabled:true,allowed_scopes:['ecosystem:read']},['actions:execute']),false);
 assert.equal(platformAllows({enabled:true,allowed_scopes:['ecosystem:read'],owner_actor:'owner'},['ecosystem:read'],'foreign'),false);
 assert.equal(platformAllows({enabled:true,allowed_scopes:['ecosystem:read'],owner_actor:'owner'},['ecosystem:read'],'owner'),true);
 assert.equal(platformAllows({enabled:true,allowed_scopes:null},['ecosystem:read'],'legacy-owner'),true);
});
class Fixture{
 constructor(){this.clients=[];this.revocations=0;}
 async query(sql,args=[]){
  if(sql.includes('is_super_admin'))return {rows:[{ok:args[0]==='owner'}]};
  if(sql.includes('adapters_registry'))return {rows:[{enabled:true,status:'live'}]};
  if(sql.startsWith('insert into swadebase_ops.mcp_clients')){const [id,name,redirects,owner_actor,allowed_scopes]=args;const c={id,name,redirect_uris:JSON.parse(redirects),owner_actor,allowed_scopes,enabled:true,active_tokens:0};this.clients.push(c);return {rows:[structuredClone(c)]};}
  if(sql.includes('active from swadebase_ops.mcp_tokens'))return {rows:[{active:this.clients.find(x=>x.id===args[0])?.active_tokens||0}]};
  if(sql.startsWith('select * from swadebase_ops.mcp_clients'))return {rows:this.clients.filter(x=>x.id===args[0]&&x.owner_actor===args[1]).map(x=>structuredClone(x))};
  if(sql.includes('select c.id,c.name'))return {rows:this.clients.filter(x=>x.owner_actor===args[0]).map(x=>structuredClone(x))};
  if(sql.startsWith('update swadebase_ops.mcp_clients')){const c=this.clients.find(x=>x.id===args[0]&&x.owner_actor===args[1]);if(c){c.enabled=args[2];c.allowed_scopes=args[3];}return {rows:[]};}
  if(sql.startsWith('update swadebase_ops.mcp_tokens')){this.revocations++;return {rows:[]};}
  return {rows:[]};
 }
 async connect(){return {query:this.query.bind(this),release(){}};}
}
test('only super admins can list or register platforms',async()=>{const service=makePlatforms({pool:new Fixture});await assert.rejects(()=>service.execute({id:'foreign'},{action:'list'}),e=>e.status===403);});
test('registration, default inventory and OAuth-required status',async()=>{
 const pool=new Fixture,service=makePlatforms({pool});const created=await service.execute({id:'owner'},{action:'create',name:'My app',redirect_uris:['https://app.example/cb'],scopes:['ecosystem:read']});assert.match(created.id,/^[a-f0-9-]{36}$/);assert.equal(created.status,'registered_oauth_required');
 const list=await service.execute({id:'owner'},{action:'list'});assert.equal(list.default_platform.is_default,true);assert.equal(list.platforms.length,1);
 const state=await service.execute({id:'owner'},{action:'test',id:created.id});assert.equal(state.status,'oauth_required');
});
test('disable and permission changes revoke existing grants',async()=>{
 const pool=new Fixture,service=makePlatforms({pool});const c=await service.execute({id:'owner'},{action:'create',name:'My app',redirect_uris:['https://app.example/cb'],scopes:['ecosystem:read','operator:plan']});
 await service.execute({id:'owner'},{action:'disable',id:c.id});assert.equal(pool.clients[0].enabled,false);assert.equal(pool.revocations,1);
 await service.execute({id:'owner'},{action:'permissions',id:c.id,scopes:['ecosystem:read']});assert.equal(pool.revocations,2);assert.deepEqual(pool.clients[0].allowed_scopes,['ecosystem:read']);
});
