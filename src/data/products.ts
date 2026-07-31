import rawProducts from './products.json';

export interface ProductImage {
  /** Original WordPress upload filename, preserved verbatim. */
  file: string;
  /** Alt text exactly as stored in the WordPress media library. */
  alt: string;
  /** Original absolute URL on the WordPress install (provenance only). */
  src: string;
}

export interface SpecTable {
  headers: string[];
  rows: string[][];
}

export interface ProductFaq {
  question: string;
  /** Sanitised HTML fragment. */
  answer: string;
}

export interface Product {
  id: number;
  slug: string;
  /** Canonical path, trailing slash included. */
  url: string;
  name: string;
  sku: string;
  category: string;
  categorySlug: string;
  brand: string;
  shortDescription: string;
  description: string;
  /** Starting price as exported by WooCommerce; '' when absent. */
  price: string;
  currency: string;
  inStock: boolean;
  images: ProductImage[];
  specifications: SpecTable;
  faqs: ProductFaq[];
  metaTitle: string;
  metaDescription: string;
  canonical: string;
  position: number;
  /** Slugs of the four neighbouring products in catalogue order. */
  related: string[];
}

export const products: Product[] = rawProducts as Product[];

/** Catalogue order used by WooCommerce archives (alphabetical by name). */
export const productsAlphabetical: Product[] = [...products].sort((a, b) =>
  a.name.localeCompare(b.name, 'en'),
);

const bySlug = new Map(products.map((p) => [p.slug, p]));

export function getProduct(slug: string): Product | undefined {
  return bySlug.get(slug);
}

export function getRelated(product: Product): Product[] {
  return product.related
    .map((slug) => bySlug.get(slug))
    .filter((p): p is Product => Boolean(p));
}

/** Lowest starting price across the catalogue, for the archive pages. */
export function startingPrice(product: Product): string | null {
  const n = Number.parseFloat(product.price);
  return Number.isFinite(n) ? n.toFixed(2) : null;
}
