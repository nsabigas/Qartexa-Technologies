/* ========================================================================
   QARTEXA V2: STAFF LOGIN  (js/qx-portal.js)
   Sign-in, password reset and "set new password" for staff.
   Only people listed in the database "admins" table can open admin.html.
   ======================================================================== */
(function(){
'use strict';
const QX=window.QX,E=QX.util.esc;
const box=document.getElementById('qp-box');
const fr=()=>QX.util.lang()==='fr';
const tx=(en,f)=>fr()?f:en;
const msg=(m,ok)=>'<div class="qx-status '+(ok?'ok':'err')+'" role="alert">'+E(m)+'</div>';

async function start(){
  const hash=new URLSearchParams(location.hash.replace(/^#/,''));
  if(hash.get('type')==='recovery'&&hash.get('access_token')){return newPassword(hash.get('access_token'));}
  if(QX.mode==='none'){
    box.innerHTML='<h2>'+E(tx('Staff portal','Espace du personnel'))+'</h2><div class="qx-status err">'+E(tx('The website is not connected to its database yet. Follow docs/SETUP-GUIDE.md, then paste the project URL and key into js/qx-config.js.','Le site n’est pas encore connecté à sa base de données. Suivez docs/SETUP-GUIDE.md puis collez l’URL et la clé du projet dans js/qx-config.js.'))+'</div>';return;
  }
  if(QX.auth.session()&&await QX.auth.isAdmin()){location.replace('admin.html');return;}
  loginForm();
}
function loginForm(note){
  box.innerHTML='<h2>'+E(tx('Staff sign in','Connexion du personnel'))+'</h2><p class="qp-sub">'+E(tx('Authorised Qartexa staff only.','Réservé au personnel autorisé de Qartexa.'))+'</p>'+
   (QX.mode==='demo'?'<div class="qx-status ok" style="margin-bottom:16px"><strong>Demo mode</strong><br>'+E(tx('Not connected to a real database. Try it with:','Non connecté à une vraie base de données. Essayez avec :'))+'<br><code>admin@demo.local</code> / <code>demo1234</code></div>':'')+
   (note||'')+
   '<form id="qp-form" novalidate><div class="qx-field"><label for="qp-email">'+E(tx('Email','E-mail'))+'</label><input id="qp-email" type="email" autocomplete="username" required></div>'+
   '<div class="qx-field"><label for="qp-pass">'+E(tx('Password','Mot de passe'))+'</label><input id="qp-pass" type="password" autocomplete="current-password" required></div>'+
   '<button class="qx-btn" type="submit" style="width:100%">'+E(tx('Sign in','Se connecter'))+'</button><div id="qp-msg" aria-live="polite"></div></form>'+
   (QX.mode==='supabase'?'<p class="qp-foot"><a href="#" id="qp-forgot">'+E(tx('Forgot your password?','Mot de passe oublié ?'))+'</a></p>':'')+
   '<p class="qp-foot"><a href="index.html">← '+E(tx('Back to the website','Retour au site'))+'</a></p>';
  const f=document.getElementById('qp-form'),m=document.getElementById('qp-msg');
  f.addEventListener('submit',async ev=>{
    ev.preventDefault();const em=f['qp-email'].value.trim(),pw=f['qp-pass'].value;
    if(!em||!pw){m.innerHTML=msg(tx('Enter your email and password.','Saisissez votre e-mail et votre mot de passe.'));return;}
    const b=f.querySelector('button');b.disabled=true;m.innerHTML='';
    try{
      await QX.auth.signIn(em,pw);
      if(!await QX.auth.isAdmin()){await QX.auth.signOut();throw new Error(tx('This account is not authorised for the staff portal.','Ce compte n’est pas autorisé à accéder à l’espace du personnel.'));}
      location.replace('admin.html');
    }catch(e){m.innerHTML=msg(/Invalid login|invalid_grant|credentials/i.test(e.message)?tx('Wrong email or password.','E-mail ou mot de passe incorrect.'):e.message);b.disabled=false;}
  });
  const fg=document.getElementById('qp-forgot');
  if(fg)fg.addEventListener('click',async ev=>{ev.preventDefault();const em=f['qp-email'].value.trim();if(!em){m.innerHTML=msg(tx('Type your email above first.','Saisissez d’abord votre e-mail ci-dessus.'));return;}
    try{await QX.auth.recover(em);m.innerHTML=msg(tx('If this email belongs to a staff account, a reset link has been sent.','Si cet e-mail correspond à un compte du personnel, un lien de réinitialisation a été envoyé.'),true);}catch(e){m.innerHTML=msg(tx('Could not send the reset email.','Impossible d’envoyer l’e-mail de réinitialisation.'));}});
}
function newPassword(token){
  box.innerHTML='<h2>'+E(tx('Set a new password','Définir un nouveau mot de passe'))+'</h2><form id="qp-new" novalidate><div class="qx-field"><label for="np1">'+E(tx('New password (min. 10 characters)','Nouveau mot de passe (10 caractères min.)'))+'</label><input id="np1" type="password" autocomplete="new-password" required></div><button class="qx-btn" type="submit" style="width:100%">'+E(tx('Save password','Enregistrer'))+'</button><div id="qp-msg" aria-live="polite"></div></form>';
  const f=document.getElementById('qp-new'),m=document.getElementById('qp-msg');
  f.addEventListener('submit',async ev=>{ev.preventDefault();const p=f.np1.value;if(p.length<10){m.innerHTML=msg(tx('Use at least 10 characters.','Utilisez au moins 10 caractères.'));return;}
    try{await QX.auth.setPassword(p,token);history.replaceState(null,'',location.pathname);loginForm(msg(tx('Password updated. Please sign in.','Mot de passe mis à jour. Veuillez vous connecter.'),true));}catch(e){m.innerHTML=msg(e.message);}});
}
start();
QX.util.onLang(()=>{if(document.getElementById('qp-form'))loginForm();});
})();
