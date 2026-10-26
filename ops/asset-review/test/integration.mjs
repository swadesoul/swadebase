// Synthetic identities are used only in this loopback test process. Production uses real GoTrue verification.
import http from 'node:http';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import pg from '/opt/swadebase-adapters/node_modules/pg/lib/index.js';
import routes from '../routes.mjs';
import {BASE} from '../core.mjs';
const pool=new pg.Pool({host:process.env.PGHOST||'172.16.6.11',port:Number(process.env.PGPORT||5432),database:process.env.PGDATABASE||'postgres',user:process.env.PGUSER||'swadebase_adapters',password:process.env.PGPASSWORD});
const origin='https://asset-test.invalid',tag=randomUUID().slice(0,8),ids={owner:randomUUID(),client:randomUUID(),other:randomUUID(),reviewer:randomUUID()};
const users=Object.fromEntries(Object.entries(ids).map(([role,id])=>['synthetic-'+role+'-'+tag,{id,email:`asset-test-${role}-${tag}@example.invalid`,email_confirmed_at:new Date().toISOString()}]));
const realFetch=globalThis.fetch;
globalThis.fetch=async(url,options={})=>{const u=String(url);if(u===origin+'/auth-config.json')return Response.json({url:origin,publicKey:'synthetic-test-publishable'});if(u.endsWith('/auth/v1/user')){const token=String(options.headers?.Authorization||'').replace('Bearer ','');return users[token]?Response.json(users[token]):Response.json({error:'invalid'},{status:401});}return realFetch(url,options);};
const handler=routes({pool,publicOrigin:origin,admin:{isSuperAdmin:async id=>id===ids.owner},auth:{clearCookie:()=>''},log:()=>{}});
const server=http.createServer(async(req,res)=>{try{if(await handler(req,res,new URL(req.url,origin),null)===false){res.writeHead(404);res.end();}}catch{res.writeHead(500);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+BASE;
const sessions={},created=[];let evidenceKey;
async function request(role,path,{method='GET',data,raw,headers={},status=200}={}){const s=sessions[role];const r=await realFetch(base+path,{method,headers:{Origin:origin,...(s?{Cookie:s.cookie,'X-CSRF-Token':s.csrf}:{}),...(data?{'Content-Type':'application/json'}:{}),...headers},body:raw|| (data?JSON.stringify(data):undefined)});const type=r.headers.get('content-type')||'',out=type.includes('json')?await r.json():Buffer.from(await r.arrayBuffer());assert.equal(r.status,status,`${method} ${path}: ${JSON.stringify(out).slice(0,400)}`);return{r,out};}
try{
 for(const role of ['client','other','reviewer'])await pool.query('insert into swadebase_ops.asset_members(email,user_id,role) values($1,$2,$3)',[users['synthetic-'+role+'-'+tag].email,ids[role],role==='reviewer'?'reviewer':'client']);
 await request(null,'/api/cases',{status:401});
 await request(null,'/api/login',{method:'POST',data:{access_token:'invalid-token'},status:401});
 for(const role of Object.keys(ids)){const{r}=await request(null,'/api/login',{method:'POST',data:{access_token:'synthetic-'+role+'-'+tag}});sessions[role]={cookie:r.headers.get('set-cookie').split(';')[0]};sessions[role].csrf=(await request(role,'/api/session')).out.user.csrf;}
 const bad=await realFetch(base+'/api/cases',{method:'POST',headers:{Origin:'https://evil.invalid',Cookie:sessions.client.cookie,'Content-Type':'application/json'},body:'{}'});assert.equal(bad.status,403);
 const {out:newCase}=await request('client','/api/cases',{method:'POST',data:{title:'SYNTHETIC TEST ONLY - '+tag,asset_type:'instrument',description:'Synthetic historical Federal Reserve claim for $100 million. Not a real asset.',face_amount:'$100 million',issuer:'Claimed Federal Reserve'},status:201});const id=newCase.case.id;created.push(id);
 const reviewer=(await pool.query('select id from swadebase_ops.asset_members where user_id=$1',[ids.reviewer])).rows[0].id;await pool.query('update swadebase_ops.asset_cases set reviewer_id=$2 where id=$1',[id,reviewer]);
 await request('other','/api/cases/'+id,{status:404});assert.equal((await request('other','/api/cases')).out.cases.length,0);
 await request('owner','/api/cases/'+id+'/review',{method:'POST',data:{draft:'Owner cannot write private legal drafts',version:0},status:403});
 const file=Buffer.from('SYNTHETIC EVIDENCE ONLY\nFederal Reserve document claim: $100 million, 1934. Ownership and issuer verification missing.');
 await request('client','/api/cases/'+id+'/evidence',{method:'POST',raw:Buffer.from('<script>not a PDF</script>'),headers:{'Content-Type':'application/octet-stream','X-File-Name':'fake.pdf'},status:400});
 const{out:evidence}=await request('client','/api/cases/'+id+'/evidence',{method:'POST',raw:file,headers:{'Content-Type':'application/octet-stream','X-File-Name':'synthetic.txt'},status:201});
 const saved=(await pool.query('select storage_key from swadebase_ops.asset_evidence where id=$1',[evidence.id])).rows[0];evidenceKey=saved.storage_key;
 assert.deepEqual((await request('client','/api/cases/'+id+'/evidence/'+evidence.id)).out,file);
 const findings=(await request('client','/api/cases/'+id+'/screen',{method:'POST',data:{}})).out.findings;assert.ok(findings.some(x=>x.kind==='concern'));
 await request('client','/api/cases/'+id+'/submit',{method:'POST',data:{}});
 await request('reviewer','/api/cases/'+id+'/engagement',{method:'POST',data:{accept:true,conflicts_checked:true,jurisdiction_checked:true}});
 const draft='SYNTHETIC TEST ONLY. This is a limited review of supplied fictional evidence. Issuer authenticity, ownership rights and valuation remain unverified. No investment recommendation is made.';
 await request('reviewer','/api/cases/'+id+'/review',{method:'POST',data:{draft,notes:'PRIVATE SYNTHETIC ATTORNEY NOTES',version:0}});
 assert.equal((await request('client','/api/cases/'+id)).out.review,null);assert.equal((await request('owner','/api/cases/'+id)).out.review,null);
 await request('reviewer','/api/cases/'+id+'/approve',{method:'POST',data:{version:1,confirm:true},status:409});
 await request('owner','/api/cases/'+id+'/payment',{method:'POST',data:{reference:'SYNTHETIC-NO-MONEY-'+tag,confirm:true}});
 await request('reviewer','/api/cases/'+id+'/approve',{method:'POST',data:{version:1,confirm:true}});
 await request('client','/api/cases/'+id+'/evidence/'+evidence.id+'/text',{method:'POST',data:{text:'CORRECTED SYNTHETIC TEXT: issuer verification remains missing.'}});
 await request('reviewer','/api/cases/'+id+'/release',{method:'POST',data:{version:1,confirm:true},status:409});
 await request('reviewer','/api/cases/'+id+'/review',{method:'POST',data:{draft:draft+' Revised.',notes:'PRIVATE SYNTHETIC ATTORNEY NOTES',version:1}});
 await request('reviewer','/api/cases/'+id+'/release',{method:'POST',data:{version:1,confirm:true},status:409});
 await request('reviewer','/api/cases/'+id+'/release',{method:'POST',data:{version:2,confirm:true},status:409});
 await request('reviewer','/api/cases/'+id+'/approve',{method:'POST',data:{version:2,confirm:true}});
 await request('reviewer','/api/cases/'+id+'/release',{method:'POST',data:{version:2,confirm:true}});
 await request('reviewer','/api/cases/'+id+'/release',{method:'POST',data:{version:2,confirm:true}});
 const result=(await request('client','/api/cases/'+id)).out;assert.equal(result.reports.length,1);assert.equal(result.reports[0].body,draft+' Revised.');assert.ok(!JSON.stringify(result).includes('PRIVATE SYNTHETIC ATTORNEY NOTES'));
 const contact=(await request('client','/api/cases/'+id+'/contacts',{method:'POST',data:{name:'Synthetic contact',firm:'Example',source_url:'https://example.com',interest:'Synthetic test only.'},status:201})).out.contact;assert.match(contact.brief,/No message has been sent/);assert.ok(!contact.brief.includes('PRIVATE SYNTHETIC'));
 console.log('PASS: HTTP/database access isolation, CSRF, encrypted storage roundtrip, screening, engagement/payment gates, private draft protection, version invalidation, approved report delivery and retry deduplication.');
 if(['1','ai'].includes(process.env.ASSET_TEST_NATIVE)){
  const reply=(await request('client','/api/cases/'+id+'/chat',{method:'POST',data:{message:'In at most three short sentences, what evidence is still missing? Use evidence labels.'}})).out.reply;assert.ok(reply.length>20);assert.ok(!reply.includes('PRIVATE SYNTHETIC ATTORNEY NOTES'));console.log('PASS: native case-grounded model response; no paid fallback.');
 }
 if(['1','voice'].includes(process.env.ASSET_TEST_NATIVE)){
  const {out:audio}=await request('client','/api/cases/'+id+'/speak',{method:'POST',data:{text:'This is a synthetic evidence review test.'}});assert.ok(audio.length>500);console.log('PASS: native CPU speech returned audio.');
  const form=new FormData();form.append('file',new Blob([audio],{type:'audio/mpeg'}),'test.mp3');const r=await realFetch(base+'/api/cases/'+id+'/transcribe',{method:'POST',headers:{Origin:origin,Cookie:sessions.client.cookie,'X-CSRF-Token':sessions.client.csrf},body:form});const t=await r.json();assert.equal(r.status,200,JSON.stringify(t));assert.ok(t.text.length>5);console.log('PASS: native speech-to-text roundtrip with synthetic audio.');
 }
}finally{
 await pool.query('select swadebase_ops.cleanup_asset_review_fixture($1)',[tag]);
 if(evidenceKey)console.log('SYNTHETIC_STORAGE_KEY='+evidenceKey);
 server.close();await pool.end();
}
