#!/usr/bin/env python3
"""Database security tests for supabase/migration-v4.sql.
Runs against a local PostgreSQL that has Supabase-style stub schemas (see README.md).
Every test impersonates a role (anon / authenticated + a user id) exactly like PostgREST does."""
import subprocess, json, sys, os, tempfile
HOST=os.environ.get('PGHOST','/tmp'); PORT=os.environ.get('PGPORT','5433'); DB=os.environ.get('PGDATABASE','qx')
def psql(sql, as_postgres=True):
    with tempfile.NamedTemporaryFile('w',suffix='.sql',delete=False) as f: f.write(sql); p=f.name
    os.chmod(p,0o644)
    r=subprocess.run(['su','postgres','-c',f'psql -h {HOST} -p {PORT} -U postgres -d {DB} -At -q -v ON_ERROR_STOP=1 -f {p}'],capture_output=True,text=True)
    os.unlink(p); return (r.stdout+r.stderr).strip().replace('\n',' ')
def run(role, uid, sql, ip='1.1.1.1'):
    hdr=json.dumps({'x-forwarded-for':ip})
    pre=f"set role {role};\nselect set_config('request.jwt.claim.sub','{uid}',false) \\gset\nselect set_config('request.headers',$h${hdr}$h$,false) \\gset\n"
    return psql(pre+sql)
P=F=0
def expect(name, want, got):
    global P,F
    if want in got: P+=1; print('PASS ',name)
    else: F+=1; print('FAIL ',name,'| expected',repr(want),'| got',repr(got))
SUPER,ADMIN,HR,CONT,EDIT,PLAIN=[f'00000000-0000-0000-0000-00000000000{i}' for i in range(1,7)]
A=lambda uid,sql,ip='1.1.1.1': run('authenticated',uid,sql,ip)
V=lambda sql,ip='1.1.1.1': run('anon','',sql,ip)

psql("delete from public.form_fields where name in ('budget','seats','code'); update public.form_fields set label_en='Full name' where name='name'; update public.forms set recipients='{}', ack_enabled=false, enabled=true; update public.social_links set visible=true; delete from public.posts; delete from public.jobs; delete from public.tenders;")
psql("truncate public.staff, public.jobs, public.tenders, public.posts, public.applications, public.form_submissions, public.email_outbox, public.activity_log, public.site_settings, auth.users cascade;")
psql(f"""insert into auth.users(id,email) values ('{SUPER}','s@x'),('{ADMIN}','a@x'),('{HR}','h@x'),('{CONT}','c@x'),('{EDIT}','e@x'),('{PLAIN}','p@x');
insert into public.staff(user_id,email,role) values ('{SUPER}','s@x','super_admin'),('{ADMIN}','a@x','admin'),('{HR}','h@x','hr'),('{CONT}','c@x','content'),('{EDIT}','e@x','editor');
insert into public.jobs(slug,title_en,status,closing_at) values ('open-future','Open future','open',now()+interval '2 days'),('open-expired','Open but expired','open',now()-interval '1 minute'),('draft-job','Draft','draft',null),('no-deadline','No deadline','open',null);
insert into public.tenders(slug,title_en,status,closing_at,show_in_history) values ('t-open','T open','open',now()+interval '3 days',false),('t-exp','T expired','open',now()-interval '1 hour',false),('t-hist','T history','closed',now()-interval '9 days',true),('t-closed','T closed private','closed',now()-interval '9 days',false);
insert into public.posts(slug,title_en,status,published_at) values ('p-now','Now','published',now()-interval '1 hour'),('p-future','Future','scheduled',now()+interval '1 day'),('p-future-pub','Future marked published','published',now()+interval '1 day'),('p-arch','Arch','archived',now()-interval '1 day'),('p-draft','Draft','draft',null);
insert into public.site_settings(key,value) values ('theme','{{"a":1}}'),('theme_draft','{{"a":2}}');""")

print('== EXPIRY (evaluated at query time; table status still says open) ==')
expect('visitor sees only unexpired open jobs','no-deadline open-future',V("select string_agg(slug,' ' order by slug) from public.jobs;"))
expect('expired-but-still-"open" job hidden from visitors','0',V("select count(*) from public.jobs where slug='open-expired';"))
expect('draft job hidden from visitors','0',V("select count(*) from public.jobs where slug='draft-job';"))
expect('HR sees all 4 jobs incl. expired and draft','4',A(HR,"select count(*) from public.jobs;"))
expect('old job link reports state=closed','"state": "closed"',V("select public.item_state('job','open-expired');"))
expect('open job link reports state=open','"state": "open"',V("select public.item_state('job','open-future');"))
expect('draft job link reveals nothing','',V("select coalesce(public.item_state('job','draft-job')::text,'');"))
expect('open tender listed, expired "open" tender not','t-open',V("select string_agg(slug,' ' order by slug) from public.tenders where status='open';"))
expect('expired open tender hidden','0',V("select count(*) from public.tenders where slug='t-exp';"))
expect('past tender visible ONLY when history enabled','1',V("select count(*) from public.tenders where slug='t-hist';"))
expect('closed tender without history flag hidden','0',V("select count(*) from public.tenders where slug='t-closed';"))
expect('visitor cannot UPDATE jobs','permission denied',V("update public.jobs set title_en='hacked';"))
expect('expired tender link reports closed','"state": "closed"',V("select public.item_state('tender','t-exp');"))

print('== APPLICATIONS ==')
JO=psql("select id from public.jobs where slug='open-future'"); JE=psql("select id from public.jobs where slug='open-expired'")
expect('application to EXPIRED job rejected (no new applications)','row-level security',V(f"insert into public.applications(job_id,full_name,email) values ('{JE}','Test User','t@x.com');"))
expect('application to open job accepted','',V(f"insert into public.applications(job_id,full_name,email) values ('{JO}','Test User','t@x.com');"))
expect('visitor cannot read applications','permission denied',V("select count(*) from public.applications;"))
expect('visitor cannot set status at insert','row-level security',V("insert into public.applications(full_name,email,status) values ('Test User','t@x.com','hired');"))
for i in range(4): V("insert into public.applications(full_name,email) values ('Test User','t@x.com');")
expect('6th application from one visitor is rate-limited','Too many submissions',V("insert into public.applications(full_name,email) values ('Test User','t@x.com');"))
expect('a different visitor is not blocked','',V("insert into public.applications(full_name,email) values ('Other User','o@x.com');",'9.9.9.9'))
expect('HR can read applications','6',A(HR,"select count(*) from public.applications;"))
expect('content manager cannot read applications','0',A(CONT,"select count(*) from public.applications;"))
expect('editor cannot read applications','0',A(EDIT,"select count(*) from public.applications;"))

print('== ROLES (RBAC) ==')
ins=lambda t,s:f"insert into public.{t}(slug,title_en,status) values ('{s}','x','draft');"
expect('content manager can create a post','',A(CONT,ins('posts','c1')))
expect('HR cannot create a post','row-level security',A(HR,ins('posts','h1')))
expect('HR can create a job','',A(HR,ins('jobs','hj')))
expect('content manager cannot create a job','row-level security',A(CONT,ins('jobs','cj')))
expect('content manager can create a tender','',A(CONT,ins('tenders','ct')))
expect('editor cannot create a tender','row-level security',A(EDIT,ins('tenders','et')))
expect('HR cannot create a tender','row-level security',A(HR,ins('tenders','ht')))
expect('signed-in non-staff cannot create posts','row-level security',A(PLAIN,ins('posts','x')))
expect('non-staff cannot read the staff list','0',A(PLAIN,"select count(*) from public.staff;"))
expect('content manager sees only own staff row','1',A(CONT,"select count(*) from public.staff;"))
expect('super admin sees all staff','5',A(SUPER,"select count(*) from public.staff;"))
expect('admin cannot add staff','row-level security',A(ADMIN,f"insert into public.staff(user_id,email,role) values ('{PLAIN}','p@x','admin');"))
expect('staff cannot promote themselves','0',A(CONT,f"with u as (update public.staff set role='super_admin' where user_id='{CONT}' returning 1) select count(*) from u;"))
expect('super admin can add staff','',A(SUPER,f"insert into public.staff(user_id,email,role) values ('{PLAIN}','p@x','content');"))
expect('last Super Administrator cannot be demoted','At least one active Super Administrator',A(SUPER,f"update public.staff set role='admin' where user_id='{SUPER}';"))
expect('last Super Administrator cannot be deleted','At least one active Super Administrator',A(SUPER,f"delete from public.staff where user_id='{SUPER}';"))
psql(f"update public.staff set active=false where user_id='{PLAIN}'")
expect('deactivated staff lose access immediately','row-level security',A(PLAIN,ins('posts','x')))

print('== POSTS (scheduled publishing) ==')
expect('visitor sees only live posts','p-now',V("select string_agg(slug,' ') from public.posts;"))
expect('future post hidden even when marked published','0',V("select count(*) from public.posts where slug in ('p-future','p-future-pub');"))
expect('archived and draft posts hidden','0',V("select count(*) from public.posts where slug in ('p-arch','p-draft');"))
expect('content manager sees scheduled posts','p-future',A(CONT,"select string_agg(slug,' ') from public.posts where status='scheduled';"))

print('== THEME / SETTINGS ==')
expect('visitor reads the published theme','1',V("select count(*) from public.site_settings where key='theme';"))
expect('visitor cannot read the theme DRAFT','0',V("select count(*) from public.site_settings where key='theme_draft';"))
expect('editor can read the theme draft','1',A(EDIT,"select count(*) from public.site_settings where key='theme_draft';"))
expect('HR cannot change the theme','0',A(HR,"with u as (update public.site_settings set value='{}' where key='theme' returning 1) select count(*) from u;"))
expect('editor can change the theme','1',A(EDIT,"with u as (update public.site_settings set value='{\"a\":3}' where key='theme' returning 1) select count(*) from u;"))

print('== SOCIAL LINKS ==')
expect('visitor reads visible social links','4',V("select count(*) from public.social_links;"))
expect('javascript: URL rejected by database','violates check constraint',A(EDIT,"insert into public.social_links(platform,name,url) values ('x','Bad','javascript:alert(1)');"))
expect('plain http URL rejected','violates check constraint',A(EDIT,"insert into public.social_links(platform,name,url) values ('x','Bad','http://example.com');"))
expect('unknown placement rejected','violates check constraint',A(EDIT,"insert into public.social_links(platform,name,url,placements) values ('x','Bad','https://e.com','{sidebar}');"))
expect('visitor cannot add a social link','permission denied',V("insert into public.social_links(platform,name,url) values ('x','Bad','https://evil.example');"))
A(EDIT,"update public.social_links set visible=false where platform='x';")
expect('hidden social link not visible to visitors','3',V("select count(*) from public.social_links;"))
expect('HR cannot manage social links','0',A(HR,"with u as (update public.social_links set name='h' returning 1) select count(*) from u;"))

print('== FORM BUILDER ==')
psql("update public.forms set recipients='{secret@qartexa.example}', ack_enabled=true where slug='project-enquiry'")
expect('visitor cannot read forms table (recipients stay private)','permission denied',V("select * from public.forms;"))
expect('get_form never exposes recipient addresses','0',V("select position('secret@qartexa' in public.get_form('project-enquiry')::text);"))
expect('get_form returns the 10 starter fields','10',V("select jsonb_array_length(public.get_form('project-enquiry')->'fields');"))
expect('visitor cannot read submissions','permission denied',V("select * from public.form_submissions;"))
expect('visitor cannot insert submissions directly','permission denied',V("insert into public.form_submissions(data) values ('{}');"))
GOOD={"name":"Alice","organization":"Acme","email":"alice@acme.org","service":"Cybersecurity","message":"Need a network","consent":"Agreed","evil":"<script>"}
sub=lambda d,ip,hp='': V(f"select public.submit_form('project-enquiry',$j${json.dumps(d)}$j$::jsonb,'en',{('$h$'+hp+'$h$') if hp else 'null'});",ip)
expect('valid submission accepted','"ok": true',sub(GOOD,'2.2.2.2'))
expect('unknown fields are dropped','0',A(ADMIN,"select (data ? 'evil')::int from public.form_submissions order by created_at desc limit 1;"))
expect('notification + acknowledgement queued for e-mail','2',A(ADMIN,"select count(*) from public.email_outbox;"))
bad=lambda **k:{**GOOD,**k}
expect('missing required field rejected','required:name',sub({k:v for k,v in GOOD.items() if k!='name'},'3.3.3.3'))
expect('invalid e-mail rejected','invalid:email',sub(bad(email='not-an-email'),'3.3.3.3'))
expect('consent is required','required:consent',sub({k:v for k,v in GOOD.items() if k!='consent'},'3.3.3.3'))
expect('over-long text rejected','too_long:message',sub(bad(message='x'*6000),'3.3.3.3'))
expect('honeypot: looks successful, stores nothing','0',(sub(GOOD,'4.4.4.4','bot'),A(ADMIN,"select count(*) from public.form_submissions where ip_hash=md5('4.4.4.4');"))[1])
for i in range(5): sub(GOOD,'5.5.5.5')
expect('rate limit: 5 per 10 minutes per visitor','rate_limited',sub(GOOD,'5.5.5.5'))
expect('another visitor unaffected','"ok": true',sub(GOOD,'7.7.7.7'))
psql("update public.forms set enabled=false")
expect('disabled form refuses submissions','form_unavailable',sub(GOOD,'6.6.6.6'))
expect('disabled form is not served','',V("select coalesce(public.get_form('project-enquiry')::text,'');"))
psql("update public.forms set enabled=true")
expect('HR cannot read form submissions','0',A(HR,"select count(*) from public.form_submissions;"))
expect('admin can read form submissions','7',A(ADMIN,"select count(*) from public.form_submissions;"))
expect('editor can edit form fields','1',A(EDIT,"with u as (update public.form_fields set label_en='Your name' where name='name' returning 1) select count(*) from u;"))
expect('editor cannot read submissions','0',A(EDIT,"select count(*) from public.form_submissions;"))
expect('bad field name rejected','violates check constraint',A(EDIT,"insert into public.form_fields(form_id,name,type,label_en) select id,'Bad Name','text','x' from public.forms limit 1;"))
# a custom select + number + pattern field
psql("""insert into public.form_fields(form_id,name,type,label_en,required,options,validation,sort_order) select id,'budget','select','Budget',true,'[{"value":"low"},{"value":"high"}]'::jsonb,'{}',70 from public.forms;
insert into public.form_fields(form_id,name,type,label_en,validation,sort_order) select id,'seats','number','Seats','{"min":1,"max":500}'::jsonb,80 from public.forms;
insert into public.form_fields(form_id,name,type,label_en,validation,sort_order) select id,'code','text','Code','{"pattern":"^[A-Z]{3}[0-9]{2}$"}'::jsonb,90 from public.forms;""")
expect('select value outside the options rejected','invalid:budget',sub(bad(budget='medium'),'8.8.8.1'))
expect('select value inside options accepted','"ok": true',sub(bad(budget='low'),'8.8.8.2'))
expect('number above max rejected','invalid:seats',sub(bad(budget='low',seats='9999'),'8.8.8.3'))
expect('non-numeric number rejected','invalid:seats',sub(bad(budget='low',seats='abc'),'8.8.8.3'))
expect('pattern mismatch rejected','invalid:code',sub(bad(budget='low',code='abc'),'8.8.8.3'))
expect('pattern match accepted','"ok": true',sub(bad(budget='low',code='ABC12'),'8.8.8.4'))
expect('SQL-looking text is stored as inert text','"ok": true',sub(bad(budget='low',message="'; drop table public.forms; --"),'8.8.8.5'))
expect('forms table still exists after injection attempt','1',psql("select count(*) from information_schema.tables where table_name='forms' and table_schema='public';"))

print('== ACTIVITY LOG ==')
expect('staff edits logged with the actor','e@x',A(ADMIN,"select string_agg(distinct actor_email,',') from public.activity_log where table_name='form_fields';"))
expect('old and new values recorded','Your name',A(ADMIN,"select new_value->>'label_en' from public.activity_log where table_name='form_fields' and op='UPDATE' limit 1;"))
expect('no personal data copied from applications/submissions','0',psql("select count(*) from public.activity_log where table_name in ('applications','form_submissions') and (new_value ? 'email' or new_value ? 'data' or new_value ? 'full_name');"))
expect('HR cannot read the activity log','0',A(HR,"select count(*) from public.activity_log;"))
expect('visitors cannot read the activity log','permission denied',V("select * from public.activity_log;"))
expect('log entries cannot be edited by staff','permission denied',A(SUPER,"with u as (update public.activity_log set op='X' returning 1) select count(*) from u;"))

print('== EXPIRY TIDY-UP + EXTENSION ==')
expect('expire_items() flips expired rows to closed','"jobs": 1',V("select public.expire_items();"))
expect('extending a job makes it public again','1',(A(HR,"update public.jobs set closing_at=now()+interval '5 days', status='open' where slug='open-expired';"),V("select count(*) from public.jobs where slug='open-expired';"))[1])
expect('date-only closing = end of day in Kigali','23:59:59',psql("insert into public.jobs(slug,title_en,status,closing_date) values ('dateonly','D','open','2030-01-15'); select to_char(closing_at at time zone 'Africa/Kigali','HH24:MI:SS') from public.jobs where slug='dateonly';")[-8:])

print(f'\nRESULT: {P} passed, {F} failed'); sys.exit(1 if F else 0)
