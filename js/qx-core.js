/* ========================================================================
   QARTEXA V2: CORE  (js/qx-core.js)
   Data layer (Supabase or demo mode), language helpers and a safe text
   formatter. Used by the public pages, the staff portal and the menu patcher.
   ======================================================================== */
(function(){
'use strict';
const CFG=window.QX_CONFIG||{};
const SB=!!(CFG.supabaseUrl&&CFG.supabaseAnonKey);
const DEMO=!SB&&!!CFG.demo;
const MODE=SB?'supabase':(DEMO?'demo':'none');
const URLB=(CFG.supabaseUrl||'').replace(/\/+$/,'');
const me=document.querySelector('script[src*="qx-core.js"]');
const BASE=me?(me.getAttribute('src').replace(/js\/qx-core\.js.*$/,'')):'';
const TABLES=['solutions','jobs','applications','posts','tenders','partners','cms_overrides','site_settings','social_links','staff','forms','form_fields','form_submissions','activity_log'];

/* ---------- small helpers ---------- */
const LANG=()=>document.documentElement.lang==='fr'?'fr':'en';
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const pick=(o,k)=>{if(!o)return'';const l=LANG();return (l==='fr'&&o[k+'_fr'])||o[k+'_en']||o[k]||'';};
const slugify=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,70)||'item';
const uid=()=>(crypto&&crypto.randomUUID)?crypto.randomUUID():'id-'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const today=()=>new Date().toISOString().slice(0,10);
function fmtDate(d){if(!d)return'';const x=new Date(String(d).length<=10?d+'T00:00:00':d);if(isNaN(x))return'';return x.toLocaleDateString(LANG()==='fr'?'fr-FR':'en-GB',{day:'numeric',month:'long',year:'numeric'});}
function endOf(r){ /* the moment something closes: closing_at (exact) or end of closing_date */
  if(!r)return null;if(r.closing_at)return new Date(r.closing_at);
  if(r.closing_date)return new Date(r.closing_date+'T23:59:59'); return null;}
function isLive(r){const e=endOf(r);return !e||e.getTime()>Date.now();}
function daysLeft(d){if(!d)return null;const a=(d&&typeof d==='object')?endOf(d):new Date(String(d).length<=10?d+'T23:59:59':d),b=new Date();if(!a)return null;return Math.ceil((a-b)/86400000);}
function onLang(fn){new MutationObserver(()=>fn(LANG())).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});}

/* ---------- safe formatter: **bold**, *italic*, [link](url), ## headings, lists, > quotes. HTML is escaped. ---------- */
function md(src){
  src=String(src||'').replace(/\r\n?/g,'\n').trim(); if(!src)return'';
  const inl=s=>{s=esc(s);
    s=s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,(m,t,u)=>{u=u.replace(/&amp;/g,'&').replace(/&#39;/g,"'");
      if(!/^(https?:\/\/|mailto:|tel:|\/|\.{1,2}\/|#|[\w-]+\.html)/i.test(u))return t;
      return '<a href="'+esc(u)+'"'+(/^https?:/i.test(u)?' target="_blank" rel="noopener noreferrer"':'')+'>'+t+'</a>';});
    return s.replace(/\*\*([^*\n]+)\*\*/g,'<strong>$1</strong>').replace(/(^|[^*])\*([^*\n]+)\*/g,'$1<em>$2</em>').replace(/`([^`\n]+)`/g,'<code>$1</code>');};
  const out=[];let list=null,para=[];
  const flushP=()=>{if(para.length){out.push('<p>'+inl(para.join(' '))+'</p>');para=[];}};
  const flushL=()=>{if(list){out.push('<'+list.t+'>'+list.i.map(x=>'<li>'+inl(x)+'</li>').join('')+'</'+list.t+'>');list=null;}};
  src.split('\n').forEach(line=>{
    let m;
    if(!line.trim()){flushP();flushL();return;}
    if((m=line.match(/^(#{1,4})\s+(.*)$/))){flushP();flushL();const n=Math.min(m[1].length+1,5);out.push('<h'+n+'>'+inl(m[2])+'</h'+n+'>');return;}
    if((m=line.match(/^\s*[-*•]\s+(.*)$/))){flushP();if(!list||list.t!=='ul'){flushL();list={t:'ul',i:[]};}list.i.push(m[1]);return;}
    if((m=line.match(/^\s*\d+[.)]\s+(.*)$/))){flushP();if(!list||list.t!=='ol'){flushL();list={t:'ol',i:[]};}list.i.push(m[1]);return;}
    if((m=line.match(/^>\s?(.*)$/))){flushP();flushL();out.push('<blockquote>'+inl(m[1])+'</blockquote>');return;}
    if(/^---+$/.test(line.trim())){flushP();flushL();out.push('<hr>');return;}
    flushL();para.push(line.trim());
  });
  flushP();flushL();return out.join('\n');
}
const lines=t=>String(t||'').split('\n').map(x=>x.trim()).filter(Boolean);


/* ---------- safety helpers shared by the public site and the staff portal ---------- */
const SVG_TAGS={svg:1,g:1,path:1,circle:1,rect:1,ellipse:1,line:1,polyline:1,polygon:1,title:1};
const SVG_ATTR={viewbox:1,d:1,cx:1,cy:1,r:1,rx:1,ry:1,x:1,y:1,x1:1,y1:1,x2:1,y2:1,width:1,height:1,points:1,fill:1,stroke:1,'stroke-width':1,'stroke-linecap':1,'stroke-linejoin':1,'stroke-miterlimit':1,'fill-rule':1,'clip-rule':1,transform:1,opacity:1,'fill-opacity':1,'stroke-opacity':1,xmlns:1};
/* Returns a clean <svg> string, or null when the file is not a plain icon. Scripts, styles, links, images, event handlers and external references are removed. */
function cleanSvg(src){
  src=String(src==null?'':src).trim();
  if(!src||src.length>20000||/<!(doctype|entity)/i.test(src))return null;
  let doc;try{doc=new DOMParser().parseFromString(src,'image/svg+xml');}catch(e){return null;}
  if(!doc||doc.querySelector('parsererror'))return null;
  const root=doc.documentElement;if(!root||String(root.localName).toLowerCase()!=='svg')return null;
  (function walk(el){
    Array.prototype.slice.call(el.children).forEach(ch=>{if(!SVG_TAGS[String(ch.localName).toLowerCase()]||(ch.namespaceURI&&ch.namespaceURI!=='http://www.w3.org/2000/svg')){ch.remove();return;}walk(ch);});
    Array.prototype.slice.call(el.attributes).forEach(a=>{const n=a.name.toLowerCase();if(!SVG_ATTR[n]||/url\s*\(|javascript:|data:|expression|&#|<|>/i.test(a.value))el.removeAttribute(a.name);});
  })(root);
  if(!root.querySelector('path,circle,rect,ellipse,line,polyline,polygon'))return null;
  root.setAttribute('xmlns','http://www.w3.org/2000/svg');root.setAttribute('aria-hidden','true');root.setAttribute('focusable','false');
  root.removeAttribute('width');root.removeAttribute('height');
  if(!root.getAttribute('viewBox'))root.setAttribute('viewBox','0 0 24 24');
  const out=new XMLSerializer().serializeToString(root);return out.length<=4000?out:null;
}
/* A link target staff may publish: https, mailto or tel only. */
function safeLink(u){
  u=String(u==null?'':u).trim();if(!u||u.length>500)return null;
  if(/^mailto:[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/i.test(u))return u;
  if(/^tel:\+?[0-9 ()-]{5,30}$/i.test(u))return u;
  try{const x=new URL(u);if(x.protocol==='https:'&&!x.username&&!x.password&&x.hostname.indexOf('.')>0)return x.href;}catch(e){}
  return null;
}

/* ---------- interface text (English / French) for the dynamic pages ---------- */
const T={
 en:{loading:'Loading…',empty:'Nothing to show yet.',apply:'Apply now',viewAll:'View all',readMore:'Read article',back:'Back',search:'Search',all:'All',closes:'Closes',closed:'Closed',open:'Open',awarded:'Awarded',draft:'Draft',published:'Published',daysLeft:d=>d<=0?'Closes today':d+(d===1?' day left':' days left'),noJobs:'There are no open positions right now. Send us a general application and we will keep your details for future roles.',noPosts:'No articles have been published yet. Please check back soon.',noTenders:'There are no tenders at the moment. New opportunities will be published here.',noSolutions:'This solution is not available.',submit:'Submit application',sending:'Sending…',thanks:'Thank you. Your application has been received. Our team will contact you if your profile matches.',failed:'We could not send your application. Please try again or email us.',reqd:'Please complete all required fields.',fileBig:'The CV must be a PDF or Word file smaller than 5 MB.',department:'Department',location:'Location',type:'Type',level:'Level',category:'Category',reference:'Reference',issued:'Issued',deadline:'Closing date',document:'Download tender document',contact:'Questions about this tender',share:'Copy link',copied:'Link copied',related:'Keep reading',requirements:'Requirements',aboutRole:'About the role',capabilities:'What we deliver',notAvail:'This page is not available.',jobsFound:n=>n+(n===1?' position':' positions'),by:'By'},
 fr:{loading:'Chargement…',empty:'Rien à afficher pour le moment.',apply:'Postuler',viewAll:'Tout voir',readMore:'Lire l’article',back:'Retour',search:'Rechercher',all:'Tous',closes:'Clôture',closed:'Clôturé',open:'Ouvert',awarded:'Attribué',draft:'Brouillon',published:'Publié',daysLeft:d=>d<=0?'Clôture aujourd’hui':d+(d===1?' jour restant':' jours restants'),noJobs:'Aucun poste n’est ouvert actuellement. Envoyez-nous une candidature spontanée : nous conserverons vos informations pour de futurs postes.',noPosts:'Aucun article n’a encore été publié. Revenez bientôt.',noTenders:'Aucun appel d’offres pour le moment. Les nouvelles opportunités seront publiées ici.',noSolutions:'Cette solution n’est pas disponible.',submit:'Envoyer la candidature',sending:'Envoi…',thanks:'Merci. Votre candidature a bien été reçue. Notre équipe vous contactera si votre profil correspond.',failed:'Nous n’avons pas pu envoyer votre candidature. Veuillez réessayer ou nous écrire.',reqd:'Veuillez remplir tous les champs obligatoires.',fileBig:'Le CV doit être un fichier PDF ou Word de moins de 5 Mo.',department:'Département',location:'Lieu',type:'Type',level:'Niveau',category:'Catégorie',reference:'Référence',issued:'Publié le',deadline:'Date de clôture',document:'Télécharger le dossier d’appel d’offres',contact:'Questions sur cet appel d’offres',share:'Copier le lien',copied:'Lien copié',related:'À lire aussi',requirements:'Profil recherché',aboutRole:'Le poste',capabilities:'Ce que nous proposons',notAvail:'Cette page n’est pas disponible.',jobsFound:n=>n+(n===1?' poste':' postes'),by:'Par'}
};
const t=k=>{const v=(T[LANG()]||T.en)[k];return v===undefined?T.en[k]:v;};
const ENUM={
 employment_type:{en:{'full-time':'Full-time','part-time':'Part-time',contract:'Contract',internship:'Internship'},fr:{'full-time':'Temps plein','part-time':'Temps partiel',contract:'Contrat',internship:'Stage'}},
 experience_level:{en:{entry:'Entry level',mid:'Mid level',senior:'Senior',lead:'Lead / Manager'},fr:{entry:'Débutant',mid:'Confirmé',senior:'Senior',lead:'Responsable'}},
 status:{en:{open:'Open',closed:'Closed',awarded:'Awarded',draft:'Draft',published:'Published'},fr:{open:'Ouvert',closed:'Clôturé',awarded:'Attribué',draft:'Brouillon',published:'Publié'}}
};
const label=(k,v)=>((ENUM[k]||{})[LANG()]||{})[v]||v||'';

/* ---------- storage that keeps working when the browser blocks it (private mode, sandboxes) ---------- */
const mem={},memS={};
const LS={get:k=>{try{return localStorage.getItem(k);}catch(e){return mem[k]===undefined?null:mem[k];}},set:(k,v)=>{try{localStorage.setItem(k,v);}catch(e){mem[k]=v;}},del:k=>{try{localStorage.removeItem(k);}catch(e){delete mem[k];}}};
const SS={get:k=>{try{return sessionStorage.getItem(k);}catch(e){return memS[k]===undefined?null:memS[k];}},set:(k,v)=>{try{sessionStorage.setItem(k,v);}catch(e){memS[k]=v;}},keys:()=>{try{return Object.keys(sessionStorage);}catch(e){return Object.keys(memS);}},del:k=>{try{sessionStorage.removeItem(k);}catch(e){delete memS[k];}}};

/* ---------- the store: one interface, two back ends ---------- */
const SESSION_KEY='qx_session';
const getSession=()=>{try{return JSON.parse(LS.get(SESSION_KEY)||'null');}catch(e){return null;}};
const setSession=s=>{if(s)LS.set(SESSION_KEY,JSON.stringify(s));else LS.del(SESSION_KEY);};
const cacheKey=n=>'qx_c_'+n;
const bust=()=>{SS.keys().filter(k=>k.indexOf('qx_c_')===0).forEach(k=>SS.del(k));};

let seedP=null;
function loadSeed(){
  if(window.QX_SEED)return Promise.resolve(window.QX_SEED);
  if(seedP)return seedP;
  seedP=new Promise((res,rej)=>{const s=document.createElement('script');s.src=BASE+'js/qx-seed.js';s.onload=()=>res(window.QX_SEED);s.onerror=()=>rej(new Error('seed'));document.head.appendChild(s);});
  return seedP;
}
const DB_KEY='qx_demo_db_v1';
async function demoDb(){
  let db=null;try{db=JSON.parse(LS.get(DB_KEY)||'null');}catch(e){}
  if(!db){const seed=await loadSeed();db=JSON.parse(JSON.stringify(seed));LS.set(DB_KEY,JSON.stringify(db));}
  TABLES.forEach(k=>{if(!db[k])db[k]=[];});return db;
}
const saveDemo=db=>LS.set(DB_KEY,JSON.stringify(db));

function matches(row,where){
  return Object.keys(where||{}).every(k=>{const v=where[k];return Array.isArray(v)?v.indexOf(row[k])>-1:row[k]===v;});
}
function sortRows(rows,order){
  if(!order)return rows;const [c,d]=order;const f=d==='desc'?-1:1;
  return rows.slice().sort((a,b)=>{const x=a[c],y=b[c];if(x==y)return 0;if(x==null)return 1;if(y==null)return -1;return (x>y?1:-1)*f;});
}

/* Supabase REST helpers (PostgREST + GoTrue + Storage) */
async function refreshIfNeeded(){
  const s=getSession();if(!s)return null;
  if(s.demo||MODE!=='supabase')return s;
  if(s.expires_at&&Date.now()/1000<s.expires_at-30)return s;
  try{
    const r=await fetch(URLB+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:CFG.supabaseAnonKey,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:s.refresh_token})});
    if(!r.ok)throw 0;const j=await r.json();const n={access_token:j.access_token,refresh_token:j.refresh_token,expires_at:j.expires_at||Math.floor(Date.now()/1000)+(j.expires_in||3600),user:j.user||s.user};setSession(n);return n;
  }catch(e){setSession(null);return null;}
}
async function rest(path,opt){
  opt=opt||{};const s=await refreshIfNeeded();
  const h=Object.assign({apikey:CFG.supabaseAnonKey,'Content-Type':'application/json',Authorization:'Bearer '+((s&&s.access_token)||CFG.supabaseAnonKey)},opt.headers||{});
  const r=await fetch(URLB+'/rest/v1/'+path,{method:opt.method||'GET',headers:h,body:opt.body?JSON.stringify(opt.body):undefined});
  if(!r.ok){let m='';try{m=await r.text();}catch(e){}throw new Error(m||('HTTP '+r.status));}
  return r.status===204?null:(r.headers.get('content-length')==='0'?null:r.json().catch(()=>null));
}
function qs(where,order,limit){
  const p=['select=*'];
  Object.keys(where||{}).forEach(k=>{const v=where[k];p.push(encodeURIComponent(k)+'='+(Array.isArray(v)?'in.('+v.map(x=>encodeURIComponent(x)).join(',')+')':'eq.'+encodeURIComponent(v)));});
  if(order)p.push('order='+order[0]+'.'+(order[1]||'asc'));
  if(limit)p.push('limit='+limit);
  return p.join('&');
}
const clean=row=>{const o={};Object.keys(row).forEach(k=>{if(row[k]!==undefined&&k!=='_new')o[k]=row[k]===''?null:row[k];});return o;};

const store={
  mode:MODE,connected:MODE!=='none',
  async list(table,o){
    o=o||{};
    if(MODE==='supabase')return (await rest(table+'?'+qs(o.where,o.order,o.limit)))||[];
    if(MODE==='demo'){const db=await demoDb();let rows=db[table].filter(r=>matches(r,o.where));rows=sortRows(rows,o.order);return o.limit?rows.slice(0,o.limit):rows;}
    return [];
  },
  async rpc(fn,args){
    if(MODE==='supabase')return rest('rpc/'+fn,{method:'POST',body:args||{}});
    return null; /* demo mode has no server functions */
  },
  async get(table,id){const r=await this.list(table,{where:{id}});return r[0]||null;},
  async bySlug(table,slug){const r=await this.list(table,{where:{slug}});return r[0]||null;},
  async save(table,row){
    bust();row=clean(row);
    if(MODE==='supabase'){
      if(row.id){const id=row.id;delete row.id;const r=await rest(table+'?id=eq.'+encodeURIComponent(id),{method:'PATCH',body:Object.assign(row,{updated_at:new Date().toISOString()}),headers:{Prefer:'return=representation'}});return r&&r[0];}
      const r=await rest(table,{method:'POST',body:row,headers:{Prefer:'return=representation'}});return r&&r[0];
    }
    if(MODE==='demo'){
      const db=await demoDb();const now=new Date().toISOString();
      if(row.id){const i=db[table].findIndex(x=>x.id===row.id);if(i>-1){db[table][i]=Object.assign(db[table][i],row,{updated_at:now});saveDemo(db);return db[table][i];}}
      const n=Object.assign({id:uid(),created_at:now},row);db[table].push(n);saveDemo(db);return n;
    }
    throw new Error('Not connected');
  },
  async upsert(table,row,keyCol){
    bust();row=clean(row);
    if(MODE==='supabase'){const r=await rest(table+'?on_conflict='+keyCol,{method:'POST',body:row,headers:{Prefer:'resolution=merge-duplicates,return=representation'}});return r&&r[0];}
    if(MODE==='demo'){const db=await demoDb();const i=db[table].findIndex(x=>x[keyCol]===row[keyCol]);const now=new Date().toISOString();if(i>-1){db[table][i]=Object.assign(db[table][i],row,{updated_at:now});}else db[table].push(Object.assign({created_at:now},row,{updated_at:now}));saveDemo(db);return row;}
    throw new Error('Not connected');
  },
  async removeWhere(table,col,val){
    bust();
    if(MODE==='supabase'){await rest(table+'?'+encodeURIComponent(col)+'=eq.'+encodeURIComponent(val),{method:'DELETE'});return true;}
    if(MODE==='demo'){const db=await demoDb();db[table]=db[table].filter(x=>x[col]!==val);saveDemo(db);return true;}
  },
  async insertPublic(table,row){
    bust();row=clean(row);
    if(MODE==='supabase'){await rest(table,{method:'POST',body:row,headers:{Prefer:'return=minimal'}});return true;}
    if(MODE==='demo'){const db=await demoDb();db[table].push(Object.assign({id:uid(),created_at:new Date().toISOString()},row));saveDemo(db);return true;}
    throw new Error('Not connected');
  },
  async remove(table,id){
    bust();
    if(MODE==='supabase'){await rest(table+'?id=eq.'+encodeURIComponent(id),{method:'DELETE'});return true;}
    if(MODE==='demo'){const db=await demoDb();db[table]=db[table].filter(x=>x.id!==id);saveDemo(db);return true;}
  },
  /* files: bucket 'media' is public (images, tender documents); bucket 'cvs' is private (applications) */
  async upload(bucket,file,folder){
    const name=uid().slice(0,8)+'-'+String(file.name||'file').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9._-]+/g,'-').slice(-80);
    const path=(folder?folder+'/':'')+name;
    if(MODE==='supabase'){
      const s=await refreshIfNeeded();
      const r=await fetch(URLB+'/storage/v1/object/'+bucket+'/'+path,{method:'POST',headers:{apikey:CFG.supabaseAnonKey,Authorization:'Bearer '+((s&&s.access_token)||CFG.supabaseAnonKey),'Content-Type':file.type||'application/octet-stream','x-upsert':'false'},body:file});
      if(!r.ok)throw new Error(await r.text());
      return {path:path,url:bucket==='media'?URLB+'/storage/v1/object/public/media/'+path:null,name:file.name};
    }
    if(MODE==='demo'){
      if(bucket==='media'&&file.size<900000){const url=await new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=rej;fr.readAsDataURL(file);});return {path:path,url:url,name:file.name};}
      return {path:path,url:null,name:file.name};
    }
    throw new Error('Not connected');
  },
  async signedUrl(bucket,path){
    if(MODE==='supabase'){const s=await refreshIfNeeded();const r=await fetch(URLB+'/storage/v1/object/sign/'+bucket+'/'+path,{method:'POST',headers:{apikey:CFG.supabaseAnonKey,Authorization:'Bearer '+(s&&s.access_token),'Content-Type':'application/json'},body:JSON.stringify({expiresIn:3600})});if(!r.ok)throw new Error('sign');const j=await r.json();return URLB+'/storage/v1'+j.signedURL;}
    return null;
  }
};

/* ---------- login (staff only) ---------- */
const auth={
  session:getSession,
  async signIn(email,password){
    if(MODE==='supabase'){
      const r=await fetch(URLB+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:CFG.supabaseAnonKey,'Content-Type':'application/json'},body:JSON.stringify({email:email,password:password})});
      const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error_description||j.msg||'Login failed');
      setSession({access_token:j.access_token,refresh_token:j.refresh_token,expires_at:j.expires_at||Math.floor(Date.now()/1000)+(j.expires_in||3600),user:j.user});return getSession();
    }
    if(MODE==='demo'){if(email.trim().toLowerCase()==='admin@demo.local'&&password==='demo1234'){setSession({demo:true,user:{email:'admin@demo.local',id:'demo'}});return getSession();}throw new Error('Wrong demo email or password');}
    throw new Error('The website is not connected to its database yet.');
  },
  /* role of the signed-in staff member: super_admin | admin | editor | hr | content | null */
  async role(){
    const s=await refreshIfNeeded();if(!s)return null;
    if(MODE==='demo')return s.demo?'super_admin':null;
    if(MODE==='supabase'){
      try{const r=await rest('staff?select=role,active&user_id=eq.'+encodeURIComponent(s.user.id));
        if(r&&r.length&&r[0].active)return r[0].role;
        /* databases not yet migrated to V4 still use the old admins table */
        return null;}
      catch(e){try{const r=await rest('admins?select=user_id&user_id=eq.'+encodeURIComponent(s.user.id));return (r&&r.length)?'super_admin':null;}catch(e2){return null;}}
    }
    return null;
  },
  async isAdmin(){return !!(await this.role());},
  /* UI hint only. The database enforces the same rules with Row Level Security (public.can()). */
  can(role,area){
    const m={content:['super_admin','admin','editor','content'],appearance:['super_admin','admin','editor'],forms:['super_admin','admin','editor'],submissions:['super_admin','admin'],hr:['super_admin','admin','hr'],tenders:['super_admin','admin','content'],staff:['super_admin'],audit:['super_admin','admin']};
    return !!(m[area]&&m[area].indexOf(role)>-1);
  },
  async signOut(){
    const s=getSession();
    if(MODE==='supabase'&&s){try{await fetch(URLB+'/auth/v1/logout',{method:'POST',headers:{apikey:CFG.supabaseAnonKey,Authorization:'Bearer '+s.access_token}});}catch(e){}}
    setSession(null);
  },
  async recover(email){const r=await fetch(URLB+'/auth/v1/recover',{method:'POST',headers:{apikey:CFG.supabaseAnonKey,'Content-Type':'application/json'},body:JSON.stringify({email:email,redirect_to:location.origin+location.pathname})});if(!r.ok)throw new Error('recover');return true;},
  async setPassword(password,token){
    if(MODE!=='supabase')throw new Error('Not available in demo mode');
    const s=getSession();const tk=token||(s&&s.access_token);
    const r=await fetch(URLB+'/auth/v1/user',{method:'PUT',headers:{apikey:CFG.supabaseAnonKey,Authorization:'Bearer '+tk,'Content-Type':'application/json'},body:JSON.stringify({password:password})});
    if(!r.ok){const j=await r.json().catch(()=>({}));throw new Error(j.msg||j.message||'Could not update password');}return true;
  },
  /* Supabase sends a confirmation link to the NEW address (and, with "secure email change" on, to the old one). The address only changes after confirmation. */
  async setEmail(email){
    if(MODE!=='supabase')throw new Error('Not available in demo mode');
    const s=getSession();if(!s)throw new Error('Please sign in again.');
    const r=await fetch(URLB+'/auth/v1/user',{method:'PUT',headers:{apikey:CFG.supabaseAnonKey,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'},body:JSON.stringify({email:email})});
    if(!r.ok){const j=await r.json().catch(()=>({}));throw new Error(j.msg||j.message||'Could not request the email change');}return true;
  }
};

/* ---------- cached reads for the public site ---------- */
async function publicRows(table){
  if(MODE==='none')return [];
  try{const c=JSON.parse(SS.get(cacheKey(table))||'null');if(c&&Date.now()-c.t<120000)return table==='jobs'?c.rows.filter(isLive):c.rows;}catch(e){}
  const where={solutions:{status:'published'},jobs:{status:'open'},posts:{status:['published','scheduled']},tenders:{status:['open','closed','awarded']},partners:{status:'published'}}[table];
  const order={solutions:['sort_order','asc'],jobs:['created_at','desc'],posts:['published_at','desc'],tenders:['closing_date','asc'],partners:['sort_order','asc']}[table];
  let rows=await store.list(table,{where:where,order:order});
  if(table==='posts')rows=rows.filter(r=>!r.published_at||new Date(r.published_at).getTime()<=Date.now());
  if(table==='jobs')rows=rows.filter(isLive);
  if(table==='tenders')rows=rows.filter(r=>!r.archived&&(isLive(r)||r.show_in_history));
  SS.set(cacheKey(table),JSON.stringify({t:Date.now(),rows:rows}));
  return (table==='jobs')?rows.filter(isLive):rows;
}
async function cached(name,fn,ttl){
  if(MODE==='none')return null;
  try{const c=JSON.parse(SS.get(cacheKey(name))||'null');if(c&&Date.now()-c.t<(ttl||120000))return c.v;}catch(e){}
  const v=await fn();SS.set(cacheKey(name),JSON.stringify({t:Date.now(),v:v}));return v;
}
const socialLinks=()=>cached('social_links',async()=>{try{return await store.list('social_links',{where:{visible:true},order:['sort_order','asc']});}catch(e){return [];}});
const itemState=(kind,slug)=>MODE==='supabase'?store.rpc('item_state',{kind:kind,p_slug:slug}).catch(()=>null):Promise.resolve(null);
const overridesFor=page=>cached('ov_'+page,()=>store.list('cms_overrides',{where:{page:[page,'global']}}));
const settings=()=>cached('settings',async()=>{const rows=await store.list('site_settings');const o={};rows.forEach(r=>o[r.key]=r.value);return o;});
async function searchItems(){
  if(MODE==='none')return [];
  const [sol,jobs,posts,tenders]=await Promise.all(['solutions','jobs','posts','tenders'].map(n=>publicRows(n).catch(()=>[])));
  const out=[];
  sol.filter(s=>!s.is_core).forEach(s=>out.push({en:s.title_en,fr:s.title_fr||s.title_en,tag:s.tagline_en||'',url:'solution.html?s='+s.slug,cat:'solutions',textEn:[s.summary_en,s.body_en].join(' '),textFr:[s.summary_fr,s.body_fr].join(' ')}));
  jobs.forEach(j=>out.push({en:j.title_en,fr:j.title_fr||j.title_en,tag:'Careers • '+(j.location||''),url:'job.html?s='+j.slug,cat:'updates',textEn:[j.summary_en,j.description_en,j.requirements_en,j.department].join(' '),textFr:[j.summary_fr,j.description_fr,j.requirements_fr].join(' ')}));
  posts.forEach(p=>out.push({en:p.title_en,fr:p.title_fr||p.title_en,tag:'Blog • '+(p.category||''),url:'post.html?s='+p.slug,cat:'updates',textEn:[p.excerpt_en,p.body_en].join(' '),textFr:[p.excerpt_fr,p.body_fr].join(' ')}));
  tenders.forEach(x=>out.push({en:x.title_en,fr:x.title_fr||x.title_en,tag:'Tenders • '+(x.reference||''),url:'tender.html?s='+x.slug,cat:'updates',textEn:[x.description_en,x.reference,x.category].join(' '),textFr:[x.description_fr].join(' ')}));
  return out;
}

window.QX={config:CFG,safe:{svg:cleanSvg,link:safeLink},social:socialLinks,itemState:itemState,cached:cached,overrides:overridesFor,settings:settings,mode:MODE,CFG:CFG,BASE:BASE,store:store,auth:auth,publicRows:publicRows,searchItems:searchItems,bust:bust,
  util:{esc:esc,pick:pick,slugify:slugify,md:md,lines:lines,fmtDate:fmtDate,daysLeft:daysLeft,endOf:endOf,isLive:isLive,today:today,lang:LANG,onLang:onLang,t:t,label:label,uid:uid}};
})();
