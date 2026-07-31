import type { APIRoute } from 'astro';
import { SITE_URL } from '../data/site';

/**
 * The WordPress robots.txt allowed everything and pointed at /sitemap.xml.
 * That is preserved, with the form endpoint kept out of the crawl.
 */
export const GET: APIRoute = () =>
  new Response(
    ['User-agent: *', 'Allow: /', 'Disallow: /api/', '', `Sitemap: ${SITE_URL}/sitemap.xml`, ''].join(
      '\n',
    ),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
