/* Small, read-only resource peeks. Native anchors/forms keep their handlers. */
(() => {
 'use strict';
 let host;try{if(top.location.hostname!=='lms.lums.edu.pk'||!/^\/+portal(?:\/|$)/.test(top.location.pathname))return;host=top.document;}catch{return;}
 const origin=top.location.origin,baseURL=/^https:/.test(document.baseURI)?document.baseURI:top.location.href;
 const own='[data-ae-preview-control]',cache=new Map(),MAX=12*1024*1024;
 let pending=0,hoverCard=null,queued=false,current=null,cacheBytes=0;
 const enabled=()=>host.documentElement.classList.contains('aether-enabled');
 const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
 const el=(tag,cls,text)=>{const n=host.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 function url(value,base=baseURL){try{const u=new URL(value,base);return ['http:','https:'].includes(u.protocol)?u:null;}catch{return null;}}
 function contentURL(u){return u?.origin===origin&&/^\/access\/content\//.test(u.pathname);}
 const info=card=>globalThis.AetherResourceInfo.describe(card);
 const read=(...args)=>globalThis.AetherResourceAccess.read(...args);
 function remember(key,value,size=1000){
  if(cache.has(key)){cacheBytes-=cache.get(key).size;cache.delete(key);}cache.set(key,{value,size});cacheBytes+=size;
  while(cache.size>6||cacheBytes>24*1024*1024){const key=cache.keys().next().value;cacheBytes-=cache.get(key).size;cache.delete(key);}
 }
 function active(state){return current===state&&state.panel.isConnected&&enabled()&&state.info.card.isConnected&&state.info.card.matches('.ae-record-card[data-ae-kind="resource"]')&&!!state.info.card.getClientRects().length;}
 function cancelHover(){clearTimeout(pending);pending=0;hoverCard=null;}
 function close(restoreFocus=false){cancelHover();
  const state=current;current=null;if(!state)return;state.abort.abort();clearTimeout(state.timeout);clearTimeout(state.requestTimeout);state.objectURL&&URL.revokeObjectURL(state.objectURL);state.panel.remove();if(restoreFocus===true)state.info.card.querySelector('[data-ae-preview-open]')?.focus({preventScroll:true});
 }
 const contains=(parent,node)=>!!node?.nodeType&&parent.contains(node);
 function leavePreview(target){if(current&&!current.pinned&&!contains(current.info.card,target)&&!contains(current.panel,target))close();}
 function outside(e){if(hoverCard&&!contains(hoverCard,e.target))cancelHover();leavePreview(e.target);}
 function boundary(e){cancelHover();leavePreview(e.relatedTarget);}
 function status(state,message){if(!active(state))return;state.body.replaceChildren(el('p','ae-preview-message',message));}
 function position(state){
  let r=state.info.card.getBoundingClientRect(),win=window,left=r.left,topPos=r.top;
  while(win!==top){try{const frame=win.frameElement,b=frame.getBoundingClientRect();left+=b.left+frame.clientLeft;topPos+=b.top+frame.clientTop;win=win.parent;}catch{break;}}
  const documentView=['office','archive'].includes(state.info.kind),w=Math.min(documentView?660:370,top.innerWidth-24),h=Math.min(documentView?620:state.info.kind==='pdf'?520:390,top.innerHeight-24);
  let x=left+r.width+12;if(x+w>top.innerWidth-12)x=left-w-12;if(x<12)x=top.innerWidth-w-12;
  state.panel.style.width=w+'px';state.panel.style.maxHeight=h+'px';state.panel.style.left=Math.max(12,x)+'px';state.panel.style.top=Math.max(12,Math.min(topPos,top.innerHeight-h-12))+'px';
  if(['pdf','office','archive'].includes(state.info.kind))state.body.style.height=Math.max(160,h-112)+'px';
 }
 function metadata(state){const {info}=state;state.body.replaceChildren();
  state.body.append(el('div','ae-preview-file-mark',info.type||'LINK'));
  if(info.description&&info.description!==info.title)state.body.append(el('p','ae-preview-description',info.description));
  if(info.u){state.body.append(el('strong','ae-preview-host',info.u.hostname));state.body.append(el('p','ae-preview-path',decodeURI(info.u.pathname)+info.u.search));}
  const meta=[...info.card.querySelectorAll('[data-ae-cell="meta"]')].map(c=>clean(c.getAttribute('data-ae-label'))+': '+clean(c.textContent));
  for(const line of meta)state.body.append(el('p','ae-preview-meta',line));
  if(!meta.length&&!info.description)state.body.append(el('p','ae-preview-message','Open the original resource for its full contents.'));
 }
 function children(data){
  const roots=Array.isArray(data)?data:data?.content_collection||data?.content||data?.resources;
  if(!Array.isArray(roots))throw Error('Folder listing unavailable. Open the folder in Sakai.');
  const root=roots[0],items=root?.resourceChildren||root?.children||root?.resources;
  if(Array.isArray(items))return items;
  if(roots.length===1&&(root?.collection||root?.isCollection||root?.resourceType==='collection'))return [];
  throw Error('Folder listing unavailable. Open the folder in Sakai.');
 }
 function folderItems(state,items){
  state.body.replaceChildren();state.body.append(el('p','ae-preview-meta',items.length+' '+(items.length===1?'item':'items')+' in this folder'));
  const list=el('ul','ae-preview-folder-list');
  for(const child of items.slice(0,12)){
   const props=child.resourceProperties||child.properties||{},raw=child.resourceId||child.id||'';
   const title=clean(child.title||child.name||child.displayName||props['DAV:displayname']||props.displayName||raw.split('/').filter(Boolean).at(-1)||'Resource');
   const folder=child.collection||child.isCollection||child.resourceType==='collection'||child.type==='collection'||raw.endsWith('/');
   const row=el('li',''),glyph=el('span','ae-preview-item-type',folder?'Folder':'File');row.append(glyph,el('span','',title));list.append(row);
  }
  state.body.append(list);if(!items.length)state.body.append(el('p','ae-preview-message','No readable items in this folder.'));if(items.length>12)state.body.append(el('p','ae-preview-meta','+'+(items.length-12)+' more · open the folder to see all items'));
 }
 async function folder(state){
  const {id}=state.info;if(!id)throw Error('Folder listing unavailable. Open the folder in Sakai.');
  const path=id.replace(/\/$/,'').split('/').map(encodeURIComponent).join('/'),endpoint=new URL('/direct/content/resources'+path+'.json?depth=1',origin),key=endpoint.href;
  let items=cache.get(key)?.value;if(!items){const result=await read(endpoint,state.abort.signal,1024*1024);items=children(JSON.parse(new TextDecoder().decode(result.bytes)));remember(key,items,result.bytes.length);}
  if(active(state))folderItems(state,items);
 }
 function viewer(state,kind,bytes){
  if(!active(state))return;
  const token=crypto.randomUUID(),frame=el('iframe',kind==='pdf'?'ae-preview-pdf':'ae-preview-office');state.frame=frame;state.token=token;state.bytes=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);state.viewerKind=kind;state.viewerOrigin=new URL(chrome.runtime.getURL('/')).origin;
  frame.title=(kind==='pdf'?'PDF pages for ':'Document preview: ')+state.info.title;
  frame.src=chrome.runtime.getURL(kind==='pdf'?'preview/pdf.html':'preview/office.html')+'#'+new URLSearchParams({token,origin});state.body.replaceChildren(frame);position(state);
  state.timeout=setTimeout(()=>{if(active(state)&&state.frame){state.frame.remove();state.frame=null;status(state,'Preview unavailable. Open the original resource.');}},20000);
 }
 async function file(state){
  const {u}=state.info;if(!contentURL(u)){if(state.info.kind!=='link')throw Error('Open the original resource to see its contents.');metadata(state);return;}
  const limit=state.info.kind==='text'?128*1024:['office','archive','audio','video','link'].includes(state.info.kind)?32*1024*1024:MAX;
  let result=cache.get(u.href)?.value;if(!result){result=await globalThis.AetherResourceAccess.resource(state.info,state.abort.signal,limit);remember(u.href,result,result.bytes.length);}
  if(!active(state))return;
  const {bytes,mime}=result,prefix=new TextDecoder().decode(bytes.slice(0,1024)),zip=bytes[0]===80&&bytes[1]===75;
  let kind=prefix.includes('%PDF-')?'pdf':zip?(state.info.kind==='archive'?'archive':'office'):globalThis.AetherResourceInfo.kind(state.info.extension,mime);
  state.info.kind=kind;
  if(kind==='pdf'){
   if(!prefix.includes('%PDF-'))throw Error('This resource is not a readable PDF. Open it in Sakai.');
   if(bytes.length>MAX)throw Error('This file is too large for a quick preview. Open the original resource.');
   viewer(state,'pdf',bytes);return;
  }
  if(['office','archive'].includes(kind)){
   if(!zip)throw Error('This Office file is encrypted, uses a legacy format, or is not readable. Open the original resource.');
   viewer(state,'office',bytes);return;
  }
  if(kind==='text'){if(bytes.length>128*1024)throw Error('This file is too large for a quick preview. Open the original resource.');state.body.replaceChildren(el('pre','ae-preview-text',new TextDecoder().decode(bytes).slice(0,16000)));return;}
  if(kind==='image'){
   if(!/^image\/(?:png|jpeg|webp|gif|bmp|avif)/i.test(mime))throw Error('Image preview unavailable. Open the original resource.');
   state.objectURL=URL.createObjectURL(new Blob([bytes],{type:mime}));const image=el('img','ae-preview-image');image.alt=state.info.title;image.src=state.objectURL;image.onerror=()=>status(state,'Image preview unavailable. Open the original resource.');state.body.replaceChildren(image);return;
  }
  if(['audio','video'].includes(kind)){
   if(!mime.startsWith(kind+'/'))throw Error('This media format cannot be previewed. Open the original resource.');
   state.objectURL=URL.createObjectURL(new Blob([bytes],{type:mime}));const media=el(kind,'ae-preview-media');media.controls=true;media.preload='metadata';media.src=state.objectURL;media.setAttribute('aria-label',state.info.title);media.onerror=()=>status(state,'This media codec cannot be played in this browser. Open the original resource.');state.body.replaceChildren(media);return;
  }
  metadata(state);state.body.append(el('p','ae-preview-message','A content preview is not available for this format. Open the original resource.'));
 }
 function copyright(state,notice){
  state.body.replaceChildren(el('h4','ae-preview-notice-title','Copyright acknowledgement'),el('p','ae-preview-notice',notice.text));
  const actions=el('div','ae-preview-consent-actions'),yes=el('button','ae-preview-open','Yes, accept and preview'),cancel=el('button','ae-preview-cancel','Cancel');yes.type=cancel.type='button';
  yes.onclick=()=>{if(!active(state))return;state.pinned=true;yes.disabled=true;load(state,notice.accept);};cancel.onclick=()=>close(true);actions.append(yes,cancel);state.body.append(actions);state.panel.dataset.copyright='required';
 }
 async function load(state,acceptance=null){
  if(!active(state))return;delete state.panel.dataset.copyright;status(state,'Loading preview…');state.requestTimeout=setTimeout(()=>state.abort.abort(),9000);
  try{if(acceptance)await globalThis.AetherResourceAccess.accept(acceptance,state.info,state.abort.signal);if(state.info.kind==='folder')await folder(state);else await file(state);}
  catch(error){if(active(state)){if(error.notice)copyright(state,error.notice);else status(state,error.name==='AbortError'?'Preview timed out. Open the original resource.':error.name==='SyntaxError'&&state.info.kind==='folder'?'Folder listing unavailable. Open the folder in Sakai.':/^(This |Preview |Folder |Open |Image |Copyright )/.test(error.message)?error.message:'Preview unavailable. Open the original resource.');}}
  finally{clearTimeout(state.requestTimeout);}
 }
 async function open(card,keyboard=false){
  cancelHover();if(!enabled()||!card.isConnected)return;if(current?.info.card===card){if(keyboard){current.pinned=true;current.panel.querySelector('button')?.focus();}return;}
  close();host.dispatchEvent(new Event('aether-preview-close-all'));const data=info(card);if(!data)return;host.querySelector('#aether-resource-preview')?.remove();
  const panel=el('aside','ae-resource-preview');panel.id='aether-resource-preview';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','false');panel.setAttribute('aria-label','Resource preview: '+data.title);
  const head=el('div','ae-preview-head'),title=el('div','');title.append(el('span','ae-preview-kind',data.kind==='pdf'?'PDF preview':data.kind==='folder'?'Folder contents':'Resource preview'),el('h3','',data.title));const dismiss=el('button','ae-preview-close','×');dismiss.type='button';dismiss.setAttribute('aria-label','Close resource preview');dismiss.onclick=()=>{close();if(keyboard)data.card.querySelector('[data-ae-preview-open]')?.focus();};head.append(title,dismiss);
  const body=el('div','ae-preview-body'),footer=el('div','ae-preview-footer'),original=el('button','ae-preview-open',data.kind==='folder'?'Open folder':'Open original');original.type='button';original.onclick=()=>{close();data.a.click();};footer.append(original,el('span','','Preview only'));panel.append(head,body,footer);
  const state={panel,body,info:data,pinned:keyboard,abort:new AbortController()};current=state;host.body.append(panel);position(state);
  panel.addEventListener('pointerleave',e=>{if(current===state)leavePreview(e.relatedTarget);});
  // Explicit clicks and keyboard interaction keep the reader stable. Ordinary
  // hover previews close in the leave event itself, without a grace timer.
  panel.addEventListener('focusin',()=>{if(current===state)state.pinned=true;});
  // Cross-origin PDF focus can report a null target before the iframe becomes
  // active. Only a known outside focus destination dismisses an explicit reader.
  panel.addEventListener('focusout',e=>{if(current===state&&e.relatedTarget&&!contains(panel,e.relatedTarget)&&!contains(data.card,e.relatedTarget))close();});
  if(keyboard)dismiss.focus();await load(state);
 }
 function hover(e){const card=e.target.closest?.('.ae-record-card[data-ae-kind="resource"]');if(card&&e.target.closest('button:not([data-ae-preview-open]),input,select,.dropdown-menu,.dropdown-toggle')){cancelHover();if(current?.info.card===card&&!current.pinned)close();return;}if(!card||contains(card,e.relatedTarget)||current?.pinned||current?.info.card===card)return;close();hoverCard=card;pending=setTimeout(()=>{if(hoverCard===card)open(card);},320);}
 function leave(e){const card=e.target.closest?.('.ae-record-card[data-ae-kind="resource"]');if(card&&!contains(card,e.relatedTarget)){if(hoverCard===card)cancelHover();if(current?.info.card===card)leavePreview(e.relatedTarget);}}
 function sync(){queued=false;
  if(!enabled()){close();cache.clear();cacheBytes=0;document.querySelectorAll(own).forEach(n=>n.remove());return;}
  if(current&&!active(current))close();
  document.querySelectorAll(own).forEach(n=>{if(!n.closest('.ae-record-card[data-ae-kind="resource"]'))n.remove();});
  for(const card of document.querySelectorAll('.ae-record-card[data-ae-kind="resource"]')){
   const cell=card.querySelector('[data-ae-primary="true"]')||card;if(cell.querySelector(own)||!info(card))continue;
   const wrap=document.createElement('span');wrap.setAttribute('data-ae-preview-control','');wrap.className='ae-preview-control';
   const button=document.createElement('button');button.type='button';button.setAttribute('data-ae-preview-open','');button.className='ae-preview-trigger';button.textContent='Preview';button.setAttribute('aria-label','Preview '+info(card).title);wrap.append(button);cell.append(wrap);
  }
 }
 const schedule=()=>{if(!queued){queued=true;queueMicrotask(sync);}};
 const observer=new MutationObserver(records=>{if(records.every(r=>r.target.parentElement?.closest(own+',.ae-resource-preview')))return;schedule();});observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','aria-hidden']});
 const settings=new MutationObserver(schedule);settings.observe(host.documentElement,{attributes:true,attributeFilter:['class']});
 document.addEventListener('pointerover',hover,{passive:true});document.addEventListener('pointerout',leave,{passive:true});
 // Observe the portal as well as an embedded tool, including viewport exits.
 // Pointer movement is a fallback when a native DOM change suppresses a leave.
 document.addEventListener('pointermove',outside,{passive:true});document.documentElement.addEventListener('pointerleave',boundary,{passive:true});
 if(host!==document){host.addEventListener('pointerover',outside,{passive:true});host.addEventListener('pointermove',outside,{passive:true});host.documentElement.addEventListener('pointerleave',boundary,{passive:true});}
 document.addEventListener('click',e=>{const trigger=e.target.closest?.('[data-ae-preview-open]');if(trigger){const card=trigger.closest('.ae-record-card');if(card)open(card,true);}});
 const key=e=>{if(e.key==='Escape'&&current)close(true);};host.addEventListener('keydown',key);
 const scroll=e=>{if(hoverCard&&!hoverCard.matches(':hover'))cancelHover();if(current&&!contains(current.panel,e?.target)){if(current.pinned)position(current);else close();}};host.addEventListener('scroll',scroll,true);window.addEventListener('scroll',scroll,true);top.addEventListener('resize',scroll);
 const message=e=>{const s=current;if(!s?.frame||e.source!==s.frame.contentWindow||e.origin!==s.viewerOrigin||e.data?.type!==(s.viewerKind==='pdf'?'aether-pdf-preview':'aether-office-preview')||e.data.token!==s.token)return;
  if(e.data.state==='ready'&&s.bytes){const bytes=s.bytes.slice(0);s.frame.contentWindow.postMessage({type:s.viewerKind==='pdf'?'aether-pdf-data':'aether-office-data',token:s.token,bytes,name:s.info.title,extension:s.info.extension},s.viewerOrigin,[bytes]);s.bytes=null;}
  if(['rendered','error'].includes(e.data.state))clearTimeout(s.timeout);if(e.data.state==='rendered'){if(s.viewerKind==='pdf')s.panel.dataset.pdfPage=e.data.page;else{s.panel.dataset.officePage=e.data.page;s.panel.dataset.officeKind=e.data.kind;}}if(e.data.state==='error'&&s.viewerKind==='office')status(s,clean(e.data.message).slice(0,600)||'This document cannot be previewed. Open the original resource.');if(e.data.state==='close')close(true);
 };top.addEventListener('message',message);
 window.addEventListener('pagehide',e=>{if(e.persisted){close();return;}close();observer.disconnect();settings.disconnect();host.removeEventListener('keydown',key);host.removeEventListener('scroll',scroll,true);top.removeEventListener('resize',scroll);top.removeEventListener('message',message);host.removeEventListener('aether-preview-close-all',close);host.removeEventListener('securitypolicyviolation',policy);if(host!==document){host.removeEventListener('pointerover',outside);host.removeEventListener('pointermove',outside);host.documentElement.removeEventListener('pointerleave',boundary);}});
 const policy=e=>{const s=current;if(s?.frame&&/frame-src|child-src/.test(e.effectiveDirective)&&String(e.blockedURI).startsWith('chrome-extension:')){clearTimeout(s.timeout);s.frame.remove();s.frame=null;status(s,'This site blocks embedded document previews. Open the original resource.');}};
 host.addEventListener('securitypolicyviolation',policy);
 host.addEventListener('aether-preview-close-all',close);
 schedule();
})();
