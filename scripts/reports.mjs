#!/usr/bin/env node
/**
 * Generates the migration deliverables: URL inventory, URL comparison,
 * redirect map, metadata comparison and the structured-data report.
 *
 * Old-site data is read from reports/live-snapshot.json (captured from
 * hotdogtrays.com during the audit); new-site data is read from dist/client.
 */
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../dist/client', import.meta.url));
const OUT = fileURLToPath(new URL('../reports', import.meta.url));
const BASE = process.env.QA_BASE ?? 'http://localhost:4321';
const SITE = 'https://hotdogtrays.com';

await mkdir(OUT, { recursive: true });

const snapshot = JSON.parse(await readFile(join(OUT, 'live-snapshot.json'), 'utf8'));

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

/** Decode the HTML entities Astro emits, so comparisons are like-for-like. */
const decode = (s) =>
  String(s ?? '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ')
    .trim();

const csv = (rows) =>
  rows
    .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n') + '\n';

// ---------------------------------------------------------------- new site

const files = (await walk(ROOT)).filter((f) => f.endsWith('.html'));
const pages = new Map();

for (const file of files) {
  const html = await readFile(file, 'utf8');
  const rel = relative(ROOT, file);
  const path =
    rel === 'index.html' ? '/' : rel === '404.html' ? '/404/' : '/' + rel.replace(/index\.html$/, '');

  const grab = (re) => decode(html.match(re)?.[1] ?? '');
  const body = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');

  pages.set(path, {
    path,
    title: grab(/<title>(.*?)<\/title>/s),
    description: grab(/<meta name="description" content="(.*?)"/s),
    canonical: grab(/<link rel="canonical" href="(.*?)"/),
    robots: grab(/<meta name="robots" content="(.*?)"/),
    ogTitle: grab(/<meta property="og:title" content="(.*?)"/s),
    ogImage: grab(/<meta property="og:image" content="(.*?)"/),
    h1: decode((body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) ?? [])[1]?.replace(/<[^>]+>/g, '') ?? ''),
    h2Count: (body.match(/<h2\b/g) ?? []).length,
    h3Count: (body.match(/<h3\b/g) ?? []).length,
    schema: [
      ...new Set(
        [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
          .flatMap((m) => {
            try {
              const d = JSON.parse(m[1].replace(/\\u003c/g, '<'));
              return (d['@graph'] ?? [d]).map((n) => n['@type']);
            } catch {
              return [];
            }
          })
          .filter(Boolean),
      ),
    ],
  });
}

async function status(path) {
  try {
    const res = await fetch(BASE + path, { redirect: 'manual' });
    return { code: res.status, location: res.headers.get('location') ?? '' };
  } catch {
    return { code: 0, location: '' };
  }
}

// ---------------------------------------------------------------- 1. inventory

const inventory = [
  ['old_url', 'old_status', 'old_title', 'old_description', 'old_canonical', 'in_old_sitemap', 'notes'],
];
for (const row of snapshot.urls) {
  inventory.push([
    row.url,
    row.status,
    row.title,
    row.description,
    row.canonical,
    row.inSitemap ? 'yes' : 'no',
    row.notes ?? '',
  ]);
}
await writeFile(join(OUT, 'URL_INVENTORY.csv'), csv(inventory));

// ---------------------------------------------------------------- 2. comparison

const comparison = [
  ['old_url', 'new_url', 'action', 'new_status', 'redirect_target', 'indexable', 'in_new_sitemap', 'notes'],
];
const sitemap = await readFile(join(ROOT, 'sitemap.xml'), 'utf8');
const sitemapUrls = new Set([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]));

for (const row of snapshot.urls) {
  const path = new URL(row.url).pathname;
  const s = await status(path);
  const page = pages.get(path);
  const indexable = page ? !/noindex/.test(page.robots) : false;

  let action;
  if (s.code === 200) action = 'unchanged (200)';
  else if (s.code === 301) action = '301 redirect';
  else if (s.code === 410) action = '410 gone';
  else if (s.code === 404) action = '404';
  else action = `status ${s.code}`;

  comparison.push([
    row.url,
    s.code === 200 ? SITE + path : s.location ? SITE + s.location : '',
    action,
    s.code,
    s.location,
    indexable ? 'yes' : 'no',
    sitemapUrls.has(SITE + path) ? 'yes' : 'no',
    row.migrationNote ?? '',
  ]);
}

// new URLs that did not exist before
for (const path of [...pages.keys()].sort()) {
  if (snapshot.urls.some((r) => new URL(r.url).pathname === path)) continue;
  comparison.push([
    '',
    SITE + path,
    'new URL',
    200,
    '',
    /noindex/.test(pages.get(path).robots) ? 'no' : 'yes',
    sitemapUrls.has(SITE + path) ? 'yes' : 'no',
    path === '/404/' ? 'error page, not routable' : '',
  ]);
}
await writeFile(join(OUT, 'URL_COMPARISON.csv'), csv(comparison));

// ---------------------------------------------------------------- 3. redirects

const redirects = [['source', 'destination', 'status', 'reason', 'verified_single_hop']];
for (const [from, to, reason] of snapshot.redirects) {
  const s = await status(from);
  const hop = s.location ? await status(s.location) : { code: '' };
  redirects.push([from, to, s.code, reason, hop.code === 200 ? 'yes' : `no (${hop.code})`]);
}
await writeFile(join(OUT, 'REDIRECT_MAP.csv'), csv(redirects));

// ---------------------------------------------------------------- 4. metadata

const metadata = [
  [
    'url',
    'old_title',
    'new_title',
    'title_match',
    'old_description',
    'new_description',
    'description_match',
    'old_canonical',
    'new_canonical',
    'old_h1',
    'new_h1',
    'h1_match',
    'source',
  ],
];
for (const row of snapshot.urls) {
  const path = new URL(row.url).pathname;
  const page = pages.get(path);
  if (!page) {
    metadata.push([row.url, row.title, '', 'removed', row.description, '', 'removed', row.canonical, '', row.h1, '', 'removed', row.metaSource ?? '']);
    continue;
  }
  metadata.push([
    row.url,
    row.title,
    page.title,
    decode(row.title) === page.title ? 'exact' : 'changed',
    row.description,
    page.description,
    decode(row.description) === page.description ? 'exact' : row.description ? 'changed' : 'created',
    row.canonical,
    page.canonical,
    row.h1,
    page.h1,
    decode(row.h1) === page.h1 ? 'exact' : 'changed',
    row.metaSource ?? '',
  ]);
}
await writeFile(join(OUT, 'METADATA_COMPARISON.csv'), csv(metadata));

// ---------------------------------------------------------------- 5. schema

const schema = [['url', 'schema_types', 'notes']];
for (const path of [...pages.keys()].sort()) {
  const p = pages.get(path);
  schema.push([
    SITE + path,
    p.schema.join(' | '),
    p.schema.length ? '' : 'no structured data (noindex or error page)',
  ]);
}
await writeFile(join(OUT, 'STRUCTURED_DATA.csv'), csv(schema));

console.log(`URL_INVENTORY.csv        ${inventory.length - 1} old URLs`);
console.log(`URL_COMPARISON.csv       ${comparison.length - 1} rows`);
console.log(`REDIRECT_MAP.csv         ${redirects.length - 1} redirects`);
console.log(`METADATA_COMPARISON.csv  ${metadata.length - 1} rows`);
console.log(`STRUCTURED_DATA.csv      ${schema.length - 1} pages`);
console.log(`\nwritten to ${OUT}`);
