#!/usr/bin/env python3
"""Acceptance scenario: homepage hero from upload to public site, plus responsive, mobile alternate, restore, remove."""
import sys; sys.path.insert(0,'/home/claude/work/tests/e2e')
from common import *
import common
IMG=ROOT+'/tests/e2e/images/'; SHOT=ROOT+'/docs/screenshots/'
subprocess.run([ROOT+'/tests/e2e/reset.sh'],capture_output=True)
W=lambda s:int(re.search(r'/(\d+)\.(?:webp|jpg|avif)',s).group(1)) if re.search(r'/(\d+)\.(?:webp|jpg|avif)',s) else -1
def pubpage(b,w=1440,h=900,errs=None):
    return new_page(b,errs if errs is not None else [],w=w,h=h)
def hero_info(p):
    return p.evaluate("""(()=>{const h=document.querySelector('.hero'),m=h.querySelector('.qx-hero-media'),i=m&&m.querySelector('img');
      const fr=h.querySelector('.hero-visual .frame');return {frame:fr?getComputedStyle(fr).backgroundImage:'',custom:h.classList.contains('qx-hero-custom'),bg:getComputedStyle(h).backgroundImage.slice(0,80),before:getComputedStyle(h,'::before').backgroundImage.slice(0,80),beforeDisp:getComputedStyle(h,'::before').display,minH:getComputedStyle(h).minHeight,
       src:i?i.currentSrc:'',alt:i?i.alt:null,pos:i?getComputedStyle(i).objectPosition:'',nat:i?i.naturalWidth:0,
       ov:m?getComputedStyle(m.querySelector('.qx-hero-overlay')).opacity:'',ovc:m?getComputedStyle(m.querySelector('.qx-hero-overlay')).backgroundColor:'',
       src_types:m?[...m.querySelectorAll('source')].map(s=>s.type+(s.media?'@'+s.media:'')):[],h1c:getComputedStyle(h.querySelector('h1')).color}})()""")
with sync_playwright() as pw:
    b=pw.chromium.launch()
    # baseline: what visitors see before anything is changed
    c0,p0=pubpage(b); p0.goto(BASE+'/index.html'); p0.wait_for_load_state('networkidle'); p0.wait_for_timeout(500)
    base=hero_info(p0); p0.screenshot(path=SHOT+'10-home-before.png'); c0.close()
    ok('before: the homepage uses its built-in CSS picture (no custom hero)',not base['custom'] and 'main-hero-image' in base['before'],str(base))

    errs=[]; ctx,pg=new_page(b,errs,w=1500,h=1000); login(pg,'content'); go(pg,'heroes'); pg.wait_for_selector('#hr-list [data-k="index"]')
    print('== ACCEPTANCE: HOMEPAGE HERO ==')
    ok('every page and the 4 solution cards are listed',pg.evaluate("document.querySelectorAll('#hr-list [data-k]').length")>=38+4,str(pg.evaluate("document.querySelectorAll('#hr-list [data-k]').length")))
    pg.screenshot(path=SHOT+'03-page-heroes-list.png')
    pg.click('#hr-list [data-k="index"]'); pg.wait_for_selector('#hr-up',state='attached')
    ok('home offers the banner mode (its picture is drawn by CSS)','Full-width banner' in pg.inner_text('#hr-ed') and pg.is_checked('input[name=hm][value=banner]'))
    pg.set_input_files('#hr-up',IMG+'hero-red-blue.jpg'); pg.wait_for_selector('#ed-cv'); pg.wait_for_timeout(300)
    ok('uploading from the computer opens the crop editor preset to a wide banner shape',pg.input_value('#ed-as')=='2.3333',pg.input_value('#ed-as'))
    pg.fill('#ed-t','Homepage hero'); pg.fill('#ed-ae','A modern data centre'); pg.click('#ed-save'); pg.wait_for_selector('#ed-cv',state='detached',timeout=40000); pg.wait_for_selector('#hr-fc',timeout=10000)
    ok('the new photo is in the library (folder Heroes) and selected',sql("select folder from public.media where title='Homepage hero'")=='Heroes' and pg.query_selector('#hr-fc img') is not None)
    ok('alt text is pre-filled from the library',pg.input_value('#hr-ae')=='A modern data centre')
    box=pg.eval_on_selector('#hr-fc','e=>{const r=e.getBoundingClientRect();return [r.left,r.top,r.width,r.height]}'); pg.mouse.click(box[0]+box[2]*0.20,box[1]+box[3]*0.30); pg.wait_for_timeout(300)
    ok('clicking the picture sets the focal point (≈20%, 30%)',re.search(r'\((1[89]|2[0-2])%, (2[89]|3[0-2])%\)',pg.inner_text('#hr-ed')) is not None,pg.inner_text('#hr-ed')[:300])
    pg.evaluate("(()=>{const i=document.getElementById('hr-oo');i.value=60;i.dispatchEvent(new Event('input'))})()"); pg.select_option('#hr-h','tall'); pg.fill('#hr-ae','Server racks in a Kigali data centre'); pg.wait_for_timeout(1500)
    fr=[f for f in pg.frames if 'qx_preview' in f.url][0]
    pv=fr.evaluate("""(()=>{const h=document.querySelector('.hero'),i=h.querySelector('.qx-hero-media img');return {pos:getComputedStyle(i).objectPosition,ov:getComputedStyle(h.querySelector('.qx-hero-overlay')).opacity,minH:getComputedStyle(h).minHeight,alt:i.alt}})()""")
    ok('LIVE PREVIEW shows the draft instantly: focal point, 60% overlay, tall height, alt',pv['ov']=='0.6' and pv['minH']=='640px' and pv['pos'].startswith('20%') and 'Kigali' in pv['alt'],str(pv))
    pg.click('[data-dv="390px"]'); pg.wait_for_timeout(500); ok('mobile preview width applied',pg.evaluate("document.getElementById('hr-fr').style.width")=='390px')
    pg.click('[data-dv="1100px"]') if False else pg.click('[data-dv="100%"]'); pg.wait_for_timeout(800); pg.screenshot(path=SHOT+'04-hero-editor-preview.png',full_page=False)
    pg.click('#hr-sd'); pg.wait_for_selector('#hr-m .ok'); 
    ok('Save draft stores a draft only',sql("select count(*) from public.page_heroes_draft where page_key='index'")=='1' and sql("select count(*) from public.page_heroes where page_key='index'")=='0')
    c1,p1=pubpage(b); p1.goto(BASE+'/index.html'); p1.wait_for_load_state('networkidle'); p1.wait_for_timeout(800); d=hero_info(p1)
    ok('visitors still see the ORIGINAL hero while it is a draft',not d['custom'] and 'main-hero-image' in d['before'],str(d)); c1.close()
    ok('status in the list shows a draft is waiting','Draft waiting' in pg.inner_text('#hr-list [data-k="index"]'))
    pg.click('#hr-pub'); pg.click('#c3-ok'); pg.wait_for_selector('#hr-m .ok',timeout=10000)
    ok('Publish makes it live and consumes the draft',sql("select count(*) from public.page_heroes where page_key='index'")=='1' and sql("select count(*) from public.page_heroes_draft where page_key='index'")=='0')
    c2,p2=pubpage(b,1440,900,errs=[]); e2=[]; p2.on('pageerror',lambda e:e2.append(str(e))); p2.goto(BASE+'/index.html'); p2.wait_for_load_state('networkidle'); p2.wait_for_timeout(1200); d=hero_info(p2)
    p2.screenshot(path=SHOT+'11-home-after.png')
    ok('PUBLIC SITE shows the new hero: custom class, built-in CSS picture removed',d['custom'] and d['bg']=='none' and d['beforeDisp']=='none',str(d))
    ok('image comes from the media library storage and loads (naturalWidth>0)','/storage/v1/object/public/media/library/' in d['src'] and d['nat']>0,str(d))
    ok('focal point, overlay opacity/colour, tall height and alt text are applied',d['pos'].startswith('20%') and d['ov']=='0.6' and d['ovc']=='rgb(6, 38, 80)' and d['minH']=='640px' and 'Kigali' in d['alt'],str(d))
    ok('responsive <picture> sources for WebP are present',any('image/webp' in t for t in d['src_types']),str(d['src_types']))
    ok('the framed picture on the home page follows the new hero image (no old photo left behind)','/storage/v1/object/public/media/library/' in d['frame'] and 'main-hero-image' not in d['frame'],d['frame'][:120])
    ok('white heading text on the dark overlay',d['h1c']=='rgb(255, 255, 255)',d['h1c'])
    ok('desktop gets a large size (>=1280 px wide file)',W(d['src'])>=1280,d['src'][-40:])
    ok('no JavaScript errors on the public homepage',not e2,str(e2)); c2.close()
    c3,p3=pubpage(b,390,800); p3.goto(BASE+'/index.html'); p3.wait_for_load_state('networkidle'); p3.wait_for_timeout(1200); dm=hero_info(p3)
    p3.screenshot(path=SHOT+'12-home-mobile.png')
    ok('MOBILE gets a smaller file than desktop (≤800 px wide)',0<W(dm['src'])<=800 and W(dm['src'])<W(d['src']),f"{W(dm['src'])} vs {W(d['src'])}")
    ok('mobile hero has no horizontal overflow',not p3.evaluate('document.documentElement.scrollWidth>document.documentElement.clientWidth+1')); c3.close()

    print('== MOBILE-SPECIFIC PICTURE ==')
    go(pg,'heroes'); pg.click('#hr-list [data-k="index"]'); pg.wait_for_selector('#hr-pub')
    pg.evaluate("document.querySelector('#hr-ed details').open=true"); pg.click('[data-pd="mobile"]'); pg.wait_for_selector('#pk-g .qa3-card')
    # upload straight from the picker (an image not yet in the library)
    pg.set_input_files('#pk-up',IMG+'mobile-green.jpg'); pg.wait_for_selector('#ed-cv'); pg.fill('#ed-t','Mobile hero'); pg.select_option('#ed-as','orig'); pg.click('#ed-save'); pg.wait_for_selector('#ed-cv',state='detached',timeout=40000); pg.wait_for_timeout(800)
    mid=sql("select id from public.media where title='Mobile hero'")
    pg.click('#hr-pub'); pg.click('#c3-ok'); pg.wait_for_selector('#hr-m .ok',timeout=10000)
    c4,p4=pubpage(b,390,800); p4.goto(BASE+'/index.html'); p4.wait_for_load_state('networkidle'); p4.wait_for_timeout(1200); dm=hero_info(p4)
    ok('phones now load the MOBILE picture',mid in dm['src'],dm['src'][-80:]); c4.close()
    c5,p5=pubpage(b,1440,900); p5.goto(BASE+'/index.html'); p5.wait_for_load_state('networkidle'); p5.wait_for_timeout(1000); dd=hero_info(p5)
    ok('desktops still load the main picture',mid not in dd['src'] and '/library/' in dd['src'],dd['src'][-60:]); c5.close()

    print('== RESTORE PREVIOUS / BACK TO ORIGINAL ==')
    first_id=json.loads(sql("select config::text from public.page_heroes where page_key='index'"))['media']['desktop']
    go(pg,'heroes'); pg.click('#hr-list [data-k="index"]'); pg.wait_for_selector('#hr-pick'); pg.click('#hr-pick'); pg.wait_for_selector('#pk-g .qa3-card')
    pg.fill('#pk-q','Mobile'); pg.wait_for_timeout(300); pg.click('#pk-g .qa3-card >> nth=0'); pg.wait_for_selector('#hr-pub'); pg.click('#hr-pub'); pg.click('#c3-ok'); pg.wait_for_selector('#hr-m .ok',timeout=10000)
    cur=json.loads(sql("select config::text from public.page_heroes where page_key='index'"))['media']['desktop']; ok('second publish replaced the main picture',cur!=first_id)
    pg.click('#hr-rest'); pg.click('#c3-ok'); pg.wait_for_timeout(1500)
    ok('Restore previous brings the earlier picture back',json.loads(sql("select config::text from public.page_heroes where page_key='index'"))['media']['desktop']==first_id)
    c6,p6=pubpage(b,1440,900); p6.goto(BASE+'/index.html'); p6.wait_for_load_state('networkidle'); p6.wait_for_timeout(1000); ok('public site shows the restored picture',first_id in hero_info(p6)['src']); c6.close()
    pg.click('#hr-rm'); pg.click('#c3-ok'); pg.wait_for_timeout(1500)
    ok('Back to original removes the custom hero',sql("select count(*) from public.page_heroes where page_key='index'")=='0')
    c7,p7=pubpage(b,1440,900); p7.goto(BASE+'/index.html'); p7.evaluate('localStorage.clear();sessionStorage.clear()'); p7.reload(); p7.wait_for_load_state('networkidle'); p7.wait_for_timeout(1000); d7=hero_info(p7)
    ok('the original built-in hero is back exactly as before (background and framed picture)',not d7['custom'] and 'main-hero-image' in d7['before'] and 'main-hero-image' in d7['frame'],str(d7)); c7.close()
    ok('hero manager: no JS errors',not errs,str(errs[:3])); ctx.close(); b.close()
print(f'\nRESULT (heroes): {common.P} passed, {common.F} failed')
for x in common.FAILS: print('  FAILED:',x)
sys.exit(1 if common.F else 0)
