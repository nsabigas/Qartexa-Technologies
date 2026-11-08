#!/usr/bin/env python3
"""Layout regression test for the Solutions and Industries overview pages (the 'squeezed cards' bug)."""
import sys; sys.path.insert(0,'/home/claude/work/tests/e2e')
from common import *
import common
JS="""()=>{
 const fam=[...document.querySelectorAll('.phase82-families>.content-family')];
 const cont=document.querySelector('.phase82-families').getBoundingClientRect();
 const cards=[...document.querySelectorAll('.phase82-families .page-card')];
 const clipped=[];
 cards.forEach(c=>{const cr=c.getBoundingClientRect();c.querySelectorAll('h3,p,.link').forEach(e=>{const r=e.getBoundingClientRect();
   if(e.scrollWidth>e.clientWidth+1||r.right>cr.right+1||r.left<cr.left-1)clipped.push((e.textContent||'').trim().slice(0,30));});});
 const tops=fam.map(f=>Math.round(f.getBoundingClientRect().top));
 return {fam:fam.length,famW:fam.map(f=>Math.round(f.getBoundingClientRect().width)),contW:Math.round(cont.width),
  stacked:tops.every((t,i)=>i===0||t>tops[i-1]+100),
  cards:cards.length,minW:Math.min(...cards.map(c=>Math.round(c.getBoundingClientRect().width))),
  clipped:clipped,imgsBroken:[...document.querySelectorAll('.phase82-families .page-card-image')].filter(i=>!i.complete||i.naturalWidth===0).length,
  hscroll:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,
  cols:fam.map(f=>getComputedStyle(f.querySelector('.family-items')).gridTemplateColumns.split(' ').length)}}"""
with sync_playwright() as pw:
    b=pw.chromium.launch()
    for page,nf,nc in [('solutions/index.html',4,11),('industries/index.html',3,9)]:
        for w,mincol in [(1910,4),(1280,3),(1024,2),(768,2),(390,1)]:
            errs=[]; c,p=new_page(b,errs,w=w,h=900); p.goto(BASE+'/'+page); p.wait_for_load_state('networkidle'); p.wait_for_timeout(500)
            p.evaluate("document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager')"); p.wait_for_timeout(900)
            r=p.evaluate(JS); tag=f'{page.split("/")[0]} @{w}px'
            ok(f'{tag}: {nf} practice groups, each a full-width row stacked top to bottom',r['fam']==nf and r['stacked'] and all(abs(x-r['contW'])<=2 for x in r['famW']),str(r))
            ok(f'{tag}: {nc} cards present, none narrower than {240 if w>=1024 else (200 if w>=700 else 300)} px',r['cards']==nc and r['minW']>=(240 if w>=1024 else (200 if w>=700 else 300)),f"{r['cards']} cards, min {r['minW']}px")
            ok(f'{tag}: no heading, description or link is clipped or overflowing its card',not r['clipped'],str(r['clipped']))
            ok(f'{tag}: all card pictures load',r['imgsBroken']==0,str(r['imgsBroken']))
            ok(f'{tag}: no sideways scrolling',not r['hscroll'])
            ok(f'{tag}: no JavaScript errors',not errs,str(errs[:2]))
            c.close()
    b.close()
print(f'\nRESULT (layout): {common.P} passed, {common.F} failed')
for x in common.FAILS: print('  FAILED:',x)
sys.exit(1 if common.F else 0)
