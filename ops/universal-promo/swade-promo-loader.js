/* SWADE Universal Promo first-party loader v1.0.1. No private page data is read. */
(()=>{'use strict';
 const tag=document.currentScript;if(!tag||window.__swadePromoLoaderActive)return;
 const site=tag.dataset.swadePromoSite;
 if(!/^[a-z0-9][a-z0-9-]{1,63}$/.test(site||''))return;
 window.__swadePromoLoaderActive=true;
 const paths=site==='brainiak'?['/brainiak','/brainiak/','/']:site==='teachvirt'?['/','/index.html','/home']:['/','/index.html'];
 let active=false,remote=null;
 function update(){
  const next=paths.includes(location.pathname);if(next===active)return;active=next;
  if(!next){
   window.dispatchEvent(new Event('swade-promo-hide'));
   document.getElementById('swade-universal-promo')?.remove();
   remote?.remove();remote=null;window.__swadePromoRequested=false;return;
  }
  if(window.__swadePromoRequested)return;window.__swadePromoRequested=true;
  remote=document.createElement('script');remote.defer=true;
  remote.src='https://swadebase.cloud/adapters/promo/widget.js';
  remote.dataset.swadePromoSite=site;
  if(tag.dataset.swadePromoMount)remote.dataset.swadePromoMount=tag.dataset.swadePromoMount;
  remote.referrerPolicy='no-referrer';document.head.append(remote);
 }
 update();addEventListener('popstate',update);addEventListener('pageshow',update);
 setInterval(()=>{if(!document.hidden)update();},500);
})();
