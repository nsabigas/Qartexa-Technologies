/* ========================================================================
   WEBSITE SEARCH  (search.js)
   The Search button, search panel, catalog and results. The `pages` list near the top controls which pages appear (titles in English and French).
   Loaded at the bottom of every page (see the 7. SCRIPTS banner in each HTML file).
   ======================================================================== */

(function(){
 const pages=[
 ['Home','Accueil','Enterprise technology partner • ICT systems integration','index.html'],
 ['Solutions','Solutions','Technology solutions • Cybersecurity • Cloud • Software','solutions/index.html'],
 ['Digital Infrastructure','Infrastructure numérique','Networking • Data centers • Storage','solutions/digital-infrastructure.html'],
 ['Cybersecurity','Cybersécurité','Security • Identity • Protection','solutions/cybersecurity.html'],
 ['Cloud & Modern Workplace','Cloud et environnement de travail moderne','Cloud • Migration • Microsoft 365','solutions/cloud-modern-workplace.html'],
 ['AI & Digital Transformation','IA et transformation numérique','AI • Analytics • Automation','solutions/ai-digital-transformation.html'],
 ['Banking & Financial Technology','Technologies bancaires et financières','Core banking • Payments • Digital banking','solutions/banking-technology.html'],
 ['Software Engineering','Ingénierie logicielle','ERP • Custom software • Applications','solutions/software-engineering.html'],
 ['IoT & Smart Solutions','IoT et solutions intelligentes','Connected devices • Smart buildings • Agriculture','solutions/iot-smart-solutions.html'],
 ['Physical Security','Sécurité physique','Video • Access control • Biometrics','solutions/physical-security.html'],
 ['Power & Energy','Énergie et alimentation électrique','UPS • Solar • Batteries • Energy','solutions/power-energy.html'],
 ['Managed ICT Services','Services TIC gérés','Monitoring • Maintenance • Support','solutions/managed-ict.html'],
 ['ICT Consultancy & Professional Services','Conseil TIC et services professionnels','Strategy • Architecture • Assessment','solutions/ict-consultancy.html'],
 ['Industries','Secteurs','Industries served • Sectors','industries/index.html'],
 ['Government & Public Sector','Administration et secteur public','Digital government • Public services','industries/government-public.html'],
 ['Banking & Financial Services','Banque et services financiers','Banking • Finance • Security','industries/banking-financial-services.html'],
 ['Healthcare','Santé','Healthcare • Hospitals • Health data','industries/healthcare.html'],
 ['Education','Éducation','Education • Campus • Learning','industries/education.html'],
 ['Hospitality & Tourism','Hôtellerie et tourisme','Hotels • Tourism • Connectivity','industries/hospitality-tourism.html'],
 ['Retail & Commercial','Commerce et distribution','Retail • Payments • Inventory','industries/retail-commercial.html'],
 ['Telecommunications','Télécommunications','Telecom • Connectivity • Networks','industries/telecommunications.html'],
 ['Manufacturing & Agriculture','Industrie et agriculture','Manufacturing • Agriculture • IoT','industries/manufacturing-agriculture.html'],
 ['Energy & Utilities','Énergie et services publics','Power • Utilities • Resilience','industries/energy-utilities.html'],
 ['About Qartexa','À propos de Qartexa','Company • Kigali • Rwanda','about.html'],
 ['How We Deliver','Notre méthode','Delivery • Discovery • Implementation • Support','about.html#how-we-deliver'],
 ['Technology Ecosystem','Écosystème technologique','Technology partners • Ecosystem','ecosystem.html'],
 ['Contact','Contact','Request a consultation • Info@qartexa.com','contact.html'],
 ['Privacy Policy','Politique de confidentialité','Personal data • Your rights • Data protection','privacy.html'],
 ['Terms of Use','Conditions d’utilisation','Website terms • Intellectual property • Liability','terms.html'],
 ['Cookie Preferences','Préférences en matière de cookies','Cookies • Tracking • Your choices','cookies.html']
 ];
 const labels={
  en:{button:'Search this website',title:'Search Qartexa',placeholder:'Search solutions, industries, technologies…',submit:'Search',close:'Close',hint:'Type a keyword to search the whole website, or browse the catalog below.',empty:'Please enter a keyword to search, or browse the catalog below.',none:q=>'No pages found for “'+q+'”. Try another keyword or browse the catalog.',count:(n,q)=>n+(n===1?' page':' pages')+' match “'+q+'”',all:'All pages',cats:{solutions:'Solutions',industries:'Industries',company:'Company'},browse:'Browse the catalog',open:'Open page'},
  fr:{button:'Rechercher sur ce site',title:'Rechercher Qartexa',placeholder:'Rechercher solutions, secteurs, technologies…',submit:'Rechercher',close:'Fermer',hint:'Saisissez un mot-clé pour chercher sur tout le site, ou parcourez le catalogue ci-dessous.',empty:'Veuillez saisir un mot-clé, ou parcourez le catalogue ci-dessous.',none:q=>'Aucune page trouvée pour « '+q+' ». Essayez un autre mot-clé ou parcourez le catalogue.',count:(n,q)=>n+(n===1?' page correspond':' pages correspondent')+' à « '+q+' »',all:'Toutes les pages',cats:{solutions:'Solutions',industries:'Secteurs',company:'Entreprise'},browse:'Parcourir le catalogue',open:'Ouvrir la page'}};
 const svg=d=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+d+'</svg>';
 const ICON={
  'index.html':'<path d="M3 11 12 3l9 8M5 10v10h14V10"/>',
  'solutions/index.html':'<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
  'solutions/digital-infrastructure.html':'<rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5h.01M7 17.5h.01"/>',
  'solutions/cybersecurity.html':'<path d="M12 3 4 6v6c0 4.5 3.3 7.8 8 9 4.7-1.2 8-4.5 8-9V6l-8-3z"/><path d="m9 12 2 2 4-4"/>',
  'solutions/cloud-modern-workplace.html':'<path d="M7 18a4 4 0 0 1-.5-7.97A5.5 5.5 0 0 1 17 8.5a4.5 4.5 0 0 1 .5 9.5H7z"/>',
  'solutions/ai-digital-transformation.html':'<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
  'solutions/banking-technology.html':'<path d="M3 10 12 4l9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/>',
  'solutions/software-engineering.html':'<path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>',
  'solutions/iot-smart-solutions.html':'<path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.5" r="1"/>',
  'solutions/physical-security.html':'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  'solutions/power-energy.html':'<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>',
  'solutions/managed-ict.html':'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>',
  'solutions/ict-consultancy.html':'<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  'industries/index.html':'<path d="M4 21V4h10v17M14 9h6v12M8 8h2M8 12h2M8 16h2"/>',
  'industries/government-public.html':'<path d="M3 21h18M5 21V10M9 21V10M15 21V10M19 21V10M2 10l10-7 10 7"/>',
  'industries/banking-financial-services.html':'<circle cx="9" cy="9" r="6"/><path d="M15 9.5A6 6 0 1 1 9.5 21M9 6.5v5M7.5 8h3"/>',
  'industries/healthcare.html':'<path d="M12 21s-8-4.9-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6.1-8 11-8 11z"/>',
  'industries/education.html':'<path d="m2 9 10-5 10 5-10 5L2 9zM6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5"/>',
  'industries/hospitality-tourism.html':'<path d="M3 19V8M3 15h18v4M21 15v-2.5A3.5 3.5 0 0 0 17.500 9H11v6"/><circle cx="7" cy="12" r="1.5"/>',
  'industries/retail-commercial.html':'<path d="M5 8h14l-1 12H6L5 8zM9 8V6a3 3 0 0 1 6 0v2"/>',
  'industries/telecommunications.html':'<path d="M12 9v12M9 21h6M8.500 6a5 5 0 0 0 0 6M15.500 6a5 5 0 0 1 0 6M5.500 3.500a9 9 0 0 0 0 11M18.500 3.500a9 9 0 0 1 0 11"/>',
  'industries/manufacturing-agriculture.html':'<path d="M3 21V10l6 4v-4l6 4V6h3v15H3z"/>',
  'industries/energy-utilities.html':'<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>',
  'about.html':'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  'about.html#how-we-deliver':'<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h6a3.500 3.500 0 0 0 0-7h-4a3.500 3.500 0 0 1 0-7h6"/>',
  'ecosystem.html':'<circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M12 7v5M12 12l-6 5.500M12 12l6 5.500"/>',
  'privacy.html':'<path d="M12 3 4 6v6c0 4.5 3.3 7.8 8 9 4.7-1.2 8-4.5 8-9V6l-8-3z"/><rect x="9" y="11" width="6" height="5" rx="1"/><path d="M10 11V9.500a2 2 0 0 1 4 0V11"/>',
  'terms.html':'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  'cookies.html':'<path d="M21 12.500A9 9 0 1 1 11.500 3a4 4 0 0 0 5 5 3 3 0 0 0 4.500 4.500z"/><path d="M8.500 10.500h.01M12 15h.01M8 15.500h.01M15.500 14h.01"/>',
  'contact.html':'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'};
 const CATICON={all:'<rect x="4" y="4" width="6.500" height="6.500" rx="1.500"/><rect x="13.500" y="4" width="6.500" height="6.500" rx="1.500"/><rect x="4" y="13.500" width="6.500" height="6.500" rx="1.500"/><rect x="13.500" y="13.500" width="6.500" height="6.500" rx="1.500"/>',solutions:ICON['solutions/digital-infrastructure.html'],industries:ICON['industries/index.html'],company:ICON['about.html']};
 const catOf=u=>u.startsWith('solutions/')?'solutions':u.startsWith('industries/')?'industries':'company';
 const CATS=['solutions','industries','company'];
 function init(){
  const tools=document.querySelector('.nav-tools');if(!tools||document.getElementById('siteSearch'))return;
  const L0=labels[document.documentElement.lang==='fr'?'fr':'en'];
  const button=document.createElement('button');button.className='icon-btn search-trigger';button.id='siteSearch';button.type='button';button.setAttribute('aria-label',L0.button);button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls','siteSearchPanel');
  button.innerHTML='<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"></circle><path d="m16 16 5 5"></path></svg><span class="search-label">'+L0.submit+'</span>';
  tools.insertBefore(button,tools.firstElementChild);
  const overlay=document.createElement('div');overlay.className='search-panel';overlay.id='siteSearchPanel';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','siteSearchTitle');
  overlay.innerHTML='<div class="search-box sx"><div class="sx-head"><h2 id="siteSearchTitle"></h2><div class="search-row" role="search"><span class="sx-field">'+svg('<circle cx="10.800" cy="10.800" r="6.800"/><path d="m16 16 5 5"/>')+'<input id="siteSearchInput" type="search" autocomplete="off" aria-label="Search website"></span><button id="siteSearchSubmit" type="button"></button></div><button class="search-close" type="button" aria-label="Close search"><span class="close-x" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></span></button></div><div class="sx-body"><div class="sx-rail" id="siteSearchRail"></div><div class="sx-main"><p id="siteSearchStatus" class="sx-status" aria-live="polite" aria-atomic="true"></p><div id="siteSearchResults" class="search-results"></div></div></div></div>';
  document.body.appendChild(overlay);
  const input=overlay.querySelector('#siteSearchInput'),results=overlay.querySelector('#siteSearchResults'),status=overlay.querySelector('#siteSearchStatus'),rail=overlay.querySelector('#siteSearchRail'),searchBox=overlay.querySelector('.search-box');
  let restoreFocus=button,cat='all',lastQuery='';
  const isFrench=()=>document.documentElement.lang==='fr';
  const T=()=>labels[isFrench()?'fr':'en'];
  const brandHref=document.querySelector('.brand')?.getAttribute('href');
  const rootUrl=brandHref?new URL(brandHref,location.href):new URL('../',(document.querySelector('script[src*="search.js"]')||{}).src||location.href);
  const norm=s=>(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
  const fullIndex=window.QARTEXA_SEARCH_INDEX||{};
  const countIn=(hay,term)=>{let n=0,i=hay.indexOf(term);while(i!==-1&&n<20){n++;i=hay.indexOf(term,i+term.length);}return n;};
  const prepared=pages.map(row=>{const d=fullIndex[row[3]]||{};return{row,url:row[3],cat:catOf(row[3]),title:norm(row[0]+' '+row[1]),tag:norm(row[2]),desc:norm(d.desc),en:norm(d.en),fr:norm(d.fr),rawEn:d.en||'',rawFr:d.fr||''};});
  function snippet(raw,terms){if(!raw)return'';const low=norm(raw);let at=-1;for(const t of terms){const i=low.indexOf(t);if(i!==-1&&(at===-1||i<at))at=i;}if(at===-1)return'';const start=Math.max(0,at-45),end=Math.min(raw.length,at+110);return(start>0?'… ':'')+raw.slice(start,end).trim()+(end<raw.length?' …':'');}
  function match(q){const french=isFrench(),terms=q.split(/\s+/).filter(Boolean),found=[];
   prepared.forEach(p=>{const all=p.title+' '+p.tag+' '+p.desc+' '+p.en+' '+p.fr;if(!terms.every(w=>all.includes(w)))return;
    let score=0;terms.forEach(w=>{if(p.title.includes(w))score+=100;if(p.tag.includes(w))score+=40;if(p.desc.includes(w))score+=15;score+=Math.min(countIn(french?p.fr:p.en,w),10)*3+Math.min(countIn(french?p.en:p.fr,w),10);});
    found.push({p,score});});
   found.sort((x,y)=>y.score-x.score);return{found,terms};}
  function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
  function link(p,sub,badge){const french=isFrench(),a=el('a','sx-item');a.href=new URL(p.url,rootUrl).href;
   const ic=el('span','sx-ic');ic.innerHTML=svg(ICON[p.url]||CATICON[p.cat]);a.append(ic);
   const tx=el('span','sx-tx');tx.append(el('strong','',p.row[french?1:0]));if(sub)tx.append(el('em','',sub));a.append(tx);
   if(badge)a.append(el('span','sx-badge',T().cats[p.cat]));
   const ar=el('span','sx-go');ar.innerHTML=svg('<path d="m9 6 6 6-6 6"/>');ar.setAttribute('aria-hidden','true');a.append(ar);
   a.addEventListener('click',()=>{overlay.classList.remove('open');button.setAttribute('aria-expanded','false');});return a;}
  function renderRail(counts){const t=T();rail.replaceChildren();
   [['all',t.all]].concat(CATS.map(c=>[c,t.cats[c]])).forEach(([key,label])=>{const b=el('button','sx-cat');b.type='button';b.setAttribute('aria-pressed',String(cat===key));b.dataset.cat=key;
    const ic=el('span','sx-cat-ic');ic.innerHTML=svg(CATICON[key]);b.append(ic,el('span','sx-cat-label',label),el('span','sx-cat-n',String(counts[key])));
    b.addEventListener('click',()=>{cat=key;run(true);});rail.append(b);});}
  function catalog(parent){const french=isFrench();
   CATS.filter(c=>cat==='all'||cat===c).forEach(c=>{const items=prepared.filter(p=>p.cat===c);const sec=el('section','sx-sec');
    const h=el('h3','',T().cats[c]);h.append(el('span','',String(items.length)));sec.append(h);
    const grid=el('div','sx-grid');items.forEach(p=>grid.append(link(p,p.row[2],false)));sec.append(grid);parent.append(sec);});}
  function run(keepStatus){
   const t=T(),raw=input.value.trim(),q=norm(raw);lastQuery=raw;results.replaceChildren();
   const counts={all:0,solutions:0,industries:0,company:0};
   if(!q){prepared.forEach(p=>{counts[p.cat]++;counts.all++;});renderRail(counts);if(!keepStatus||!status.textContent)status.textContent=t.hint;status.classList.remove('warn');results.classList.remove('is-results');catalog(results);return;}
   const {found,terms}=match(q);found.forEach(({p})=>{counts[p.cat]++;counts.all++;});renderRail(counts);
   const shown=found.filter(({p})=>cat==='all'||p.cat===cat);status.classList.remove('warn');
   if(!shown.length){status.textContent=t.none(raw);status.classList.add('warn');results.classList.remove('is-results');const h=el('p','sx-browse',t.browse);results.append(h);catalog(results);return;}
   status.textContent=t.count(shown.length,raw);results.classList.add('is-results');
   const french=isFrench(),list=el('ul','sx-list');
   shown.forEach(({p})=>{const li=document.createElement('li');li.append(link(p,snippet(french?p.rawFr:p.rawEn,terms)||p.row[2],true));list.append(li);});results.append(list);}
  function submit(){if(!input.value.trim()){status.textContent=T().empty;status.classList.add('warn');results.classList.remove('is-results');results.replaceChildren();const c={all:0,solutions:0,industries:0,company:0};prepared.forEach(p=>{c[p.cat]++;c.all++;});renderRail(c);catalog(results);input.focus();return;}run();}
  function translate(){const t=T();button.setAttribute('aria-label',t.button);button.querySelector('.search-label').textContent=t.submit;overlay.querySelector('#siteSearchTitle').textContent=t.title;input.placeholder=t.placeholder;input.setAttribute('aria-label',t.placeholder);overlay.querySelector('#siteSearchSubmit').textContent=t.submit;overlay.querySelector('.search-close').setAttribute('aria-label',t.close);status.textContent='';run();}
  function close(){overlay.classList.remove('open');button.setAttribute('aria-expanded','false');restoreFocus.focus();}
  translate();
  button.addEventListener('click',()=>{restoreFocus=button;overlay.classList.add('open');button.setAttribute('aria-expanded','true');translate();input.focus();});
  overlay.querySelector('#siteSearchSubmit').addEventListener('click',submit);
  input.addEventListener('input',()=>run());
  input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();submit();}else if(event.key==='ArrowDown'){const first=results.querySelector('a');if(first){event.preventDefault();first.focus();}}});
  overlay.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();close();return;}
   if((event.key==='ArrowDown'||event.key==='ArrowUp')&&event.target.closest&&event.target.closest('.sx-item')){const links=[...results.querySelectorAll('a')],i=links.indexOf(event.target.closest('.sx-item'));const n=links[i+(event.key==='ArrowDown'?1:-1)];event.preventDefault();if(n)n.focus();else if(event.key==='ArrowUp')input.focus();}});
  overlay.querySelector('.search-close').addEventListener('click',close);
  overlay.addEventListener('click',event=>{if(event.target===overlay)close();});
  searchBox.addEventListener('keydown',event=>{if(event.key!=='Tab')return;const focusable=[...searchBox.querySelectorAll('input,button,a[href]')].filter(x=>x.offsetParent!==null);if(event.shiftKey&&document.activeElement===focusable[0]){event.preventDefault();focusable[focusable.length-1].focus();}else if(!event.shiftKey&&document.activeElement===focusable[focusable.length-1]){event.preventDefault();focusable[0].focus();}});
  document.addEventListener('keydown',event=>{if((event.key==='/'||(event.key==='k'&&(event.ctrlKey||event.metaKey)))&&!event.altKey&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){event.preventDefault();button.click();}});
  new MutationObserver(()=>{translate();}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 }
 window.QartexaSearch={init};
})();
