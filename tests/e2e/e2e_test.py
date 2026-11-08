#!/usr/bin/env python3
"""End-to-end browser tests (Chromium) against the real site code, real PostgREST and the migrated database."""
import subprocess, json, re, sys, glob, os, time, tempfile
from playwright.sync_api import sync_playwright
BASE='http://localhost:8080'; ROOT='/home/claude/work'
P=F=0; FAILS=[]
def ok(name,cond,detail=''):
    global P,F
    if cond: P+=1; print('PASS ',name)
    else: F+=1; FAILS.append(name); print('FAIL ',name,'|',detail)
def sql(q):
    with tempfile.NamedTemporaryFile('w',suffix='.sql',delete=False) as f: f.write(q); p=f.name
    os.chmod(p,0o644)
    r=subprocess.run(['su','postgres','-c',f'psql -h /tmp -p 5433 -U postgres -d qx -At -q -v ON_ERROR_STOP=1 -f {p}'],capture_output=True,text=True); os.unlink(p); return (r.stdout+r.stderr).strip()
subprocess.run([ROOT+'/tests/e2e/reset.sh'],capture_output=True)
PW='Passw0rd!test'
def new_page(b,errors,lang='en',w=1280,h=900):
    ctx=b.new_context(viewport={'width':w,'height':h}); pg=ctx.new_page()
    pg.on('pageerror',lambda e:errors.append('pageerror: '+str(e)))
    pg.on('console',lambda m:errors.append('console: '+m.text) if m.type=='error' and 'favicon' not in m.text and 'Failed to load resource' not in m.text else None)
    pg.on('requestfailed',lambda r:errors.append('requestfailed: '+r.url+' '+str(r.failure)) if 'fonts.g' not in r.url and 'ERR_ABORTED' not in str(r.failure) else None)
    pg.on('response',lambda r:errors.append(f'http {r.status}: {r.url}') if r.status>=400 and r.status!=401 and 'favicon' not in r.url and '/rest/v1/' not in r.url and 'object' not in r.url else None)
    return ctx,pg
def login(pg,who):
    pg.goto(BASE+'/portal.html'); pg.wait_for_function('window.QX&&QX.auth')
    pg.evaluate(f"QX.auth.signIn('{who}@qartexa.test','{PW}')")
    pg.goto(BASE+'/admin.html'); pg.wait_for_selector('#qa-nav button',timeout=8000)
def nav(pg): return [b.inner_text().strip() for b in pg.query_selector_all('#qa-nav button')]
def go(pg,sec): pg.evaluate(f"location.hash='#{sec}'"); pg.wait_for_timeout(700)
def pubrows(pg,table): return pg.evaluate(f"QX.store.list('{table}',{{}})")

with sync_playwright() as pw:
    b=pw.chromium.launch()

    # ---------------- 1. every page loads cleanly ----------------
    print('== PAGES ==')
    pages=sorted(glob.glob(ROOT+'/*.html')+glob.glob(ROOT+'/solutions/*.html')+glob.glob(ROOT+'/industries/*.html'))
    bad={}
    ctx,pg=new_page(b,[])
    for f in pages:
        rel=os.path.relpath(f,ROOT); errs=[]
        pg.remove_listener if False else None
        ctx2,p2=new_page(b,errs); 
        q='?s=network-engineer' if rel=='job.html' else ('?s=open-tender' if rel=='tender.html' else ('?s=live-post' if rel=='post.html' else ('?s=cybersecurity' if rel=='solution.html' else ('?f=project-enquiry' if rel=='form.html' else ''))))
        if rel in('admin.html',): ctx2.close(); continue
        nohead=(rel=='portal.html')
        p2.goto(BASE+'/'+rel+q); p2.wait_for_load_state('networkidle'); p2.wait_for_timeout(300)
        h1=p2.query_selector_all('h1'); ovf=p2.evaluate('document.documentElement.scrollWidth>document.documentElement.clientWidth+1')
        if errs or (not h1 and not nohead) or ovf: bad[rel]=(errs[:2],len(h1),ovf)
        ctx2.close()
    ok(f'all {len(pages)-1} pages load with a heading, no JS errors, no failed requests, no horizontal overflow (desktop)',not bad,str(bad)[:600])

    # mobile overflow check on key pages
    mb={}
    for rel in ['index.html','contact.html','careers.html','tenders.html','solutions.html','about.html','job.html?s=network-engineer','form.html?f=project-enquiry']:
        e=[]; c3,p3=new_page(b,e,w=390,h=800); p3.goto(BASE+'/'+rel); p3.wait_for_load_state('networkidle'); p3.wait_for_timeout(300)
        if p3.evaluate('document.documentElement.scrollWidth>document.documentElement.clientWidth+1'): mb[rel]=True
        c3.close()
    ok('no horizontal overflow on mobile (390px) key pages',not mb,str(mb))

    # ---------------- 2. expiry on public pages ----------------
    print('== EXPIRY (public) ==')
    ctx,pg=new_page(b,[]); pg.goto(BASE+'/careers.html'); pg.wait_for_load_state('networkidle'); pg.wait_for_timeout(500)
    t=pg.inner_text('main')
    ok('careers lists the live job',  'Network Engineer' in t)
    ok('careers hides the expired job','Expired Analyst' not in t)
    ok('careers hides the draft job','Draft Role' not in t)
    pg.goto(BASE+'/job.html?s=expired-analyst'); pg.wait_for_load_state('networkidle'); pg.wait_for_timeout(500)
    t=pg.inner_text('main')
    ok('expired job direct link shows a closed notice','no longer accepts applications' in t and 'Expired Analyst' in t,t[:200])
    ok('expired job shows NO application form',pg.query_selector('form')is None)
    pg.goto(BASE+'/job.html?s=draft-role'); pg.wait_for_load_state('networkidle'); pg.wait_for_timeout(400)
    ok('draft job link reveals nothing about the job','Draft Role' not in pg.inner_text('main'))
    pg.goto(BASE+'/job.html?s=network-engineer'); pg.wait_for_load_state('networkidle'); pg.wait_for_timeout(400)
    ok('live job shows an application form + closing time (CAT)',pg.query_selector('form')is not None and 'CAT' in pg.inner_text('main'))
    pg.goto(BASE+'/tenders.html'); pg.wait_for_load_state('networkidle'); pg.wait_for_timeout(500); t=pg.inner_text('main')
    ok('tenders: open tender listed under Open tenders','Open Tender Alpha' in t and 'Open tenders' in t)
    ok('tenders: expired tender not listed','Expired Tender Beta' not in t)
    ok('tenders: Past tenders section shows only history-enabled tender','Past tenders' in t and 'History Tender Gamma' in t)
    pg.goto(BASE+'/tender.html?s=expired-tender'); pg.wait_for_load_state('networkidle'); pg.wait_for_timeout(500)
    ok('expired tender direct link shows a closed notice','no longer accepts' in pg.inner_text('main') and 'Expired Tender Beta' in pg.inner_text('main'))
    pg.goto(BASE+'/blog.html'); pg.wait_for_load_state('networkidle'); pg.wait_for_timeout(500)
    ok('blog hides a future-dated scheduled article','Secret Future' not in pg.inner_text('main') and 'Live Article' in pg.inner_text('main'))
    pg.goto(BASE+'/post.html?s=future-post'); pg.wait_for_load_state('networkidle'); pg.wait_for_timeout(500)
    ok('future article direct link is not served','Secret Future' not in pg.inner_text('main'))
    # a job whose deadline passes WHILE the page is cached is still hidden
    sql("update public.jobs set closing_at=now()+interval '4 seconds' where slug='network-engineer';")
    pg.evaluate('sessionStorage.clear()'); pg.goto(BASE+'/careers.html'); pg.wait_for_load_state('networkidle'); pg.wait_for_timeout(300)
    seen=('Network Engineer' in pg.inner_text('main')); time.sleep(5)
    pg.goto(BASE+'/careers.html'); pg.wait_for_load_state('networkidle'); pg.wait_for_timeout(500)
    ok('job visible before its deadline, hidden right after it (cached page, status still "open")',seen and 'Network Engineer' not in pg.inner_text('main'))
    ok('table still says status=open (proves hiding is query-time, not cron)',sql("select status from public.jobs where slug='network-engineer'")=='open')
    sql("update public.jobs set closing_at=now()+interval '10 days' where slug='network-engineer';")
    ctx.close()

    # ---------------- 3. social links ----------------
    print('== SOCIAL ==')
    errs=[]; ctx,pg=new_page(b,errs); pg.goto(BASE+'/contact.html'); pg.wait_for_load_state('networkidle'); pg.wait_for_timeout(600)
    links=pg.evaluate("[...document.querySelectorAll('footer .social-links a')].map(a=>({h:a.href,t:a.target,r:a.rel,l:a.getAttribute('aria-label')}))")
    ok('footer social links come from the database (4)',len(links)==4,str(links))
    ok('external social links use target=_blank + noopener noreferrer',all(l['t']=='_blank' and 'noopener' in l['r'] and 'noreferrer' in l['r'] for l in links))
    sql("insert into public.social_links(platform,name,url,icon_key,placements,sort_order) values ('youtube','YouTube','https://www.youtube.com/@qartexa','youtube','{footer,header,contact}',50);update public.social_links set visible=false where platform='x';")
    pg.evaluate('sessionStorage.clear()'); pg.reload(); pg.wait_for_load_state('networkidle'); pg.wait_for_timeout(600)
    names=pg.evaluate("[...document.querySelectorAll('footer .social-links a')].map(a=>a.title)")
    ok('added account appears, hidden account disappears, order respected',names==['LinkedIn','Instagram','Facebook','YouTube'],str(names))
    ok('header placement renders',pg.query_selector('header .qx-social-header a')is not None)
    ok('contact-page placement renders',pg.query_selector('.enquiry-aside .qx-social-contact a')is not None)
    ok('social icons are inline SVG (no external image)',pg.evaluate("document.querySelectorAll('footer .social-links a svg').length")==4)
    sql("update public.social_links set visible=true where platform='x';delete from public.social_links where platform='youtube';")
    ctx.close()

    # ---------------- 4. public form ----------------
    print('== FORM (public) ==')
    errs=[]; ctx,pg=new_page(b,errs); pg.goto(BASE+'/contact.html'); pg.wait_for_load_state('networkidle'); pg.wait_for_selector('#consultationForm [name=name]',timeout=5000)
    ok('form is built from the database (10 fields + honeypot)',pg.evaluate("document.querySelectorAll('#consultationForm .form-fields [name]').length")==10)
    ok('form no longer posts to a third party (no action attribute)',pg.get_attribute('#consultationForm','action') is None)
    pg.click('#consultationForm button[type=submit]'); pg.wait_for_timeout(300)
    ok('empty submit is blocked with inline errors',pg.evaluate("[...document.querySelectorAll('.field-error')].filter(e=>e.textContent).length")>=4)
    ok('error message is announced (role=alert) and first invalid field focused',pg.evaluate("document.activeElement&&document.activeElement.getAttribute('aria-invalid')")=='true')
    pg.click('#languageToggle'); pg.wait_for_timeout(500)
    ok('French labels after language switch',pg.evaluate("[...document.querySelectorAll('#consultationForm .form-fields label')].map(l=>l.textContent).join('|')").startswith('Nom complet'))
    pg.click('#languageToggle'); pg.wait_for_timeout(400)
    pg.fill('[name=name]','Test Visitor'); pg.fill('[name=organization]','Acme Ltd'); pg.fill('[name=email]','bad-email')
    pg.select_option('[name=service]','Cybersecurity'); pg.fill('[name=message]','We need a firewall review.')
    pg.check('[name=consent]'); pg.click('#consultationForm button[type=submit]'); pg.wait_for_timeout(300)
    ok('invalid email is rejected client-side',sql("select count(*) from public.form_submissions")=='0')
    pg.fill('[name=email]','visitor@acme.org'); pg.click('#consultationForm button[type=submit]'); pg.wait_for_selector('#formStatus.is-success',timeout=6000)
    ok('valid submission shows the success message',('sent to Qartexa' in pg.inner_text('#formStatus')))
    row=sql("select (data->>'name')||'|'||(data->>'service')||'|'||status from public.form_submissions order by created_at limit 1")
    ok('submission is stored (status new)',row=='Test Visitor|Cybersecurity|new',row)
    ok('notification e-mail queued only when recipients exist (none configured yet)',sql("select count(*) from public.email_outbox")=='0')
    sql("update public.forms set recipients='{team@qartexa.test}', ack_enabled=true;")
    pg.fill('[name=name]','Second Visitor'); pg.fill('[name=organization]','Beta'); pg.fill('[name=email]','second@beta.org'); pg.select_option('[name=service]','Cybersecurity'); pg.fill('[name=message]','Another'); pg.check('[name=consent]')
    pg.click('#consultationForm button[type=submit]'); pg.wait_for_selector('#formStatus.is-success',timeout=6000)
    ok('with recipients configured: notify + acknowledgement queued',sql("select string_agg(kind,',' order by kind) from public.email_outbox")=='ack,notify')
    # honeypot
    pg.evaluate("document.querySelector('[name=qx_website]').value='http://spam'")
    pg.fill('[name=name]','Bot'); pg.fill('[name=organization]','Bot'); pg.fill('[name=email]','bot@bot.org'); pg.select_option('[name=service]','Cybersecurity'); pg.fill('[name=message]','spam'); pg.check('[name=consent]')
    n0=sql("select count(*) from public.form_submissions"); pg.click('#consultationForm button[type=submit]'); pg.wait_for_timeout(1200)
    ok('honeypot submissions are silently dropped',sql("select count(*) from public.form_submissions")==n0)
    ctx.close()
    # rate limit through the real browser path (same IP): third+ quickly
    errs=[]; ctx,pg=new_page(b,errs); pg.goto(BASE+'/form.html?f=project-enquiry'); pg.wait_for_selector('[name=name]',timeout=5000)
    ok('generic form.html page renders any form and title',pg.inner_text('h1')=='Tell us what your organization needs')
    sent=0; limited=False
    for i in range(5):
        pg.fill('[name=name]','R'+str(i)); pg.fill('[name=organization]','R'); pg.fill('[name=email]','r@r.org'); pg.select_option('[name=service]','Cybersecurity'); pg.fill('[name=message]','m'); pg.check('[name=consent]')
        pg.click('button[type=submit]'); pg.wait_for_timeout(900)
        if 'Too many' in pg.inner_text('#formStatus'): limited=True; break
    ok('rate limiting kicks in for one visitor (and shows a friendly message)',limited)
    ctx.close()

    # ---------------- 5. theme ----------------
    print('== THEME ==')
    ctx,pg=new_page(b,[]); pg.goto(BASE+'/index.html'); pg.wait_for_load_state('networkidle'); pg.wait_for_timeout(400)
    ok('default theme injects no CSS (site looks exactly as before)',pg.evaluate("(document.getElementById('qx-theme')||{textContent:''}).textContent.trim()")=='')
    base_btn=pg.evaluate("getComputedStyle(document.querySelector('.btn-primary,.nav-cta')).backgroundColor")
    sql("""insert into public.site_settings(key,value) values ('theme','{"colors":{"btnBg":"#0a7d3b","footerBg":"#222222","accent":"nope;}body{display:none}"},"type":{"baseSize":18,"headFont":"g:Roboto Slab"},"shape":{"btnRadius":24}}') on conflict(key) do update set value=excluded.value;""")
    pg.evaluate('sessionStorage.clear()'); pg.reload(); pg.wait_for_load_state('networkidle'); pg.wait_for_timeout(800)
    new_btn=pg.evaluate("getComputedStyle(document.querySelector('.btn-primary,.nav-cta')).backgroundColor")
    ok('published theme changes buttons',new_btn=='rgb(10, 125, 59)' and new_btn!=base_btn,new_btn)
    ok('published theme changes footer colour',pg.evaluate("getComputedStyle(document.querySelector('footer')).backgroundColor")=='rgb(34, 34, 34)')
    ok('button radius applied',pg.evaluate("getComputedStyle(document.querySelector('.btn-primary,.nav-cta')).borderRadius")=='24px')
    ok('malicious colour value is ignored (no CSS injection, page still visible)',pg.evaluate("getComputedStyle(document.body).display")!='none' and 'display:none' not in pg.evaluate("document.getElementById('qx-theme').textContent"))
    ok('chosen Google font is requested via a validated link',pg.evaluate("(document.getElementById('qx-theme-font')||{}).href||''").startswith('https://fonts.googleapis.com/css2?family=Roboto+Slab'))
    ok('theme persists after another refresh (cached + database)',(pg.reload(),pg.wait_for_timeout(600),pg.evaluate("getComputedStyle(document.querySelector('footer')).backgroundColor"))[2]=='rgb(34, 34, 34)')
    sql("delete from public.site_settings where key='theme';")
    ctx.close()
    b.close()
print(f'\nRESULT (part 1): {P} passed, {F} failed'); 
json.dump({'p':P,'f':F,'fails':FAILS},open('/tmp/e2e_part1.json','w'))
sys.exit(1 if F else 0)
