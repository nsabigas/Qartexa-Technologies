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
def go(pg,sec):
    pg.click(f'#qa-nav button[data-s="{sec}"]'); pg.wait_for_timeout(900)
def pubrows(pg,table): return pg.evaluate(f"QX.store.list('{table}',{{}})")

