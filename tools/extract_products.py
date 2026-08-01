#!/usr/bin/env python3
"""Extract product data from the WooCommerce CSV + WP XML into typed JSON for Astro.

Read-only against all source exports.
"""
import csv, json, os, re, sys, html
from collections import OrderedDict
import xml.etree.ElementTree as ET

# Paths are resolved relative to this file so the tools work from any checkout.
PROJ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# The private WordPress exports live one directory above the Astro project.
# Override with HDT_EXPORTS. They are only ever read, never written to.
SRC = os.environ.get("HDT_EXPORTS", os.path.dirname(PROJ))


OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PROJ, "src/data")
CSV_FILE = os.path.join(SRC, "wc-product-export-30-7-2026-1785419397757.csv")
XML_FILE = os.path.join(SRC, "hotdogtrays.WordPress.2026-07-30 (1).xml")
NS = {
    'wp': 'http://wordpress.org/export/1.2/',
    'content': 'http://purl.org/rss/1.0/modules/content/',
    'excerpt': 'http://wordpress.org/export/1.2/excerpt/',
}
SITE = "https://hotdogtrays.com"

# ---------------------------------------------------------------- HTML cleaning

# Wrapper elements pasted in from a ChatGPT conversation export. Their *text*
# is real product copy; only the wrappers are residue.
JUNK_ATTR_RE = re.compile(
    r'\s+(?:data-(?:start|end|is-last-node|is-only-node|turn-id|turn|testid|'
    r'scroll-anchor|message-author-role|message-id|message-model-slug)|'
    r'dir|tabindex|translate)="[^"]*"',
    re.I)
JUNK_ATTR_BARE_RE = re.compile(r'\s+data-(?:is-last-node|is-only-node)(?=[\s>])', re.I)
# Tailwind-ish class soup from the ChatGPT paste, plus WP/Elementor classes.
CLASS_RE = re.compile(r'\s+class="[^"]*"', re.I)
STYLE_RE = re.compile(r'\s+style="[^"]*"', re.I)
# Structural wrappers to unwrap entirely (keep children).
UNWRAP_TAGS = ('article', 'div', 'span', 'section', 'figure', 'figcaption')
WP_SHORTCODE_RE = re.compile(r'\[/?[a-z0-9_\-]+(?:\s[^\]]*)?\]', re.I)
COMMENT_RE = re.compile(r'<!--.*?-->', re.S)


def unwrap(tag_html: str) -> str:
    """Remove <div>/<span>/<article> wrappers but keep their inner content."""
    for t in UNWRAP_TAGS:
        tag_html = re.sub(rf'</?{t}\b[^>]*>', '', tag_html, flags=re.I)
    return tag_html


BLOCK_TAGS = ('h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'thead', 'tbody', 'tfoot',
              'tr', 'td', 'th', 'ul', 'ol', 'li', 'blockquote', 'pre', 'p', 'figure',
              'hr', 'dl', 'dt', 'dd')
BLOCK_RE = re.compile(r'^\s*</?(?:' + '|'.join(BLOCK_TAGS) + r')\b', re.I)


def wpautop(s: str) -> str:
    """Approximate WordPress wpautop: blank-line separated text becomes <p>.

    The WooCommerce export stores paragraph breaks as the two-character
    sequence backslash-n, so those are normalised to real newlines first.
    """
    s = s.replace('\\n', '\n')
    s = re.sub(r'\r\n?', '\n', s)
    # keep block-level tags on their own lines so the split below sees them
    s = re.sub(r'(</?(?:' + '|'.join(BLOCK_TAGS) + r')\b[^>]*>)', r'\n\1\n', s, flags=re.I)
    out = []
    for chunk in re.split(r'\n\s*\n+', s):
        chunk = chunk.strip()
        if not chunk:
            continue
        if BLOCK_RE.match(chunk):
            out.append(chunk)
        else:
            # a run of inline content -> one paragraph
            out.append('<p>' + re.sub(r'\n+', ' ', chunk).strip() + '</p>')
    return '\n'.join(out)


def clean_html(raw: str, autop: bool = True) -> str:
    if not raw:
        return ''
    s = raw
    s = COMMENT_RE.sub('', s)
    s = re.sub(r'<script.*?</script>', '', s, flags=re.S | re.I)
    s = re.sub(r'<style.*?</style>', '', s, flags=re.S | re.I)
    s = WP_SHORTCODE_RE.sub('', s)
    s = unwrap(s)
    s = JUNK_ATTR_RE.sub('', s)
    s = JUNK_ATTR_BARE_RE.sub('', s)
    s = CLASS_RE.sub('', s)
    s = STYLE_RE.sub('', s)
    if autop:
        s = wpautop(s)
        # wpautop must not paragraph-wrap the inside of list items or cells
        for tag in ('li', 'td', 'th'):
            s = re.sub(rf'(<{tag}\b[^>]*>)\s*<p>(.*?)</p>\s*(</{tag}>)',
                       r'\1\2\3', s, flags=re.S | re.I)
    # normalise internal links to root-relative with trailing slash, then
    # point any consolidated destination straight at its replacement
    s = re.sub(r'href="https?://(?:www\.)?hotdogtrays\.com(/[^"]*?)"',
               lambda m: 'href="' + ensure_slash(m.group(1)) + '"', s)
    for old_url, new_url in LINK_CONSOLIDATION.items():
        s = s.replace(f'href="{old_url}"', f'href="{new_url}"')
    # drop empty inline/blocks left behind
    for _ in range(4):
        s = re.sub(r'<(p|strong|em|li|h[1-6])>\s*</\1>', '', s, flags=re.I)
    # wpautop can leave an unmatched <p> where a heading was split off; drop any
    # <p> that is immediately followed by another block-level opener
    for _ in range(3):
        s = re.sub(r'<p>\s*(?=<(?:p|h[1-6]|ul|ol|table|blockquote)\b)', '', s, flags=re.I)
        s = re.sub(r'</p>\s*</p>', '</p>', s, flags=re.I)
    s = re.sub(r'\s*\n\s*\n+', '\n', s)
    s = re.sub(r'[ \t]{2,}', ' ', s)
    return s.strip()


# Destinations consolidated during the SEO cleanup. Internal links are
# rewritten to the final URL so none of them travels through a redirect.
LINK_CONSOLIDATION = {
    '/product-category/products/': '/shop/',
    '/product-category/products': '/shop/',
    '/returns-policy/': '/terms-conditions/',
}


def ensure_slash(path: str) -> str:
    if not path.startswith('/'):
        return path
    if re.search(r'\.[a-z0-9]{2,5}$', path, re.I) or '?' in path or '#' in path:
        return path
    return path if path.endswith('/') else path + '/'


def strip_tags(s: str) -> str:
    """Plain text from an HTML fragment, with entities decoded.

    Table cells are rendered as text, so a literal '&amp;' left in the value
    would show up on the page instead of an ampersand.
    """
    text = re.sub(r'<[^>]+>', ' ', s)
    text = html.unescape(text)
    return re.sub(r'\s+', ' ', text).strip()


# ---------------------------------------------------------------- WP XML

def load_xml():
    ch = ET.parse(XML_FILE).getroot().find('channel')
    attachments, products, terms = {}, {}, {}
    for it in ch.findall('item'):
        pt = it.findtext('wp:post_type', namespaces=NS)
        meta = {m.findtext('wp:meta_key', namespaces=NS):
                (m.findtext('wp:meta_value', namespaces=NS) or '')
                for m in it.findall('wp:postmeta', namespaces=NS)}
        pid = it.findtext('wp:post_id', namespaces=NS)
        if pt == 'attachment':
            url = it.findtext('wp:attachment_url', namespaces=NS) or ''
            attachments[url] = {
                'id': pid,
                'alt': meta.get('_wp_attachment_image_alt', '') or '',
                'title': it.findtext('title') or '',
                'file': url.rsplit('/', 1)[-1],
            }
        elif pt == 'product':
            products[pid] = {
                'slug': it.findtext('wp:post_name', namespaces=NS),
                'title': it.findtext('title'),
                'link': it.findtext('link'),
                'meta': meta,
                'cats': [c.text for c in it.findall('category')
                         if c.get('domain') == 'product_cat'],
            }
    for tm in ch.findall('wp:term', namespaces=NS):
        tax = tm.findtext('wp:term_taxonomy', namespaces=NS)
        if tax == 'product_cat':
            terms[tm.findtext('wp:term_slug', namespaces=NS)] = {
                'name': tm.findtext('wp:term_name', namespaces=NS),
                'desc': tm.findtext('wp:term_description', namespaces=NS) or '',
            }
    return attachments, products, terms


# ---------------------------------------------------------------- spec / faq

def parse_specs(raw: str):
    """_bhww_specifications_wysiwyg -> {headers: [...], rows: [[...]]}.

    The source is a real multi-column HTML table; the full grid is preserved
    rather than being flattened into label/value pairs.
    """
    s = clean_html(raw, autop=False)
    headers, rows = [], []
    thead = re.search(r'<thead[^>]*>(.*?)</thead>', s, re.S | re.I)
    if thead:
        headers = [strip_tags(c) for c in
                   re.findall(r'<t[hd][^>]*>(.*?)</t[hd]>', thead.group(1), re.S | re.I)]
    body = re.search(r'<tbody[^>]*>(.*?)</tbody>', s, re.S | re.I)
    scope = body.group(1) if body else s
    for m in re.finditer(r'<tr[^>]*>(.*?)</tr>', scope, re.S | re.I):
        cells = [strip_tags(c) for c in
                 re.findall(r'<t[hd][^>]*>(.*?)</t[hd]>', m.group(1), re.S | re.I)]
        if not any(cells):
            continue
        if not headers and all(re.search(r'<th\b', c, re.I) for c in
                               re.findall(r'(<t[hd][^>]*>)', m.group(1), re.I)):
            headers = cells
            continue
        rows.append(cells)
    if headers or rows:
        width = max([len(headers)] + [len(r) for r in rows] or [0])
        rows = [r + [''] * (width - len(r)) for r in rows]
        if headers:
            headers = headers + [''] * (width - len(headers))
        return {'headers': headers, 'rows': rows}
    # fall back to "Label: value" list items
    pairs = []
    for m in re.finditer(r'<li[^>]*>(.*?)</li>', s, re.S | re.I):
        txt = strip_tags(m.group(1))
        if ':' in txt:
            k, v = txt.split(':', 1)
            pairs.append([k.strip(), v.strip()])
    return {'headers': ['Specification', 'Details'], 'rows': pairs} if pairs else {'headers': [], 'rows': []}


def parse_faqs(raw: str):
    """_bhww_faqs_wysiwyg -> list of {question, answer(html)}."""
    s = clean_html(raw)
    faqs = []
    # pattern: <h3>Q</h3><p>A</p>... (headings h2-h4)
    chunks = re.split(r'<(h[2-4])[^>]*>(.*?)</\1>', s, flags=re.S | re.I)
    if len(chunks) > 1:
        i = 1
        while i + 2 <= len(chunks):
            q = strip_tags(chunks[i + 1])
            body = chunks[i + 2] if i + 2 < len(chunks) else ''
            if q:
                faqs.append({'question': re.sub(r'^\d+[.)]\s*', '', q),
                             'answer': clean_html(body)})
            i += 3
    if faqs:
        return [f for f in faqs if strip_tags(f['answer'])]
    # fall back: <p><strong>Q</strong></p><p>A</p>
    paras = re.findall(r'<p[^>]*>(.*?)</p>', s, re.S | re.I)
    pend = None
    for p in paras:
        t = strip_tags(p)
        if not t:
            continue
        if re.match(r'^(Q\d*[:.]|\d+[.)])', t) or ('<strong>' in p and t.endswith('?')):
            if pend:
                faqs.append(pend)
            pend = {'question': re.sub(r'^(Q\d*[:.]|\d+[.)])\s*', '', t), 'answer': ''}
        elif pend is not None:
            pend['answer'] += f'<p>{p.strip()}</p>'
    if pend:
        faqs.append(pend)
    return [f for f in faqs if f['question'] and strip_tags(f['answer'])]


# ---------------------------------------------------------------- main

def main():
    os.makedirs(OUT, exist_ok=True)
    attachments, xproducts, terms = load_xml()
    by_file = {a['file']: a for a in attachments.values()}

    with open(CSV_FILE, encoding='utf-8-sig') as f:
        rows = list(csv.DictReader(f))

    products, missing_alt, image_urls = [], [], OrderedDict()

    for r in rows:
        pid = r['ID']
        x = xproducts.get(pid, {})
        slug = x.get('slug') or re.sub(r'[^a-z0-9]+', '-', r['Name'].lower()).strip('-')
        wmeta = x.get('meta', {})

        imgs = []
        for u in [u.strip() for u in r['Images'].split(',') if u.strip()]:
            fn = u.rsplit('/', 1)[-1]
            if any(i['file'] == fn for i in imgs):
                continue  # CSV repeats the first image on some rows
            att = by_file.get(fn, {})
            alt = att.get('alt', '')
            if not alt:
                missing_alt.append(fn)
            imgs.append({'file': fn, 'alt': alt, 'src': u})
            image_urls[u] = fn

        specs = parse_specs(r.get('Meta: _bhww_specifications_wysiwyg', ''))
        faqs = parse_faqs(r.get('Meta: _bhww_faqs_wysiwyg', ''))

        price = (r.get('Regular price') or '').strip()
        cats = x.get('cats') or [c.strip() for c in r['Categories'].split(',') if c.strip()]

        products.append({
            'id': int(pid),
            'slug': slug,
            'url': f'/product/{slug}/',
            'name': r['Name'],
            'sku': r['SKU'],
            'category': cats[0] if cats else 'Products',
            'categorySlug': 'products',
            'brand': 'Hot Dog Trays',
            'shortDescription': clean_html(r['Short description']),
            'description': clean_html(r['Description']),
            'price': price,
            'currency': 'USD',
            'inStock': r['In stock?'] == '1',
            'images': imgs,
            'specifications': specs,
            'faqs': faqs,
            'metaTitle': (r.get('Meta: _yoast_wpseo_title') or '').strip(),
            'metaDescription': (r.get('Meta: _yoast_wpseo_metadesc') or '').strip(),
            'canonical': f'{SITE}/product/{slug}/',
            'position': int(r.get('Position') or 0),
        })

    products.sort(key=lambda p: p['id'])

    # related products: next 4 in catalogue order, wrapping around
    order = [p['slug'] for p in products]
    for i, p in enumerate(products):
        p['related'] = [order[(i + k) % len(order)] for k in range(1, 5)]

    json.dump(products, open(os.path.join(OUT, 'products.json'), 'w'),
              indent=1, ensure_ascii=False)
    json.dump(sorted(image_urls.items()), open(os.path.join(OUT, 'image_urls.json'), 'w'), indent=1)
    json.dump(terms, open(os.path.join(OUT, 'terms.json'), 'w'), indent=1, ensure_ascii=False)

    print(f'products: {len(products)}')
    print(f'unique images: {len(image_urls)}')
    print(f'images missing alt: {len(missing_alt)} -> {sorted(set(missing_alt))}')
    for p in products:
        print(f"  {p['slug']:32} imgs={len(p['images']):2} specs={len(p['specifications']['rows']):2} "
              f"faqs={len(p['faqs']):2} short={len(p['shortDescription']):5} desc={len(p['description']):6}")


if __name__ == '__main__':
    main()
