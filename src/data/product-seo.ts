/**
 * Per-product SEO overrides and guide cross-links.
 *
 * The migrated Yoast titles all followed one pattern — "<Product> Wholesale |
 * Hot Dog Trays" — which repeats the same modifier on all fourteen pages and
 * spends characters that could carry intent. Overrides below differentiate
 * them.
 *
 * Pages with recorded Search Console performance are treated conservatively:
 * their titles change only where the new wording leads with a query the page
 * already ranks for. Everything else keeps its migrated description unless it
 * was generic.
 *
 * `guides` adds one contextual pointer per product into the supporting pages.
 * The lead-in sentence is written per product so no two read alike.
 */
export interface ProductSeo {
  /** Replaces the migrated meta title. */
  title?: string;
  /** Replaces the migrated meta description. */
  description?: string;
  /** Why the change was made, for METADATA_COMPARISON.csv. */
  reason?: string;
  /** One contextual guide pointer rendered below the product description. */
  guides: { lead: string; href: string; anchor: string }[];
}

export const productSeo: Record<string, ProductSeo> = {
  'hot-dog-boats-paper': {
    title: 'Paper Hot Dog Boats | Custom Trays in Bulk',
    description:
      'Order paper hot dog boats in custom sizes and prints. Grease-resistant options for events, food trucks and bulk food service.',
    reason:
      'Best performing page (14 clicks, position 10.6). New title leads with "paper hot dog boats", the exact top query, instead of the repeated "Wholesale" pattern.',
    guides: [
      { lead: 'If you are weighing a boat against an open tray, the two formats differ in', href: '/hot-dog-trays-vs-paper-boats/', anchor: 'how they hold the food' },
    ],
  },
  'plastic-hot-dog-trays': {
    title: 'Plastic Hot Dog Trays | Rigid Trays for Wet Menus',
    description:
      'Rigid plastic hot dog trays for saucy menus and longer journeys. Custom sizes, bulk quantities and a straight comparison with paper.',
    reason:
      'Second-best page (3 clicks, position 15.0). Title now signals the genuine advantage — rigidity for wet menus — rather than repeating "Wholesale".',
    guides: [
      { lead: 'Deciding between the two material families is easier alongside', href: '/paper-vs-plastic-hot-dog-trays/', anchor: 'a direct comparison' },
    ],
  },
  'cardboard-hot-dog-holders': {
    title: 'Cardboard Hot Dog Holders | Custom Printed Pockets',
    description:
      'Cardboard hot dog holders with a close pocket fit for handheld eating. Custom sizes and printing for concessions and events.',
    reason:
      'Ranks 9.7 for "hot dog cardboard holder". Title leads with the holder format and its pocket structure to separate it from the cardboard trays page.',
    guides: [
      { lead: 'High-turnover sites should also look at', href: '/hot-dog-trays-for-concession-stands/', anchor: 'pre-staging before a rush' },
    ],
  },
  'hot-dog-container-paper': {
    title: 'Paper Hot Dog Containers | To-Go and Takeaway',
    description:
      'Paper hot dog containers for takeaway and pickup. Grease-resistant board, custom sizes and printing for to-go service.',
    reason:
      'Title now carries the to-go intent the page actually serves, replacing the uniform wholesale pattern.',
    guides: [
      { lead: 'Takeaway adds problems counter service never has, including', href: '/hot-dog-containers-to-go/', anchor: 'steam softening the bun' },
    ],
  },
  'red-and-white-hot-dog-trays': {
    title: 'Red and White Hot Dog Trays | Classic Striped',
    description:
      'Classic red and white striped hot dog trays for concessions, fairs and events. Custom sizes and printed alternatives available.',
    reason:
      'Differentiated on the recognisable striped look rather than repeating "Wholesale".',
    guides: [
      { lead: 'The striped format is a concession staple, which is covered in', href: '/hot-dog-trays-for-concession-stands/', anchor: 'planning for interval rushes' },
    ],
  },
  'kraft-hot-dog-tray': {
    title: 'Kraft Hot Dog Trays | Natural Board, Custom Print',
    description:
      'Kraft hot dog trays in natural brown board. Custom sizes, grease-resistant options and printing designed for kraft stock.',
    reason:
      '317 impressions, 2 clicks. Title now names the material property that drives the query rather than the repeated modifier.',
    guides: [
      { lead: 'Printed colour behaves differently on brown board, which is explained in', href: '/hot-dog-tray-material-guide/', anchor: 'how each stock takes ink' },
    ],
  },
  'paper-hot-dog-trays': {
    title: 'Paper Hot Dog Trays | Custom Printed & Bulk',
    description:
      'Custom paper hot dog trays in your own sizes and printing. Grease-resistant board options and wholesale quantities.',
    reason: 'Generic wholesale title replaced with the custom-print and bulk intent the page serves.',
    guides: [
      { lead: 'Sizing is the decision most worth getting right first, so start with', href: '/hot-dog-tray-sizes/', anchor: 'measuring the assembled portion' },
    ],
  },
  'hot-dog-paper-holders': {
    title: 'Hot Dog Paper Holders | Custom Sizes and Printing',
    description:
      'Paper hot dog holders that keep the bun supported for handheld service. Custom sizes, printing and bulk quantities.',
    reason: 'Repeated wholesale pattern replaced with the customisation intent.',
    guides: [
      { lead: 'Holders suit service where customers eat on the move, such as', href: '/hot-dog-trays-for-food-trucks/', anchor: 'a market or festival pitch' },
    ],
  },
  'disposable-hot-dog-holders': {
    title: 'Disposable Hot Dog Holders | Single Use, Bulk',
    description:
      'Single-use hot dog holders for fast service with no washing up. Custom sizes, printing and wholesale quantities.',
    reason: 'Differentiated on the single-use benefit rather than repeating "Wholesale".',
    guides: [
      { lead: 'Volume buyers should read', href: '/hot-dog-trays-in-bulk/', anchor: 'setting a reorder point' },
    ],
  },
  'hot-dog-serving-tray': {
    title: 'Hot Dog Serving Trays | Custom Sizes for Service',
    description:
      'Open hot dog serving trays built around your portion size. Custom printing, grease-resistant board and bulk ordering.',
    reason: 'Uniform wholesale title replaced with the sizing intent that matches the page content.',
    guides: [
      { lead: 'Getting the fit right starts with', href: '/hot-dog-tray-sizes/', anchor: 'measuring bun length and topping height' },
    ],
  },
  'disposable-hot-dog-trays': {
    title: 'Disposable Hot Dog Trays | Single Use in Bulk',
    description:
      'Disposable hot dog trays for high-turnover service. Custom sizes, printing and bulk quantities with no washing up.',
    reason: 'Differentiated on single-use and turnover rather than the repeated modifier.',
    guides: [
      { lead: 'Stadium and event stands will find more detail in', href: '/hot-dog-trays-for-concession-stands/', anchor: 'throughput at a busy counter' },
    ],
  },
  'hot-dog-plates': {
    title: 'Hot Dog Plates | Flat Serving Plates, Custom',
    description:
      'Flat hot dog plates for buffets and table service. Custom sizes and printing, with bulk quantities for events.',
    reason: 'Title now names the flat-plate format, separating it from the tray pages.',
    guides: [
      { lead: 'Self-service buffets have their own requirements, set out in', href: '/hot-dog-trays-for-catering/', anchor: 'guest-loaded stations' },
    ],
  },
  'cardboard-hot-dog-trays': {
    title: 'Cardboard Hot Dog Trays | Rigid Board, Custom',
    description:
      'Rigid cardboard hot dog trays for heavier portions and longer carries. Custom sizes, printing and bulk pricing.',
    reason: 'Title names the board rigidity to separate it from the cardboard holders page.',
    guides: [
      { lead: 'Heavier portions need more board, which is why', href: '/footlong-hot-dog-trays/', anchor: 'longer trays are specified differently' },
    ],
  },
  'hot-dog-food-tray': {
    title: 'Hot Dog Food Trays | Custom Printed Food Service',
    description:
      'Hot dog food trays for fast counter service. Custom sizes, grease-resistant options and printed branding in bulk.',
    reason: 'Uniform wholesale title replaced with the food-service intent.',
    guides: [
      { lead: 'If you are choosing between board types, compare', href: '/hot-dog-tray-material-guide/', anchor: 'what each stock is good at' },
    ],
  },
};
