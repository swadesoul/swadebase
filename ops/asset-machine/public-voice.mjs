import {randomBytes,createHash,timingSafeEqual} from 'node:crypto';
import {readFile} from 'node:fs/promises';
const fail=(n,m)=>Object.assign(Error(m),{status:n});
const hash=s=>createHash('sha256').update(s).digest('hex');
const same=(a,b)=>typeof a==='string'&&typeof b==='string'&&Buffer.byteLength(a)===Buffer.byteLength(b)&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
const topics={sblc:/\bsblc|standby|letter of credit|mt760|bank guarantee/i,inherited:/inherit|deceased|family member|estate|beneficiary registration/i,bonds:/\bbond|certificate|cusip|coupon|maturity|treasury/i,physical:/\bgold\b|gem|diamond|mineral|bullion|assay|precious metal/i,unknown:/golden dragon|golden drum|golden gun|unidentified|not know what|don't know what/i,desks:/trade desk|trading desk|professional|broker|custodian|trade.finance|who.*contact/i,digital:/wallet|contract|token|blockchain|oracle|crypto|digital asset/i};
export function guideAnswer(question,level,guides){
 if(/private.*(note|record|case|project)|show.*(account|balance)|ignore.*(rule|instruction)/i.test(question))return{answer:'I can explain the public guides and site features. This conversation cannot open private projects, accounts or attorney notes. Sign into your secure workspace for your own project.',sources:[]};
 if(/danny|attorney|legal review|review fee|how.*site|how.*machine|how.*work|sign.in|upload|directory|price|cost|payment/i.test(question)&&!Object.values(topics).some(re=>re.test(question)))return{answer:'Asset Machine helps you understand an asset, organize supporting evidence and identify the next review step. Open a private project to upload documents and record screening findings. Danny Byers’s separate project review is $500, subject to engagement, scope, conflicts and jurisdiction checks; eligible account exemptions apply. The organization directory is still being developed. Online checkout, external attestation feeds and token issuance are not enabled. This public conversation does not authenticate or value an asset.',sources:[]};
 const priority=['unknown','sblc','inherited','physical','digital','bonds','desks'];const slug=priority.find(k=>topics[k].test(question));
 if(!slug)return{answer:'I can help with the public guides on bonds, SBLCs, inherited documents, gold and gems, wallets and tokenization, or choosing the right professional. Which of those fits your question? For project-specific conclusions, use your secure workspace and the appropriate qualified reviewer.',sources:[]};
 const g=guides.find(x=>x.slug===slug);if(!g)return{answer:'Please open the relevant guide for this topic.',sources:[]};
 const detail=/document|evidence|requirement|need|check|verif|authentic/i.test(question)?' What to collect: '+g.checks.join(' '):' Next step: '+g.steps[0];
 return{answer:(level==='professional'?g.professional:g.plain)+detail+' [G1]',sources:[{label:'G1',name:g.name,url:g.url}]};
}
export default function publicVoiceRoutes({BASE,publicOrigin,json,body,rate,voice}){
 const sessions=new Map(),allowed=new Set([publicOrigin,'https://assetmachine.live']);let busy=0;
 let knowledge;async function guideData(){if(!knowledge)knowledge=JSON.parse(await readFile(new URL('./public-guide-knowledge.json',import.meta.url),'utf8'));return knowledge;}
 return async(req,res,p)=>{
  if(!p.startsWith('/api/public-voice/'))return false;
  if(req.method!=='POST')throw fail(405,'Use the homepage voice controls.');
  if(!allowed.has(String(req.headers.origin||'')))throw fail(403,'Open voice from the official Asset Machine site.');
  const peer=String(req.socket.remoteAddress||'unknown');const trusted=['127.0.0.1','::1','::ffff:127.0.0.1'].includes(peer);const ip=hash(trusted?String(req.headers['x-real-ip']||peer):peer);
  if(p==='/api/public-voice/session'){
   if(!rate('public-voice-sessions:'+ip,12,3600000)||!rate('public-voice-session-global',180,3600000))throw fail(429,'Public voice is busy. The guides remain available.');
   for(const[k,v]of sessions)if(v.exp<Date.now())sessions.delete(k);if(sessions.size>500)throw fail(429,'Public voice is busy.');
   const token=randomBytes(32).toString('base64url'),csrf=randomBytes(24).toString('base64url');sessions.set(hash(token),{csrf,ip,exp:Date.now()+15*60000,id:'public-'+randomBytes(12).toString('hex')});
   json(res,200,{csrf,expires_in:900,engine:'swadebase-kokoro',scope:'Public guides only. No private project access.'},{'Set-Cookie':`am_public_voice=${token}; Path=${BASE}/api/public-voice; HttpOnly; Secure; SameSite=Strict; Max-Age=900`});return true;
  }
  const cookie=String(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('am_public_voice='))?.split('=')[1]||'';const s=sessions.get(hash(cookie));
  if(!s||s.exp<Date.now()||s.ip!==ip||!same(req.headers['x-public-voice-csrf'],s.csrf))throw fail(401,'Your public voice session expired. Start the voice disc again.');
  if(!rate('public-voice-ip:'+ip,30,3600000)||!rate('public-voice-global',240,3600000))throw fail(429,'Public voice allowance reached. You can continue reading the guides.');
  if(!['/api/public-voice/ask','/api/public-voice/speak','/api/public-voice/transcribe'].includes(p))throw fail(404,'Voice action not found.');
  if(busy>=2)throw fail(503,'Voice is helping another visitor. Please retry shortly.');busy++;
  try{
   if(p.endsWith('/speak')){await voice(req,res,{id:s.id},'/speak');return true;}
   if(p.endsWith('/transcribe')){await voice(req,res,{id:s.id},'/transcribe');return true;}
   const b=await body(req,6000),question=String(b.question||'').trim().slice(0,1200);if(question.length<3)throw fail(400,'Ask a question about the site or its asset guides.');
   const result=guideAnswer(question,b.level,await guideData());
   json(res,200,{...result,engine:'curated-public-guides',speech_engine:'swadebase-kokoro',scope:'Public education only; no asset was authenticated or valued.'});return true;
  }finally{busy--;}
 };
}
