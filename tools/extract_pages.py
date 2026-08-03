#!/usr/bin/env python3
"""Clean the plain-content WordPress pages into HTML fragments for Astro.

Reads the WordPress XML export directly and writes src/content/pages/*.html.
The export is never modified.

    python3 tools/extract_pages.py
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from extract_products import clean_html  # noqa: E402
from wp_export import PROJ, items, text  # noqa: E402

OUT = os.path.join(PROJ, 'src/content/pages')

# Pages whose content came from the WordPress editor rather than Elementor.
PAGES = ['privacy-policy', 'terms-conditions', 'shipping', 'sample-page']

WP_BLOCK_COMMENT = re.compile(r'<!--\s*/?wp:[^>]*?-->', re.S)

# Content superseded since the migration. The WordPress export still carries the
# original wording, so replacements are applied here rather than by hand, and
# regenerating the pages cannot silently reinstate the old text.
#
# The returns paragraph was replaced once the business confirmed a 14-day
# window; the structured data in src/data/shipping.ts states the same terms and
# the two must agree.
CONTENT_OVERRIDES = {
    'terms-conditions': [
        (
            'Return and refund eligibility, if applicable, will be evaluated on a '
            'case-by-case basis. Please contact us directly for return requests or '
            'concerns regarding your order.',
            'Orders may be returned within <strong>14 days of delivery</strong>. Because '
            'every order is produced to your own size and artwork, returned goods must be '
            'unused and in their original packaging.\n\nReturn carriage is paid by the '
            'customer. Where an order arrives faulty, damaged or different from the approved '
            'proof, we cover the return carriage and put the order right at no cost to you.'
            '\n\nTo start a return, contact us within the 14-day window with your order '
            'details.',
        ),
    ],
}


def main():
    os.makedirs(OUT, exist_ok=True)

    found = {}
    for item, _meta in items('page'):
        slug = text(item, 'wp:post_name')
        if slug in PAGES:
            found[slug] = text(item, 'content:encoded')

    missing = [p for p in PAGES if p not in found]
    if missing:
        raise SystemExit(f'pages not present in the export: {", ".join(missing)}')

    for slug in PAGES:
        raw = found[slug]
        for old, new in CONTENT_OVERRIDES.get(slug, []):
            if old not in raw:
                print(f'   !! override text not found for {slug}; check the export')
            raw = raw.replace(old, new)
        raw = WP_BLOCK_COMMENT.sub('', raw)
        # the theme rendered the <header>/<div class="entry-*"> chrome itself
        raw = re.sub(r'</?header[^>]*>', '', raw, flags=re.I)
        raw = re.sub(r'<p class="entry-title">(.*?)</p>', r'<p>\1</p>', raw, flags=re.S | re.I)

        html = clean_html(raw)

        # nothing on these pages should carry an <h1>; the layout owns it
        html = re.sub(r'<h1[^>]*>(.*?)</h1>', r'<h2>\1</h2>', html, flags=re.S | re.I)

        # WordPress admin links have no equivalent in the static site; unwrap
        # them so the sentence survives without a dead link
        html = re.sub(r'<a href="/wp-(?:admin|login)[^"]*">(.*?)</a>', r'\1', html,
                      flags=re.S | re.I)

        html = re.sub(r'\n{2,}', '\n', html)

        path = os.path.join(OUT, f'{slug}.html')
        with open(path, 'w', encoding='utf-8') as fh:
            fh.write(html + '\n')

        heads = re.findall(r'<(h[2-6])[^>]*>', html, re.I)
        print(f'{slug:20} {len(html):6} chars, {len(heads):2} headings, '
              f'{len(re.findall(r"<p>", html)):2} paragraphs')

        residue = [p for p in ('data-start', 'wp:', 'class=', 'entry-content') if p in html]
        if residue:
            print('   !! residue:', residue)


if __name__ == '__main__':
    main()
