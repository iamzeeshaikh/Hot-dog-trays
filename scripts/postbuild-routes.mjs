#!/usr/bin/env node
/**
 * Injects the spam-parameter route into the Vercel Build Output config.
 *
 * The Astro Vercel adapter emits .vercel/output/config.json using the Build
 * Output API, and Vercel does not apply `rewrites` from vercel.json when a
 * project ships that file — only `redirects` and `headers` survive. A redirect
 * would be wrong here anyway: it would answer the spam URL with a 3xx pointing
 * at a 410, rather than answering the spam URL itself with 410.
 *
 * So the route is added directly, ahead of the filesystem handler, matching
 * `f=<six or more digits>` on any path and serving the 410 endpoint. Genuine
 * marketing parameters (utm_*, gclid, fbclid) and any non-numeric `f` value
 * fall through untouched.
 *
 * Runs automatically after `astro build` via the postbuild script.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const CONFIG = fileURLToPath(new URL('../.vercel/output/config.json', import.meta.url));

const SPAM_ROUTE = {
  src: '^/(?!410\\.html).*$',
  has: [{ type: 'query', key: 'f', value: '\\d{6,}' }],
  // Served as a static document with an explicit 410 status. Routing to a
  // serverless handler instead re-matched this same condition on the rewritten
  // URL — the query string survives a rewrite — and the loop surfaced as a 404.
  dest: '/410.html',
  status: 410,
};

let raw;
try {
  raw = await readFile(CONFIG, 'utf8');
} catch {
  console.log('postbuild-routes: no Vercel build output found, skipping');
  process.exit(0);
}

const config = JSON.parse(raw);
config.routes ??= [];

const already = config.routes.some(
  (r) => r.dest === SPAM_ROUTE.dest && Array.isArray(r.has) && r.has[0]?.key === 'f',
);

if (already) {
  console.log('postbuild-routes: spam route already present');
  process.exit(0);
}

// must sit before the filesystem handler, otherwise the static index.html for
// "/" is served before the query is ever examined
const fsIndex = config.routes.findIndex((r) => r.handle === 'filesystem');
const at = fsIndex === -1 ? 0 : fsIndex;
config.routes.splice(at, 0, SPAM_ROUTE);

await writeFile(CONFIG, JSON.stringify(config, null, 2));
console.log(`postbuild-routes: spam 410 route inserted at index ${at}`);
