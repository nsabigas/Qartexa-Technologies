/* ========================================================================
   QARTEXA V3: STUDIO, THE VISUAL EDITOR  (js/qx-studio.js)
   Loaded only for signed-in administrators. A small bar appears at the bottom
   left of every page. Click "Edit page", then click any text, image, button or
   menu link to change it. Changes are saved to the database and go live at once.
   ======================================================================== */
(function(){
'use strict';
let started=false;
window.QX_STUDIO={init:function(QX){
  if(started)return;started=true;
  const U=QX.util,E=U.esc,C=QX.cms,B=QX.BASE;
  const html=document.documentElement;
  let editing=false,pop=null,target=null,cancelHook=null;

  const ui=document.createElement('div');ui.className='qs-ui';
  ui.innerHTML='<button type="button" class="qs-main" data-a="edit" aria-pressed="false"><span class="qs-ico">✎</span><span class="qs-lbl">Edit page</span></button><button type="button" data-a="images" title="Pictures on this page">🖼<span class="qs-lbl"> Pictures</span></button><a href="'+B+'admin.html#branding" title="Logo, contact, social links">⚙<span class="qs-lbl"> Settings</span></a><a href="'+B+'admin.html" title="Staff dashboard">▦<span class="qs-lbl"> Dashboard</span></a>';
  document.body.appendChild(ui);
  const bar=a=>ui.querySelector('[data-a="'+a+'"]');
  function setEditing(on){
    editing=on;html.classList.toggle('qx-editing',on);bar('edit').setAttribute('aria-pressed',String(on));
    bar('edit').querySelector('.qs-lbl').textContent=on?'Done editing':'Edit page';
    if(!on)closePop();
    toast(on?'Editing: click any text, picture or link':'');
  }
  bar('edit').addEventListener('click',()=>setEditing(!editing));
  bar('images').addEventListener('click',imagesPanel);
  if(location.hash==='#qx-edit')setEditing(true);

  function toast(m){let t=document.getElementById('qs-toast');if(!t){t=document.createElement('div');t.id='qs-toast';t.className='qs-toast';t.setAttribute('role','status');document.body.appendChild(t);}
    t.textContent=m;t.classList.toggle('show',!!m);clearTimeout(toast._t);if(m)toast._t=setTimeout(()=>t.classList.remove('show'),2600);}

  function closePop(){if(pop){pop.remove();pop=null;}target=null;}
  function place(el){
    if(!pop)return;const r=el.getBoundingClientRect(),w=Math.min(380,innerWidth-16);
    pop.style.width=w+'px';
    let left=Math.max(8,Math.min(innerWidth-w-8,r.left));let top=r.bottom+10;
    const h=pop.offsetHeight;if(top+h>innerHeight-8)top=Math.max(8,r.top-h-10);
    pop.style.left=left+'px';pop.style.top=Math.max(8,top)+'px';
  }
  function openPop(inner,el){closePop();pop=document.createElement('div');pop.className='qs-pop qs-ui';pop.setAttribute('role','dialog');pop.innerHTML=inner;document.body.appendChild(pop);target=el;place(el);
    const c=pop.querySelector('[data-close]');if(c)c.addEventListener('click',()=>{if(cancelHook)cancelHook();cancelHook=null;closePop();});
    const f=pop.querySelector('textarea,input');if(f)f.focus();}
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&pop){if(cancelHook)cancelHook();cancelHook=null;closePop();}});
  addEventListener('resize',()=>target&&place(target));
  const msg=m=>{const x=pop&&pop.querySelector('#qs-msg');if(x)x.textContent=m;};

  document.addEventListener('click',e=>{
    if(!editing)return;if(e.target.closest('.qs-ui'))return;
    const el=e.target.closest('[data-cms],[data-cms-img],[data-cms-bg],[data-cms-link]');
    if(!el){if(pop&&!e.target.closest('.qs-pop'))closePop();return;}
    e.preventDefault();e.stopPropagation();
    if(el.hasAttribute('data-cms'))editText(el);
    else if(el.hasAttribute('data-cms-img')||el.hasAttribute('data-cms-bg'))editImage(el);
    else editLink(el);
  },true);
  document.addEventListener('submit',e=>{if(editing)e.preventDefault();},true);

  function editText(el){
    cancelHook=null;
    const key=el.getAttribute('data-cms'),a=el.closest('a[data-cms-link]');
    const en=el.getAttribute('data-en')||'',fr=el.getAttribute('data-fr')||'';
    const lk=a?a.getAttribute('data-cms-link'):null,cur=(C.ov()[lk]||{});
    const href=a?(a.getAttribute('href')||'').replace(/^(\.\.\/)+/,''):'';
    openPop('<h4>Edit text</h4><label>English<textarea id="qs-en" rows="'+Math.min(8,Math.max(2,Math.ceil(en.length/38)))+'">'+E(en)+'</textarea></label><label>Français<textarea id="qs-fr" rows="'+Math.min(8,Math.max(2,Math.ceil(fr.length/38)))+'">'+E(fr)+'</textarea></label>'+
      (a?'<details class="qs-more"><summary>This is also a link</summary><label>Link address<input id="qs-href" type="text" value="'+E(href)+'" placeholder="contact.html or https://…"></label><label class="qs-check"><input type="checkbox" id="qs-hide"'+(cur.hidden?' checked':'')+'> Hide this link</label><button type="button" class="qs-link" id="qs-addlink">+ Add another link after this one</button></details>':'')+
      '<div class="qs-actions"><button type="button" class="qs-primary" id="qs-save">Save</button><button type="button" id="qs-reset">Reset to original</button><button type="button" data-close>Cancel</button></div><div class="qs-msg" id="qs-msg"></div>',el);
    pop.querySelector('#qs-save').addEventListener('click',async()=>{
      const d={en:pop.querySelector('#qs-en').value.trim(),fr:pop.querySelector('#qs-fr').value.trim()};
      if(!d.en){msg('English text cannot be empty.');return;}
      try{await C.save(key,d);C.applyText(el,d);
        if(a&&pop.querySelector('#qs-href')){const nh=pop.querySelector('#qs-href').value.trim(),hid=pop.querySelector('#qs-hide').checked;
          if(nh!==href||hid||cur.hidden){if(nh&&!C.safeUrl(nh)){msg('That link address is not allowed.');return;}const ld={href:nh||href,hidden:hid};await C.save(lk,ld);C.applyLink(a,ld);}}
        closePop();toast('Saved. It is live.');}catch(err){msg('Could not save: '+err.message);}
    });
    pop.querySelector('#qs-reset').addEventListener('click',async()=>{try{await C.revert(key);C.resetText(el);if(a&&C.ov()[lk]){await C.revert(lk);C.resetLink(a);}closePop();toast('Restored the original.');}catch(err){msg(err.message);}});
    const al=pop.querySelector('#qs-addlink');if(al)al.addEventListener('click',()=>addLink(lk,el));
  }

  function editLink(a){
    cancelHook=null;
    const lk=a.getAttribute('data-cms-link'),cur=C.ov()[lk]||{},href=(a.getAttribute('href')||'').replace(/^(\.\.\/)+/,'');
    openPop('<h4>Edit link</h4><label>Link address<input id="qs-href" type="text" value="'+E(cur.href||href)+'" placeholder="contact.html or https://…"></label><label class="qs-check"><input type="checkbox" id="qs-hide"'+(cur.hidden?' checked':'')+'> Hide this link</label><p class="qs-hint">Tip: click the words on a button to change its text. Use <code>solutions/cybersecurity.html</code> for pages on this site.</p><button type="button" class="qs-link" id="qs-addlink">+ Add another link after this one</button><div class="qs-actions"><button type="button" class="qs-primary" id="qs-save">Save</button><button type="button" id="qs-reset">Reset to original</button><button type="button" data-close>Cancel</button></div><div class="qs-msg" id="qs-msg"></div>',a);
    pop.querySelector('#qs-save').addEventListener('click',async()=>{const nh=pop.querySelector('#qs-href').value.trim();if(!nh||!C.safeUrl(nh)){msg('Enter a valid link address.');return;}const d={href:nh,hidden:pop.querySelector('#qs-hide').checked};try{await C.save(lk,d);C.applyLink(a,d);closePop();toast('Saved. It is live.');}catch(err){msg(err.message);}});
    pop.querySelector('#qs-reset').addEventListener('click',async()=>{try{await C.revert(lk);C.resetLink(a);closePop();toast('Restored the original.');}catch(err){msg(err.message);}});
    pop.querySelector('#qs-addlink').addEventListener('click',()=>addLink(lk,a));
  }
  function addLink(afterKey,el){
    openPop('<h4>Add a link</h4><p class="qs-hint">It will appear right after the one you clicked, in the same style.</p><label>Text (English)<input id="qs-l-en" type="text"></label><label>Texte (Français)<input id="qs-l-fr" type="text"></label><label>Link address<input id="qs-l-href" type="text" placeholder="careers.html or https://…"></label><div class="qs-actions"><button type="button" class="qs-primary" id="qs-save">Add link</button><button type="button" data-close>Cancel</button></div><div class="qs-msg" id="qs-msg"></div>',el);
    pop.querySelector('#qs-save').addEventListener('click',async()=>{
      const en=pop.querySelector('#qs-l-en').value.trim(),fr=pop.querySelector('#qs-l-fr').value.trim(),hr=pop.querySelector('#qs-l-href').value.trim();
      if(!en||!hr||!C.safeUrl(hr)){msg('Please enter the text and a valid link address.');return;}
      try{const S=await C.settings();const list=Array.isArray(S.custom_links)?S.custom_links.slice():[];list.push({id:U.uid().slice(0,8),after:afterKey,label_en:en,label_fr:fr||en,href:hr});await C.saveSettings('custom_links',list);QX.bust();toast('Link added. Reloading…');setTimeout(()=>{location.hash='#qx-edit';location.reload();},600);}catch(err){msg(err.message);}
    });
  }

  function currentSrc(el){if(el.tagName==='IMG')return el.getAttribute('src')||'';const m=(getComputedStyle(el).backgroundImage||'').match(/url\(["']?(.*?)["']?\)/);return m?m[1]:'';}
  const urlOf=s=>/^(https?:|data:)/.test(s)?s:B+s.replace(/^(\.\.\/)+/,'');
  function editImage(el){
    cancelHook=null;
    const key=el.getAttribute('data-cms-img')||el.getAttribute('data-cms-bg'),prev=C.ov()[key]||null,isImg=el.tagName==='IMG';
    const d=Object.assign({src:'',alt_en:isImg?(el.getAttribute('alt')||''):'',alt_fr:'',zoom:1,x:50,y:50},prev||{});
    const pv=urlOf(d.src||currentSrc(el));
    openPop('<h4>Edit picture</h4><div class="qs-prev" id="qs-prev" style="background-image:url(\''+E(pv).replace(/\'/g,'%27')+'\')"></div><div class="qs-up"><label class="qs-btnlike">Upload new picture<input type="file" id="qs-file" accept="image/jpeg,image/png,image/webp" hidden></label></div><label>Or picture address<input id="qs-src" type="text" value="'+E(d.src)+'" placeholder="https://… or leave empty to keep the current picture"></label>'+
      (isImg?'<label>Description for visitors who cannot see it (English)<input id="qs-alt-en" type="text" value="'+E(d.alt_en||'')+'"></label><label>Description (Français)<input id="qs-alt-fr" type="text" value="'+E(d.alt_fr||'')+'"></label>':'')+
      '<label>Zoom <output id="qs-zo">'+Number(d.zoom).toFixed(2)+'×</output><input id="qs-zoom" type="range" min="1" max="3" step="0.05" value="'+d.zoom+'"></label><label>Focus: left ↔ right<input id="qs-x" type="range" min="0" max="100" value="'+d.x+'"></label><label>Focus: top ↕ bottom<input id="qs-y" type="range" min="0" max="100" value="'+d.y+'"></label><p class="qs-hint">Use JPG or WebP about 1400 px wide and under 5 MB for fast pages.</p><div class="qs-actions"><button type="button" class="qs-primary" id="qs-save">Save</button><button type="button" id="qs-reset">Reset to original</button><button type="button" data-close>Cancel</button></div><div class="qs-msg" id="qs-msg"></div>',el);
    const q=s=>pop.querySelector(s);
    const read=()=>({src:q('#qs-src').value.trim(),alt_en:isImg?q('#qs-alt-en').value.trim():'',alt_fr:isImg?q('#qs-alt-fr').value.trim():'',zoom:Number(q('#qs-zoom').value),x:Number(q('#qs-x').value),y:Number(q('#qs-y').value)});
    const live=()=>{const v=read();q('#qs-zo').textContent=v.zoom.toFixed(2)+'×';C.applyImg(el,v);const u=C.safeUrl(v.src);if(u)q('#qs-prev').style.backgroundImage='url("'+urlOf(u)+'")';};
    ['#qs-zoom','#qs-x','#qs-y','#qs-src'].forEach(s=>q(s).addEventListener('input',live));
    cancelHook=()=>{if(prev)C.applyImg(el,prev);else C.resetImg(el);};
    q('#qs-file').addEventListener('change',async ev=>{const f=ev.target.files[0];if(!f)return;if(f.size>5*1024*1024){msg('The picture is larger than 5 MB.');return;}
      msg('Uploading…');try{const r=await QX.store.upload('media',f,'images');q('#qs-src').value=r.url||'';live();msg('Uploaded. Adjust zoom and focus, then Save.');}catch(err){msg('Upload failed: '+err.message);}});
    q('#qs-save').addEventListener('click',async()=>{const v=read();if(v.src&&!C.safeUrl(v.src)){msg('That picture address is not allowed.');return;}try{await C.save(key,v);C.applyImg(el,v);cancelHook=null;closePop();toast('Saved. It is live.');}catch(err){msg(err.message);}});
    q('#qs-reset').addEventListener('click',async()=>{try{await C.revert(key);C.resetImg(el);cancelHook=null;closePop();toast('Restored the original.');}catch(err){msg(err.message);}});
  }
  function imagesPanel(){
    const els=[].slice.call(document.querySelectorAll('[data-cms-img],[data-cms-bg]')).filter(e=>!e.closest('.qs-ui'));
    if(!els.length){toast('There are no editable pictures on this page.');return;}
    if(!editing)setEditing(true);
    openPop('<h4>Pictures on this page</h4><div class="qs-grid">'+els.map((e,i)=>'<button type="button" class="qs-thumb" data-i="'+i+'" style="background-image:url(\''+E(urlOf(currentSrc(e))).replace(/\'/g,'%27')+'\')" aria-label="Edit picture '+(i+1)+'"></button>').join('')+'</div><div class="qs-actions"><button type="button" data-close>Close</button></div>',ui);
    pop.style.left='8px';pop.style.top=Math.max(8,innerHeight-pop.offsetHeight-70)+'px';
    pop.querySelectorAll('.qs-thumb').forEach(b=>b.addEventListener('click',()=>{const e=els[+b.dataset.i];e.scrollIntoView({block:'center'});setTimeout(()=>editImage(e),250);}));
  }
}};
})();
