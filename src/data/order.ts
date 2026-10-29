/**
 * One price, one shipping story and one set of payment methods for every surface
 * that sells: the product-page order box, the Product Offer JSON-LD, the Merchant
 * feed, the checkout and /api/order.
 *
 * Owner's decisions, 2026-10-29: every product sells online in runs of 100 trays for
 * $30.00 (the same $0.30 per tray the site publishes), paid by PayPal invoice, bank
 * transfer invoice, or cash on delivery in the US and Canada. Shipping is whatever
 * src/data/shipping.ts says (free to the US, UK, Canada and Australia). Larger runs
 * and special builds still go through the quote form.
 */
import { SHIPPING } from './shipping';
import { products } from './products';

export const PACK_QTY = 100;
export const PACK_PRICE = 30;
export const MAX_PACKS = 50;
export const CURRENCY = 'USD';
export const money = (n: number) => `$${n.toFixed(2)}`;
export const PACK_PRICE_TEXT = PACK_PRICE.toFixed(2);
export const PACK_LINE = `${PACK_QTY} trays for ${money(PACK_PRICE)}`;

const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
};

/** Countries the checkout accepts: exactly the shipping.ts destinations. */
export const SHIP_COUNTRIES = SHIPPING.destinations.map((d) => ({
  code: d.code,
  name: COUNTRY_NAMES[d.code] ?? d.label,
}));

export const SHIP_LINE = 'Free shipping to the USA, UK, Canada and Australia';

export const PAYMENT_METHODS = [
  {
    id: 'paypal',
    name: 'PayPal invoice',
    detail:
      'We email a PayPal invoice once you approve your free digital proof. Pay with your PayPal balance or a card through PayPal. Production starts when it is paid.',
  },
  {
    id: 'bank',
    name: 'Bank transfer invoice',
    detail:
      'We email an invoice with our bank details once you approve your free digital proof. Production starts when the transfer arrives.',
  },
  {
    id: 'cod',
    name: 'Cash on delivery',
    detail:
      'Nothing is paid up front. You pay the order total when your trays are delivered. Available for US and Canadian addresses.',
  },
] as const;

export type PaymentId = (typeof PAYMENT_METHODS)[number]['id'];

/** Cash on delivery runs through a courier COD service that covers the US and Canada only. */
export const COD_COUNTRIES = ['US', 'CA'];

export const PAYMENT_LINE =
  'Pay by PayPal invoice or bank transfer after you approve your free proof, or cash on delivery in the US and Canada.';

/** slug -> product name, for the checkout and the server-side re-pricing. */
export const ORDER_CATALOG: Record<string, string> = Object.fromEntries(
  products.map((p) => [p.slug, p.name]),
);
