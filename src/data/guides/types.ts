/**
 * Structured content for the supporting guide pages.
 *
 * The layout is shared; the content is not. Every guide carries its own
 * intent, section sequence, table, lists, FAQs and internal-link targets so no
 * two pages read like the same template with the nouns swapped.
 */

export interface GuideTable {
  caption: string;
  headers: string[];
  rows: string[][];
  /** Optional note printed under the table, e.g. a measurement caveat. */
  note?: string;
}

export interface GuideSection {
  /** Rendered as an H2. */
  heading: string;
  /** Paragraphs of body copy. Inline <strong>/<a> is allowed. */
  body: string[];
  /** Optional H3 subsections. */
  subsections?: { heading: string; body: string[] }[];
  /** At most one contextual link per section — enforced by the QA suite. */
  link?: { href: string; anchor: string; lead: string };
  bullets?: { intro?: string; items: string[] };
  steps?: { intro?: string; items: string[] };
  table?: GuideTable;
}

export interface GuideFaq {
  question: string;
  answer: string;
}

export interface Guide {
  slug: string;
  /** Canonical path including the trailing slash. */
  url: string;
  title: string;
  description: string;
  h1: string;
  /** Short line under the H1. */
  standfirst: string;
  /** Breadcrumb label. */
  crumb: string;
  /** Opening paragraphs, before the first H2. */
  intro: string[];
  sections: GuideSection[];
  faqs: GuideFaq[];
  /** Product slugs shown in the related strip. */
  relatedProducts: string[];
  /** Pre-selects the quote form. */
  quoteProduct?: string;
}
