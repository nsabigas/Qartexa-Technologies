/* ========================================================================
   QARTEXA V4: PUBLIC FORMS  (js/qx-forms.js)
   Builds any form created in Staff portal > Forms from its database
   definition (fields, labels in English/French, messages) and sends it
   through the server-side function public.submit_form, which validates
   again, applies the spam/rate limits and stores the submission.
   If the database is not connected, the page keeps its original static form.
   ======================================================================== */
(function(){
'use strict';
var QX=window.QX;if(!QX||QX.mode!=='supabase')return;
var U=QX.util,E=U.esc;
var L=function(){return U.lang();};
var MSG={
  en:{req:'This field is required.',email:'Enter a valid email address.',url:'Enter a full web address starting with https://',tel:'Enter a valid phone number.',num:'Enter a valid number.',file:'The file must be a PDF, Word or image file under 5 MB.',sending:'Sending…',busy:'Too many messages from this device. Please try again in a few minutes.',min:'Please write a little more.',bad:'Please check this field.',fix:'Please correct the highlighted fields.',select:'Select…'},
  fr:{req:'Ce champ est obligatoire.',email:'Saisissez une adresse e-mail valide.',url:'Saisissez une adresse web complète commençant par https://',tel:'Saisissez un numéro de téléphone valide.',num:'Saisissez un nombre valide.',file:'Le fichier doit être un PDF, un document Word ou une image de moins de 5 Mo.',sending:'Envoi en cours…',busy:'Trop de messages depuis cet appareil. Réessayez dans quelques minutes.',min:'Merci d’en écrire un peu plus.',bad:'Vérifiez ce champ.',fix:'Veuillez corriger les champs signalés.',select:'Sélectionner…'}
};
var m=function(k){return (MSG[L()]||MSG.en)[k];};
var pick=function(o,k){return (L()==='fr'&&o[k+'_fr'])||o[k+'_en']||'';};

function fieldHtml(f,id,val){
  var lab=pick(f,'label'),ph=pick(f,'placeholder'),help=pick(f,'help'),v=validation(f),req=f.required,r=req?' required aria-required="true"':'';
  var star=req?' <span class="required" aria-hidden="true">*</span>':'';
  var hid=help?' aria-describedby="'+id+'-h"':'',helpH=help?'<small class="field-help" id="'+id+'-h">'+E(help)+'</small>':'';
  var err='<span class="field-error" id="'+id+'-e" role="alert"></span>';
  var attrs=(v.maxlength?' maxlength="'+(+v.maxlength)+'"':'')+(v.minlength?' minlength="'+(+v.minlength)+'"':'');
  var dv=val!=null?val:(f.default_value||'');
  if(f.type==='hidden')return '<input type="hidden" name="'+E(f.name)+'" value="'+E(dv)+'">';
  if(f.type==='consent')return '<div class="field-wide consent"><label><input type="checkbox" name="'+E(f.name)+'" value="Agreed"'+r+(val==='Agreed'?' checked':'')+hid+'><span>'+E(lab)+star+'</span></label>'+err+'</div>';
  var cls='field'+(f.wide||f.type==='textarea'?' field-wide':'');
  var inner,lbl='<label for="'+id+'">'+E(lab)+star+'</label>';
  var opts=(f.options||[]).map(function(o){return {v:o.value,t:(L()==='fr'&&o.fr)||o.en||o.value};});
  switch(f.type){
    case 'textarea':inner='<textarea id="'+id+'" name="'+E(f.name)+'" rows="5" placeholder="'+E(ph)+'"'+r+attrs+hid+'>'+E(dv)+'</textarea>';break;
    case 'select':inner='<select id="'+id+'" name="'+E(f.name)+'"'+r+hid+'><option value="">'+E(ph||m('select'))+'</option>'+opts.map(function(o){return '<option value="'+E(o.v)+'"'+(dv===o.v?' selected':'')+'>'+E(o.t)+'</option>';}).join('')+'</select>';break;
    case 'radio':
    case 'multiselect':{
      var t=f.type==='radio'?'radio':'checkbox',sel=Array.isArray(dv)?dv:[dv];
      return '<fieldset class="'+cls+' field-group"><legend>'+E(lab)+star+'</legend>'+opts.map(function(o,i){return '<label class="field-opt"><input type="'+t+'" name="'+E(f.name)+'" value="'+E(o.v)+'"'+(sel.indexOf(o.v)>-1?' checked':'')+(t==='radio'&&req&&i===0?' required':'')+'><span>'+E(o.t)+'</span></label>';}).join('')+helpH+err+'</fieldset>';}
    case 'checkbox':return '<div class="field-wide consent"><label><input type="checkbox" name="'+E(f.name)+'" value="true"'+r+(dv==='true'?' checked':'')+hid+'><span>'+E(lab)+star+'</span></label>'+err+'</div>';
    case 'file':inner='<input id="'+id+'" name="'+E(f.name)+'" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"'+r+hid+'>';break;
    default:{
      var type={email:'email',tel:'tel',number:'number',date:'date',url:'url'}[f.type]||'text';
      var ex=(f.type==='number'?(v.min!=null?' min="'+(+v.min)+'"':'')+(v.max!=null?' max="'+(+v.max)+'"':''):'');
      var ac={email:' autocomplete="email"',tel:' autocomplete="tel"',url:' autocomplete="url"'}[f.type]||'';
      inner='<input id="'+id+'" name="'+E(f.name)+'" type="'+type+'" placeholder="'+E(ph)+'" value="'+E(dv)+'"'+r+attrs+ex+ac+hid+'>';
    }
  }
  return '<div class="'+cls+'">'+lbl+inner+helpH+err+'</div>';
}
function validation(f){return (f&&typeof f.validation==='object'&&f.validation)||{};}

function read(form,def){
  var data={},files={};
  def.fields.forEach(function(f){
    if(f.type==='file'){var el=form.elements[f.name];if(el&&el.files&&el.files[0])files[f.name]=el.files[0];return;}
    var els=form.querySelectorAll('[name="'+f.name+'"]');if(!els.length)return;
    if(f.type==='multiselect'){data[f.name]=[].filter.call(els,function(e){return e.checked;}).map(function(e){return e.value;});}
    else if(f.type==='radio'){var c=[].filter.call(els,function(e){return e.checked;})[0];data[f.name]=c?c.value:'';}
    else if(f.type==='checkbox'||f.type==='consent'){data[f.name]=els[0].checked?(f.type==='consent'?'Agreed':'true'):'';}
    else data[f.name]=(els[0].value||'').trim();
  });
  return {data:data,files:files};
}
function check(def,r){
  var errs={};
  def.fields.forEach(function(f){
    if(f.type==='hidden')return;var v=r.data[f.name],vv=validation(f);
    if(f.type==='file'){var fl=r.files[f.name];if(!fl){if(f.required)errs[f.name]=m('req');return;}if(fl.size>5*1048576||!/\.(pdf|docx?|jpe?g|png|webp)$/i.test(fl.name))errs[f.name]=m('file');return;}
    var empty=Array.isArray(v)?!v.length:!v;
    if(empty){if(f.required)errs[f.name]=m('req');return;}
    if(Array.isArray(v))return;
    if(f.type==='email'&&!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(v))errs[f.name]=m('email');
    else if(f.type==='url'&&!/^https?:\/\/\S+$/i.test(v))errs[f.name]=m('url');
    else if(f.type==='tel'&&!/^[0-9+()\-. ]{6,30}$/.test(v))errs[f.name]=m('tel');
    else if(f.type==='number'&&(isNaN(Number(v))||(vv.min!=null&&Number(v)<vv.min)||(vv.max!=null&&Number(v)>vv.max)))errs[f.name]=m('num');
    else if(vv.minlength&&v.length<vv.minlength)errs[f.name]=m('min');
    else if(vv.pattern&&String(vv.pattern).length<=200){try{if(!new RegExp(vv.pattern).test(v))errs[f.name]=m('bad');}catch(e){}}
  });
  return errs;
}
function showErrors(form,errs){
  form.querySelectorAll('.field-error').forEach(function(s){s.textContent='';});
  form.querySelectorAll('[aria-invalid]').forEach(function(e){e.removeAttribute('aria-invalid');});
  var first=null;
  Object.keys(errs).forEach(function(n){
    var els=form.querySelectorAll('[name="'+n+'"]');if(!els.length)return;
    var host=els[0].closest('.field,.consent,fieldset'),s=host&&host.querySelector('.field-error');
    if(s)s.textContent=errs[n];els.forEach(function(e){e.setAttribute('aria-invalid','true');});if(!first)first=els[0];
  });
  if(first)first.focus();
}

function mount(form,def){
  var statusEl=document.getElementById('formStatus')||(function(){var d=document.createElement('div');d.id='formStatus';d.className='form-status';d.setAttribute('role','status');d.tabIndex=-1;form.parentNode.insertBefore(d,form.nextSibling);return d;})();
  if(form.contains(statusEl))form.parentNode.insertBefore(statusEl,form.nextSibling);   /* the form is redrawn, the message must live outside it */
  var uid=Math.random().toString(36).slice(2,7);
  function draw(keep){
    var fields=def.fields.map(function(f,i){return fieldHtml(f,'qf-'+uid+'-'+i,keep&&keep[f.name]);}).join('');
    var note=pick(def,'note'),btn=pick(def,'submit')||'Send';
    form.innerHTML='<div class="form-trap" aria-hidden="true"><label>Leave this field empty<input type="text" name="qx_website" tabindex="-1" autocomplete="off"></label></div>'+
      '<div class="form-fields">'+fields+'</div><div class="form-submit"><button class="btn btn-primary" type="submit"><span>'+E(btn)+'</span><span aria-hidden="true">→</span></button>'+
      '<p class="form-privacy">'+E(note)+' <a href="privacy.html">'+(L()==='fr'?'Lire notre politique de confidentialité.':'Read our Privacy Policy.')+'</a></p></div>';
  }
  var snap=function(){var r=read(form,def),k=r.data;return k;};
  draw();form.setAttribute('novalidate','');form.removeAttribute('action');form.dataset.qxLive='1';
  U.onLang(function(){var k=snap();draw(k);});
  form.addEventListener('submit',async function(ev){
    ev.preventDefault();
    var r=read(form,def),errs=check(def,r);showErrors(form,errs);
    statusEl.className='form-status';statusEl.textContent='';
    if(Object.keys(errs).length){statusEl.className='form-status is-error';statusEl.textContent=m('fix');return;}
    var btn=form.querySelector('button[type=submit]'),orig=btn.innerHTML;btn.disabled=true;btn.setAttribute('aria-busy','true');btn.textContent=m('sending');
    try{
      for(var n in r.files){var up=await QX.store.upload('uploads',r.files[n],'forms');r.data[n]=up.path;}
      var hp=(form.querySelector('[name="qx_website"]')||{}).value||'';
      await QX.store.rpc('submit_form',{p_form:def.slug,p_data:r.data,p_lang:L(),p_hp:hp});
      if(def.redirect_url&&/^(https:\/\/|\/|[a-z0-9._-]+\.html)/i.test(def.redirect_url)){location.href=def.redirect_url;return;}
      form.reset();draw();
      statusEl.className='form-status is-success';statusEl.textContent=pick(def,'success');statusEl.focus();
    }catch(e){
      var t=String(e&&e.message||'');
      if(/rate_limited/.test(t)){statusEl.textContent=m('busy');}
      else{var mm=t.match(/(required|invalid|too_long|too_short):([a-z0-9_]+)/);if(mm){var o={};o[mm[2]]=m(mm[1]==='required'?'req':'bad');showErrors(form,o);statusEl.textContent=m('fix');}else statusEl.textContent=pick(def,'error');}
      statusEl.className='form-status is-error';statusEl.focus();
    }
    btn.disabled=false;btn.removeAttribute('aria-busy');btn.innerHTML=orig;
  });
}
function boot(){
  document.querySelectorAll('[data-qx-form]').forEach(function(host){
    var slug=host.getAttribute('data-qx-form');
    QX.store.rpc('get_form',{p_slug:slug}).then(function(def){
      if(!def||!def.fields||!def.fields.length)return;          /* disabled or missing: the static fallback stays */
      var form=host.tagName==='FORM'?host:(function(){var f=document.createElement('form');f.className='enquiry-form';host.appendChild(f);return f;})();
      var tt=document.querySelector('[data-qx-form-title]'),dd=document.querySelector('[data-qx-form-desc]');if(tt&&pick(def,'title'))tt.textContent=pick(def,'title');if(dd)dd.textContent=pick(def,'description');
      U.onLang(function(){if(tt&&pick(def,'title'))tt.textContent=pick(def,'title');if(dd)dd.textContent=pick(def,'description');});
      mount(form,def);
    }).catch(function(){});
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
