import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {BASE,ORIGIN,RESOURCE,SCOPES,SUPPORTED_SCOPES,sha,opaque,pkce,equal,scopeList,redirectUri,limiter} from './core.mjs';
import {makeService,localClassifier} from './service.mjs';
import {serveProtocol} from './protocol.mjs';
const S='swadebase_ops',COOKIE='swade_mcp_pending';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function reply(res,status,data,headers={}){res.writeHead(status,{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff',...headers});res.end(JSON.stringify(data));}
function go(res,url,cookie){res.writeHead(303,{location:url,'cache-control':'no-store',...(cookie?{'set-cookie':cookie}:{})});res.end();}
function cookie(req){return String(req.headers.cookie||'').split(/;\s*/).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1)||'';}
async function body(req){let n=0,out=[];for await(const part of req){n+=part.length;if(n>16000)throw Object.assign(Error('Request too large.'),{status:413});out.push(part);}const text=Buffer.concat(out).toString();try{return String(req.headers['content-type']||'').startsWith('application/x-www-form-urlencoded')?Object.fromEntries(new URLSearchParams(text)):JSON.parse(text||'{}');}catch{throw Object.assign(Error('Invalid request.'),{status:400});}}
const issuerMetadata={issuer:RESOURCE,authorization_endpoint:RESOURCE+'/oauth/authorize',token_endpoint:RESOURCE+'/oauth/token',registration_endpoint:RESOURCE+'/oauth/register',revocation_endpoint:RESOURCE+'/oauth/revoke',response_types_supported:['code'],grant_types_supported:['authorization_code'],token_endpoint_auth_methods_supported:['none'],code_challenge_methods_supported:['S256'],authorization_response_iss_parameter_supported:true,scopes_supported:SUPPORTED_SCOPES};
const protectedMetadata={resource:RESOURCE,authorization_servers:[RESOURCE],scopes_supported:SUPPORTED_SCOPES,bearer_methods_supported:['header'],resource_name:'SWADEBASE Ecosystem MCP'};
export default function mcpRoutes({pool,auth,admin,log=()=>{},classifier=localClassifier}){
 const publicLimit=limiter(30,3600000),calls=limiter(60,60000),routing=limiter(10,3600000),modelLimit=limiter(10,3600000);let activePlans=0,activeModels=0;
 const service=makeService({pool,classifier,admitPlan:actor=>{if(activeModels>=2||!modelLimit(actor.id))return null;activeModels++;return ()=>activeModels--;}});
 const query=async(sql,args=[])=> (await pool.query(sql,args)).rows;
 const actorFromSession=async s=>{if(!s?.userId||!await admin.isSuperAdmin(s.userId))return null;return {id:s.userId,scopes:SUPPORTED_SCOPES};};
 async function actorFromBearer(req){const raw=String(req.headers.authorization||'').match(/^Bearer (swmcp_[A-Za-z0-9_-]{43})$/)?.[1];if(!raw)return null;const row=(await query(`select actor_id,scopes,client_id from ${S}.mcp_tokens where token_hash=$1 and issuer=$2 and audience=$2 and revoked_at is null and expires_at>now()`,[sha(raw),RESOURCE]))[0];if(!row||!await admin.isSuperAdmin(row.actor_id))return null;return {id:row.actor_id,scopes:row.scopes,clientId:row.client_id};}
 function validHost(req){const host=String(req.headers.host||'').split(':')[0];return ['swadebase.cloud','127.0.0.1','localhost'].includes(host);}
 function validOrigin(req){return !req.headers.origin||req.headers.origin===ORIGIN;}
 async function audit(action,actor,detail){await pool.query(`insert into ${S}.advisor_events(action,target,detail) values($1,$2,$3)`,[action,actor,detail]);}
 return async(req,res,url,session)=>{
  const p=url.pathname,connectPage=p==='/adapters/mcp-connect';
  if(!p.startsWith(BASE)&&!connectPage&&!p.startsWith('/adapters/api/mcp-connect')&&!p.startsWith('/adapters/operator/')&&!p.startsWith('/.well-known/oauth-'))return false;
  if(!validHost(req)||!validOrigin(req))return reply(res,403,{error:'forbidden_origin_or_host'});
  const ip=String(req.headers['x-real-ip']||req.socket?.remoteAddress||'unknown');
  if(p==='/.well-known/oauth-authorization-server/adapters/mcp'||p===BASE+'/.well-known/oauth-authorization-server')return reply(res,200,issuerMetadata);
  if(p==='/.well-known/oauth-protected-resource/adapters/mcp'||p===BASE+'/.well-known/oauth-protected-resource')return reply(res,200,protectedMetadata);
  if(p===BASE+'/health')return reply(res,200,{status:'ok',service:'swadebase-mcp',version:'1.0.0'});
  if(p===BASE+'/studio'&&req.method==='GET'){
   if(!session)return go(res,'/adapters/login?next=%2Fadapters%2Fmcp%2Fstudio');
   if(!await actorFromSession(session))return reply(res,403,{error:'operator_access_required'});
   const page=await readFile(new URL('./studio.html',import.meta.url));res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store','content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"});return res.end(page);
  }
  if([BASE+'/studio.js',BASE+'/studio.css'].includes(p)&&req.method==='GET'){
   if(!await actorFromSession(session))return reply(res,403,{error:'operator_access_required'});
   const file=p.endsWith('.js')?'studio.js':'studio.css';const content=await readFile(new URL('./'+file,import.meta.url));res.writeHead(200,{'content-type':file.endsWith('.js')?'text/javascript':'text/css','cache-control':'no-store'});return res.end(content);
  }
  if(p==='/adapters/api/mcp-connect/studio'&&req.method==='GET'){
   const actor=await actorFromSession(session);if(!actor)return reply(res,403,{error:'operator_access_required'});
   if(!calls(actor.id))return reply(res,429,{error:'rate_limited'});
   const data=await service.studioOverview(actor,{offset:Number(url.searchParams.get('offset')??0),limit:Number(url.searchParams.get('limit')??20),period:url.searchParams.get('period')||'mtd'});
   return reply(res,200,{ok:true,data});
  }

  if(p===BASE+'/oauth/register'&&req.method==='POST'){
   if(!publicLimit('register:'+ip))return reply(res,429,{error:'rate_limited'});
   const b=await body(req);let uris;try{if(!Array.isArray(b.redirect_uris)||b.redirect_uris.length<1||b.redirect_uris.length>5)throw Error();uris=b.redirect_uris.map(redirectUri);if(b.token_endpoint_auth_method&&b.token_endpoint_auth_method!=='none')throw Error();}catch{return reply(res,400,{error:'invalid_client_metadata'});}
   if(Number((await query(`select count(*) n from ${S}.mcp_clients`))[0].n)>=10000)return reply(res,429,{error:'registration_capacity'});
   const id=randomUUID(),name=String(b.client_name||'MCP client').slice(0,120);await pool.query(`insert into ${S}.mcp_clients(id,name,redirect_uris) values($1,$2,$3)`,[id,name,JSON.stringify(uris)]);
   return reply(res,201,{client_id:id,client_name:name,redirect_uris:uris,token_endpoint_auth_method:'none',grant_types:['authorization_code'],response_types:['code']});
  }
  if(p===BASE+'/oauth/authorize'&&req.method==='GET'){
   if(!publicLimit('authorize:'+ip))return reply(res,429,{error:'rate_limited'});const b=Object.fromEntries(url.searchParams);
   const client=(await query(`select * from ${S}.mcp_clients where id=$1`,[b.client_id||'']))[0];let scopes;
   try{scopes=scopeList(b.scope);if(!client||!client.redirect_uris.includes(b.redirect_uri)||b.resource!==RESOURCE||b.response_type!=='code'||b.code_challenge_method!=='S256'||!/^[A-Za-z0-9_-]{43}$/.test(b.code_challenge||'')||!b.state||b.state.length>512)throw Error();}catch{return reply(res,400,{error:'invalid_authorization_request'});}
   const id=randomUUID();await pool.query(`insert into ${S}.mcp_pending(id,client_id,redirect_uri,state,challenge,scopes,resource,expires_at) values($1,$2,$3,$4,$5,$6,$7,now()+interval '10 minutes')`,[id,b.client_id,b.redirect_uri,b.state,b.code_challenge,scopes,RESOURCE]);
   return go(res,'/adapters/mcp-connect',`${COOKIE}=${id}; Path=/adapters; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  }
  if(p===BASE+'/oauth/token'&&req.method==='POST'){
   if(!publicLimit('token:'+ip))return reply(res,429,{error:'rate_limited'});const b=await body(req);
   if(b.grant_type!=='authorization_code'||b.resource!==RESOURCE||typeof b.code!=='string'||b.code.length>100||!/^[A-Za-z0-9._~-]{43,128}$/.test(b.code_verifier||''))return reply(res,400,{error:'invalid_grant'});
   const c=await pool.connect();try{await c.query('begin');const row=(await c.query(`select * from ${S}.mcp_codes where code_hash=$1 for update`,[sha(b.code)])).rows[0];
    if(!row||row.consumed_at||new Date(row.expires_at)<=new Date()||row.client_id!==b.client_id||row.redirect_uri!==b.redirect_uri||row.resource!==RESOURCE||!equal(row.challenge,pkce(b.code_verifier))||!await admin.isSuperAdmin(row.actor_id)){await c.query('rollback');return reply(res,400,{error:'invalid_grant'});}
    const token='swmcp_'+opaque();await c.query(`update ${S}.mcp_codes set consumed_at=now() where code_hash=$1`,[sha(b.code)]);await c.query(`insert into ${S}.mcp_tokens(token_hash,client_id,actor_id,scopes,issuer,audience,expires_at) values($1,$2,$3,$4,$5,$5,now()+interval '30 minutes')`,[sha(token),row.client_id,row.actor_id,row.scopes,RESOURCE]);await c.query('commit');return reply(res,200,{access_token:token,token_type:'Bearer',expires_in:1800,scope:row.scopes.join(' ')});
   }catch(e){await c.query('rollback');throw e;}finally{c.release();}
  }
  if(p===BASE+'/oauth/revoke'&&req.method==='POST'){const b=await body(req);if(typeof b.token==='string'&&b.token.length<200)await pool.query(`update ${S}.mcp_tokens set revoked_at=now() where token_hash=$1`,[sha(b.token)]);return reply(res,200,{});}
  if(connectPage&&req.method==='GET'){
   if(!session)return go(res,'/adapters/login?next=%2Fadapters%2Fmcp-connect');
   const page=await readFile(new URL('./console.html',import.meta.url));res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store','content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"});return res.end(page);
  }
  if(p===BASE+'/console.js'&&req.method==='GET'){if(!session)return reply(res,401,{error:'unauthorized'});const js=await readFile(new URL('./console.js',import.meta.url));res.writeHead(200,{'content-type':'text/javascript','cache-control':'no-store'});return res.end(js);}
  if(p==='/adapters/api/mcp-connect'&&req.method==='GET'){
   const actor=await actorFromSession(session);if(!actor)return reply(res,403,{error:'swadebase_super_admin_sign_in_required'});
   const pendingId=cookie(req);const pending=/^[0-9a-f-]{36}$/.test(pendingId)?(await query(`select p.id,p.scopes,p.redirect_uri,c.name client_name from ${S}.mcp_pending p join ${S}.mcp_clients c on c.id=p.client_id where p.id=$1 and p.expires_at>now() and p.consumed_at is null`,[pendingId]))[0]:null;
   return reply(res,200,{ok:true,data:{endpoint:RESOURCE,scopes:SCOPES,pending,access:'Founder/operator access. Customer product permissions are not widened.'}});
  }
  if(p==='/adapters/api/mcp-connect/consent'&&req.method==='POST'){
   const actor=await actorFromSession(session);if(!actor||!auth.csrfOk(req,session))return reply(res,403,{error:'forbidden'});const b=await body(req);
   if(b.confirm!==true||b.request_id!==cookie(req)||!/^[0-9a-f-]{36}$/.test(b.request_id||''))return reply(res,400,{error:'invalid_consent'});
   const c=await pool.connect();try{await c.query('begin');const row=(await c.query(`select * from ${S}.mcp_pending where id=$1 and expires_at>now() and consumed_at is null for update`,[b.request_id])).rows[0];if(!row){await c.query('rollback');return reply(res,409,{error:'expired_or_consumed'});}
    const code=opaque();await c.query(`insert into ${S}.mcp_codes(code_hash,client_id,actor_id,redirect_uri,challenge,scopes,resource,expires_at) values($1,$2,$3,$4,$5,$6,$7,now()+interval '2 minutes')`,[sha(code),row.client_id,actor.id,row.redirect_uri,row.challenge,row.scopes,RESOURCE]);await c.query(`update ${S}.mcp_pending set consumed_at=now() where id=$1`,[b.request_id]);await c.query('commit');await audit('mcp_authorized',actor.id,{client_id:row.client_id,scopes:row.scopes});const target=new URL(row.redirect_uri);target.searchParams.set('code',code);target.searchParams.set('state',row.state);target.searchParams.set('iss',RESOURCE);return reply(res,200,{ok:true,data:{redirect:target.href}});
   }catch(e){await c.query('rollback');throw e;}finally{c.release();}
  }
  if(p==='/adapters/operator/route'&&req.method==='POST'){
   // Existing app bridge: verifies its user's original SWADEBASE token. Never accepts MCP tokens here or forwards them upstream.
   const raw=String(req.headers.authorization||'').match(/^Bearer ([A-Za-z0-9._-]+)$/)?.[1];const u=raw&&!raw.startsWith('swmcp_')?await admin.verifyAccessToken(raw):null;
   if(!u||!await admin.isSuperAdmin(u.id))return reply(res,403,{error:'operator_access_required'});
   if(!routing(u.id)||activePlans>=2)return reply(res,429,{error:'routing_limit'});const b=await body(req);activePlans++;try{return reply(res,200,{ok:true,data:await service.plan({id:u.id,scopes:SCOPES},{request:b.request,rules_only:b.rules_only===true})});}finally{activePlans--;}
  }
  let actor=await actorFromBearer(req);
  if(!actor&&session&&req.headers.origin===ORIGIN&&auth.csrfOk(req,session))actor=await actorFromSession(session);
  if(!actor){res.setHeader('www-authenticate',`Bearer resource_metadata="${ORIGIN}/.well-known/oauth-protected-resource/adapters/mcp"`);return reply(res,401,{error:'unauthorized'});}
  if(!calls(actor.id))return reply(res,429,{error:'rate_limited'});
  if(p===BASE){return serveProtocol(req,res,service,actor);}
  if(p===BASE+'/knowledge'&&req.method==='POST'){const b=await body(req);return reply(res,200,{ok:true,data:await service.askKnowledge(actor,{question:b.question,generate:b.generate!==false})});}
  if(p===BASE+'/plan'&&req.method==='POST'){
   if(!routing(actor.id)||activePlans>=2)return reply(res,429,{error:'routing_limit'});const b=await body(req);activePlans++;try{return reply(res,200,{ok:true,data:await service.plan(actor,{request:b.request})});}finally{activePlans--;}
  }
  if(p===BASE+'/task'&&req.method==='POST'){const b=await body(req);if(typeof b.idempotency_key!=='string'||!/^[0-9a-f-]{36}$/.test(b.idempotency_key))return reply(res,400,{error:'idempotency_key_required'});if(!routing(actor.id)||activePlans>=2)return reply(res,429,{error:'routing_limit'});activePlans++;try{return reply(res,200,{ok:true,data:await service.createTask(actor,b)});}finally{activePlans--;}}
  return reply(res,404,{error:'not_found'});
 };
}

