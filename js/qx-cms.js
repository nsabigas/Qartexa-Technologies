/* ========================================================================
   QARTEXA V3: SITE EDITING, VISITOR SIDE  (js/qx-cms.js)  . loaded on every page
   Applies what was edited in the Studio to the page: text (English/French),
   images (replace, zoom, focus), links (change address, hide, add), the logo,
   contact details, social links and the partner logos.
   Every page still contains its original text, so nothing breaks if the database
   is unreachable; saved edits simply replace the original wording.
   ======================================================================== */
(function(){
'use strict';
const html=document.documentElement;
const release=()=>html.classList.remove('qx-wait');
const QX=window.QX;
if(!QX||QX.mode==='none'){release();return;}
const U=QX.util,B=QX.BASE,PAGE=html.getAttribute('data-cms-page')||'';
const ORIG=new WeakMap();      // element -> its original wording / image / link (for "Reset")
const edited=new Set();        // elements currently showing an edit
const custom=[];               // links added in the Studio
let OV={};                     // key -> data
const EMAIL0='info@qartexa.com',TEL0='+250788301516';

/* ---------- safety: only allow normal web addresses and images ---------- */
const safeUrl=u=>{u=String(u||'').trim();if(!u)return '';if(/^(https?:|mailto:|tel:|data:image\/|#)/i.test(u))return u;if(/^[a-z][a-z0-9+.-]*:/i.test(u))return '';return u;};
const resolve=u=>/^(https?:|mailto:|tel:|data:|#|\/)/i.test(u)?u:B+u.replace(/^\.\//,'');
const snap=(el,fn)=>{if(!ORIG.has(el))ORIG.set(el,fn());return ORIG.get(el);};
const pageOf=key=>/^(g\.|i\.g\.|l\.g\.)/.test(key)?'global':PAGE;

/* ---------- text ---------- */
function setText(el,t){
  const nodes=[].slice.call(el.childNodes),kids=nodes.filter(n=>n.nodeType===1);
  if(!kids.length){el.textContent=t;return;}
  const first=nodes.find(n=>n.nodeType===3&&n.textContent.trim());
  if(first)first.textContent=t+' ';else el.insertBefore(document.createTextNode(t+' '),el.firstChild);
}
function applyText(el,d){
  snap(el,()=>({en:el.getAttribute('data-en'),fr:el.getAttribute('data-fr')}));
  if(d.en)el.setAttribute('data-en',d.en);if(d.fr)el.setAttribute('data-fr',d.fr);
  setText(el,U.lang()==='fr'?(el.getAttribute('data-fr')||el.getAttribute('data-en')):el.getAttribute('data-en'));
  el.classList.add('qx-edited');edited.add(el);
}
function resetText(el){const o=ORIG.get(el);if(!o)return;if(o.en!=null)el.setAttribute('data-en',o.en);if(o.fr!=null)el.setAttribute('data-fr',o.fr);setText(el,U.lang()==='fr'?o.fr:o.en);el.classList.remove('qx-edited');edited.delete(el);}

/* ---------- images (a picture, or a background picture) ---------- */
function applyImg(el,d){
  if(el.hasAttribute('data-qx-hero'))return;   /* this image is managed in Staff portal > Page heroes */
  const isImg=el.tagName==='IMG';
  snap(el,()=>({src:isImg?el.getAttribute('src'):el.style.backgroundImage,alt:el.getAttribute('alt'),style:el.getAttribute('style')||''}));
  const z=Math.max(1,Math.min(3,Number(d.zoom)||1)),x=d.x==null?50:d.x,y=d.y==null?50:d.y,u=safeUrl(d.src);
  if(isImg){
    if(u){el.removeAttribute('srcset');el.setAttribute('src',resolve(u));}
    el.style.objectFit='cover';el.style.objectPosition=x+'% '+y+'%';
    if(z>1){el.style.transform='scale('+z+')';el.style.transformOrigin=x+'% '+y+'%';if(el.parentElement)el.parentElement.style.overflow='hidden';}else{el.style.transform='';}
    const alt=U.lang()==='fr'?(d.alt_fr||d.alt_en):d.alt_en;if(alt)el.setAttribute('alt',alt);
  }else{
    if(u)el.style.setProperty('background-image','url("'+resolve(u).replace(/"/g,'%22')+'")','important');
    el.style.setProperty('background-position',x+'% '+y+'%','important');
    el.style.setProperty('background-size',z>1?'auto '+(100*z)+'%':'cover','important');
  }
  el.classList.add('qx-edited');edited.add(el);
}
function resetImg(el){
  const o=ORIG.get(el);if(!o)return;
  if(el.tagName==='IMG'){if(o.src!=null)el.setAttribute('src',o.src);if(o.alt!=null)el.setAttribute('alt',o.alt);}
  if(o.style)el.setAttribute('style',o.style);else el.removeAttribute('style');
  if(el.parentElement&&el.tagName==='IMG')el.parentElement.style.overflow='';
  el.classList.remove('qx-edited');edited.delete(el);
}

/* ---------- links ---------- */
function applyLink(el,d){
  snap(el,()=>({href:el.getAttribute('href'),target:el.getAttribute('target'),rel:el.getAttribute('rel')}));
  const u=safeUrl(d.href);
  if(u){el.setAttribute('href',resolve(u));if(/^https?:/i.test(u)){el.setAttribute('target','_blank');el.setAttribute('rel','noopener noreferrer');}}
  el.classList.toggle('qx-gone',!!d.hidden);
  el.classList.add('qx-edited');edited.add(el);
}
function resetLink(el){const o=ORIG.get(el);if(!o)return;el.setAttribute('href',o.href);o.target?el.setAttribute('target',o.target):el.removeAttribute('target');o.rel?el.setAttribute('rel',o.rel):el.removeAttribute('rel');el.classList.remove('qx-gone','qx-edited');edited.delete(el);}

function applyAll(){
  document.querySelectorAll('[data-cms]').forEach(el=>{if(el.classList.contains('qx-dyn'))return;const d=OV[el.getAttribute('data-cms')];if(d&&(d.en||d.fr))applyText(el,d);});
  document.querySelectorAll('[data-cms-img],[data-cms-bg]').forEach(el=>{const d=OV[el.getAttribute('data-cms-img')||el.getAttribute('data-cms-bg')];if(d)applyImg(el,d);});
  document.querySelectorAll('[data-cms-link]').forEach(el=>{if(el.classList.contains('qx-dyn'))return;const d=OV[el.getAttribute('data-cms-link')];if(d)applyLink(el,d);});
}

/* ---------- settings: logo, contact, social, added links ---------- */
function logos(S){
  ['header','footer'].forEach(w=>{
    const el=document.querySelector('[data-cms-logo="'+w+'"]'),d=S['logo_'+w];if(!el||!d)return;
    const base=el.getBoundingClientRect().width||(w==='header'?170:180);
    if(d.src){const u=safeUrl(d.src);if(u){el.removeAttribute('srcset');el.setAttribute('src',resolve(u));}}
    const sc=Math.max(.4,Math.min(2,Number(d.scale)||1));
    if(sc!==1){el.style.width=Math.round(base*sc)+'px';el.style.height='auto';el.style.maxWidth='none';const p=el.closest('.brand');if(p){p.style.width='auto';p.style.flex='0 0 auto';}}
  });
}
function contact(S){
  const c=S.contact;if(!c)return;
  if(c.email)document.querySelectorAll('a[href="mailto:'+EMAIL0+'"]').forEach(a=>{a.setAttribute('href','mailto:'+c.email);if(a.textContent.trim()===EMAIL0)a.textContent=c.email;});
  if(c.phone)document.querySelectorAll('a[href="tel:'+TEL0+'"]').forEach(a=>{a.setAttribute('href','tel:'+c.phone.replace(/[^+\d]/g,''));a.textContent=c.phone;});
}
function social(S){
  const s=S.social;if(!s)return;
  const map={linkedin:/linkedin\.com/,instagram:/instagram\.com/,x:/(^|\/\/)(www\.)?x\.com|twitter\.com/,facebook:/facebook\.com/};
  document.querySelectorAll('.social-links a').forEach(a=>{
    const h=a.getAttribute('data-orig-href')||a.getAttribute('href');a.setAttribute('data-orig-href',h);
    Object.keys(map).forEach(k=>{if(map[k].test(h)&&k in s){const u=safeUrl(s[k]);if(u)a.setAttribute('href',u);else a.classList.add('qx-gone');}});
  });
}

/* ---------- social media manager (V4): links come from the social_links table ---------- */
let iconsP=null;
function loadIcons(){
  if(window.QX_ICONS)return Promise.resolve(window.QX_ICONS);
  if(iconsP)return iconsP;
  iconsP=new Promise(res=>{const sc=document.createElement('script');sc.src=B+'js/qx-icons.js';sc.onload=()=>res(window.QX_ICONS||{});sc.onerror=()=>res({});document.head.appendChild(sc);});
  return iconsP;
}
const NS='http://www.w3.org/2000/svg';
function iconNode(row,lib){
  let markup=null;
  if(row.icon_svg)markup=QX.safe.svg(row.icon_svg);                         /* custom SVG: sanitised again at display time */
  if(!markup){const ic=lib[row.icon_key]||lib[row.platform]||lib.link;if(ic){markup='<svg xmlns="'+NS+'" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="'+ic[1].replace(/"/g,'')+'"/></svg>';}}
  if(!markup)return null;
  const d=new DOMParser().parseFromString(markup,'image/svg+xml');return document.importNode(d.documentElement,true);
}
function socialAnchor(row,lib){
  const href=QX.safe.link(row.url);if(!href)return null;
  const a=document.createElement('a');a.href=href;
  if(/^https:/i.test(href)){a.target='_blank';a.rel='noopener noreferrer';}
  const fr=U.lang()==='fr';
  a.setAttribute('aria-label',(fr?'Qartexa sur ':'Qartexa on ')+row.name);a.title=row.name;a.setAttribute('data-qx-social-id',row.id||'');
  const ic=iconNode(row,lib);if(ic)a.appendChild(ic);else a.textContent=row.name;
  return a;
}
async function socialManager(rows){
  const lib=await loadIcons();
  const where=p=>rows.filter(r=>r.visible!==false&&(r.placements||['footer']).indexOf(p)>-1).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));
  const fill=(box,list)=>{while(box.firstChild)box.removeChild(box.firstChild);list.forEach(r=>{const a=socialAnchor(r,lib);if(a)box.appendChild(a);});};
  /* footer: every existing .social-links box inside a footer is rebuilt from the list */
  const f=where('footer');
  document.querySelectorAll('footer .social-links').forEach(box=>{
    fill(box,f);const blk=box.closest('.social-block');if(blk)blk.hidden=!f.length;
    /* the old handle line ("@qartexatech") belonged to the 4 fixed accounts; hide it when the list changes */
    const h=blk&&blk.querySelector('.social-handle');if(h)h.hidden=true;
  });
  /* header: a compact icon group before the language button */
  const h=where('header'),tools=document.querySelector('header .nav-tools');
  if(h.length&&tools){let box=tools.querySelector('.qx-social-header');if(!box){box=document.createElement('div');box.className='social-links qx-social-header';box.setAttribute('aria-label',U.lang()==='fr'?'Réseaux sociaux':'Social media');tools.insertBefore(box,tools.firstChild);}fill(box,h);}
  /* contact page: inside the dark side panel */
  const c=where('contact'),aside=document.querySelector('.enquiry-aside');
  if(c.length&&aside){let box=aside.querySelector('.qx-social-contact');if(!box){box=document.createElement('div');box.className='social-links qx-social-contact';box.setAttribute('aria-label',U.lang()==='fr'?'Réseaux sociaux':'Social media');aside.appendChild(box);}fill(box,c);}
  document.querySelectorAll('.qx-social-header a,.qx-social-contact a,footer .social-links a').forEach(a=>{const r=rows.find(x=>x.id===a.getAttribute('data-qx-social-id'));if(r)a.setAttribute('aria-label',(U.lang()==='fr'?'Qartexa sur ':'Qartexa on ')+r.name);});
}
function customLinks(S){
  const list=S.custom_links;if(!Array.isArray(list))return;
  list.forEach(c=>{
    const ref=document.querySelector('[data-cms-link="'+c.after+'"]');if(!ref||!c.href)return;
    const a=ref.cloneNode(true);a.classList.remove('qx-gone','qx-edited');a.classList.add('qx-dyn');
    a.querySelectorAll('[data-cms],[data-cms-link]').forEach(x=>{x.removeAttribute('data-cms');x.removeAttribute('data-cms-link');});
    a.removeAttribute('data-cms');a.removeAttribute('data-cms-link');a.setAttribute('data-custom-id',c.id);
    const u=safeUrl(c.href);a.setAttribute('href',resolve(u));if(/^https?:/i.test(u)){a.setAttribute('target','_blank');a.setAttribute('rel','noopener noreferrer');}
    const reg={el:a,c:c};custom.push(reg);renderCustom(reg);
    ref.insertAdjacentElement('afterend',a);
  });
}
function renderCustom(r){
  const t=U.lang()==='fr'?(r.c.label_fr||r.c.label_en):r.c.label_en;
  r.el.setAttribute('data-en',r.c.label_en);r.el.setAttribute('data-fr',r.c.label_fr||r.c.label_en);
  const strong=r.el.querySelector('strong');
  if(strong){strong.textContent=t;const sub=r.el.querySelector('span');if(sub)sub.textContent='';}
  else{const sp=r.el.querySelector('span[data-en]');if(sp){sp.setAttribute('data-en',r.c.label_en);sp.setAttribute('data-fr',r.c.label_fr||r.c.label_en);sp.textContent=t;}else r.el.textContent=t;}
}

/* ---------- partner logos ---------- */
function partners(rows){
  if(!rows||!rows.length)return;
  document.querySelectorAll('.partner-track').forEach(track=>{
    const groups=[].slice.call(track.querySelectorAll('.partner-group'));if(!groups.length)return;
    const tpl=groups[0].querySelector('.partner-logo');if(!tpl)return;
    const make=()=>rows.map(p=>{const d=tpl.cloneNode(true);const img=d.querySelector('img');if(img){img.removeAttribute('srcset');img.removeAttribute('width');img.removeAttribute('height');img.src=resolve(safeUrl(p.logo_url)||p.logo_url);img.alt=p.name;img.loading='lazy';}
      if(p.website&&/^https?:/i.test(p.website)){const a=document.createElement('a');a.href=p.website;a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('aria-label',p.name);a.style.display='contents';while(d.firstChild)a.appendChild(d.firstChild);d.appendChild(a);}
      return d;});
    groups.forEach(g=>{while(g.firstChild)g.removeChild(g.firstChild);make().forEach(n=>g.appendChild(n));});
  });
}

/* ---------- expose for the Studio ---------- */
QX.cms={page:PAGE,ov:()=>OV,orig:el=>ORIG.get(el),applyText:applyText,resetText:resetText,applyImg:applyImg,resetImg:resetImg,applyLink:applyLink,resetLink:resetLink,pageOf:pageOf,safeUrl:safeUrl,
  async save(key,data){await QX.store.upsert('cms_overrides',{key:key,page:pageOf(key),data:data},'key');OV[key]=data;},
  async revert(key){await QX.store.removeWhere('cms_overrides','key',key);delete OV[key];},
  async saveSettings(key,value){await QX.store.upsert('site_settings',{key:key,value:value},'key');},
  async settings(){return (await QX.settings())||{};}};

/* ---------- start ---------- */
async function start(){
  let ov=[],S={},P=[],SL=[];
  try{[ov,S,P,SL]=await Promise.all([QX.overrides(PAGE).catch(()=>[]),QX.settings().catch(()=>({})),QX.publicRows('partners').catch(()=>[]),QX.social().catch(()=>[])]);}catch(e){}
  (ov||[]).forEach(r=>{OV[r.key]=r.data||{};});S=S||{};
  try{applyAll();logos(S);contact(S);if(SL&&SL.length)socialManager(SL);else social(S);customLinks(S);partners(P);}catch(e){}
  if(SL&&SL.length)U.onLang(()=>socialManager(SL));
  release();
  U.onLang(()=>{edited.forEach(el=>{if(el.hasAttribute('data-cms')&&OV[el.getAttribute('data-cms')])applyText(el,OV[el.getAttribute('data-cms')]);});custom.forEach(renderCustom);});
  /* staff only: load the visual editor */
  if(QX.auth.session()){QX.auth.isAdmin().then(ok=>{if(!ok)return;if(window.QX_STUDIO){window.QX_STUDIO.init(QX);return;}
    const l=document.createElement('link');l.rel='stylesheet';l.href=B+'css/qx-studio.css';document.head.appendChild(l);
    const s=document.createElement('script');s.src=B+'js/qx-studio.js';s.onload=()=>window.QX_STUDIO&&window.QX_STUDIO.init(QX);document.head.appendChild(s);}).catch(()=>{});}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
setTimeout(release,1500);
})();
