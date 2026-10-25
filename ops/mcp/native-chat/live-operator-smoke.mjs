// Deployment operator only: a new, short-lived test identity; no existing secret is read.
import {execFileSync} from 'node:child_process';import {randomUUID,randomBytes} from 'node:crypto';import assert from 'node:assert/strict';
const sql=s=>execFileSync('docker',['exec','-i','supabase-db','psql','-U','postgres','-v','ON_ERROR_STOP=1','-At'],{input:s,encoding:'utf8'}).trim();
const lit=s=>"'"+String(s).replaceAll("'","''")+"'";
const userId=randomUUID(),threadId=randomUUID(),messageId=randomUUID(),email='operator-test-'+randomUUID()+'@example.invalid',password=randomBytes(32).toString('base64url');
let token,created=false;const result={};
try{
 const cryptSchema=sql("select n.nspname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.proname='crypt' limit 1");assert(['extensions','public'].includes(cryptSchema));
 sql(`BEGIN;insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,confirmation_token,recovery_token,email_change_token_new,email_change,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values('00000000-0000-0000-0000-000000000000',${lit(userId)},'authenticated','authenticated',${lit(email)},${cryptSchema}.crypt(${lit(password)},${cryptSchema}.gen_salt('bf')),now(),'','','','','{"provider":"email","providers":["email"]}','{"deployment_test":true}',now(),now());insert into public.user_roles(user_id,role) values(${lit(userId)},'super_admin');insert into sssbrain.threads(id,user_id,title) values(${lit(threadId)},${lit(userId)},'Temporary operator deployment verification');COMMIT;`);created=true;
 const cfg=await (await fetch('https://swadebase.cloud/auth-config.json')).json();
 const login=await fetch(cfg.url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:cfg.publicKey,'content-type':'application/json'},body:JSON.stringify({email,password})});
 assert.equal(login.status,200,'Temporary test identity login failed');token=(await login.json()).access_token;assert(token);
 const headers={'content-type':'application/json','x-sssbrain-authorization':'Bearer '+token};
 const payload={messages:[{id:messageId,role:'user',parts:[{type:'text',text:'Save a plan in my brain for a school basketball anthem and promotional video. Deployment verification only; do not start production.'}]}],threadId};
 const invoke=b=>fetch('https://sssbrain.live/api/chat',{method:'POST',headers,body:JSON.stringify(b),signal:AbortSignal.timeout(20000)});
 const first=await invoke(payload);assert.equal(first.status,200);assert.equal(first.headers.get('x-swade-operator'),'1.1','New native operator path is not active');const stream=await first.text();
 assert.match(stream,/Saved and read back/);assert.match(stream,/Production has not started/);assert(!stream.includes(token));
 const count=sql(`select count(*) from sssbrain.brain_wiki_pages where user_id=${lit(userId)} and slug like 'ecosystem-plan-%';`);assert.equal(count,'1');
 const saved=sql(`select body_markdown from sssbrain.brain_wiki_pages where user_id=${lit(userId)} and slug like 'ecosystem-plan-%';`);assert.match(saved,/The League Sound/);assert.match(saved,/ReSing Lab/);assert.match(saved,/VideoSayWhat/);
 const repeat=await invoke(payload);assert.equal(repeat.status,200);assert.match(await repeat.text(),/Saved and read back/);assert.equal(sql(`select count(*) from sssbrain.brain_wiki_pages where user_id=${lit(userId)} and slug like 'ecosystem-plan-%';`),'1');
 const denied=await invoke({...payload,threadId:randomUUID()});assert.equal(denied.status,403);
 sql(`delete from public.user_roles where user_id=${lit(userId)} and role='super_admin';`);
 const blocked=await fetch('https://swadebase.cloud/adapters/operator/route',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+token},body:JSON.stringify({request:'Prepare a school anthem',rules_only:true})});assert.equal(blocked.status,403);
 result.native_chat='signed-in HTTPS plan/save/readback passed';result.idempotency='same submitted message retained one draft';result.authorization='foreign thread denied; removed operator role denied';result.production='not started';result.paid_calls=0;
}finally{
 if(created){sql(`BEGIN;delete from sssbrain.messages where user_id=${lit(userId)};delete from sssbrain.brain_wiki_pages where user_id=${lit(userId)};delete from sssbrain.threads where user_id=${lit(userId)};delete from public.user_roles where user_id=${lit(userId)};delete from auth.users where id=${lit(userId)};COMMIT;`);result.cleanup='temporary identity, role, thread, messages and knowledge draft removed';}
}
console.log(JSON.stringify(result));
