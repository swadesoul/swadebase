import {randomUUID} from 'node:crypto';
import {RESOURCE,SUPPORTED_SCOPES,scopeList,redirectUri} from './core.mjs';
export const DEFAULT_PLATFORM={id:'swadebase',name:'SWADEBASE MCP',endpoint:RESOURCE,is_default:true,transport:'Streamable HTTP',authentication:'OAuth 2.1 / PKCE'};
export function platformInput(b){
 if(typeof b.name!=='string'||b.name.trim().length<2||b.name.length>120)throw Object.assign(Error('Enter a platform name (2–120 characters).'),{status:400});
 if(!Array.isArray(b.redirect_uris)||!b.redirect_uris.length||b.redirect_uris.length>5)throw Object.assign(Error('Enter 1–5 exact OAuth callback URLs supplied by the platform.'),{status:400});
 const redirects=[...new Set(b.redirect_uris.map(redirectUri))];
 const requested=b.scopes??['ecosystem:read'];
 if(!Array.isArray(requested)||!requested.length)throw Object.assign(Error('Choose at least one permission.'),{status:400});
 const scopes=scopeList(requested.join(' '));
 if(scopes.includes('payments:execute'))throw Object.assign(Error('Payment access is configured separately through the existing owner payment rules.'),{status:400});
 return {name:b.name.trim(),redirects,scopes};
}
export function platformAllows(client,scopes,actorId){
 if(!client||client.enabled===false)return false;
 if(client.owner_actor&&actorId&&client.owner_actor!==actorId)return false;
 return !client.allowed_scopes||scopes.every(s=>client.allowed_scopes.includes(s));
}
export function makePlatforms({pool}){
 const q=async(sql,args=[])=>(await pool.query(sql,args)).rows;
 async function owner(actor){if(!actor?.id||!(await q('select swadebase_ops.is_super_admin($1::uuid) ok',[actor.id]))[0]?.ok)throw Object.assign(Error('Super admin access is required.'),{status:403});}
 async function execute(actor,b){
  await owner(actor);
  if(b.action==='list'){
   const platforms=await q("select c.id,c.name,c.redirect_uris,c.allowed_scopes,c.enabled,c.created_at,c.updated_at,(select count(*)::int from swadebase_ops.mcp_tokens t where t.client_id=c.id and t.actor_id=$1 and t.revoked_at is null and t.expires_at>now()) active_tokens from swadebase_ops.mcp_clients c where c.owner_actor=$1 order by c.created_at desc limit 100",[actor.id]);
   const state=(await q("select enabled,status from swadebase_ops.adapters_registry where id='swadebase-mcp'"))[0];
   return {default_platform:{...DEFAULT_PLATFORM,available:state?.enabled===true&&state?.status==='live'},platforms,supported_scopes:SUPPORTED_SCOPES.filter(s=>s!=='payments:execute'),notes:'Platform registration is separate from OAuth authorization. Approved actions keep their existing owner-review requirements.'};
  }
  if(b.action==='create'){
   const input=platformInput(b),id=randomUUID();
   const rows=await q('insert into swadebase_ops.mcp_clients(id,name,redirect_uris,owner_actor,allowed_scopes,enabled) values($1,$2,$3,$4,$5,true) returning id,name,redirect_uris,allowed_scopes,enabled',[id,input.name,JSON.stringify(input.redirects),actor.id,input.scopes]);
   await q("insert into swadebase_ops.advisor_events(action,target,detail) values('mcp_platform_registered',$1,$2)",[actor.id,{client_id:id,scopes:input.scopes}]);
   return {...rows[0],endpoint:RESOURCE,status:'registered_oauth_required'};
  }
  if(!/^[a-f0-9-]{36}$/i.test(b.id||''))throw Object.assign(Error('Select a registered platform.'),{status:400});
  const client=(await q('select * from swadebase_ops.mcp_clients where id=$1 and owner_actor=$2',[b.id,actor.id]))[0];
  if(!client)throw Object.assign(Error('Platform not found for this owner.'),{status:404});
  if(b.action==='test'){
   const tokens=(await q('select count(*)::int active from swadebase_ops.mcp_tokens where client_id=$1 and actor_id=$2 and revoked_at is null and expires_at>now()',[b.id,actor.id]))[0].active;
   return {id:b.id,endpoint:RESOURCE,enabled:client.enabled,allowed_scopes:client.allowed_scopes,active_tokens:tokens,status:!client.enabled?'disabled':tokens?'oauth_authorized':'oauth_required',verification:'Registration, permissions and current OAuth grants checked. An external platform must still complete its own tool invocation.'};
  }
  if(!['disable','enable','permissions'].includes(b.action))throw Object.assign(Error('Unknown platform operation.'),{status:400});
  const scopes=b.action==='permissions'?platformInput({name:client.name,redirect_uris:client.redirect_uris,scopes:b.scopes}).scopes:client.allowed_scopes;
  const c=await pool.connect();
  try{await c.query('begin');
   await c.query('update swadebase_ops.mcp_clients set enabled=$3,allowed_scopes=$4,updated_at=now() where id=$1 and owner_actor=$2',[b.id,actor.id,b.action==='disable'?false:b.action==='enable'?true:client.enabled,scopes]);
   if(b.action!=='enable')await c.query('update swadebase_ops.mcp_tokens set revoked_at=now() where client_id=$1 and actor_id=$2 and revoked_at is null',[b.id,actor.id]);
   await c.query("insert into swadebase_ops.advisor_events(action,target,detail) values($1,$2,$3)",['mcp_platform_'+b.action,actor.id,{client_id:b.id,scopes}]);
   await c.query('commit');return {ok:true,reconnect_required:b.action!=='enable'};
  }catch(e){await c.query('rollback');throw e;}finally{c.release();}
 }
 return {execute};
}
