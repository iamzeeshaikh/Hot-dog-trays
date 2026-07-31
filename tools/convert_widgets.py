#!/usr/bin/env python3
"""Convert hand-written Elementor HTML widgets into clean Astro components.

This is the one-time migration tool that produced src/components/. It is kept
so the conversion is reproducible and auditable; running it again overwrites
those components, discarding the hand-refinements made afterwards (scoped CSS,
accessibility fixes, rewritten scripts). Work on the components directly.

Templates come from the exported Elementor JSON files; page-level Elementor
data comes from the WordPress XML export. Neither is modified.

    python3 tools/convert_widgets.py
"""
import glob, json, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from wp_export import PROJ, SRC, items, text  # noqa: E402


def _template(pattern):
    matches = glob.glob(os.path.join(SRC, pattern))
    if not matches:
        raise SystemExit(f'Elementor template not found: {pattern} in {SRC}')
    return matches[0]


# The exported Elementor library templates.
TEMPLATES = {
    'header': _template('Header & Footer/elementor-216-*.json'),
    'footer': _template('Header & Footer/elementor-217-*.json'),
    'product': _template('elementor-232-*.json'),
}

# Images referenced inside widget markup that no longer exist on the live site.
# Each is replaced by the primary image of the product the card actually links
# to - documented in the missing-assets report.
IMAGE_SUBSTITUTIONS = {
    'Hot-Dog-Holders.jpg': 'Hot-Dog-Paper-Holders-In-Bulk.jpg',
    'Best-hot-dog-food-tray-1.jpg': 'Hot-Dog-Food-Tray-With-Holder-Plastic.jpg',
}


def elementor_pages():
    """slug -> parsed _elementor_data for every page built with Elementor."""
    out = {}
    for item, meta in items('page'):
        data = meta.get('_elementor_data')
        if data:
            out[text(item, 'wp:post_name')] = json.loads(data)
    return out


def widgets_from(path_or_data):
    """Return the ordered list of raw HTML widget bodies in an Elementor tree."""
    if isinstance(path_or_data, str):
        data = json.load(open(path_or_data))
        content = data.get('content', data)
    else:
        content = path_or_data
    acc = []

    def walk(els):
        for e in els:
            s = e.get('settings', {})
            if e.get('widgetType') == 'html' and s.get('html'):
                acc.append(s['html'])
            walk(e.get('elements', []))

    walk(content)
    return acc


def split(raw):
    """-> (markup, css, js)"""
    css = '\n'.join(m.group(1) for m in re.finditer(r'<style[^>]*>(.*?)</style>', raw, re.S | re.I))
    js = '\n'.join(m.group(1) for m in re.finditer(r'<script[^>]*>(.*?)</script>', raw, re.S | re.I))
    markup = re.sub(r'<style[^>]*>.*?</style>', '', raw, flags=re.S | re.I)
    markup = re.sub(r'<script[^>]*>.*?</script>', '', markup, flags=re.S | re.I)
    # Font Awesome is self-hosted globally; drop every CDN <link>
    markup = re.sub(r'<link[^>]*font-awesome[^>]*>\s*', '', markup, flags=re.I)
    markup = re.sub(r'<!--.*?-->', '', markup, flags=re.S)
    return markup, css, js


def rewrite_markup(markup, image_imports):
    """Normalise links, images and external-link safety in widget markup."""
    # absolute self-links -> root-relative with trailing slash
    def rel(m):
        path = m.group(2) or '/'
        if not re.search(r'\.[a-z0-9]{2,5}($|[?#])', path, re.I) and '?' not in path and '#' not in path:
            path = path if path.endswith('/') else path + '/'
        return f'{m.group(1)}="{path}"'

    markup = re.sub(r'\b(href)="https?://(?:www\.)?hotdogtrays\.com(/[^"]*)?"', rel, markup)

    # wp-content images -> imported local assets
    def img(m):
        url = m.group(1)
        fname = url.rsplit('/', 1)[-1]
        # strip the WordPress size suffix so the full-resolution original is used
        base = re.sub(r'-\d+x\d+(?=\.[a-z]+$)', '', fname, flags=re.I)
        base = IMAGE_SUBSTITUTIONS.get(base, base)
        var = 'img' + re.sub(r'[^A-Za-z0-9]', '', os.path.splitext(base)[0])
        image_imports[var] = base
        return f'src={{{var}.src}}'

    markup = re.sub(
        r'\bsrc="(https?://[^"]*/wp-content/uploads/[^"]+\.(?:jpe?g|png|webp|gif))"',
        img, markup, flags=re.I)

    # external links get safe rel attributes
    def safe(m):
        tag = m.group(0)
        if 'rel=' in tag:
            return tag
        return tag[:-1] + ' rel="noopener noreferrer">'

    markup = re.sub(r'<a\b[^>]*target="_blank"[^>]*>', safe, markup)
    markup = re.sub(r'\n\s*\n+', '\n', markup)
    return markup.strip()


def to_astro(name, raw, out_dir, css_dir, css_rel, extra_frontmatter='', keep_script=True):
    markup, css, js = split(raw)
    image_imports = {}
    markup = rewrite_markup(markup, image_imports)

    css_file = None
    if css.strip():
        css_file = f'{name}.css'
        with open(os.path.join(css_dir, css_file), 'w') as f:
            f.write(f'/* Migrated from the Elementor "{name}" HTML widget. */\n')
            f.write(css.strip() + '\n')

    lines = ['---']
    if css_file:
        lines.append(f"import '{css_rel}/{css_file}';")
    for var, fname in sorted(image_imports.items()):
        lines.append(f"import {var} from '../../assets/products/{fname}';")
    if extra_frontmatter:
        lines.append(extra_frontmatter)
    lines.append('---')
    lines.append('')
    lines.append(markup)
    if js.strip() and keep_script:
        lines.append('')
        lines.append('<script>')
        lines.append(js.strip())
        lines.append('</script>')
    lines.append('')

    path = os.path.join(out_dir, f'{name}.astro')
    os.makedirs(out_dir, exist_ok=True)
    with open(path, 'w') as f:
        f.write('\n'.join(lines))
    return path, len(markup), len(css), len(js), sorted(image_imports.values())


def main():
    css_dir = os.path.join(PROJ, 'src/styles/sections')
    os.makedirs(css_dir, exist_ok=True)

    jobs = []

    page_data = elementor_pages()
    home_widgets = widgets_from(page_data['home'])
    home_names = ['Hero', 'TrustBar', 'FeaturedProducts', 'Categories', 'WhyChoose', 'HowItWorks',
                  'Materials', 'UseCases', 'QuoteFormPanel', 'QuoteSidebar', 'CtaBanner', 'HomeFaq']
    for i, n in enumerate(home_names):
        jobs.append((n, home_widgets[i], 'src/components/home'))

    prod_widgets = widgets_from(TEMPLATES['product'])
    prod_names = ['Features', 'MaterialOptions', 'Customization', 'SizeGuide', 'OrderProcess',
                  'ProductUseCases', 'ProductFaqSection', 'Guarantee', '_QuoteFormPanel', '_QuoteSidebar']
    for i, n in enumerate(prod_names):
        if n.startswith('_'):
            continue  # identical to the homepage pair; reused instead of duplicated
        jobs.append((n, prod_widgets[i], 'src/components/product'))

    for page, names in [
        ('about', ['AboutContent']),
        ('contact', ['ContactContent']),
        ('faq', ['FaqContent']),
        ('get-quote', ['QuoteHero', 'QuoteProcess', 'QuoteInfo', 'QuotePricing', 'QuoteCta']),
    ]:
        ws = widgets_from(page_data[page])
        for i, n in enumerate(names):
            jobs.append((n, ws[i], 'src/components/pages'))

    for name, raw, rel_dir in jobs:
        out_dir = os.path.join(PROJ, rel_dir)
        depth = rel_dir.count('/') - 1  # relative path back to src/styles
        css_rel = '../' * depth + '../styles/sections'
        p, m, c, j, imgs = to_astro(name, raw, out_dir, css_dir, css_rel)
        print(f'{rel_dir}/{name}.astro  markup={m:6} css={c:6} js={j:5} imgs={imgs}')


if __name__ == '__main__':
    main()
