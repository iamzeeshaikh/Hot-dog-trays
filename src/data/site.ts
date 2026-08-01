/**
 * Global site data migrated from the WordPress header, footer and contact page.
 *
 * Every value here was taken from the live site or the Elementor header/footer
 * templates; nothing is invented.
 */
export const SITE_URL = 'https://hotdogtrays.com';
export const SITE_NAME = 'Hot Dog Trays';
export const BRAND_NAME = 'HotDogTrays';
export const TITLE_SUFFIX = ' - Hot Dog Trays';

export const CONTACT = {
  phoneDisplay: '(503) 358-0443',
  phoneHref: 'tel:5033580443',
  whatsappDisplay: '+1 (503) 358-0443',
  whatsappHref: 'https://wa.me/15033580443',
  email: 'info@hotdogtrays.com',
  emailHref: 'mailto:info@hotdogtrays.com',
  address: {
    street: '303 W 137th Street, #5A',
    locality: 'New York',
    region: 'NY',
    postalCode: '10030',
    country: 'US',
  },
} as const;

export const SOCIAL = [
  { label: 'Facebook', href: 'https://facebook.com/hotdogtrays', icon: 'fab fa-facebook-f' },
  { label: 'Instagram', href: 'https://instagram.com/hotdogtrays', icon: 'fab fa-instagram' },
  { label: 'Twitter', href: 'https://twitter.com/hotdogtrays', icon: 'fab fa-twitter' },
  { label: 'LinkedIn', href: 'https://linkedin.com/company/hotdogtrays', icon: 'fab fa-linkedin-in' },
  { label: 'Pinterest', href: 'https://pinterest.com/hotdogtrays', icon: 'fab fa-pinterest-p' },
  { label: 'YouTube', href: 'https://youtube.com/@hotdogtrays', icon: 'fab fa-youtube' },
] as const;

/**
 * The product hub. WooCommerce shipped two identical archives — /shop/ and
 * /product-category/products/ — so the category archive was consolidated into
 * /shop/ with a 301, and every internal link points here directly.
 */
export const CATEGORY = {
  slug: 'products',
  name: 'Shop',
  url: '/shop/',
} as const;
