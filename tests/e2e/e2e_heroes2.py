#!/usr/bin/env python3
"""Inner-page photos, solution cards, reuse, replace propagation, safe delete, site images, editors, accessibility."""
import sys; sys.path.insert(0,'/home/claude/work/tests/e2e')
from common import *
import common, urllib.request
IMG=ROOT+'/tests/e2e/images/'; SHOT=ROOT+'/docs/screenshots/'
AXE=open('/tmp/si/node_modules/axe-core/axe.min.js').read()
subprocess.run([ROOT+'/tests/e2e/reset.sh'],capture_output=True)
def headst(path):
    try: return urllib.request.urlopen(BASE+'/storage/v1/object/public/media/'+path).status
    except Exception: return 404
INV=json.loads(subprocess.run(['node','-e',"global.window={};require('/home/claude/work/js/qx-inventory.js');console.log(JSON.stringify(window.QX_INVENTORY))"],capture_output=True,text=True).stdout)
SLOT={p['key']:p['slot']['id'] for p in INV['pages'] if p['slot']}
def side(p,key='about'):
    return p.evaluate("""(id)=>{const i=document.querySelector('[data-cms-img="'+id+'"]');const r=i.getBoundingClientRect();
      return {src:i.currentSrc||i.src,alt:i.alt,pos:getComputedStyle(i).objectPosition,w:Math.round(r.width),h:Math.round(r.height),pic:!!i.closest('picture.qx-side-pic'),nat:i.naturalWidth}}""",SLOT[key])
def set_hero(pg,key,filt=None):
    go(pg,'heroes'); pg.click(f'#hr-list [data-k="{key}"]'); pg.wait_for_selector('#hr-pick'); pg.click('#hr-pick'); pg.wait_for_selector('#pk-g .qa3-card')
    if filt: pg.fill('#pk-q',filt); pg.wait_for_timeout(300)
    pg.click('#pk-g .qa3-card >> nth=0'); pg.wait_for_selector('#hr-pub'); pg.click('#hr-pub'); pg.click('#c3-ok'); pg.wait_for_selector('#hr-m .ok',timeout=10000)
with sync_playwright() as pw:
    b=pw.chromium.launch()
    errs=[]; ctx,pg=new_page(b,errs,w=1500,h=1000); login(pg,'editor'); go(pg,'media'); pg.wait_for_selector('#ml-up',state='attached')
    pg.set_input_files('#ml-up',[IMG+'second-hero.jpg',IMG+'third.jpg']); pg.wait_for_selector('#bt-ok:not([disabled])',timeout=90000); pg.click('#bt-ok'); pg.wait_for_timeout(800)
    ids={r.split('|')[0]:r.split('|')[1] for r in sql("select title||'|'||id from public.media").split(' ') if '|' in r} if False else {}
    sid=sql("select id from public.media where title='second hero'"); tid=sql("select id from public.media where title='third'")
    print('== INNER PAGE PHOTO (side mode) ==')
    c0,p0=new_page(b,[],w=1440,h=900); p0.goto(BASE+'/about.html'); p0.wait_for_load_state('networkidle'); p0.wait_for_timeout(600); before=side(p0); c0.close()
    ok('before: About shows its built-in photo',before['src'].endswith('about-hero.jpg') and not before['pic'],str(before))
    go(pg,'heroes'); pg.click('#hr-list [data-k="about"]'); pg.wait_for_selector('#hr-pick')
    ok('About offers "Replace the existing photo" by default (it has one)',pg.is_checked('input[name=hm][value=side]'))
    ok('side mode hides banner-only controls (overlay, height)',pg.query_selector('#hr-oc') is None and pg.query_selector('#hr-h') is None)
    pg.click('#hr-pick'); pg.wait_for_selector('#pk-g .qa3-card'); pg.fill('#pk-q','second'); pg.wait_for_timeout(300); pg.click('#pk-g .qa3-card >> nth=0'); pg.wait_for_selector('#hr-pub')
    pg.fill('#hr-ae','Our engineers at work'); pg.wait_for_timeout(1200)
    fr=[f for f in pg.frames if 'qx_preview' in f.url][0]; pv=fr.evaluate("""(id)=>{const i=document.querySelector('[data-cms-img="'+id+'"]');return i.currentSrc||i.src}""",SLOT['about'])
    ok('live preview shows the replacement photo in place',sid in pv,pv[-70:])
    pg.click('#hr-pub'); pg.click('#c3-ok'); pg.wait_for_selector('#hr-m .ok',timeout=10000)
    c1,p1=new_page(b,[],w=1440,h=900); p1.goto(BASE+'/about.html'); p1.wait_for_load_state('networkidle'); p1.wait_for_timeout(900); after=side(p1); p1.screenshot(path=SHOT+'13-about-after.png'); c1.close()
    ok('PUBLIC About page now shows the library photo (responsive picture), alt text applied',sid in after['src'] and after['pic'] and after['alt']=='Our engineers at work' and after['nat']>0,str(after))
    ok('layout box is unchanged (same width as before, no page jump)',abs(after['w']-before['w'])<=2,f"{before['w']} vs {after['w']}")
    c2,p2=new_page(b,[],w=390,h=800); p2.goto(BASE+'/about.html'); p2.wait_for_load_state('networkidle'); p2.wait_for_timeout(900); m=side(p2)
    ok('phones get a smaller file for the inner photo too',sid in m['src'] and 0<int(re.search(r'/(\d+)\.',m['src']).group(1))<=800,m['src'][-50:]); c2.close()
    print('== SOLUTION CARD IMAGE ==')
    c3,p3=new_page(b,[],w=1440,h=900); p3.goto(BASE+'/index.html'); p3.wait_for_load_state('networkidle'); p3.wait_for_timeout(600)
    card=lambda p:p.evaluate("getComputedStyle(document.querySelector('.capability-group:nth-child(2)'),'::before').backgroundImage"); b4=card(p3); c3.close()
    ok('before: card 2 uses the built-in cybersecurity card picture','cybersecurity-hero-card' in b4,b4[:120])
    set_hero(pg,'card:solutions:2','third')
    c3,p3=new_page(b,[],w=1440,h=900); p3.goto(BASE+'/index.html'); p3.wait_for_load_state('networkidle'); p3.wait_for_timeout(1000); a4=card(p3)
    ok('after: card 2 shows the library picture, others unchanged','/library/'+tid in a4 and 'digital-transformation-hero-card' in p3.evaluate("getComputedStyle(document.querySelector('.capability-group:nth-child(1)'),'::before').backgroundImage"),a4[:160]); c3.close()
    print('== SAME IMAGE ON SEVERAL PAGES / SAFE DELETE ==')
    for k in ['industries_healthcare','industries_education']: set_hero(pg,k,'second')
    ok('one library image now serves 3 places (About + 2 industry pages)',sql(f"select count(*) from public.page_heroes where config::text like '%{sid}%'")=='3')
    go(pg,'media'); pg.wait_for_selector('#ml-g .qa3-card'); pg.fill('#ml-q','second'); pg.wait_for_timeout(300); pg.click('#ml-g .qa3-card >> nth=0'); pg.wait_for_selector('#dt-use'); pg.wait_for_timeout(900)
    ok('the image detail lists where it is used','3 place' in pg.inner_text('#dt-use') and 'about' in pg.inner_text('#dt-use'),pg.inner_text('#dt-use'))
    pg.screenshot(path=SHOT+'05-media-detail-usage.png')
    pg.click('#dt-del'); pg.wait_for_timeout(400); ok('delete is refused while in use, listing where','in use' in pg.inner_text('body') and 'industries_education' in pg.inner_text('body'))
    pg.click('#dd-x'); ok('the database also refuses a direct delete of a used image',('still used in' in pg.evaluate(f"QX.store.remove('media','{sid}').then(()=>'deleted').catch(e=>e.message)")))
    print('== REPLACE FILE PROPAGATES / RESTORE PREVIOUS FILE ==')
    pg.click('#dt-x') if pg.query_selector('#dt-x') else None
    go(pg,'media'); pg.wait_for_selector('#ml-g .qa3-card'); pg.fill('#ml-q','second'); pg.wait_for_timeout(300); pg.click('#ml-g .qa3-card >> nth=0'); pg.wait_for_selector('#dt-rep',state='attached'); pg.wait_for_timeout(700)
    pg.set_input_files('#dt-rep',IMG+'mobile-green.jpg'); pg.wait_for_selector('#c3-ok'); ok('replace warns that it changes every place it is used','3 place' in pg.inner_text('body') and 'old file is kept' in pg.inner_text('body'))
    pg.click('#c3-ok'); pg.wait_for_selector('#ed-cv'); pg.select_option('#ed-as','orig'); pg.click('#ed-save'); pg.wait_for_selector('#ed-cv',state='detached',timeout=40000); pg.wait_for_timeout(1200)
    base2=sql(f"select base from public.media where id='{sid}'"); ok('file replaced under a new versioned folder, old version recorded',base2.endswith('-v1') and sql(f"select jsonb_array_length(versions) from public.media where id='{sid}'")=='1',base2)
    c5,p5=new_page(b,[],w=1440,h=900); p5.goto(BASE+'/about.html'); p5.wait_for_load_state('networkidle'); p5.wait_for_timeout(900); n=side(p5); c5.close()
    ok('About now serves the replaced file without touching the page settings','-v1' in n['src'],n['src'][-60:])
    c5,p5=new_page(b,[],w=1440,h=900); p5.goto(BASE+'/industries/healthcare.html'); p5.wait_for_load_state('networkidle'); p5.wait_for_timeout(900); n2=side(p5,'industries_healthcare'); c5.close()
    ok('the other pages using it updated too',sid in n2['src'] and '-v1' in n2['src'],n2['src'][-60:])
    ok('the old file still exists in storage (nothing was lost)',headst(f"library/{sid}/1920.webp")==200 or headst(f"library/{sid}/1280.webp")==200)
    pg.fill('#ml-q','second'); pg.wait_for_timeout(300); pg.click('#ml-g .qa3-card >> nth=0'); pg.wait_for_selector('#dt-prev'); pg.click('#dt-prev'); pg.click('#c3-ok'); pg.wait_for_timeout(1500)
    ok('Restore previous file switches back',sql(f"select base from public.media where id='{sid}'")==f'library/{sid}')
    c5,p5=new_page(b,[],w=1440,h=900); p5.goto(BASE+'/about.html'); p5.wait_for_load_state('networkidle'); p5.wait_for_timeout(900); n=side(p5); c5.close(); ok('and every page follows',('-v1' not in n['src']) and sid in n['src'])
    print('== DELETE AFTER REMOVAL ==')
    for k in ['about','industries_healthcare','industries_education']:
        go(pg,'heroes'); pg.click(f'#hr-list [data-k="{k}"]'); pg.wait_for_selector('#hr-rm'); pg.click('#hr-rm'); pg.click('#c3-ok'); pg.wait_for_timeout(900)
    c5,p5=new_page(b,[],w=1440,h=900); p5.goto(BASE+'/about.html'); p5.evaluate('localStorage.clear();sessionStorage.clear()'); p5.reload(); p5.wait_for_load_state('networkidle'); p5.wait_for_timeout(900); n=side(p5); c5.close()
    ok('removing the custom photo restores About\'s built-in photo, original layout',n['src'].endswith('about-hero.jpg') and not n['pic'] and abs(n['w']-before['w'])<=2,str(n))
    go(pg,'media'); pg.wait_for_selector('#ml-g .qa3-card'); pg.fill('#ml-q','second'); pg.wait_for_timeout(300); pg.click('#ml-g .qa3-card >> nth=0'); pg.wait_for_selector('#dt-del'); pg.wait_for_timeout(800)
    ok('image is no longer in use',pg.inner_text('#dt-use').startswith('Not used'))
    pg.click('#dt-del'); pg.wait_for_selector('#c3-ok'); pg.click('#c3-ok'); pg.wait_for_timeout(1500)
    ok('deleted from library and its files removed from storage',sql(f"select count(*) from public.media where id='{sid}'")=='0' and headst(f"library/{sid}/800.webp")==404)

    print('== SITE IMAGES (other pictures on the pages) ==')
    go(pg,'siteimages'); pg.wait_for_selector('.qa3-tbl'); 
    ok('every page picture is listed',pg.evaluate("document.querySelectorAll('.qa3-tbl tbody tr').length")>=30,str(pg.evaluate("document.querySelectorAll('.qa3-tbl tbody tr').length")))
    ok('hero photos point to Page heroes instead of being replaced here',pg.evaluate("document.querySelectorAll('.qa3-tbl a[href=\"#heroes\"]').length")>=20)
    pg.screenshot(path=SHOT+'06-site-images.png')
    rowi=pg.evaluate("[...document.querySelectorAll('.qa3-tbl tbody tr')].findIndex(r=>r.querySelector('[data-r]'))"); 
    inv=json.loads(subprocess.run(['node','-e',"global.window={};require('/home/claude/work/js/qx-inventory.js');const i=window.QX_INVENTORY;const hs=new Set(i.pages.filter(p=>p.slot).map(p=>p.slot.id));console.log(JSON.stringify(i.images.filter(x=>x.src&&!hs.has(x.id))[0]))"],capture_output=True,text=True).stdout)
    pg.click('.qa3-tbl [data-r="'+str([i for i,x in enumerate(json.loads(subprocess.run(['node','-e',"global.window={};require('/home/claude/work/js/qx-inventory.js');console.log(JSON.stringify(window.QX_INVENTORY.images.filter(x=>x.src)))"],capture_output=True,text=True).stdout)) if x['id']==inv['id']][0])+'"]'); pg.wait_for_selector('#pk-g .qa3-card'); pg.click('#pk-g .qa3-card >> nth=0'); pg.wait_for_timeout(1500)
    ok('replacement stored as a page image override',sql(f"select count(*) from public.cms_overrides where key='{inv['id']}'")=='1')
    c6,p6=new_page(b,[],w=1440,h=900); p6.goto(BASE+'/'+inv['file']); p6.wait_for_load_state('networkidle'); p6.wait_for_timeout(1000)
    ok('the public page shows the new picture in that spot','/library/' in p6.evaluate(f"(document.querySelector('[data-cms-img=\"{inv['id']}\"]')||{{}}).src||''"),inv['file']); c6.close()
    pg.click('.qa3-tbl [data-o]'); pg.click('#c3-ok'); pg.wait_for_timeout(1200)
    ok('Restore original removes the override',sql(f"select count(*) from public.cms_overrides where key='{inv['id']}'")=='0')

    print('== IMAGE FIELDS IN THE OLDER EDITORS ==')
    go(pg,'partners'); pg.wait_for_selector('#qa-add'); pg.click('#qa-add'); pg.wait_for_selector('[data-lib]'); first=pg.query_selector('input[data-k]:not([data-k="logo_url"])'); fk=first.get_attribute('data-k'); first.fill('Typed before choosing'); pg.click('[data-lib]'); pg.wait_for_selector('#pk-g .qa3-card'); pg.click('#pk-g .qa3-card >> nth=0'); pg.wait_for_timeout(500)
    v=pg.input_value('input[data-k="logo_url"]'); ok('Partner logo field: "Choose from library" fills the image link','/library/' in v,v)
    ok('the editor stays open and keeps what was already typed (picker opens on top)',pg.input_value(f'input[data-k="{fk}"]')=='Typed before choosing')
    ok('Partner logo field: thumbnail appears',pg.query_selector('.qa-thumb') is not None)
    ok('Partner logo field uses the optimising uploader (no raw upload left)',pg.query_selector('input[data-libup]') is not None and pg.query_selector('input[data-up][data-kind=image]') is None)
    ok('image management: no JS errors',not errs,str(errs[:3])); ctx.close()

    print('== PERMISSIONS + ACCESSIBILITY ==')
    for who,exp in [('hr',False),('content',True),('editor',True),('admin',True)]:
        c,p=new_page(b,[]); login(p,who); has=any('Page heroes' in x for x in nav(p)) and any('Media library' in x for x in nav(p)); ok(f'{who}: media + heroes {"visible" if exp else "hidden"}',has==exp); c.close()
    c,p=new_page(b,[]); login(p,'hr'); r=p.evaluate("QX.store.rpc('publish_hero',{p_key:'index'}).then(()=>'ran').catch(e=>'blocked')"); ok('HR cannot call publish_hero',r=='blocked'); c.close()
    c,p=new_page(b,[]); p.goto(BASE+'/index.html'); p.wait_for_load_state('networkidle')
    r=p.evaluate("fetch(QX_CONFIG.supabaseUrl+'/rest/v1/rpc/publish_hero',{method:'POST',headers:{apikey:QX_CONFIG.supabaseAnonKey,'Content-Type':'application/json'},body:JSON.stringify({p_key:'index'})}).then(r=>r.status)"); ok('a visitor cannot call publish_hero (HTTP 401/403)',r in(401,403),str(r)); c.close()
    c,pg=new_page(b,[],w=1400,h=950); login(pg,'content')
    for sec,sel in [('media','#ml-g'),('heroes','#hr-list'),('siteimages','.qa3-tbl')]:
        go(pg,sec); pg.wait_for_selector(sel); pg.wait_for_timeout(500)
        if sec=='heroes': pg.click('#hr-list [data-k="contact"]'); pg.wait_for_selector('#hr-pick'); pg.wait_for_timeout(500)
        pg.evaluate(AXE); res=pg.evaluate("axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}).then(r=>r.violations.map(v=>v.id+' x'+v.nodes.length+' '+v.nodes[0].target.join(' ').slice(0,60)))")
        ok(f'accessibility (axe): {sec} screen has no WCAG A/AA violations',not res,str(res))
    ctx.close(); b.close()
print(f'\nRESULT (heroes2): {common.P} passed, {common.F} failed')
for x in common.FAILS: print('  FAILED:',x)
sys.exit(1 if common.F else 0)
