import type { Guide } from './types';
import { sizesGuide } from './sizes';
import { footlongGuide } from './footlong';
import { materialGuide } from './material-guide';
import { toGoGuide } from './to-go';
import { bulkGuide } from './bulk';
import { foodTrucksGuide } from './food-trucks';
import { concessionGuide } from './concession';
import { cateringGuide } from './catering';
import { paperVsPlasticGuide } from './paper-vs-plastic';
import { traysVsBoatsGuide } from './trays-vs-boats';

/**
 * The supporting guide pages. Each drives one root-level URL with a trailing
 * slash and carries its own intent, structure, table, lists and FAQs.
 *
 * `hot-dog-tray-material-guide` stands in for the originally planned
 * `hot-dog-trays-with-lids`: the evidence for a lidded product line did not
 * hold up, so a guide was published rather than a commercial page asserting
 * something the catalogue does not offer. See material-guide.ts for the detail.
 */
export const guides: Guide[] = [
  sizesGuide,
  footlongGuide,
  materialGuide,
  toGoGuide,
  bulkGuide,
  foodTrucksGuide,
  concessionGuide,
  cateringGuide,
  paperVsPlasticGuide,
  traysVsBoatsGuide,
];

export const guideBySlug = new Map(guides.map((g) => [g.slug, g]));

export type { Guide };
