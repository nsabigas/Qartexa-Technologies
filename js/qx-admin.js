/* ========================================================================
   QARTEXA V2: STAFF DASHBOARD  (js/qx-admin.js)
   Manage solutions, jobs, applications, blog posts and tenders.
   Only signed-in people listed in the database "admins" table get here.
   Everything saved here appears on the public website.
   ======================================================================== */
(function(){
'use strict';
const QX=window.QX,U=QX.util,E=U.esc,S=QX.store;
const $=(s,r)=>(r||document).querySelector(s);
const main=$('#qa-main'),modal=$('#qa-modal'),toastEl=$('#qa-toast');
const GROUPS=[['infrastructure','Infrastructure & cloud'],['security','Security & continuity'],['applications','Applications & intelligence'],['advisory','Advisory & delivery']];

/* ---------- what each content type looks like ---------- */
const SCH={
 solutions:{label:'Solutions',one:'solution',order:['sort_order','asc'],cols:[['title_en','Title'],['card_group','Group',r=>(GROUPS.find(g=>g[0]===r.card_group)||[0,''])[1]],['sort_order','Order']],status:[['published','Published'],['draft','Hidden']],
  fields:[{k:'title',bi:1,t:'text',req:1,label:'Title'},{k:'tagline',bi:1,t:'text',label:'Short tagline',help:'Shown in the menu, for example: Cloud • Hybrid • Migration'},{k:'summary',bi:1,t:'area',label:'Summary',help:'One or two sentences, shown on cards.'},{k:'body',bi:1,t:'md',label:'Full description',help:'Shown on the solution page.'},{k:'capabilities',bi:1,t:'area',label:'Capabilities (one per line)'},
   {k:'menu_group',t:'select',label:'Menu and footer column',opts:[['technology','Technology solutions'],['connected','Connected & operational systems']]},{k:'card_group',t:'select',label:'Overview group',opts:GROUPS},{k:'image_url',t:'image',label:'Image',help:'JPG, PNG or WebP, up to 5 MB.'},{k:'sort_order',t:'number',label:'Display order',help:'Smaller numbers appear first.'},{k:'status',t:'status',label:'Visibility'},{k:'slug',t:'slug',label:'Page name (web address)'}]},
 jobs:{label:'Jobs',one:'job',order:['created_at','desc'],cols:[['title_en','Title'],['department','Department'],['location','Location'],['closing_date','Closes']],status:[['open','Open'],['draft','Draft'],['closed','Closed']],
  fields:[{k:'title',bi:1,t:'text',req:1,label:'Job title'},{k:'department',t:'text',label:'Department'},{k:'location',t:'text',label:'Location'},{k:'employment_type',t:'select',label:'Type',opts:[['full-time','Full-time'],['part-time','Part-time'],['contract','Contract'],['internship','Internship']]},{k:'experience_level',t:'select',label:'Level',opts:[['entry','Entry level'],['mid','Mid level'],['senior','Senior'],['lead','Lead / Manager']]},{k:'summary',bi:1,t:'area',label:'Short summary'},{k:'description',bi:1,t:'md',label:'Job description'},{k:'requirements',bi:1,t:'md',label:'Requirements'},{k:'responsibilities',bi:1,t:'md',label:'Responsibilities'},{k:'instructions',bi:1,t:'md',label:'How to apply'},{k:'application_email',t:'text',label:'Application email (optional)'},{k:'featured',t:'bool',label:'Featured job',help:'Featured jobs can be highlighted on the careers page.'},{k:'closing_at',t:'datetime',label:'Closing date and time (Kigali time)',help:'The job is hidden and applications stop at exactly this moment. To extend or reopen a closed job, set a new future time and save.'},{k:'status',t:'status',label:'Status'},{k:'slug',t:'slug',label:'Page name (web address)'}]},
 posts:{label:'Blog',one:'article',order:['published_at','desc'],cols:[['title_en','Title'],['category','Category'],['published_at','Date']],status:[['published','Published'],['scheduled','Scheduled'],['draft','Draft'],['archived','Archived']],
  fields:[{k:'title',bi:1,t:'text',req:1,label:'Title'},{k:'excerpt',bi:1,t:'area',label:'Short excerpt'},{k:'body',bi:1,t:'md',label:'Article'},{k:'category',t:'text',label:'Category'},{k:'author',t:'text',label:'Author'},{k:'cover_url',t:'image',label:'Cover image'},{k:'published_at',t:'datetime',label:'Publish date and time',help:'A future date keeps it hidden until that day.'},{k:'status',t:'status',label:'Status'},{k:'slug',t:'slug',label:'Page name (web address)'}]},
 tenders:{label:'Tenders',one:'tender',order:['created_at','desc'],cols:[['reference','Reference'],['title_en','Title'],['closing_date','Closes']],status:[['open','Open'],['closed','Closed'],['awarded','Awarded'],['draft','Draft']],
  fields:[{k:'reference',t:'text',req:1,label:'Reference number'},{k:'title',bi:1,t:'text',req:1,label:'Title'},{k:'description',bi:1,t:'md',label:'Description'},{k:'category',t:'text',label:'Category'},{k:'issued_date',t:'date',label:'Issued date'},{k:'issuer',t:'text',label:'Issuing organisation'},{k:'eligibility',bi:1,t:'md',label:'Eligibility requirements'},{k:'instructions',bi:1,t:'md',label:'Submission instructions'},{k:'closing_at',t:'datetime',label:'Closing date and time (Kigali time)',help:'The tender moves to Past/Closed at exactly this moment. To extend or reopen it, set a new future time and save.'},{k:'document_url',t:'file',label:'Tender document (PDF)',help:'PDF up to 5 MB.'},{k:'show_in_history',t:'bool',label:'Show in “Past tenders” after it closes',help:'Off = the notice disappears from the public site when it closes (it stays here).'},{k:'archived',t:'bool',label:'Archived (hidden everywhere on the public site)'},{k:'contact_email',t:'text',label:'Contact email for questions'},{k:'status',t:'status',label:'Status'},{k:'slug',t:'slug',label:'Page name (web address)'}]}
};
SCH.partners={label:'Partners',one:'partner',order:['sort_order','asc'],cols:[['name','Name'],['website','Website'],['sort_order','Order']],status:[['published','Visible'],['draft','Hidden']],
  fields:[{k:'name',t:'text',req:1,label:'Partner name'},{k:'logo_url',t:'image',req:1,label:'Logo',help:'PNG or WebP with a transparent or white background, about 400 px wide.'},{k:'website',t:'text',label:'Website (optional, https://…)'},{k:'sort_order',t:'number',label:'Display order',help:'Smaller numbers appear first.'},{k:'status',t:'status',label:'Visibility'},{k:'slug',t:'slug',label:'Short name (web address)'}]};
const APP_STATUS=[['new','New'],['reviewing','Reviewing'],['shortlisted','Shortlisted'],['rejected','Rejected'],['hired','Hired']];

/* ---------- small UI helpers ---------- */
function toast(m,bad){toastEl.textContent=m;toastEl.className='qa-toast show'+(bad?' bad':'');clearTimeout(toast._t);toast._t=setTimeout(()=>toastEl.className='qa-toast',4200);}
const fmt=d=>d?new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'';
const badge=(v,list)=>{const l=(list||[]).find(x=>x[0]===v);return '<span class="qx-badge '+E(v)+'">'+E(l?l[1]:v)+'</span>';};
const field=(label,inner,help,req)=>'<div class="qx-field"><label>'+E(label)+(req?' <i>*</i>':'')+'</label>'+inner+(help?'<small>'+E(help)+'</small>':'')+'</div>';
function openModal(html,wide){modal.innerHTML='<div class="qa-dialog'+(wide?' wide':'')+'" role="dialog" aria-modal="true">'+html+'</div>';modal.hidden=false;document.body.classList.add('qa-lock');const f=modal.querySelector('input,textarea,select,button');if(f)f.focus();}
function closeModal(){modal.hidden=true;modal.innerHTML='';document.body.classList.remove('qa-lock');}
modal.addEventListener('click',e=>{if(e.target===modal)closeModal();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)closeModal();});

/* ---------- navigation ---------- */
const NAV_GROUPS=[
 {title:'',links:[['overview','Overview']]},
 {title:'Content',links:[['solutions','Solutions'],['posts','Blog']],more:'More content',extra:[['jobs','Jobs'],['applications','Applications'],['tenders','Tenders']]},
 {title:'Website',links:[['pages','Edit pages'],['appearance','Appearance']],more:'More website settings',extra:[['heroes','Page heroes'],['media','Media library'],['siteimages','Site images'],['branding','Logo & header'],['contact','Contact details'],['social','Social media'],['partners','Partners'],['edits','All edits']]},
 {title:'Forms',links:[['submissions','Form submissions']],more:'Form management',extra:[['forms','Form builder']]},
 {title:'Administration',links:[['staff','Staff & roles']],more:'System',extra:[['activity','Activity log']]},
 {title:'My account',links:[['account','Account']]}
];
const NAV=NAV_GROUPS.flatMap(g=>g.links.concat(g.extra||[]));
/* which role may see which section (the database enforces the same rules; this only hides what you cannot use) */
const AREA={solutions:'content',posts:'content',pages:'content',branding:'content',contact:'content',partners:'content',edits:'content',jobs:'hr',applications:'hr',tenders:'tenders',media:'content',heroes:'content',siteimages:'content',appearance:'appearance',social:'appearance',forms:'forms',submissions:'submissions',staff:'staff',activity:'audit'};
let ROLE=null;
const allowed=n=>n==='--'||!AREA[n]||QX.auth.can(ROLE,AREA[n]);
const visibleNav=()=>NAV.filter((n,i)=>n[0]==='--'?(NAV.slice(i+1).findIndex(x=>x[0]==='--')<0?NAV.slice(i+1):NAV.slice(i+1,i+1+NAV.slice(i+1).findIndex(x=>x[0]==='--'))).some(x=>allowed(x[0])):allowed(n[0]));
const VIEWS={};   /* extra sections register themselves here (js/qx-admin2.js) */
let current='overview';
function buildNav(){
  const button=n=>'<button type="button" data-s="'+n[0]+'"'+(n[0]===current?' aria-current="page"':'')+'>'+E(n[1])+'<span class="qa-n" data-n="'+n[0]+'"></span></button>';
  $('#qa-nav').innerHTML=NAV_GROUPS.map(g=>{
    const links=g.links.filter(n=>allowed(n[0])),extra=(g.extra||[]).filter(n=>allowed(n[0]));
    if(!links.length&&!extra.length)return '';
    const compact=window.matchMedia('(max-width:900px)').matches;
    const groupOpen=!compact||links.concat(extra).some(n=>n[0]===current);
    return '<details class="qa-nav-section"'+(groupOpen?' open':'')+'>'+(g.title?'<summary class="qa-nav-h">'+E(g.title)+'<span aria-hidden="true">⌄</span></summary>':'')+
      '<div class="qa-nav-section-links">'+links.map(button).join('')+
      (extra.length?'<details class="qa-nav-more"'+(extra.some(n=>n[0]===current)?' open':'')+'><summary>'+E(g.more||'More')+'<span aria-hidden="true">⌄</span></summary><div class="qa-nav-sub">'+extra.map(button).join('')+'</div></details>':'')+
      '</div></details>';
  }).join('');
  $('#qa-nav').querySelectorAll('button[data-s]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.s)));
}
function go(s){current=s;document.body.classList.remove('qa-nav-open');history.replaceState(null,'','#'+s);buildNav();if(!allowed(s)){s=current='overview';}({overview:overview,applications:applications,account:account,pages:pagesView,branding:branding,contact:contactView,edits:editsView}[s]||VIEWS[s]||(()=>list(s)))();main.focus&&main.focus();}
async function counts(){
  const q=async(t,w)=>{try{return (await S.list(t,{where:w})).length;}catch(e){return 0;}};
  const [a,b,c,d]=await Promise.all([q('applications',{status:'new'}),q('jobs',{status:'open'}),q('posts',{status:'published'}),q('tenders',{status:'open'})]);
  const set=(n,v)=>{const el=$('[data-n="'+n+'"]');if(el)el.textContent=v?v:'';};
  set('applications',a);return {newApps:a,openJobs:b,posts:c,tenders:d};
}

/* ---------- overview ---------- */
async function overview(){
  main.innerHTML='<h1>Overview</h1><div class="qa-loading">Loading…</div>';
  const c=await counts();let sol=[];try{sol=await S.list('solutions',{where:{status:'published'}});}catch(e){}
  let apps=[];try{apps=(await S.list('applications',{order:['created_at','desc'],limit:5}));}catch(e){}
  const tile=(n,l,s)=>'<button type="button" class="qa-tile" data-go="'+s+'"><strong>'+n+'</strong><span>'+E(l)+'</span></button>';
  main.innerHTML='<h1>Overview</h1>'+(QX.mode==='demo'?'<div class="qx-status ok" style="margin-bottom:20px"><strong>Demo mode.</strong> Nothing here is connected to a real database; changes are saved only in this browser.</div>':'')+
   '<div class="qa-tiles">'+tile(sol.length,'Published solutions','solutions')+tile(c.openJobs,'Open jobs','jobs')+tile(c.newApps,'New applications','applications')+tile(c.posts,'Blog articles','posts')+tile(c.tenders,'Open tenders','tenders')+'</div>'+
   '<h2>Latest applications</h2>'+(apps.length?'<div class="qa-table-wrap"><table class="qa-table"><thead><tr><th>Name</th><th>Position</th><th>Received</th><th>Status</th></tr></thead><tbody>'+apps.map(a=>'<tr><td>'+E(a.full_name)+'</td><td>'+E(a.job_title||'General')+'</td><td>'+fmt(a.created_at)+'</td><td>'+badge(a.status,APP_STATUS)+'</td></tr>').join('')+'</tbody></table></div>':'<p class="qa-muted">No applications yet.</p>')+
   '<h2>Quick actions</h2><div class="qa-actions"><button class="qx-btn" data-new="jobs">+ New job</button><button class="qx-btn" data-new="posts">+ New article</button><button class="qx-btn" data-new="tenders">+ New tender</button><button class="qx-btn" data-new="solutions">+ New solution</button></div>';
  main.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));
  main.querySelectorAll('[data-new]').forEach(b=>b.addEventListener('click',()=>{go(b.dataset.new);edit(b.dataset.new,null);}));
}

/* ---------- generic list ---------- */
async function list(type){
  const sc=SCH[type];main.innerHTML='<h1>'+E(sc.label)+'</h1><div class="qa-loading">Loading…</div>';
  let rows=[];try{rows=await S.list(type,{order:sc.order});}catch(e){main.innerHTML+='<div class="qx-status err">Could not load: '+E(e.message)+'</div>';return;}
  const f={q:'',st:''};
  function draw(){
    const vis=rows.filter(r=>(!f.st||r.status===f.st)&&(!f.q||JSON.stringify(r).toLowerCase().indexOf(f.q.toLowerCase())>-1));
    const keep=document.activeElement&&document.activeElement.id==='qa-q';
    main.innerHTML='<div class="qa-head"><h1>'+E(sc.label)+'</h1><button class="qx-btn" id="qa-add">+ New '+E(sc.one)+'</button></div>'+
     '<div class="qx-toolbar"><input id="qa-q" type="search" placeholder="Search…" value="'+E(f.q)+'" aria-label="Search"><select id="qa-st" aria-label="Status"><option value="">All statuses</option>'+sc.status.map(s=>'<option value="'+s[0]+'"'+(f.st===s[0]?' selected':'')+'>'+s[1]+'</option>').join('')+'</select><span class="qx-count">'+vis.length+' of '+rows.length+'</span></div>'+
     (vis.length?'<div class="qa-table-wrap"><table class="qa-table"><thead><tr>'+sc.cols.map(c=>'<th>'+E(c[1])+'</th>').join('')+'<th>Status</th><th></th></tr></thead><tbody>'+vis.map(r=>'<tr>'+sc.cols.map(c=>'<td>'+E(c[2]?c[2](r):(/date|created|closing|published_at/.test(c[0])?fmt(r[c[0]]):(r[c[0]]==null?'':r[c[0]])))+'</td>').join('')+'<td>'+badge(r.status,sc.status)+(r.is_core?' <span class="qx-badge">Core</span>':'')+'</td><td class="qa-row-actions"><button data-e="'+r.id+'">Edit</button><button data-d="'+r.id+'" class="danger">'+(r.is_core?'Hide':'Delete')+'</button></td></tr>').join('')+'</tbody></table></div>':'<div class="qx-empty">Nothing here yet. Click “New '+E(sc.one)+'” to add one.</div>');
    $('#qa-add').addEventListener('click',()=>edit(type,null,reload));
    const q=$('#qa-q');q.addEventListener('input',()=>{f.q=q.value;draw();});$('#qa-st').addEventListener('change',e=>{f.st=e.target.value;draw();});
    if(keep){const q2=$('#qa-q');q2.focus();q2.setSelectionRange(q2.value.length,q2.value.length);}
    main.querySelectorAll('[data-e]').forEach(b=>b.addEventListener('click',()=>edit(type,rows.find(r=>r.id===b.dataset.e),reload)));
    main.querySelectorAll('[data-d]').forEach(b=>b.addEventListener('click',async()=>{
      const r=rows.find(x=>x.id===b.dataset.d);
      if(r.is_core){if(!confirm('Hide this core solution from the website? It will disappear from menus, cards and its own page. You can publish it again later.'))return;await S.save(type,{id:r.id,status:'draft'});toast('Hidden from the website.');}
      else{if(!confirm('Delete this '+sc.one+' permanently? This cannot be undone.'))return;await S.remove(type,r.id);toast('Deleted.');}
      reload();}));
  }
  async function reload(){rows=await S.list(type,{order:sc.order});draw();counts();}
  draw();counts();
}

/* ---------- create / edit form ---------- */
function edit(type,row,done){
  const sc=SCH[type],isNew=!row;row=row||{};const core=row.is_core;
  const fields=core?sc.fields.filter(x=>['sort_order','status'].indexOf(x.k)>-1):sc.fields;
  const val=k=>row[k]==null?'':row[k];
  const input=(f,k,v)=>{
    if(f.t==='text')return '<input type="text" data-k="'+k+'" value="'+E(v)+'">';
    if(f.t==='number')return '<input type="number" data-k="'+k+'" value="'+E(v===''?100:v)+'">';
    if(f.t==='datetime'){const d=v?new Date(new Date(v).getTime()+2*3600000).toISOString().slice(0,16):'';return '<input type="datetime-local" data-k="'+k+'" data-dt="1" value="'+E(d)+'">';}
    if(f.t==='bool')return '<select data-k="'+k+'" data-bool="1"><option value="false"'+(!v?' selected':'')+'>No</option><option value="true"'+(v?' selected':'')+'>Yes</option></select>';
    if(f.t==='date')return '<input type="date" data-k="'+k+'" value="'+E(String(v).slice(0,10))+'">';
    if(f.t==='area')return '<textarea rows="3" data-k="'+k+'">'+E(v)+'</textarea>';
    if(f.t==='md')return '<textarea rows="10" data-k="'+k+'" data-md="1">'+E(v)+'</textarea>';
    if(f.t==='select')return '<select data-k="'+k+'">'+f.opts.map(o=>'<option value="'+o[0]+'"'+((v||f.opts[0][0])===o[0]?' selected':'')+'>'+E(o[1])+'</option>').join('')+'</select>';
    if(f.t==='status')return '<select data-k="'+k+'">'+sc.status.map(o=>'<option value="'+o[0]+'"'+(v===o[0]?' selected':'')+'>'+E(o[1])+'</option>').join('')+'</select>';
    if(f.t==='slug')return '<input type="text" data-k="'+k+'" data-slug="1" value="'+E(v)+'"'+(isNew?'':' readonly')+' pattern="[a-z0-9-]+">';
    if(f.t==='image')return '<div class="qa-upload"><input type="text" data-k="'+k+'" value="'+E(v)+'" placeholder="Choose from the library, or paste a link"><button type="button" class="qx-btn ghost qa-up-btn" data-lib="'+k+'">Choose from library</button><label class="qx-btn ghost qa-up-btn">Upload new<input type="file" data-libup="'+k+'" accept="image/jpeg,image/png,image/webp,image/avif" hidden></label></div>'+(v?'<img class="qa-thumb" alt="" src="'+E(/^(https?:|data:)/.test(v)?v:'../'+v)+'">':'')
    if(f.t==='file')return '<div class="qa-upload"><input type="text" data-k="'+k+'" value="'+E(v)+'" placeholder="Paste a link, or upload →"><label class="qx-btn ghost qa-up-btn">Upload<input type="file" data-up="'+k+'" data-kind="'+f.t+'" accept="application/pdf" hidden></label></div>'+(f.t==='image'&&v?'<img class="qa-thumb" alt="" src="'+E(/^(https?:|data:)/.test(v)?v:'../'+v)+'">':'');
    return '';
  };
  const body=fields.map(f=>{
    if(f.bi)return '<div class="qa-bi"><div>'+field(f.label+' (English)',input(f,f.k+'_en',val(f.k+'_en')),f.help,f.req)+'</div><div>'+field(f.label+' (Français)',input(f,f.k+'_fr',val(f.k+'_fr')),f.t==='md'?'Leave empty to show the English text.':'')+'</div></div>';
    return '<div'+(f.t==='image'||f.t==='file'||f.t==='md'||f.t==='area'?' class="qa-full"':'')+'>'+field(f.label,input(f,f.k,val(f.k)),f.help,f.req)+'</div>';
  }).join('');
  openModal('<h2>'+(isNew?'New ':'Edit ')+E(sc.one)+'</h2>'+(core?'<div class="qx-status ok" style="margin-bottom:14px">This is one of your original solution pages. Here you can show or hide it on the website and change its order. Its page content is edited in the website files.</div>':'')+
   '<form id="qa-form" novalidate>'+body+(fields.some(f=>f.t==='md')?'<details class="qa-help"><summary>Formatting help</summary><p><code>## Heading</code>, <code>**bold**</code>, <code>*italic*</code>, <code>- list item</code>, <code>1. numbered item</code>, <code>[link text](https://example.com)</code>, <code>&gt; quote</code>. Leave a blank line between paragraphs.</p></details>':'')+
   '<div class="qa-form-actions"><button class="qx-btn" type="submit">Save</button><button class="qx-btn ghost" type="button" id="qa-cancel">Cancel</button></div><div id="qa-fmsg" role="alert"></div></form>',true);
  const fm=$('#qa-form'),msg=$('#qa-fmsg');
  $('#qa-cancel').addEventListener('click',closeModal);
  const slugEl=fm.querySelector('[data-slug]'),titleEl=fm.querySelector('[data-k="title_en"]')||fm.querySelector('[data-k="reference"]')||fm.querySelector('[data-k="name"]');
  if(slugEl&&isNew&&titleEl)titleEl.addEventListener('input',()=>{if(!slugEl.dataset.touched)slugEl.value=U.slugify(titleEl.value);});
  if(slugEl)slugEl.addEventListener('input',()=>{slugEl.dataset.touched=1;});
  const setImg=(k,rec)=>{if(!rec)return;const i=fm.querySelector('[data-k="'+k+'"]');i.value=window.QXA.lib.url(rec);let t=i.closest('.qa-full')&&i.closest('.qa-full').querySelector('.qa-thumb');if(!t){t=document.createElement('img');t.className='qa-thumb';t.alt='';i.closest('.qa-upload').after(t);}t.src=i.value;};
  fm.querySelectorAll('[data-lib]').forEach(bt=>bt.addEventListener('click',async()=>setImg(bt.dataset.lib,await window.QXA.lib.pick({folder:type==='partners'?'Partners':'Content'}))));
  fm.querySelectorAll('[data-libup]').forEach(inp=>inp.addEventListener('change',async()=>{const f=inp.files[0];if(!f)return;setImg(inp.dataset.libup,await window.QXA.lib.prepare(f,{folder:type==='partners'?'Partners':'Content'}));inp.value='';}));
  fm.querySelectorAll('[data-up]').forEach(inp=>inp.addEventListener('change',async()=>{
    const file=inp.files[0];if(!file)return;
    if(file.size>5*1024*1024){msg.innerHTML='<div class="qx-status err">File is larger than 5 MB.</div>';return;}
    msg.innerHTML='<div class="qx-status ok">Uploading…</div>';
    try{const r=await S.upload('media',file,inp.dataset.kind==='image'?'images':'documents');fm.querySelector('[data-k="'+inp.dataset.up+'"]').value=r.url||'';msg.innerHTML='<div class="qx-status ok">Uploaded.</div>';}catch(e){msg.innerHTML='<div class="qx-status err">Upload failed: '+E(e.message)+'</div>';}
  }));
  fm.addEventListener('submit',async ev=>{
    ev.preventDefault();const o={};if(row.id)o.id=row.id;
    fm.querySelectorAll('[data-k]').forEach(el=>{o[el.dataset.k]=el.type==='number'?Number(el.value):el.value.trim();
      if(el.dataset.dt)o[el.dataset.k]=el.value?new Date(el.value+':00+02:00').toISOString():null;        /* typed in Kigali time (UTC+2) */
      if(el.dataset.bool)o[el.dataset.k]=el.value==='true';});
    if((type==='jobs'||type==='tenders')&&!o.closing_at)o.closing_date=null;
    /* extending a closed job/tender with a future time reopens it */
    if((type==='jobs'||type==='tenders')&&row.id&&row.status==='closed'&&o.status==='closed'&&o.closing_at&&new Date(o.closing_at)>new Date()&&(!row.closing_at||new Date(row.closing_at)<=new Date()))o.status='open';
    if(type==='posts'&&o.status==='published'&&o.published_at&&new Date(o.published_at)>new Date())o.status='scheduled';
    for(const f of fields){if(f.req&&!o[f.bi?f.k+'_en':f.k]){msg.innerHTML='<div class="qx-status err">Please fill in: '+E(f.label)+'</div>';return;}}
    if(!core){
      if(type==='solutions'){}
      if(!o.slug)o.slug=U.slugify(o.title_en||o.reference||o.name||'item');
      if(!/^[a-z0-9-]+$/.test(o.slug)){msg.innerHTML='<div class="qx-status err">The page name may only use lowercase letters, numbers and hyphens.</div>';return;}
      if(isNew){const ex=await S.list(type,{where:{slug:o.slug}});if(ex.length)o.slug+='-'+Math.random().toString(36).slice(2,5);}
      if(o.website&&!/^https?:\/\//i.test(o.website)){msg.innerHTML='<div class="qx-status err">The website must start with https://</div>';return;}
      if(o.contact_email&&!/^\S+@\S+\.\S+$/.test(o.contact_email)){msg.innerHTML='<div class="qx-status err">The contact email is not valid.</div>';return;}
      if(type==='solutions')o.is_core=false;
    }
    const b=fm.querySelector('button[type=submit]');b.disabled=true;b.textContent='Saving…';
    try{await S.save(type,o);closeModal();toast('Saved. It is live on the website.');if(done)done();}catch(e){msg.innerHTML='<div class="qx-status err">Could not save: '+E(e.message)+'</div>';b.disabled=false;b.textContent='Save';}
  });
}

/* ---------- applications ---------- */
async function applications(){
  main.innerHTML='<h1>Applications</h1><div class="qa-loading">Loading…</div>';
  let rows=[];try{rows=await S.list('applications',{order:['created_at','desc']});}catch(e){main.innerHTML+='<div class="qx-status err">'+E(e.message)+'</div>';return;}
  const f={q:'',st:''};
  function draw(){
    const vis=rows.filter(r=>(!f.st||r.status===f.st)&&(!f.q||JSON.stringify(r).toLowerCase().indexOf(f.q.toLowerCase())>-1));
    const keep=document.activeElement&&document.activeElement.id==='qa-q';
    main.innerHTML='<div class="qa-head"><h1>Applications</h1><button class="qx-btn ghost" id="qa-csv" '+(vis.length?'':'disabled')+'>Export CSV</button></div><div class="qx-toolbar"><input id="qa-q" type="search" placeholder="Search name, email, position…" value="'+E(f.q)+'" aria-label="Search"><select id="qa-st" aria-label="Status"><option value="">All statuses</option>'+APP_STATUS.map(s=>'<option value="'+s[0]+'"'+(f.st===s[0]?' selected':'')+'>'+s[1]+'</option>').join('')+'</select><span class="qx-count">'+vis.length+' of '+rows.length+'</span></div>'+
     (vis.length?'<div class="qa-table-wrap"><table class="qa-table"><thead><tr><th>Name</th><th>Position</th><th>Email</th><th>Received</th><th>CV</th><th>Status</th><th></th></tr></thead><tbody>'+vis.map(a=>'<tr><td><strong>'+E(a.full_name)+'</strong></td><td>'+E(a.job_title||'General')+'</td><td>'+E(a.email)+'</td><td>'+fmt(a.created_at)+'</td><td>'+(a.cv_path?'✓':'–')+'</td><td>'+badge(a.status,APP_STATUS)+'</td><td class="qa-row-actions"><button data-v="'+a.id+'">Open</button></td></tr>').join('')+'</tbody></table></div>':'<div class="qx-empty">No applications to show.</div>');
    const q=$('#qa-q');q.addEventListener('input',()=>{f.q=q.value;draw();});$('#qa-st').addEventListener('change',e=>{f.st=e.target.value;draw();});
    if(keep){q.focus();q.setSelectionRange(q.value.length,q.value.length);}
    main.querySelectorAll('[data-v]').forEach(b=>b.addEventListener('click',()=>view(rows.find(r=>r.id===b.dataset.v))));
    const csv=$('#qa-csv');if(csv)csv.addEventListener('click',()=>{const h=['Received','Name','Email','Phone','LinkedIn','Position','Status','CV','Notes'];const q2=v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"';const lines=[h.join(',')].concat(vis.map(a=>[a.created_at,a.full_name,a.email,a.phone,a.linkedin_url,a.job_title,a.status,a.cv_name,a.notes].map(q2).join(',')));const bl=new Blob(['\ufeff'+lines.join('\n')],{type:'text/csv'});const l=document.createElement('a');l.href=URL.createObjectURL(bl);l.download='applications-'+U.today()+'.csv';l.click();});
  }
  function view(a){
    openModal('<h2>'+E(a.full_name)+'</h2><p class="qa-muted">'+E(a.job_title||'General application')+' · '+fmt(a.created_at)+'</p><ul class="qx-facts"><li><span>Email</span><span><a href="mailto:'+E(a.email)+'">'+E(a.email)+'</a></span></li><li><span>Phone</span><span>'+E(a.phone||'–')+'</span></li><li><span>LinkedIn / portfolio</span><span>'+(a.linkedin_url?'<a target="_blank" rel="noopener noreferrer" href="'+E(a.linkedin_url)+'">Open</a>':'–')+'</span></li><li><span>CV</span><span id="qa-cv">'+(a.cv_path?'<button class="qx-btn ghost" id="qa-cvb" type="button">Download '+E(a.cv_name||'CV')+'</button>':'–')+'</span></li></ul>'+(a.cover_letter?'<h3>Message</h3><p class="qa-letter">'+E(a.cover_letter)+'</p>':'')+
     '<form id="qa-form" novalidate>'+field('Status','<select id="qa-as">'+APP_STATUS.map(s=>'<option value="'+s[0]+'"'+(a.status===s[0]?' selected':'')+'>'+s[1]+'</option>').join('')+'</select>')+field('Internal notes (never shown to the applicant)','<textarea id="qa-an" rows="4">'+E(a.notes||'')+'</textarea>')+'<div class="qa-form-actions"><button class="qx-btn" type="submit">Save</button><button class="qx-btn ghost" type="button" id="qa-cancel">Close</button><button class="qx-btn ghost danger" type="button" id="qa-del">Delete application</button></div><div id="qa-fmsg"></div></form>',true);
    $('#qa-cancel').addEventListener('click',closeModal);
    const cvb=$('#qa-cvb');if(cvb)cvb.addEventListener('click',async()=>{try{const u=await S.signedUrl('cvs',a.cv_path);if(u)window.open(u,'_blank','noopener');else toast('CV downloads need the live database.',true);}catch(e){toast('Could not open the CV.',true);}});
    $('#qa-form').addEventListener('submit',async ev=>{ev.preventDefault();try{await S.save('applications',{id:a.id,status:$('#qa-as').value,notes:$('#qa-an').value.trim()});closeModal();toast('Saved.');rows=await S.list('applications',{order:['created_at','desc']});draw();counts();}catch(e){$('#qa-fmsg').innerHTML='<div class="qx-status err">'+E(e.message)+'</div>';}});
    $('#qa-del').addEventListener('click',async()=>{if(!confirm('Delete this application permanently?'))return;await S.remove('applications',a.id);closeModal();toast('Deleted.');rows=await S.list('applications',{order:['created_at','desc']});draw();counts();});
  }
  draw();counts();
}


/* ---------- website editing views ---------- */
const PAGES=[['Main pages',[['Home','index.html'],['About','about.html'],['Technology ecosystem','ecosystem.html'],['Contact','contact.html'],['Careers','careers.html'],['Blog','blog.html'],['Tenders','tenders.html']]],
 ['Solutions',[['Solutions overview','solutions/index.html'],['Digital Infrastructure','solutions/digital-infrastructure.html'],['Cloud & Modern Workplace','solutions/cloud-modern-workplace.html'],['Power & Energy','solutions/power-energy.html'],['Cybersecurity','solutions/cybersecurity.html'],['Physical Security','solutions/physical-security.html'],['Managed ICT Services','solutions/managed-ict.html'],['Software Engineering','solutions/software-engineering.html'],['AI & Digital Transformation','solutions/ai-digital-transformation.html'],['IoT & Smart Solutions','solutions/iot-smart-solutions.html'],['Banking Technology','solutions/banking-technology.html'],['ICT Consultancy','solutions/ict-consultancy.html']]],
 ['Industries',[['Industries overview','industries/index.html'],['Government & Public Sector','industries/government-public.html'],['Banking & Financial Services','industries/banking-financial-services.html'],['Healthcare','industries/healthcare.html'],['Education','industries/education.html'],['Hospitality & Tourism','industries/hospitality-tourism.html'],['Retail & Commercial','industries/retail-commercial.html'],['Telecommunications','industries/telecommunications.html'],['Manufacturing & Agriculture','industries/manufacturing-agriculture.html'],['Energy & Utilities','industries/energy-utilities.html']]],
 ['Legal',[['Privacy Policy','privacy.html'],['Terms of Use','terms.html'],['Cookie Preferences','cookies.html']]]];
function pagesView(){
  main.innerHTML='<h1>Edit pages</h1><p class="qa-muted" style="max-width:720px;margin:-8px 0 22px">Open any page in the visual editor. Click <strong>Edit page</strong> (bottom left), then click any text, picture, button or menu link to change it. Edits to the header and footer apply to every page.</p>'+
   PAGES.map(g=>'<h2>'+E(g[0])+'</h2><div class="qa-pagegrid">'+g[1].map(p=>'<a class="qa-pagecard" href="'+E(p[1])+'#qx-edit" target="_blank" rel="noopener"><strong>'+E(p[0])+'</strong><span>Open in editor →</span></a>').join('')+'</div>').join('')+
   '<p class="qa-muted" style="margin-top:26px">Jobs, articles, tenders and new solutions are edited in their own sections on the left.</p>';
}
async function getSettings(){const rows=await S.list('site_settings');const o={};rows.forEach(r=>o[r.key]=r.value);return o;}
async function putSetting(k,v){await S.upsert('site_settings',{key:k,value:v},'key');}
async function branding(){
  main.innerHTML='<h1>Logo & header</h1><div class="qa-loading">Loading…</div>';
  const cfg=await getSettings();
  const blocks=[['header','Header logo','#ffffff'],['footer','Footer logo','#062650']];
  main.innerHTML='<h1>Logo & header</h1><p class="qa-muted" style="max-width:720px;margin:-8px 0 22px">Upload a new logo or change its size. Header and footer text and links are edited directly on the page with the visual editor (Edit pages).</p><div class="qa-two">'+blocks.map(b=>{const d=cfg['logo_'+b[0]]||{};return '<div class="qa-panel" data-w="'+b[0]+'" style="max-width:none"><h3 style="margin:0">'+b[1]+'</h3><div class="qa-logo-prev" style="background:'+b[2]+'"><img alt="" id="lp-'+b[0]+'" src="'+E(d.src||'qartexa-logo.png')+'" style="width:'+Math.round(170*(d.scale||1))+'px"></div><div class="qa-upload"><input type="text" id="ls-'+b[0]+'" value="'+E(d.src||'')+'" placeholder="Logo address, or upload →"><label class="qx-btn ghost qa-up-btn">Upload<input type="file" accept="image/png,image/webp,image/jpeg" data-up="'+b[0]+'" hidden></label></div><div class="qx-field"><label>Size: <output id="lo-'+b[0]+'">'+Math.round((d.scale||1)*100)+'%</output></label><input type="range" id="lz-'+b[0]+'" min="40" max="200" step="5" value="'+Math.round((d.scale||1)*100)+'"></div><div class="qa-actions"><button class="qx-btn" data-save="'+b[0]+'">Save</button><button class="qx-btn ghost" data-reset="'+b[0]+'">Reset to original</button></div><div id="lm-'+b[0]+'" role="status"></div></div>';}).join('')+'</div>';
  blocks.forEach(([w])=>{
    const $$=i=>$('#'+i+'-'+w),draw=()=>{const sc=$$('lz').value/100;$$('lo').textContent=Math.round(sc*100)+'%';const src=$$('ls').value.trim();$$('lp').style.width=Math.round(170*sc)+'px';$$('lp').src=src||'qartexa-logo.png';};
    $$('lz').addEventListener('input',draw);$$('ls').addEventListener('input',draw);
    main.querySelector('[data-up="'+w+'"]').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;if(f.size>5*1024*1024){$$('lm').innerHTML='<div class="qx-status err">File is larger than 5 MB.</div>';return;}try{const r=await S.upload('media',f,'logos');$$('ls').value=r.url||'';draw();$$('lm').innerHTML='<div class="qx-status ok">Uploaded. Click Save.</div>';}catch(err){$$('lm').innerHTML='<div class="qx-status err">'+E(err.message)+'</div>';}});
    main.querySelector('[data-save="'+w+'"]').addEventListener('click',async()=>{try{const src=$$('ls').value.trim();if(src&&!/^(https?:|data:image\/)/i.test(src)&&/^[a-z][a-z0-9+.-]*:/i.test(src))throw new Error('That address is not allowed.');await putSetting('logo_'+w,{src:src,scale:$$('lz').value/100});$$('lm').innerHTML='<div class="qx-status ok">Saved. Reload the website to see it.</div>';}catch(err){$$('lm').innerHTML='<div class="qx-status err">'+E(err.message)+'</div>';}});
    main.querySelector('[data-reset="'+w+'"]').addEventListener('click',async()=>{await S.removeWhere('site_settings','key','logo_'+w);toast('Restored the original logo.');branding();});
  });
}
async function contactView(){
  main.innerHTML='<h1>Contact & social</h1><div class="qa-loading">Loading…</div>';
  const cfg=await getSettings(),c=cfg.contact||{};
  const D={linkedin:'https://www.linkedin.com/company/qartexatech/',instagram:'https://www.instagram.com/qartexatech/',x:'https://x.com/qartexatech',facebook:'https://www.facebook.com/qartexatech/'};
  const f=(id,l,v,h)=>field(l,'<input type="text" id="'+id+'" value="'+E(v)+'">',h);
  main.innerHTML='<h1>Contact & social</h1><p class="qa-muted" style="max-width:720px;margin:-8px 0 22px">These details are updated everywhere on the website (top bar, footer, contact and legal pages). The address and other wording are edited with the visual editor.</p><form id="qa-cs" class="qa-panel" style="max-width:640px" novalidate><h3 style="margin:0">Contact</h3>'+f('cs-email','Email shown on the website',c.email||'info@qartexa.com','This is the address visitors see. Where form messages are delivered is set in Form builder.')+f('cs-phone','Phone number',c.phone||'+250 788 301 516')+'<p class="qa-muted">Social media accounts are managed in <a href="#social">Social media</a>.</p><div class="qa-actions"><button class="qx-btn" type="submit">Save</button></div><div id="cs-msg" role="status"></div></form>';
  $('#qa-cs').addEventListener('submit',async ev=>{ev.preventDefault();const g=i=>$('#'+i).value.trim();
    if(g('cs-email')&&!/^\S+@\S+\.\S+$/.test(g('cs-email'))){$('#cs-msg').innerHTML='<div class="qx-status err">The email is not valid.</div>';return;}
        try{await putSetting('contact',{email:g('cs-email'),phone:g('cs-phone')});$('#cs-msg').innerHTML='<div class="qx-status ok">Saved. Reload the website to see it.</div>';}catch(e){$('#cs-msg').innerHTML='<div class="qx-status err">'+E(e.message)+'</div>';}});
}
async function editsView(){
  main.innerHTML='<h1>All edits</h1><div class="qa-loading">Loading…</div>';
  let rows=[];try{rows=await S.list('cms_overrides',{order:['updated_at','desc']});}catch(e){}
  const cfg=await getSettings(),links=Array.isArray(cfg.custom_links)?cfg.custom_links:[];
  const kind=r=>r.key.startsWith('i.')?'Picture':(r.key.startsWith('l.')?'Link':'Text');
  const what=r=>{const d=r.data||{};return d.en?d.en:(d.src?d.src:(d.href?d.href+(d.hidden?' (hidden)':''):(d.hidden?'Hidden':'')));};
  main.innerHTML='<h1>All edits</h1><p class="qa-muted" style="max-width:720px;margin:-8px 0 22px">Everything changed with the visual editor. Revert an edit to bring back the original.</p>'+
   (rows.length?'<div class="qa-table-wrap"><table class="qa-table"><thead><tr><th>Where</th><th>Type</th><th>Now shows</th><th>Changed</th><th></th></tr></thead><tbody>'+rows.map(r=>'<tr><td>'+E(r.page==='global'?'Every page (header/footer)':r.page.replace(/_/g,' / '))+'</td><td>'+kind(r)+'</td><td style="max-width:360px;overflow-wrap:anywhere">'+E(String(what(r)).slice(0,120))+'</td><td>'+fmt(r.updated_at)+'</td><td class="qa-row-actions"><button data-rv="'+E(r.key)+'">Revert</button></td></tr>').join('')+'</tbody></table></div>':'<div class="qx-empty">No edits yet. Open <strong>Edit pages</strong> to start.</div>')+
   '<h2>Links you added</h2>'+(links.length?'<div class="qa-table-wrap"><table class="qa-table"><thead><tr><th>Text</th><th>Address</th><th></th></tr></thead><tbody>'+links.map(l=>'<tr><td>'+E(l.label_en)+'</td><td>'+E(l.href)+'</td><td class="qa-row-actions"><button data-rl="'+E(l.id)+'" class="danger">Remove</button></td></tr>').join('')+'</tbody></table></div>':'<p class="qa-muted">None.</p>');
  main.querySelectorAll('[data-rv]').forEach(b=>b.addEventListener('click',async()=>{if(!confirm('Revert this edit to the original?'))return;await S.removeWhere('cms_overrides','key',b.dataset.rv);toast('Reverted.');editsView();}));
  main.querySelectorAll('[data-rl]').forEach(b=>b.addEventListener('click',async()=>{if(!confirm('Remove this link?'))return;await putSetting('custom_links',links.filter(l=>l.id!==b.dataset.rl));toast('Removed.');editsView();}));
}

/* ---------- account ---------- */
function account(){
  const s=QX.auth.session();
  main.innerHTML='<h1>Account</h1><div class="qa-panel"><ul class="qx-facts"><li><span>Signed in as</span><span>'+E((s&&s.user&&s.user.email)||'')+'</span></li><li><span>Mode</span><span>'+(QX.mode==='demo'?'Demo (this browser only)':'Connected to Supabase')+'</span></li></ul></div>'+
   (QX.mode==='supabase'?'<h2>Change email address</h2><form id="qa-em" class="qa-panel" novalidate>'+field('New email address','<input type="email" id="qa-e1" autocomplete="email">','We send a confirmation link to the new address. Your login only changes after you click it.')+'<button class="qx-btn" type="submit">Send confirmation</button><div id="qa-emm" role="status"></div></form><h2>Change password</h2><form id="qa-pw" class="qa-panel" novalidate>'+field('New password (min. 10 characters)','<input type="password" id="qa-p1" autocomplete="new-password">')+'<button class="qx-btn" type="submit">Update password</button><div id="qa-pwm" role="alert"></div></form>':'')+
   '<div class="qa-actions" style="margin-top:24px"><button class="qx-btn ghost" id="qa-out">Sign out</button></div>';
  const em=$('#qa-em');if(em)em.addEventListener('submit',async ev=>{ev.preventDefault();const v=$('#qa-e1').value.trim();if(!/^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(v)){$('#qa-emm').innerHTML='<div class="qx-status err">Enter a valid email address.</div>';return;}if(v.toLowerCase()===String((s.user||{}).email||'').toLowerCase()){$('#qa-emm').innerHTML='<div class="qx-status err">That is already your address.</div>';return;}try{await QX.auth.setEmail(v);$('#qa-emm').innerHTML='<div class="qx-status ok">Confirmation requested. Open the link we sent to '+E(v)+' to finish the change.</div>';}catch(e){$('#qa-emm').innerHTML='<div class="qx-status err">'+E(e.message)+'</div>';}});
  const pw=$('#qa-pw');if(pw)pw.addEventListener('submit',async ev=>{ev.preventDefault();const v=$('#qa-p1').value;if(v.length<10){$('#qa-pwm').innerHTML='<div class="qx-status err">Use at least 10 characters.</div>';return;}try{await QX.auth.setPassword(v);$('#qa-pwm').innerHTML='<div class="qx-status ok">Password updated.</div>';$('#qa-p1').value='';}catch(e){$('#qa-pwm').innerHTML='<div class="qx-status err">'+E(e.message)+'</div>';}});
  $('#qa-out').addEventListener('click',signOut);
}
async function signOut(){await QX.auth.signOut();location.replace('portal.html');}

window.QXA={QX:QX,$:$,main:main,E:E,field:field,toast:toast,openModal:openModal,closeModal:closeModal,S:S,badge:badge,fmt:fmt,putSetting:putSetting,getSettings:getSettings,go:go,VIEWS:VIEWS,role:()=>ROLE};
if(window.QXA_EXT)window.QXA_EXT(window.QXA);
if(window.QXA_EXT3)window.QXA_EXT3(window.QXA);
/* ---------- start ---------- */
(async function(){
  ROLE=QX.auth.session()?await QX.auth.role():null;if(!ROLE){location.replace('portal.html');return;}
  try{await S.rpc('expire_items');}catch(e){}   /* tidy: marks expired jobs/tenders as closed */
  const s=QX.auth.session();$('#qa-user').textContent=(s.user&&s.user.email)||'';
  $('#qa-signout').addEventListener('click',signOut);
  const navToggle=$('#qa-nav-toggle');
  if(navToggle)navToggle.addEventListener('click',()=>{const open=document.body.classList.toggle('qa-nav-open');navToggle.setAttribute('aria-expanded',String(open));});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.body.classList.remove('qa-nav-open');if(navToggle)navToggle.setAttribute('aria-expanded','false');}});
  const mq=window.matchMedia('(max-width:900px)');
  if(mq.addEventListener)mq.addEventListener('change',()=>{document.body.classList.remove('qa-nav-open');buildNav();});
  const h=location.hash.replace('#','');current=NAV.some(n=>n[0]===h&&n[0]!=='--'&&allowed(n[0]))?h:'overview';
  $('#qa-user').textContent=((s.user&&s.user.email)||'')+' · '+({super_admin:'Super Administrator',admin:'Administrator',editor:'Website Editor',hr:'HR Manager',content:'Content Manager'}[ROLE]||ROLE);
  buildNav();go(current);
  addEventListener('hashchange',()=>{const h2=location.hash.replace('#','');if(h2!==current&&NAV.some(n=>n[0]===h2&&n[0]!=='--'&&allowed(n[0])))go(h2);});
})();
})();
