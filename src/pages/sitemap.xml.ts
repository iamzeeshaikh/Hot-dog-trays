import type { APIRoute } from 'astro';
import { products } from '../data/products';
import { guides } from '../data/guides';
import { BLOG_POSTS } from '../lib/blog';
import { SITE_URL } from '../data/site';

/**
 * Hand-built sitemap so the file lives at exactly /sitemap.xml, the path the
 * WordPress robots.txt advertised and Search Console already knows.
 *
 * Only canonical, indexable, 200-returning URLs are listed: no redirects, no
 * noindex pages, no API routes, no WooCommerce cart/account URLs.
 */
const staticPaths = [
  '/',
  '/shop/',
  '/about/',
  '/contact/',
  '/faq/',
  '/get-quote/',
  '/shipping/',
  '/privacy-policy/',
  '/terms-conditions/',
];

export const GET: APIRoute = () => {
  const urls = [
    ...staticPaths,
    '/blog/',
    ...products.map((p) => p.url),
    ...guides.map((g) => g.url),
    ...BLOG_POSTS.map((b) => b.url),
  ];
  const unique = [...new Set(urls)];

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...unique.map((path) => `  <url><loc>${new URL(path, SITE_URL).href}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
