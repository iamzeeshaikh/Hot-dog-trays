/**
 * Shipping and returns terms, confirmed by the business owner on 3 August 2026.
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
   * Production before dispatch, in business days after proof approval.
   * Confirmed by the business owner on 2 October 2026.
   */
  handlingDaysMin: 7,
  handlingDaysMax: 10,
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

/**
 * Returns, changed by the business owner on 29 October 2026: defective only.
 *
 * Custom-printed trays are made to the buyer's artwork and cannot be resold, so
 * they are not returnable. Damaged, defective or misprinted orders reported within
 * `claimDays` of delivery, with photos, are reprinted free or refunded.
 */
export const RETURNS = {
  /** Days from delivery to report a damaged, defective or misprinted order. */
  claimDays: 14,
  defectiveOnly: true,
} as const;
