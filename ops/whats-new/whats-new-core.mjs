import {createHash} from 'node:crypto';
export function digest(d){return createHash('sha256').update(JSON.stringify([String(d.id),d.title,d.body,d.status])).digest('hex');}
export function field(value,max,min=1){if(typeof value!=='string'||value.trim().length<min||value.length>max)throw Object.assign(Error('Check the required text fields.'),{status:400});return value.trim();}
export function eventInput(b){
 const release_state=b.release_state||'internal';
 if(!['planned','internal','shipped'].includes(release_state))throw Object.assign(Error('Choose a valid release state.'),{status:400});
 return {site:field(b.site,100),process:field(b.process,160),title:field(b.title,240,3),description:field(b.description,5000,3),release_state};
}
export function draftInput(b){return {title:field(b.title,240,3),body:field(b.body,20000,10)};}
export function draftBody(title,summary,date){
 const when=new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',dateStyle:'long'}).format(new Date(date));
 return `${title}\n\n${when}\n\n${summary}\n\nAbout Swade Soul\nSwade Soul builds connected tools for creative work and business operations.\n`;
}
export function senderStatus(env){return {configured:Boolean(env.RESEND_API_KEY),from:env.CLIENT_DOCS_FROM||'Swade Soul <swade@publiswade.site>',reply_to:env.CLIENT_DOCS_REPLY_TO||'swadesoul@gmail.com'};}
export function sendInput(b){
 const recipient=field(b.recipient,254).toLowerCase();
 if(!/^[^\s@<>()",;:\\[\]]{1,64}@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(recipient))throw Object.assign(Error('Enter one valid recipient email.'),{status:400});
 if(b.confirm!==true)throw Object.assign(Error('Confirm this recipient and approved release before sending.'),{status:400});
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(b.request_id||''))throw Object.assign(Error('A new request ID is required.'),{status:400});
 if(!/^[0-9a-f]{64}$/.test(b.digest||''))throw Object.assign(Error('Reload the release before sending.'),{status:400});
 return {recipient,request_id:b.request_id,digest:b.digest};
}
