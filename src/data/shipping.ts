/**
 * Shipping terms, confirmed by the business owner on 3 August 2026.
 *
 * These values drive both the visible copy and the `OfferShippingDetails`
 * node in Product schema. Google requires the two to agree, so they are
 * defined once here rather than written separately in each place.
 *
 * Change these and both the page text and the structured data follow.
 */
export const SHIPPING = {
  /** Free shipping on all orders. */
  free: true,
  currency: 'USD',
  rate: '0',
  /** Delivery window in days, once an order is in transit. */
  transitDaysMin: 5,
  transitDaysMax: 7,
  /**
   * Countries shipped to, as ISO 3166-1 alpha-2 for schema plus a display
   * label for the page copy.
   */
  destinations: [
    { code: 'US', label: 'USA' },
    { code: 'GB', label: 'UK' },
    { code: 'CA', label: 'Canada' },
    { code: 'AU', label: 'Australia' },
  ],
} as const;

/** "USA, UK, Canada and Australia" — for sentences. */
export const shippingCountriesSentence = (() => {
  const labels = SHIPPING.destinations.map((d) => d.label);
  return `${labels.slice(0, -1).join(', ')} and ${labels.at(-1)}`;
})();

/** "5-7 days" — for badges and short labels. */
export const shippingWindow = `${SHIPPING.transitDaysMin}-${SHIPPING.transitDaysMax} days`;
