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
    '> Custom printed hot dog trays, paper boats, holders, plates and food containers for food trucks, stands, concessions, caterers and restaurants, shipped free to the USA, UK, Canada and Australia.',
    '',
    `Pricing: every product is ordered online in packs of 100 for $30.00 (USD), with free design and free shipping. Larger runs and special sizes, materials or finishes are quoted at ${SITE_URL}/get-quote/.`,
    '',
    'Payment: by PayPal invoice or bank transfer invoice after the customer approves a free digital proof, or cash on delivery for US and Canadian addresses. No payment is taken on the website.',
    '',
    'Production and delivery: 7-10 business days of production after proof approval, then 5-7 days in transit.',
    '',
    `Returns: custom-printed trays are not returnable for a change of mind. Damaged, defective or misprinted orders reported within 14 days of delivery with photos are reprinted free or refunded (refunds within 10 business days). Policy: ${SITE_URL}/terms-conditions/`,
    '',
    `Business address: ${CONTACT.address.street}, ${CONTACT.address.locality}, ${CONTACT.address.region} ${CONTACT.address.postalCode}, United States. Phone ${CONTACT.phoneDisplay}. Email ${CONTACT.email}.`,
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
    line('Contact', '/contact/', 'Phone, email, WhatsApp, business hours and address.'),
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
