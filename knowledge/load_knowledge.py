"""Load the website's knowledge base into a SEPARATE GroundedOps instance.

The website bot must never see a real customer corpus, so it gets its own data
folder. Every GroundedOps store defaults to a path relative to the working
directory, so running from the data folder keeps all of them there.

    python load_knowledge.py --src C:/.../groundedops/src --data C:/.../groundedops-site-bot

Safe to re-run: documents are replaced, FAQ entries that already exist are skipped.
"""
import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
CATEGORY, PRODUCT, NAME = 'groundedops', 'groundedops', 'GroundedOps'
PRODUCT_NAME = 'GroundedOps software'

WIDGET = {
    'name': 'GroundedOps',
    'welcome': 'Hi! Ask me anything about GroundedOps: what it does, pricing, licensing, '
               'installing it, or where your data goes. I’ll show you where each answer comes from.',
    'color': '#1A262C',
    'intro_options': [
        {'id': 'opt_product', 'label': 'Ask about GroundedOps', 'action': 'product'},
        {'id': 'opt_sales', 'label': 'Talk to the team', 'action': 'sales'},
    ],
    'sales_form': {
        'title': 'Talk to the team', 'allow_summary': True, 'notify_email': '',
        'fields': [
            {'id': 'f_name', 'label': 'Your name', 'type': 'text', 'required': True},
            {'id': 'f_email', 'label': 'Work email', 'type': 'email', 'required': True},
            {'id': 'f_company', 'label': 'Company', 'type': 'text', 'required': False},
            {'id': 'f_msg', 'label': 'What would you like to know?', 'type': 'textarea', 'required': False},
        ],
    },
    'support_form': {
        'title': 'Get help', 'allow_summary': True, 'notify_email': '',
        'fields': [
            {'id': 's_name', 'label': 'Your name', 'type': 'text', 'required': True},
            {'id': 's_email', 'label': 'Email', 'type': 'email', 'required': True},
            {'id': 's_msg', 'label': 'What do you need help with?', 'type': 'textarea', 'required': False},
        ],
    },
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', required=True, help='GroundedOps src directory')
    ap.add_argument('--data', required=True, help='data folder for the website bot instance')
    args = ap.parse_args()
    src, data = os.path.abspath(args.src), os.path.abspath(args.data)
    if os.path.samefile(src, data) if os.path.exists(data) else False:
        sys.exit('Refusing to load into the src folder: that is where the real corpus lives.')
    os.makedirs(data, exist_ok=True)
    os.chdir(data)
    sys.path.insert(0, src)

    # Same .env the server reads (provider keys, model settings); real env wins.
    env = os.path.join(src, '.env')
    if os.path.isfile(env):
        for line in open(env, encoding='utf-8-sig'):
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, _, v = line.partition('=')
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

    # An empty catalogue makes GroundedOps fall back to its built-in seed of
    # real product ranges, so write this bot's one-product catalogue first.
    cat_path = os.environ.get('CATALOG_CONFIG', 'catalog_config.json')
    existing = json.load(open(cat_path, encoding='utf-8')) if os.path.isfile(cat_path) else {}
    other = [c['key'] for c in existing.get('categories', []) if c['key'] != CATEGORY]
    if other:
        sys.exit(f'This data folder already has other categories {other}: not the website bot. Stopping.')
    if not existing.get('categories'):
        with open(cat_path, 'w', encoding='utf-8') as fh:
            json.dump({'categories': [{'key': CATEGORY, 'name': NAME, 'products': [
                {'key': PRODUCT, 'name': PRODUCT_NAME, 'sources': []}]}]}, fh, indent=2)
        print('catalogue created')

    # These docs are short and dense: at the default 1200 characters one chunk
    # spans several topics and a short question scores weakly against all of
    # them. ~450 keeps roughly one topic paragraph per chunk.
    os.environ['CHUNK_SIZE'] = os.environ.get('SITE_BOT_CHUNK_SIZE', '450')

    # torch (under sentence_transformers) must load before chromadb and on the
    # main thread, as main.py does at startup, or Windows can crash the process.
    import faulthandler
    faulthandler.enable()
    import sentence_transformers  # noqa: F401

    import catalog
    import faq_store
    import widget_config
    from db import delete_source
    from ingest import ingest_file

    keys = [c['key'] for c in catalog.catalog().get('categories', [])]
    if keys != [CATEGORY]:
        sys.exit(f'Unexpected catalogue {keys}: stopping before anything is loaded.')

    widget_config.save(WIDGET)
    print('widget settings saved')

    docs = os.path.join(HERE, 'docs')
    for fn in sorted(os.listdir(docs)):
        if not fn.lower().endswith(('.txt', '.pdf', '.docx')):
            continue
        delete_source(fn)   # unchanged files are skipped as duplicates; always rebuild
        with open(os.path.join(docs, fn), 'rb') as fh:
            n = ingest_file(fh.read(), fn, category_key=CATEGORY, product_key=PRODUCT, replace_existing=True)
        catalog.attach_source(CATEGORY, PRODUCT, fn)
        print(f'doc  {n:3d} chunks  {fn}')

    faqs = json.load(open(os.path.join(HERE, 'faqs.json'), encoding='utf-8'))
    added = skipped = 0
    for f in faqs:
        try:
            faq_store.add_entry(f['q'], f['a'], products=PRODUCT, category=CATEGORY, source='website-faq')
            added += 1
        except ValueError:
            skipped += 1
    print(f'faq  {added} added, {skipped} already there')


if __name__ == '__main__':
    main()
