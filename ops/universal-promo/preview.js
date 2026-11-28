(()=>{'use strict';
  const sites=['resinglab','maestroradio','videosaywhat','blacktales','abagale','theleaguesound'];
  const cards=document.getElementById('cards');
  const notice=document.getElementById('notice');
  Promise.all(sites.map(id=>fetch('./config.json?site='+encodeURIComponent(id)+'&preview=offers',{credentials:'omit'}).then(r=>{if(!r.ok)throw Error(id);return r.json().then(j=>({id,...j.data}))})))
    .then(rows=>{
      notice.remove();
      for(const data of rows){
        const offer=data.offer||{};
        const card=document.createElement('article');
        card.className='card';
        const h=document.createElement('h2');h.textContent=data.site.name;card.append(h);
        const meta=document.createElement('div');meta.className='meta';
        const status=document.createElement('span');status.className='pill '+(offer.enabled?'live':'pending');status.textContent=offer.enabled?'Ready to sell':'Pending';meta.append(status);
        card.append(meta);
        const title=document.createElement('p');title.innerHTML='';title.textContent=offer.title||'';card.append(title);
        const summary=document.createElement('p');summary.textContent=offer.summary||offer.pendingReason||'';card.append(summary);
        const actions=document.createElement('div');actions.className='actions';
        const addLink=(href,label,cls)=>{if(!href)return;const a=document.createElement('a');a.href=href;a.target='_blank';a.rel='noopener noreferrer';a.className=cls;a.textContent=label;actions.append(a);};
        if(offer.enabled&&offer.primaryUrl)addLink(offer.primaryUrl,offer.primaryLabel||'Buy','buy');
        if(offer.enabled&&offer.secondaryUrl)addLink(offer.secondaryUrl,offer.secondaryLabel||'Secondary','view');
        if(!offer.enabled&&offer.previewUrl)addLink(offer.previewUrl,(offer.primaryLabel||'Checkout')+' (preview only)','view');
        addLink('./?site='+encodeURIComponent(data.site.id)+'&preview=offers','Open offer page','view');
        addLink('./config.json?site='+encodeURIComponent(data.site.id)+'&preview=offers','View config.json','view');
        card.append(actions);
        if(offer.pendingReason){const n=document.createElement('p');n.className='note';n.textContent=offer.pendingReason;card.append(n);}
        const frame=document.createElement('iframe');
        frame.title=data.site.name+' widget preview';
        frame.src='./preview-frame.html?site='+encodeURIComponent(data.site.id);
        card.append(frame);
        cards.append(card);
      }
    })
    .catch(()=>{notice.textContent='The staged offer configuration could not be loaded.';});
})();
