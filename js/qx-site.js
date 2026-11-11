/* ========================================================================
   QARTEXA V2: SITE PATCHER  (js/qx-site.js)  . loaded on every page
   Reads the solutions list from the database and
     * hides solutions that were switched off in the staff portal
       (menu, footer, home cards, overview page, the solution's own page)
     * adds solutions that were created in the staff portal
       (menu, footer, home cards, overview page)
     * fills the "Latest from Qartexa" band on the home page.
   If the database is not connected, or has no data, nothing changes.
   ======================================================================== */
(function(){
'use strict';
if(!window.QX||QX.mode==='none')return;
const U=QX.util,B=QX.BASE;
const CORE=['digital-infrastructure','cloud-modern-workplace','power-energy','cybersecurity','physical-security','managed-ict','software-engineering','ai-digital-transformation','iot-smart-solutions','banking-technology','ict-consultancy'];
const dyn=[];   // dynamic elements that must re-render when the language changes

function css(){
  if(document.getElementById('qx-site-css'))return;
  const s=document.createElement('style');s.id='qx-site-css';
  s.textContent='.qx-noimg{display:block;aspect-ratio:1920/819;background:linear-gradient(135deg,#062650,#0b376d 60%,#e80000 160%)}.qx-gone{display:none!important}.phase4-ecosystem[hidden],.phase4-ecosystem [hidden]{display:none!important}';
  document.head.appendChild(s);
}
const href=r=>r.is_core?B+'solutions/'+r.slug+'.html':B+'solution.html?s='+encodeURIComponent(r.slug);

function slots(){
  const out={menu:{technology:null,connected:null},footer:{technology:null,connected:null},home:[],overview:[]};
  const hdr=document.querySelector('header');
  if(hdr){hdr.querySelectorAll('.mega').forEach(m=>{
    if(!m.querySelector('a[href*="solutions/"][href$=".html"]:not([href$="index.html"])'))return;
    const cols=m.querySelectorAll('.mega-col');
    if(cols[0])out.menu.technology=cols[0];if(cols[1])out.menu.connected=cols[1];});}
  document.querySelectorAll('footer .footer-grid > div').forEach(c=>{
    if(c.querySelector('a[href$="digital-infrastructure.html"]'))out.footer.technology=c;
    if(c.querySelector('a[href$="iot-smart-solutions.html"]'))out.footer.connected=c;});
  out.home=[...document.querySelectorAll('.capability-group')];
  out.overview=[...document.querySelectorAll('.solution-family .family-items')];
  return out;
}
const GROUPS=['infrastructure','security','applications','advisory'];

function makeAnchor(kind,container,r){
  const tpl=container.querySelector(kind==='overview'?'a.page-card':'a[href]');if(!tpl)return null;
  const a=tpl.cloneNode(true);a.removeAttribute('data-qx-core');a.removeAttribute('data-cms');a.removeAttribute('data-cms-link');a.querySelectorAll('[data-cms],[data-cms-link],[data-cms-img]').forEach(x=>{x.removeAttribute('data-cms');x.removeAttribute('data-cms-link');x.removeAttribute('data-cms-img');});a.classList.add('qx-dyn');a.classList.add('visible');
  a.setAttribute('href',href(r));a.removeAttribute('target');
  const reg={el:a,kind:kind,row:r};dyn.push(reg);render(reg);return a;
}
function render(reg){
  const a=reg.el,r=reg.row,title=U.pick(r,'title'),tag=U.pick(r,'tagline'),sum=U.pick(r,'summary');
  if(reg.kind==='menu'){const s=a.querySelector('strong'),p=a.querySelector('span');if(s)s.textContent=title;if(p)p.textContent=tag||sum;}
  else if(reg.kind==='footer'){a.textContent=title;}
  else if(reg.kind==='home'){
    a.setAttribute('data-en',r.title_en);a.setAttribute('data-fr',r.title_fr||r.title_en);
    const arrow=a.querySelector('span');a.textContent='';a.append(document.createTextNode(title+' '));
    const sp=document.createElement('span');sp.textContent=arrow?arrow.textContent:'↗';a.append(sp);
  } else if(reg.kind==='overview'){
    const h=a.querySelector('h3 span'),p=a.querySelector('p span');
    if(h){h.setAttribute('data-en',r.title_en);h.setAttribute('data-fr',r.title_fr||r.title_en);h.textContent=title;}
    if(p){p.setAttribute('data-en',r.summary_en||'');p.setAttribute('data-fr',r.summary_fr||r.summary_en||'');p.textContent=sum;}
    let img=a.querySelector('img,.qx-noimg');
    if(r.image_url){
      if(!img||img.tagName!=='IMG'){const n=document.createElement('img');n.className='page-card-image';n.loading='lazy';n.decoding='async';n.alt='';if(img)img.replaceWith(n);else a.prepend(n);img=n;}
      img.src=/^(https?:|data:)/.test(r.image_url)?r.image_url:B+r.image_url.replace(/^\//,'');img.alt=title;
    } else if(img&&img.tagName==='IMG'){const d=document.createElement('div');d.className='page-card-image qx-noimg';d.setAttribute('aria-hidden','true');img.replaceWith(d);}
  }
}

function hideCore(hidden){
  hidden.forEach(slug=>{
    document.querySelectorAll('a[href$="/'+slug+'.html"],a[href="'+slug+'.html"],a[href$="/'+slug+'.html#"]').forEach(a=>{a.classList.add('qx-gone');});
  });
  document.querySelectorAll('.solution-family').forEach(f=>{if(!f.querySelector('.family-items a:not(.qx-gone)'))f.classList.add('qx-gone');});
  document.querySelectorAll('.capability-group').forEach(g=>{if(!g.querySelector('a[href]:not(.qx-gone)'))g.classList.add('qx-gone');});
  const m=location.pathname.match(/\/solutions\/([\w-]+)\.html$/);
  if(m&&hidden.indexOf(m[1])>-1){
    document.title=(U.lang()==='fr'?'Solution indisponible':'Solution unavailable')+' | Qartexa Technologies';
    const mt=document.createElement('meta');mt.name='robots';mt.content='noindex';document.head.appendChild(mt);
    const main=document.querySelector('main');
    if(main){main.innerHTML='<section class="section"><div class="container" style="padding:80px 0;text-align:center"><h1 style="font-size:clamp(28px,4vw,42px)">'+(U.lang()==='fr'?'Cette solution n’est plus disponible.':'This solution is no longer available.')+'</h1><p style="margin:18px 0 28px;color:var(--muted)">'+(U.lang()==='fr'?'Découvrez nos autres solutions.':'Please explore our other solutions.')+'</p><a class="btn" style="background:var(--red);color:#fff" href="'+B+'solutions/index.html">'+(U.lang()==='fr'?'Voir toutes les solutions':'View all solutions')+'</a></div></section>';}
  }
}

function applySolutions(rows){
  if(!rows||!rows.length)return;
  css();
  const pub=new Set(rows.map(r=>r.slug));
  const hidden=CORE.filter(s=>!pub.has(s));
  const S=slots();
  const fresh=rows.filter(r=>!r.is_core&&CORE.indexOf(r.slug)<0).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));
  fresh.forEach(r=>{
    const mg=r.menu_group==='connected'?'connected':'technology';
    if(S.menu[mg]){const a=makeAnchor('menu',S.menu[mg],r);if(a)S.menu[mg].appendChild(a);}
    if(S.footer[mg]){const a=makeAnchor('footer',S.footer[mg],r);if(a)S.footer[mg].appendChild(a);}
    const gi=Math.max(0,GROUPS.indexOf(r.card_group));
    if(S.home[gi]){const a=makeAnchor('home',S.home[gi],r);if(a)S.home[gi].appendChild(a);}
    if(S.overview[gi]){const a=makeAnchor('overview',S.overview[gi],r);if(a)S.overview[gi].appendChild(a);}
  });
  hideCore(hidden);
}

/* ---------- home page band: latest articles, open positions, open tenders ---------- */
async function homeBand(){
  const root=document.querySelector('[data-qx="home-band"]');if(!root)return;
  const [posts,jobs,tenders]=await Promise.all(['posts','jobs','tenders'].map(n=>QX.publicRows(n).catch(()=>[])));
  const open=tenders.filter(x=>x.status==='open');
  if(!posts.length&&!jobs.length&&!open.length)return;
  const draw=()=>{
    const t=U.t,L=U.lang();
    const col=(title,viewAll,url,items)=>items.length?'<div class="qx-band-col"><h3>'+U.esc(title)+'</h3><ul>'+items.join('')+'</ul><a class="qx-band-all" href="'+B+url+'">'+U.esc(viewAll)+' →</a></div>':'';
    const li=(h,main,sub)=>'<li><a href="'+B+h+'"><strong>'+U.esc(main)+'</strong><span>'+U.esc(sub)+'</span></a></li>';
    const html=
      col(L==='fr'?'Derniers articles':'Latest articles',t('viewAll'),'blog.html',posts.slice(0,3).map(p=>li('post.html?s='+encodeURIComponent(p.slug),U.pick(p,'title'),[p.category,U.fmtDate(p.published_at)].filter(Boolean).join(' • '))))+
      col(L==='fr'?'Postes ouverts':'Open positions',t('viewAll'),'careers.html',jobs.slice(0,3).map(j=>li('job.html?s='+encodeURIComponent(j.slug),U.pick(j,'title'),[j.location,U.label('employment_type',j.employment_type)].filter(Boolean).join(' • '))))+
      col(L==='fr'?'Appels d’offres':'Open tenders',t('viewAll'),'tenders.html',open.slice(0,3).map(x=>li('tender.html?s='+encodeURIComponent(x.slug),U.pick(x,'title'),(x.reference?x.reference+' • ':'')+t('closes')+' '+U.fmtDate(x.closing_date))));
    root.querySelector('[data-qx-slot]').innerHTML=html;
  };
  draw();root.hidden=false;U.onLang(draw);
}

function rerender(){dyn.forEach(render);}
async function applyPartners(){
  const root=document.querySelector('#ecosystem');
  if(!root)return;
  try{
    const results=await Promise.all([QX.publicRows('partners'),QX.settings()]);
    const rows=results[0]||[],settings=results[1]||{};
    if(settings.partners_section_enabled===false){root.hidden=true;return;}
    root.hidden=false;
    if(!rows.length)return;
    const live=new Set(rows.map(r=>String(r.logo_url||'').split('/').pop().toLowerCase()).filter(Boolean));
    root.querySelectorAll('.partner-logo img').forEach(img=>{
      const file=String(img.getAttribute('src')||'').split('/').pop().toLowerCase();
      if(live.has(file)){img.closest('.partner-logo').hidden=false;img.closest('.partner-logo').style.display='';}
      else if(file){img.closest('.partner-logo').hidden=true;img.closest('.partner-logo').style.display='none';}
    });
    root.querySelectorAll('.partner-group').forEach(group=>{
      const logos=[...group.querySelectorAll('.partner-logo')];
      if(logos.length&&logos.every(el=>el.hidden)){group.hidden=true;group.style.display='none';}
    });
  }catch(e){/* Keep the existing static partner presentation if data cannot be read. */}
}
function init(){
  QX.publicRows('solutions').then(applySolutions).catch(()=>{});
  applyPartners();
  homeBand().catch(()=>{});
  U.onLang(rerender);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
