#!/usr/bin/env python3
"""Database tests for supabase/migration-v5.sql (media library, hero slots)."""
import subprocess, json, sys, os, tempfile
def psql(sql):
    with tempfile.NamedTemporaryFile('w',suffix='.sql',delete=False) as f: f.write(sql); p=f.name
    os.chmod(p,0o644)
    r=subprocess.run(['su','postgres','-c',f'psql -h /tmp -p 5433 -U postgres -d qx -At -q -v ON_ERROR_STOP=1 -f {p}'],capture_output=True,text=True); os.unlink(p)
    return (r.stdout+r.stderr).strip().replace('\n',' ')
def run(role,uid,sql):
    return psql(f"set role {role};\nselect set_config('request.jwt.claim.sub','{uid}',false) \\gset\nselect set_config('request.headers','{{\"x-forwarded-for\":\"1.1.1.1\"}}',false) \\gset\n"+sql)
P=F=0
def expect(n,w,g):
    global P,F
    if w in g: P+=1; print('PASS ',n)
    else: F+=1; print('FAIL ',n,'| expected',repr(w),'| got',repr(g))
U=lambda i:f'00000000-0000-0000-0000-00000000000{i}'
SUPER,ADMIN,HR,CONT,EDIT=U(1),U(2),U(3),U(4),U(5)
A=lambda uid,s:run('authenticated',uid,s); V=lambda s:run('anon','',s)
psql("""delete from public.page_heroes; delete from public.page_heroes_draft; delete from public.media;
insert into auth.users(id,email) values ('%s','s@x'),('%s','a@x'),('%s','h@x'),('%s','c@x'),('%s','e@x') on conflict do nothing;
insert into public.staff(user_id,email,role) values ('%s','s@x','super_admin'),('%s','a@x','admin'),('%s','h@x','hr'),('%s','c@x','content'),('%s','e@x','editor') on conflict (user_id) do update set role=excluded.role, active=true;"""%((SUPER,ADMIN,HR,CONT,EDIT)*2))
M1='11111111-1111-1111-1111-111111111111'; M2='22222222-2222-2222-2222-222222222222'
ins=lambda i,extra='':f"insert into public.media(id,title,width,height,base,variants) values ('{i}','T',1600,900,'library/{i}','[]'){extra};"
print('== MEDIA LIBRARY ==')
expect('content manager can add media','',A(CONT,ins(M1)))
expect('editor can add media','',A(EDIT,ins(M2)))
expect('HR cannot add media','row-level security',A(HR,ins('33333333-3333-3333-3333-333333333333')))
expect('visitors can read media metadata (images are public)','2',V("select count(*) from public.media;"))
expect('visitors cannot write media','permission denied',V(ins('44444444-4444-4444-4444-444444444444')))
expect('storage path must follow the library pattern','violates check constraint',A(CONT,"insert into public.media(title,width,height,base) values ('x',10,10,'../../etc/passwd');"))
expect('absurd dimensions rejected','violates check constraint',A(CONT,"insert into public.media(title,width,height,base) values ('x',99999,10,'library/55555555-5555-5555-5555-555555555555');"))
print('== HERO CONFIG VALIDATION ==')
ok_cfg=lambda **k:json.dumps({**{"media":{"desktop":M1},"focal":{"x":40,"y":60},"overlay":{"color":"#062650","opacity":0.5},"height":{"mode":"tall"},"text":"light","zoom":True,"alt_en":"Server room"},**k})
d=lambda cfg,key='home':f"insert into public.page_heroes_draft(page_key,config) values ('{key}',$j${cfg}$j$::jsonb) on conflict (page_key) do update set config=excluded.config;"
expect('valid draft saved','',A(CONT,d(ok_cfg())))
for name,cfg,msg in [
 ('missing desktop image',json.dumps({"media":{}}),'desktop image is required'),
 ('unknown setting (no arbitrary data)',ok_cfg(css="body{display:none}"),'unknown setting'),
 ('overlay colour that is not a hex code',ok_cfg(overlay={"color":"red;}body{x:y","opacity":.5}),'invalid overlay'),
 ('overlay opacity above 1',ok_cfg(overlay={"color":"#000000","opacity":2}),'invalid overlay'),
 ('image that is not in the library',ok_cfg(media={"desktop":"99999999-9999-9999-9999-999999999999"}),'not found in the library'),
 ('script-like image id',ok_cfg(media={"desktop":"<script>"}),'not found in the library'),
 ('focal point outside the image',ok_cfg(focal={"x":150,"y":10}),'focal point'),
 ('custom height too small',ok_cfg(height={"mode":"custom","px":50}),'custom height'),
 ('unknown height mode',ok_cfg(height={"mode":"huge"}),'invalid height'),
 ('text colour other than light/dark',ok_cfg(text="red"),'invalid text colour'),
 ('over-long alt text',ok_cfg(alt_en="x"*300),'alt text too long')]:
    expect(name+' is refused',msg,A(CONT,d(cfg,'bad')))
expect('page key with odd characters refused','violates check constraint',A(CONT,d(ok_cfg(),'bad key!')))
print('== DRAFT / PUBLISH / RESTORE ==')
expect('visitors cannot see drafts','permission denied',V("select * from public.page_heroes_draft;"))
expect('nothing is public before publishing','0',V("select count(*) from public.page_heroes;"))
expect('HR cannot publish','not allowed',A(HR,"select public.publish_hero('home');"))
expect('visitors cannot publish','permission denied',V("select public.publish_hero('home');"))
expect('content manager can publish','',A(CONT,"select public.publish_hero('home');"))
expect('after publish: live, draft consumed','1|0',V("select count(*) from public.page_heroes;")+'|'+A(CONT,"select count(*) from public.page_heroes_draft;"))
expect('first publish has no previous version','',psql("select coalesce(previous::text,'') from public.page_heroes where page_key='home';"))
expect('restore with nothing before it is refused','no previous version',A(CONT,"select public.restore_hero('home');"))
A(EDIT,d(ok_cfg(media={"desktop":M2},overlay={"color":"#000000","opacity":0.3}),'home')); A(EDIT,"select public.publish_hero('home');")
expect('second publish keeps the earlier version as previous',M1,psql("select previous::text from public.page_heroes where page_key='home';"))
expect('live config is the new one',M2,V("select config::text from public.page_heroes where page_key='home';"))
A(EDIT,"select public.restore_hero('home');")
expect('restore previous brings the old image back',M1,V("select config::text from public.page_heroes where page_key='home';"))
expect('and the replaced version becomes the new previous',M2,psql("select previous::text from public.page_heroes where page_key='home';"))
expect('visitor cannot edit live heroes directly','permission denied',V("update public.page_heroes set config='{}';"))
expect('HR cannot write heroes directly','row-level security',A(HR,"insert into public.page_heroes(page_key,config) values ('x',$j$"+ok_cfg()+"$j$::jsonb);"))
expect('direct write to live heroes is validated too','unknown setting',A(CONT,"update public.page_heroes set config=config||'{\"evil\":1}'::jsonb where page_key='home';"))
print('== USAGE CHECK / SAFE DELETE ==')
expect('usage lists the hero that uses the image','home',A(CONT,f"select public.media_usage('{M1}');"))
expect('an in-use image cannot be deleted (database enforces it)','still used in',A(CONT,f"delete from public.media where id='{M1}';"))
expect('a draft also counts as use','still used in',(A(CONT,d(ok_cfg(media={"desktop":M2}),'about')),A(CONT,f"delete from public.media where id='{M2}';"))[1])
expect('HR cannot see usage details','not allowed',A(HR,f"select public.media_usage('{M1}');"))
A(CONT,"select public.remove_hero('home'); select public.remove_hero('about');")
expect('after removing the heroes, the image can be deleted','',A(CONT,f"delete from public.media where id='{M1}';"))
expect('remove_hero returns a page to its built-in banner','0',V("select count(*) from public.page_heroes;"))
expect('image used by an edited page image is protected too','still used in',(psql(f"insert into public.cms_overrides(key,page,data) values ('i.test','index','{{\"src\":\"library/{M2}/800.webp\"}}') on conflict (key) do update set data=excluded.data;"),A(CONT,f"delete from public.media where id='{M2}';"))[1])
print('== ACTIVITY LOG ==')
expect('hero publishing is logged with the person','c@x',A(ADMIN,"select string_agg(distinct actor_email,',') from public.activity_log where table_name='page_heroes';"))
print(f'\nRESULT: {P} passed, {F} failed'); sys.exit(1 if F else 0)
