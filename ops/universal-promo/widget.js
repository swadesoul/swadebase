(()=>{'use strict';
 const script=document.currentScript;
 if(!script||window.__swadePromoLoaded)return;
 const site=script.dataset.swadePromoSite;if(!/^[a-z0-9-]{2,64}$/.test(site||''))return;
 window.__swadePromoLoaded=true;
 const base=new URL('.',script.src),hostName=location.hostname.replace(/^www\./,'').toLowerCase();
 let chooseTheme,data,element,lastPath='',mountTimer,routeTimer,destroyed=false;
 const abort=new AbortController();
 function teardown(){destroyed=true;abort.abort();element?.remove();clearInterval(mountTimer);clearInterval(routeTimer);removeEventListener('popstate',mount);removeEventListener('pageshow',mount);removeEventListener('swade-promo-hide',teardown);window.__swadePromoLoaded=false;}
 addEventListener('swade-promo-hide',teardown);
 const isHome=()=>data?.site.homePaths.includes(location.pathname)&&(
 data.site.hosts.includes(hostName)||(site==='brainiak'&&hostName==='swadebase.cloud'&&/^\/brainiak\/?$/.test(location.pathname)));
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
 function sampleTheme(container){
  const body=getComputedStyle(document.body),c=getComputedStyle(container);
  let bg='';for(let n=container;n;n=n.parentElement){const x=getComputedStyle(n).backgroundColor;if(x&&x!=='rgba(0, 0, 0, 0)'&&x!=='transparent'){bg=x;break;}}
  const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');
  const rgb=value=>{if(!value||!CSS.supports('color',value))return null;ctx.clearRect(0,0,1,1);ctx.fillStyle=value;ctx.fillRect(0,0,1,1);const [r,g,b,a]=ctx.getImageData(0,0,1,1).data;return a>200?'rgb('+r+', '+g+', '+b+')':null;};
  const h=container.querySelector('h1,h2')||document.querySelector('h1'),hs=h?getComputedStyle(h):c;
  const button=container.querySelector('a[class*="primary"],button[class*="primary"]')||container.querySelector('a[class*="btn"],button[class*="btn"]')||container.querySelector('button,a[href]')||document.querySelector('main button,main a');
  const bs=button?getComputedStyle(button):null;
  let accent=bs?.backgroundColor;
  if(!accent||['transparent','rgba(0, 0, 0, 0)'].includes(accent)||accent===bg)accent=bs?.color||c.color;
  const roots=getComputedStyle(document.documentElement);
  for(const key of ['--color-signal','--primary','--brand-primary','--primary-color','--brand','--signal','--gold']){
   const raw=c.getPropertyValue(key).trim()||roots.getPropertyValue(key).trim();if(!raw)continue;
   const candidate=rgb(raw)||rgb('hsl('+raw+')');if(candidate){accent=candidate;break;}
  }
  const safe=chooseTheme({ink:rgb(c.color),surface:rgb(bg),accent:rgb(accent),buttonInk:rgb(bs?.color)});
  // Values come from the host's computed CSS, never advertiser HTML or external styles.
  const vars={'--sp-font':c.fontFamily||body.fontFamily,'--sp-heading':hs.fontFamily,'--sp-weight':hs.fontWeight,'--sp-ink':safe.ink,'--sp-surface':safe.surface,'--sp-accent':safe.accent,'--sp-button-ink':safe.buttonInk,'--sp-radius':getComputedStyle(container).borderRadius!=='0px'?c.borderRadius:'18px','--sp-button-radius':bs?.borderRadius||'10px'};
  for(const [k,v]of Object.entries(vars))if(v)element.style.setProperty(k,v);
 }
 function mount(){
  if(destroyed||!data)return;if(!isHome()){teardown();return;}
  if(element?.isConnected)return;
  // Placement rule (Founder, 2026-11-16): the promo always sits at the BOTTOM of the page,
  // just above the site footer. data-swade-promo-mount still overrides (inserted after that element).
  let target=script.dataset.swadePromoMount?document.querySelector(script.dataset.swadePromoMount):null,place='afterend';
  if(!target){const footers=[...document.querySelectorAll('footer')].filter(f=>!f.closest('swade-campaign-promo'));const footer=footers[footers.length-1];const main=document.querySelector('main');
   if(footer){target=footer;place='beforebegin';}else if(main){target=main;place='beforeend';}else{target=document.body;place='beforeend';}}
  if(!target)return;
  element=el('swade-campaign-promo');element.id='swade-universal-promo';element.setAttribute('aria-label','Campaign promotion for '+data.site.name);
  const shadow=element.attachShadow({mode:'open'}),css=el('link');css.rel='stylesheet';css.href=new URL('widget.css',base).href;shadow.append(css);
  const wrap=el('div',null,'layout-'+data.site.layout),section=el('section');
  const eye=el('div',null,'eyebrow');eye.append(el('span',null,'dot'),el('span','Campaigns for '+data.site.name+' · Alpha preview'));section.append(eye);
  const grid=el('div',null,'grid'),left=el('div'),right=el('div');
  left.append(el('h2',data.site.title),el('p',data.site.summary));const cta=el('a',null,'cta');cta.href=data.primaryUrl;cta.target='_blank';cta.rel='noopener noreferrer';cta.append(el('span',data.primaryLabel),el('span','↗','arrow'));left.append(cta);
  const ornament=el('div',null,'ornament');ornament.setAttribute('aria-hidden','true');for(let i=0;i<24;i++)ornament.append(el('i'));right.append(ornament);
  const context=el('div',null,'context');context.append(el('span','A relevant moment','label'),el('p',data.site.example,'example'));right.append(context);
  const tabs=el('div',null,'tabs');tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Campaign intensity');const desc=el('p',data.tiers[0].description,'tier');desc.setAttribute('aria-live','polite');
  data.tiers.forEach((t,i)=>{const b=el('button',t.name);b.type='button';b.setAttribute('aria-pressed',String(i===0));b.addEventListener('click',()=>{for(const x of tabs.children)x.setAttribute('aria-pressed','false');b.setAttribute('aria-pressed','true');desc.textContent=t.description;});tabs.append(b);});right.append(tabs,desc);
  grid.append(left,right);section.append(grid,el('p',data.status+' Optional company theme up to 60 seconds is planned for campaign packages.','note'));wrap.append(section);shadow.append(wrap);
  sampleTheme(document.querySelector('main')||(target===document.body?document.body:target.parentElement||document.body));
  target.insertAdjacentElement(place,element);
 }
 async function start(){try{chooseTheme=(await import(new URL('theme.mjs',base).href)).chooseTheme;if(destroyed)return;const timeout=setTimeout(()=>abort.abort(),6000);const r=await fetch(new URL('config.json?site='+encodeURIComponent(site),base),{credentials:'omit',signal:abort.signal,referrerPolicy:'no-referrer'});clearTimeout(timeout);if(!r.ok){teardown();return;}const j=await r.json();if(destroyed)return;data=j.data;if(!data?.site||!Array.isArray(data.tiers))return;mount();
  let tries=0;mountTimer=setInterval(()=>{if(++tries>20){clearInterval(mountTimer);return;}mount();},500);
  addEventListener('popstate',mount);addEventListener('pageshow',mount);
  routeTimer=setInterval(()=>{if(document.hidden||destroyed)return;if(lastPath!==location.pathname||!element?.isConnected){lastPath=location.pathname;mount();}},1500);
 }catch{teardown();/* Promotional content must never interrupt the host app. */}}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
