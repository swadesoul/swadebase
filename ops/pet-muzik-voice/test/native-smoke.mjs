
import {makePool} from '/opt/swadebase-adapters/lib/db.mjs';
const pool=makePool();
let ledger,requestId;const user=process.env.PM_SMOKE_USER;
try {
requestId="pm-voice-smoke-"+Date.now();const r=await pool.query("select swadebase_ops.pet_muzik_record_voice($1,'voice-connection-smoke-speech',$2::jsonb,$3) as ledger_id",[user,JSON.stringify({character:35}),requestId]); ledger=r.rows[0].ledger_id;
const h={Authorization:'Bearer '+process.env.ASSET_VOICE_TOKEN};
const s=await fetch('http://172.16.0.1:8790/v1/speak',{method:'POST',headers:{...h,'Content-Type':'application/json'},body:JSON.stringify({text:'My dog Ruby loves her evening walks.',voice:'kokoro:af_alloy',engine:'kokoro',format:'wav'}),signal:AbortSignal.timeout(90000)});
if(!s.ok||s.headers.get('x-engine')!=='kokoro')throw Error('Native speech failed');
const audio=await s.arrayBuffer();
await pool.query("select swadebase_ops.pet_muzik_finish_voice($1,$2,$3,'ok')",[ledger,user,requestId]);
const duration=Number(s.headers.get('x-audio-seconds'));
requestId="pm-stt-smoke-"+Date.now();const t=await pool.query("select swadebase_ops.pet_muzik_record_voice($1,'voice-connection-smoke-stt',$2::jsonb,$3) as ledger_id",[user,JSON.stringify({audio_second:duration}),requestId]);ledger=t.rows[0].ledger_id;
const form=new FormData();form.append('file',new Blob([audio],{type:'audio/wav'}),'synthetic.wav');form.append('language','en');
const stt=await fetch('http://172.16.0.1:8790/v1/voicebox/transcribe',{method:'POST',headers:h,body:form,signal:AbortSignal.timeout(90000)});
if(!stt.ok)throw Error('Native transcription failed');
const j=await stt.json();await pool.query("select swadebase_ops.pet_muzik_finish_voice($1,$2,$3,'ok')",[ledger,user,requestId]);
console.log(JSON.stringify({speech_engine:'kokoro',audio_bytes:audio.byteLength,seconds:duration,transcript:j.transcript,paid_fallback:false}));
} catch(e) { if(ledger)await pool.query("select swadebase_ops.pet_muzik_finish_voice($1,$2,$3,'failed')",[ledger,user,requestId]);console.log(JSON.stringify({error:e.message}));process.exitCode=1; } finally {await pool.end();}
