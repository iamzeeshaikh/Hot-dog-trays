#!/usr/bin/env node
/**
 * Local preview of the production build.
 *
 * `astro preview` cannot serve a build made with the Vercel adapter, so this
 * mirrors the behaviour Vercel will apply in production: trailing-slash
 * redirects, the configured 301s, a genuine 404 for unknown URLs and a 410 for
 * the retired account URL.
 *
 * Usage: node scripts/preview-server.mjs [port]
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The production security headers from vercel.json are applied here too, so the
 * preview fails the same way production would if, say, the CSP blocks a script.
 */
const vercelConfig = JSON.parse(
  await readFile(fileURLToPath(new URL('../vercel.json', import.meta.url)), 'utf8'),
);
const GLOBAL_HEADERS = Object.fromEntries(
  (vercelConfig.headers.find((h) => h.source === '/(.*)')?.headers ?? []).map((h) => [
    h.key,
    h.value,
  ]),
);

const ROOT = fileURLToPath(new URL('../dist/client', import.meta.url));
const PORT = Number(process.argv[2] ?? 4321);

/**
 * Redirects are read from vercel.json rather than restated here. A hardcoded
 * copy previously hid a real bug: the rules did not match the trailing-slash
 * URLs, which only showed up once deployed.
 */
const REDIRECTS = new Map(
  (vercelConfig.redirects ?? [])
    .filter((r) => !r.has && !r.destination.startsWith('http'))
    .map((r) => [r.source, r.destination]),
);

/** Mirrors src/pages/my-account/index.astro, which responds 410. */
const GONE = new Set(['/my-account/']);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

async function readIfFile(path) {
  try {
    const info = await stat(path);
    if (!info.isFile()) return null;
    return await readFile(path);
  } catch {
    return null;
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  let pathname = decodeURIComponent(url.pathname);

  // guard against path traversal before anything touches the filesystem
  if (normalize(pathname).includes('..')) {
    res.writeHead(400).end('Bad request');
    return;
  }

  const hasExtension = Boolean(extname(pathname));

  // trailingSlash: "always"
  if (!hasExtension && !pathname.endsWith('/')) {
    res.writeHead(308, { Location: pathname + '/' + url.search }).end();
    return;
  }

  if (REDIRECTS.has(pathname)) {
    res.writeHead(301, { Location: REDIRECTS.get(pathname) }).end();
    return;
  }

  if (GONE.has(pathname)) {
    const body = await readIfFile(join(ROOT, '404.html'));
    res
      .writeHead(410, { 'Content-Type': MIME['.html'] })
      .end(body ?? 'This page is no longer available.');
    return;
  }

  const candidates = hasExtension
    ? [join(ROOT, pathname)]
    : [join(ROOT, pathname, 'index.html')];

  for (const candidate of candidates) {
    const body = await readIfFile(candidate);
    if (!body) continue;
    res
      .writeHead(200, {
        ...GLOBAL_HEADERS,
        'Content-Type': MIME[extname(candidate)] ?? 'application/octet-stream',
      })
      .end(body);
    return;
  }

  const notFound = await readIfFile(join(ROOT, '404.html'));
  res
    .writeHead(404, { 'Content-Type': MIME['.html'] })
    .end(notFound ?? 'Not found');
});

server.listen(PORT, () => {
  console.log(`Preview of dist/client running at http://localhost:${PORT}/`);
  console.log('Note: /api/quote/ is a serverless function — use `npm run dev` to exercise forms.');
});
