/**
 * MarketLink Static Site Content
 * Central source of truth for organizational, team, contact, legal, and FAQ information.
 * Any field containing sample or placeholder text carries a trailing '// TEAM: fill in' comment.
 * Conforms to Stage 8 specification D7.
 */

export const siteContent = {
  // Team members
  team: [
    {
      name: 'Elena Rostova', // TEAM: fill in
      role: 'Co-Founder & Producer Lead', // TEAM: fill in
      bio: 'Lifelong advocate for regenerative farming with 12 years managing regional growers collectives.', // TEAM: fill in
      photo: null, // TEAM: fill in
    },
    {
      name: 'Marcus Chen', // TEAM: fill in
      role: 'Co-Founder & Technical Architect', // TEAM: fill in
      bio: 'Software engineer passionate about building low-friction civic technology for local food security.', // TEAM: fill in
      photo: null, // TEAM: fill in
    },
    {
      name: 'Sophia Patel', // TEAM: fill in
      role: 'Community & Market Coordinator', // TEAM: fill in
      bio: 'Liaises weekly with market managers, vendors, and neighborhood volunteers to keep pickup running smoothly.', // TEAM: fill in
      photo: null, // TEAM: fill in
    },
  ],

  // Contact information
  contact: {
    address: '142 Orchard Grove Way, Suite 200, Bristol, BS1 5TY', // TEAM: fill in
    phone: '+44 (0) 117 496 0882', // TEAM: fill in
    email: 'hello@marketlink.community', // TEAM: fill in
    hours: [
      'Monday – Friday: 8:30 AM – 5:30 PM', // TEAM: fill in
      'Saturday: 7:30 AM – 2:00 PM', // TEAM: fill in
    ],
    lat: 51.4545, // TEAM: fill in
    lng: -2.5879, // TEAM: fill in
    serviceRadiusKm: 25, // TEAM: fill in
    coordinates: {
      lat: 51.4545, // TEAM: fill in
      lng: -2.5879, // TEAM: fill in
    },
  },

  // About story and core values
  about: {
    story: [
      'MarketLink was founded in 2026 to bridge the widening gap between small-scale regenerative producers and their neighborhood communities.', // TEAM: fill in
      'Traditional wholesale supply chains strip farmers of their margins while forcing customers to settle for produce picked weeks prior to ripening. MarketLink provides a quiet, direct pre-order model where customers reserve harvests during the week and collect directly from the grower on market morning.', // TEAM: fill in
      'Zero delivery vans, zero packaging waste, and zero middleman commissions ensure 100% of transaction value flows straight to the hands that cultivated the food.', // TEAM: fill in
    ],
    stats: [
      { value: '40+', label: 'Independent Growers', subtext: 'Within 90 miles of our markets' }, // TEAM: fill in
      { value: '4', label: 'Historic Markets', subtext: 'Regional neighborhood markets' }, // TEAM: fill in
      { value: '100%', label: 'Direct Producer Takings', subtext: '0% platform take from stall sales' }, // TEAM: fill in
      { value: '14,000+', label: 'Harvest Pre-Orders', subtext: 'Fulfilled without food waste' }, // TEAM: fill in
    ],
    values: [
      {
        numeral: '01',
        title: 'Zero Middleman Markups',
        highlight: 'No resellers, no wholesale markups.',
        description: '100% of the produce purchase goes directly to the local grower. Customers pay upon in-person collection.', // TEAM: fill in
      },
      {
        numeral: '02',
        title: 'Calm, Guaranteed Saturday Mornings',
        highlight: 'Sleep in knowing your favorites are set aside.',
        description: 'No more arriving at 8:30 AM to find wooden crates already picked clean. Reserve your picks during the week; your labeled brown paper tote will be waiting safely under the canopy until you arrive.', // TEAM: fill in
      },
      {
        numeral: '03',
        title: 'Reduced Harvest Waste',
        highlight: 'Harvested specifically to demand, never in excess.',
        description: 'Pre-orders allow farmers to harvest only what has already been claimed, eliminating leftover field surplus.', // TEAM: fill in
      },
      {
        numeral: '04',
        title: 'Hyper-Local Integrity',
        highlight: 'Authentic regional provenance.',
        description: 'Every market on the platform verifies that all participating producers cultivate their harvests within regional bounds.', // TEAM: fill in
      },
    ],
  },

  // Frequently Asked Questions
  help: {
    faqs: [
      {
        category: 'pickup',
        q: 'How does pickup work?', // TEAM: fill in
        a: 'Browse items from farmers attending your neighborhood market, add items to your basket, select a pickup slot, and place your pre-order. When market day arrives, visit the farmer’s stall during your chosen window to inspect your box and pay.', // TEAM: fill in
      },
      {
        category: 'payments',
        q: 'Do I pay online or in person?', // TEAM: fill in
        a: 'Always in person! MarketLink never charges your credit card or deducts middleman fees. You pay the grower directly at their stall using cash, card, or market vouchers upon collection.', // TEAM: fill in
      },
      {
        category: 'orders',
        q: 'Can I cancel or modify my pre-order?', // TEAM: fill in
        a: 'Yes! As long as the market order cutoff time has not passed, you can modify quantities or cancel your order right from your Orders tab.', // TEAM: fill in
      },
      {
        category: 'farmers',
        q: 'What if an item is out of season or unavailable?', // TEAM: fill in
        a: 'Farmers update their live stock throughout the week. If weather prevents harvesting an item, the farmer marks it unlisted or notifies affected pre-orders immediately.', // TEAM: fill in
      },
      {
        category: 'farmers',
        q: 'How do independent growers join MarketLink?', // TEAM: fill in
        a: 'We welcome certified regional growers, heritage grain bakers, apiaries, and farmstead creameries. Fill out the contact form or register as a Farmer to begin onboarding.', // TEAM: fill in
      },
      {
        category: 'payments',
        q: 'Do you accept SNAP / EBT nutrition coupons?', // TEAM: fill in
        a: 'Yes! Stop by the Information Booth at participating markets to exchange SNAP/EBT benefits for market tokens redeemable at certified stalls.', // TEAM: fill in
      },
    ],
  },

  // Legal Policies
  legal: {
    terms: 'MarketLink connects local agricultural producers with community customers for pre-order and in-person pickup. MarketLink is not a party to the in-person transaction and does not handle payments directly.', // TEAM: fill in
    privacy: 'MarketLink respects your privacy. We store only the essential contact details and order history needed to facilitate your market pickups. We never sell your personal information.', // TEAM: fill in
  },

  // Backwards compatibility aliases
  organization: {
    name: 'MarketLink',
    tagline: 'Farm fresh just a click away',
    description: 'A community-first pre-order platform connecting local farmers and growers directly with neighborhood customers for easy, scheduled market pickups.',
    foundedYear: 2026,
  },
};

// Aliases for convenient imports
siteContent.faq = siteContent.help.faqs;
siteContent.values = siteContent.about.values;

export default siteContent;
