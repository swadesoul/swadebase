import http from 'node:http';
import assert from 'node:assert/strict';
import routes from '../routes.mjs';
const origin='https://assetmachine.live',handler=routes({pool:{query(){throw Error('No database access permitted in public voice');}},publicOrigin:'https://swadebase.cloud',log:console.error});
const server=http.createServer(async(req,res)=>{await handler(req,res,new URL(req.url,origin),null);});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/adapters/asset-machine/api/public-voice';
try{
 const r=await fetch(base+'/session',{method:'POST',headers:{Origin:origin}});assert.equal(r.status,200);const d=await r.json(),headers={Origin:origin,Cookie:r.headers.get('set-cookie').split(';')[0],'X-Public-Voice-CSRF':d.csrf};
 const ask=await fetch(base+'/ask',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({question:'What is an SBLC and can its face amount be treated as cash?'})});const answer=await ask.json();assert.equal(ask.status,200,JSON.stringify(answer));assert.ok(answer.answer.length>20);console.log('CURATED_GUIDE_REPLY',answer.answer);assert.equal(answer.speech_engine,'swadebase-kokoro');
 const speech=await fetch(base+'/speak',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({text:'Asset Machine helps you understand your asset. A bond requires evidence and independent review.'})});assert.equal(speech.status,200,await(speech.ok?Promise.resolve(''):speech.text()));assert.match(speech.headers.get('content-type'),/audio\/mpeg/);const bytes=await speech.arrayBuffer();assert.ok(bytes.byteLength>1000);console.log('KOKORO_MP3_BYTES',bytes.byteLength);
 const form=new FormData();form.append('file',new Blob([bytes],{type:'audio/mpeg'}),'synthetic-voice.mp3');const tr=await fetch(base+'/transcribe',{method:'POST',headers,body:form});const text=await tr.json();assert.equal(tr.status,200,JSON.stringify(text));assert.equal(text.engine,'native-whisper');assert.match(text.text,/asset|bond|review/i);console.log('NATIVE_WHISPER_ROUNDTRIP',text.text);console.log('NATIVE_VOICE_PASS');
}finally{await new Promise(r=>server.close(r));}
