/**
 * MarketLink Static Site Content
 * Central source of truth for organizational, team, and contact details.
 * Fields marked '// TEAM: fill in' can be customized by project team members.
 */

export const siteContent = {
  organization: {
    name: 'MarketLink',
    tagline: 'Farm fresh just a click away',
    description: 'A community-first pre-order platform connecting local farmers and growers directly with neighborhood customers for easy, scheduled market pickups.',
    foundedYear: 2026,
  },

  // Contact details
  contact: {
    // TEAM: fill in
    address: '142 Orchard Grove Way, Suite 200, Bristol, BS1 5TY',
    // TEAM: fill in
    phone: '+44 (0) 117 496 0882',
    // TEAM: fill in
    email: 'hello@marketlink.community',
    // TEAM: fill in
    hours: 'Monday – Friday: 8:30 AM – 5:30 PM • Saturday: 7:30 AM – 2:00 PM',
    // TEAM: fill in (coordinates for Leaflet map pin)
    coordinates: {
      lat: 51.4545,
      lng: -2.5879,
    },
    serviceRadiusKm: 25,
  },

  // Team profiles
  // TEAM: fill in
  team: [
    {
      name: 'Elena Rostova',
      role: 'Co-Founder & Producer Lead',
      bio: 'Lifelong advocate for regenerative farming with 12 years managing regional growers collectives.',
      // TEAM: fill in
      image: null,
    },
    {
      name: 'Marcus Chen',
      role: 'Co-Founder & Technical Architect',
      bio: 'Software engineer passionate about building low-friction civic technology for local food security.',
      // TEAM: fill in
      image: null,
    },
    {
      name: 'Sophia Patel',
      role: 'Community & Market Coordinator',
      bio: 'Liaises weekly with market managers, vendors, and neighborhood volunteers to keep pickup running smoothly.',
      // TEAM: fill in
      image: null,
    },
  ],

  // Values and missions
  values: [
    {
      title: 'Zero Middleman Markups',
      description: '100% of the produce purchase goes directly to the local grower. Customers pay upon in-person collection.',
    },
    {
      title: 'Reduced Harvest Waste',
      description: 'Pre-orders allow farmers to harvest only what has already been claimed, eliminating leftover field surplus.',
    },
    {
      title: 'Hyper-Local Integrity',
      description: 'Every market on the platform verifies that all participating producers cultivate their harvests within regional bounds.',
    },
  ],

  // FAQ
  faq: [
    {
      q: 'How does pickup work?',
      a: 'Browse items from farmers attending your neighborhood market, add items to your basket, select a pickup slot, and place your pre-order. When market day arrives, visit the farmer’s stall during your chosen window to inspect your box and pay.',
    },
    {
      q: 'Do I pay online?',
      a: 'No. MarketLink is entirely payment-in-person. You pay the grower directly at their stall using cash, card, or market vouchers.',
    },
    {
      q: 'Can I cancel or modify my pre-order?',
      a: 'Yes! As long as the market order cutoff time has not passed, you can modify quantities or cancel your order right from your Orders tab.',
    },
    {
      q: 'What if an item is out of season or unavailable?',
      a: 'Farmers update their live stock throughout the week. If weather prevents harvesting an item, the farmer marks it unlisted or notifies affected pre-orders immediately.',
    },
  ],
};

export default siteContent;
