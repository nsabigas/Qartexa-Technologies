// Test-only stand-in for Supabase: static site + JWT login + REST proxy to real PostgREST + tiny storage.
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=process.env.SITE||'/home/claude/work',SECRET='test-secret-test-secret-test-secret-1234',PORT=8080;
const b64=o=>Buffer.from(typeof o==='string'?o:JSON.stringify(o)).toString('base64url');
const sign=p=>{const h=b64({alg:'HS256',typ:'JWT'}),bd=b64(p),s=crypto.createHmac('sha256',SECRET).update(h+'.'+bd).digest('base64url');return h+'.'+bd+'.'+s;};
const ANON=sign({role:'anon',iss:'test',exp:4102444800});
const USERS={};for(const [n,id] of [['super',1],['admin',2],['hr',3],['content',4],['editor',5]])USERS[n+'@qartexa.test']={id:'00000000-0000-0000-0000-00000000000'+id,pw:'Passw0rd!test'};
const files={};
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.xml':'text/xml','.txt':'text/plain','.json':'application/json','.pdf':'application/pdf','.woff2':'font/woff2'};
http.createServer((req,res)=>{
  const u=new URL(req.url,'http://x');
  if(u.pathname==='/js/qx-config.js'){res.writeHead(200,{'Content-Type':'application/javascript'});return res.end("window.QX_CONFIG={supabaseUrl:'http://localhost:"+PORT+"',supabaseAnonKey:'"+ANON+"',demo:false};");}
  if(u.pathname.startsWith('/rest/v1/')){
    const chunks=[];req.on('data',c=>chunks.push(c));req.on('end',()=>{
      const h={...req.headers};delete h.host;delete h['content-length'];h['x-forwarded-for']=req.headers['x-test-ip']||'127.0.0.1';
      const body=Buffer.concat(chunks);
      const p=http.request({host:'127.0.0.1',port:3000,path:u.pathname.replace('/rest/v1','')+u.search,method:req.method,headers:{...h,'content-length':body.length}},r=>{res.writeHead(r.statusCode,r.headers);r.pipe(res);});
      p.on('error',e=>{res.writeHead(502);res.end(String(e));});p.end(body);});return;}
  if(u.pathname==='/auth/v1/user'&&req.method==='PUT'){const ch=[];req.on('data',c=>ch.push(c));req.on('end',()=>{global.lastUserPut=Buffer.concat(ch).toString();res.writeHead(200,{'Content-Type':'application/json'});res.end('{}');});return;}
  if(u.pathname==='/__lastput'){res.writeHead(200);return res.end(global.lastUserPut||'');}
  if(u.pathname==='/auth/v1/token'){
    const chunks=[];req.on('data',c=>chunks.push(c));req.on('end',()=>{let j={};try{j=JSON.parse(Buffer.concat(chunks))}catch(e){}
      const us=USERS[String(j.email||'').toLowerCase()];
      if(!us||us.pw!==j.password){res.writeHead(400,{'Content-Type':'application/json'});return res.end(JSON.stringify({error_description:'Invalid login credentials'}));}
      const exp=Math.floor(Date.now()/1000)+3600;
      res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({access_token:sign({role:'authenticated',sub:us.id,email:j.email,aud:'authenticated',exp:exp}),refresh_token:'r',expires_in:3600,expires_at:exp,user:{id:us.id,email:j.email}}));});return;}
  if(u.pathname.startsWith('/storage/v1/object/')){
    const rest=u.pathname.replace('/storage/v1/object/','');
    if(req.method==='DELETE'&&rest==='media'){const ch=[];req.on('data',c=>ch.push(c));req.on('end',()=>{let j={};try{j=JSON.parse(Buffer.concat(ch))}catch(e){}(j.prefixes||[]).forEach(p=>delete files['media/'+p]);res.writeHead(200,{'Content-Type':'application/json'});res.end('[]');});return;}
    if(req.method==='POST'){const chunks=[];req.on('data',c=>chunks.push(c));req.on('end',()=>{
      if(rest.startsWith('sign/')){res.writeHead(200,{'Content-Type':'application/json'});return res.end(JSON.stringify({signedURL:'/object/'+rest+'?token=t'}));}
      const buf=Buffer.concat(chunks);
      if(buf.length>5*1024*1024){res.writeHead(413,{'Content-Type':'application/json'});return res.end('{"message":"too large"}');}
      files[decodeURIComponent(rest)]={buf:buf,type:req.headers['content-type']||'application/octet-stream'};res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({Key:rest}));});return;}
    const k=decodeURIComponent(rest).replace(/^sign\//,'').replace(/^public\//,'');const f=files[k];if(f){res.writeHead(200,{'Content-Type':f.type,'Cache-Control':'public, max-age=3600'});return res.end(f.buf);}res.writeHead(404);return res.end('nf');}
  if(u.pathname==='/__files'){res.writeHead(200,{'Content-Type':'application/json'});return res.end(JSON.stringify(Object.keys(files)));}
  let p=decodeURIComponent(u.pathname);if(p.endsWith('/'))p+='index.html';
  const fp=path.join(ROOT,p);if(!fp.startsWith(ROOT)||!fs.existsSync(fp)||fs.statSync(fp).isDirectory()){res.writeHead(404,{'Content-Type':'text/html'});return res.end('404');}
  res.writeHead(200,{'Content-Type':mime[path.extname(fp)]||'application/octet-stream'});fs.createReadStream(fp).pipe(res);
}).listen(PORT,()=>console.log('test server on',PORT));
