/* ========================================================================
   QARTEXA V2: PUBLIC PAGES  (js/qx-pages.js)
   Careers, job + application form, blog, article, tenders, tender detail and
   the page for solutions added in the staff portal.
   Each page is a normal HTML file with <main data-qx="..."> and an empty
   <div id="qx-root">; this script fills it from the database.
   ======================================================================== */
(function(){
'use strict';
const QX=window.QX;if(!QX)return;
const U=QX.util,t=U.t,E=U.esc,B=QX.BASE;
const main=document.querySelector('main[data-qx]');if(!main)return;
const page=main.dataset.qx,root=document.getElementById('qx-root');
const param=n=>new URLSearchParams(location.search).get(n);
const L=()=>U.lang();
const unique=a=>[...new Set(a.filter(Boolean))].sort();
const setTitle=(title,desc)=>{
  document.title=title+' | Qartexa Technologies';
  const h=document.getElementById('qx-title');if(h)h.textContent=title;
  const c=document.getElementById('qx-crumb');if(c)c.textContent=title;
  if(desc){const m=document.querySelector('meta[name="description"]');if(m)m.setAttribute('content',desc.slice(0,200));}
};
const notAvail=()=>{root.innerHTML='<div class="qx-empty">'+E(t('notAvail'))+' <a href="'+B+'index.html">'+E(t('back'))+'</a></div>';};
const badge=s=>'<span class="qx-badge '+E(s)+'">'+E(U.label('status',s))+'</span>';
const when=d=>{
  const row=(d&&typeof d==='object')?d:null,n=U.daysLeft(d);if(n===null)return '';
  const e=row?U.endOf(row):null;
  const dateTxt=row?U.fmtDate(row.closing_at||row.closing_date):U.fmtDate(d);
  const timeTxt=(row&&row.closing_at)?', '+new Date(row.closing_at).toLocaleTimeString(L()==='fr'?'fr-FR':'en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Africa/Kigali'})+' (CAT)':'';
  return (e&&e.getTime()<Date.now())?dateTxt+timeTxt:dateTxt+timeTxt+' • '+t('daysLeft')(n);
};
/* effective status: a row still marked "open" after its deadline is CLOSED, whatever the table says */
const eff=r=>(r.status==='open'&&!U.isLive(r))?'closed':r.status;
const closedNotice=(kind,title)=>{
  const fr=L()==='fr';
  const msg=kind==='job'?(fr?'Ce poste est clôturé et n’accepte plus de candidatures.':'This vacancy is now closed and no longer accepts applications.')
                        :(fr?'Cet appel d’offres est clôturé et n’accepte plus de soumissions.':'This tender is now closed and no longer accepts submissions.');
  const back=kind==='job'?[B+'careers.html',fr?'Voir les postes ouverts':'See open positions']:[B+'tenders.html',fr?'Voir les appels d’offres ouverts':'See open tenders'];
  const t0=document.getElementById('qx-title');if(t0&&title)t0.textContent=title;
  root.innerHTML='<div class="qx-empty" role="status"><strong style="display:block;font-size:20px;color:var(--navy);margin-bottom:8px">'+E(title||'')+'</strong>'+E(msg)+'<br><br><a class="qx-btn" href="'+back[0]+'">'+E(back[1])+' →</a>'+(kind==='job'?' <a class="qx-btn ghost" href="'+B+'job.html?s=general">'+E(fr?'Candidature spontanée':'Send a general application')+'</a>':'')+'</div>';
};
function mount(render){render();U.onLang(render);}

/* ------------------------------------------------------------ CAREERS */
async function careers(){
  root.innerHTML='<div class="qx-loading">'+E(t('loading'))+'</div>';
  let jobs=[];try{jobs=await QX.publicRows('jobs');}catch(e){}
  const f={q:'',dept:'',loc:'',type:''};
  function draw(){
    const vis=jobs.filter(j=>(!f.dept||j.department===f.dept)&&(!f.loc||j.location===f.loc)&&(!f.type||j.employment_type===f.type)&&(!f.q||[U.pick(j,'title'),U.pick(j,'summary'),j.department,j.location].join(' ').toLowerCase().indexOf(f.q.toLowerCase())>-1));
    const opt=(v,all)=>'<option value="">'+E(all)+'</option>'+unique(v).map(x=>'<option'+(x===f[all._k]?' selected':'')+' value="'+E(x)+'">'+E(x)+'</option>').join('');
    const sel=(k,vals,all,fmt)=>'<select data-k="'+k+'" aria-label="'+E(all)+'"><option value="">'+E(all)+'</option>'+unique(vals).map(x=>'<option value="'+E(x)+'"'+(f[k]===x?' selected':'')+'>'+E(fmt?fmt(x):x)+'</option>').join('')+'</select>';
    const tb=jobs.length?'<div class="qx-toolbar"><input type="search" data-k="q" value="'+E(f.q)+'" placeholder="'+E(t('search')+'…')+'" aria-label="'+E(t('search'))+'">'+sel('dept',jobs.map(j=>j.department),t('department'))+sel('loc',jobs.map(j=>j.location),t('location'))+sel('type',jobs.map(j=>j.employment_type),t('type'),x=>U.label('employment_type',x))+'<span class="qx-count" aria-live="polite">'+E(t('jobsFound')(vis.length))+'</span></div>':'';
    const rows=vis.map(j=>'<a class="qx-row" href="'+B+'job.html?s='+encodeURIComponent(j.slug)+'"><div><h3>'+E(U.pick(j,'title'))+'</h3><div class="qx-meta">'+[j.department,j.location,U.label('employment_type',j.employment_type),U.label('experience_level',j.experience_level)].filter(Boolean).map(x=>'<span>'+E(x)+'</span>').join('')+'</div>'+(U.pick(j,'summary')?'<p>'+E(U.pick(j,'summary'))+'</p>':'')+'</div><div class="qx-side">'+(j.closing_date?'<span>'+E(t('closes')+' '+U.fmtDate(j.closing_date))+'</span>':'')+'<span class="qx-go">'+E(t('apply'))+' →</span></div></a>').join('');
    const empty='<div class="qx-empty">'+E(t('noJobs'))+'<br><br><a class="qx-btn" href="'+B+'job.html?s=general">'+E(L()==='fr'?'Candidature spontanée':'Send a general application')+'</a></div>';
    const keep=document.activeElement&&document.activeElement.dataset&&document.activeElement.dataset.k;
    root.innerHTML=tb+(vis.length?'<div class="qx-list">'+rows+'</div><p style="margin-top:26px;color:var(--muted)">'+(L()==='fr'?'Votre profil ne correspond à aucun poste ? ':'Don’t see the right role? ')+'<a style="color:var(--red);font-weight:700" href="'+B+'job.html?s=general">'+E(L()==='fr'?'Envoyez une candidature spontanée':'Send a general application')+'</a></p>':(jobs.length?'<div class="qx-empty">'+E(t('empty'))+'</div>':empty));
    root.querySelectorAll('[data-k]').forEach(el=>{el.addEventListener(el.tagName==='INPUT'?'input':'change',()=>{f[el.dataset.k]=el.value;draw();});});
    if(keep){const el=root.querySelector('[data-k="'+keep+'"]');if(el){el.focus();if(el.setSelectionRange&&el.type==='search'){const n=el.value.length;el.setSelectionRange(n,n);}}}
  }
  mount(draw);
}

/* ------------------------------------------------------------ JOB + APPLY */
async function job(){
  const slug=param('s');
  let j=null;
  if(slug==='general')j={id:null,slug:'general',title_en:'General application',title_fr:'Candidature spontanée',summary_en:'Tell us about yourself. We keep strong profiles on file for future openings.',summary_fr:'Parlez-nous de vous. Nous conservons les profils solides pour de futurs postes.',description_en:'We are always interested in talented engineers, analysts, project managers and technical specialists. Send your details and CV, and tell us which area you would like to work in.',description_fr:'Nous sommes toujours intéressés par des ingénieurs, analystes, chefs de projet et spécialistes techniques de talent. Envoyez vos informations et votre CV, en précisant le domaine souhaité.',location:'Kigali, Rwanda'};
  else if(slug){
    let row=null;try{row=await QX.store.bySlug('jobs',slug);}catch(e){}
    if(row&&row.status==='open'&&U.isLive(row))j=row;
    else{ /* expired, closed, or hidden by the database: ask for the minimal public state */
      if(row&&row.status!=='draft')return closedNotice('job',U.pick(row,'title'));
      const st=await QX.itemState('job',slug);
      if(st&&st.state==='closed')return closedNotice('job',(L()==='fr'&&st.title_fr)||st.title_en);
    }
  }
  if(!j){notAvail();return;}
  function draw(){
    setTitle(U.pick(j,'title'),U.pick(j,'summary'));
    const facts=[[t('department'),j.department],[t('location'),j.location],[t('type'),U.label('employment_type',j.employment_type)],[t('level'),U.label('experience_level',j.experience_level)],[t('closes'),(j.closing_at||j.closing_date)?when(j):'']].filter(x=>x[1]);
    root.innerHTML='<div class="qx-detail"><div><div class="qx-prose">'+(U.pick(j,'summary')?'<p><strong>'+E(U.pick(j,'summary'))+'</strong></p>':'')+U.md(U.pick(j,'description'))+(U.pick(j,'requirements')?'<h3>'+E(t('requirements'))+'</h3>'+U.md(U.pick(j,'requirements')):'')+'</div>'+form(j)+'</div><aside class="qx-aside"><div class="qx-panel"><h3>'+E(U.pick(j,'title'))+'</h3>'+(facts.length?'<ul class="qx-facts">'+facts.map(f=>'<li><span>'+E(f[0])+'</span><span>'+E(f[1])+'</span></li>').join('')+'</ul>':'')+'<div class="qx-actions"><a class="qx-btn" href="#apply">'+E(t('apply'))+'</a></div></div><a class="qx-btn ghost" href="'+B+'careers.html">← '+E(L()==='fr'?'Tous les postes':'All positions')+'</a></aside></div>';
    wire(j);
  }
  mount(draw);
}
function form(j){
  const fr=L()==='fr';
  const f=(id,label,type,req,extra)=>'<div class="qx-field"><label for="'+id+'">'+E(label)+(req?' <i>*</i>':'')+'</label><input id="'+id+'" name="'+id+'" type="'+type+'"'+(req?' required':'')+(extra||'')+'></div>';
  return '<form class="qx-form" id="apply" novalidate style="margin-top:44px"><h2>'+E(fr?'Postuler à ce poste':'Apply for this role')+'</h2>'+
   '<div class="grid2">'+f('a_name',fr?'Nom complet':'Full name','text',1,' maxlength="160" autocomplete="name"')+f('a_email',fr?'Adresse e-mail':'Email address','email',1,' maxlength="254" autocomplete="email"')+'</div>'+
   '<div class="grid2">'+f('a_phone',fr?'Téléphone':'Phone','tel',0,' maxlength="40" autocomplete="tel"')+f('a_link','LinkedIn / '+(fr?'portfolio':'portfolio'),'url',0,' maxlength="300" placeholder="https://"')+'</div>'+
   '<div class="qx-field"><label for="a_cv">'+E(fr?'CV (PDF ou Word, 5 Mo max)':'CV (PDF or Word, max 5 MB)')+'</label><input id="a_cv" name="cv" type="file" accept=".pdf,.doc,.docx,application/pdf"></div>'+
   '<div class="qx-field"><label for="a_msg">'+E(fr?'Lettre de motivation / message':'Cover letter / message')+'</label><textarea id="a_msg" name="msg" maxlength="5000"></textarea><small>'+E(fr?'N’incluez pas de mots de passe ni de documents d’identité.':'Please do not include passwords or ID documents.')+'</small></div>'+
   '<div class="qx-hp" aria-hidden="true"><label>Website <input tabindex="-1" autocomplete="off" id="a_hp" name="website"></label></div>'+
   '<label class="qx-check"><input type="checkbox" id="a_consent" required><span>'+(fr?'J’accepte que Qartexa Technologies utilise ces informations pour traiter ma candidature, conformément à la <a href="'+B+'privacy.html">politique de confidentialité</a>.':'I agree that Qartexa Technologies may use these details to process my application, as described in the <a href="'+B+'privacy.html">Privacy Policy</a>.')+' <i style="color:var(--red);font-style:normal">*</i></span></label>'+
   '<div><button class="qx-btn" type="submit">'+E(t('submit'))+' →</button></div><div id="a_status" class="qx-status" role="status" aria-live="polite" hidden></div></form>';
}
function wire(j){
  const fm=document.getElementById('apply');if(!fm)return;
  const st=document.getElementById('a_status');
  const say=(m,ok)=>{st.hidden=false;st.className='qx-status '+(ok?'ok':'err');st.textContent=m;};
  fm.addEventListener('submit',async ev=>{
    ev.preventDefault();
    if(j.id&&!U.isLive(j)){say(L()==='fr'?'Ce poste vient d’être clôturé.':'This vacancy has just closed.',false);return;}
    const name=fm.a_name.value.trim(),email=fm.a_email.value.trim(),file=fm.a_cv.files[0];
    if(fm.a_hp.value){say(t('thanks'),true);return;}
    if(name.length<2||!/^\S+@\S+\.\S+$/.test(email)||!fm.a_consent.checked){say(t('reqd'),false);return;}
    if(file&&(file.size>5*1024*1024||!/\.(pdf|docx?)$/i.test(file.name))){say(t('fileBig'),false);return;}
    const btn=fm.querySelector('button[type=submit]');btn.disabled=true;btn.textContent=t('sending');
    try{
      let cv=null;if(file)cv=await QX.store.upload('cvs',file,'applications');
      await QX.store.insertPublic('applications',{job_id:j.id||null,job_title:U.pick(j,'title')||j.title_en,full_name:name,email:email,phone:fm.a_phone.value.trim()||null,linkedin_url:fm.a_link.value.trim()||null,cover_letter:fm.a_msg.value.trim()||null,cv_path:cv?cv.path:null,cv_name:cv?cv.name:null,status:'new'});
      fm.reset();say(t('thanks'),true);
    }catch(e){say(t('failed'),false);}
    btn.disabled=false;btn.textContent=t('submit')+' →';
  });
}

/* ------------------------------------------------------------ BLOG */
async function blog(){
  root.innerHTML='<div class="qx-loading">'+E(t('loading'))+'</div>';
  let posts=[];try{posts=await QX.publicRows('posts');}catch(e){}
  const f={q:'',cat:''};let shown=9;
  const card=(p,feature)=>'<a class="qx-card'+(feature?' feature':'')+'" href="'+B+'post.html?s='+encodeURIComponent(p.slug)+'">'+(p.cover_url?'<img class="qx-cover" loading="lazy" decoding="async" alt="" src="'+E(p.cover_url)+'">':'<div class="qx-cover" aria-hidden="true"></div>')+'<div class="qx-body"><div class="qx-meta">'+[p.category,U.fmtDate(p.published_at)].filter(Boolean).map(x=>'<span>'+E(x)+'</span>').join('')+'</div><h3>'+E(U.pick(p,'title'))+'</h3><p>'+E(U.pick(p,'excerpt'))+'</p><span class="qx-more">'+E(t('readMore'))+' →</span></div></a>';
  function draw(){
    const vis=posts.filter(p=>(!f.cat||p.category===f.cat)&&(!f.q||[U.pick(p,'title'),U.pick(p,'excerpt'),p.category].join(' ').toLowerCase().indexOf(f.q.toLowerCase())>-1));
    const tb=posts.length?'<div class="qx-toolbar"><input type="search" data-k="q" value="'+E(f.q)+'" placeholder="'+E(t('search')+'…')+'" aria-label="'+E(t('search'))+'"><select data-k="cat" aria-label="'+E(t('category'))+'"><option value="">'+E(t('category')+': '+t('all'))+'</option>'+unique(posts.map(p=>p.category)).map(c=>'<option value="'+E(c)+'"'+(f.cat===c?' selected':'')+'>'+E(c)+'</option>').join('')+'</select></div>':'';
    const keep=document.activeElement&&document.activeElement.dataset&&document.activeElement.dataset.k;
    root.innerHTML=tb+(posts.length?(vis.length?'<div class="qx-cards">'+vis.slice(0,shown).map((p,i)=>card(p,i===0&&!f.q&&!f.cat&&shown>=1&&vis.length>2)).join('')+'</div>'+(vis.length>shown?'<div class="qx-more-wrap"><button class="qx-btn ghost" id="qx-more" type="button">'+E(L()==='fr'?'Voir plus d’articles':'Load more articles')+'</button></div>':''):'<div class="qx-empty">'+E(t('empty'))+'</div>'):'<div class="qx-empty">'+E(t('noPosts'))+'</div>');
    root.querySelectorAll('[data-k]').forEach(el=>el.addEventListener(el.tagName==='INPUT'?'input':'change',()=>{f[el.dataset.k]=el.value;shown=9;draw();}));
    const m=document.getElementById('qx-more');if(m)m.addEventListener('click',()=>{shown+=9;draw();});
    if(keep){const el=root.querySelector('[data-k="'+keep+'"]');if(el){el.focus();if(el.type==='search'){const n=el.value.length;el.setSelectionRange(n,n);}}}
  }
  mount(draw);
}
async function post(){
  const slug=param('s');let p=null;
  if(slug){try{p=await QX.store.bySlug('posts',slug);if(p&&!(['published','scheduled'].indexOf(p.status)>-1&&(!p.published_at||new Date(p.published_at).getTime()<=Date.now())))p=null;}catch(e){}}
  if(!p){notAvail();return;}
  let others=[];try{others=(await QX.publicRows('posts')).filter(x=>x.slug!==p.slug).slice(0,3);}catch(e){}
  function draw(){
    setTitle(U.pick(p,'title'),U.pick(p,'excerpt'));
    const k=document.getElementById('qx-kicker');if(k)k.textContent=p.category||'Blog';
    const meta=document.getElementById('qx-meta');if(meta)meta.textContent=[U.fmtDate(p.published_at),p.author?t('by')+' '+p.author:''].filter(Boolean).join(' • ');
    root.innerHTML='<article class="qx-prose" style="margin:0 auto">'+(p.cover_url?'<img class="qx-cover-lg" alt="" src="'+E(p.cover_url)+'">':'')+U.md(U.pick(p,'body'))+'<div class="qx-actions"><button class="qx-btn ghost" type="button" id="qx-copy">'+E(t('share'))+'</button><a class="qx-btn ghost" href="'+B+'blog.html">← '+E(L()==='fr'?'Tous les articles':'All articles')+'</a></div></article>'+
      (others.length?'<h2 style="margin:64px 0 22px;color:var(--navy)">'+E(t('related'))+'</h2><div class="qx-cards">'+others.map(o=>'<a class="qx-card" href="'+B+'post.html?s='+encodeURIComponent(o.slug)+'">'+(o.cover_url?'<img class="qx-cover" loading="lazy" alt="" src="'+E(o.cover_url)+'">':'<div class="qx-cover" aria-hidden="true"></div>')+'<div class="qx-body"><div class="qx-meta"><span>'+E(o.category||'')+'</span></div><h3>'+E(U.pick(o,'title'))+'</h3><span class="qx-more">'+E(t('readMore'))+' →</span></div></a>').join('')+'</div>':'');
    const c=document.getElementById('qx-copy');if(c)c.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);c.textContent=t('copied');setTimeout(()=>c.textContent=t('share'),1800);}catch(e){}});
  }
  mount(draw);
}

/* ------------------------------------------------------------ TENDERS */
async function tenders(){
  root.innerHTML='<div class="qx-loading">'+E(t('loading'))+'</div>';
  let rows=[];try{rows=await QX.publicRows('tenders');}catch(e){}
  rows.sort((a,b)=>{const ao=eff(a)==='open'?0:1,bo=eff(b)==='open'?0:1;if(ao!==bo)return ao-bo;return ao===0?String(a.closing_date).localeCompare(String(b.closing_date)):String(b.closing_date).localeCompare(String(a.closing_date));});
  const f={q:'',status:'',cat:''};
  function draw(){
    const vis=rows.filter(r=>(!f.status||eff(r)===f.status)&&(!f.cat||r.category===f.cat)&&(!f.q||[U.pick(r,'title'),r.reference,r.category].join(' ').toLowerCase().indexOf(f.q.toLowerCase())>-1));
    const tb=rows.length?'<div class="qx-toolbar"><input type="search" data-k="q" value="'+E(f.q)+'" placeholder="'+E(t('search')+'…')+'" aria-label="'+E(t('search'))+'"><select data-k="status" aria-label="Status"><option value="">'+E('Status: '+t('all'))+'</option>'+['open','closed','awarded'].map(s=>'<option value="'+s+'"'+(f.status===s?' selected':'')+'>'+E(U.label('status',s))+'</option>').join('')+'</select><select data-k="cat" aria-label="'+E(t('category'))+'"><option value="">'+E(t('category')+': '+t('all'))+'</option>'+unique(rows.map(r=>r.category)).map(c=>'<option value="'+E(c)+'"'+(f.cat===c?' selected':'')+'>'+E(c)+'</option>').join('')+'</select><span class="qx-count" aria-live="polite">'+vis.length+'</span></div>':'';
    const keep=document.activeElement&&document.activeElement.dataset&&document.activeElement.dataset.k;
    const row=r=>'<a class="qx-row" href="'+B+'tender.html?s='+encodeURIComponent(r.slug)+'"><div><div class="qx-meta" style="margin-bottom:6px">'+[r.reference,r.category].filter(Boolean).map(x=>'<span>'+E(x)+'</span>').join('')+'</div><h3>'+E(U.pick(r,'title'))+'</h3><div class="qx-meta"><span>'+E(t('issued')+': '+U.fmtDate(r.issued_date))+'</span><span>'+E(t('deadline')+': '+when(r))+'</span></div></div><div class="qx-side">'+badge(eff(r))+'<span class="qx-go">'+E(L()==='fr'?'Voir les détails':'View details')+' →</span></div></a>';
    const openR=vis.filter(r=>eff(r)==='open'),pastR=vis.filter(r=>eff(r)!=='open');
    const sec=(title,list,id)=>list.length?'<h2 id="'+id+'" style="font-size:24px;letter-spacing:-.5px;margin:34px 0 14px;color:var(--navy)">'+E(title)+'</h2><div class="qx-list">'+list.map(row).join('')+'</div>':'';
    const noOpen=!openR.length&&!f.status&&!f.q&&!f.cat;
    root.innerHTML=tb+(rows.length?(vis.length||noOpen?(sec(L()==='fr'?'Appels d’offres ouverts':'Open tenders',openR,'open-tenders')+(noOpen?'<div class="qx-empty" style="margin-top:20px">'+E(t('noTenders'))+'</div>':'')+sec(L()==='fr'?'Appels d’offres passés':'Past tenders',pastR,'past-tenders')):'<div class="qx-empty">'+E(t('empty'))+'</div>'):'<div class="qx-empty">'+E(t('noTenders'))+'</div>');
    root.querySelectorAll('[data-k]').forEach(el=>el.addEventListener(el.tagName==='INPUT'?'input':'change',()=>{f[el.dataset.k]=el.value;draw();}));
    if(keep){const el=root.querySelector('[data-k="'+keep+'"]');if(el){el.focus();if(el.type==='search'){const n=el.value.length;el.setSelectionRange(n,n);}}}
  }
  mount(draw);
}
async function tender(){
  const slug=param('s');let r=null;
  if(slug){try{r=await QX.store.bySlug('tenders',slug);if(r&&(r.status==='draft'||r.archived))r=null;}catch(e){}}
  if(!r&&slug){const st=await QX.itemState('tender',slug);if(st&&st.state==='closed')return closedNotice('tender',(L()==='fr'&&st.title_fr)||st.title_en);}
  if(!r){notAvail();return;}
  function draw(){
    setTitle(U.pick(r,'title'),U.pick(r,'description'));
    const k=document.getElementById('qx-kicker');if(k)k.textContent=(L()==='fr'?'Appel d’offres':'Tender')+(r.reference?' • '+r.reference:'');
    const facts=[[t('reference'),r.reference],[t('category'),r.category],[t('issued'),U.fmtDate(r.issued_date)],[t('deadline'),when(r)]].filter(x=>x[1]);
    const subj=encodeURIComponent((r.reference?r.reference+' – ':'')+r.title_en);
    root.innerHTML='<div class="qx-detail"><div class="qx-prose">'+U.md(U.pick(r,'description'))+'</div><aside class="qx-aside"><div class="qx-panel"><h3>'+badge(eff(r))+'</h3><ul class="qx-facts">'+facts.map(x=>'<li><span>'+E(x[0])+'</span><span>'+E(x[1])+'</span></li>').join('')+'</ul><div class="qx-actions">'+(r.document_url?'<a class="qx-btn" target="_blank" rel="noopener noreferrer" href="'+E(r.document_url)+'">'+E(t('document'))+'</a>':'')+(r.contact_email&&eff(r)==='open'?'<a class="qx-btn ghost" href="mailto:'+E(r.contact_email)+'?subject='+subj+'">'+E(t('contact'))+'</a>':'')+'</div></div><a class="qx-btn ghost" href="'+B+'tenders.html">← '+E(L()==='fr'?'Tous les appels d’offres':'All tenders')+'</a></aside></div>';
  }
  mount(draw);
}

/* ------------------------------------------------------------ SOLUTION (added in the portal) */
async function solution(){
  const slug=param('s');let s=null,all=[];
  try{all=await QX.publicRows('solutions');}catch(e){}
  if(slug)s=all.find(x=>x.slug===slug)||null;
  if(!s){notAvail();return;}
  if(s.is_core){location.replace(B+'solutions/'+s.slug+'.html');return;}
  const rel=all.filter(x=>x.slug!==s.slug).slice(0,3);
  function draw(){
    setTitle(U.pick(s,'title'),U.pick(s,'summary'));
    const tg=document.getElementById('qx-kicker');if(tg)tg.textContent=U.pick(s,'tagline')||(L()==='fr'?'Solution':'Solution');
    const lead=document.getElementById('qx-lead');if(lead)lead.textContent=U.pick(s,'summary');
    const caps=U.lines(U.pick(s,'capabilities'));
    root.innerHTML='<div class="qx-detail"><div>'+(s.image_url?'<img class="qx-cover-lg" alt="'+E(U.pick(s,'title'))+'" src="'+E(/^(https?:|data:)/.test(s.image_url)?s.image_url:B+s.image_url)+'">':'')+'<div class="qx-prose">'+U.md(U.pick(s,'body'))+'</div>'+(caps.length?'<h2 style="margin:36px 0 16px;color:var(--navy)">'+E(t('capabilities'))+'</h2><ul class="qx-caps">'+caps.map(c=>'<li>'+E(c)+'</li>').join('')+'</ul>':'')+'</div><aside class="qx-aside"><div class="qx-panel"><h3>'+E(L()==='fr'?'Discutons de votre projet':'Discuss your requirements')+'</h3><p style="margin:0 0 16px;color:#3b5570;line-height:1.6">'+E(L()==='fr'?'Notre équipe vous répondra rapidement.':'Our team will respond promptly.')+'</p><a class="qx-btn" href="'+B+'contact.html">'+E(L()==='fr'?'Contacter Qartexa':'Contact Qartexa')+' →</a></div>'+(rel.length?'<div class="qx-panel"><h3>'+E(L()==='fr'?'Autres solutions':'Other solutions')+'</h3><ul class="qx-facts">'+rel.map(x=>'<li><a style="color:var(--navy);font-weight:700;text-decoration:none" href="'+(x.is_core?B+'solutions/'+x.slug+'.html':B+'solution.html?s='+encodeURIComponent(x.slug))+'">'+E(U.pick(x,'title'))+' →</a></li>').join('')+'</ul></div>':'')+'</aside></div>';
  }
  mount(draw);
}

({careers:careers,job:job,blog:blog,post:post,tenders:tenders,tender:tender,solution:solution}[page]||function(){})();
})();
