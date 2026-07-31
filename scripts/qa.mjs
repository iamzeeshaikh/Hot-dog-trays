#!/usr/bin/env node
/**
 * Migration QA suite.
 *
 * Runs against the built output in dist/client and the preview server, and
 * checks every requirement listed in the migration brief's QA phase.
 *
 *   npm run build && npm run preview &   # in another shell
 *   npm run qa
 */
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../dist/client', import.meta.url));
const BASE = process.env.QA_BASE ?? 'http://localhost:4321';
const SITE = 'https://hotdogtrays.com';

const results = [];
const pass = (name, detail = '') => results.push({ ok: true, name, detail });
const fail = (name, detail) => results.push({ ok: false, name, detail });

// ---------------------------------------------------------------- helpers

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const strip = (html) =>
  html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');

function pathOf(file) {
  const rel = relative(ROOT, file);
  if (rel === 'index.html') return '/';
  if (rel === '404.html') return '/404/';
  return '/' + rel.replace(/index\.html$/, '');
}

async function head(url, method = 'GET') {
  const res = await fetch(url, { method, redirect: 'manual' });
  return { status: res.status, location: res.headers.get('location') };
}

// ---------------------------------------------------------------- checks

const files = (await walk(ROOT)).filter((f) => f.endsWith('.html'));
const pages = [];

for (const file of files) {
  const html = await readFile(file, 'utf8');
  pages.push({ file, path: pathOf(file), html, body: strip(html) });
}

console.log(`Checking ${pages.length} built pages\n`);

// --- 1. one H1 per page --------------------------------------------------
for (const p of pages) {
  const h1 = p.body.match(/<h1\b/gi) ?? [];
  if (h1.length === 1) pass(`single H1: ${p.path}`);
  else fail(`single H1: ${p.path}`, `found ${h1.length}`);
}

// --- 2. titles and descriptions -----------------------------------------
const titles = new Map();
for (const p of pages) {
  const title = p.html.match(/<title>(.*?)<\/title>/s)?.[1]?.trim();
  const desc = p.html.match(/<meta name="description" content="(.*?)"/s)?.[1]?.trim();
  const noindex = /<meta name="robots" content="noindex/.test(p.html);

  if (!title) fail(`title present: ${p.path}`, 'missing');
  else {
    pass(`title present: ${p.path}`);
    titles.set(title, [...(titles.get(title) ?? []), p.path]);
  }

  if (p.path === '/404/' || noindex) continue;
  if (!desc) fail(`description present: ${p.path}`, 'missing');
  else pass(`description present: ${p.path}`);
}

for (const [title, paths] of titles) {
  if (paths.length > 1) fail('duplicate title', `${JSON.stringify(title)} on ${paths.join(', ')}`);
}
if (![...titles.values()].some((v) => v.length > 1)) pass('no duplicate titles');

// --- 3. canonicals -------------------------------------------------------
for (const p of pages) {
  const canonical = p.html.match(/<link rel="canonical" href="(.*?)"/)?.[1];
  if (!canonical) {
    fail(`canonical: ${p.path}`, 'missing');
    continue;
  }
  if (/localhost|127\.0\.0\.1|vercel\.app|\.local/.test(canonical)) {
    fail(`canonical host: ${p.path}`, canonical);
  } else if (canonical !== SITE + p.path) {
    fail(`canonical value: ${p.path}`, `expected ${SITE + p.path}, got ${canonical}`);
  } else {
    pass(`canonical: ${p.path}`);
  }
}

// --- 4. JSON-LD ----------------------------------------------------------
let productSchemas = 0;
for (const p of pages) {
  const blocks = [...p.html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (p.path === '/404/' || p.path === '/sample-page/') continue;
  if (!blocks.length) {
    fail(`json-ld present: ${p.path}`, 'none');
    continue;
  }
  const types = [];
  for (const b of blocks) {
    let parsed;
    try {
      parsed = JSON.parse(b[1].replace(/\\u003c/g, '<'));
    } catch (e) {
      fail(`json-ld parses: ${p.path}`, e.message);
      continue;
    }
    for (const node of parsed['@graph'] ?? [parsed]) types.push(node['@type']);
  }
  pass(`json-ld parses: ${p.path}`, types.join(', '));

  const counts = types.reduce((a, t) => ({ ...a, [t]: (a[t] ?? 0) + 1 }), {});
  for (const dup of ['Product', 'BreadcrumbList', 'FAQPage']) {
    if (counts[dup] > 1) fail(`duplicate ${dup} schema: ${p.path}`, `x${counts[dup]}`);
  }
  if (counts.Product) productSchemas++;

  // no fabricated ratings or reviews anywhere
  if (/aggregateRating|"review"|"@type":"Review"/.test(p.html)) {
    fail(`no fabricated reviews: ${p.path}`, 'rating/review node present');
  }
}
pass('product schema count', `${productSchemas} pages carry Product schema`);

// --- 5. FAQ schema matches visible questions -----------------------------
for (const p of pages) {
  const block = [...p.html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((m) => {
      try {
        return JSON.parse(m[1].replace(/\\u003c/g, '<'));
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .flatMap((d) => d['@graph'] ?? [d])
    .find((n) => n['@type'] === 'FAQPage');
  if (!block) continue;

  const visible = text(p.body).toLowerCase();
  const missing = block.mainEntity.filter((q) => {
    const needle = q.name.replace(/\s+/g, ' ').trim().toLowerCase();
    return !visible.includes(needle);
  });
  if (missing.length) {
    fail(`FAQ schema visible: ${p.path}`, `${missing.length} not on page: ${missing[0]?.name}`);
  } else {
    pass(`FAQ schema visible: ${p.path}`, `${block.mainEntity.length} questions`);
  }
}

// --- 6. residue ----------------------------------------------------------
const RESIDUE = [
  ['WordPress shortcode', /\[(?:vc_|et_pb|elementor|gallery|caption|embed|contact-form)[^\]]*\]/],
  ['Elementor class', /class="[^"]*elementor/],
  ['ChatGPT paste residue', /data-turn-id|text-token-text-primary|data-message-model-slug/],
  ['wp-content hotlink', /https?:\/\/[^"']*wp-content\/uploads/],
  ['lorem ipsum', /lorem ipsum/i],
  ['TODO marker', /\bTODO\b|\bFIXME\b|\bplaceholder text\b/i],
  ['literal backslash-n', /\\n(?![a-z])/],
];
for (const p of pages) {
  // JSON-LD payloads legitimately contain escaped newlines and encoded markup,
  // so residue is scanned against the rendered HTML only.
  const markup = p.html.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/g,
    '',
  );
  for (const [label, re] of RESIDUE) {
    if (re.test(markup)) fail(`${label}: ${p.path}`, markup.match(re)[0].slice(0, 70));
  }
}
if (!results.some((r) => !r.ok && RESIDUE.some(([l]) => r.name.startsWith(l)))) {
  pass('no WordPress/Elementor/ChatGPT residue in any page');
}

// --- 7. duplicate sections ----------------------------------------------
for (const p of pages) {
  const headings = [...p.body.matchAll(/<h([23])[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) =>
    text(m[2]).toLowerCase(),
  );
  for (const target of ['description', 'related products', 'frequently asked questions']) {
    const n = headings.filter((h) => h === target).length;
    if (n > 1) fail(`duplicate "${target}" heading: ${p.path}`, `x${n}`);
  }
  const inquiryForms = (p.body.match(/data-quote-form/g) ?? []).length;
  if (inquiryForms > 1) fail(`multiple quote forms: ${p.path}`, `x${inquiryForms}`);
}
pass('no duplicated Description / Related Products / FAQ sections, one quote form per page');

// --- 8. images -----------------------------------------------------------
const assetFiles = new Set((await walk(ROOT)).map((f) => '/' + relative(ROOT, f)));
let imgCount = 0;
let missingAlt = 0;
for (const p of pages) {
  for (const m of p.body.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    imgCount++;
    const src = tag.match(/\ssrc="([^"]+)"/)?.[1];
    if (src?.startsWith('/') && !assetFiles.has(src.split('?')[0])) {
      fail(`image exists: ${p.path}`, src);
    }
    if (!/\salt(?:=|[\s>])/.test(tag)) {
      missingAlt++;
      fail(`image alt attribute: ${p.path}`, tag.slice(0, 90));
    }
    if (!/\swidth="/.test(tag) || !/\sheight="/.test(tag)) {
      fail(`image dimensions: ${p.path}`, tag.slice(0, 90));
    }
  }
}
if (!missingAlt) pass('every image has an alt attribute', `${imgCount} images checked`);

// --- 9. internal links ---------------------------------------------------
const known = new Set(pages.map((p) => p.path));
known.add('/sitemap.xml');
known.add('/robots.txt');
known.add('/my-account/');
const broken = new Map();
for (const p of pages) {
  for (const m of p.body.matchAll(/\shref="(\/[^"#?]*)"/g)) {
    const href = m[1];
    if (href.startsWith('/api/') || href.startsWith('/_astro/')) continue;
    if (!known.has(href) && !assetFiles.has(href)) {
      broken.set(href, [...(broken.get(href) ?? []), p.path]);
    }
  }
}
if (broken.size) {
  for (const [href, from] of broken) fail('broken internal link', `${href} <- ${from.join(', ')}`);
} else {
  pass('all internal links resolve');
}

// --- 9b. every page carries a CSP that covers its own inline scripts ------
// Regression guard: Astro inlines small script chunks, so a strict
// `script-src 'self'` with no hashes silently kills every interactive widget.
for (const p of pages) {
  const meta = p.html.match(
    /<meta http-equiv="content-security-policy" content="([^"]*)"/i,
  )?.[1];
  if (!meta) {
    fail(`CSP meta present: ${p.path}`, 'missing');
    continue;
  }

  const inlineScripts = [...p.html.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)];
  const scriptSrc = meta.match(/script-src ([^;]*)/)?.[1] ?? '';
  const hashCount = (scriptSrc.match(/'sha\d{3}-/g) ?? []).length;

  if (inlineScripts.length > hashCount) {
    fail(
      `CSP covers inline scripts: ${p.path}`,
      `${inlineScripts.length} inline script(s), ${hashCount} hash(es)`,
    );
  } else {
    pass(`CSP covers inline scripts: ${p.path}`, `${inlineScripts.length} inline, ${hashCount} hashed`);
  }

  if (/'unsafe-inline'/.test(scriptSrc)) {
    fail(`CSP script-src has no unsafe-inline: ${p.path}`, scriptSrc.slice(0, 60));
  }
}

// inline style attributes cannot be hashed; they need 'unsafe-inline'
for (const p of pages) {
  const styleAttrs = (p.body.match(/\sstyle="/g) ?? []).length;
  if (styleAttrs > 0) {
    fail(`no inline style attributes: ${p.path}`, `${styleAttrs} found`);
  }
}
pass('no inline style attributes anywhere (strict style-src)');

// --- 10. no secrets or private exports in the build ----------------------
const allFiles = await walk(ROOT);
const leaked = allFiles.filter((f) => /\.(sql|csv)$/i.test(f) || /\.xml$/i.test(f) && !f.endsWith('sitemap.xml'));
if (leaked.length) fail('private export in build', leaked.join(', '));
else pass('no SQL/CSV/XML exports in build output');

let secretHit = false;
for (const f of allFiles.filter((f) => /\.(html|js|css|txt|json)$/.test(f))) {
  const c = await readFile(f, 'utf8');
  if (/SMTP_PASS|SMTP_USER\s*=|nodemailer/.test(c)) {
    fail('secret or mailer leaked to client', relative(ROOT, f));
    secretHit = true;
  }
}
if (!secretHit) pass('no SMTP credentials or mailer code in client output');

// --- 11. sitemap ---------------------------------------------------------
const sitemap = await readFile(join(ROOT, 'sitemap.xml'), 'utf8');
const locs = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
const dupes = locs.filter((l, i) => locs.indexOf(l) !== i);
if (dupes.length) fail('sitemap duplicates', dupes.join(', '));
else pass('sitemap has no duplicates', `${locs.length} URLs`);

for (const loc of locs) {
  if (!loc.startsWith('https://hotdogtrays.com/')) fail('sitemap non-canonical host', loc);
  if (!loc.endsWith('/')) fail('sitemap missing trailing slash', loc);
}

const noindexPaths = pages
  .filter((p) => /<meta name="robots" content="noindex/.test(p.html))
  .map((p) => SITE + p.path);
for (const n of noindexPaths) {
  if (locs.includes(n)) fail('noindex page in sitemap', n);
}
pass('sitemap excludes noindex pages', noindexPaths.join(', ') || 'none');

const indexable = pages
  .filter((p) => !/<meta name="robots" content="noindex/.test(p.html))
  .map((p) => SITE + p.path);
for (const i of indexable) {
  if (!locs.includes(i)) fail('indexable page missing from sitemap', i);
}

// --- 12. live HTTP behaviour --------------------------------------------
let serverUp = true;
try {
  await fetch(BASE + '/', { method: 'HEAD' });
} catch {
  serverUp = false;
  fail('preview server', `not reachable at ${BASE} — run "npm run preview" first`);
}

if (serverUp) {
  // every sitemap URL must return 200 with no redirect hop
  for (const loc of locs) {
    const path = new URL(loc).pathname;
    const r = await head(BASE + path);
    if (r.status === 200) pass(`sitemap URL 200: ${path}`);
    else fail(`sitemap URL 200: ${path}`, `status ${r.status} -> ${r.location ?? ''}`);
  }

  // unchanged URLs must not pass through a redirect
  for (const p of pages) {
    if (p.path === '/404/') continue;
    const r = await head(BASE + p.path);
    if (p.path === '/my-account/') {
      r.status === 410 ? pass('410: /my-account/') : fail('410: /my-account/', `status ${r.status}`);
      continue;
    }
    if (r.status !== 200) fail(`direct 200: ${p.path}`, `status ${r.status}`);
  }

  // redirects: single hop, correct target, no loop
  for (const [from, to] of [
    ['/cart/', '/get-quote/'],
    ['/checkout/', '/get-quote/'],
  ]) {
    const r = await head(BASE + from);
    if (r.status !== 301) {
      fail(`redirect ${from}`, `status ${r.status}`);
      continue;
    }
    if (r.location !== to) {
      fail(`redirect target ${from}`, r.location ?? 'none');
      continue;
    }
    const hop = await head(BASE + r.location);
    if (hop.status !== 200) fail(`redirect chain ${from}`, `${to} -> ${hop.status}`);
    else pass(`redirect ${from} -> ${to} (single hop, 200)`);
  }

  // unknown URLs are genuine 404s, never redirected to the homepage
  for (const u of ['/no-such-page/', '/wp-admin/', '/wp-login.php', '/wp-json/', '/feed/', '/2026/01/']) {
    const r = await head(BASE + u);
    if (r.status === 404) pass(`404: ${u}`);
    else fail(`404: ${u}`, `status ${r.status} -> ${r.location ?? ''}`);
  }

  // trailing-slash normalisation
  const r = await head(BASE + '/about');
  if ([301, 308].includes(r.status) && r.location === '/about/') {
    pass('trailing slash redirect /about -> /about/');
  } else {
    fail('trailing slash redirect', `status ${r.status} -> ${r.location}`);
  }
}

// --- 13. product data integrity -----------------------------------------
const products = JSON.parse(
  await readFile(new URL('../src/data/products.json', import.meta.url), 'utf8'),
);
const slugs = products.map((p) => p.slug);
if (new Set(slugs).size === slugs.length) pass('product slugs are unique', `${slugs.length} products`);
else fail('duplicate product slug', slugs.filter((s, i) => slugs.indexOf(s) !== i).join(', '));

for (const p of products) {
  if (!p.images.length) fail(`product has images: ${p.slug}`, 'none');
  if (p.images.some((i) => !i.alt)) fail(`product image alt: ${p.slug}`, 'empty alt');
  if (!p.metaTitle || !p.metaDescription) fail(`product metadata: ${p.slug}`, 'missing');
  if (!p.related.length) fail(`product related: ${p.slug}`, 'none');
  for (const r of p.related) {
    if (!slugs.includes(r)) fail(`related slug valid: ${p.slug}`, r);
  }
  if (p.categorySlug !== 'products') fail(`category link: ${p.slug}`, p.categorySlug);
}
pass('product/category relationships valid');

// every product is reachable from at least one other page (no orphans)
const linkedSlugs = new Set();
for (const p of pages) {
  for (const m of p.body.matchAll(/href="\/product\/([^/"]+)\//g)) linkedSlugs.add(m[1]);
}
const orphans = slugs.filter((s) => !linkedSlugs.has(s));
if (orphans.length) fail('orphan product pages', orphans.join(', '));
else pass('no orphan product pages', `${slugs.length} products internally linked`);

// ---------------------------------------------------------------- report

const failures = results.filter((r) => !r.ok);
const passes = results.filter((r) => r.ok);

console.log(`\n${'='.repeat(72)}`);
if (failures.length) {
  console.log(`FAILURES (${failures.length})\n`);
  for (const f of failures) console.log(`  ✗ ${f.name}${f.detail ? ` — ${f.detail}` : ''}`);
} else {
  console.log('All checks passed.');
}
console.log(`\n${passes.length} passed, ${failures.length} failed`);
console.log('='.repeat(72));

process.exit(failures.length ? 1 : 0);
