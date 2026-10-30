/*
 * Extra sections, FAQs and metadata for the company pages (quote, shipping,
 * about, contact, shop, blog). They were 185-390 words each and shared most of
 * their text with each other. Questions avoid the ones on the homepage and /faq/.
 */
import faqsExtra from './faqs-extra.json';

export type PageExtra = {
  title: string;
  description: string;
  sections: { title: string; body: string; bullets?: string[] }[];
  faqs: { question: string; answer: string }[];
};

const basePageExtras: Record<string, PageExtra> = {
  "get-quote": {
    "title": "Request a Free Packaging Quote | 2-Hour Reply | HotDogTrays",
    "description": "Standard trays are $30 per 100 with free shipping. For larger runs or special sizes, send your details and get a quote within 2 hours. Free design.",
    "sections": [
      {
        "title": "What happens after you send your request",
        "body": "A member of our packaging team reads every request and replies within 2 hours with detailed pricing, material options and a recommendation for your menu. If anything is missing, we ask rather than guess, so the numbers you receive match what you will actually order. Once you are happy with the price, our designers prepare your artwork and send a digital proof within 24 to 48 hours. You can ask for up to 3 free revisions before you approve it. Nothing is charged at the quote or proof stage. Once the proof is approved we email a PayPal or bank transfer invoice, or you can pay cash on delivery in the US and Canada. Standard production takes 7-10 business days, and your order then ships free with tracking.",
        "bullets": [
          "Quote with pricing and options: within 2 hours",
          "Design proof: 24 to 48 hours, up to 3 free revisions",
          "Production: 7-10 business days after proof approval",
          "No setup fees, plate charges or die-cut fees for standard sizes"
        ]
      },
      {
        "title": "Not sure what to ask for? Send what you know",
        "body": "You do not need a finished spec sheet to get a useful quote. Tell us what you serve, roughly how many pieces you need and when you need them, and our team will suggest a size, material and finish that fit your budget. Standard trays are $30 for a pack of 100 and can be ordered straight from any product page, so a quote is only needed for larger runs or special builds. A rough quantity range is enough for us to price those. For artwork, any version of your logo works, even a photo of your business card, and we will recreate it as a print-ready file.",
        "bullets": [
          "What you serve: classic, jumbo or loaded hot dogs, with or without sides",
          "An estimated quantity and your delivery date",
          "Your logo in any format, plus brand colors if you have them",
          "Any must-haves such as a coating, inside printing or an eco-friendly material"
        ]
      }
    ],
    "faqs": [
      {
        "question": "Does it cost anything to request a quote?",
        "answer": "No. Quotes are free and carry no obligation. You do not pay anything to receive a quote or to approve a design proof. For invoice payments, you pay after approving the proof and before production begins."
      },
      {
        "question": "Can I get a quote before my artwork is ready?",
        "answer": "Yes. Our design team creates your artwork at no extra cost, so a quote can be prepared from your quantity, size and material alone. Send your logo in any format when you have it and we will turn it into a print-ready file."
      },
      {
        "question": "How fast will I hear back after I submit the form?",
        "answer": "Our team responds within 2 hours with pricing, material options and recommendations. Our business hours are Monday to Friday 9:00 AM to 6:00 PM EST and Saturday 10:00 AM to 4:00 PM EST."
      },
      {
        "question": "Do I need a quote for a standard order?",
        "answer": "No. Every product can be ordered online in packs of 100 trays for $30, up to 50 packs at a time, with free shipping. Send a quote request only for larger runs or for special sizes, materials or finishes."
      }
    ]
  },
  "shipping": {
    "title": "Shipping and Delivery | Free Shipping to US, UK, CA and AU",
    "description": "Free shipping on all Hot Dog Trays orders to the USA, UK, Canada and Australia. See delivery times, tracking, customs duties and what to do about damage.",
    "sections": [
      {
        "title": "Free shipping to four countries",
        "body": "Every order ships free to the USA, UK, Canada and Australia, whatever the quantity. There is no shipping line added at checkout, so the pack price already covers delivery to your door. Once your order leaves us, delivery usually takes 5 to 7 days. Because every order is printed to your design, production comes first, and standard production takes 7-10 business days. The 5 to 7 day delivery window starts once it ships.",
        "bullets": [
          "Shipping cost: free on all orders",
          "Destinations: USA, UK, Canada and Australia",
          "Delivery once shipped: 5 to 7 days",
          "Production before dispatch: 7-10 business days after proof approval"
        ]
      },
      {
        "title": "Tracking, addresses and customs",
        "body": "When your order ships you receive an email with a tracking number, so you can follow the delivery and plan your stock. Please check your delivery address before you approve the order, including any suite or unit number, because orders returned for an incorrect or incomplete address may need to be paid for again to reship. For deliveries outside the USA, customs fees, import taxes and duties are the responsibility of the buyer, and customs clearance can add time to the delivery window.",
        "bullets": [
          "Tracking number sent by email when your order ships",
          "Double-check unit, suite and apartment numbers",
          "Customs fees and import taxes are paid by the buyer"
        ]
      },
      {
        "title": "If something goes wrong in transit",
        "body": "If a package shows as delivered but has not arrived, check with neighbors or building management and allow 24 hours for the carrier to update before contacting us. If a box arrives damaged, email info@hotdogtrays.com with photos of the package and the product and we will reprint the damaged trays free or refund them. Damaged, defective or misprinted orders must be reported within 14 days of delivery, and we cover any shipping involved. Because every tray is printed to your artwork, we do not accept change-of-mind returns. Approved refunds are issued within 10 business days."
      }
    ],
    "faqs": [
      {
        "question": "Is shipping free no matter how many units I order?",
        "answer": "Yes. Shipping is free on all orders to the USA, UK, Canada and Australia, from the 100-unit minimum upward."
      },
      {
        "question": "When does the delivery window start?",
        "answer": "The 5 to 7 day delivery window starts when your order ships. Standard production takes 7-10 business days after proof approval, so tell us your deadline when you order and we will confirm before you pay whether we can meet it."
      },
      {
        "question": "Who pays customs duties on orders shipped outside the USA?",
        "answer": "Customs fees, import taxes and duties on international deliveries are the responsibility of the buyer. Customs processing can also extend delivery times."
      },
      {
        "question": "What happens if I gave the wrong delivery address?",
        "answer": "Contact us as soon as you notice, ideally before the order ships. Orders returned because of an incorrect address, a missing apartment number or an undeliverable location may require additional payment for reshipping."
      }
    ]
  },
  "faq": {
    "title": "Hot Dog Tray FAQs: Ordering, Printing, Shipping and Payment",
    "description": "Answers on minimum orders, pricing, free design, printing and coatings, custom sizes, production times, shipping, payment and returns for food packaging.",
    "sections": [],
    "faqs": []
  },
  "about": {
    "title": "About HotDogTrays.com | Custom Printed Hot Dog Trays",
    "description": "We print custom hot dog trays for food trucks, stadiums, restaurants and caterers: 100 trays for $30, free design and free shipping to 4 countries.",
    "sections": [
      {
        "title": "How we work with food businesses",
        "body": "Smaller food businesses are often priced out of branded packaging by high minimums and limited options. That is the problem we solve. Orders start at one pack of 100 trays for $30, our in-house designers prepare artwork at no extra cost, and every job goes through a digital proof that you approve before anything is printed. The same team that quotes your order follows it through design, production and dispatch, so you always know who to talk to.",
        "bullets": [
          "Food trucks, stadium kiosks, restaurants and catering companies",
          "Free design service with up to 3 revisions",
          "Kraft, white cardboard, corrugated and food-safe plastic",
          "Food-grade board and inks, with kraft options for a natural look"
        ]
      }
    ],
    "faqs": []
  },
  "contact": {
    "title": "Contact Hot Dog Trays | Phone, Email, WhatsApp and Hours",
    "description": "Call, email or WhatsApp the Hot Dog Trays team in Brooklyn, New York. See business hours, which channel suits your question and what to include for a fast answer.",
    "sections": [
      {
        "title": "Which channel to use",
        "body": "Every channel reaches the same team, so pick whichever is easiest for you. A few simple rules help us answer faster.",
        "bullets": [
          "Phone (503) 461-4788: best for a quick conversation, checking a delivery date or talking through options while you decide",
          "WhatsApp +1 (503) 461-4788: handy for sending photos of a current tray, a sketch or your logo straight from your phone",
          "Email info@hotdogtrays.com: best for artwork files, purchase orders, delivery questions and anything you want in writing",
          "The form on this page: a good choice when you want us to call or email you back"
        ]
      },
      {
        "title": "What to include so we can help the first time",
        "body": "Most back-and-forth happens because a detail is missing. If you already have an order with us, put your order number in the first line so we can pull up your design and history straight away. For a delivery problem, add the tracking number and attach photos of the package and the product if anything arrived damaged. For a reorder, the previous order number is enough for us to find your saved artwork. For anything new, a short note about what you serve and the timing you are working toward gives our team enough to start."
      },
      {
        "title": "Address, hours and replies",
        "body": "Our business address is 1639 70th St, Brooklyn, NY 11204, United States. The team is available Monday to Friday from 9:00 AM to 6:00 PM EST and on Saturday from 10:00 AM to 4:00 PM EST, and we are closed on Sunday. Quote requests receive a reply within 2 hours, and design proofs follow within 24 to 48 hours once your artwork is under way."
      }
    ],
    "faqs": [
      {
        "question": "What are your business hours?",
        "answer": "Monday to Friday 9:00 AM to 6:00 PM EST, Saturday 10:00 AM to 4:00 PM EST. We are closed on Sunday."
      },
      {
        "question": "Can I send my logo or photos over WhatsApp?",
        "answer": "Yes. Message us at +1 (503) 461-4788 with your logo, a photo of the packaging you use now or a rough sketch. For large print files, email works best at info@hotdogtrays.com."
      },
      {
        "question": "What is your business address?",
        "answer": "Our business address is 1639 70th St, Brooklyn, NY 11204, United States. We take orders online and by phone, email and WhatsApp."
      },
      {
        "question": "Who do I contact about an order that has already shipped?",
        "answer": "Email info@hotdogtrays.com with your order number and tracking number. If anything arrived damaged, attach photos of the package and the product and we will reprint or refund the damaged trays, as long as it is reported within 14 days of delivery."
      },
      {
        "question": "What should I include when I get in touch about a reorder?",
        "answer": "Your previous order number is all we need. We keep design files on record for 2 years, so we can find your artwork and quote the same design again without repeating the design process."
      }
    ]
  },
  "shop": {
    "title": "Hot Dog Trays, Boats, Holders and Plates | Shop All Styles",
    "description": "Browse hot dog trays, paper boats, holders, plates and container paper in kraft, cardboard, corrugated and plastic. $30 for 100, free shipping.",
    "sections": [
      {
        "title": "Hot dog trays and serving packaging",
        "body": "This is the full range of hot dog trays and related serving packaging we produce, from simple paper boats to sturdy corrugated trays with room for sides. Each style can be printed with your logo and brand colors, and our design team prepares the artwork free. Choose kraft for a natural, recyclable look, white cardboard for bright full-color printing, corrugated for heavy toppings and heat, or food-safe plastic if you want something reusable. Every product is $30 for a pack of 100 ($0.30 a tray) with free shipping, and every material is food-grade. Open any product to see sizes and specifications and to order, or request a free quote for larger runs."
      },
      {
        "title": "Trays or boats?",
        "body": "Trays have walls and a flat base, so they suit loaded dogs, chili and cheese, or a hot dog served with fries on the side. Choose corrugated or white cardboard when the toppings are heavy, and plastic if you want a tray you can wash and reuse. Paper boats are lighter and quicker to fill, which makes them a good fit for classic dogs, corn dogs and fast takeout lines where customers eat while walking. If most of your orders are a single dog with simple toppings, start with [paper hot dog boats](/product/hot-dog-boats-paper/)."
      },
      {
        "title": "Holders, plates or container paper?",
        "body": "Holders wrap closely around the bun, so they work best when customers hold the food in one hand at stadiums, fairs and carts. Plates give more surface for sides and suit parties, buffets and seated service. Container paper is a sheet that wraps or lines the hot dog, adding a grease barrier inside a tray or on its own for quick handoffs. If you want your brand in every hand at a busy stand, [cardboard hot dog holders](/product/cardboard-hot-dog-holders/) give a firm grip and a large print area."
      }
    ],
    "faqs": [
      {
        "question": "What is the difference between a hot dog tray and a hot dog holder?",
        "answer": "A tray has a flat base and walls and is made to be carried or set down, often with room for sides. A holder fits closely around the bun so the hot dog can be eaten from one hand. Many vendors use both: holders for walk-up orders and trays for combo meals."
      },
      {
        "question": "Which material works best for greasy or saucy toppings?",
        "answer": "Corrugated is the strongest choice for heavy toppings because it is thick, insulates well and helps prevent oil seepage. Any paper or cardboard style can also be ordered with a matte, gloss or spot UV coating for added grease and water resistance."
      },
      {
        "question": "Can I order plain trays without any printing?",
        "answer": "Yes. Printing is optional. Tell us you want plain trays when you order or in a quote request, and we will confirm the details before you pay."
      },
      {
        "question": "Are these products safe for direct contact with food?",
        "answer": "Yes. All of our materials are food-grade and safe for direct food contact, including the kraft, cardboard, corrugated and plastic options."
      }
    ]
  },
  "blog": {
    "title": "Hot Dog Packaging Blog | Guides for Food Service Buyers",
    "description": "Practical guides on paper hot dog boats, holders, plates, grease resistant trays and custom printing for food trucks, stands, caterers and restaurants.",
    "sections": [
      {
        "title": "Find the right guide",
        "body": "Each guide on this page answers one buying question, so start with the one closest to yours. Choosing between formats? Begin with the guide on how hot dog holders differ from trays, then the one on plates for parties and buffet service if you cater events. Running a takeout counter or food truck, read the paper boats guide for sizing and grease control. If trays go soft during a rush, the grease resistant trays guide explains coatings and board weight, and the custom trays guide walks through artwork, color and finish choices for your brand."
      }
    ],
    "faqs": []
  }
};

/**
 * Further FAQs per page (every page carries at least ten). Keys are page keys
 * above, policy page slugs, "home", "blog" and blog post slugs.
 */
export const extraFaqs = (key: string): PageExtra['faqs'] =>
  ((faqsExtra as Record<string, { q: string; a: string }[]>)[key] ?? []).map((f) => ({
    question: f.q,
    answer: f.a,
  }));

export const pageExtras: Record<string, PageExtra> = Object.fromEntries(
  Object.entries(basePageExtras).map(([key, extra]) => [
    key,
    { ...extra, faqs: [...extra.faqs, ...extraFaqs(key)] },
  ]),
);
