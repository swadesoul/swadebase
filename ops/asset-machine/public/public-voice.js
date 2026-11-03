/* Asset Machine public voice. Existing SWADEBASE Kokoro/Whisper services only. */
(()=>{'use strict';
 const $=s=>document.querySelector(s),disc=$('#public-voice-disc');if(!disc)return;
 const api='/adapters/asset-machine/api/public-voice',consoleNode=$('.voice-console'),state=$('#public-voice-state'),input=$('#public-voice-input'),send=$('#public-voice-send'),stop=$('#public-voice-stop'),replay=$('#public-voice-replay'),log=$('#public-voice-log');
 let session=null,expires=0,controller=null,recorder=null,stream=null,recordTimer=null,player=null,audioURL=null,ctx=null,analyser=null,frame=0,phase='idle',generation=0;
 function setPhase(next,message){phase=next;consoleNode.dataset.state=next;state.textContent=message;send.disabled=['listening','thinking','speaking'].includes(next);stop.hidden=!['listening','thinking','speaking'].includes(next);disc.setAttribute('aria-label',next==='listening'?'Finish recording and ask':next==='thinking'||next==='speaking'?'Stop voice':'Start speaking to Asset Machine');}
 function releaseMic(){clearTimeout(recordTimer);stream?.getTracks().forEach(t=>t.stop());stream=null;}
 function audioContext(){try{ctx ||= new (window.AudioContext||window.webkitAudioContext)();ctx.resume().catch(()=>{});}catch{}}
 function halt(){generation++;controller?.abort();controller=null;if(recorder?.state==='recording'){recorder.onstop=null;recorder.stop();}releaseMic();player?.pause();cancelAnimationFrame(frame);consoleNode.style.setProperty('--voice-level','0');setPhase('idle','Ready for your next question');}
 async function call(action,payload,blob=false){
  if(!session||Date.now()>expires){const r=await fetch(api+'/session',{method:'POST',signal:controller?.signal});const d=await r.json();if(!r.ok)throw Error(d.error?.message||'Voice is temporarily unavailable.');session=d.csrf;expires=Date.now()+d.expires_in*1000-10000;}
  const multipart=payload instanceof FormData,r=await fetch(api+'/'+action,{method:'POST',headers:{'X-Public-Voice-CSRF':session,...(!multipart?{'Content-Type':'application/json'}:{})},body:multipart?payload:JSON.stringify(payload),signal:controller?.signal});
  if(!r.ok){if(r.status===401){session=null;expires=0;}const d=await r.json().catch(()=>({}));throw Error(d.error?.message||'Voice could not finish. Try again or read a guide.');}return blob?r.blob():r.json();
 }
 function message(label,text){const article=document.createElement('article'),small=document.createElement('span'),p=document.createElement('p');small.className='tiny';small.textContent=label;p.textContent=text;article.append(small,p);log.append(article);while(log.children.length>6)log.firstChild.remove();log.scrollTop=log.scrollHeight;}
 function sources(items){const row=document.createElement('div');row.className='voice-sources';for(const s of items||[]){try{const u=new URL(s.url);if(u.origin!=='https://assetmachine.live'||!/^#learn\/[a-z]+$/.test(u.hash))continue;const a=document.createElement('a');a.href=u.hash;a.textContent=s.label+' / '+s.name;row.append(a);}catch{}}log.append(row);}
 function animate(){if(!analyser||!player||player.paused)return;const data=new Uint8Array(analyser.frequencyBinCount);analyser.getByteFrequencyData(data);const value=data.reduce((a,b)=>a+b,0)/data.length/150;consoleNode.style.setProperty('--voice-level',Math.min(1,value).toFixed(3));frame=requestAnimationFrame(animate);}
 async function play(){audioContext();if(!player)return;try{await player.play();setPhase('speaking','Speaking · SWADEBASE Kokoro');replay.hidden=true;animate();}catch{setPhase('idle','Your reply is ready. Press Play reply to listen.');replay.hidden=false;}}
 async function ask(question,myGeneration){
  if(question.trim().length<3)throw Error('Ask a question with at least three characters.');
  message('YOU',question);setPhase('thinking','Reading the public guides…');
  const d=await call('ask',{question,level:$('#experience')?.value||'plain'});if(myGeneration!==generation)return;
  message('ASSET MACHINE',d.answer);sources(d.sources);setPhase('thinking','Preparing your Kokoro reply…');
  const speechText=String(d.answer).replace(/\[G\d+\]/g,'').slice(0,2500);
  let blob;try{blob=await call('speak',{text:speechText},true);}catch(e){if(myGeneration===generation)setPhase('error','Text reply ready. '+e.message);return;}if(myGeneration!==generation)return;
  player?.pause();if(audioURL)URL.revokeObjectURL(audioURL);audioURL=URL.createObjectURL(blob);player=new Audio(audioURL);
  try{if(ctx){const source=ctx.createMediaElementSource(player);analyser=ctx.createAnalyser();analyser.fftSize=128;source.connect(analyser);analyser.connect(ctx.destination);}}catch{analyser=null;}
  player.onended=()=>{cancelAnimationFrame(frame);consoleNode.style.setProperty('--voice-level','0');setPhase('idle','Ready for your next question');replay.hidden=false;};
  player.onerror=()=>{setPhase('error','Playback is unavailable. Your text reply is above.');};await play();
 }
 function failed(e,myGeneration){if(myGeneration!==generation||e.name==='AbortError')return;releaseMic();setPhase('error',e.message||'Voice is unavailable. You can type instead.');}
 async function record(){
  if(phase==='listening'){if(recorder?.state==='recording')recorder.stop();return;}if(['thinking','speaking'].includes(phase)){halt();return;}
  halt();audioContext();const myGeneration=generation;controller=new AbortController();replay.hidden=true;
  if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){setPhase('error','Recording is unavailable in this browser. Type your question below.');input.focus();return;}
  setPhase('thinking','Allow microphone access to speak…');
  try{const acquired=await navigator.mediaDevices.getUserMedia({audio:true});if(myGeneration!==generation){acquired.getTracks().forEach(t=>t.stop());return;}stream=acquired;
   const mime=['audio/webm;codecs=opus','audio/mp4','audio/webm'].find(t=>MediaRecorder.isTypeSupported(t));recorder=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);const parts=[];
   recorder.ondataavailable=e=>{if(e.data.size)parts.push(e.data);};
   recorder.onstop=async()=>{releaseMic();if(myGeneration!==generation)return;setPhase('thinking','Transcribing with SWADEBASE…');try{const form=new FormData();form.append('file',new Blob(parts,{type:recorder.mimeType}),'voice');const d=await call('transcribe',form);if(myGeneration!==generation)return;const question=String(d.text||'').trim();if(!question)throw Error('No speech was detected. Try again or type below.');input.value=question;await ask(question,myGeneration);}catch(e){failed(e,myGeneration);}};
   recorder.onerror=()=>{releaseMic();setPhase('error','Recording failed. Type your question below.');};recorder.start();setPhase('listening','Listening · tap the disc to finish');recordTimer=setTimeout(()=>{if(recorder?.state==='recording')recorder.stop();},25000);
  }catch(e){failed(Error('Microphone access was unavailable. Check browser permission or type your question.'),myGeneration);}
 }
 disc.onclick=record;stop.onclick=halt;replay.onclick=()=>{if(player){player.currentTime=0;play();}};
 $('#public-voice-form').onsubmit=async e=>{e.preventDefault();if(['listening','thinking','speaking'].includes(phase))return;const question=input.value.trim();halt();audioContext();controller=new AbortController();replay.hidden=true;const myGeneration=generation;try{await ask(question,myGeneration);}catch(x){failed(x,myGeneration);}};
 window.addEventListener('pagehide',()=>{halt();if(audioURL)URL.revokeObjectURL(audioURL);ctx?.close();});
 window.addEventListener('hashchange',()=>{if(!['','#home','#ask-asset-machine'].includes(location.hash))halt();});
})();
