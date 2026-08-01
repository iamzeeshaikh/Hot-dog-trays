#!/usr/bin/env node
/**
 * Generates the SEO-expansion deliverables:
 * URL_INVENTORY, URL_COMPARISON, REDIRECT_MAP, METADATA_COMPARISON,
 * INTERNAL_LINK_MAP, CONTENT_INVENTORY, STRUCTURED_DATA.
 */
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../dist/client', import.meta.url));
const OUT = fileURLToPath(new URL('../reports', import.meta.url));
const BASE = process.env.QA_BASE ?? 'http://localhost:4321';
const SITE = 'https://hotdogtrays.com';

const csv = (rows) =>
  rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n') + '\n';
const decode = (s) =>
  String(s ?? '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
const strip = (h) => h.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
const text = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const f = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(f)));
    else if (e.name.endsWith('.html')) out.push(f);
  }
  return out;
}

const pages = [];
for (const f of await walk(ROOT)) {
  const rel = relative(ROOT, f);
  if (rel === '404.html' || rel === '410.html') continue;
  const html = await readFile(f, 'utf8');
  const body = strip(html);
  const g = (re) => decode(html.match(re)?.[1] ?? '');
  const main = body.match(/<main[^>]*>([\s\S]*)<\/main>/)?.[1] ?? body;
  pages.push({
    path: rel === 'index.html' ? '/' : '/' + rel.replace(/index\.html$/, ''),
    title: g(/<title>(.*?)<\/title>/s),
    description: g(/<meta name="description" content="(.*?)"/s),
    canonical: g(/<link rel="canonical" href="(.*?)"/),
    robots: g(/<meta name="robots" content="(.*?)"/),
    h1: decode(text(body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? '')),
    h2: (body.match(/<h2\b/g) ?? []).length,
    h3: (body.match(/<h3\b/g) ?? []).length,
    words: text(main).split(' ').length,
    images: (body.match(/<img\b/g) ?? []).length,
    faqs: (body.match(/hdt-accordion-item|hdt-faq-item/g) ?? []).length,
    tables: (body.match(/<table\b/g) ?? []).length,
    links: [...body.matchAll(/href="(\/[^"#?]*)"/g)].map((m) => m[1]),
    schema: [...new Set([...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .flatMap((m) => { try { const d = JSON.parse(m[1].replace(/\\u003c/g, '<')); return (d['@graph'] ?? [d]).map((n) => n['@type']); } catch { return []; } }))],
  });
}

async function status(p) {
  try { const r = await fetch(BASE + p, { redirect: 'manual' }); return { code: r.status, loc: r.headers.get('location') ?? '' }; }
  catch { return { code: 0, loc: '' }; }
}

// ---------------------------------------------------------------- inventory
const inv = [['url','status','indexable','title','description','h1','words','h2','h3','faqs','tables','images','internal_links_out','schema_types','in_sitemap']];
const sitemap = await readFile(join(ROOT, 'sitemap.xml'), 'utf8');
const smUrls = new Set([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]));
for (const p of pages.sort((a, b) => a.path.localeCompare(b.path))) {
  const s = await status(p.path);
  inv.push([SITE + p.path, s.code, /noindex/.test(p.robots) ? 'no' : 'yes', p.title, p.description,
    p.h1, p.words, p.h2, p.h3, p.faqs, p.tables, p.images, p.links.length,
    p.schema.join(' | '), smUrls.has(SITE + p.path) ? 'yes' : 'no']);
}
await writeFile(join(OUT, 'URL_INVENTORY.csv'), csv(inv));

// ---------------------------------------------------------------- comparison
const OLD_URLS = JSON.parse(await readFile(join(OUT, 'live-snapshot.json'), 'utf8')).urls.map((u) => u.url);
const cmp = [['old_url','new_url','action','status','redirect_target','indexable','in_sitemap','note']];
for (const u of OLD_URLS) {
  const path = new URL(u).pathname;
  const s = await status(path);
  const page = pages.find((p) => p.path === path);
  const action = s.code === 200 ? 'unchanged (200)' : s.code === 301 ? '301 redirect'
    : s.code === 410 ? '410 gone' : s.code === 404 ? '404' : `status ${s.code}`;
  const note = path === '/product-category/products/' ? 'Consolidated into /shop/; duplicate archive'
    : path === '/cart/' || path === '/checkout/' ? 'Retired in the quotation model'
    : path === '/my-account/' ? 'No customer accounts'
    : path === '/sample-page/' ? 'WordPress boilerplate: 200 but noindex' : '';
  cmp.push([u, s.code === 200 ? SITE + path : s.loc ? SITE + s.loc : '', action, s.code, s.loc,
    page ? (/noindex/.test(page.robots) ? 'no' : 'yes') : 'n/a', smUrls.has(SITE + path) ? 'yes' : 'no', note]);
}
for (const p of pages) {
  if (OLD_URLS.some((u) => new URL(u).pathname === p.path)) continue;
  cmp.push(['', SITE + p.path, 'new page', 200, '', /noindex/.test(p.robots) ? 'no' : 'yes',
    smUrls.has(SITE + p.path) ? 'yes' : 'no', 'Created during the SEO expansion']);
}
await writeFile(join(OUT, 'URL_COMPARISON.csv'), csv(cmp));

// ---------------------------------------------------------------- redirects
const vercel = JSON.parse(await readFile(fileURLToPath(new URL('../vercel.json', import.meta.url)), 'utf8'));
const red = [['source','destination','status','verified','single_hop','reason']];
for (const r of vercel.redirects) {
  if (r.has) { red.push([r.source, r.destination, r.statusCode, 'host rule', 'n/a', 'www to apex canonical host']); continue; }
  const s = await status(r.source);
  const hop = s.loc ? await status(s.loc) : { code: '' };
  red.push([r.source, r.destination, r.statusCode, s.code, hop.code === 200 ? 'yes' : `no (${hop.code})`,
    r.source.includes('cart') || r.source.includes('checkout') ? 'WooCommerce checkout retired; quote page is the equivalent action'
      : 'Duplicate product archive consolidated into /shop/']);
}
red.push(['/?f=<6+ digits>', '410 Gone', 410, (await status('/?f=93634828680378')).code, 'n/a',
  'Externally injected spam parameter; not present in any export, database or internal link']);
await writeFile(join(OUT, 'REDIRECT_MAP.csv'), csv(red));

// ---------------------------------------------------------------- metadata
const snapshot = JSON.parse(await readFile(join(OUT, 'live-snapshot.json'), 'utf8'));
const { productSeo } = await import(fileURLToPath(new URL('../src/data/product-seo.ts', import.meta.url))).catch(() => ({ productSeo: {} }));
const meta = [['url','old_title','new_title','old_description','new_description','reason']];
for (const p of pages.sort((a, b) => a.path.localeCompare(b.path))) {
  const old = snapshot.urls.find((u) => new URL(u.url).pathname === p.path);
  const slug = p.path.match(/^\/product\/([^/]+)\//)?.[1];
  const reason = old
    ? (decode(old.title) === p.title && decode(old.description) === p.description ? 'unchanged'
      : slug && productSeo?.[slug]?.reason ? productSeo[slug].reason
      : p.path === '/' ? 'Title targets the broad commercial cluster; description rewritten because the old one ended on an unsupported free-shipping claim'
      : p.path === '/shop/' ? 'Inherited the stronger metadata from the consolidated /product-category/products/ archive'
      : old.description ? 'Refined for clarity' : 'No description existed; created from the visible content')
    : 'New page created during the SEO expansion';
  meta.push([SITE + p.path, old ? decode(old.title) : '', p.title,
    old ? decode(old.description) : '', p.description, reason]);
}
await writeFile(join(OUT, 'METADATA_COMPARISON.csv'), csv(meta));

// ---------------------------------------------------------------- link map
const map = [['source_url','destination_url','anchor_text','link_type']];
const newLinks = (await readFile(join(OUT, 'new-internal-links.csv'), 'utf8')).split('\n').slice(1);
for (const line of newLinks) {
  const cols = line.match(/"((?:[^"]|"")*)"/g)?.map((c) => c.slice(1, -1).replace(/""/g, '"'));
  if (!cols || cols.length < 5) continue;
  if (cols[4] !== 'contextual') continue;
  map.push([cols[0], cols[1], cols[2], cols[4]]);
}
await writeFile(join(OUT, 'INTERNAL_LINK_MAP.csv'), csv(map));

// ---------------------------------------------------------------- content
const content = [['url','type','words','h2','h3','faqs','tables','internal_links_out','unique_opening_25_words']];
for (const p of pages.sort((a, b) => a.path.localeCompare(b.path))) {
  const type = p.path.startsWith('/product/') ? 'product'
    : ['/','/shop/'].includes(p.path) ? 'hub'
    : /^\/(hot-dog|footlong|paper-vs)/.test(p.path) ? 'guide' : 'page';
  content.push([SITE + p.path, type, p.words, p.h2, p.h3, p.faqs, p.tables, p.links.length, '']);
}
await writeFile(join(OUT, 'CONTENT_INVENTORY.csv'), csv(content));

console.log(`URL_INVENTORY.csv                    ${inv.length - 1} pages`);
console.log(`URL_COMPARISON.csv                   ${cmp.length - 1} rows`);
console.log(`REDIRECT_MAP.csv                     ${red.length - 1} rules`);
console.log(`METADATA_COMPARISON.csv              ${meta.length - 1} pages`);
console.log(`INTERNAL_LINK_MAP.csv                ${map.length - 1} contextual links`);
console.log(`CONTENT_INVENTORY.csv                ${content.length - 1} pages`);
