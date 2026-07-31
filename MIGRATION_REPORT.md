# Migration report — hotdogtrays.com

WordPress + WooCommerce + Elementor → Astro.
Audit and rebuild completed 31 July 2026. **Not deployed.**

---

## 1. Headline numbers

| | |
| --- | --- |
| Old indexable URLs identified | **28** (25 in the Yoast sitemap + `/cart/`, `/checkout/`, `/my-account/`) |
| URLs unchanged, returning 200 directly | **25** |
| 301 redirects introduced | **2** |
| 410 Gone | **1** |
| Pages built | **26** (25 routable + `/404/`) |
| Products migrated | **14** |
| Product categories migrated | **1** (`Products`) |
| Images migrated | **75** (69 product + 6 site assets) → 210 optimised derivatives |
| Titles preserved exactly | **25 / 25** |
| H1s preserved exactly | **25 / 25** |
| Meta descriptions preserved exactly | **16 / 16** that existed |
| Meta descriptions created (none existed) | **9** |
| Forms implemented | **3** (product inquiry, site-wide quote, newsletter) |
| Client JavaScript shipped | **36 KB total**, 3 modules on the homepage |

---

## 2. Source audit

Everything in the supplied folder was inspected before any code was written.

| Source file | What it is | How it was used |
| --- | --- | --- |
| `elementor-378-2026-07-30.json` | Homepage template (12 HTML widgets) | Homepage sections |
| `elementor-232-2026-07-30.json` | Product template (10 HTML widgets + Woo widgets) | Product-page sections |
| `Header & Footer/elementor-216-*.json` | Header template (1 HTML widget) | `SiteHeader.astro` |
| `Header & Footer/elementor-217-*.json` | Footer template (1 HTML widget) | `SiteFooter.astro` |
| `wc-product-export-30-7-2026-*.csv` | 14 simple products, 58 columns | Product data, specs, FAQs, Yoast metadata |
| `hotdogtrays.WordPress.2026-07-30 (1).xml` | Full export: 14 pages, 14 products, 78 attachments | Slugs, image alt text, page content, taxonomy |
| `hotdogtrays.WordPress.2026-07-30.xml` | Attachments only (subset of the above) | Cross-checked, no unique data |
| `localhost.sql` | Full database dump (17 MB) | Inspected only; no content taken |
| `Homepage Design 1.png`, `Homepage Design 2.png` | Homepage screenshots | Visual comparison |
| `Product Page Design.pdf` | 16-page product-page design | Product-page layout reference |
| `Logo.png` | Logo file | See §8 |

**Key finding:** the Elementor templates contain no Elementor-generated layout.
Every section is a single HTML widget holding hand-written HTML, CSS and
vanilla JavaScript. The migration therefore preserved the original markup and
CSS almost verbatim and only rebuilt the WordPress- and WooCommerce-dependent
parts. There is no Elementor bloat to reproduce or strip.

### Commerce model

The site is a **quotation lead-generation site**, not a working store:

- every product carries the same `$0.50` placeholder regular price;
- the product template's primary elements are an "Instant Quote" form and a
  "Get Free Quote" CTA;
- `/checkout/` already 302s to `/cart/` on the live site;
- static content quotes prices "starting at $0.70/unit", contradicting the
  `$0.50` WooCommerce figure.

The cart/checkout/account flow was therefore not carried over. See §4.

---

## 3. Content migration

### Products (14)

All fields came from the WooCommerce CSV, with slugs, image alt text and
taxonomy from the XML export.

Per product: name, slug, SKU (`HDT-001`…`HDT-014`), category, brand, short
description, full description (12.9–17.1 KB each), starting price, availability,
**5 images** (4 for Hot Dog Boats Paper — the CSV repeated one), a 6-to-9-column
specification table, **15 FAQs**, meta title, meta description, canonical, and
four related products.

### Content cleaning

The WooCommerce short descriptions had been pasted directly from a ChatGPT
conversation and carried its UI markup — `<article class="text-token-text-primary …">`,
`data-turn-id`, `data-message-model-slug="gpt-5-2-thinking"` and Tailwind class
soup wrapped around the real copy. This is visible in the live page source
today. The extractor removes those wrappers and attributes and keeps every word
of the copy.

Also cleaned, without changing visible meaning:

- literal `\n` sequences used as paragraph markers, converted with a `wpautop`
  equivalent (paragraphs are **not** injected inside `<li>`, `<td>` or `<th>`);
- WordPress block comments (`<!-- wp:paragraph -->`) on the policy pages;
- theme chrome (`<header class="entry-header">`, `entry-content` wrappers);
- stray unmatched `<p>` tags left where headings were split out;
- absolute `https://hotdogtrays.com/…` internal links rewritten to root-relative
  with trailing slashes.

Verified afterwards: zero occurrences of `data-start`, `data-turn`,
`text-token`, `elementor`, WordPress shortcodes or leftover `class=`/`style=`
attributes across all 14 products (checked by `npm run qa`).

### Pages (12 migrated)

| Page | Source | Notes |
| --- | --- | --- |
| Home | Elementor 12 widgets | 12 sections in original order |
| About | Elementor 3 widgets | Hero, story, mission, values, stats, timeline, why, CTA |
| Contact | Elementor 3 widgets | Methods, info card, business hours |
| FAQ | Elementor 3 widgets | 26 FAQs across 4 categories, plus working search |
| Get Quote | Elementor 7 widgets | Hero, process, info, pricing, CTA |
| Shop | WooCommerce archive | 14 products, alphabetical, "Showing all 14 results" |
| Products category | WooCommerce archive | Same grid, own Yoast metadata |
| Privacy Policy | WP post content | 12 headings, 18 paragraphs, 19 list items |
| Terms Conditions | WP post content | 12 headings, 22 paragraphs, 13 list items |
| Shipping | WP post content | 10 headings, 19 paragraphs, 21 list items |
| Sample Page | WP post content | See §7 |
| 404 | New | See §7 |

Heading hierarchy, paragraph order, lists, tables and internal-link
destinations are preserved. One H1 per page, verified across all 26 pages.

---

## 4. URL map

`reports/URL_COMPARISON.csv` has the full row-by-row comparison.

### Unchanged — 200 directly, no redirect hop (25)

`/` · `/about/` · `/contact/` · `/faq/` · `/get-quote/` · `/shipping/` ·
`/privacy-policy/` · `/terms-conditions/` · `/shop/` ·
`/product-category/products/` · `/sample-page/` · and all 14
`/product/<slug>/` URLs.

### Redirected (2)

| Old URL | New | Status | Why |
| --- | --- | --- | --- |
| `/cart/` | `/get-quote/` | 301 | No cart in the quotation model; the quote page is the equivalent conversion action |
| `/checkout/` | `/get-quote/` | 301 | Same; the live site already 302'd this to `/cart/`, so the chain is now shorter |

Both verified as single hops landing on a 200.

### Gone (1)

| Old URL | Status | Why |
| --- | --- | --- |
| `/my-account/` | 410 | Customer accounts have no equivalent. A 410 is more honest than redirecting to an unrelated page; the page still offers the quote CTA and phone number |

### URL behaviour

- `trailingSlash: 'always'`; `/about` → 308 → `/about/`.
- Unknown URLs return a genuine 404 — never redirected to the homepage.
- WordPress traps (`/wp-admin/`, `/wp-login.php`, `/wp-json/`, `/feed/`, date
  archives) simply don't exist and 404 naturally. None are in the sitemap.
- `www.hotdogtrays.com` → `hotdogtrays.com` 301 via `vercel.json`.
- HTTP → HTTPS and HSTS handled by Vercel + `Strict-Transport-Security`.
- No redirect chains and no loops (verified by `npm run qa`).

---

## 5. SEO

### Metadata parity

| | Result |
| --- | --- |
| Titles exact | 25 / 25 |
| H1s exact | 25 / 25 |
| Descriptions exact | 16 / 16 that existed |
| Canonicals | all self-referential on `https://hotdogtrays.com`, trailing slash preserved |

Source priority followed: Yoast fields in the export first, then the live page
source. All 14 product titles/descriptions and the homepage and category
metadata came from Yoast and are byte-identical.

### Created metadata (9)

These pages had **no** meta description in WordPress (Yoast fields empty, and
the live pages emitted none). Each new description is page-specific, 95–130
characters, written from that page's own visible content:

`/about/` · `/contact/` · `/faq/` · `/get-quote/` · `/shipping/` ·
`/privacy-policy/` · `/terms-conditions/` · `/shop/` · `/sample-page/`

No existing indexed metadata was replaced.

### Structured data

Per page type:

| Page | Nodes |
| --- | --- |
| Homepage | Organization, WebSite, WebPage, BreadcrumbList, FAQPage (8 questions) |
| Product (×14) | Organization, WebSite, Product + Offer, BreadcrumbList, FAQPage |
| Shop / category | Organization, WebSite, CollectionPage, ItemList, BreadcrumbList |
| Standard pages | Organization, WebSite, WebPage, BreadcrumbList (+ FAQPage on `/faq/`) |

**Deliberately not carried over.** The WordPress build emitted an
`aggregateRating` of `4.5` from a single `Review` authored by `"webmaster"`, on
both product pages and the category archive. No real reviews exist, so those
nodes were dropped rather than reproduced. This is the one intentional
structured-data regression; everything else is preserved or improved.

`Offer` carries only the starting price ($0.50 USD), currency, availability and
seller — the figures the catalogue actually holds. No shipping rates, delivery
times, return windows or discounts are asserted, because no real policy data
backs them.

FAQ schema on each product page contains the 15 product-specific questions plus
the 8 shared ordering questions rendered below them, deduplicated into a single
`FAQPage` node. Every question is verified to appear in the page's visible text
by `npm run qa`.

### Sitemap and robots

- `/sitemap.xml` — exactly that path, 24 canonical HTTPS URLs, trailing slashes
  preserved, no duplicates, no redirects, no noindex pages, no API routes.
- The old site's `/sitemap.xml` 301'd to `/sitemap_index.xml`; the new one
  serves directly at the advertised path, removing a hop.
- `robots.txt` allows everything except `/api/`, and references the sitemap.
  CSS, JS, fonts and images are all crawlable.

---

## 6. Forms

Three forms, all posting to one hardened endpoint (`src/pages/api/quote.ts`).

| Form | Where | Fields |
| --- | --- | --- |
| Product inquiry | Above the fold on every product page | Name, Email, Phone, Product (pre-filled), Message, Artwork upload |
| Quote request | Home, About, Contact, FAQ, Get Quote | Name, Email, Phone, Company, Product, Quantity, Material, Printing, Details |
| Newsletter | Footer | Email |

Security and correctness, all verified by `npm run qa:forms` (14/14 passing):

- server-side validation mirroring the client, independent of the browser;
- input sanitising strips control characters; CRLF header injection into
  `Name` cannot reach the message headers (tested);
- uploads restricted by extension **and** declared MIME type, 8 MB per file,
  20 MB total, 5 files max; executables (`.php`, `.exe`, `.sh`, …) rejected;
  filenames reduced to a safe basename (tested with `shell.php` and a
  `.png` disguising an executable MIME type);
- off-screen honeypot — bot submissions return 200 but deliver nothing;
- rate limiting, 5 per IP per 10 minutes, returning 429;
- Astro's CSRF origin check active on form posts;
- accessible labels on every control, `role="status"` live regions, and
  `aria-invalid` on the first failing field, which receives focus;
- success reported **only** after the SMTP transport accepts the message —
  missing configuration returns 503 with the phone number, never a false success;
- the product name is pre-filled and the submitting page URL is included in
  every email (both tested);
- forms carry a real `action`/`method` so they still submit without JavaScript;
- SMTP credentials confirmed absent from all client output.

The original posted to `/send-quote.php`, which does not exist in the export —
the live forms have no working backend.

---

## 7. Decisions and deviations

Everything below is a deliberate departure from a byte-for-byte copy. Each is
reversible.

1. **Cart, checkout and account removed.** Justified in §2 and §4.
   "Add To Cart" on the product template and the archive grids became
   "Get Free Quote". The `$0.50` figure is retained and labelled *Starting
   price*, matching both the catalogue data and the live archives.

2. **`/sample-page/` kept at 200 but `noindex` and out of the sitemap.** It is
   WordPress boilerplate ("I'm a bike messenger by day…") that was left
   published and indexed. The URL still resolves so nothing breaks, but it no
   longer competes for indexing. To restore it, remove `noindex` from
   `src/pages/sample-page.astro` and its entry from `NOINDEX_PATHS`.

3. **Hero background image left absent.** The homepage CSS referenced
   `wp-content/uploads/2026/01/Hot-Dog-Holders.jpg`, which **404s on the live
   site** — the live hero renders as the gradient alone. The rule is kept with
   `background-image: none` and a comment, so the migrated hero matches the
   live one exactly. Restore by supplying the asset and setting the URL.

4. **Two 404ing images replaced in the homepage cards.** `Hot-Dog-Holders.jpg`
   and `Best-hot-dog-food-tray-1.jpg` both 404. Each card's image was replaced
   with the primary image of the product that card actually links to — not a
   filename guess. See §8.

5. **One inquiry form per product page.** The original rendered two: the
   Elementor "Instant Quote" form above the fold *and* the full quote panel at
   the foot, with duplicate DOM ids. The above-the-fold inquiry form is kept
   (per the product-page design), and the foot of the page keeps its section
   without a second form.

6. **`/blog/` removed from the footer.** It 404s on the live site.

7. **`/returns-policy/` links retargeted to `/terms-conditions/`.** That URL
   never existed — the WordPress "Refund and Returns Policy" page is still a
   draft. 15 links pointed at it. The terms page contains the actual returns
   and refunds section, so it is the genuinely relevant destination.

8. **`/products/` link on the Contact page retargeted** to
   `/product-category/products/`, the URL that exists.

9. **`/wp-admin/` link removed** from the retained sample page.

10. **Fabricated review markup dropped.** Justified in §5.

11. **Font Awesome self-hosted** instead of loaded from cdnjs, which the CSP
    blocks. Font Awesome Free is licensed for this (icons CC BY 4.0, fonts SIL
    OFL 1.1, code MIT).

12. **Google Maps iframe on the Contact page dropped.** Its embed URL contains
    placeholder coordinates (`…8c8c8c8c8c8c` and `1234567890123`) and does not
    resolve to a real location. The full postal address, phone, email and
    WhatsApp links are all retained. Restore by adding a valid embed URL and
    allowing `frame-src` in the CSP.

13. **Section CSS scoped per component.** Elementor emitted every widget's CSS
    globally; ~50 class names collided across widgets. One collision was
    visibly broken on the live site: `.hdt-comparison-title` was defined in both
    the material-options and size-guide widgets, rendering
    "Material Comparison Guide" in near-white on white (1.07:1 contrast).
    Scoping fixed that class of bug outright.

14. **Accessibility fixes** beyond the original — detailed in §9.

---

## 8. Missing assets

| Asset | Status | Resolution |
| --- | --- | --- |
| `Hot-Dog-Holders.jpg` | 404 on live | Hero background left absent (matches live). Homepage "Hot Dog Holders" card uses `Hot-Dog-Paper-Holders-In-Bulk.jpg` — the primary image of the product that card links to |
| `Best-hot-dog-food-tray-1.jpg` | 404 on live | Homepage "Hot Dog Food Tray" card uses `Hot-Dog-Food-Tray-With-Holder-Plastic.jpg` — that product's primary image |
| `Logo.png` (supplied) | Not used | Neither the live site nor the Elementor header uses it; both render an emoji-and-text lockup. Reproduced as-is. Drop the file into `SiteHeader.astro` if a real logo is wanted |

All 75 other images downloaded from the live site (the export contained no
`uploads/` folder), stored under `src/assets/` with their original WordPress
filenames, and served through Astro's image pipeline as responsive WebP with
explicit dimensions. Every alt attribute came from the WordPress media library —
**all 69 product images had alt text; none was invented.**

One note for the client: the first gallery image of *Hot Dog Serving Tray* has
the alt text `"Products"` in the WordPress media library. It is preserved
verbatim rather than "improved", but it is worth fixing at source.

---

## 9. Accessibility

WCAG 2.2 AA, verified in a real browser by `npm run qa:a11y` (26/26 passing).

Beyond the original: keyboard-operable nav dropdown (`focusin`/`focusout` +
Escape), tabs with roving focus and arrow keys, accordions with real
`aria-expanded`/`aria-controls` and arrow-key navigation, a skip link, visible
focus rings, and `prefers-reduced-motion` support.

Genuine defects found and fixed:

| Issue | Fix |
| --- | --- |
| Closed mobile menu overlaid the header bar (present on the live site) | `visibility: hidden` + `pointer-events: none` when closed, which also removes its links from the tab order |
| Mobile hamburger collapsed to a 16×16 tap target | 44×44 with a proper flex layout; CTA sized to fit and hidden below 380px |
| `.hdt-comparison-title` near-invisible (1.07:1) from a CSS collision | Scoped per component |
| `#E63946` link text on white = 4.17:1 | `#C92A35` (5.43:1) for link text only; brand red unchanged on buttons, badges and headings |
| `#888` / `#777` muted text below 4.5:1 | Darkened to `#5F5F5F` / `#666` |
| Heading jumps h1 → h3 on 3 pages | Visually-hidden section `<h2>`s, or promoted where the h3 was already a section heading |
| Breadcrumb, contact and CTA links under 24px tall | Vertical padding; visual design unchanged |
| `onclick="searchFAQs()"` inline handler | Bound in the module script (also required by the CSP) |
| Long tokens ("HotDogTrays.com?") widening the page | `overflow-wrap: break-word` |

---

## 10. Performance and security

- **36 KB** of client JavaScript across the whole site; 3 modules on the
  homepage. No jQuery, no Elementor scripts, no framework hydration.
- Images: responsive WebP, explicit width/height (no layout shift), lazy-loaded
  below the fold. The LCP product image is `loading="eager"` +
  `fetchpriority="high"` and never lazy-loaded.
- System font stack — no webfont download for body text.
- `_astro/*` served immutable for a year; `/api/` `no-store`.
- Headers via `vercel.json`: CSP (`script-src 'self'`, `frame-ancestors 'none'`,
  `object-src 'none'`, `form-action 'self'`), `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options: DENY`, HSTS,
  `Cross-Origin-Opener-Policy`.
- **`npm audit`: 0 vulnerabilities.** A high-severity ReDoS in `path-to-regexp`
  6.1.0 (reached transitively through `@astrojs/vercel` →
  `@vercel/routing-utils`, GHSA-9wv6-86v2-598j) was resolved with an npm
  `overrides` pin to `^6.3.0`, rather than the major downgrade `npm audit fix`
  proposed.
- No SQL, XML or CSV exports in the build output; `.gitignore` excludes them and
  `.env`. Verified by `npm run qa`.

---

## 11. Test results

Run after a clean `npm run build`:

| Suite | Result |
| --- | --- |
| `npm run build` | ✅ 26 pages, 210 image derivatives |
| `npm run check` (TypeScript) | ✅ 0 errors, 0 warnings, 0 hints |
| `npm run qa` | ✅ **188 / 188** |
| `npm run qa:a11y` | ✅ **26 / 26** |
| `npm run qa:responsive` | ✅ **47 / 47** at 320/375/768/1024/1440 px |
| `npm run qa:forms` | ✅ **14 / 14** |
| `npm audit` | ✅ 0 vulnerabilities |
| Browser console errors | ✅ 0 across 8 pages × 2 viewports |
| Horizontal overflow | ✅ none at any tested width |

`npm run qa` covers: single H1 per page, titles present and unique,
descriptions present, canonical validity and host, no localhost/preview
canonicals, JSON-LD parses, no duplicate Product/Breadcrumb/FAQ schema, no
fabricated reviews, FAQ schema matching visible text, no WordPress/Elementor/
ChatGPT residue, no duplicated Description/Related Products/FAQ sections, one
quote form per page, image existence/alt/dimensions, internal links resolving,
no secrets or private exports in the build, sitemap integrity, every sitemap URL
returning 200, unchanged URLs returning 200 without a hop, redirects being
single hops, unknown URLs 404ing, trailing-slash normalisation, unique product
slugs, valid product/category relationships, and no orphan product pages.

---

## 12. Visual parity

Local build screenshotted at 1440×900 and 375×812 and compared against the live
site and the supplied design files.

Matched: header (logo lockup, nav, dropdown, contact block, CTA), hero
(gradient, badge, headline treatment, buttons, four feature cards), homepage
section order and content, product page layout (centred H1, then short
description | inquiry form | gallery, per the design PDF), trust-badge row,
Description/Specifications/FAQs as a vertical tab rail, archive grids, and the
four-column footer.

Intentional visual differences: breadcrumbs added to product pages (required by
the brief; the live site has none), "Add To Cart" → "Get Free Quote", and the
mobile-header fixes in §9.

---

## 13. Unresolved items

Nothing is blocking. Items needing a decision from the site owner:

1. **`$0.50` starting price.** Preserved because it is the live, indexed figure
   and the only price the catalogue holds — but it contradicts the "starting at
   $0.70/unit" copy in the static sections. Worth reconciling before launch;
   it feeds the visible price and the `Offer` schema.
2. **Alt text `"Products"`** on the Hot Dog Serving Tray primary image.
   Preserved verbatim; better fixed at source.
3. **Reviews.** If genuine reviews exist, add them and the `aggregateRating`
   node can return legitimately.
4. **Google Maps embed** — supply a valid embed URL if the map is wanted (§7).
5. **Logo** — supply if the emoji lockup is not intended (§8).
6. **Newsletter signups** currently email `SMTP_TO`. Point at a real mailing-list
   provider if one is in use.
7. **`/shop/` and `/product-category/products/` show identical grids.** Both are
   indexed on the live site and both were preserved with their own canonicals,
   exactly as-is. Consolidating them would improve things but changes the
   indexed URL set, so it was left alone.
