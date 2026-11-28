(()=>{'use strict';const $=s=>document.querySelector(s),params=new URLSearchParams(location.search),site=params.get('site')||'brainiak',previewOffers=params.get('preview')==='offers';let config,draft='';
 fetch('./config.json?site='+encodeURIComponent(site)+(previewOffers?'&preview=offers':''),{credentials:'omit'}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(j=>{config=j.data;
 if(config.mode==='offers'){
  const offer=config.offer||{};
  $('#context').textContent=config.site.name.toUpperCase()+(offer.enabled?'':' · NOT ON SALE YET');
  $('#title').textContent=offer.title||config.site.title;
  $('#summary').textContent=offer.summary||config.site.summary;
  const example=$('#example');if(example)example.textContent=offer.pendingReason||config.status||'';
  const heroBtn=document.querySelector('.hero .button');
  const buy=offer.enabled&&offer.primaryUrl?offer.primaryUrl:(previewOffers&&offer.previewUrl?offer.previewUrl:'');
  if(heroBtn){if(buy){heroBtn.href=buy;heroBtn.target='_blank';heroBtn.rel='noopener noreferrer';heroBtn.replaceChildren(document.createTextNode((offer.primaryLabel||'Buy')+(offer.enabled?'':' (preview only) ')),Object.assign(document.createElement('span'),{textContent:'↗'}));}else{heroBtn.hidden=true;}}
  const status=document.querySelector('.hero .status');if(status)status.textContent=config.status||'';
  document.querySelectorAll('main > section').forEach(n=>{if(!n.classList.contains('hero'))n.hidden=true;});
  if(offer.secondaryUrl&&offer.enabled){const alt=document.createElement('p');const a=document.createElement('a');a.className='button';a.href=offer.secondaryUrl;a.target='_blank';a.rel='noopener noreferrer';a.textContent=offer.secondaryLabel||'Another option';alt.append(a);document.querySelector('.hero')?.append(alt);}
  return;
 }
 $('#context').textContent='CAMPAIGNS FOR '+config.site.name.toUpperCase();$('#title').textContent=config.site.title;$('#summary').textContent=config.site.summary;$('#example').textContent=config.site.example;
 config.tiers.forEach((t,i)=>{const article=document.createElement('article');article.className='tier';for(const [tag,copy]of [['strong','0'+(i+1)+' / '+t.name],['h3',t.name],['p',t.description],['p',t.detail]]){const n=document.createElement(tag);n.textContent=copy;article.append(n)}$('#tiers').append(article)});
 }).catch(()=>{$('#notice').textContent='This site’s campaign configuration is unavailable. Please try again later.';$('#brief-form button').disabled=true});
 $('#brief-form').addEventListener('submit',e=>{e.preventDefault();if(!config)return;const f=new FormData(e.currentTarget),value=n=>String(f.get(n)||'').trim();
 if(/\b(?:sk-(?:proj-|ant-)?[A-Za-z0-9_-]{18,}|ghp_[A-Za-z0-9]{20,}|-----BEGIN .*PRIVATE KEY)/.test([...f.values()].join(' '))){$('#notice').textContent='Remove credentials before preparing a campaign brief.';return;}
 let url;try{url=new URL(value('website'));if(url.protocol!=='https:'||url.username||url.password)throw Error();}catch{$('#notice').textContent='Use a public HTTPS website address.';return;}
 draft=['SWADE CAMPAIGN BRIEF — DRAFT','Origin site: '+config.site.name,'Business: '+value('business'),'Website: '+url.href,'Description: '+value('description'),'Campaign: '+value('tier'),'Preferred duration: '+value('duration'),'Locations / customer needs: '+value('audience'),'Optional theme up to 60 seconds: '+(f.get('song')?'Requested':'Not requested'),'Music / approved names: '+value('music'),'','Status: local planning draft only. No payment, submission, placement or production has started.','Final package pricing, allowance, schedule and approved public copy must be confirmed before activation.'].join('\n\n');$('#draft').textContent=draft;$('#result').hidden=false;$('#notice').textContent='Draft prepared on this device. No campaign was submitted.';$('#result').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});
 });
 $('#copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(draft);$('#notice').textContent='Campaign brief copied.'}catch{$('#notice').textContent='Select the draft text to copy it.'}});
 $('#download').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([draft],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='swade-campaign-brief.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
})();
