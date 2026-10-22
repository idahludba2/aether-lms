/* On-page evidence only. Never fetches academic information or invents metrics. */
(() => {
  'use strict';
  function make(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;}
  function safe(href){try{const u=new URL(href,location.href);return u.origin===location.origin&&u.protocol==='https:'?u.href:null;}catch{return null;}}
  function create(ctx){
    if(!ctx.home)return null;
    const section=make('section','ae-radar');section.setAttribute('aria-label','Academic activity from this page');
    const header=make('div','ae-radar-head'),intro=make('div','');intro.append(make('div','ae-overline','02 / ACADEMIC SIGNAL'),make('h2','ae-radar-heading','Keep your next move in view.'));
    header.append(intro,make('span','ae-signal-label','ON-PAGE ACTIVITY'));section.append(header);
    const body=make('div','ae-radar-body'),signal=make('div','ae-radar-signal');signal.setAttribute('aria-hidden','true');
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 600 220');
    const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d','M0 164 L68 164 L106 102 L180 102 L214 139 L282 139 L330 62 L420 62 L455 106 L522 106 L562 30 L600 30');path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','1.5');svg.append(path);
    for(const [x,y]of [[106,102],[214,139],[330,62],[455,106],[562,30]]){const dot=document.createElementNS(svg.namespaceURI,'circle');dot.setAttribute('cx',x);dot.setAttribute('cy',y);dot.setAttribute('r','4');svg.append(dot);}signal.append(svg,make('span','ae-signal-caption','PROCEDURAL SIGNAL / DECORATIVE'));
    const list=make('div','ae-radar-list');
    const candidates=ctx.main.querySelectorAll('.Mrphs-sakai-summary-calendar a[href],.Mrphs-sakai-synoptic-announcement a[href],.Mrphs-sakai-summary-assignment a[href],.announcement-item a[href],.assignment-item a[href],.calendar-event a[href]');
    const seen=new Set();for(const a of candidates){if(list.children.length===4)break;const href=safe(a.getAttribute('href')),title=a.textContent.replace(/\s+/g,' ').trim();if(!href||!title||a.closest('#aether-workspace')||seen.has(title))continue;seen.add(title);const item=make('a','ae-signal-item');item.href=href;item.append(make('span','ae-signal-index',String(list.children.length+1).padStart(2,'0')),make('span','',title),make('span','ae-signal-arrow','↗'));list.append(item);}
    if(!list.children.length){list.append(make('p','ae-radar-empty','No verified deadlines or activity are available on this page.'));
      for(const t of ctx.menu.filter(t=>/calendar|assignment|announcement/i.test(t.text)).slice(0,3)){const a=make('a','ae-signal-item','Open '+t.text+' in Sakai ↗');a.href=t.href;list.append(a);}
      if(list.children.length===1){const a=make('a','ae-signal-item','Browse your original course tools ↗');a.href='#aether-course-dock';list.append(a);}
    }
    body.append(signal,list);section.append(body);section.append(make('p','ae-radar-source','SOURCE / Current Sakai page. Open each item for its original details.'));
    return section;
  }
  globalThis.AetherDashboard={create};
})();
