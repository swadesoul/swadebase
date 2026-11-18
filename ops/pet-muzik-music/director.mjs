// PET MUZIK Music Director — deterministic, side-effect-free request preparation.
// No provider access, payment actions, or customer data persistence in this module.
export const AGENT = Object.freeze({id:'pet-muzik-music-director',name:'MUZIK Director',version:'0.1.0',status:'internal-preflight',capabilities:['intake','lyrics-review','quote-readiness','audio-delivery-qa']});
const trim = (v,n=300) => String(v??'').trim().slice(0,n);
const canon = (v) => trim(v).replace(/\\s+/g,' ');
export function normalizeIntake(raw={}) {
 const pet=canon(raw.pet_name||raw.petName);
 const story=trim(raw.story,6000);
 const occasion=canon(raw.occasion||'celebration');
 const genre=canon(raw.genre||'');
 const vocal=canon(raw.vocal||'no preference');
 const language=canon(raw.language||'English');
 const mustInclude=(Array.isArray(raw.must_include)?raw.must_include:[]).map(x=>canon(x)).filter(Boolean).slice(0,24);
 const relationships=(Array.isArray(raw.family_names)?raw.family_names:[]).map(x=>canon(x)).filter(Boolean).slice(0,24);
 return {pet_name:pet,story,occasion,genre,vocal,language,must_include:mustInclude,family_names:relationships,pet_sound_consent:raw.pet_sound_consent===true,public_share_consent:raw.public_share_consent===true};
}
export function reviewIntake(raw={}) {
 const d=normalizeIntake(raw), errors=[],warnings=[];
 if (!d.pet_name) errors.push('pet_name_required');
 if (!d.story || d.story.length<15) errors.push('story_too_short');
 if (!d.genre) errors.push('genre_required');
 if (!['male','female','no preference','instrumental'].includes(d.vocal.toLowerCase())) errors.push('vocal_selection_invalid');
 if (!d.language) errors.push('language_required');
 if (d.occasion.toLowerCase()==='memorial' && !/memory|miss|passed|remember|loved|life|tribute|gone|memorial/i.test(d.story)) warnings.push('confirm_memorial_tone_and_facts');
 return {ok:errors.length===0,intake:d,errors,warnings,needs_owner_approval:true};
}
export function reviewLyrics(intakeRaw,lyrics) {
 const d=normalizeIntake(intakeRaw),text=trim(lyrics,20000),errors=[];
 if (text.length<50) errors.push('lyrics_too_short');
 for (const name of [d.pet_name,...d.must_include,...d.family_names]) {
   if(name && !text.toLocaleLowerCase().includes(name.toLocaleLowerCase())) errors.push('missing_required_name_or_phrase:'+name);
 }
 if (!reviewIntake(intakeRaw).ok) errors.push('intake_not_ready');
 return {ok:errors.length===0,errors,needs_owner_approval:true};
}
export function authorizeGeneration({intake,lyrics,payment_verified=false,owner_approved=false,cost_approved=false,provider_ready=false,request_id}={}) {
 const errors=[];
 if(!reviewIntake(intake).ok) errors.push('intake_not_ready');
 if(!reviewLyrics(intake,lyrics).ok) errors.push('lyrics_not_ready');
 if(!payment_verified) errors.push('payment_not_verified');
 if(!owner_approved) errors.push('owner_approval_missing');
 if(!cost_approved) errors.push('cost_not_approved');
 if(!provider_ready) errors.push('provider_not_verified');
 if(!/^[a-zA-Z0-9_-]{12,128}$/.test(String(request_id||''))) errors.push('idempotency_key_missing');
 return {approved:errors.length===0,errors,action:'resinglab_generate_music',note:'Authorization result is advisory. Server must independently verify all gates against trusted records before calling RESINGLAB.'};
}
export function validateAudioDelivery({content_type='',file_name='',size_bytes=0,playable=false,b2_readback=false,download_verified=false}={}) {
 const errors=[];
 if(!['audio/mpeg','audio/mp3'].includes(content_type)) errors.push('wrong_content_type');
 if(!file_name.toLowerCase().endsWith(".mp3")) errors.push("missing_mp3_filename");
 if(!(size_bytes>10000)) errors.push('audio_too_small');
 if(!playable) errors.push('playback_not_verified');
 if(!b2_readback) errors.push('b2_readback_not_verified');
 if(!download_verified) errors.push('download_not_verified');
 return {ready:errors.length===0,errors};
}
