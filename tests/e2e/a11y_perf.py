#!/usr/bin/env python3
"""Accessibility (axe-core, WCAG 2.1 A/AA rules) + page weight / timing on key pages."""
import sys; sys.path.insert(0,'/home/claude/work/tests/e2e')
from common import *
AXE=open('/tmp/si/node_modules/axe-core/axe.min.js').read()
def scan(pg,label):
    pg.evaluate(AXE)
    r=pg.evaluate("axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}).then(r=>r.violations.map(v=>({id:v.id,impact:v.impact,n:v.nodes.length,help:v.help,ex:v.nodes[0].target.join(' ').slice(0,80)})))")
    ser=[v for v in r if v['impact'] in ('serious','critical')]
    print(f'{label}: {len(r)} issue types, {len(ser)} serious/critical')
    for v in r: print('    ',v['impact'],v['id'],'x'+str(v['n']),'|',v['help'],'|',v['ex'])
    return r
with sync_playwright() as pw:
    b=pw.chromium.launch(); res={}
    for rel in ['index.html','contact.html','careers.html','job.html?s=network-engineer','tenders.html','form.html?f=project-enquiry']:
        c,pg=new_page(b,[]); pg.goto(BASE+'/'+rel); pg.wait_for_load_state('networkidle'); pg.wait_for_timeout(700); res[rel]=scan(pg,rel); c.close()
    c,pg=new_page(b,[]); login(pg,'editor'); go(pg,'appearance'); pg.wait_for_selector('#ap-frame'); pg.wait_for_timeout(1200); res['appearance']=scan(pg,'admin: appearance'); 
    go(pg,'social'); pg.wait_for_selector('.qa2-list'); res['social']=scan(pg,'admin: social'); go(pg,'forms'); pg.wait_for_selector('.qa2-list'); res['forms']=scan(pg,'admin: forms'); c.close()
    print('\n== PAGE WEIGHT (home, contact, careers; cold cache) ==')
    for rel in ['index.html','contact.html','careers.html']:
        c=b.new_context(); pg=c.new_page(); tot=[0]; reqs=[0]
        pg.on('response',lambda r:(tot.__setitem__(0,tot[0]+len(r.body() if r.ok else b'')),reqs.__setitem__(0,reqs[0]+1)) if r.status==200 else None)
        t=time.time(); pg.goto(BASE+'/'+rel); pg.wait_for_load_state('networkidle'); el=time.time()-t
        print(f'{rel}: {reqs[0]} requests, {tot[0]/1024:.0f} KB transferred (uncompressed, local), loaded in {el:.2f}s'); c.close()
    sz=lambda f:os.path.getsize(ROOT+'/'+f)/1024
    print('\nNew/changed JS (uncompressed KB):',{f:round(sz('js/'+f)) for f in ['qx-theme.js','qx-forms.js','qx-icons.js','qx-core.js','qx-cms.js','qx-admin2.js']})
    print('  public pages load qx-theme.js on every page (~%.0f KB); qx-forms.js only on Contact/form pages; qx-icons.js only when social links exist.'%sz('js/qx-theme.js'))
    b.close()
