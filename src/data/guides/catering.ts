import type { Guide } from './types';

export const cateringGuide: Guide = {
  slug: 'hot-dog-trays-for-catering',
  url: '/hot-dog-trays-for-catering/',
  title: 'Hot Dog Trays for Catering | Events and Buffets',
  description:
    'Planning hot dog trays for catered events: guest counts, batch serving, buffet stations, transport and cleanup.',
  h1: 'Hot Dog Trays for Catering',
  standfirst:
    'Catering is planned in advance and served all at once. That changes what a tray has to do compared with counter trade.',
  crumb: 'For Catering',
  intro: [
    'Catering inverts the usual packaging problem. A shop reacts to whoever walks in; a caterer knows the guest count weeks ahead, but has to produce all of it away from a fixed kitchen and serve much of it simultaneously.',
    'That predictability is an advantage worth using. Quantities can be exact, sizes can suit the event rather than a general menu, and branding can be tailored to the occasion.',
  ],
  sections: [
    {
      heading: 'Planning from a guest count',
      body: [
        'Catering quantities start from a known number, which makes them easier to get right than retail forecasts. The judgement is in the margin: too little looks unprofessional, too much is waste you have already paid for.',
        'A modest overage is normal practice. It covers miscounts, damaged units and the guests who come back for a second. What it should not become is a habit of ordering double and discarding the difference.',
      ],
      bullets: {
        intro: 'Numbers worth confirming before ordering:',
        items: [
          'Confirmed guest count and the likely final variance',
          'Whether hot dogs are the main item or one of several',
          'Expected portions per guest across the service',
          'Whether staff plate or guests self-serve',
          'How many separate stations need their own stock',
        ],
      },
    },
    {
      heading: 'Batch serving and holding',
      body: [
        'The difficult part of catering is that many portions are assembled at once and then wait. A tray that performs perfectly when handed over immediately can look tired after ten minutes on a station.',
        'Holding time is therefore the specification driver. A grease barrier matters more here than in counter service, because the fat has longer to work on the board before anyone eats.',
      ],
      subsections: [
        {
          heading: 'Assemble late where possible',
          body: [
            'Trays laid out empty and filled as guests arrive present far better than trays filled early and held. Where the service allows it, staging empty is almost always the better choice.',
          ],
        },
        {
          heading: 'Sauces are best applied last',
          body: [
            'Wet toppings added at the start of a holding period do the most damage. Where practical, offer them at the station rather than pre-applying them across a batch.',
          ],
        },
      ],
      link: {
        href: '/hot-dog-tray-material-guide/',
        anchor: 'barrier choice under longer holding',
        lead: 'This is where',
      },
    },
    {
      heading: 'Buffet stations and self-service',
      body: [
        'Self-service changes the tray’s job. Guests take a tray before they take food, hold it while they choose, and load it themselves — often less neatly than staff would.',
        'That argues for a slightly more generous size and a flatter base than a plated equivalent. Guests place food imprecisely, and a tray with a little forgiveness in it produces a better-looking plate.',
      ],
      table: {
        caption: 'Matching tray choice to catering service style',
        headers: ['Service style', 'When the tray is filled', 'Priority', 'Sizing note'],
        rows: [
          ['Plated and passed', 'Immediately before serving', 'Presentation', 'Snug fit looks most deliberate'],
          ['Batch held on a station', 'Well before eating', 'Grease barrier', 'Deeper wall for held sauces'],
          ['Guest self-service', 'By the guest', 'Forgiveness', 'Slightly generous, flat base'],
          ['Boxed for transport', 'At base, before travel', 'Stability', 'Snug fit, square footprint'],
          ['Outdoor event', 'Variable', 'Wind and damp resistance', 'Heavier board, weighted stacks'],
        ],
        note: 'Planning guidance. Exact formats and coatings are confirmed on your quote.',
      },
      link: {
        href: '/product/hot-dog-plates/',
        anchor: 'a flatter plate format',
        lead: 'Where guests build their own portions,',
      },
    },
    {
      heading: 'Getting everything to the venue',
      body: [
        'Catering packaging travels twice: once as empty stock to the venue, and once again as loaded portions between the prep area and the guests. Both journeys deserve thought.',
        'Empty stock is bulky and light, so it is usually the thing that gets squashed under something heavier. Loaded portions are the opposite problem — heavy, unstable, and carried by someone whose view is partly blocked.',
      ],
      steps: {
        intro: 'A packing sequence that avoids the usual damage:',
        items: [
          'Count stock against the guest list before loading the van.',
          'Keep cartons flat and load them above heavy equipment.',
          'Carry a sealed reserve that is not opened unless needed.',
          'Unpack only what the first service round requires.',
          'Keep the reserve away from the serving area and spills.',
          'Recount what is left before leaving the venue.',
        ],
      },
    },
    {
      heading: 'Branding for one occasion',
      body: [
        'Event catering is one of the few places where single-occasion printing makes sense. A wedding date or a company name on the tray reads as effort rather than advertising.',
        'The constraint is lead time. Printed stock for a specific date has to be commissioned early enough that a proof, a print run and delivery all fit comfortably before the event.',
      ],
      link: {
        href: '/hot-dog-trays-in-bulk/',
        anchor: 'lead times and print setup',
        lead: 'Because that timing is tight, it is worth reading about',
      },
    },
  ],
  faqs: [
    {
      question: 'How many trays should I order for a catered event?',
      answer:
        'Start from the confirmed guest count, allow for portions per guest, and add a modest overage for miscounts and damage rather than doubling the order.',
    },
    {
      question: 'Should trays be filled in advance for a buffet?',
      answer:
        'Where the service allows, stage them empty and fill as guests arrive. Portions held for long periods present noticeably worse than freshly assembled ones.',
    },
    {
      question: 'Do catering trays need a grease barrier?',
      answer:
        'More than counter trays do. Holding time gives fat longer to work on the board, so a barrier matters even for menus that would be fine served immediately.',
    },
    {
      question: 'Should sauces be applied before service?',
      answer:
        'Preferably not across a whole batch. Wet toppings added early cause the most damage during holding; offering them at the station keeps portions looking better.',
    },
    {
      question: 'Does self-service need a different tray size?',
      answer:
        'Slightly more generous usually works better. Guests load trays less precisely than staff, so a little forgiveness produces a better-looking result.',
    },
    {
      question: 'How should empty stock be transported?',
      answer:
        'Flat, above heavier equipment, with a sealed reserve that stays closed unless needed. Empty packaging is bulky and light, so it is the first thing to get crushed.',
    },
    {
      question: 'Can trays be printed for a single event?',
      answer:
        'Yes, and it suits catering well. The limit is lead time — a proof, the print run and delivery all need to fit before the date.',
    },
    {
      question: 'What suits an outdoor catered event?',
      answer:
        'A heavier board and weighted stacks. Wind moves empty trays easily and damp softens board before it ever sees food.',
    },
    {
      question: 'How do I avoid over-ordering for events?',
      answer:
        'Record actual usage against guest count after each event. Two or three events of real data replace guesswork with a reliable ratio.',
    },
    {
      question: 'Should hot dogs and sides share a tray at a buffet?',
      answer:
        'If guests carry both to a seat, yes. Separate items force guests to balance two things while walking, which is where most spills happen.',
    },
  ],
  relatedProducts: ['hot-dog-serving-tray', 'cardboard-hot-dog-trays', 'hot-dog-plates', 'paper-hot-dog-trays'],
  quoteProduct: 'Hot Dog Serving Tray',
};
