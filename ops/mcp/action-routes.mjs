import {readFile} from 'node:fs/promises';
export function makeActionRoutes({service,auth,actorFromSession,body,reply,go}){
 const base='/adapters/api/mcp-connect/actions',page='/adapters/mcp/actions';
 return async(req,res,url,session)=>{
  const p=url.pathname,isPage=p===page,isJs=p===page+'.js';
  if(!isPage&&!isJs&&!p.startsWith(base))return false;
  const actor=await actorFromSession(session);
  if(!actor){if(isPage&&!session)return go(res,'/adapters/login?next=%2Fadapters%2Fmcp%2Factions');return reply(res,403,{error:'owner_session_required'});}
  if(service.actions.isOwner&&!await service.actions.isOwner(actor))return reply(res,403,{error:'founder_owner_required'});
  actor.channel='owner_session';
  if((isPage||isJs)&&req.method==='GET'){
   const content=await readFile(new URL(isJs?'./action-console.js':'./action-console.html',import.meta.url));
   res.writeHead(200,{'content-type':isJs?'text/javascript':'text/html; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"});return res.end(content);
  }
  try{
   if(req.method==='GET'&&p===base)return reply(res,200,{ok:true,data:{capabilities:await service.actions.capabilities(actor),actions:await service.actions.list(actor)}});
   if(req.method==='GET'&&p===base+'/payment-account')return reply(res,200,{ok:true,data:await service.actions.paymentAccount(actor)});
   if(req.method!=='POST')return reply(res,405,{error:'method_not_allowed'});
   if(req.headers.origin!=='https://swadebase.cloud'||!auth.csrfOk(req,session))return reply(res,403,{error:'forbidden'});
   const input=await body(req);
   if(p===base+'/decision')return reply(res,200,{ok:true,data:await service.actions.ownerDecision(actor,input)});
   if(p===base+'/disable-payments')return reply(res,200,{ok:true,data:await service.actions.ownerDisablePayments(actor,input)});
   if(p===base+'/payment-rules')return reply(res,200,{ok:true,data:await service.actions.ownerRules(actor,input)});
   return reply(res,404,{error:'not_found'});
  }catch(e){return reply(res,e.status||500,{error:e.code||'operation_failed',message:e.code?e.message:'The owner action could not complete.'});}
 };
}
