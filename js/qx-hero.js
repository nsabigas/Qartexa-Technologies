/* ========================================================================
   QARTEXA V5: PAGE HERO IMAGES  (js/qx-hero.js)
   Shows the hero images chosen in Staff portal > Page heroes. The images come
   from the Media Library (several sizes in WebP/AVIF), so the page gets the
   right size for the device. If a page has no custom hero, nothing changes:
   the original banner stays exactly as designed.
   ======================================================================== */
(function(){
'use strict';
var QX=window.QX;if(!QX)return;
var doc=document,html=doc.documentElement;
var inPortal=/(^|\/)(admin|portal)\.html$/.test(location.pathname);
var PAGE=html.getAttribute('data-cms-page')||'';
var BASE=(QX.config&&QX.config.supabaseUrl||'').replace(/\/$/,'')+'/storage/v1/object/public/media/';
var TABLET='(max-width:1024px)',MOBILE='(max-width:640px)';
var lang=function(){return QX.util&&QX.util.lang?QX.util.lang():'en';};

function url(p){return BASE+String(p).split('/').map(encodeURIComponent).join('/');}
/* srcset text for one format from a media record */
function srcset(rec,fmt){
  var v=(rec.variants||[]).filter(function(x){return x.fmt===fmt;}).sort(function(a,b){return a.w-b.w;});
  return v.map(function(x){return url(x.path)+' '+x.w+'w';}).join(', ');
}
function fallback(rec){
  var v=(rec.variants||[]).filter(function(x){return x.fmt==='jpg';}).sort(function(a,b){return b.w-a.w;})[0]
     ||(rec.variants||[]).filter(function(x){return x.fmt==='webp';}).sort(function(a,b){return b.w-a.w;})[0];
  return v?url(v.path):'';
}
function pictureHtml(media,cfg,eager,sizes){
  var d=media.desktop;if(!d)return null;
  var out='';
  [['mobile',MOBILE],['tablet',TABLET]].forEach(function(p){var r=media[p[0]];if(!r)return;
    ['avif','webp'].forEach(function(f){var s=srcset(r,f);if(s)out+='<source media="'+p[1]+'" type="image/'+f+'" srcset="'+s+'" sizes="'+sizes+'">';});});
  ['avif','webp'].forEach(function(f){var s=srcset(d,f);if(s)out+='<source type="image/'+f+'" srcset="'+s+'" sizes="'+sizes+'">';});
  return out;
}
function altFor(cfg,rec){var fr=lang()==='fr';return (fr&&cfg.alt_fr)||cfg.alt_en||(fr&&rec&&rec.alt_fr)||(rec&&rec.alt_en)||'';}

/* ---------- apply ---------- */
function heroEl(){return doc.querySelector('section.hero, section.subhero, header.subhero, .subhero');}
function clear(){
  var h=doc.querySelector('.qx-hero-custom');
  if(h){var m=h.querySelector(':scope>.qx-hero-media');if(m)m.remove();
    h.classList.remove('qx-hero-custom','qx-hero-light','qx-hero-dark','qx-zoom');['--qx-min-h','--qx-fx','--qx-fy','--qx-ov-color','--qx-ov-op'].forEach(function(p){h.style.removeProperty(p);});}
  doc.querySelectorAll('.hero-visual .frame[data-qx-hero]').forEach(function(fr){['background-image','background-size','background-position'].forEach(function(p){fr.style.removeProperty(p);});fr.removeAttribute('data-qx-hero');});
  doc.querySelectorAll('.qx-side-pic[data-qx-orig]').forEach(function(p){var img=p.querySelector('img');if(img&&p.parentNode){var o=img.cloneNode(true);var orig=JSON.parse(p.getAttribute('data-qx-orig'));Object.keys(orig).forEach(function(k){if(orig[k]==null)o.removeAttribute(k);else o.setAttribute(k,orig[k]);});p.parentNode.replaceChild(o,p);}});
}
function applyBanner(cfg,media){
  var h=heroEl();if(!h||!media.desktop)return;
  var sizes='100vw',inner=pictureHtml(media,cfg,true,sizes),fb=fallback(media.desktop);
  var wrap=doc.createElement('div');wrap.className='qx-hero-media';
  var alt=altFor(cfg,media.desktop);
  wrap.setAttribute('aria-hidden',alt?'false':'true');
  wrap.innerHTML='<picture>'+inner+'<img src="'+fb+'" alt="" decoding="async" fetchpriority="high" width="'+media.desktop.width+'" height="'+media.desktop.height+'"></picture><div class="qx-hero-overlay"></div>';
  wrap.querySelector('img').setAttribute('alt',alt);
  var old=h.querySelector(':scope>.qx-hero-media');if(old)old.remove();
  h.insertBefore(wrap,h.firstChild);
  h.classList.add('qx-hero-custom');
  var o=cfg.overlay||{color:'#062650',opacity:.55},f=cfg.focal||{x:50,y:50},ht=cfg.height||{mode:'auto'};
  h.style.setProperty('--qx-fx',f.x+'%');h.style.setProperty('--qx-fy',f.y+'%');
  h.style.setProperty('--qx-ov-color',/^#[0-9a-f]{6}$/i.test(o.color)?o.color:'#062650');h.style.setProperty('--qx-ov-op',String(Math.max(0,Math.min(1,+o.opacity))));
  var px={compact:360,standard:480,tall:640}[ht.mode]||(ht.mode==='custom'?+ht.px:0);
  if(px)h.style.setProperty('--qx-min-h',Math.max(200,Math.min(1100,px))+'px');else h.style.removeProperty('--qx-min-h');
  /* the home page also shows the same photo inside a framed panel: it follows the new picture */
  var fr=h.querySelector('.hero-visual .frame');
  if(fr){var fv=(media.desktop.variants||[]).filter(function(x){return x.fmt==='webp'&&x.w<=1280;}).sort(function(a,b){return b.w-a.w;})[0];
    if(fv){fr.style.backgroundImage='url("'+url(fv.path)+'")';fr.style.backgroundSize='cover';fr.style.backgroundPosition=f.x+'% '+f.y+'%';fr.setAttribute('data-qx-hero','1');}}
  h.classList.remove('qx-hero-light','qx-hero-dark');h.classList.add(cfg.text==='dark'?'qx-hero-dark':'qx-hero-light');
  h.classList.toggle('qx-zoom',cfg.zoom!==false&&cfg.zoom===true);
}
function applySide(cfg,media,slotId){
  var img=slotId&&doc.querySelector('[data-cms-img="'+slotId+'"]');if(!img||img.tagName!=='IMG'||!media.desktop)return;
  var f=cfg.focal||{x:50,y:50},pic=img.closest('.qx-side-pic');
  if(!pic){
    pic=doc.createElement('picture');pic.className='qx-side-pic';
    var keep={};['src','srcset','sizes','alt','width','height','style','loading'].forEach(function(k){keep[k]=img.getAttribute(k);});
    pic.setAttribute('data-qx-orig',JSON.stringify(keep));
    img.parentNode.replaceChild(pic,img);pic.appendChild(img);
  }
  var sizes='(max-width:900px) 100vw, 50vw';
  pic.querySelectorAll('source').forEach(function(s){s.remove();});
  var tmp=doc.createElement('div');tmp.innerHTML=pictureHtml(media,cfg,false,sizes)||'';
  Array.prototype.slice.call(tmp.children).reverse().forEach(function(s){pic.insertBefore(s,pic.firstChild);});
  img.removeAttribute('srcset');img.setAttribute('src',fallback(media.desktop));img.setAttribute('sizes',sizes);
  img.setAttribute('width',media.desktop.width);img.setAttribute('height',media.desktop.height);
  img.setAttribute('alt',altFor(cfg,media.desktop));
  img.setAttribute('data-qx-hero','1');img.style.objectFit='cover';img.style.objectPosition=f.x+'% '+f.y+'%';
}
function applyCard(key,cfg,media){
  var n=+String(key).split(':').pop();var el=doc.querySelector('.capability-group:nth-child('+n+')');if(!el||!media.desktop)return;
  var v=(media.desktop.variants||[]).filter(function(x){return x.fmt==='webp'&&x.w<=1280;}).sort(function(a,b){return b.w-a.w;})[0];if(!v)return;
  el.style.setProperty('--qx-card-'+n,'url("'+url(v.path)+'")');
}
function apply(entry){
  /* entry: {mode,cfg,media:{desktop,tablet,mobile},slot} */
  if(!entry||!entry.cfg)return;
  if(entry.mode==='side')applySide(entry.cfg,entry.media,entry.slot);else applyBanner(entry.cfg,entry.media);
}
window.QX_HERO={apply:apply,clear:clear,srcset:srcset,fallback:fallback,url:url,pictureHtml:pictureHtml};

/* ---------- loading ---------- */
function slotIdFor(page){var inv=window.QX_INVENTORY;if(!inv)return null;var p=inv.pages.filter(function(x){return x.key===page;})[0];return p&&p.slot?p.slot.id:null;}
var CK='qx_hero_v1_'+PAGE;
function resolve(row,mediaRows){
  var cfg=row.config||{},m={};['desktop','tablet','mobile'].forEach(function(k){var id=cfg.media&&cfg.media[k];if(id&&mediaRows[id])m[k]=mediaRows[id];});
  return {mode:cfg.mode||'banner',cfg:cfg,media:m,slot:cfg.mode==='side'?slotIdFor(PAGE):null};
}
function load(){
  if(inPortal||!PAGE)return;
  var inFrame=window.parent!==window&&/[?&]qx_preview=1/.test(location.search);
  if(!inFrame){try{var c=JSON.parse(localStorage.getItem(CK)||'null');if(c&&c.entry){var ent=c.entry;ent.slot=ent.mode==='side'?slotIdFor(PAGE):null;apply(ent);}}catch(e){}}
  if(inFrame)return;
  QX.cached('page_heroes',function(){return QX.store.list('page_heroes',{});}).then(function(rows){
    rows=rows||[];
    var mine=rows.filter(function(r){return r.page_key===PAGE;})[0],cards=rows.filter(function(r){return r.page_key.indexOf('card:')===0&&(window.QX_INVENTORY?window.QX_INVENTORY.cards.some(function(c){return c.key===r.page_key&&c.page===PAGE;}):PAGE==='index');});
    var need={};[mine].concat(cards).forEach(function(r){if(!r)return;var m=(r.config||{}).media||{};Object.keys(m).forEach(function(k){if(m[k])need[m[k]]=1;});});
    var ids=Object.keys(need);
    var get=ids.length?QX.store.list('media',{where:{id:ids}}):Promise.resolve([]);
    return get.then(function(ms){
      var map={};(ms||[]).forEach(function(x){map[x.id]=x;});
      clear();
      if(mine){var e=resolve(mine,map);apply(e);try{localStorage.setItem(CK,JSON.stringify({entry:{mode:e.mode,cfg:e.cfg,media:e.media}}));}catch(x){}}
      else{try{localStorage.removeItem(CK);}catch(x){}}
      cards.forEach(function(r){var e=resolve(r,map);applyCard(r.page_key,e.cfg,e.media);});
    });
  }).catch(function(){});
}
/* staff portal preview: a frame receives a draft and shows it at once */
window.addEventListener('message',function(e){
  if(e.origin!==location.origin||!e.data||e.data.type!=='qx-hero-preview')return;
  clear();
  if(!e.data.config){return;}
  var cfg=e.data.config,m={};
  if(cfg&&cfg.mode==='card'){var mm2={};if(cfg.media&&cfg.media.desktop&&e.data.media)mm2.desktop=e.data.media[cfg.media.desktop];applyCard(e.data.page_key,cfg,mm2);return;}['desktop','tablet','mobile'].forEach(function(k){var id=cfg.media&&cfg.media[k];if(id&&e.data.media&&e.data.media[id])m[k]=e.data.media[id];});
  apply({mode:cfg.mode||'banner',cfg:cfg,media:m,slot:cfg.mode==='side'?slotIdFor(PAGE):null});
});
if(QX.util&&QX.util.onLang)QX.util.onLang(function(){var im=doc.querySelector('.qx-hero-media img');});
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',load);else load();
})();
