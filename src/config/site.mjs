/**
 * Canonical site constants.
 *
 * Shared between astro.config.mjs (plain ESM, no TS) and the app code via
 * src/config/site.ts, so this file must stay dependency-free.
 */
export const SITE_URL = 'https://hotdogtrays.com';

/** Paths that must never enter the sitemap or be indexed. */
export const NOINDEX_PATHS = [
  '/sample-page/', // WordPress boilerplate: kept at 200, removed from the index
  '/404/',
  '/api/',
];
