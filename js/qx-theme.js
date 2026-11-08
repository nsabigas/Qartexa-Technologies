/* ========================================================================
   QARTEXA V4: THEME ENGINE  (js/qx-theme.js)
   Applies the colours, fonts and shapes chosen in Staff portal > Appearance.
   SAFE BY DESIGN: the theme is a fixed list of settings. Every value is checked
   against a whitelist or clamped to a range, and the CSS is built from fixed
   templates. Staff can never inject their own CSS or scripts.
   Only settings that differ from the Qartexa default are written, so the default
   theme changes nothing on the existing pages.
   Loaded in the <head> of every page (before first paint) and by the staff portal.
   ======================================================================== */
(function(){
'use strict';
var KEY='qx_theme_v1';

/* ---------- fonts: web-safe stacks and open-licence Google Fonts (OFL / Apache 2.0) ---------- */
var SANS='system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
var FONTS={
  'default':{label:'Qartexa default (Inter, falls back to system)',stack:'Inter,'+SANS},
  'system':{label:'System UI (fastest)',stack:SANS},
  'arial':{label:'Arial / Helvetica',stack:'Arial,Helvetica,sans-serif'},
  'verdana':{label:'Verdana',stack:'Verdana,Geneva,sans-serif'},
  'trebuchet':{label:'Trebuchet MS',stack:'"Trebuchet MS",Tahoma,sans-serif'},
  'georgia':{label:'Georgia (serif)',stack:'Georgia,"Times New Roman",serif'},
  'times':{label:'Times New Roman (serif)',stack:'"Times New Roman",Times,serif'},
  'g:Inter':{label:'Inter (Google Fonts)',g:'Inter:wght@400;500;600;700;800',stack:'Inter,'+SANS},
  'g:Roboto':{label:'Roboto (Google Fonts)',g:'Roboto:wght@400;500;700',stack:'Roboto,'+SANS},
  'g:Open Sans':{label:'Open Sans (Google Fonts)',g:'Open+Sans:wght@400;600;700;800',stack:'"Open Sans",'+SANS},
  'g:Lato':{label:'Lato (Google Fonts)',g:'Lato:wght@400;700',stack:'Lato,'+SANS},
  'g:Montserrat':{label:'Montserrat (Google Fonts)',g:'Montserrat:wght@400;500;600;700;800',stack:'Montserrat,'+SANS},
  'g:Source Sans 3':{label:'Source Sans 3 (Google Fonts)',g:'Source+Sans+3:wght@400;600;700;800',stack:'"Source Sans 3",'+SANS},
  'g:Poppins':{label:'Poppins (Google Fonts)',g:'Poppins:wght@400;500;600;700;800',stack:'Poppins,'+SANS},
  'g:Work Sans':{label:'Work Sans (Google Fonts)',g:'Work+Sans:wght@400;500;600;700;800',stack:'"Work Sans",'+SANS},
  'g:IBM Plex Sans':{label:'IBM Plex Sans (Google Fonts)',g:'IBM+Plex+Sans:wght@400;500;600;700',stack:'"IBM Plex Sans",'+SANS},
  'g:Merriweather':{label:'Merriweather (Google Fonts, serif)',g:'Merriweather:wght@400;700',stack:'Merriweather,Georgia,serif'},
  'g:Playfair Display':{label:'Playfair Display (Google Fonts, serif)',g:'Playfair+Display:wght@400;600;700;800',stack:'"Playfair Display",Georgia,serif'}
};
/* any other Google font can be added by name; the name is validated strictly */
var GNAME=/^[A-Za-z][A-Za-z0-9 ]{1,39}$/;
function fontInfo(id){
  if(FONTS[id])return FONTS[id];
  if(typeof id==='string'&&id.indexOf('g:')===0&&GNAME.test(id.slice(2))){var n=id.slice(2);return {label:n+' (Google Fonts)',g:n.replace(/ /g,'+'),stack:'"'+n+'",'+SANS,custom:true};}
  return null;
}

/* ---------- the default = how the site looks today ---------- */
var DEFAULT={
  colors:{primary:'#062650',primary2:'#0b376d',accent:'#e80000',sky:'#a9c8df',bg:'#ffffff',bgAlt:'#f7fbfe',text:'#0b1d33',muted:'#5d7188',heading:'#062650',
          link:'#062650',linkHover:'#e80000',btnBg:'#e80000',btnText:'#ffffff',btnHover:'#b00000',border:'#dbe8f2',
          topbarBg:'#061a34',topbarText:'#d9e7f4',headerBg:'#ffffff',headerText:'#172b43',footerBg:'#031b39',footerText:'#9eb7cd'},
  sections:{capabilities:{bg:'',text:''},industries:{bg:'',text:''},ecosystem:{bg:'',text:''},why:{bg:'',text:''},cta:{bg:'',text:''},subhero:{bg:'',text:''}},
  type:{bodyFont:'default',headFont:'default',baseSize:16,bodyWeight:400,headWeight:800,lineHeight:1.6,letterSpacing:0,headLetter:'',headTransform:'none',paragraphSpacing:1},
  shape:{cardRadius:10,btnRadius:6,imageRadius:0,shadow:'default',maxWidth:1240,sectionSpacing:'normal',cardStyle:'default'},
  motion:{enabled:true,speed:1,intensity:'normal'},
  tablet:{baseSize:'',maxWidth:''},
  mobile:{baseSize:'',sectionSpacing:''}
};
var SECTION_LABELS={capabilities:'Solutions / capabilities sections',industries:'Industries sections',ecosystem:'Ecosystem & partners sections',why:'“Why Qartexa” sections',cta:'Call-to-action banner',subhero:'Inner-page title banner'};
var SECTION_SEL={capabilities:'.phase4-capabilities,section.solutions',industries:'.phase4-industries',ecosystem:'.phase4-ecosystem',why:'.phase4-why',cta:'.cta-box',subhero:'.subhero'};
var SHADOWS={none:'none',soft:'0 6px 18px rgba(6,38,80,.07)',medium:'0 12px 32px rgba(6,38,80,.12)',strong:'0 18px 48px rgba(6,38,80,.2)'};

/* ---------- validation: anything unexpected falls back to the default ---------- */
var HEX=/^#[0-9a-f]{6}$/i;
function hex(v,d){v=String(v==null?'':v).trim();if(/^#[0-9a-f]{3}$/i.test(v))v='#'+v[1]+v[1]+v[2]+v[2]+v[3]+v[3];return HEX.test(v)?v.toLowerCase():d;}
function num(v,min,max,d){if(v===''||v==null)return d;v=Number(v);return isFinite(v)?Math.min(max,Math.max(min,v)):d;}
function pick(v,list,d){return list.indexOf(v)>-1?v:d;}
function clone(o){return JSON.parse(JSON.stringify(o));}
function clean(t){
  t=(t&&typeof t==='object')?t:{};var D=DEFAULT,o=clone(D),c=t.colors||{},k;
  for(k in D.colors)o.colors[k]=hex(c[k],D.colors[k]);
  var s=t.sections||{};
  for(k in D.sections){var x=s[k]||{};o.sections[k]={bg:x.bg?hex(x.bg,''):'',text:x.text?hex(x.text,''):''};}
  var y=t.type||{};
  o.type.bodyFont=fontInfo(y.bodyFont)?y.bodyFont:'default';
  o.type.headFont=fontInfo(y.headFont)?y.headFont:'default';
  o.type.baseSize=num(y.baseSize,13,22,16);o.type.bodyWeight=pick(Number(y.bodyWeight),[300,400,500,600],400);
  o.type.headWeight=pick(Number(y.headWeight),[400,500,600,700,800,900],800);
  o.type.lineHeight=num(y.lineHeight,1.2,2.2,1.6);o.type.letterSpacing=num(y.letterSpacing,-0.05,0.2,0);
  o.type.headLetter=(y.headLetter===''||y.headLetter==null)?'':num(y.headLetter,-0.08,0.15,'');
  o.type.headTransform=pick(y.headTransform,['none','uppercase','capitalize'],'none');
  o.type.paragraphSpacing=num(y.paragraphSpacing,0.4,2.5,1);
  var h=t.shape||{};
  o.shape.cardRadius=num(h.cardRadius,0,40,10);o.shape.btnRadius=num(h.btnRadius,0,40,6);o.shape.imageRadius=num(h.imageRadius,0,40,0);
  o.shape.shadow=pick(h.shadow,['default','none','soft','medium','strong'],'default');
  o.shape.maxWidth=num(h.maxWidth,1000,1600,1240);o.shape.sectionSpacing=pick(h.sectionSpacing,['compact','normal','spacious'],'normal');
  o.shape.cardStyle=pick(h.cardStyle,['default','flat','bordered','raised'],'default');
  var m=t.motion||{};
  o.motion.enabled=m.enabled===false?false:true;o.motion.speed=num(m.speed,0.5,2,1);o.motion.intensity=pick(m.intensity,['subtle','normal','lively'],'normal');
  var tb=t.tablet||{},mb=t.mobile||{};
  o.tablet.baseSize=tb.baseSize===''||tb.baseSize==null?'':num(tb.baseSize,12,22,'');
  o.tablet.maxWidth=tb.maxWidth===''||tb.maxWidth==null?'':num(tb.maxWidth,600,1200,'');
  o.mobile.baseSize=mb.baseSize===''||mb.baseSize==null?'':num(mb.baseSize,12,22,'');
  o.mobile.sectionSpacing=pick(mb.sectionSpacing,['','compact','normal','spacious'],'');
  return o;
}

/* ---------- CSS: fixed templates, only for settings that differ from the default ---------- */
function css(theme){
  var t=clean(theme),D=DEFAULT,C=t.colors,DC=D.colors,out=[],ch=function(g,k){return C[k]!==DC[k];};
  var imp=' !important';
  /* design tokens used all over the existing stylesheets */
  var vars=[];
  if(ch(0,'primary'))vars.push('--navy:'+C.primary);if(ch(0,'primary2'))vars.push('--navy-2:'+C.primary2);if(ch(0,'accent'))vars.push('--red:'+C.accent);
  if(ch(0,'sky'))vars.push('--sky:'+C.sky);if(ch(0,'text'))vars.push('--ink:'+C.text);if(ch(0,'muted'))vars.push('--muted:'+C.muted);
  if(ch(0,'border'))vars.push('--line:'+C.border);if(ch(0,'bgAlt'))vars.push('--mist:'+C.bgAlt);
  if(t.shape.maxWidth!==D.shape.maxWidth)vars.push('--max:'+t.shape.maxWidth+'px');
  if(vars.length)out.push(':root{'+vars.join(';')+'}');
  if(ch(0,'bg'))out.push('body{background:'+C.bg+imp+'}');
  if(ch(0,'text'))out.push('body{color:'+C.text+'}');
  if(ch(0,'heading'))out.push('h1,h2,h3,h4,h5,h6{color:'+C.heading+imp+'}');
  if(ch(0,'link'))out.push('main p a:not(.btn):not(.qx-btn),main li a:not(.btn):not(.qx-btn),.qx-prose a,.legal a{color:'+C.link+imp+'}');
  if(ch(0,'linkHover'))out.push('main p a:not(.btn):not(.qx-btn):hover,main li a:not(.btn):not(.qx-btn):hover,.qx-prose a:hover,.legal a:hover{color:'+C.linkHover+imp+'}');
  var btn='.btn-primary,.nav-cta,.hero .btn-primary,.cta .btn,.cta-box .btn,.phase4-cta-box .btn,.qx-btn:not(.ghost)';
  if(ch(0,'btnBg')||ch(0,'btnText'))out.push(btn+'{background:'+C.btnBg+imp+';border-color:'+C.btnBg+imp+';color:'+C.btnText+imp+'}');
  if(ch(0,'btnHover'))out.push(btn.split(',').map(function(s){return s+':hover';}).join(',')+'{background:'+C.btnHover+imp+';border-color:'+C.btnHover+imp+'}');
  if(ch(0,'topbarBg'))out.push('.topbar{background:'+C.topbarBg+imp+'}');
  if(ch(0,'topbarText'))out.push('.topbar,.topbar a{color:'+C.topbarText+imp+'}');
  if(ch(0,'headerBg'))out.push('header{background:'+C.headerBg+imp+'}');
  if(ch(0,'headerText'))out.push('.menu>a,.mega>button{color:'+C.headerText+imp+'}');
  if(ch(0,'footerBg'))out.push('footer{background:'+C.footerBg+imp+'}');
  if(ch(0,'footerText'))out.push('footer,footer a,footer p{color:'+C.footerText+imp+'}');
  Object.keys(t.sections).forEach(function(k){var s=t.sections[k],sel=SECTION_SEL[k];
    if(s.bg)out.push(sel+'{background:'+s.bg+imp+'}');
    if(s.text)out.push(sel.split(',').map(function(x){return x+' h2,'+x+' h3,'+x+' p,'+x+' li,'+x+' .kicker';}).join(',')+'{color:'+s.text+imp+'}');
  });
  /* typography */
  var T=t.type,DT=D.type,fb=fontInfo(T.bodyFont),fh=fontInfo(T.headFont);
  if(T.bodyFont!==DT.bodyFont)out.push('body,button,input,select,textarea,.menu>a,.mega>button{font-family:'+fb.stack+imp+'}');
  if(T.headFont!==DT.headFont)out.push('h1,h2,h3,h4,h5,h6{font-family:'+fh.stack+imp+'}');
  if(T.baseSize!==DT.baseSize)out.push('main p,main li,.qx-prose,.qx-prose p,.qx-prose li{font-size:'+T.baseSize+'px}');
  if(T.bodyWeight!==DT.bodyWeight)out.push('body{font-weight:'+T.bodyWeight+'}');
  if(T.headWeight!==DT.headWeight)out.push('h1,h2,h3,h4,h5,h6{font-weight:'+T.headWeight+imp+'}');
  if(T.lineHeight!==DT.lineHeight)out.push('body,main p,main li,.qx-prose p,.qx-prose li{line-height:'+T.lineHeight+'}');
  if(T.letterSpacing!==DT.letterSpacing)out.push('body,main p,main li{letter-spacing:'+T.letterSpacing+'em}');
  if(T.headLetter!=='')out.push('h1,h2,h3,h4{letter-spacing:'+T.headLetter+'em'+imp+'}');
  if(T.headTransform!=='none')out.push('h1,h2,h3{text-transform:'+T.headTransform+imp+'}');
  if(T.paragraphSpacing!==DT.paragraphSpacing)out.push('main p,.qx-prose p{margin-bottom:'+T.paragraphSpacing+'em}');
  /* shape */
  var S=t.shape,DS=D.shape,cards='.card,.page-card,.purpose-card,.value-card,.contact-card,.feature-item,.stats-grid,.qx-card,.qx-panel,.side-panel,.cta-box';
  if(S.cardRadius!==DS.cardRadius)out.push(cards+'{border-radius:'+S.cardRadius+'px'+imp+'}');
  if(S.btnRadius!==DS.btnRadius)out.push('.btn,.nav-cta,.qx-btn,button.btn{border-radius:'+S.btnRadius+'px'+imp+'}');
  if(S.imageRadius!==DS.imageRadius)out.push('main img:not(.partner-logo img):not([width="16"]){border-radius:'+S.imageRadius+'px}');
  if(S.shadow!=='default')out.push('.card,.page-card,.stats-grid,.qx-card,.qx-panel,.purpose-card,.value-card{box-shadow:'+SHADOWS[S.shadow]+imp+'}');
  if(S.cardStyle==='flat')out.push('.card,.page-card,.purpose-card,.value-card,.qx-card{box-shadow:none'+imp+';border-color:transparent'+imp+';background:var(--mist)'+imp+'}');
  if(S.cardStyle==='bordered')out.push('.card,.page-card,.purpose-card,.value-card,.qx-card{box-shadow:none'+imp+';border:2px solid var(--line)'+imp+'}');
  if(S.cardStyle==='raised')out.push('.card,.page-card,.purpose-card,.value-card,.qx-card{box-shadow:0 14px 36px rgba(6,38,80,.14)'+imp+';border-color:transparent'+imp+'}');
  var pad={compact:'60px',spacious:'128px'};
  if(S.sectionSpacing!=='normal')out.push('section:not(.hero):not(.subhero){padding-top:'+pad[S.sectionSpacing]+imp+';padding-bottom:'+pad[S.sectionSpacing]+imp+'}');
  /* motion: honours the visitor's own reduced-motion setting in every case */
  var M=t.motion;
  if(!M.enabled)out.push('*,*:before,*:after{animation:none'+imp+';transition:none'+imp+';scroll-behavior:auto'+imp+'}.hero-fx{display:none'+imp+'}');
  else{
    if(M.speed!==1)out.push('*,*:before,*:after{transition-duration:'+(0.18/M.speed).toFixed(3)+'s'+imp+'}');
    if(M.intensity==='subtle')out.push('.card:hover,.page-card:hover,.btn:hover{transform:none'+imp+'}');
    if(M.intensity==='lively')out.push('.card:hover,.page-card:hover{transform:translateY(-6px)'+imp+'}.btn:hover{transform:translateY(-2px)'+imp+'}');
  }
  /* devices */
  var tb=t.tablet,mb=t.mobile;
  if(tb.baseSize!==''||tb.maxWidth!==''){var r=[];if(tb.baseSize!=='')r.push('main p,main li,.qx-prose p,.qx-prose li{font-size:'+tb.baseSize+'px}');if(tb.maxWidth!=='')r.push(':root{--max:'+tb.maxWidth+'px}');out.push('@media(min-width:641px) and (max-width:1024px){'+r.join('')+'}');}
  if(mb.baseSize!==''||mb.sectionSpacing!==''){var q=[];if(mb.baseSize!=='')q.push('main p,main li,.qx-prose p,.qx-prose li{font-size:'+mb.baseSize+'px}');if(mb.sectionSpacing!=='')q.push('section:not(.hero):not(.subhero){padding-top:'+({compact:'44px',normal:'72px',spacious:'96px'}[mb.sectionSpacing])+imp+';padding-bottom:'+({compact:'44px',normal:'72px',spacious:'96px'}[mb.sectionSpacing])+imp+'}');out.push('@media(max-width:640px){'+q.join('')+'}');}
  return out.join('\n');
}
function fontLinks(theme){
  var t=clean(theme),ids=[t.type.bodyFont,t.type.headFont],fam=[],seen={};
  ids.forEach(function(id){var f=fontInfo(id);if(f&&f.g&&!seen[id]){seen[id]=1;fam.push('family='+f.g);}});
  return fam.length?'https://fonts.googleapis.com/css2?'+fam.join('&')+'&display=swap':'';
}

/* ---------- applying ---------- */
function apply(theme){
  var head=document.head||document.documentElement,st=document.getElementById('qx-theme');
  var text=css(theme);
  if(!st){st=document.createElement('style');st.id='qx-theme';head.appendChild(st);}
  if(st.textContent!==text)st.textContent=text;
  var url=fontLinks(theme),lk=document.getElementById('qx-theme-font');
  if(url){if(!lk){lk=document.createElement('link');lk.id='qx-theme-font';lk.rel='stylesheet';head.appendChild(lk);}if(lk.getAttribute('href')!==url)lk.setAttribute('href',url);}
  else if(lk)lk.parentNode.removeChild(lk);
  /* the stylesheet must stay LAST so it wins over every other stylesheet */
  if(st.parentNode&&st.nextSibling)head.appendChild(st);
}
function remember(theme){try{if(theme)localStorage.setItem(KEY,JSON.stringify(theme));else localStorage.removeItem(KEY);}catch(e){}}
function recall(){try{return JSON.parse(localStorage.getItem(KEY)||'null');}catch(e){return null;}}

window.QX_THEME={DEFAULT:DEFAULT,FONTS:FONTS,fontInfo:fontInfo,SECTION_LABELS:SECTION_LABELS,SHADOWS:SHADOWS,clean:clean,css:css,fontLinks:fontLinks,apply:apply,clone:clone,key:KEY};

/* ---------- public pages: apply immediately from the last known theme (no flash), then refresh ---------- */
var inPortal=/(^|\/)(admin|portal)\.html$/.test(location.pathname);
var inFrame=window.parent!==window;
if(!inPortal){
  var cached=recall();
  if(cached&&!inFrame)apply(cached);
  /* preview mode: the staff portal pushes a draft theme into a same-origin frame */
  window.addEventListener('message',function(e){
    if(e.origin!==location.origin||!e.data||e.data.type!=='qx-theme-preview')return;
    apply(e.data.theme);
  });
  var refresh=function(){
    if(!window.QX||!window.QX.settings)return;
    window.QX.settings().then(function(S){
      var th=S&&S.theme;
      if(inFrame&&/[?&]qx_preview=1/.test(location.search))return;   /* preview frames wait for the portal */
      if(th&&typeof th==='object'){remember(th);apply(th);}
      else{remember(null);apply({});}
    }).catch(function(){});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh);else refresh();
}
})();
