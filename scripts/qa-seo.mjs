#!/usr/bin/env node
/**
 * SEO-expansion QA: link discipline, content similarity and spam handling.
 *
 * Complements scripts/qa.mjs, which covers URLs, metadata, schema and build
 * hygiene. This suite checks the things the SEO work specifically introduced.
 */
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../dist/client', import.meta.url));
const BASE = process.env.QA_BASE ?? 'http://localhost:4321';

const results = [];
const pass = (n, d = '') => results.push({ ok: true, n, d });
const fail = (n, d) => results.push({ ok: false, n, d });

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full)));
    else if (e.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const strip = (h) =>
  h.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
const text = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const pages = [];
for (const f of await walk(ROOT)) {
  const rel = relative(ROOT, f);
  if (rel === '404.html' || rel === '410.html') continue;
  const html = await readFile(f, 'utf8');
  const path = rel === 'index.html' ? '/' : '/' + rel.replace(/index\.html$/, '');
  pages.push({ path, html, body: strip(html) });
}

// Editorial regions only: nav, footer, breadcrumbs, grids and CTAs are exempt
// from the contextual-link policy.
function editorialRegions(body) {
  const regions = [];
  const patterns = [
    /<div class="hdt-guide-main"[\s\S]*?(?=<aside)/,
    /<div class="hdt-product-description"[\s\S]*?(?=<\/div>\s*<\/div>)/,
    /<div class="hdt-product-short"[\s\S]*?(?=<\/div>)/,
    /<div class="hdt-product-guides-inner"[\s\S]*?(?=<\/div>)/,
    /<div class="hdt-policy-body"[\s\S]*?(?=<\/div>)/,
  ];
  for (const p of patterns) {
    const m = body.match(p);
    if (m) regions.push(m[0]);
  }
  return regions;
}

// --- 1. no self-links in editorial copy ------------------------------------
// Navigation, footer and grids list every product, so a product page always
// links to itself from those. Only editorial regions are checked.
let selfLinks = 0;
for (const p of pages) {
  for (const region of editorialRegions(p.body)) {
    const selfs = [...region.matchAll(/<a\b[^>]*href="([^"]+)"/gi)]
      .map((m) => m[1])
      .filter((h) => h === p.path || h === `https://hotdogtrays.com${p.path}`);
    if (selfs.length) {
      selfLinks += selfs.length;
      fail(`no editorial self-link: ${p.path}`, `${selfs.length} found`);
    }
  }
}
if (!selfLinks) pass('no page self-links from editorial copy');

// --- 2. one contextual link per section, in newly authored copy ------------
// Guide bodies and the product "Before you order" block are authored by this
// work and must obey the one-per-section policy. Links inside the migrated
// WooCommerce descriptions predate it and are protected from removal by the
// internal-link preservation rules, so they are counted and reported instead.
const AUTHORED = [
  /<div class="hdt-guide-main"[\s\S]*?(?=<aside)/,
  /<div class="hdt-product-guides-inner"[\s\S]*?(?=<\/div>)/,
];
let overLinked = 0;
let migratedMulti = 0;
for (const p of pages) {
  for (const pattern of AUTHORED) {
    const m = p.body.match(pattern);
    if (!m) continue;
    m[0].split(/<h2\b/i).forEach((chunk, i) => {
      const links = [...chunk.matchAll(/<a\b[^>]*href="(\/[^"#]*)"/gi)].filter(
        (l) => !l[1].startsWith('/api/') && !l[1].startsWith('/_astro/'),
      );
      if (links.length > 1) {
        overLinked++;
        fail(`one contextual link per section: ${p.path}`, `section ${i}: ${links.map((l) => l[1]).join(', ')}`);
      }
    });
  }
  const desc = p.body.match(/<div class="hdt-product-description"[\s\S]*?(?=<\/div>\s*<\/div>)/);
  if (desc) {
    for (const chunk of desc[0].split(/<h2\b/i)) {
      if ([...chunk.matchAll(/<a\b[^>]*href="\/[^"#]*"/gi)].length > 1) migratedMulti++;
    }
  }
}
if (!overLinked) pass('one contextual link per section in authored copy');
pass(
  'migrated description links preserved',
  `${migratedMulti} pre-existing sections carry more than one link; kept under the link-preservation rules`,
);

// --- 3. no two contextual links in one paragraph ---------------------------
let doubled = 0;
for (const p of pages) {
  for (const region of AUTHORED.map((r) => p.body.match(r)?.[0]).filter(Boolean)) {
    for (const para of region.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)) {
      const links = [...para[1].matchAll(/<a\b[^>]*href="(\/[^"#]*)"/gi)];
      if (links.length > 1) {
        doubled++;
        fail(`one link per paragraph: ${p.path}`, links.map((l) => l[1]).join(', '));
      }
    }
  }
}
if (!doubled) pass('no paragraph carries two contextual links');

// --- 4. banned generic anchors ---------------------------------------------
const BANNED = /^(click here|learn more|read more|view|explore|here|more)$/i;
let banned = 0;
for (const p of pages) {
  for (const region of editorialRegions(p.body)) {
    for (const m of region.matchAll(/<a\b[^>]*href="\/[^"]*"[^>]*>([\s\S]*?)<\/a>/gi)) {
      const anchor = text(m[1]);
      if (BANNED.test(anchor)) {
        banned++;
        fail(`descriptive anchor: ${p.path}`, `"${anchor}"`);
      }
    }
  }
}
if (!banned) pass('no generic anchors in editorial copy');

// --- 5. anchor reuse across pages ------------------------------------------
const anchorUse = new Map();
for (const p of pages) {
  for (const region of editorialRegions(p.body)) {
    for (const m of region.matchAll(/<a\b[^>]*href="(\/[^"#]*)"[^>]*>([\s\S]*?)<\/a>/gi)) {
      const anchor = text(m[2]).toLowerCase();
      if (!anchor || anchor.length < 4) continue;
      const key = anchor;
      anchorUse.set(key, (anchorUse.get(key) ?? 0) + 1);
    }
  }
}
const overused = [...anchorUse.entries()].filter(([, n]) => n > 3);
if (overused.length) {
  fail('anchor reuse', overused.map(([a, n]) => `"${a}" x${n}`).join('; '));
} else {
  pass('no anchor text repeated more than three times', `${anchorUse.size} distinct anchors`);
}

// --- 6. orphan pages --------------------------------------------------------
const linked = new Set();
for (const p of pages) {
  for (const m of p.body.matchAll(/href="(\/[^"#?]*)"/g)) linked.add(m[1]);
}
// noindex pages are deliberately outside the link graph, so they cannot orphan
const indexable = pages.filter((p) => !/<meta name="robots" content="noindex/.test(p.html));
const orphans = indexable.map((p) => p.path).filter((path) => path !== '/' && !linked.has(path));
orphans.length ? fail('orphan pages', orphans.join(', ')) : pass('no orphan pages', `${indexable.length} indexable pages all linked`);

// --- 7. content similarity --------------------------------------------------
function shingles(s) {
  const words = s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  const set = new Set();
  for (let i = 0; i + 4 <= words.length; i++) set.add(words.slice(i, i + 4).join(' '));
  return set;
}
function jaccard(a, b) {
  let shared = 0;
  for (const x of a) if (b.has(x)) shared++;
  return shared / (a.size + b.size - shared || 1);
}

// compare only the editorial body of content pages
const corpus = pages
  .map((p) => {
    const regions = editorialRegions(p.body);
    return { path: p.path, text: text(regions.join(' ')) };
  })
  .filter((p) => p.text.split(' ').length > 250);

const sig = corpus.map((c) => ({ ...c, sh: shingles(c.text) }));
let worst = { score: 0 };
for (let i = 0; i < sig.length; i++) {
  for (let j = i + 1; j < sig.length; j++) {
    const score = jaccard(sig[i].sh, sig[j].sh);
    if (score > worst.score) worst = { score, a: sig[i].path, b: sig[j].path };
    if (score > 0.4) fail('content too similar', `${sig[i].path} vs ${sig[j].path} (${(score * 100).toFixed(0)}%)`);
  }
}
pass(
  'content similarity within tolerance',
  `${corpus.length} pages compared, highest overlap ${(worst.score * 100).toFixed(1)}% (${worst.a} vs ${worst.b})`,
);

// --- 8. repeated intros and headings ---------------------------------------
const intros = new Map();
for (const c of corpus) {
  const first = c.text.split(' ').slice(0, 25).join(' ').toLowerCase();
  intros.set(first, [...(intros.get(first) ?? []), c.path]);
}
const dupIntro = [...intros.values()].filter((v) => v.length > 1);
dupIntro.length
  ? fail('repeated opening paragraphs', dupIntro.map((v) => v.join(' = ')).join('; '))
  : pass('every page opens differently');

// --- 9. spam parameter handling --------------------------------------------
let serverUp = true;
try {
  await fetch(BASE + '/', { method: 'HEAD' });
} catch {
  serverUp = false;
  fail('preview server', `not reachable at ${BASE}`);
}

if (serverUp) {
  const spam = ['/?f=93634828680378', '/?f=9304932592251', '/?f=3367874333321', '/shop/?f=41614282821828'];
  for (const u of spam) {
    const r = await fetch(BASE + u, { redirect: 'manual' });
    r.status === 410 ? pass(`spam 410: ${u}`) : fail(`spam 410: ${u}`, `status ${r.status}`);
  }

  const legit = ['/?utm_source=google', '/?gclid=abc', '/?fbclid=xyz', '/?f=hello'];
  for (const u of legit) {
    const r = await fetch(BASE + u, { redirect: 'manual' });
    r.status === 200 ? pass(`legitimate param 200: ${u}`) : fail(`legitimate param: ${u}`, `status ${r.status}`);
  }

  // consolidated archive redirects in one hop
  const cat = await fetch(BASE + '/product-category/products/', { redirect: 'manual' });
  if (cat.status === 301 && cat.headers.get('location') === '/shop/') {
    const hop = await fetch(BASE + '/shop/', { redirect: 'manual' });
    hop.status === 200
      ? pass('/product-category/products/ 301 -> /shop/ in one hop')
      : fail('category redirect target', `status ${hop.status}`);
  } else {
    fail('category redirect', `status ${cat.status} -> ${cat.headers.get('location')}`);
  }

  // no internal link may point at a redirecting URL
  const redirecting = new Set(['/product-category/products/', '/product-category/products', '/cart/', '/checkout/', '/returns-policy/']);
  let through = 0;
  for (const p of pages) {
    for (const m of p.body.matchAll(/href="(\/[^"#?]*)"/g)) {
      if (redirecting.has(m[1])) {
        through++;
        fail('link points through a redirect', `${p.path} -> ${m[1]}`);
      }
    }
  }
  if (!through) pass('no internal link points through a redirect');
}

// --- report -----------------------------------------------------------------
const failures = results.filter((r) => !r.ok);
console.log('\n' + '='.repeat(72));
if (failures.length) {
  console.log(`SEO QA FAILURES (${failures.length})\n`);
  for (const f of failures.slice(0, 40)) console.log(`  ✗ ${f.n}${f.d ? ` — ${f.d}` : ''}`);
} else {
  console.log('All SEO QA checks passed.');
  for (const r of results.filter((x) => x.d)) console.log(`  · ${r.n} — ${r.d}`);
}
console.log(`\n${results.length - failures.length} passed, ${failures.length} failed`);
console.log('='.repeat(72));
process.exit(failures.length ? 1 : 0);
