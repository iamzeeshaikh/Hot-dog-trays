import { SITE_URL, SITE_NAME, BRAND_NAME, CONTACT, SOCIAL } from '../data/site';
import type { Product, ProductFaq } from '../data/products';

/**
 * JSON-LD builders.
 *
 * Every node here is backed by content that is actually visible on the page.
 * The WordPress build emitted an aggregateRating of 4.5 from a single review
 * authored by "webmaster" on both the product and category pages; those nodes
 * are deliberately not carried over because no real reviews exist.
 */

const abs = (path: string) => new URL(path, SITE_URL).href;

export function organization() {
  return {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: BRAND_NAME,
    url: `${SITE_URL}/`,
    email: CONTACT.email,
    telephone: CONTACT.phoneDisplay,
    address: {
      '@type': 'PostalAddress',
      streetAddress: CONTACT.address.street,
      addressLocality: CONTACT.address.locality,
      addressRegion: CONTACT.address.region,
      postalCode: CONTACT.address.postalCode,
      addressCountry: CONTACT.address.country,
    },
    sameAs: SOCIAL.map((s) => s.href),
  };
}

export function website() {
  return {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: `${SITE_URL}/`,
    name: BRAND_NAME,
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
}

export interface Crumb {
  name: string;
  url: string;
}

export function breadcrumbs(path: string, crumbs: Crumb[]) {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${abs(path)}#breadcrumb`,
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: abs(c.url),
    })),
  };
}

export function faqPage(path: string, faqs: ProductFaq[]) {
  return {
    '@type': 'FAQPage',
    '@id': `${abs(path)}#faq`,
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

export function product(p: Product, imageUrls: string[]) {
  const price = Number.parseFloat(p.price);
  const node: Record<string, unknown> = {
    '@type': 'Product',
    '@id': `${abs(p.url)}#product`,
    name: p.name,
    description: p.metaDescription,
    sku: p.sku,
    url: abs(p.url),
    image: imageUrls.map((u) => abs(u)),
    category: p.category,
    brand: { '@type': 'Brand', name: p.brand },
  };

  // The starting price is the only commercial figure the catalogue actually
  // carries; no discounts, shipping rates or return windows are invented.
  if (Number.isFinite(price)) {
    node.offers = {
      '@type': 'Offer',
      '@id': `${abs(p.url)}#offer`,
      price: price.toFixed(2),
      priceCurrency: p.currency,
      availability: p.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: abs(p.url),
      seller: { '@id': `${SITE_URL}/#organization` },
    };
  }

  return node;
}

export function collectionPage(path: string, name: string, description: string, items: Product[]) {
  return [
    {
      '@type': 'CollectionPage',
      '@id': `${abs(path)}#collectionpage`,
      url: abs(path),
      name,
      description,
      isPartOf: { '@id': `${SITE_URL}/#website` },
      mainEntity: { '@id': `${abs(path)}#itemlist` },
    },
    {
      '@type': 'ItemList',
      '@id': `${abs(path)}#itemlist`,
      name,
      numberOfItems: items.length,
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      itemListElement: items.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: p.name,
        url: abs(p.url),
      })),
    },
  ];
}

export function webPage(path: string, name: string, description: string) {
  return {
    '@type': 'WebPage',
    '@id': `${abs(path)}#webpage`,
    url: abs(path),
    name,
    description,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: { '@id': `${SITE_URL}/#organization` },
  };
}

/** Wrap nodes into a single @graph document. */
export function graph(nodes: unknown[]) {
  return { '@context': 'https://schema.org', '@graph': nodes.filter(Boolean) };
}

export { SITE_NAME };
