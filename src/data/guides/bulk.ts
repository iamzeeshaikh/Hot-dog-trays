import type { Guide } from './types';

export const bulkGuide: Guide = {
  slug: 'hot-dog-trays-in-bulk',
  url: '/hot-dog-trays-in-bulk/',
  title: 'Hot Dog Trays in Bulk | Wholesale Ordering Guide',
  description:
    'How to plan bulk hot dog tray orders: quantity, storage, print setup, cost drivers and a sensible reorder rhythm.',
  h1: 'Buying Hot Dog Trays in Bulk',
  standfirst:
    'Practical guidance on quantity, storage and reordering — written for the person who has to find somewhere to put the pallet.',
  crumb: 'Buying in Bulk',
  intro: [
    'Bulk buying looks like a straightforward trade: order more, pay less per unit. In practice the saving is real but it is not the whole calculation. Storage, cash tied up in stock, and the risk of a design change all sit on the other side of the ledger.',
    'This page is about getting that balance right, rather than simply arguing for the largest possible order.',
  ],
  sections: [
    {
      heading: 'What actually drives the unit price',
      body: [
        'Two costs sit behind every printed tray: the setup, which is spent once however many you order, and the running cost, which repeats per unit. Bulk pricing works by spreading that fixed setup across more units.',
        'This is why the saving per unit is steepest at the low end. Moving from a very small run to a moderate one changes the price noticeably; doubling an already large run changes it far less. Knowing where that curve flattens for your design is more useful than assuming bigger is always better.',
      ],
      bullets: {
        intro: 'The factors that move a bulk quote most:',
        items: [
          'Number of print colours and whether a white underbase is needed',
          'Board grade and any grease barrier',
          'Whether the size is a standard tooling or a custom one',
          'How many different sizes share the same order',
          'Whether artwork is print-ready or needs preparation',
        ],
      },
    },
    {
      heading: 'Sizing the order to your actual usage',
      body: [
        'The right quantity starts from consumption, not from a price break. Count trays used in a normal week, then in your busiest week, and work from the busier figure so a good month does not empty the stockroom.',
        'Then decide how many weeks of cover you want. Longer cover means fewer orders and a better unit price; it also means more of your money sitting on a shelf as cardboard.',
      ],
      steps: {
        intro: 'A straightforward way to arrive at a quantity:',
        items: [
          'Count trays used across a normal week.',
          'Count them again across your busiest recent week.',
          'Multiply the busier figure by the weeks of cover you want.',
          'Check that quantity physically fits your storage.',
          'Add a small buffer for spoilage and miscounts.',
          'Compare that figure against the quoted price breaks.',
        ],
      },
      link: {
        href: '/hot-dog-tray-sizes/',
        anchor: 'settle the size before the quantity',
        lead: 'If you are still choosing between formats,',
      },
    },
    {
      heading: 'Storage is the constraint people underestimate',
      body: [
        'A large order is only a saving if you have somewhere sensible to keep it. Packaging stored badly gets damp, crushed or dusty, and a damaged carton costs more than the discount that justified it.',
        'Measure the space before ordering rather than after. Height is usually the forgiving dimension and floor area the limiting one, and stock kept off the floor survives far better than stock stacked directly on it.',
      ],
      table: {
        caption: 'Weighing order size against storage and cash',
        headers: ['Order size', 'Unit price', 'Storage demand', 'Main risk'],
        rows: [
          ['Small trial run', 'Highest', 'Minimal', 'Reordering often, setup paid repeatedly'],
          ['Several weeks of cover', 'Better', 'Moderate', 'Little; usually the practical sweet spot'],
          ['Several months of cover', 'Better again', 'Significant', 'Design changes leave stock stranded'],
          ['A year or more', 'Best per unit', 'Substantial', 'Cash tied up, damage over long storage'],
        ],
        note: 'Relative comparison. Actual price breaks and minimums are confirmed on your quote.',
      },
    },
    {
      heading: 'Custom printing changes the arithmetic',
      body: [
        'Plain stock can be bought in whatever quantity suits the week, because there is no setup to amortise. Printed stock behaves differently: the setup makes small repeat orders expensive, which pushes you towards larger runs.',
        'That is manageable as long as the artwork is settled. The expensive mistake is ordering a year of printed stock a month before rebranding, or before a phone number changes.',
      ],
      subsections: [
        {
          heading: 'Keep variable information off the tray',
          body: [
            'Anything likely to change — a promotion, a seasonal line, a specific address — is better on a sticker than printed into a year of stock. Reserve the printed panel for the things that stay true.',
          ],
        },
        {
          heading: 'Approve a proof before the run',
          body: [
            'A proof is the last cheap moment to catch a colour shift or a typo. Once a bulk run is printed, corrections mean reprinting.',
          ],
        },
      ],
      link: {
        href: '/hot-dog-tray-material-guide/',
        anchor: 'stock choice affects how artwork reproduces',
        lead: 'Bear in mind that',
      },
    },
    {
      heading: 'Building a reorder rhythm',
      body: [
        'The aim is to reorder on a schedule rather than in an emergency. Rush orders cost more, arrive later and land whenever the stockroom happens to be empty.',
        'Set a reorder point rather than a reorder date: a shelf level that triggers the next order regardless of the calendar. That absorbs a busy month without anyone having to notice it in advance.',
      ],
      link: {
        href: '/shop/',
        anchor: 'the tray formats available to order',
        lead: 'You can review',
      },
    },
  ],
  faqs: [
    {
      question: 'How many hot dog trays should I order at once?',
      answer:
        'Start from your busiest recent week rather than an average one, multiply by the weeks of cover you want, and check the result fits your storage before comparing it against price breaks.',
    },
    {
      question: 'Why is the price per tray so much lower in bulk?',
      answer:
        'Print setup is paid once regardless of quantity. Spreading it across more units lowers the per-unit figure, which is why the saving is steepest when moving up from a small run.',
    },
    {
      question: 'Is the largest order always the best value?',
      answer:
        'Not necessarily. The curve flattens, so beyond a point you gain little per unit while tying up cash and storage and increasing the risk that a design change strands the stock.',
    },
    {
      question: 'What is the minimum order quantity?',
      answer:
        'Minimums depend on the format, the board and whether the tray is printed. They are confirmed on your quote rather than fixed across the range.',
    },
    {
      question: 'How should bulk packaging be stored?',
      answer:
        'Dry, off the floor, and out of direct sunlight. Damp and crushing are the two things that turn a bulk saving into waste.',
    },
    {
      question: 'Can I split one bulk order across several sizes?',
      answer:
        'Often yes, though each size may carry its own setup. Ask for the quote both ways — combined and separate — to see which works out better.',
    },
    {
      question: 'Should I buy plain or printed trays in bulk?',
      answer:
        'Printed stock benefits most from volume because of the setup cost. Plain stock can be bought in whatever quantity suits, since there is no setup to spread.',
    },
    {
      question: 'What if my branding changes after a bulk order?',
      answer:
        'Printed stock cannot be updated once produced. If a rebrand is likely, order shorter cover or keep changeable details on labels rather than printed on the tray.',
    },
    {
      question: 'How far ahead should I reorder?',
      answer:
        'Use a shelf level as the trigger rather than a date. That absorbs an unexpectedly busy period without anyone having to predict it.',
    },
    {
      question: 'Can I get a sample before committing to a bulk run?',
      answer:
        'Yes, and it is worth doing for any first custom order. Loading a sample during real service reveals problems that no specification will.',
    },
  ],
  relatedProducts: ['paper-hot-dog-trays', 'cardboard-hot-dog-trays', 'disposable-hot-dog-trays', 'kraft-hot-dog-tray'],
  quoteProduct: 'Paper Hot Dog Trays',
};
