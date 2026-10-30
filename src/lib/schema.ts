import { SITE_URL, SITE_NAME, BRAND_NAME, CONTACT } from '../data/site';
import { SHIPPING } from '../data/shipping';
import { PACK_QTY, PACK_PRICE_TEXT } from '../data/order';
import type { Product, ProductFaq } from '../data/products';

/**
 * JSON-LD builders.
 *
 * Every node here is backed by content that is actually visible on the page.
 *
 * No aggregateRating or Review nodes: the owner removed every rating on
 * 2026-10-31 (Merchant Center misrepresentation fix) because none can be
 * backed by real, visible customer reviews.
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

  // Online pack price (src/data/order.ts, owner 2026-10-29): 100 trays for $30.00,
  // the same constant the order box, the checkout, /api/order and the Merchant feed
  // read. Shipping comes from src/data/shipping.ts. Returns are defective-only.
  node.offers = {
    '@type': 'Offer',
    '@id': `${abs(p.url)}#offer`,
    price: PACK_PRICE_TEXT,
    priceCurrency: 'USD',
    eligibleQuantity: { '@type': 'QuantitativeValue', value: PACK_QTY, unitCode: 'C62' },
    priceValidUntil: '2027-08-04',
    itemCondition: 'https://schema.org/NewCondition',
    availability: p.inStock
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock',
    url: abs(p.url),
    seller: { '@id': `${SITE_URL}/#organization` },
    shippingDetails: SHIPPING.destinations.map((d) => ({
      '@type': 'OfferShippingDetails',
      shippingRate: {
        '@type': 'MonetaryAmount',
        value: SHIPPING.rate,
        currency: SHIPPING.currency,
      },
      shippingDestination: { '@type': 'DefinedRegion', addressCountry: d.code },
      deliveryTime: {
        '@type': 'ShippingDeliveryTime',
        handlingTime: {
          '@type': 'QuantitativeValue',
          minValue: SHIPPING.handlingDaysMin,
          maxValue: SHIPPING.handlingDaysMax,
          unitCode: 'DAY',
        },
        transitTime: {
          '@type': 'QuantitativeValue',
          minValue: SHIPPING.transitDaysMin,
          maxValue: SHIPPING.transitDaysMax,
          unitCode: 'DAY',
        },
      },
    })),
    // Custom-printed trays are not returnable; damaged, defective or misprinted
    // orders reported within RETURNS.claimDays are reprinted or refunded.
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      '@id': `${SITE_URL}/#returnpolicy`,
      applicableCountry: SHIPPING.destinations.map((d) => d.code),
      returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
      merchantReturnLink: `${SITE_URL}/terms-conditions/`,
    },
  };

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

/**
 * Article schema for the blog. Headline, description, hero image and the
 * published date all come from the post's own frontmatter, which is what the
 * page renders. Posts carry no byline, so the organization is author as well
 * as publisher.
 */
export function blogPosting(post: {
  title: string;
  metaDescription: string;
  url: string;
  image: string;
  date: string;
}) {
  const published = `${post.date}T12:00:00Z`;
  return {
    '@type': 'BlogPosting',
    '@id': `${abs(post.url)}#article`,
    headline: post.title,
    description: post.metaDescription,
    url: abs(post.url),
    image: abs(post.image),
    datePublished: published,
    dateModified: published,
    inLanguage: 'en-US',
    author: { '@id': `${SITE_URL}/#organization` },
    publisher: { '@id': `${SITE_URL}/#organization` },
    isPartOf: { '@id': `${SITE_URL}/#website` },
    mainEntityOfPage: { '@type': 'WebPage', '@id': abs(post.url) },
  };
}

export function webPage(
  path: string,
  name: string,
  description: string,
  /** Narrows the node where schema.org has a better fit than plain WebPage. */
  type: 'WebPage' | 'AboutPage' | 'ContactPage' = 'WebPage',
) {
  return {
    '@type': type,
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
