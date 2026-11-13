import {McpServer,createMcpHandler} from '@modelcontextprotocol/server';
import {toNodeHandler} from '@modelcontextprotocol/node';
import * as z from 'zod/v4';
export async function serveProviderBridge(req,res,{pool,provider,site}) {
 const handler=createMcpHandler(()=>{
  const server=new McpServer({name:'swadebase-providers',version:'1.0.0'},{instructions:'Use the SWADEBASE provider catalog and verified quotes. Registered is not execution-ready. Together chat uses the shared budget and watchdog. Other providers require their existing validated execution adapters; do not claim generation merely from a quote. Never request or reveal provider keys.'});
  const wrap=fn=>async args=>{try{const value=await fn(args);return {content:[{type:'text',text:JSON.stringify(value)}],structuredContent:value};}catch(e){return {isError:true,content:[{type:'text',text:JSON.stringify({error:e.code||'provider_request_unavailable',retryable:false})}]};}};
  server.registerTool('swade_provider_catalog',{description:'Discover centrally registered providers and their rate cards. New SWADEBASE providers appear automatically. Separate registration from verified execution support.',inputSchema:z.object({}).strict(),annotations:{readOnlyHint:true}},wrap(async()=>{
   const {rows:accounts}=await pool.query("SELECT provider,display_name,billing,hard_stop_usd,low_balance_usd,balance_usd,opening_balance_recorded FROM swadebase_ops.ai_provider_balances ORDER BY provider");
   const {rows:rates}=await pool.query("SELECT provider,model,unit,usd_per_unit,verified_at FROM swadebase_ops.ai_rate_cards WHERE active ORDER BY provider,model,unit");
   return {site,providers:accounts.map(a=>({...a,execution_via_this_adapter:a.provider==='together'?'chat':'catalog_and_quote_only',rates:rates.filter(r=>r.provider===a.provider)})),secret_values_exposed:false};
  }));
  server.registerTool('swade_provider_quote',{description:'Calculate a non-spending quote from verified SWADEBASE rate cards. A quote does not start a job or grant spending permission.',inputSchema:z.object({provider:z.string().min(1).max(80),model:z.string().min(1).max(160),units:z.record(z.string(),z.number().nonnegative().max(1000000))}).strict(),annotations:{readOnlyHint:true}},wrap(async({provider:vendor,model,units})=>{
   const {rows}=await pool.query("SELECT unit,usd_per_unit,verified_at FROM swadebase_ops.ai_rate_cards WHERE provider=$1 AND model=$2 AND active AND verified_at IS NOT NULL",[vendor,model]);
   const rates=Object.fromEntries(rows.map(r=>[r.unit,Number(r.usd_per_unit)]));
   if(!Object.keys(units).length||Object.keys(units).some(k=>rates[k]===undefined))throw Error('verified_rates_required');
   const estimate=Object.entries(units).reduce((n,[k,v])=>n+v*rates[k],0);
   return {provider:vendor,model,estimated_usd:Math.ceil(estimate*1e6)/1e6,execution_started:false,spending_authorized:false};
  }));
  return server;
 },{responseMode:'json',legacy:'stateless'});
 try{await toNodeHandler(handler,{maxRequestBodySize:65536})(req,res);}finally{await handler.close();}
}
