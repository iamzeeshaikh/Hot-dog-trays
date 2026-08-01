import type { Guide } from './types';

/**
 * Published in place of /hot-dog-trays-with-lids/.
 *
 * The conditional page rule required verifying that lidded trays are genuinely
 * offered before publishing a commercial landing page for them. The evidence
 * did not support it: three image filenames mention lids, but no product,
 * specification or description offers a lidded item, one description argues for
 * the open format ("without fighting a lid"), and another treats lids as
 * something to confirm case by case. Rather than assert a product line that may
 * not exist, this material guide was published instead.
 */
export const materialGuide: Guide = {
  slug: 'hot-dog-tray-material-guide',
  url: '/hot-dog-tray-material-guide/',
  title: 'Hot Dog Tray Material Guide | Board, Kraft and Plastic',
  description:
    'Compare paperboard, kraft, corrugated and plastic hot dog trays on strength, grease handling, printing and disposal.',
  h1: 'Hot Dog Tray Material Guide',
  standfirst:
    'What each tray material is genuinely good at, where it struggles, and how to match one to the food you serve.',
  crumb: 'Material Guide',
  intro: [
    'Most tray disappointments trace back to a material chosen for the wrong reason — usually price alone, occasionally appearance alone. A stock that photographs beautifully can go limp under a chilli dog, and a stock that survives anything can look out of place on a carefully branded counter.',
    'This guide sets out what each common material actually does under service conditions, so the choice is made against your menu rather than against a swatch.',
  ],
  sections: [
    {
      heading: 'The four material families',
      body: [
        'Nearly every hot dog tray is built from one of four stocks: white paperboard, kraft paperboard, light corrugated board, or food-grade plastic. They differ in stiffness, how they cope with moisture, how printed colour appears, and what happens after use.',
        'None is best in every category. The useful question is which weakness you can live with for your particular menu.',
      ],
      table: {
        caption: 'How the common tray materials compare in service',
        headers: ['Material', 'Stiffness', 'Grease and moisture', 'Printed colour', 'Best suited to'],
        rows: [
          ['White paperboard', 'Good', 'Needs a barrier for wet toppings', 'Brightest and most accurate', 'Branded counters, clean presentation'],
          ['Kraft paperboard', 'Good', 'Needs a barrier for wet toppings', 'Muted; whites do not show', 'Natural look, simple one or two colour art'],
          ['Light corrugated', 'Highest', 'Copes best with heavy wet loads', 'Coarser surface, softer detail', 'Heavy portions, longer carries'],
          ['Food-grade plastic', 'Rigid, does not soften', 'Unaffected by grease or moisture', 'Limited; often unprinted', 'Wet menus, reusable service'],
        ],
        note: 'Comparative guidance for specifying a tray. Exact grades, coatings and barrier options are confirmed on your quote.',
      },
      link: {
        href: '/hot-dog-tray-sizes/',
        anchor: 'sizing the tray to the portion',
        lead: 'Whichever family you choose, the fit still comes from',
      },
    },
    {
      heading: 'Grease is the variable that decides most jobs',
      body: [
        'Grease and moisture defeat more trays than weight does. A dry hot dog sits happily on almost any board. Add cheese sauce, chilli or a generous line of mustard and the base begins to darken, then soften, then flex.',
        'The answer is usually a barrier rather than a thicker board. A surface treatment keeps the fat sitting on top instead of soaking in, which preserves stiffness for the few minutes that actually matter.',
      ],
      subsections: [
        {
          heading: 'How long the tray really has to last',
          body: [
            'A tray carried ten steps to a table has a very different job from one that sits in a bag during a delivery. Specifying for the longer of your two scenarios avoids the failure that only shows up occasionally.',
          ],
        },
        {
          heading: 'Barrier choices affect recycling',
          body: [
            'Barriers vary in how they behave in recycling streams, and local facilities differ. If recyclability is part of your decision, treat it as a question for your supplier and your local waste contractor rather than an assumption.',
          ],
        },
      ],
      link: {
        href: '/paper-vs-plastic-hot-dog-trays/',
        anchor: 'a direct comparison of the two families',
        lead: 'If the choice is essentially fibre against plastic,',
      },
    },
    {
      heading: 'How material changes your artwork',
      body: [
        'Printed colour is not independent of stock. White board gives the most predictable result because ink sits on a neutral base. Kraft warms every colour it carries, so blues shift, pastels weaken, and white cannot be printed at all unless a white underbase is used.',
        'This is not a reason to avoid kraft. It is a reason to design for it: bold marks, restricted palettes and strong contrast look deliberate on kraft, whereas photographic artwork rarely does.',
      ],
      bullets: {
        intro: 'Before artwork is finalised, confirm:',
        items: [
          'Which stock the design will actually print on',
          'Whether any white appears in the artwork',
          'How many colours the design genuinely needs',
          'Which panels stay visible once food is loaded',
          'Whether the same artwork must work across several stocks',
        ],
      },
    },
    {
      heading: 'Storage, stacking and handling',
      body: [
        'Material affects the stockroom as much as the counter. Fibre trays generally arrive flat or nested and take little space until assembled. Rigid formats consume shelf space from the day they arrive.',
        'Weight matters too. A heavier board is reassuring in the hand but multiplies across a pallet, and if your storage is a cupboard behind a service window that difference is real.',
      ],
      link: {
        href: '/hot-dog-trays-in-bulk/',
        anchor: 'ordering quantity against available storage',
        lead: 'That balance is worth settling alongside',
      },
    },
    {
      heading: 'Choosing without over-thinking it',
      body: [
        'Most menus resolve quickly once the questions are asked in the right order.',
      ],
      steps: {
        intro: 'A short path to a decision:',
        items: [
          'Identify your wettest, heaviest menu item.',
          'Decide how long a tray must hold up under it.',
          'Choose a barrier level from that, before choosing a stock.',
          'Pick the stock whose appearance suits your brand.',
          'Adjust the artwork to suit that stock rather than the reverse.',
          'Test a loaded sample before committing to a run.',
        ],
      },
    },
  ],
  faqs: [
    {
      question: 'Which tray material is strongest?',
      answer:
        'Light corrugated board is the stiffest of the fibre options and copes best with heavy, wet portions. Rigid plastic does not soften at all, but it costs more in storage space and unit price.',
    },
    {
      question: 'Do I need a grease barrier?',
      answer:
        'If your menu includes cheese sauce, chilli or generous condiments, yes. A barrier keeps fat on the surface so the board holds its stiffness for the few minutes that matter.',
    },
    {
      question: 'Why does my logo look wrong on kraft board?',
      answer:
        'Kraft is a warm brown base, so every ink laid on it shifts warmer. Blues dull, pastels weaken and white does not print unless a white underbase is added.',
    },
    {
      question: 'Can white be printed on kraft?',
      answer:
        'Only with a white underbase, which adds a step. Designs intended for kraft usually work better if they avoid white altogether.',
    },
    {
      question: 'Is a heavier board always better?',
      answer:
        'No. Heavier board costs more, weighs more per pallet and takes more storage. The aim is the lightest stock that still holds your heaviest portion without visible sag.',
    },
    {
      question: 'Are paperboard trays recyclable?',
      answer:
        'Plain paperboard is widely accepted, but any barrier or coating changes how a facility treats it, and local rules differ. Confirm both the coating and your local stream rather than assuming.',
    },
    {
      question: 'Which material suits delivery rather than counter service?',
      answer:
        'Delivery is the longer, harsher test. A stronger board with a grease barrier, or a rigid format, holds up better than a light tray specified for a ten-step carry.',
    },
    {
      question: 'Can I use one material for my whole menu?',
      answer:
        'Often yes, if you specify for the wettest and heaviest item. That item sets the requirement; lighter portions will be comfortably within it.',
    },
    {
      question: 'Does material affect how trays store before use?',
      answer:
        'Considerably. Fibre trays usually arrive flat or nested and take little room; rigid formats occupy their full volume from delivery onward.',
    },
    {
      question: 'How do I compare materials fairly?',
      answer:
        'Load samples of each with your heaviest menu item, leave them for the length of a real service, and look at the base. That reveals more than any specification sheet.',
    },
  ],
  relatedProducts: ['kraft-hot-dog-tray', 'plastic-hot-dog-trays', 'cardboard-hot-dog-trays', 'paper-hot-dog-trays'],
  quoteProduct: 'Kraft Hot Dog Tray',
};
