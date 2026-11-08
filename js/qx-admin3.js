/* ========================================================================
   QARTEXA V5: MEDIA LIBRARY, PAGE HEROES, SITE IMAGES  (js/qx-admin3.js)
   ======================================================================== */
window.QXA_EXT3=function(A){
'use strict';
var QX=A.QX,E=A.E,$=A.$,main=A.main,field=A.field,toast=A.toast,openModal=A.openModal,closeModal=A.closeModal,S=A.S,badge=A.badge;
var M=window.QXM,H=window.QX_HERO,INV=window.QX_INVENTORY||{pages:[],images:[],cards:[]};
var msg=function(el,t,bad){if(el)el.innerHTML='<div class="qx-status '+(bad?'err':'ok')+'">'+E(t)+'</div>';};
function css(){if(document.getElementById('qa3-css'))return;var s=document.createElement('style');s.id='qa3-css';s.textContent=
'.qa3-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:0 0 14px}.qa3-bar input[type=search]{min-width:220px}'+
'.qa3-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(168px,1fr));gap:12px}.qa3-card{background:#fff;border:1px solid #dbe8f2;border-radius:8px;padding:0;text-align:left;cursor:pointer;overflow:hidden;font:inherit;display:block}.qa3-card:hover,.qa3-card:focus-visible{border-color:#062650;outline:2px solid #062650;outline-offset:1px}'+
'.qa3-card img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover;background:#eef3f8}.qa3-card span{display:block;padding:7px 9px;font-size:12px;color:#4f6377;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.qa3-card strong{display:block;font-size:13px;color:#172b43;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:8px 9px 0}'+
'.qa3-drop{border:2px dashed #b9cde0;border-radius:10px;padding:14px;text-align:center;color:#4f6377;margin-bottom:14px}.qa3-drop.over{background:#eaf3fb;border-color:#062650}'+
'.qa3-ed{display:grid;grid-template-columns:minmax(260px,1.3fr) 1fr;gap:18px}@media(max-width:820px){.qa3-ed{grid-template-columns:1fr}}.qa3-stage{background:#e9eff5;border-radius:8px;padding:8px;text-align:center}.qa3-stage canvas{max-width:100%;height:auto;cursor:move;touch-action:none;background:#fff}'+
'.qa3-bar2{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}.qa3-prog{height:10px;background:#dbe8f2;border-radius:6px;overflow:hidden;margin:8px 0}.qa3-prog i{display:block;height:100%;background:#062650;width:0;transition:width .15s}'+
'.qa3-split{display:grid;grid-template-columns:minmax(250px,320px) 1fr;gap:18px;align-items:start}@media(max-width:1000px){.qa3-split{grid-template-columns:1fr}}.qa3-slots{background:#fff;border:1px solid #dbe8f2;border-radius:10px;max-height:80vh;overflow:auto}.qa3-slots h3{margin:0;padding:8px 12px;background:#f7fbfe;font-size:12px;text-transform:uppercase;letter-spacing:.6px;color:#4f6377;position:sticky;top:0}'+
'.qa3-slot{display:flex;justify-content:space-between;gap:8px;width:100%;text-align:left;background:none;border:0;border-bottom:1px solid #eaf1f7;padding:9px 12px;font:inherit;cursor:pointer;align-items:center}.qa3-slot:hover,.qa3-slot[aria-current=true]{background:#eaf3fb}.qa3-slot small{color:#4f6377;display:block}'+
'.qa3-focal{position:relative;display:inline-block;max-width:100%;cursor:crosshair;line-height:0;border-radius:6px;overflow:hidden}.qa3-focal img{max-width:100%;max-height:240px;display:block}.qa3-focal i{position:absolute;width:26px;height:26px;margin:-13px 0 0 -13px;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 2px #e80000,0 0 8px rgba(0,0,0,.5);pointer-events:none}'+
'.qa3-rows{display:grid;grid-template-columns:1fr 1fr;gap:10px}@media(max-width:700px){.qa3-rows{grid-template-columns:1fr}}.qa3-mut{color:#4f6377;font-size:13px}.qa3-sw{display:flex;gap:8px;align-items:center}.qa3-sw input[type=color]{width:42px;height:34px;padding:0;border:1px solid #cdd9e5;border-radius:6px}'+
'.qa3-tbl{width:100%;border-collapse:collapse;background:#fff;border:1px solid #dbe8f2;border-radius:10px;overflow:hidden}.qa3-tbl th,.qa3-tbl td{padding:8px 10px;border-bottom:1px solid #eaf1f7;text-align:left;font-size:13px;vertical-align:middle}.qa3-tbl th{background:#f7fbfe;font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:#4f6377}.qa3-tbl img{width:84px;height:54px;object-fit:cover;border-radius:4px;background:#eef3f8;display:block}';
document.head.appendChild(s);}
function confirmBox(text,ok,fn,wide){openModal('<h2 style="margin-top:0">Please confirm</h2><div>'+text+'</div><div class="qa-actions"><button class="qx-btn" id="c3-ok" style="background:#b00000">'+E(ok||'Confirm')+'</button><button class="qx-btn ghost" id="c3-no">Cancel</button></div>');$('#c3-no').onclick=closeModal;$('#c3-ok').onclick=function(){closeModal();fn();};}

/* a second dialog layer, so the picker can open ON TOP of an open editor without closing it */
var topEl=null;
function closeTop(){if(topEl){topEl.hidden=true;topEl.innerHTML='';}}
function layer(top){
  if(!top)return {open:openModal,close:closeModal};
  return {close:closeTop,open:function(html,wide){
    if(!topEl){topEl=document.createElement('div');topEl.className='qa-modal qa3-top';topEl.addEventListener('click',function(e){if(e.target===topEl)closeTop();});document.body.appendChild(topEl);}
    topEl.innerHTML='<div class="qa-dialog'+(wide?' wide':'')+'" role="dialog" aria-modal="true">'+html+'</div>';topEl.hidden=false;var f=topEl.querySelector('input,textarea,select,button');if(f)f.focus();}};
}
window.addEventListener('keydown',function(e){if(e.key==='Escape'&&topEl&&!topEl.hidden){closeTop();e.stopPropagation();}},true);
/* ---------------- data helpers ---------------- */
var cache={rows:null};
async function loadMedia(force){if(!cache.rows||force)cache.rows=await S.list('media',{order:['created_at','desc'],limit:2000});return cache.rows;}
function sorted(rec,fmt){return (rec.variants||[]).filter(function(v){return v.fmt===fmt;}).sort(function(a,b){return a.w-b.w;});}
function thumb(rec){var v=sorted(rec,'webp')[0];return v?H.url(v.path):'';}
function best(rec,max){var v=sorted(rec,'webp').filter(function(x){return x.w<=(max||1920);}).pop()||sorted(rec,'webp')[0];return v?H.url(v.path):'';}
function total(rec){return (rec.variants||[]).reduce(function(a,v){return a+(v.bytes||0);},0);}
function folderList(rows){var f={};rows.forEach(function(r){f[r.folder]=(f[r.folder]||0)+1;});return f;}
function cleanName(n){return String(n||'').replace(/\.[a-z0-9]+$/i,'').replace(/[-_]+/g,' ').replace(/\s+/g,' ').trim().slice(0,120)||'Untitled image';}
function newId(){return (crypto.randomUUID&&crypto.randomUUID())||'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){var r=Math.random()*16|0;return (c==='x'?r:(r&3|8)).toString(16);});}

/* store the processed variants: upload every file, then write the record; clean up if anything fails */
async function storeImage(built,meta,onStage,replaceRec){
  var id=replaceRec?replaceRec.id:newId(),ver=replaceRec?(replaceRec.versions||[]).length+1:0,base='library/'+id+(ver?'-v'+ver:''),done=[],vars=[];
  var n=built.variants.length;
  try{
    for(var i=0;i<n;i++){var v=built.variants[i],path=base+'/'+v.w+'.'+v.fmt;
      await M.upload(v.blob,path,function(l,t){onStage&&onStage('Uploading '+(i+1)+' of '+n+'…',(i+l/t)/n);});done.push(path);vars.push({w:v.w,h:v.h,fmt:v.fmt,path:path,bytes:v.bytes});}
    var row;
    if(replaceRec){
      var versions=(replaceRec.versions||[]).concat([{base:replaceRec.base,variants:replaceRec.variants,width:replaceRec.width,height:replaceRec.height,replaced_at:new Date().toISOString()}]);
      row=Object.assign({},meta,{id:id,base:base,variants:vars,versions:versions,width:built.width,height:built.height,bytes:vars.reduce(function(a,x){return a+x.bytes;},0),mime:'image/webp',updated_at:new Date().toISOString()});
    }else row=Object.assign({},meta,{id:id,base:base,variants:vars,width:built.width,height:built.height,bytes:vars.reduce(function(a,x){return a+x.bytes;},0),mime:'image/webp'});
    var saved=await S.upsert('media',row,'id');cache.rows=null;return saved||row;
  }catch(e){await M.removeFiles(done);throw e;}
}

/* ---------------- the "prepare image" editor ---------------- */
function prepare(file,opts){
  opts=opts||{};var Lr=layer(opts.top);
  return new Promise(async function(resolve){
    var bm;try{bm=await M.decode(file);}catch(e){toast(e.message,true);resolve(null);return;}
    var rows=[];try{rows=await loadMedia();}catch(e){}
    var folders=Object.keys(folderList(rows));if(folders.indexOf('General')<0)folders.unshift('General');
    var rec=opts.replace||null;
    var st={rot:0,aspect:opts.aspect||0,zoom:1,cx:.5,cy:.5,free:{l:0,r:0,t:0,b:0},max:1920,busy:false};
    var img=function(){return M.rotated(bm,st.rot);};
    var rect=function(rc){var w=rc.width,h=rc.height;if(st.aspect==='orig'||!st.aspect&&false)return {x:0,y:0,w:w,h:h};
      if(st.aspect===0){var l=st.free.l/100*w,r=st.free.r/100*w,t=st.free.t/100*h,b=st.free.b/100*h;return {x:Math.round(l),y:Math.round(t),w:Math.max(50,Math.round(w-l-r)),h:Math.max(50,Math.round(h-t-b))};}
      return M.cropRect(w,h,st.aspect,st.zoom,st.cx,st.cy);};
    Lr.open('<h2 style="margin-top:0">'+(rec?'Replace image file':'Prepare image')+'</h2><div class="qa3-ed"><div><div class="qa3-stage"><canvas id="ed-cv" aria-label="Image preview with crop area"></canvas></div><div class="qa3-bar2"><button type="button" class="qx-btn ghost" id="ed-rl">↺ Rotate left</button><button type="button" class="qx-btn ghost" id="ed-rr">↻ Rotate right</button></div><p class="qa3-mut" id="ed-info"></p></div><div>'+
      field('Crop shape','<select aria-label="Crop shape" id="ed-as"><option value="0">Free (use the sliders)</option><option value="1.7778">Wide 16:9</option><option value="2.3333">Panorama 21:9</option><option value="1.5">Photo 3:2</option><option value="1.3333">Standard 4:3</option><option value="1">Square</option><option value="orig">Whole image, no crop</option></select>')+
      '<div id="ed-zm">'+field('Zoom (drag the picture to move the crop)','<input aria-label="Zoom (drag the picture to move the crop)" type="range" id="ed-z" min="1" max="5" step="0.05" value="1">')+'</div><div id="ed-fr" hidden>'+['l:Left','r:Right','t:Top','b:Bottom'].map(function(x){var p=x.split(':');return '<label class="qa3-mut">Cut '+p[1]+' <output id="ed-o'+p[0]+'">0%</output></label><input type="range" data-f="'+p[0]+'" min="0" max="60" step="1" value="0" style="width:100%">';}).join('')+'</div>'+
      field('Largest width to keep','<select aria-label="Largest width to keep" id="ed-mw"><option value="1920">1920 px (recommended for heroes)</option><option value="1600">1600 px</option><option value="1280">1280 px</option><option value="1024">1024 px (small images)</option></select>')+
      (rec?'':field('Title','<input aria-label="Title" id="ed-t" maxlength="160" value="'+E(cleanName(file.name))+'">')+field('Folder','<input aria-label="Folder" id="ed-fo" list="ed-fl" maxlength="60" value="'+E(opts.folder||'General')+'"><datalist id="ed-fl">'+folders.map(function(f){return '<option value="'+E(f)+'">';}).join('')+'</datalist>','Pick one or type a new folder name.')+'<div class="qa3-rows">'+field('Alt text (English)','<input aria-label="Alt text (English)" id="ed-ae" maxlength="200">','Describe the picture for people who cannot see it.')+field('Alt text (Français)','<input aria-label="Alt text (Français)" id="ed-af" maxlength="200">')+'</div>'+field('Copyright / credit (optional)','<input aria-label="Copyright / credit (optional)" id="ed-c" maxlength="200">'))+
      '</div></div><div id="ed-prog" hidden><div class="qa3-prog"><i id="ed-bar"></i></div><p class="qa3-mut" id="ed-st"></p></div><div id="ed-m" role="status"></div><div class="qa-actions"><button class="qx-btn" id="ed-save">'+(rec?'Replace file':'Save to library')+'</button><button class="qx-btn ghost" id="ed-x">Cancel</button></div>',1);
    var cv=$('#ed-cv'),ctx=cv.getContext('2d'),cur=img();
    function draw(){
      var rc=cur,sc=Math.min(1,640/rc.width);cv.width=Math.round(rc.width*sc);cv.height=Math.round(rc.height*sc);
      ctx.clearRect(0,0,cv.width,cv.height);ctx.drawImage(rc,0,0,cv.width,cv.height);
      var r=rect(rc);ctx.fillStyle='rgba(3,20,44,.55)';var x=r.x*sc,y=r.y*sc,w=r.w*sc,h=r.h*sc;
      ctx.fillRect(0,0,cv.width,y);ctx.fillRect(0,y+h,cv.width,cv.height-y-h);ctx.fillRect(0,y,x,h);ctx.fillRect(x+w,y,cv.width-x-w,h);
      ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.strokeRect(x,y,w,h);
      var ow=Math.min(+st.max,r.w);$('#ed-info').textContent='Original '+bm.width+'×'+bm.height+' px, '+M.fmtBytes(file.size)+'. After cropping: '+r.w+'×'+r.h+' px, saved up to '+ow+' px wide in several sizes.';
    }
    $('#ed-rl').onclick=function(){st.rot=(st.rot+270)%360;cur=img();draw();};$('#ed-rr').onclick=function(){st.rot=(st.rot+90)%360;cur=img();draw();};
    function syncAspect(){$('#ed-fr').hidden=st.aspect!==0;$('#ed-zm').hidden=st.aspect===0||st.aspect==='orig';}
    $('#ed-as').onchange=function(){var v=this.value;st.aspect=v==='orig'?'orig':+v;syncAspect();st.zoom=1;st.cx=st.cy=.5;$('#ed-z').value=1;draw();};
    if(st.aspect){var op=[].slice.call($('#ed-as').options).filter(function(o){return Math.abs(+o.value-st.aspect)<0.01;})[0];if(op)$('#ed-as').value=op.value;else st.aspect=0;}
    syncAspect();draw();$('#ed-z').oninput=function(){st.zoom=+this.value;draw();};
    document.querySelectorAll('[data-f]').forEach(function(i){i.oninput=function(){st.free[i.dataset.f]=+i.value;$('#ed-o'+i.dataset.f).textContent=i.value+'%';draw();};});
    $('#ed-mw').onchange=function(){st.max=+this.value;draw();};
    var drag=null;cv.onpointerdown=function(e){if(st.aspect===0||st.aspect==='orig')return;drag={x:e.clientX,y:e.clientY,cx:st.cx,cy:st.cy};cv.setPointerCapture(e.pointerId);};
    cv.onpointermove=function(e){if(!drag)return;var b=cv.getBoundingClientRect();st.cx=Math.max(0,Math.min(1,drag.cx-(e.clientX-drag.x)/b.width/st.zoom));st.cy=Math.max(0,Math.min(1,drag.cy-(e.clientY-drag.y)/b.height/st.zoom));draw();};
    cv.onpointerup=function(){drag=null;};
    var finish=function(v){bm.close&&bm.close();resolve(v);};
    $('#ed-x').onclick=function(){if(st.busy)return;Lr.close();finish(null);};
    $('#ed-save').onclick=async function(){
      if(st.busy)return;st.busy=true;var em=$('#ed-m');em.innerHTML='';$('#ed-save').disabled=true;$('#ed-prog').hidden=false;
      var stage=function(t,f){$('#ed-st').textContent=t;$('#ed-bar').style.width=Math.round(f*100)+'%';};
      try{
        stage('Optimising…',0);
        var r=rect(cur),built=await M.build(bm,{rotate:st.rot,crop:r,maxWidth:+st.max},function(i,t){stage('Optimising '+i+' of '+t+'…',i/t*0.5);});
        var meta=rec?{}:{title:$('#ed-t').value.trim()||cleanName(file.name),folder:($('#ed-fo').value.trim()||'General').slice(0,60),alt_en:$('#ed-ae').value.trim()||null,alt_fr:$('#ed-af').value.trim()||null,copyright:$('#ed-c').value.trim()||null};
        var saved=await storeImage(built,meta,function(t,f){stage(t,.5+f*.5);},rec);
        stage('Saved.',1);Lr.close();toast(rec?'File replaced.':'Image added to the library.');finish(saved);
      }catch(e){st.busy=false;$('#ed-save').disabled=false;$('#ed-prog').hidden=true;msg(em,e.message,1);}
    };
  });
}
/* many files at once: automatic optimisation, no cropping */
async function batch(files,folder){
  files=[].slice.call(files);
  if(files.length===1)return [await prepare(files[0],{folder:folder})].filter(Boolean);
  openModal('<h2 style="margin-top:0">Uploading '+files.length+' images</h2><div class="qa3-prog"><i id="bt-bar"></i></div><ul id="bt-l" style="padding-left:18px;font-size:14px"></ul><div class="qa-actions"><button class="qx-btn" id="bt-ok" disabled>Done</button></div>',1);
  var out=[],li=$('#bt-l');
  for(var i=0;i<files.length;i++){
    var f=files[i],li1=document.createElement('li');li1.textContent=f.name+': preparing…';li.appendChild(li1);
    try{var bm=await M.decode(f);var built=await M.build(bm,{maxWidth:1920});bm.close&&bm.close();
      var rec=await storeImage(built,{title:cleanName(f.name),folder:folder||'General'},function(t){li1.textContent=f.name+': '+t;});out.push(rec);li1.textContent='✓ '+f.name+' ('+M.fmtBytes(f.size)+' → '+M.fmtBytes(total(rec))+' in '+rec.variants.length+' files)';}
    catch(e){li1.textContent='✗ '+f.name+': '+e.message;li1.style.color='#b00000';}
    $('#bt-bar').style.width=Math.round((i+1)/files.length*100)+'%';
  }
  $('#bt-ok').disabled=false;await new Promise(function(r){$('#bt-ok').onclick=function(){closeModal();r();};});return out;
}

/* ---------------- media picker (used by heroes, site images and image fields) ---------------- */
function pick(opts){
  opts=opts||{};var Lr=layer(opts.top);
  return new Promise(async function(resolve){
    var rows=[];try{rows=await loadMedia();}catch(e){toast(e.message,true);resolve(null);return;}
    var q='',fo='';
    Lr.open('<h2 style="margin-top:0">Choose an image</h2><div class="qa3-bar"><input type="search" id="pk-q" placeholder="Search images…" aria-label="Search"><select id="pk-f" aria-label="Folder"></select><label class="qx-btn ghost" style="margin:0">Upload new<input type="file" id="pk-up" accept="image/jpeg,image/png,image/webp,image/avif" hidden></label></div><div id="pk-g" class="qa3-grid" style="max-height:52vh;overflow:auto"></div><div class="qa-actions"><button class="qx-btn ghost" id="pk-x">Cancel</button></div>',1);
    function show(){
      var fl=folderList(rows),sel=$('#pk-f');sel.innerHTML='<option value="">All folders ('+rows.length+')</option>'+Object.keys(fl).sort().map(function(k){return '<option value="'+E(k)+'"'+(k===fo?' selected':'')+'>'+E(k)+' ('+fl[k]+')</option>';}).join('');
      var v=rows.filter(function(r){return (!fo||r.folder===fo)&&(!q||(r.title+' '+(r.alt_en||'')+' '+(r.description||'')).toLowerCase().indexOf(q)>-1);});
      $('#pk-g').innerHTML=v.length?v.map(function(r,i){return '<button type="button" class="qa3-card" data-i="'+i+'"><img loading="lazy" alt="" src="'+E(thumb(r))+'"><strong>'+E(r.title||'Untitled')+'</strong><span>'+r.width+'×'+r.height+'</span></button>';}).join(''):'<p class="qa3-mut">No images yet. Use “Upload new”.</p>';
      $('#pk-g').querySelectorAll('[data-i]').forEach(function(b){b.onclick=function(){Lr.close();resolve(v[+b.dataset.i]);};});
    }
    show();
    $('#pk-q').oninput=function(){q=this.value.trim().toLowerCase();show();};$('#pk-f').onchange=function(){fo=this.value;show();};
    $('#pk-x').onclick=function(){Lr.close();resolve(null);};
    $('#pk-up').onchange=async function(){var f=this.files[0];if(!f)return;var r=await prepare(f,{folder:opts.folder,top:opts.top});if(r)resolve(r);else{resolve(await pick(opts));}};
  });
}

/* ================================ MEDIA LIBRARY ================================ */
function mediaView(){
  css();main.innerHTML='<h1>Media library</h1><div class="qa-loading">Loading…</div>';
  loadMedia(true).then(function(rows){
    var q='',fo='',sort='new';
    main.innerHTML='<div class="qa-head"><h1>Media library</h1><label class="qx-btn" style="margin:0">+ Upload images<input type="file" id="ml-up" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden></label></div><p class="qa-muted" style="max-width:800px;margin:-6px 0 14px">Every image is shrunk and converted automatically (modern WebP format in several sizes, plus a JPEG fallback), so the website stays fast. Upload once and use the same image on as many pages as you like.</p><div class="qa3-drop" id="ml-drop">Drag images here to upload, or use the button. JPG, PNG, WebP or AVIF up to 25 MB.</div><div class="qa3-bar"><input type="search" id="ml-q" placeholder="Search title, description, alt text…" aria-label="Search images"><select id="ml-f" aria-label="Folder"></select><select id="ml-s" aria-label="Sort"><option value="new">Newest first</option><option value="name">Name A–Z</option><option value="size">Largest first</option></select><span class="qa3-mut" id="ml-n"></span></div><div id="ml-g" class="qa3-grid"></div>';
    function show(){
      var fl=folderList(rows),sel=$('#ml-f');sel.innerHTML='<option value="">All folders ('+rows.length+')</option>'+Object.keys(fl).sort().map(function(k){return '<option value="'+E(k)+'"'+(k===fo?' selected':'')+'>'+E(k)+' ('+fl[k]+')</option>';}).join('');
      var v=rows.filter(function(r){return (!fo||r.folder===fo)&&(!q||(r.title+' '+(r.alt_en||'')+' '+(r.alt_fr||'')+' '+(r.description||'')+' '+(r.copyright||'')).toLowerCase().indexOf(q)>-1);});
      v.sort(function(a,b){return sort==='name'?String(a.title).localeCompare(b.title):sort==='size'?total(b)-total(a):0;});
      $('#ml-n').textContent=v.length+' image'+(v.length===1?'':'s');
      $('#ml-g').innerHTML=v.length?v.map(function(r,i){return '<button type="button" class="qa3-card" data-i="'+i+'"><img loading="lazy" alt="" src="'+E(thumb(r))+'"><strong>'+E(r.title||'Untitled')+'</strong><span>'+r.width+'×'+r.height+' · '+M.fmtBytes(total(r))+'</span></button>';}).join(''):'<p class="qa3-mut">'+(rows.length?'No images match.':'The library is empty. Upload your first image.')+'</p>';
      $('#ml-g').querySelectorAll('[data-i]').forEach(function(b){b.onclick=function(){detail(v[+b.dataset.i]);};});
    }
    show();
    $('#ml-q').oninput=function(){q=this.value.trim().toLowerCase();show();};$('#ml-f').onchange=function(){fo=this.value;show();};$('#ml-s').onchange=function(){sort=this.value;show();};
    var up=async function(files){if(!files.length)return;await batch(files,fo||'General');mediaView();};
    $('#ml-up').onchange=function(){up(this.files);};
    var dz=$('#ml-drop');['dragenter','dragover'].forEach(function(ev){dz.addEventListener(ev,function(e){e.preventDefault();dz.classList.add('over');});});['dragleave','drop'].forEach(function(ev){dz.addEventListener(ev,function(e){e.preventDefault();dz.classList.remove('over');});});dz.addEventListener('drop',function(e){up(e.dataTransfer.files);});
  }).catch(function(e){main.innerHTML='<h1>Media library</h1><div class="qx-status err">'+E(e.message)+' (Run supabase/migration-v5.sql first.)</div>';});
}
function detail(r){
  var vers=(r.versions||[]).length;
  openModal('<h2 style="margin-top:0">'+E(r.title||'Image')+'</h2><div class="qa3-ed"><div><img alt="" src="'+E(best(r,800))+'" style="max-width:100%;border-radius:6px;background:#eef3f8"><p class="qa3-mut">'+r.width+'×'+r.height+' px · stored as '+(r.variants||[]).length+' files, '+M.fmtBytes(total(r))+' · added '+new Date(r.created_at).toLocaleDateString('en-GB')+'</p><p class="qa3-mut">Sizes: '+(r.variants||[]).map(function(v){return v.w+'px '+v.fmt.toUpperCase();}).join(', ')+'</p><div id="dt-use" class="qa3-mut">Checking where this image is used…</div></div><div>'+
    field('Title','<input aria-label="Title" id="dt-t" maxlength="160" value="'+E(r.title||'')+'">')+field('Folder','<input aria-label="Folder" id="dt-fo" maxlength="60" value="'+E(r.folder||'General')+'">')+field('Alt text (English)','<input aria-label="Alt text (English)" id="dt-ae" maxlength="200" value="'+E(r.alt_en||'')+'">')+field('Alt text (Français)','<input aria-label="Alt text (Français)" id="dt-af" maxlength="200" value="'+E(r.alt_fr||'')+'">')+field('Description','<textarea aria-label="Description" id="dt-d" rows="2" maxlength="600">'+E(r.description||'')+'</textarea>')+field('Copyright / credit','<input aria-label="Copyright / credit" id="dt-c" maxlength="200" value="'+E(r.copyright||'')+'">')+
    '</div></div><div id="dt-m" role="status"></div><div class="qa-actions"><button class="qx-btn" id="dt-save">Save details</button><label class="qx-btn ghost" style="margin:0">Replace file<input type="file" id="dt-rep" accept="image/jpeg,image/png,image/webp,image/avif" hidden></label>'+(vers?'<button class="qx-btn ghost" id="dt-prev">Restore previous file</button>':'')+'<button class="qx-btn ghost" id="dt-copy">Copy link</button><button class="qx-btn ghost" id="dt-del" style="color:#b00000">Delete</button><button class="qx-btn ghost" id="dt-x">Close</button></div>',1);
  var usage=[];
  S.rpc('media_usage',{p_id:r.id}).then(function(u){usage=u||[];$('#dt-use').innerHTML=usage.length?'<strong>Used in '+usage.length+' place'+(usage.length>1?'s':'')+':</strong> '+usage.slice(0,12).map(function(x){return E(x.area+' ('+x.label+')');}).join('; '):'Not used anywhere yet.';}).catch(function(){$('#dt-use').textContent='Usage could not be checked.';});
  $('#dt-x').onclick=closeModal;
  $('#dt-save').onclick=async function(){try{await S.save('media',{id:r.id,title:$('#dt-t').value.trim(),folder:$('#dt-fo').value.trim()||'General',alt_en:$('#dt-ae').value.trim()||null,alt_fr:$('#dt-af').value.trim()||null,description:$('#dt-d').value.trim()||null,copyright:$('#dt-c').value.trim()||null});cache.rows=null;closeModal();toast('Saved.');mediaView();}catch(e){msg($('#dt-m'),e.message,1);}};
  $('#dt-copy').onclick=async function(){try{await navigator.clipboard.writeText(best(r,1920));toast('Link copied.');}catch(e){msg($('#dt-m'),best(r,1920));}};
  $('#dt-rep').onchange=function(){var f=this.files[0];if(!f)return;var warn=usage.length?'<p>This image is used in <strong>'+usage.length+' place(s)</strong>. Replacing the file changes it everywhere it appears.</p>':'<p>This image is not used anywhere yet.</p>';
    confirmBox(warn+'<p>The old file is kept, so you can restore it afterwards.</p>','Continue',async function(){var rec=await prepare(f,{replace:r});if(rec)mediaView();});};
  var pv=$('#dt-prev');if(pv)pv.onclick=function(){confirmBox('<p>Go back to the previous file for this image? The current file is kept so you can switch again.</p>','Restore',async function(){try{var last=r.versions[r.versions.length-1],rest=r.versions.slice(0,-1).concat([{base:r.base,variants:r.variants,width:r.width,height:r.height,replaced_at:new Date().toISOString()}]);await S.save('media',{id:r.id,base:last.base,variants:last.variants,width:last.width,height:last.height,bytes:(last.variants||[]).reduce(function(a,v){return a+(v.bytes||0);},0),versions:rest});cache.rows=null;closeModal();toast('Previous file restored.');mediaView();}catch(e){toast(e.message,true);}});};
  $('#dt-del').onclick=function(){
    if(usage.length){openModal('<h2 style="margin-top:0">This image is in use</h2><p>It cannot be deleted until it is replaced in these places:</p><ul>'+usage.map(function(x){return '<li>'+E(x.area+' — '+x.label)+'</li>';}).join('')+'</ul><div class="qa-actions"><button class="qx-btn" id="dd-x">OK</button></div>');$('#dd-x').onclick=closeModal;return;}
    confirmBox('<p>Permanently delete “'+E(r.title||'this image')+'” and all its files? This cannot be undone.</p>','Delete image',async function(){
      try{await S.remove('media',r.id);var paths=(r.variants||[]).map(function(v){return v.path;});(r.versions||[]).forEach(function(v){(v.variants||[]).forEach(function(x){paths.push(x.path);});});await M.removeFiles(paths);cache.rows=null;toast('Image deleted.');mediaView();}catch(e){toast(e.message,true);}});};
}

/* ================================ PAGE HEROES ================================ */
var GROUPS=['Home','Company & other','Solutions','Industries','Careers & resources','Contact','Legal'];
function heroes(){
  css();main.innerHTML='<h1>Page heroes</h1><div class="qa-loading">Loading…</div>';
  Promise.all([S.list('page_heroes',{}),S.list('page_heroes_draft',{}),loadMedia(true)]).then(function(r){
    var live={},draft={};r[0].forEach(function(x){live[x.page_key]=x;});r[1].forEach(function(x){draft[x.page_key]=x;});var media={};r[2].forEach(function(x){media[x.id]=x;});
    var slots=INV.pages.map(function(p){return {key:p.key,label:p.title,file:p.file,group:p.group,slot:p.slot,kind:'page'};}).concat(INV.cards.map(function(c){return {key:c.key,label:c.label,file:'index.html',group:'Home',slot:null,kind:'card',src:c.src};}));
    var sel=null;
    function status(k){return draft[k]?badge('draft',[['draft','Draft waiting']]):live[k]?badge('published',[['published','Custom image live']]):'<span class="qa3-mut">Original</span>';}
    main.innerHTML='<div class="qa-head"><h1>Page heroes</h1></div><p class="qa-muted" style="max-width:820px;margin:-6px 0 14px">Choose a page, choose its hero picture from the library (or upload one), position it, preview it on desktop, tablet and mobile, then publish. “Original” means the page still shows the picture it was built with.</p><div id="hr-msg"></div><div class="qa3-split"><div class="qa3-slots" id="hr-list"></div><div id="hr-ed"><p class="qa3-mut">Select a page on the left.</p></div></div>';
    function list(){var h='';GROUPS.concat(['Other']).forEach(function(g){var it=slots.filter(function(s){return (s.group===g)||(g==='Other'&&GROUPS.indexOf(s.group)<0);});if(!it.length)return;h+='<h3>'+E(g)+'</h3>'+it.map(function(s){return '<button type="button" class="qa3-slot" data-k="'+E(s.key)+'" aria-current="'+(sel&&sel.key===s.key)+'"><span><strong>'+E(s.label)+'</strong><small>'+E(s.kind==='card'?'Card picture on the Home page':s.file)+'</small></span><span>'+status(s.key)+'</span></button>';}).join('');});$('#hr-list').innerHTML=h;$('#hr-list').querySelectorAll('[data-k]').forEach(function(b){b.onclick=function(){sel=slots.filter(function(s){return s.key===b.dataset.k;})[0];list();edit();};});}
    list();
    function edit(){
      var s=sel,k=s.key,isCard=s.kind==='card',hasSide=!!s.slot;
      var base=(draft[k]||live[k]||{}).config;
      var cur=JSON.parse(JSON.stringify(base||{mode:isCard?'card':(hasSide?'side':'banner'),media:{},focal:{x:50,y:50},overlay:{color:'#062650',opacity:.55},height:{mode:'auto'},text:'light',zoom:false,alt_en:'',alt_fr:''}));
      cur.media=cur.media||{};cur.focal=cur.focal||{x:50,y:50};cur.overlay=cur.overlay||{color:'#062650',opacity:.55};cur.height=cur.height||{mode:'auto'};
      var dirty=false;
      function M1(){return media[cur.media.desktop];}
      function ed(){
        var d=M1(),orig=isCard?s.src:(s.slot&&s.slot.src);
        $('#hr-ed').innerHTML='<div class="qa-panel" style="padding:16px"><h2 style="margin-top:0">'+E(s.label)+'</h2><p class="qa3-mut">'+(isCard?'This picture appears on one of the four capability cards on the Home page.':(cur.mode==='side'?'Replaces the photograph shown beside the heading on this page.':'Adds a full-width picture behind the heading.'))+(orig?' Built-in image: <code>'+E(orig)+'</code>':'')+'</p>'+
        (isCard?'':'<div class="qa3-bar2"><label><input type="radio" name="hm" value="side"'+(cur.mode==='side'?' checked':'')+(hasSide?'':' disabled')+'> Replace the existing photo'+(hasSide?'':' (this page has none)')+'</label> <label><input type="radio" name="hm" value="banner"'+(cur.mode==='banner'?' checked':'')+'> Full-width banner behind the heading</label></div>')+
        '<div class="qa3-rows"><div><h3 style="margin:.2em 0">Main image</h3>'+(d?'<div class="qa3-focal" id="hr-fc"><img alt="" src="'+E(best(d,800))+'"><i style="left:'+cur.focal.x+'%;top:'+cur.focal.y+'%"></i></div><p class="qa3-mut">Click the picture to choose the point that must always stay visible ('+cur.focal.x+'%, '+cur.focal.y+'%).</p>':'<p class="qa3-mut">No image chosen yet.</p>')+'<div class="qa3-bar2"><button class="qx-btn ghost" id="hr-pick">Choose from library</button><label class="qx-btn ghost" style="margin:0">Upload new<input type="file" id="hr-up" accept="image/jpeg,image/png,image/webp,image/avif" hidden></label></div><details><summary class="qa3-mut" style="cursor:pointer">Different pictures for tablet and mobile (optional)</summary>'+['tablet','mobile'].map(function(dv){var m=media[cur.media[dv]];return '<div class="qa3-bar2"><strong style="min-width:56px;text-transform:capitalize">'+dv+'</strong>'+(m?'<img alt="" src="'+E(thumb(m))+'" style="width:60px;height:40px;object-fit:cover;border-radius:4px">':'<span class="qa3-mut">same as main</span>')+'<button class="qx-btn ghost qa2-mini" data-pd="'+dv+'">Choose</button>'+(m?'<button class="qx-btn ghost qa2-mini" data-pc="'+dv+'">Clear</button>':'')+'</div>';}).join('')+'</details></div><div>'+
        field('Alt text (English)','<input aria-label="Alt text (English)" id="hr-ae" maxlength="200" value="'+E(cur.alt_en||'')+'">','Describe the picture. Leave empty if it is purely decorative.')+field('Alt text (Français)','<input aria-label="Alt text (Français)" id="hr-af" maxlength="200" value="'+E(cur.alt_fr||'')+'">')+
        (cur.mode==='banner'?'<div class="qx-field"><label>Overlay colour and strength</label><div class="qa3-sw"><input type="color" id="hr-oc" value="'+cur.overlay.color+'" aria-label="Overlay colour"><input type="range" id="hr-oo" min="0" max="100" value="'+Math.round(cur.overlay.opacity*100)+'" aria-label="Overlay strength" style="flex:1"><output id="hr-ov">'+Math.round(cur.overlay.opacity*100)+'%</output></div></div>'+field('Banner height','<select aria-label="Banner height" id="hr-h"><option value="auto">Original design</option><option value="compact">Compact (360 px)</option><option value="standard">Standard (480 px)</option><option value="tall">Tall (640 px)</option><option value="custom">Custom…</option></select><input type="number" id="hr-hp" min="200" max="1100" value="'+(cur.height.px||480)+'" style="margin-top:6px" '+(cur.height.mode==='custom'?'':'hidden')+'>')+field('Text colour','<select aria-label="Text colour" id="hr-t"><option value="light">White text (for dark pictures)</option><option value="dark">Navy text (for light pictures)</option></select>')+'<label style="display:block"><input type="checkbox" id="hr-z"'+(cur.zoom?' checked':'')+'> Slow zoom effect (switched off for visitors who prefer reduced motion)</label>':'')+'</div></div>'+
        '<div id="hr-m" role="status"></div><div class="qa-actions"><button class="qx-btn ghost" id="hr-sd">Save draft</button><button class="qx-btn" id="hr-pub">Publish</button>'+(draft[k]?'<button class="qx-btn ghost" id="hr-disc">Discard draft</button>':'')+(live[k]&&live[k].previous?'<button class="qx-btn ghost" id="hr-rest">Restore previous image</button>':'')+(live[k]?'<button class="qx-btn ghost" id="hr-rm" style="color:#b00000">Back to original</button>':'')+'</div>'+
        (isCard?'':'<h3>Preview</h3><div class="qa3-bar2"><button class="qx-btn ghost qa2-mini" data-dv="100%">Desktop</button><button class="qx-btn ghost qa2-mini" data-dv="820px">Tablet</button><button class="qx-btn ghost qa2-mini" data-dv="390px">Mobile</button></div><iframe id="hr-fr" title="Preview of '+E(s.label)+'" src="'+(s.file.indexOf('/')>-1?'../':'')+s.file+'?qx_preview=1" style="width:100%;height:520px;border:1px solid #dbe8f2;border-radius:8px;background:#fff;display:block;margin:0 auto;max-width:100%"></iframe>')+'</div>';
        var el=function(i){return $('#'+i);};
        if(el('hr-h')){el('hr-h').value=cur.height.mode;el('hr-t').value=cur.text||'light';}
        function pv(){var f=el('hr-fr');if(!f||!f.contentWindow)return;var mm={};['desktop','tablet','mobile'].forEach(function(x){var id=cur.media[x];if(id&&media[id])mm[id]=media[id];});f.contentWindow.postMessage({type:'qx-hero-preview',page_key:k,config:M1()?build():null,media:mm},location.origin);}
        function build(){var c={mode:cur.mode,media:{},focal:{x:cur.focal.x,y:cur.focal.y},alt_en:(cur.alt_en||'').slice(0,200),alt_fr:(cur.alt_fr||'').slice(0,200)};['desktop','tablet','mobile'].forEach(function(x){if(cur.media[x])c.media[x]=cur.media[x];});
          if(cur.mode==='banner'){c.overlay={color:cur.overlay.color,opacity:cur.overlay.opacity};c.height=cur.height.mode==='custom'?{mode:'custom',px:Math.max(200,Math.min(1100,+cur.height.px||480))}:{mode:cur.height.mode||'auto'};c.text=cur.text||'light';c.zoom=!!cur.zoom;}return c;}
        var chg=function(){dirty=true;pv();};
        if(el('hr-fr'))el('hr-fr').addEventListener('load',pv);
        main.querySelectorAll('[data-dv]').forEach(function(b){b.onclick=function(){el('hr-fr').style.width=b.dataset.dv;};});
        main.querySelectorAll('input[name=hm]').forEach(function(r2){r2.onchange=function(){cur.mode=r2.value;ed();};});
        var setMain=function(rec){if(!rec)return;media[rec.id]=rec;cur.media.desktop=rec.id;if(!cur.alt_en&&rec.alt_en)cur.alt_en=rec.alt_en;if(!cur.alt_fr&&rec.alt_fr)cur.alt_fr=rec.alt_fr;dirty=true;ed();};
        el('hr-pick').onclick=async function(){setMain(await pick({folder:'Heroes'}));};
        el('hr-up').onchange=async function(){var f=this.files[0];if(!f)return;var rec=await prepare(f,{folder:'Heroes',aspect:isCard?1.5:(cur.mode==='banner'?2.3333:0)});setMain(rec);};
        main.querySelectorAll('[data-pd]').forEach(function(b){b.onclick=async function(){var rec=await pick({folder:'Heroes'});if(rec){media[rec.id]=rec;cur.media[b.dataset.pd]=rec.id;dirty=true;ed();}};});
        main.querySelectorAll('[data-pc]').forEach(function(b){b.onclick=function(){delete cur.media[b.dataset.pc];dirty=true;ed();};});
        var fc=el('hr-fc');if(fc){var mv=function(e){var b=fc.getBoundingClientRect();cur.focal.x=Math.round(Math.max(0,Math.min(100,(e.clientX-b.left)/b.width*100)));cur.focal.y=Math.round(Math.max(0,Math.min(100,(e.clientY-b.top)/b.height*100)));var dot=fc.querySelector('i');dot.style.left=cur.focal.x+'%';dot.style.top=cur.focal.y+'%';chg();};var dn=false;fc.onpointerdown=function(e){dn=true;fc.setPointerCapture(e.pointerId);mv(e);};fc.onpointermove=function(e){if(dn)mv(e);};fc.onpointerup=function(){dn=false;ed();};}
        el('hr-ae').oninput=function(){cur.alt_en=this.value;chg();};el('hr-af').oninput=function(){cur.alt_fr=this.value;chg();};
        if(el('hr-oc')){el('hr-oc').oninput=function(){cur.overlay.color=this.value;chg();};el('hr-oo').oninput=function(){cur.overlay.opacity=this.value/100;el('hr-ov').textContent=this.value+'%';chg();};
          el('hr-h').onchange=function(){cur.height.mode=this.value;el('hr-hp').hidden=this.value!=='custom';chg();};el('hr-hp').oninput=function(){cur.height.px=+this.value;chg();};el('hr-t').onchange=function(){cur.text=this.value;chg();};el('hr-z').onchange=function(){cur.zoom=this.checked;chg();};}
        var em=el('hr-m'),run=async function(fn,ok){try{await fn();msg($('#hr-m')||em,ok);}catch(e){msg($('#hr-m')||em,e.message,1);}};
        var saveDraft=async function(){if(!cur.media.desktop)throw new Error('Choose an image first.');var row=await S.upsert('page_heroes_draft',{page_key:k,config:build()},'page_key');draft[k]={page_key:k,config:build()};dirty=false;};
        el('hr-sd').onclick=function(){run(async function(){await saveDraft();list();},'Draft saved. Visitors still see the live version.');};
        el('hr-pub').onclick=function(){if(!cur.media.desktop){msg(em,'Choose an image first.',1);return;}confirmBox('<p>Publish this hero image for <strong>'+E(s.label)+'</strong> now?</p>','Publish',function(){run(async function(){await saveDraft();await S.rpc('publish_hero',{p_key:k});var cfg=build();live[k]={page_key:k,config:cfg,previous:live[k]?live[k].config:null};delete draft[k];try{sessionStorage.clear();}catch(e){}list();ed();},'Published. Open the website to see it (visitors may need to reload).');});};
        if(el('hr-disc'))el('hr-disc').onclick=function(){confirmBox('<p>Throw away the unpublished draft?</p>','Discard',async function(){try{await S.removeWhere('page_heroes_draft','page_key',k);delete draft[k];list();edit();toast('Draft discarded.');}catch(e){toast(e.message,true);}});};
        if(el('hr-rest'))el('hr-rest').onclick=function(){confirmBox('<p>Go back to the previous published hero image? The current one is kept so you can switch again.</p>','Restore',async function(){try{await S.rpc('restore_hero',{p_key:k});var l=live[k],c=l.config;l.config=l.previous;l.previous=c;try{sessionStorage.clear();}catch(e){}toast('Previous image restored.');list();edit();}catch(e){toast(e.message,true);}});};
        if(el('hr-rm'))el('hr-rm').onclick=function(){confirmBox('<p>Remove the custom image and show the page’s original built-in banner again?</p>','Remove',async function(){try{await S.rpc('remove_hero',{p_key:k});delete live[k];delete draft[k];try{sessionStorage.clear();}catch(e){}toast('The page uses its original banner again.');list();edit();}catch(e){toast(e.message,true);}});};
      }
      ed();
    }
  }).catch(function(e){main.innerHTML='<h1>Page heroes</h1><div class="qx-status err">'+E(e.message)+' (Run supabase/migration-v5.sql first.)</div>';});
}

/* ================================ SITE IMAGES ================================ */
function siteImages(){
  css();main.innerHTML='<h1>Site images</h1><div class="qa-loading">Loading…</div>';
  Promise.all([S.list('cms_overrides',{}),S.list('page_heroes',{})]).then(function(r){
    var ov={};r[0].forEach(function(x){ov[x.key]=x;});var heroSlots={};INV.pages.forEach(function(p){if(p.slot)heroSlots[p.slot.id]=p;});
    var live={};r[1].forEach(function(x){live[x.page_key]=x;});
    var abs=function(file,src){try{return new URL(src,location.origin+'/'+file).pathname;}catch(e){return src;}};
    var imgs=INV.images.filter(function(i){return i.src;});
    main.innerHTML='<div class="qa-head"><h1>Site images</h1></div><p class="qa-muted" style="max-width:820px;margin:-6px 0 14px">Every picture that appears on the website pages. Replace any of them with an image from the library. Hero pictures are managed in <a href="#heroes">Page heroes</a>.</p><div id="si-m"></div><table class="qa3-tbl"><thead><tr><th>Picture</th><th>Page</th><th>Where</th><th>Status</th><th></th></tr></thead><tbody>'+imgs.map(function(i,n){var o=ov[i.id],hp=heroSlots[i.id];var src=o&&o.data&&o.data.src?(/^https?:/.test(o.data.src)?o.data.src:'/'+o.data.src):abs(i.file,i.src);
      return '<tr><td><img loading="lazy" alt="" src="'+E(src)+'"></td><td>'+E(i.page)+'<br><span class="qa3-mut">'+E(i.file)+'</span></td><td>'+E(hp?'Hero photo':(i.kind==='bg'?'Background':'Picture'))+'<br><span class="qa3-mut">'+E(i.alt||'(decorative)')+'</span></td><td>'+(hp&&live[hp.key]?badge('published',[['published','Managed in Page heroes']]):o?badge('published',[['published','Replaced']]):'<span class="qa3-mut">Original</span>')+'</td><td style="white-space:nowrap">'+(hp?'<a class="qx-btn ghost qa2-mini" href="#heroes">Open Page heroes</a>':'<button class="qx-btn ghost qa2-mini" data-r="'+n+'">Replace</button>'+(o?' <button class="qx-btn ghost qa2-mini" data-o="'+n+'">Restore original</button>':''))+'</td></tr>';}).join('')+'</tbody></table><h3>Pictures drawn by the page design (not individually replaceable)</h3><p class="qa3-mut">Small decorative files such as the Qartexa watermark are part of the design. The four Solutions cards are managed in Page heroes.</p>';
    main.querySelectorAll('[data-r]').forEach(function(b){b.onclick=async function(){var i=imgs[+b.dataset.r],rec=await pick({folder:'Site images'});if(!rec)return;
      try{await S.upsert('cms_overrides',{key:i.id,page:i.page,data:{src:best(rec,1920),alt:(rec.alt_en||i.alt||''),x:50,y:50,zoom:1}},'key');try{sessionStorage.clear();}catch(e){}toast('Replaced.');siteImages();}catch(e){msg($('#si-m'),e.message,1);}};});
    main.querySelectorAll('[data-o]').forEach(function(b){b.onclick=function(){var i=imgs[+b.dataset.o];confirmBox('<p>Go back to the original picture?</p>','Restore',async function(){try{await S.removeWhere('cms_overrides','key',i.id);}catch(e){toast(e.message,true);return;}try{sessionStorage.clear();}catch(e){}toast('Original restored.');siteImages();});};});
  }).catch(function(e){main.innerHTML='<h1>Site images</h1><div class="qx-status err">'+E(e.message)+'</div>';});
}

A.lib={pick:function(o){return pick(Object.assign({top:true},o||{}));},prepare:function(f,o){return prepare(f,Object.assign({top:true},o||{}));},url:function(r){return best(r,1920);},loadMedia:loadMedia};
A.VIEWS.media=mediaView;A.VIEWS.heroes=heroes;A.VIEWS.siteimages=siteImages;
};
