# Structured data report

Generated from the production build. Every block was parsed and validated by
`npm run qa`, which fails the build on a parse error, a duplicate Product,
BreadcrumbList or FAQPage node, or an FAQ question that does not appear in the
visible copy.

## Node counts across 34 pages

| Node | Pages |
| --- | --- |
| Organization | 33 |
| WebSite | 33 |
| BreadcrumbList | 33 |
| FAQPage | 26 |
| WebPage | 18 |
| Product | 14 |
| CollectionPage | 1 |
| ItemList | 1 |

## Review and rating markup

**`aggregateRating` / `Review` nodes in the build: 0.**

Search Console reported 2,869 Review-snippet impressions against 47 Product
impressions. That ratio came from markup the WordPress build emitted on every
product page and on the category archive: an `aggregateRating` of 4.5 derived
from a single `Review` authored by "webmaster". No customer reviews exist on
the site and no review functionality is offered, so the markup asserted
something untrue.

It has been removed rather than preserved. The Review-snippet impressions will
disappear from Search Console as a result. That is the intended outcome: those
impressions were being earned by a rating the business cannot substantiate, and
an unsupported rating is a manual-action risk as well as a trust problem.

Nothing else was removed. Product, Offer, BreadcrumbList, FAQPage, WebPage,
CollectionPage, ItemList, Organization and WebSite are all present and matched
to visible content.

## Product and Offer

`Offer` carries only the figures the catalogue genuinely holds: a `$0.50 USD`
starting price, `InStock` availability, the canonical product URL and the
seller reference. No shipping rate, delivery window, return period or discount
is asserted, because no verified business data backs any of them. That keeps
the markup eligible for Product results without inventing merchant properties.

## FAQ

Every product page carries one `FAQPage` node combining its fifteen
product-specific questions with the shared ordering questions rendered beneath
them, deduplicated. Each guide carries its own ten. `npm run qa` verifies that
every question in the markup appears in the rendered text, and that the
currency figures in the markup match the ones on the page.
