/**
 * Google Merchant feed, built from the same catalog and the same src/data/order.ts and
 * src/data/shipping.ts values as the product pages, their JSON-LD, the checkout and
 * /api/order: one item per product, 100 trays for $30.00, free shipping to every
 * shipping.ts destination.
 */
import type { APIRoute } from 'astro';
import { products } from '../data/products';
import { productSeo } from '../data/product-seo';
import { SHIPPING } from '../data/shipping';
import { PACK_QTY, PACK_PRICE_TEXT } from '../data/order';
import { SITE_URL } from '../config/site.mjs';

const files = import.meta.glob<{ default: ImageMetadata }>(
  ['/src/assets/products/*.{jpg,jpeg,png,webp}', '!**/._*'],
  { eager: true },
);

const x = (s: unknown) =>
  String(s ?? '').replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c] as string);
const strip = (h: string) => h.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

export const GET: APIRoute = () => {
  const items = products
    .map((p) => {
      const imgs = p.images
        .map((i) => files[`/src/assets/products/${i.file}`]?.default.src)
        .filter((s): s is string => Boolean(s))
        .slice(0, 6)
        .map((s) => encodeURI(`${SITE_URL}${s}`));
      if (!imgs.length) return '';
      const desc = productSeo[p.slug]?.description ?? p.metaDescription ?? strip(p.shortDescription);
      return `  <item>
    <g:id>HDT-${x(p.slug)}</g:id>
    <title>${x(`${p.name} - ${PACK_QTY} Custom Printed Trays`)}</title>
    <description>${x(`${desc} Sold in runs of ${PACK_QTY} trays on our standard build, printed with your logo after a free digital proof.`)}</description>
    <link>${SITE_URL}${p.url}</link>
    <g:image_link>${x(imgs[0])}</g:image_link>${imgs
      .slice(1)
      .map((u) => `\n    <g:additional_image_link>${x(u)}</g:additional_image_link>`)
      .join('')}
    <g:availability>${p.inStock ? 'in_stock' : 'out_of_stock'}</g:availability>
    <g:condition>new</g:condition>
    <g:price>${PACK_PRICE_TEXT} USD</g:price>
    <g:multipack>${PACK_QTY}</g:multipack>
    <g:brand>${x(p.brand || 'Hot Dog Trays')}</g:brand>
    <g:identifier_exists>no</g:identifier_exists>
    <g:mpn>${x(p.sku)}</g:mpn>
    <g:product_type>${x(p.category)}</g:product_type>
${SHIPPING.destinations.map((d) => `    <g:shipping><g:country>${d.code}</g:country><g:service>Free shipping</g:service><g:price>0.00 USD</g:price><g:min_transit_time>${SHIPPING.transitDaysMin}</g:min_transit_time><g:max_transit_time>${SHIPPING.transitDaysMax}</g:max_transit_time></g:shipping>`).join('\n')}
    <g:min_handling_time>${SHIPPING.handlingDaysMin}</g:min_handling_time>
    <g:max_handling_time>${SHIPPING.handlingDaysMax}</g:max_handling_time>
  </item>`;
    })
    .filter(Boolean)
    .join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>Hot Dog Trays</title>
  <link>${SITE_URL}/</link>
  <description>Custom printed hot dog trays.</description>
${items}
</channel>
</rss>
`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
