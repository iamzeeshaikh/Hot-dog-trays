import type { APIRoute } from 'astro';
import products from '../data/products.json';
import { guides } from '../data/guides';
import { BLOG_POSTS } from '../lib/blog';
import { productSeo } from '../data/product-seo';
import { SITE_URL, SITE_NAME, CONTACT } from '../data/site';

/**
 * llms.txt: a plain-text map of the site for AI assistants and answer engines,
 * built from the same data as the pages so it never drifts.
 */
export const GET: APIRoute = () => {
  const line = (title: string, path: string, note: string) => `- [${title}](${SITE_URL}${path}): ${note}`;
  const body = [
    `# ${SITE_NAME}`,
    '',
    '> Custom and stock hot dog trays, paper boats, holders, plates and food containers for food trucks, stands, concessions, caterers and restaurants, shipped free to the USA, UK, Canada and Australia.',
    '',
    `Phone ${CONTACT.phoneDisplay}. Email ${CONTACT.email}. Quotes and free design support at ${SITE_URL}/get-quote/.`,
    '',
    '## Products',
    ...products.map((p) =>
      line(p.name, new URL(p.url, SITE_URL).pathname, productSeo[p.slug]?.description ?? p.metaDescription),
    ),
    '',
    '## Guides',
    ...guides.map((g) => line(g.h1, g.url, g.description)),
    '',
    '## Articles',
    ...BLOG_POSTS.map((b) => line(b.title, b.url, b.metaDescription)),
    '',
    '## Company',
    line('Shop all hot dog trays', '/shop/', 'Every tray, boat, holder, plate and container in one place.'),
    line('Get a quote', '/get-quote/', 'Send sizes, quantities and artwork for a custom quote.'),
    line('FAQ', '/faq/', 'Ordering, minimums, production, shipping and payment questions.'),
    line('Shipping', '/shipping/', 'Free shipping to the USA, UK, Canada and Australia, delivery times and tracking.'),
    line('Contact', '/contact/', 'Phone, email and office address.'),
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
