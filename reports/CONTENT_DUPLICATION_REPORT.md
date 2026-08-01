# Content duplication report

## Method

`scripts/qa-seo.mjs` compares the editorial body of every page over 250 words
using 4-word shingles and Jaccard similarity. Navigation, footer, breadcrumbs,
grids and forms are excluded, so shared chrome cannot mask or inflate a score.
The suite fails the build above 40% overlap.

## Result

**27 pages compared. Highest overlap: 8.4%**
(`/product/cardboard-hot-dog-holders/` against `/product/paper-hot-dog-trays/`).

No pair approached the threshold, so no page needed rewriting for duplication.

## Why the pages differ

### Product pages (14)

The migrated WooCommerce descriptions were already distinct per product:
4815–5680 words each, with their own H2/H3 sequences,
their own specification tables and fifteen product-specific FAQs apiece. None
was a template with the product name swapped, so the expansion added a
per-product guide pointer and differentiated metadata rather than rewriting
copy that was already unique.

### Guide pages (10)

Written individually, 1201–1543 words each. They share a layout
component but no content: each has its own section sequence, its own comparison
table, its own bullet and numbered lists, its own ten FAQs and its own set of
internal-link targets. The similarity score above confirms this held.

## Archive duplication

`/shop/` and `/product-category/products/` rendered the same fourteen-product
grid with different metadata — genuine duplication of an indexable archive. The
category archive is now 301'd to `/shop/`, which inherited its stronger
metadata. Every internal link that pointed at the archive was rewritten to
`/shop/` so none travels through the redirect.

## Empty headings

The brief listed headings such as "Steps For Applying Printed Designs" as
suspected empty sections. They do not exist in the migrated content — every H2
and H3 across all fourteen product pages carries body copy. Verified by parsing
each description and measuring the text between consecutive headings.
