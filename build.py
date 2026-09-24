"""Assemble the static pages: src/<page>.html + shared partials -> <page>.html at the repo root.

Each page starts with a comment line:  <!-- title: ... | desc: ... | nav: pricing -->
Run:  python build.py
"""
import os, re

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'src')
part = lambda n: open(os.path.join(SRC, n), encoding='utf-8').read()
head, header, footer = part('_head.html'), part('_header.html'), part('_footer.html')

for name in sorted(os.listdir(SRC)):
    if name.startswith('_') or not name.endswith('.html'):
        continue
    body = part(name)
    meta = dict(kv.split(':', 1) for kv in re.match(r'<!--(.*?)-->', body).group(1).split('|'))
    meta = {k.strip(): v.strip() for k, v in meta.items()}
    body = re.sub(r'^<!--.*?-->\n', '', body, count=1)
    hdr = header
    if meta.get('nav'):
        hdr = hdr.replace(f'data-nav="{meta["nav"]}"', f'data-nav="{meta["nav"]}" aria-current="page"')
    page = ('<!doctype html>\n<html lang="en">\n<head>\n'
            + head.replace('{TITLE}', meta['title']).replace('{DESC}', meta['desc'])
            + '</head>\n<body>\n' + hdr + '<main>\n' + body + '</main>\n' + footer + '</body>\n</html>\n')
    open(os.path.join(HERE, name), 'w', encoding='utf-8').write(page)
    print('built', name)
