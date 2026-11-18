import test from 'node:test';import assert from 'node:assert/strict';import http from 'node:http';
import promoRoutes from './route.mjs';import {SITES,configFor,ADAPTER_ID} from './catalog.mjs';
test('site-specific copy preserves one public contract and explicit preview state',()=>{const ids=Object.keys(SITES);assert(ids.length>=30);assert.equal(configFor('unknown'),null);const titles=new Set();for(const id of ids){const c=configFor(id);assert.equal(c.checkoutEnabled,false);assert.equal(c.productionEnabled,false);assert.equal(c.theme.source,'host-site');assert.deepEqual(c.tiers.map(t=>t.id),['soft','medium','heavy']);assert(!titles.has(c.site.title));titles.add(c.site.title);assert(c.primaryUrl.startsWith('https://swadebase.cloud/adapters/promo/?site='));for(const host of c.site.hosts)assert(!host.includes('/'));}assert(configFor('resinglab').site.summary.includes('theme'));assert(configFor('teachvirt').site.summary.includes('course'));});
test('public metadata, private skill, kill switch and route isolation',async()=>{
 let enabled=true;const pool={query:async(sql,args)=>{assert.equal(args[0],ADAPTER_ID);return {rows:[{enabled,status:'live'}]}}};
 const handler=promoRoutes({pool,auth:{checkTokenOk:r=>r.headers.authorization==='Bearer fixture-check'}});
 const app=http.createServer(async(req,res)=>{try{const done=await handler(req,res,new URL(req.url,'http://localhost'),null);if(done===false){res.writeHead(418);res.end('unrelated')}}catch{res.writeHead(500);res.end('error')}});await new Promise(r=>app.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.address().port;
 try{let r=await fetch(base+'/adapters/promo/config.json?site=brainiak');assert.equal(r.status,200);const c=await r.json();assert.equal(c.data.site.id,'brainiak');assert.equal(r.headers.get('access-control-allow-origin'),'*');assert(!JSON.stringify(c).includes('fixture-check'));
 assert.equal((await fetch(base+'/adapters/promo/config.json?site=../../etc/passwd')).status,404);
 assert.equal((await fetch(base+'/api/adapters/swade-universal-promo/skill')).status,401);
 r=await fetch(base+'/api/adapters/swade-universal-promo/skill',{headers:{authorization:'Bearer fixture-check'}});assert.equal(r.status,200);assert.match((await r.json()).data.instructions,/aesthetics/);
 assert.equal((await fetch(base+'/adapters/promo/widget.js')).status,200);assert.equal((await fetch(base+'/adapters/promo/widget.css')).status,200);
 r=await fetch(base+'/adapters/promo/');assert.equal(r.status,200);assert.match(r.headers.get('content-security-policy'),/frame-ancestors 'none'/);assert.match(await r.text(),/checkout are not active/);
 assert.equal((await fetch(base+'/adapters/promo/config.json?site=brainiak',{method:'POST'})).status,405);assert.equal((await fetch(base+'/other')).status,418);
 enabled=false;const paused=promoRoutes({pool,auth:{checkTokenOk:()=>false}});const fake={writeHead(status){this.status=status},end(v){this.value=v}};await paused({method:'GET'},fake,new URL('http://localhost/adapters/promo/config.json?site=brainiak'),null);assert.equal(fake.status,423);
 }finally{await new Promise(r=>app.close(r))}
});
