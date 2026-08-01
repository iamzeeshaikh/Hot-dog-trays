#!/usr/bin/env node
/**
 * Captures the complete internal-link graph BEFORE any content change.
 *
 * Reads from whichever source is given (the live WordPress site, or the built
 * Astro output) and records every internal link with its anchor text, the
 * section it sits in, and what kind of link it is. This is the baseline the
 * preservation report is compared against.
 *
 *   node scripts/link-baseline.mjs live   > reports/OLD_INTERNAL_LINK_BASELINE.csv
 *   node scripts/link-baseline.mjs build  > reports/new-internal-links.csv
 */
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const MODE = process.argv[2] ?? 'build';
const SITE = 'https://hotdogtrays.com';
const DIST = fileURLToPath(new URL('../dist/client', import.meta.url));

const strip = (h) =>
  h.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
const text = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#\d+;/g, '').replace(/\s+/g, ' ').trim();

/** Classify a link by the container it sits in. */
function classify(html, index) {
  const before = html.slice(0, index);
  const openTag = (tag) =>
    (before.match(new RegExp(`<${tag}\\b`, 'gi')) ?? []).length >
    (before.match(new RegExp(`</${tag}>`, 'gi')) ?? []).length;

  if (openTag('header')) return 'navigation';
  if (openTag('footer')) return 'footer';
  if (/class="[^"]*hdt-breadcrumbs[^"]*"[^>]*>(?:(?!<\/nav>)[\s\S])*$/.test(before)) return 'breadcrumb';
  if (/hdt-product-card|hdt-product-grid|hdt-related/.test(before.slice(-4000))) return 'related-product';
  if (/hdt-cta|hdt-hero-btn|hdt-product-cta|hdt-quote/.test(before.slice(-600))) return 'cta';
  if (/hdt-featured|hdt-categories/.test(before.slice(-4000))) return 'category';
  return 'contextual';
}

/** Nearest preceding heading, so a link can be traced back to its section. */
function sectionOf(html, index) {
  const before = html.slice(0, index);
  const heads = [...before.matchAll(/<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi)];
  const last = heads.at(-1);
  return last ? text(last[2]).slice(0, 80) : '(page top)';
}

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full)));
    else if (e.name.endsWith('.html')) out.push(full);
  }
  return out;
}

async function pagesFromBuild() {
  const files = await walk(DIST);
  const out = [];
  for (const f of files) {
    const rel = relative(DIST, f);
    if (rel === '404.html') continue;
    const path = rel === 'index.html' ? '/' : '/' + rel.replace(/index\.html$/, '');
    out.push({ path, html: await readFile(f, 'utf8') });
  }
  return out;
}

async function pagesFromLive() {
  const sitemap = await (await fetch(`${SITE}/sitemap_index.xml`)).text();
  const maps = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  const urls = new Set();
  for (const m of maps) {
    const body = await (await fetch(m)).text();
    for (const u of body.matchAll(/<loc>(.*?)<\/loc>/g)) urls.add(u[1]);
  }
  const out = [];
  for (const u of urls) {
    try {
      const res = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) continue;
      out.push({ path: new URL(u).pathname, html: await res.text() });
    } catch {
      /* unreachable page is reported as missing rather than failing the run */
    }
  }
  return out;
}

const pages = MODE === 'live' ? await pagesFromLive() : await pagesFromBuild();

const rows = [
  ['source_url', 'destination_url', 'anchor_text', 'section', 'link_type', 'http_status', 'notes'],
];
const seen = new Set();

for (const page of pages) {
  const body = strip(page.html);
  for (const m of body.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
    let href = m[1];
    const anchor = text(m[2]);

    if (/^(mailto:|tel:|javascript:|#)/i.test(href)) continue;
    if (/^https?:\/\//i.test(href)) {
      if (!href.startsWith(SITE) && !href.includes('hotdogtrays.com')) continue;
      href = new URL(href).pathname + new URL(href).search;
    }
    if (!href.startsWith('/')) continue;
    if (href.startsWith('/_astro/') || href.startsWith('/wp-content/')) continue;

    const key = `${page.path}|${href}|${anchor}`;
    if (seen.has(key)) continue;
    seen.add(key);

    rows.push([
      SITE + page.path,
      SITE + href,
      anchor,
      sectionOf(body, m.index),
      classify(body, m.index),
      '',
      '',
    ]);
  }
}

// resolve destination status once per unique URL
const dests = [...new Set(rows.slice(1).map((r) => r[1]))];
const status = new Map();
const base = MODE === 'live' ? SITE : (process.env.QA_BASE ?? 'http://localhost:4321');
for (const d of dests) {
  const path = new URL(d).pathname;
  try {
    const res = await fetch(base + path, { redirect: 'manual' });
    status.set(d, res.status);
  } catch {
    status.set(d, 0);
  }
}
for (const r of rows.slice(1)) r[5] = status.get(r[1]) ?? '';

process.stdout.write(
  rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n') + '\n',
);

process.stderr.write(
  `${MODE}: ${pages.length} pages, ${rows.length - 1} internal links\n`,
);
