import test from 'node:test';import assert from 'node:assert/strict';import http from 'node:http';
import promoRoutes from './route.mjs';import {SITES,configFor,ADAPTER_ID,OFFERS,normalizePromoMode,DEFAULT_PROMO_MODE} from './catalog.mjs';
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

test('sponsor config is unchanged and never includes checkout links',()=>{
  assert.equal(DEFAULT_PROMO_MODE,'sponsor');
  assert.equal(normalizePromoMode('offers'),'offers');
  assert.equal(normalizePromoMode('sponsor'),'sponsor');
  assert.equal(normalizePromoMode(''), 'sponsor');
  assert.equal(normalizePromoMode(undefined),'sponsor');
  for(const id of Object.keys(SITES)){
    const c=configFor(id);
    const json=JSON.stringify(c);
    assert.equal(c.mode,undefined);
    assert.equal(c.offer,undefined);
    assert.equal(c.checkoutEnabled,false);
    assert.equal(c.productionEnabled,false);
    assert.equal(c.primaryLabel,'Explore campaign options');
    assert.equal(c.primaryUrl,'https://swadebase.cloud/adapters/promo/?site='+encodeURIComponent(id));
    assert.equal(c.status,'Campaign planning preview. Paid delivery and checkout are not active.');
    assert(!json.includes('buy.stripe.com'));
    assert(!json.includes('Get ReSing Pro'));
  }
});
test('offers mode only applies when requested and pending offers are not buyable',()=>{
  const resing=configFor('resinglab',{mode:'offers'});
  assert.equal(resing.mode,'offers');
  assert.equal(resing.offer.enabled,true);
  assert.equal(resing.primaryUrl,'https://buy.stripe.com/bJeaEQ2zg16ebJa1YwdfG02');
  assert.equal(resing.offer.secondaryUrl,'https://buy.stripe.com/dRm00c8XEcOW00sgTqdfG03');
  assert.match(resing.offer.title,/ReSing Lab/);
  assert(!/unlimited/i.test(JSON.stringify(resing)));
  const maestro=configFor('maestroradio',{mode:'offers'});
  assert.equal(maestro.offer.enabled,true);
  assert.equal(maestro.primaryUrl,'https://buy.stripe.com/14A5kw6Pw5mu8wY6eMdfG04');
  assert.equal(maestro.primaryLabel,'Buy paid airplay');
  assert(!/\$/.test(maestro.primaryLabel));
  assert(!/immediate/i.test(JSON.stringify(maestro)));
  assert(!/DJ-?voice/i.test(JSON.stringify(maestro)));
  const vsw=configFor('videosaywhat',{mode:'offers'});
  assert.equal(vsw.offer.primaryUrl,'https://buy.stripe.com/7sY9AM8XE7uC14wfPmdfG06');
  assert.equal(vsw.offer.secondaryUrl,'https://buy.stripe.com/cNiaEQfm22ai6oQfPmdfG07');
  const tales=configFor('blacktales',{mode:'offers'});
  assert.equal(tales.offer.primaryUrl,'https://buy.stripe.com/28E4gsddU5mu7sUeLidfG08');
  assert.match(tales.primaryLabel,/\$20/);
  const abagale=configFor('abagale',{mode:'offers'});
  assert.equal(abagale.offer.enabled,false);
  assert.equal(abagale.offer.primaryUrl,'');
  assert.equal(abagale.primaryUrl,configFor('abagale').primaryUrl);
  assert.equal(abagale.offer.previewUrl,'https://buy.stripe.com/8x24gs2zg5mu8wYdHedfG05');
  const league=configFor('theleaguesound',{mode:'offers'});
  assert.equal(league.offer.enabled,false);
  assert.equal(league.offer.primaryUrl,'');
  assert.equal(league.offer.previewUrl,undefined);
  assert.match(league.offer.pendingReason,/[Pp]ricing/);
  assert.equal(configFor('teachvirt',{mode:'offers'}).offer.enabled,false);
  assert.equal(OFFERS.resinglab.enabled,true);
});
test('preview=offers returns offer config while the registry stays in sponsor mode',async()=>{
  const pool={query:async(sql,args)=>{assert.equal(args[0],ADAPTER_ID);return {rows:[{enabled:true,status:'live',connections:{promoMode:'sponsor'}}]}}};
  const handler=promoRoutes({pool,auth:{checkTokenOk:()=>false}});
  const app=http.createServer(async(req,res)=>{const done=await handler(req,res,new URL(req.url,'http://localhost'),null);if(done===false){res.writeHead(418);res.end('unrelated')}});
  await new Promise(r=>app.listen(0,'127.0.0.1',r));
  const base='http://127.0.0.1:'+app.address().port;
  try{
    let r=await fetch(base+'/adapters/promo/config.json?site=resinglab');
    assert.equal(r.status,200);
    let c=await r.json();
    assert.equal(c.data.mode,undefined);
    assert.equal(c.data.primaryLabel,'Explore campaign options');
    assert(!JSON.stringify(c.data).includes('buy.stripe.com'));
    r=await fetch(base+'/adapters/promo/config.json?site=resinglab&preview=1');
    c=await r.json();
    assert.equal(c.data.mode,undefined);
    r=await fetch(base+'/adapters/promo/config.json?site=resinglab&preview=offers');
    assert.equal(r.status,200);
    c=await r.json();
    assert.equal(c.data.mode,'offers');
    assert.equal(c.data.offer.primaryUrl,'https://buy.stripe.com/bJeaEQ2zg16ebJa1YwdfG02');
    r=await fetch(base+'/adapters/promo/preview.html');
    assert.equal(r.status,200);
    assert.match(r.headers.get('content-security-policy'),/frame-src 'self'/);
    r=await fetch(base+'/adapters/promo/preview-frame.html');
    assert.equal(r.status,200);
    assert.match(r.headers.get('content-security-policy'),/frame-ancestors 'self'/);
    r=await fetch(base+'/adapters/promo/health');
    assert.equal(r.status,200);
    assert.equal((await r.json()).status,'ok');
  }finally{await new Promise(r=>app.close(r))}
});
test('registry promoMode offers is what go-live flips, and pending sites stay unsaleable',async()=>{
  const pool={query:async(sql,args)=>{assert.equal(args[0],ADAPTER_ID);return {rows:[{enabled:true,status:'live',connections:{promoMode:'offers'}}]}}};
  const handler=promoRoutes({pool,auth:{checkTokenOk:()=>false}});
  const app=http.createServer(async(req,res)=>{await handler(req,res,new URL(req.url,'http://localhost'),null)});
  await new Promise(r=>app.listen(0,'127.0.0.1',r));
  const base='http://127.0.0.1:'+app.address().port;
  try{
    let r=await fetch(base+'/adapters/promo/config.json?site=blacktales');
    let c=await r.json();
    assert.equal(c.data.mode,'offers');
    assert.equal(c.data.offer.enabled,true);
    r=await fetch(base+'/adapters/promo/config.json?site=theleaguesound');
    c=await r.json();
    assert.equal(c.data.offer.enabled,false);
    assert.equal(c.data.offer.primaryUrl,'');
    assert(!JSON.stringify(c.data.offer).includes('buy.stripe.com'));
  }finally{await new Promise(r=>app.close(r))}
});
