# SEO implementation report — hotdogtrays.com

Data-driven expansion and technical cleanup, executed in one session on the
existing Astro project. Baseline: 29 clicks, 5,260 impressions, 0.6% CTR,
average position 23.6.

---

## 1. Summary

| | |
| --- | --- |
| Existing pages audited | **27** (live) |
| Products upgraded | **14** |
| New pages created | **10** |
| Total indexable pages | **33** (was 25) |
| Unsupported claims corrected | **75 across 17 files** |
| Spam parameter URLs handled | `?f=<6+ digits>` → **410** |
| Shop / category duplication | `/product-category/products/` → **301 → `/shop/`** |
| Internal links preserved | **785 of 1,105** |
| Links updated to canonical destination | **29** |
| Links removed (all documented) | **291** |
| New contextual links added | **727** |
| Metadata changed | **34 pages** |
| Review / aggregateRating nodes | **11 → 0** |
| Highest content overlap | **8.4%** |

---

## 2. Spam parameter investigation (Phase 2)

Search Console had discovered many `/?f=<long digit string>` URLs, some with
unrelated foreign-language queries.

**Source: external injection, not the site.** The pattern appears in none of:
the WordPress database dump, either XML export, the WooCommerce CSV, this Astro
project, any internal link, any redirect rule, any form, or any script. The
live WordPress site already answers them with 410 — so the behaviour existed on
the old stack and had to be reproduced rather than invented.

**Implementation.** Astro's static output cannot inspect a query string, so the
match is done in `vercel.json`, which can:

```json
"rewrites": [{
  "source": "/:path*",
  "has": [{ "type": "query", "key": "f", "value": "(?<spam>\\d{6,})" }],
  "destination": "/api/gone"
}]
```

`/api/gone` is an on-demand route returning **410** with `X-Robots-Tag:
noindex`. A rewrite is used rather than a redirect so the URL is not preserved
and no duplicate homepage is created. These URLs never held legitimate content,
so redirecting them to `/` would manufacture exactly the duplicate signal the
cleanup is meant to remove.

**The match is deliberately narrow** — key `f`, value six or more digits.
Verified behaviour:

| Request | Result |
| --- | --- |
| `/?f=93634828680378` | 410 |
| `/?f=9304932592251` | 410 |
| `/shop/?f=41614282821828` | 410 |
| `/?utm_source=google&utm_medium=cpc` | 200 |
| `/?gclid=…`, `/?fbclid=…` | 200 |
| `/?f=hello` (non-numeric) | 200 |

Regression tests live in `scripts/qa-seo.mjs` and run on every QA pass.

**Other WordPress surfaces**: `/wp-admin/`, `/wp-login.php`, `/wp-json/`,
`/feed/`, date archives, attachment pages and Elementor previews do not exist
in the build. On Vercel the edge firewall answers the well-known probe paths
with 403 before the app sees them; everything else 404s. None appears in the
sitemap.

---

## 3. Shop and category consolidation (Phase 3)

`/shop/` and `/product-category/products/` rendered the **same** fourteen-product
grid. The category archive held the stronger Yoast metadata; `/shop/` held the
weaker. Neither had independent query intent.

**Decision: keep `/shop/`, 301 the category archive to it.**

- `/shop/` inherited the category's metadata (*Custom Hot Dog Trays | Wholesale
  Paper, Cardboard & Kraft*).
- `/product-category/products/` and its non-slash form both 301 to `/shop/`,
  verified as single hops landing on 200.
- **All 14 product descriptions that linked to the archive were rewritten to
  `/shop/`** so no internal link travels through the redirect. This is enforced
  in `tools/extract_products.py`, so regenerating the catalogue preserves it.
- Breadcrumbs, `CATEGORY` in site data, the contact quick-link and the sitemap
  were all repointed.

Every one of the 14 product URLs is unchanged and returns 200 directly.

---

## 4. Unsupported claims (Phase 4)

**75 claims across 17 files** were removed or qualified. Nothing in the exports,
the database or the live site substantiated any of them.

| Claim | Replacement |
| --- | --- |
| "100% recyclable", "biodegradable" | "Recyclable paperboard options" |
| "FDA Approved" / "FDA-approved" | "Food-grade" |
| "FSC-certified" | "Responsibly sourced board available" |
| "BPA-free, FDA approved" | "Food-grade polypropylene" |
| "Microwave safe (up to 3 min)" | "Ask us about reheating suitability" |
| "7-10 business days" and 34 other windows | "business days (confirmed on your quote)" |
| "Free Shipping on orders over $500" | "Shipping quoted per order" |
| "30-Day Money-Back Guarantee" | "Print Approval Before Production" |
| "100% Satisfaction Guarantee" | "Quality Checked Before Dispatch" |
| "9+ Years", "50,000+ Happy Customers", "100M+ Trays Produced", "25+ Countries" | Capability statements: Custom Sizes & Printing / Low Minimum Orders / Free Design Support / Bulk Wholesale Pricing |
| "2,500+ Food Trucks / 150+ Stadiums / 5,000+ Restaurants / 10K+ Events" | Setting labels: Trucks / Stadiums / Counters / Events |
| "Compliant with FDA standards" | "Food-grade materials" |

The stat blocks kept their four-up grid and visual weight, so the design is
unchanged. A sweep confirms **zero** remaining instances.

**Price consistency**: every starting price now reads `$0.50 USD`, matching the
catalogue and the `Offer` schema. The `$0.70/$0.75/$0.85/$0.95` figures in the
migrated copy contradicted the product data, and `/ea` was replaced with `USD`.

---

## 5. Homepage (Phase 4)

Design preserved; one H1 retained (*Custom Hot Dog Trays for Your Business* —
already carrying the target term).

- **Opening copy rewritten** around wholesale, custom printing, materials and
  food-service use, without stuffing synonyms.
- **New product-type comparison** (`ChooseFormat.astro`): a five-row table
  comparing paper trays, paper boats, cardboard holders, plastic trays and
  kraft trays on what they hold, what they suit and what to watch — each row
  linking to its product.
- **Prominent links added** to Hot Dog Boats Paper, Plastic Hot Dog Trays,
  Paper Hot Dog Trays, Cardboard Hot Dog Holders, Hot Dog Trays in Bulk and
  `/shop/`, plus the sizes and paper-vs-plastic guides.
- Ordering process, materials, industries served and the quote form were
  already present and retained.
- **Metadata**: title now `Custom Hot Dog Trays | Wholesale & Printed | Hot Dog
  Trays`; the old description ended on an unsupported free-shipping claim and
  was rewritten.

No `/custom-hot-dog-trays/` page was created, per the cannibalisation warning.

---

## 6. Product pages (Phase 5)

**The migrated content already met the content targets.** Measured before any
edit:

| Metric | Range across 14 products |
| --- | --- |
| Unique words | 1,360 – 1,978 |
| H2 sections | 4 – 9 |
| H3 subsections | 8 – 18 |
| Unique FAQs | 15 each |
| Specification table rows | 7 – 11 |
| Contextual links | 4 each |

**No empty headings exist.** The headings the brief flagged ("Steps For Applying
Printed Designs", etc.) are not in the migrated content; every H2 and H3 carries
body copy. Verified by parsing the text between consecutive headings.

So the work here was differentiation and connection rather than rewriting copy
that was already unique per product:

- **All 14 meta titles rewritten** away from the uniform `<Product> Wholesale |
  Hot Dog Trays` pattern. Pages with recorded performance were treated
  conservatively — titles changed only where the new wording leads with a query
  the page already ranks for.
- **One contextual guide pointer added per product**, in a "Before you order"
  block, with a lead-in sentence written per product.
- **Category links repointed** to `/shop/`.
- Specification tables now render fully (previously clipped) and collapse to
  labelled cards below 900px.

### Priority pages

**`/product/hot-dog-boats-paper/`** (14 clicks, position 10.6) — the strongest
page, handled carefully. Existing content untouched. Title changed to
**`Paper Hot Dog Boats | Custom Trays in Bulk`** because it leads with the exact
top query rather than the repeated "Wholesale" modifier; description taken from
the brief's suggestion. Now linked from the homepage comparison, from
`/hot-dog-trays-vs-paper-boats/`, `/hot-dog-trays-for-food-trucks/` and three
sibling products.

**`/product/plastic-hot-dog-trays/`** (3 clicks, position 15.0) — title now
signals rigidity for wet menus. Linked to the paper-vs-plastic comparison.

**`/product/cardboard-hot-dog-holders/`** (ranks 9.7 for "hot dog cardboard
holder") — title leads with the holder pocket structure to separate it from the
cardboard **trays** page.

**`/product/hot-dog-container-paper/`** — retitled around to-go intent.
**`/product/kraft-hot-dog-tray/`** (317 impressions) — retitled around the
kraft board property that drives the query.

---

## 7. New pages (Phase 6)

Ten created, all root-level with trailing slashes, all in the sitemap:

| URL | Words | Contextual links |
| --- | --- | --- |
| `/hot-dog-tray-sizes/` | 1,443 | 3 |
| `/footlong-hot-dog-trays/` | 1,266 | 3 |
| `/hot-dog-tray-material-guide/` | 1,143 | 3 |
| `/hot-dog-containers-to-go/` | 1,188 | 3 |
| `/hot-dog-trays-in-bulk/` | 1,180 | 3 |
| `/hot-dog-trays-for-food-trucks/` | 1,120 | 3 |
| `/hot-dog-trays-for-concession-stands/` | 1,082 | 3 |
| `/hot-dog-trays-for-catering/` | 1,106 | 3 |
| `/paper-vs-plastic-hot-dog-trays/` | 1,164 | 3 |
| `/hot-dog-trays-vs-paper-boats/` | 1,188 | 3 |

Each carries: one H1, seven H2 sections, its own comparison table, one bullet
list, one numbered list, **ten unique FAQs**, breadcrumbs with schema, FAQPage
schema matching the visible questions, self-referencing canonical, a
pre-selected quote form and a related-products strip.

They share a layout component and nothing else — highest measured overlap
between any two pages is 8.4%.

### Conditional page decision

**`/hot-dog-trays-with-lids/` was NOT created.** The rule required verifying
that lidded trays are genuinely offered. The evidence did not support it:

- Three image filenames mention lids (`Hot-Dog-Trays-With-Lids.jpg`,
  `Cardboard-Hot-Dog-Holders-With-Lids.jpg`, `Hot-dog-serving-tray-with-lid.jpg`)
- **But** no product, specification, description or FAQ offers a lidded item
- One description argues *for* the open format: "The open design helps customers
  grab food easily without fighting a lid"
- Another treats lids as conditional: "If you need lids, confirm the closure
  style"

That is not enough to publish a commercial landing page asserting a lidded
product line. **`/hot-dog-tray-material-guide/` was published instead**, as the
rule directs. If the business does offer lidded trays, the page can be created
and this decision reversed.

---

## 8. Internal linking (Phases 7)

The link graph was captured from the **live production site before any edit**
(`reports/OLD_INTERNAL_LINK_BASELINE.csv`): 27 pages, **1,105 internal links**,
classified by type and section.

| Outcome | Count |
| --- | --- |
| Preserved unchanged | 785 |
| Updated to the final canonical destination | 29 |
| Removed | 291 |
| Newly added | 727 |

**Every removal is documented** in
`reports/INTERNAL_LINK_PRESERVATION_REPORT.csv`. They fall into four groups:

1. Cloudflare email-obfuscation links (`/cdn-cgi/l/email-protection…`) — never
   site content
2. `?add-to-cart=` parameter links — the cart was retired in the quotation model
3. `/wp-admin/` — WordPress dashboard link in the sample page
4. Links whose **source page** was consolidated (`/product-category/products/`,
   `/cart/`, `/checkout/`)

**Pages that lost incoming links:**

- `/blog/` — 26 → 0. It 404s on the live site; removing links to a broken page
  is a fix, not a loss.
- `/product/red-and-white-hot-dog-trays/` — 56 → 43. The loss is entirely from
  the three consolidated source pages that each listed all fourteen products. It
  retains **43 incoming links from 34 pages**, including 3 contextual and 6
  related-product links. No equity concern.

No other page lost incoming links. No page is orphaned.

### Policy conflict, and how it was resolved

The one-contextual-link-per-section policy conflicts with the preservation
addendum, because **17 pre-existing sections in the migrated descriptions carry
more than one link**. The addendum is explicit — "preserve first", "do not
remove old internal links when rewriting", "do not deploy if a legitimate old
internal link disappears" — so those links were kept.

The policy is enforced on **newly authored copy only**: guide bodies and the
product "Before you order" blocks. QA checks both separately and reports the
grandfathered count rather than failing on it.

Anchor discipline verified: **91 distinct anchors**, none reused more than three
times, no generic anchors ("click here", "learn more", "view", "explore"), no
editorial self-links, no link pointing through a redirect.

---

## 9. Schema (Phase 9)

**Review and aggregateRating markup removed — 11 nodes → 0.**

GSC showed 2,869 Review-snippet impressions against 47 Product impressions. That
came from an `aggregateRating` of 4.5 built on a single `Review` authored by
"webmaster", emitted on every product page and the category archive. No customer
reviews exist and no review functionality is offered.

Those impressions will disappear. That is intended: they were earned by a rating
the business cannot substantiate, which is both a trust problem and a
manual-action risk.

Retained and validated: Organization, WebSite, WebPage, Product, Offer,
BreadcrumbList, FAQPage, CollectionPage, ItemList. `Offer` carries only the
starting price, currency, availability, URL and seller — no invented shipping
rates, delivery windows or return terms.

Full detail in `reports/STRUCTURED_DATA_REPORT.md`.

---

## 10. Test results

| Suite | Result |
| --- | --- |
| `astro build` | ✅ 35 pages |
| `astro check` | ✅ 0 errors, 0 warnings, 0 hints |
| `npm run qa` | ✅ **288 / 288** |
| `npm run qa:seo` | ✅ **19 / 19** |
| `npm run qa:a11y` | ✅ **35 / 35** |
| `npm run qa:responsive` | ✅ **62 / 62** at 320/375/768/1024/1440px |
| `npm run qa:forms` | ✅ **14 / 14** |
| `npm audit` | ✅ 0 vulnerabilities |
| Content similarity | ✅ max 8.4% (threshold 40%) |

---

## 11. Unresolved items

1. **Lidded trays** — if the business does offer them,
   `/hot-dog-trays-with-lids/` can be created; the evidence did not support it
   (§7).
2. **`$0.50` starting price** — now consistent everywhere, but it is a
   WooCommerce placeholder. If real pricing differs, it should be corrected in
   `src/data/products.json`, which feeds both the visible price and `Offer`.
3. **Review snippets will drop out of GSC.** Expected and intended (§9).
4. **`SMTP_FROM_EMAIL` is `info@hotdogtrays.com` but SMTP authenticates as a
   Gmail account.** Gmail rewrites the From header unless the alias is verified.
   Deliverability for a domain sender would be better on that domain's own SMTP.
5. **Alt text `"Products"`** on the Hot Dog Serving Tray primary image, preserved
   verbatim from the media library. Worth fixing at source.
