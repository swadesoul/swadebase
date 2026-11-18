import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {Client,StreamableHTTPClientTransport} from '@modelcontextprotocol/client';
const key=JSON.parse(readFileSync('/opt/swade-secrets/minimax-clients.json','utf8')).agents;
const client=new Client({name:'swade-provider-acceptance',version:'1.0.0'});
try {
 await client.connect(new StreamableHTTPClientTransport(new URL('https://swadebase.cloud/adapters/api/llm/mcp'),{requestInit:{headers:{Authorization:'Bearer '+key}}}));
 const list=await client.listTools();assert.deepEqual(list.tools.map(t=>t.name).sort(),['swade_provider_catalog','swade_provider_quote']);
 const catalog=await client.callTool({name:'swade_provider_catalog',arguments:{}});
 assert(!catalog.isError);const parsed=catalog.structuredContent;
 for(const id of ['together','replicate','kie_ai','qwencloud'])assert(parsed.providers.some(p=>p.provider===id));
 const quote=await client.callTool({name:'swade_provider_quote',arguments:{provider:'together',model:'MiniMaxAI/MiniMax-M3.1-Flash',units:{input_token:1000,output_token:1000}}});
 assert(!quote.isError);assert.equal(quote.structuredContent.estimated_usd,0.00075);assert.equal(quote.structuredContent.execution_started,false);
 const bad=await client.callTool({name:'swade_provider_quote',arguments:{provider:'replicate',model:'unknown',units:{image:1}}});assert(bad.isError);
 const report={tools:list.tools.map(t=>t.name),providers:parsed.providers.map(p=>p.provider),quote:quote.structuredContent,unknownRatesBlocked:true,paidCalls:0};
 writeFileSync('/opt/work/together-credit-20261113/provider-mcp-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await client.close();}
