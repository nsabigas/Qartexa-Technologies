/* ========================================================================
   QARTEXA V5: IMAGE ENGINE  (js/qx-media.js)  Staff portal only.
   Everything happens in the staff member's browser, so no image server is needed:
   validate, rotate, crop, resize, compress, make several sizes in WebP (+AVIF where
   the browser can write it, + one JPEG fallback), then upload with progress.
   ======================================================================== */
(function(){
'use strict';
var WIDTHS=[400,800,1280,1920];                 /* 400 = thumbnail; the others are served by screen size */
var MAX_INPUT=25*1024*1024,MAX_FILE=4900*1024,MAX_PIXELS=60e6,TYPES={'image/jpeg':1,'image/png':1,'image/webp':1,'image/avif':1};
var avifOk=null;

function validate(file){
  if(!file)return 'Choose an image file.';
  if(!TYPES[file.type])return '“'+file.name+'” is not supported. Use JPG, PNG, WebP or AVIF.';
  if(file.size>MAX_INPUT)return '“'+file.name+'” is '+(file.size/1048576).toFixed(1)+' MB. The limit is 25 MB.';
  if(file.size<200)return '“'+file.name+'” looks empty or damaged.';
  return null;
}
async function decode(file){
  var err=validate(file);if(err)throw new Error(err);
  try{var bm=await createImageBitmap(file,{imageOrientation:'from-image'});}catch(e){throw new Error('“'+file.name+'” could not be read. The file may be damaged.');}
  if(bm.width*bm.height>MAX_PIXELS){bm.close&&bm.close();throw new Error('“'+file.name+'” is too large ('+bm.width+'×'+bm.height+' px). Maximum is 60 megapixels.');}
  if(bm.width<200||bm.height<100){bm.close&&bm.close();throw new Error('“'+file.name+'” is too small ('+bm.width+'×'+bm.height+' px). Use an image at least 200×100 px; hero photos should be 1920 px wide or more.');}
  return bm;
}
function canvas(w,h){var c=document.createElement('canvas');c.width=Math.max(1,Math.round(w));c.height=Math.max(1,Math.round(h));return c;}
/* rotate by 0/90/180/270 degrees */
function rotated(src,deg){
  deg=((deg%360)+360)%360;if(!deg)return src;
  var sw=src.width,sh=src.height,swap=deg===90||deg===270,c=canvas(swap?sh:sw,swap?sw:sh),x=c.getContext('2d');
  x.translate(c.width/2,c.height/2);x.rotate(deg*Math.PI/180);x.drawImage(src,-sw/2,-sh/2);return c;
}
/* crop rectangle from an aspect ratio (0 = free), zoom (1..5) and centre point (0..1) */
function cropRect(w,h,aspect,zoom,cx,cy){
  var rw=w,rh=h;
  if(aspect){if(w/h>aspect){rh=h;rw=h*aspect;}else{rw=w;rh=w/aspect;}}
  rw/=zoom||1;rh/=zoom||1;
  var x=Math.max(0,Math.min(w-rw,cx*w-rw/2)),y=Math.max(0,Math.min(h-rh,cy*h-rh/2));
  return {x:Math.round(x),y:Math.round(y),w:Math.round(rw),h:Math.round(rh)};
}
/* high-quality shrink in steps (one big jump looks rough) */
function shrink(src,tw){
  var cur=src;while(cur.width/2>=tw){var c=canvas(cur.width/2,cur.height/2),x=c.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(cur,0,0,c.width,c.height);cur=c;}
  var th=Math.round(cur.height*tw/cur.width),f=canvas(tw,th),g=f.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(cur,0,0,f.width,f.height);return f;
}
function toBlob(c,type,q){return new Promise(function(res){c.toBlob(function(b){res(b);},type,q);});}
async function supportsAvif(){
  if(avifOk!==null)return avifOk;
  try{var b=await toBlob(canvas(8,8),'image/avif',.5);avifOk=!!(b&&b.type==='image/avif');}catch(e){avifOk=false;}return avifOk;
}
async function encode(c,fmt){
  var type={webp:'image/webp',avif:'image/avif',jpg:'image/jpeg'}[fmt],q={webp:.82,avif:.55,jpg:.85}[fmt],b;
  if(fmt==='jpg'){var f=canvas(c.width,c.height),x=f.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,f.width,f.height);x.drawImage(c,0,0);c=f;}
  for(var i=0;i<6;i++){b=await toBlob(c,type,q);if(!b||b.type!==type)return null;if(b.size<=MAX_FILE)return b;q-=.12;}
  return b&&b.size<=MAX_FILE?b:null;
}
/* t = {rotate, crop:{x,y,w,h} (on the rotated image), maxWidth} */
async function base(bitmap,t){
  t=t||{};var r=rotated(bitmap,t.rotate||0),cr=t.crop||{x:0,y:0,w:r.width,h:r.height};
  var c=canvas(cr.w,cr.h);c.getContext('2d').drawImage(r,cr.x,cr.y,cr.w,cr.h,0,0,cr.w,cr.h);
  var max=Math.min(t.maxWidth||1920,1920);if(c.width>max)c=shrink(c,max);return c;
}
async function build(bitmap,t,onStep){
  var c=await base(bitmap,t),ws=WIDTHS.filter(function(w){return w<c.width;});
  ws.push(c.width);ws=ws.filter(function(w,i){return ws.indexOf(w)===i;}).sort(function(a,b){return a-b;});
  var useAvif=await supportsAvif(),out=[],step=0,total=ws.length*(useAvif?2:1)+1;
  var fb=ws.filter(function(w){return w<=1280;}).pop()||ws[0];
  for(var i=0;i<ws.length;i++){
    var w=ws[i],cv=w===c.width?c:shrink(c,w);
    var fmts=['webp'].concat(useAvif?['avif']:[]).concat(w===fb?['jpg']:[]);
    for(var j=0;j<fmts.length;j++){var b=await encode(cv,fmts[j]);if(b)out.push({w:cv.width,h:cv.height,fmt:fmts[j],blob:b,bytes:b.size});onStep&&onStep(++step,total);}
  }
  if(!out.some(function(v){return v.fmt==='webp';}))throw new Error('This browser could not create WebP images. Try a current version of Chrome, Edge, Firefox or Safari.');
  return {width:c.width,height:c.height,variants:out};
}
function upload(blob,path,onProgress){
  var C=window.QX.config,s=window.QX.auth.session();
  return new Promise(function(res,rej){
    if(!s)return rej(new Error('Your session has ended. Please sign in again.'));
    var x=new XMLHttpRequest();x.open('POST',C.supabaseUrl+'/storage/v1/object/media/'+path.split('/').map(encodeURIComponent).join('/'));
    x.setRequestHeader('apikey',C.supabaseAnonKey);x.setRequestHeader('Authorization','Bearer '+s.access_token);x.setRequestHeader('Content-Type',blob.type);x.setRequestHeader('x-upsert','true');
    x.upload.onprogress=function(e){if(e.lengthComputable&&onProgress)onProgress(e.loaded,e.total);};
    x.onload=function(){if(x.status>=200&&x.status<300)res(path);else{var m='';try{m=JSON.parse(x.responseText).message||JSON.parse(x.responseText).error||'';}catch(e){}rej(new Error(x.status===413?'The file is too large for storage.':x.status===403||x.status===401?'You do not have permission to upload images.':('Upload failed'+(m?': '+m:' ('+x.status+')'))));}};
    x.onerror=function(){rej(new Error('The network connection failed during upload. Check your internet and try again.'));};
    x.send(blob);
  });
}
async function removeFiles(paths){
  if(!paths.length)return;var C=window.QX.config,s=window.QX.auth.session();
  try{await fetch(C.supabaseUrl+'/storage/v1/object/media',{method:'DELETE',headers:{apikey:C.supabaseAnonKey,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'},body:JSON.stringify({prefixes:paths})});}catch(e){}
}
function fmtBytes(n){return n<1024?n+' B':n<1048576?(n/1024).toFixed(0)+' KB':(n/1048576).toFixed(1)+' MB';}
window.QXM={WIDTHS:WIDTHS,validate:validate,decode:decode,rotated:rotated,cropRect:cropRect,build:build,upload:upload,removeFiles:removeFiles,fmtBytes:fmtBytes,supportsAvif:supportsAvif,MAX_FILE:MAX_FILE};
})();
