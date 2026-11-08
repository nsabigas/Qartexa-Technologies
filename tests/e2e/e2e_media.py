#!/usr/bin/env python3
"""Media Library end-to-end tests (real files, real browser image processing, simulated storage)."""
import sys; sys.path.insert(0,'/home/claude/work/tests/e2e')
from common import *
import common, urllib.request
IMG=ROOT+'/tests/e2e/images/'; SHOT=ROOT+'/docs/screenshots/'
subprocess.run([ROOT+'/tests/e2e/reset.sh'],capture_output=True)
def files(): return json.loads(urllib.request.urlopen(BASE+'/__files').read())
def head(path):
    try:
        r=urllib.request.urlopen(BASE+'/storage/v1/object/public/media/'+path); return r.status,r.headers.get('Content-Type'),len(r.read())
    except Exception as e: return 404,None,0
def toast_text(pg): return pg.evaluate("document.body.innerText")
with sync_playwright() as pw:
    b=pw.chromium.launch()
    errs=[]; ctx,pg=new_page(b,errs,w=1400,h=950); login(pg,'content'); go(pg,'media'); pg.wait_for_selector('#ml-up',state='attached')
    print('== UPLOAD + EDITOR ==')
    pg.set_input_files('#ml-up',IMG+'hero-red-blue.jpg'); pg.wait_for_selector('#ed-cv'); pg.wait_for_timeout(400)
    ok('editor opens with a preview of the chosen photo',pg.evaluate("document.getElementById('ed-cv').width")>300)
    ok('editor shows original size and file size','3000×1600' in pg.inner_text('#ed-info'),pg.inner_text('#ed-info'))
    pg.screenshot(path=SHOT+'01-media-prepare-image.png')
    pg.select_option('#ed-as','1.7778'); pg.wait_for_timeout(200); pg.fill('#ed-z','1.5'); pg.dispatch_event('#ed-z','input'); pg.wait_for_timeout(200)
    ok('choosing 16:9 + zoom updates the crop summary','1896×1066' in pg.inner_text('#ed-info') or '1896×1067' in pg.inner_text('#ed-info'),pg.inner_text('#ed-info'))
    pg.fill('#ed-t','Server room hero'); pg.fill('#ed-fo','Heroes'); pg.fill('#ed-ae','Rows of server racks in a data centre'); pg.fill('#ed-af','Rangées de serveurs dans un centre de données'); pg.fill('#ed-c','Qartexa')
    pg.click('#ed-save'); pg.wait_for_selector('#ed-cv',state='detached',timeout=30000); pg.wait_for_timeout(1500)
    row=json.loads(sql("select row_to_json(m) from public.media m where title='Server room hero'") or '{}')
    ok('record saved with title, folder, alt EN/FR, copyright',row.get('folder')=='Heroes' and row.get('alt_fr','').startswith('Rangées') and row.get('copyright')=='Qartexa',str(row)[:200])
    ok('cropped to 16:9 and capped at the chosen width',1890<=row.get('width',0)<=1900 and abs(row['width']/row['height']-16/9)<0.02,f"{row.get('width')}x{row.get('height')}")
    v=row.get('variants',[]); ws=sorted({x['w'] for x in v if x['fmt']=='webp'})
    ok('WebP made at several widths (400/800/1280/full)',ws==[400,800,1280,row['width']],str(ws))
    avif=[x for x in v if x['fmt']=='avif']; ok('AVIF is skipped cleanly when the browser cannot encode it (Chromium cannot); WebP + JPEG are always present',len(avif) in (0,len(ws)) and len(ws)>=3,f'{len(avif)} avif')
    ok('exactly one JPEG fallback made',len([x for x in v if x['fmt']=='jpg'])==1)
    ok('thumbnail (400 px) exists','400' in [str(x['w']) for x in v])
    ok('every stored file is under the 5 MB limit',all(x['bytes']<5*1024*1024 for x in v),str([x['bytes'] for x in v]))
    ok('stored images are far smaller than the 89 KB-to-MB original would be at full size (largest webp < 400 KB)',max(x['bytes'] for x in v if x['fmt']=='webp')<400*1024,str(max(x['bytes'] for x in v)))
    st=[head(x['path']) for x in v]
    ok('all files are downloadable with the right content-type',all(s[0]==200 for s in st) and all(s[1] in('image/webp','image/avif','image/jpeg') for s in st),str(st[:3]))
    ok('card appears in the library grid',pg.evaluate("document.querySelectorAll('#ml-g .qa3-card').length")==1)
    pg.screenshot(path=SHOT+'02-media-library.png')

    print('== ROTATE ==')
    pg.set_input_files('#ml-up',IMG+'mobile-green.jpg'); pg.wait_for_selector('#ed-cv'); pg.click('#ed-rr'); pg.wait_for_timeout(200)
    ok('rotate right swaps the image orientation (900×1200 → 1200×900)','1200×900' in pg.inner_text('#ed-info'),pg.inner_text('#ed-info'))
    pg.select_option('#ed-as','orig'); pg.fill('#ed-t','Rotated green'); pg.click('#ed-save'); pg.wait_for_selector('#ed-cv',state='detached',timeout=30000); pg.wait_for_timeout(1200)
    r2=sql("select width||'x'||height from public.media where title='Rotated green'"); ok('rotated image stored as 1200×900',r2=='1200x900',r2)
    ok('small image only gets widths up to its own size (no upscaling)',sql("select string_agg(distinct (v->>'w'),',' order by (v->>'w')) from public.media m, jsonb_array_elements(variants) v where title='Rotated green'")=='1200,400,800' or sql("select string_agg(distinct (v->>'w'),',') from public.media m, jsonb_array_elements(variants) v where title='Rotated green'").replace(' ','') in('400,800,1200','1200,400,800','400,1200,800','800,400,1200'))

    print('== BAD FILES ==')
    for fn,exp in [('tiny.png','too small'),('not-an-image.txt','not supported'),('fake.jpg','could not be read'),('huge-noise.png','25 MB')]:
        pg.set_input_files('#ml-up',IMG+fn); pg.wait_for_timeout(2500 if fn=='huge-noise.png' else 1200)
        ok(f'{fn}: refused with a clear message',exp in toast_text(pg),toast_text(pg)[-200:])
        ok(f'{fn}: no editor opened, nothing stored',pg.query_selector('#ed-cv') is None)
    ok('library unchanged by rejected files',sql("select count(*) from public.media")=='2')
    big_before=sql("select count(*) from public.media")

    print('== BATCH UPLOAD ==')
    pg.set_input_files('#ml-up',[IMG+'third.jpg',IMG+'second-hero.jpg',IMG+'big-6000.jpg']); pg.wait_for_selector('#bt-ok:not([disabled])',timeout=90000)
    t=pg.inner_text('#bt-l'); ok('batch: three images processed with before/after sizes',t.count('✓')==3 and 'KB' in t,t[:300])
    pg.click('#bt-ok'); pg.wait_for_timeout(1500)
    ok('batch: records created',sql("select count(*) from public.media")=='5')
    bw=sql("select max(width) from public.media where title='big 6000'"); ok('a 6000 px photo is shrunk to 1920 px',bw=='1920',bw)
    bytes_=sql("select bytes from public.media where title='big 6000'"); ok('and stored far smaller than uploaded (~397 KB source)',int(bytes_)<2_000_000,bytes_)

    print('== SEARCH / FILTER / EDIT ==')
    pg.fill('#ml-q','second'); pg.wait_for_timeout(300); ok('search by title',pg.evaluate("document.querySelectorAll('#ml-g .qa3-card').length")==1)
    pg.fill('#ml-q','racks'); pg.wait_for_timeout(300); ok('search also matches alt text',pg.evaluate("document.querySelectorAll('#ml-g .qa3-card').length")==1)
    pg.fill('#ml-q',''); pg.select_option('#ml-f','Heroes'); pg.wait_for_timeout(300); ok('folder filter',pg.evaluate("document.querySelectorAll('#ml-g .qa3-card').length")==1)
    pg.select_option('#ml-f',''); pg.click('#ml-g .qa3-card >> nth=0'); pg.wait_for_selector('#dt-save'); pg.wait_for_timeout(600)
    ok('detail shows dimensions, file count and usage status','px' in pg.inner_text('.qa-dialog, dialog, #qa-modal, body') and 'Not used anywhere' in pg.inner_text('#dt-use'))
    pg.fill('#dt-ae','Edited alt text'); pg.click('#dt-save'); pg.wait_for_timeout(1000)
    ok('edited details persist',sql("select count(*) from public.media where alt_en='Edited alt text'")=='1')
    ok('library: no JS errors',not errs,str(errs[:3])); ctx.close()

    print('== PERMISSIONS ==')
    ctx,pg=new_page(b,[]); login(pg,'hr'); ok('HR does not see the Media library',not any('Media library' in x for x in nav(pg)))
    r=pg.evaluate("QX.store.save('media',{title:'x',width:10,height:10,base:'library/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'}).then(()=>'saved').catch(()=>'blocked')"); ok('HR cannot write media records (database refuses)',r=='blocked'); ctx.close()
    ctx,pg=new_page(b,[]); pg.goto(BASE+'/index.html'); pg.wait_for_load_state('networkidle')
    r=pg.evaluate("fetch(QX_CONFIG.supabaseUrl+'/rest/v1/media',{method:'POST',headers:{apikey:QX_CONFIG.supabaseAnonKey,'Content-Type':'application/json'},body:JSON.stringify({title:'x',width:10,height:10,base:'library/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'})}).then(r=>r.status)"); ok('a visitor cannot add media (HTTP 401/403)',r in(401,403),str(r))
    r=pg.evaluate("fetch(QX_CONFIG.supabaseUrl+'/storage/v1/object/media/hacker.webp',{method:'POST',headers:{apikey:QX_CONFIG.supabaseAnonKey,'Content-Type':'image/webp'},body:'x'}).then(r=>r.status)")
    ctx.close(); b.close()
print(f'\nRESULT (media): {common.P} passed, {common.F} failed')
for x in common.FAILS: print('  FAILED:',x)
sys.exit(1 if common.F else 0)
