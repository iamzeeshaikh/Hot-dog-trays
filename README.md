# hotdogtrays.com — Astro

Production rebuild of **hotdogtrays.com**, migrated off WordPress + WooCommerce +
Elementor. Static Astro with one serverless endpoint for the quotation forms.

See [`MIGRATION_REPORT.md`](./MIGRATION_REPORT.md) for what was migrated and the
decisions taken along the way.

---

## Requirements

- Node.js 22.12+ (Vercel builds on Node 24; Node 25 works locally but is not a
  supported Vercel runtime)
- npm 10+

## Getting started

```bash
npm install
cp .env.example .env      # fill in real SMTP values
npm run dev               # http://localhost:4321
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with the `/api/quote/` endpoint live. **Use this to test forms.** |
| `npm run build` | Production build into `dist/` and `.vercel/output/` |
| `npm run preview` | Serves the production build with Vercel's routing rules (trailing slashes, 301s, 404, 410) |
| `npm run check` | `astro check` — TypeScript across `.astro`, `.ts` and inline scripts |
| `npm run qa` | Full migration QA suite (needs `npm run preview` running) |
| `npm run qa:a11y` | Accessibility audit in a real browser |
| `npm run qa:responsive` | Responsive QA at 320 / 375 / 768 / 1024 / 1440 px |
| `npm run qa:forms` | End-to-end form and form-security tests against a local SMTP sink |
| `npm run qa:all` | Build, type-check, then the QA, accessibility and responsive suites |
| `npm run reports` | Regenerates the CSV deliverables in `reports/` |
| `npm run shots` | Screenshots the local build (`node scripts/shots.mjs live` grabs the old site) |

`npm run preview` serves `dist/client` only. The `/api/quote/` endpoint is a
serverless function, so **use `npm run dev` when testing form submission.**

---

## Environment variables

Copy `.env.example` to `.env`. Nothing here reaches the browser —
`src/pages/api/quote.ts` runs server-side only.

| Variable | Purpose |
| --- | --- |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | `465` uses implicit TLS; anything else uses STARTTLS |
| `SMTP_USER` / `SMTP_PASS` | SMTP credentials |
| `SMTP_TO` | Where quote requests are delivered |
| `SMTP_FROM_NAME` / `SMTP_FROM_EMAIL` | Envelope sender — use a domain you control so SPF/DKIM pass |

Optional, defaulted for production:

| Variable | Default | Purpose |
| --- | --- | --- |
| `QUOTE_RATE_LIMIT` | `5` | Submissions allowed per IP per window |
| `QUOTE_RATE_WINDOW_MS` | `600000` | Rate-limit window (10 minutes) |

If a required variable is missing the endpoint returns HTTP 503 with a message
pointing the visitor at the phone number. It never reports success without
delivery.

---

## Project structure

```
src/
├── assets/
│   ├── products/          69 product images (original WordPress filenames)
│   └── site/              trust badges, favicon
├── components/
│   ├── SiteHeader.astro           nav, dropdown, mobile menu
│   ├── SiteFooter.astro           footer nav, newsletter
│   ├── QuoteForm.astro            site-wide "Request Your Quote" panel
│   ├── ProductInquiryForm.astro   above-the-fold inquiry form + artwork upload
│   ├── ProductGallery.astro       main image + thumbnails, no jQuery
│   ├── ProductTabs.astro          Description / Specifications / FAQs
│   ├── FaqAccordion.astro  SpecTable.astro  Breadcrumbs.astro
│   ├── ProductCard.astro   ProductGrid.astro  RelatedProducts.astro
│   ├── Seo.astro  JsonLd.astro  QuoteBlock.astro
│   ├── home/              12 homepage sections
│   ├── product/           8 product-page sections
│   └── pages/             About, Contact, FAQ, Get Quote sections
├── content/pages/         cleaned HTML for the policy pages
├── data/
│   ├── products.json      generated product catalogue (see below)
│   ├── products.ts        typed accessors
│   ├── page-faqs.ts       FAQs mirrored from the components, for FAQPage schema
│   └── site.ts            contact details, social links, category
├── layouts/               BaseLayout, PolicyLayout
├── lib/schema.ts          JSON-LD builders
├── pages/                 routes — see the URL map in MIGRATION_REPORT.md
├── scripts/               shared client TypeScript
└── styles/global.css      reset, design tokens, accessibility helpers
```

Each migrated section keeps its CSS in its own component `<style>` block so
Astro scopes it. This is deliberate: Elementor emitted every widget's CSS
globally and roughly 50 class names collided between widgets.

### Product data

`src/data/products.json` is generated from the WooCommerce CSV export and the
WordPress XML export by `tools/extract_products.py`. It is committed so the
build is reproducible without the private exports. To regenerate after a content
change in WordPress:

```bash
python3 tools/extract_products.py src/data
python3 tools/extract_page_faqs.py     # refresh FAQ schema mirror
```

The extractor reads the exports in the parent directory and never writes to
them. Every product page renders from the single template at
`src/pages/product/[slug].astro`.

---

## Deployment

Vercel. `vercel.json` supplies the trailing-slash behaviour, the www → apex
redirect and the security headers. Step-by-step instructions, post-deploy checks
and rollback are in [`DEPLOYMENT.md`](./DEPLOYMENT.md).

---

## Notes

- `trailingSlash: 'always'` — the WordPress site served every canonical URL with
  a trailing slash; that is preserved exactly.
- `/sitemap.xml` is hand-built (`src/pages/sitemap.xml.ts`) rather than using
  `@astrojs/sitemap`, because it must live at that exact path and list only
  canonical, indexable, 200-returning URLs.
- Font Awesome is self-hosted from `@fortawesome/fontawesome-free`; the source
  templates loaded it from a CDN, which the Content-Security-Policy blocks.
- No WordPress, WooCommerce, Elementor or jQuery runtime remains.
