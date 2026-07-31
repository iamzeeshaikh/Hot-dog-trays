# Deployment — hotdogtrays.com

Vercel. **The live WordPress site must stay untouched and serving
hotdogtrays.com until the checks in §4 pass.**

---

## 0. Before you start

- [ ] `npm run qa:all` passes locally
- [ ] `npm run qa:forms` passes locally
- [ ] You have SMTP credentials for the sending domain
- [ ] You have access to the DNS zone for `hotdogtrays.com`
- [ ] You have taken a **full backup of the WordPress site** (files + database)
      and stored it somewhere other than the production host — see §5
- [ ] Read `MIGRATION_REPORT.md` §13 and decided on the open items

**Never** commit `.env`, or push the `.sql` / `.xml` / `.csv` exports. They live
one directory above this project and `.gitignore` already excludes those
extensions.

---

## 1. Repository

```bash
cd "hotdogtrays-astro"
git init
git add .
git commit -m "Migrate hotdogtrays.com from WordPress to Astro"
```

Confirm nothing private slipped in before pushing:

```bash
git ls-files | grep -Ei '\.(sql|xml|csv)$'   # expect no output
git ls-files | grep -E '^\.env$'             # expect no output
```

Then create the remote (private) and push.

---

## 2. First deploy — preview only, no custom domain

```bash
npm i -g vercel      # if needed
vercel login
vercel link
```

Add the environment variables to **Production, Preview and Development**:

```bash
vercel env add SMTP_HOST production
vercel env add SMTP_PORT production
vercel env add SMTP_USER production
vercel env add SMTP_PASS production
vercel env add SMTP_TO production
vercel env add SMTP_FROM_NAME production
vercel env add SMTP_FROM_EMAIL production
```

Repeat for `preview` if you want forms working on preview URLs.

Deploy to a **preview URL** — do not attach the domain yet:

```bash
vercel
```

Vercel picks up `vercel.json` (trailing slashes, www redirect, security headers)
and `astro.config.mjs` (the `/cart/` and `/checkout/` 301s).

> Note: Vercel builds on Node 24. If your local Node is 25 the build still
> works, but set the Node version in Project Settings → General to 24 to match.

---

## 3. Verify on the preview URL

Replace `PREVIEW` with the deployment URL.

```bash
# every page is 200 and every redirect behaves
QA_BASE=https://PREVIEW npm run qa
QA_BASE=https://PREVIEW npm run qa:a11y
QA_BASE=https://PREVIEW npm run qa:responsive
```

Manual checks that automation cannot cover:

- [ ] Submit the product inquiry form, **including an artwork upload**, and
      confirm the email arrives at `SMTP_TO` with the product name, page URL and
      attachment
- [ ] Submit the quote form on `/get-quote/`
- [ ] Submit the footer newsletter form
- [ ] Try to submit an empty form — it must refuse, and say why
- [ ] Open the mobile menu on a real phone; check the dropdown and the FAQ
      accordions
- [ ] Confirm security headers:
      `curl -sI https://PREVIEW/ | grep -iE 'content-security|x-content-type|referrer|permissions|strict-transport'`
- [ ] View source on a product page and confirm no SMTP values appear

Only proceed when all of the above pass.

---

## 4. Cut over

**Keep the WordPress installation running.** Do not delete anything.

1. Promote the verified deployment to production:
   ```bash
   vercel --prod
   ```
2. In Vercel → Project → Settings → Domains, add **both**
   `hotdogtrays.com` and `www.hotdogtrays.com`. Set `hotdogtrays.com` as
   primary so `vercel.json` redirects www → apex.
3. Lower the DNS TTL to 300s **at least an hour before** the change, so a
   rollback propagates quickly.
4. Point DNS at Vercel:
   - `A` record `@` → `76.76.21.21`, **or** the ALIAS/ANAME target Vercel shows
   - `CNAME` `www` → `cname.vercel-dns.com`
   Use whatever Vercel's Domains panel displays — it is authoritative.
5. Wait for the certificate to issue (usually a few minutes).

### Immediately after DNS propagates

```bash
QA_BASE=https://hotdogtrays.com npm run qa
```

Then check by hand:

- [ ] `curl -sI https://hotdogtrays.com/` → `200`
- [ ] `curl -sI https://www.hotdogtrays.com/` → `301` to the apex
- [ ] `curl -sI http://hotdogtrays.com/` → upgrades to HTTPS
- [ ] `curl -sI https://hotdogtrays.com/about` → `308` to `/about/`
- [ ] `curl -sI https://hotdogtrays.com/cart/` → `301` to `/get-quote/`
- [ ] `curl -sI https://hotdogtrays.com/my-account/` → `410`
- [ ] `curl -sI https://hotdogtrays.com/no-such-page/` → `404`
- [ ] `curl -s https://hotdogtrays.com/sitemap.xml | grep -c '<loc>'` → `24`
- [ ] `curl -s https://hotdogtrays.com/robots.txt` → allows `/`, references the sitemap
- [ ] Spot-check 3 product pages: title, canonical, gallery, price, form
- [ ] **Submit one real form** and confirm delivery
- [ ] Validate a product page at <https://validator.schema.org/> and
      <https://search.google.com/test/rich-results>

---

## 5. Post-launch checklist

**Day 1**

- [ ] Google Search Console → URL Inspection on `/`, one product page and
      `/product-category/products/`; request indexing
- [ ] Submit `https://hotdogtrays.com/sitemap.xml` in Search Console
      (**not before launch**)
- [ ] Remove the old `sitemap_index.xml` submission
- [ ] Confirm Search Console shows no new coverage errors
- [ ] Run PageSpeed Insights on the homepage and a product page

**Week 1**

- [ ] Search Console → Pages: confirm the 25 migrated URLs stay indexed
- [ ] Confirm `/cart/` and `/checkout/` show as redirects, `/my-account/` as
      "Not found (410)" — all expected
- [ ] Check Core Web Vitals for regressions
- [ ] Confirm form submissions are still arriving; check the spam folder
- [ ] Watch rankings for the main product terms

**Month 1**

- [ ] Compare organic sessions and impressions against the pre-migration
      baseline
- [ ] Only once traffic and indexing are stable, consider decommissioning
      WordPress — see §6

---

## 6. Rollback

The WordPress site is the rollback. **Do not delete or modify it.**

### Immediate rollback (DNS)

Fastest and complete. Because the WordPress host is untouched, reverting DNS
restores the previous site exactly.

1. Repoint the `A`/`ALIAS` record for `@` and the `CNAME` for `www` back to the
   original WordPress host.
2. With TTL at 300s this propagates in ~5 minutes.
3. Remove the domains from the Vercel project so it cannot reclaim them.

Record the original DNS values **before** step 4 of §4:

```
A     @    → ____________________
CNAME www  → ____________________
TTL        → ____________________
```

### Partial rollback (Vercel)

If the problem is a bad deploy rather than the migration itself, roll back
inside Vercel without touching DNS: Project → Deployments → pick the last good
one → **Promote to Production**.

### Preserving WordPress

While the Astro site is live, keep the WordPress installation:

- reachable at a temporary hostname (for example `old.hotdogtrays.com`) or via a
  hosts-file entry, so it can be inspected;
- **`noindex`** at that temporary hostname (`X-Robots-Tag: noindex`) so it
  cannot compete for the same keywords;
- with plugins and core kept updated while it exists;
- backed up (files + database) before any change.

Keep it for **at least one month** after cutover, and until Search Console shows
indexing and traffic are stable.

### Decommissioning

Once you are confident:

1. Take a final full backup and store it off the host.
2. Confirm every asset under `wp-content/uploads/` referenced by the Astro site
   has a local copy — `src/assets/` already holds all 75, so this is a formality.
3. Then, and only then, shut the installation down.

---

## 7. Ongoing

- **Content edits** are code edits. Product data lives in
  `src/data/products.json`; page sections are Astro components. Commit, push,
  and Vercel rebuilds.
- **Adding a product**: add an entry to `products.json` with a unique slug, drop
  its images into `src/assets/products/`, then `npm run build && npm run qa`.
  The route, sitemap entry, nav dropdown, footer list and schema all follow
  automatically.
- Re-run `npm run qa:all` before every production deploy.
- Run `npm audit` monthly.
