#!/usr/bin/env python3
"""Adds editing keys (data-cms ...) to every editable text, image and link on every page.
Safe to run again: elements that already have a key are left alone. Run from the website root:
    python3 tools/tag-cms.py
Run it after you add a NEW page or new text by hand, so the visual editor can edit it.
Needs Python 3 and: pip install beautifulsoup4"""
import re, glob, os, hashlib, html as _html
from bs4 import BeautifulSoup
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP_PAGES = {'admin.html'}
def h(s): return hashlib.sha1(s.encode('utf-8')).hexdigest()[:6]
def norm_href(x): return re.sub(r'^(\.\./)+', '', x or '')
def frmap(src):
    m = re.search(r'frText\s*=\s*\{(.*?)\}\s*;', src, re.S)
    if not m: return {}
    d = re.findall(r"'((?:[^'\\]|\\.)*)'\s*:\s*'((?:[^'\\]|\\.)*)'", m.group(1))
    return {k.replace("\\'", "'"): v.replace("\\'", "'") for k, v in d}
GLOBAL_FR = frmap(open(os.path.join(root, 'index.html'), encoding='utf-8').read())
total = {'text': 0, 'plain': 0, 'img': 0, 'link': 0, 'bg': 0}
for f in sorted(glob.glob(os.path.join(root, '**', '*.html'), recursive=True)):
    rel = os.path.relpath(f, root).replace('\\', '/')
    if rel in SKIP_PAGES: continue
    raw = open(f, encoding='utf-8', newline='').read()
    text = raw.replace('\r\n', '\n')
    soup = BeautifulSoup(text, 'html.parser')
    FR = dict(GLOBAL_FR); FR.update(frmap(text))
    slug = rel[:-5].replace('/', '_')
    lines = text.split('\n'); offs = [0]
    for l in lines: offs.append(offs[-1] + len(l) + 1)
    pos = lambda t: offs[t.sourceline - 1] + t.sourcepos
    ins = []; counters = {}
    def uniq(base):
        counters[base] = counters.get(base, 0) + 1
        return base if counters[base] == 1 else '%s-%d' % (base, counters[base])
    def region(e):
        if e.find_parent(class_='topbar'): return 't'
        if soup.header and soup.header in e.parents: return 'h'
        if soup.footer and soup.footer in e.parents: return 'f'
        if soup.main and soup.main in e.parents: return 'm'
        return None
    def attr_ins(e, attr, val): ins.append((pos(e) + 1 + len(e.name), ' %s="%s"' % (attr, val)))
    m = re.search(r'<html\b', text, re.I)
    if m and 'data-cms-page' not in text[m.start():m.start() + 200]: ins.append((m.end(), ' data-cms-page="%s"' % slug))
    for e in soup.find_all(True):
        if e.name in ('script', 'style', 'html', 'head', 'body', 'meta', 'link', 'title', 'svg', 'path'): continue
        r = region(e)
        if not r: continue
        if e.find_parent(id='qx-root') or e.get('id') == 'qx-root': continue
        glob_ = r in 'thf'
        scope = 'g.' + r if glob_ else 'p.' + slug
        has_pair = e.has_attr('data-en') and e.has_attr('data-fr')
        anc_pair = any(p.has_attr('data-en') and p.has_attr('data-fr') for p in e.parents if getattr(p, 'name', None))
        if has_pair and not e.has_attr('data-cms') and not anc_pair:
            attr_ins(e, 'data-cms', uniq(scope + '.' + h(e['data-en']))); total['text'] += 1
        elif not has_pair and not e.has_attr('data-cms') and not anc_pair and e.name not in ('img', 'label', 'textarea', 'select', 'option', 'input', 'form'):
            kids = [c for c in e.children if getattr(c, 'name', None)]
            txt = e.get_text(' ', strip=True) if not kids else ''
            if txt and txt in FR and not e.find_parent('svg'):
                ins.append((pos(e) + 1 + len(e.name), ' data-en="%s" data-fr="%s" data-cms="%s"' % (_html.escape(txt, quote=True), _html.escape(FR[txt], quote=True), uniq(scope + '.' + h(txt))))); total['plain'] += 1
        if e.name == 'img' and not e.has_attr('data-cms-img') and not e.has_attr('data-cms-logo'):
            if e.find_parent(class_='partner-logo'): continue
            cls = e.get('class') or []
            if r == 'h' and e.find_parent(class_='brand'): attr_ins(e, 'data-cms-logo', 'header')
            elif 'footer-logo' in cls: attr_ins(e, 'data-cms-logo', 'footer')
            else:
                base = os.path.basename(e.get('src', ''))
                attr_ins(e, 'data-cms-img', uniq(('i.g.' + r if glob_ else 'i.' + slug) + '.' + h(base))); total['img'] += 1
        if e.name == 'span' and 'frame' in (e.get('class') or []) and e.find_parent(class_='hero-visual') and not e.has_attr('data-cms-bg'):
            attr_ins(e, 'data-cms-bg', 'i.%s.hero' % slug); total['bg'] += 1
        if e.name == 'a' and e.get('href') and not e.has_attr('data-cms-link'):
            hr = e['href']
            if hr.startswith('#'): continue
            label = e.get_text(' ', strip=True)
            attr_ins(e, 'data-cms-link', uniq(('l.g' if glob_ else 'l.' + slug) + '.' + h(norm_href(hr) + '|' + label))); total['link'] += 1
    if not ins: continue
    out = text
    for p, s in sorted(ins, key=lambda x: x[0], reverse=True): out = out[:p] + s + out[p:]
    open(f, 'w', encoding='utf-8', newline='').write(out.replace('\n', '\r\n') if '\r\n' in raw else out)
print('tagged', total)
