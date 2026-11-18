import {readFile} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {ADAPTER_ID,BASE,ORIGIN,VERSION,SITES,configFor} from './catalog.mjs';
const files={'swade-promo-loader.js':['swade-promo-loader.js','text/javascript'],'theme.mjs':['theme.mjs','text/javascript'],'widget.js':['widget.js','text/javascript'],'widget.css':['widget.css','text/css'],'detail.js':['detail.js','text/javascript'],'detail.css':['detail.css','text/css'],'':['detail.html','text/html; charset=utf-8']};
export default function promoRoutes({pool,auth}){
 let cacheUntil=0,enabled=false;
 async function live(){if(Date.now()>cacheUntil){const row=(await pool.query('select enabled,status from swadebase_ops.adapters_registry where id=$1',[ADAPTER_ID])).rows[0];enabled=!!row?.enabled&&row.status==='live';cacheUntil=Date.now()+5000;}return enabled;}
 const send=(res,status,value)=>{res.writeHead(status,{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff','access-control-allow-origin':'*'});if(value.ok===false&&typeof value.error==='string')value.error={code:value.error,message:value.error.replaceAll('_',' '),retryable:status>=500};res.end(JSON.stringify({...value,request_id:randomUUID()}));};
 return async(req,res,url,session)=>{
  const skill='/api/adapters/'+ADAPTER_ID+'/skill';
  const statusPath='/api/adapters/'+ADAPTER_ID+'/status';
  if(url.pathname===statusPath){if(!session&&!auth.checkTokenOk(req))return send(res,401,{ok:false,error:'unauthorized'});if(req.method!=='GET')return send(res,405,{ok:false,error:'method_not_allowed'});return send(res,200,{adapter:'promo.campaign-intro',service:ADAPTER_ID,contractVersion:1,ready:false,blockers:['Paid campaign execution and complete ecosystem rollout are not verified.'],capabilities:{actions:['status','skill'],async:false,callbacks:false,formats:['html','json'],limits:{max_theme_duration_s:60},providers:['existing SWADEBASE public content adapter']},version:VERSION,enabled:await live(),time:new Date().toISOString()});}
  if(url.pathname===skill){if(!session&&!auth.checkTokenOk(req))return send(res,401,{ok:false,error:'unauthorized'});if(req.method!=='GET')return send(res,405,{ok:false,error:'method_not_allowed'});if(!await live())return send(res,423,{ok:false,error:'adapter_disabled'});const instructions=await readFile(new URL('./SKILL.md',import.meta.url),'utf8');const manifest=JSON.parse(await readFile(new URL('./plugin.json',import.meta.url),'utf8'));return send(res,200,{ok:true,data:{id:ADAPTER_ID,version:VERSION,manifest,instructions,sha256:createHash('sha256').update(instructions).digest('hex')}});}
  if(url.pathname!==BASE&&!url.pathname.startsWith(BASE+'/'))return false;
  if(req.method!=='GET'&&req.method!=='HEAD')return send(res,405,{ok:false,error:'method_not_allowed'});
  const part=url.pathname===BASE?'':url.pathname.slice(BASE.length+1);
  if(part==='health')return send(res,200,{status:'ok',service:ADAPTER_ID,version:VERSION});
  if(part==='config.json'){if(!await live())return send(res,423,{ok:false,error:'adapter_disabled'});const data=configFor(url.searchParams.get('site')||'');return data?send(res,200,{ok:true,data}):send(res,404,{ok:false,error:'unknown_site'});}
  if(part==='manifest.json')return send(res,200,{id:ADAPTER_ID,version:VERSION,publicConfig:ORIGIN+BASE+'/config.json?site={site}',script:ORIGIN+BASE+'/widget.js',bootstrapTemplate:ORIGIN+BASE+'/swade-promo-loader.js',statusEndpoint:statusPath,skillEndpoint:skill,themeMode:'inherit-host-site',phase:'alpha-preview',checkoutEnabled:false,productionEnabled:false,sites:Object.keys(SITES)});
  const file=files[part];if(!file)return send(res,404,{ok:false,error:'not_found'});
  const content=await readFile(new URL('./'+file[0],import.meta.url));res.writeHead(200,{'content-type':file[1],'cache-control':'public, max-age=60','x-content-type-options':'nosniff','access-control-allow-origin':'*',...(part===''?{'content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",'referrer-policy':'no-referrer'}:{})});res.end(req.method==='HEAD'?undefined:content);
 };
}
