/**
 * Tour step definitions for MarketLink.
 * Carefully tailored to existing features for each user role:
 *  - 'buyer': Customer journey (navigation, search, market hub, harvest feed, catalogue, basket, route, profile, orders, help)
 *  - 'vendor': Farmer journey (grower cockpit, pickup code verification, stock catalog, quick add item, orders queue, public stall, insights, stall settings)
 *  - 'guest': Public visitor walkthrough (local markets, attending stalls, seasonal produce, and account creation)
 */

export const BUYER_STEPS = [
  {
    id: 'buyer-nav',
    target: '[data-tour="buyer-nav"]',
    fallbackTarget: '[data-tour="buyer-bottom-nav"]',
    title: 'Main Navigation',
    content:
      'Move effortlessly between Today’s live market updates, fresh produce browsing, attending stalls, open market hubs, and your collection route.',
    illustration: 'stall',
    placement: 'bottom',
    preferredMobilePlacement: 'top',
  },
  {
    id: 'buyer-search',
    target: '[data-tour="buyer-search"]',
    title: 'Instant Market Search',
    content:
      'Search for heirloom varieties, artisan sourdough, organic honey, or local family farms. You can also press Ctrl + K anywhere on the site.',
    illustration: 'basket-tomatoes',
    placement: 'bottom',
    preferredMobilePlacement: 'bottom',
  },
  {
    id: 'buyer-market-dropdown',
    target: '[data-tour="buyer-market-dropdown"]',
    title: 'Your Home Market Hub',
    content:
      'Your active market dictates stall availability, morning collection hours, and live harvest feeds. Tap anytime to explore other regional markets.',
    illustration: 'basket-door',
    placement: 'bottom',
    preferredMobilePlacement: 'bottom',
  },
  {
    id: 'buyer-clock',
    target: '[data-tour="buyer-clock"]',
    title: 'Market Clock & Cutoffs',
    content:
      'Track real-time trading status and order cutoff deadlines. Farmers close reservations before sunrise so they have time to harvest and pack.',
    illustration: 'crate-carrots',
    placement: 'bottom',
    preferredMobilePlacement: 'bottom',
  },
  {
    id: 'buyer-feed',
    target: '[data-tour="buyer-feed"]',
    title: 'Live Harvest Feed',
    content:
      'Discover stalls attending today’s market, newly added crates, and seasonal produce curated by local growers in your community.',
    illustration: 'leafy-greens',
    placement: 'top',
    preferredMobilePlacement: 'bottom',
  },
  {
    id: 'buyer-products-nav',
    target: '[data-tour="buyer-products-nav"]',
    fallbackTarget: '[data-tour="buyer-bottom-browse"]',
    title: 'Browse Fresh Produce',
    content:
      'Explore live inventory directly from farm stalls. View origin details, harvesting methods, morning pricing, and grower stories.',
    illustration: 'sourdough-boule',
    placement: 'bottom',
    preferredMobilePlacement: 'top',
  },
  {
    id: 'buyer-basket',
    target: '[data-tour="buyer-basket"]',
    fallbackTarget: '[data-tour="buyer-bottom-basket"]',
    title: 'Shopping Basket & Pre-Orders',
    content:
      'Reserve produce from multiple farm stalls in one shared basket. Inspect everything in person at market morning, show your code, and pay cash at the stall.',
    illustration: 'basket',
    placement: 'bottom',
    preferredMobilePlacement: 'top',
  },
  {
    id: 'buyer-route-nav',
    target: '[data-tour="buyer-route-nav"]',
    fallbackTarget: '[data-tour="buyer-bottom-orders"]',
    title: 'Market Route Planner',
    content:
      'Collect all your orders with zero backtracking. MarketLink calculates the optimal walking circuit between your booked stalls on market day.',
    illustration: 'crate',
    placement: 'bottom',
    preferredMobilePlacement: 'top',
  },
  {
    id: 'buyer-profile',
    target: '[data-tour="buyer-profile"]',
    fallbackTarget: '[data-tour="buyer-bottom-you"]',
    title: 'Your Account & Collection Codes',
    content:
      'Access your 4-letter pickup codes, saved markets, restock alerts, notification channels, and replay this tour whenever you need a refresher.',
    illustration: 'honey-jar',
    placement: 'left',
    preferredMobilePlacement: 'top',
  },
];

export const VENDOR_STEPS = [
  {
    id: 'vendor-overview',
    target: '[data-tour="vendor-overview"]',
    fallbackTarget: '[data-tour="vendor-bottom-overview"]',
    title: 'Grower Cockpit Overview',
    content:
      'Welcome to your producer command center. Monitor incoming pre-orders, collection time windows, revenue metrics, and morning packing checklists.',
    illustration: 'stall',
    placement: 'bottom',
    preferredMobilePlacement: 'top',
  },
  {
    id: 'vendor-pickup-code',
    target: '[data-tour="vendor-pickup-code"]',
    fallbackTarget: '[data-tour="vendor-pickup-code-mobile"]',
    title: 'Verify Customer Pickup Codes',
    content:
      'When a customer arrives at your market stall, tap here and enter their 6-character pickup code to confirm items, total, and hand off instantly.',
    illustration: 'basket-door',
    placement: 'bottom',
    preferredMobilePlacement: 'bottom',
  },
  {
    id: 'vendor-add-item',
    target: '[data-tour="vendor-add-item"]',
    fallbackTarget: '[data-tour="vendor-add-item-mobile"]',
    title: 'Add Fresh Harvest Items',
    content:
      'List newly harvested crops, baked loaves, or honey batches with photos, unit pricing, organic certifications, and available crate quantities.',
    illustration: 'crate-carrots',
    placement: 'bottom',
    preferredMobilePlacement: 'bottom',
  },
  {
    id: 'vendor-stock',
    target: '[data-tour="vendor-stock"]',
    fallbackTarget: '[data-tour="vendor-bottom-stock"]',
    title: 'Stock Catalog & Availability',
    content:
      'Toggle items sold out or restocked with a single tap. Live inventory sync ensures walk-up customers and online reservees stay informed.',
    illustration: 'leafy-greens',
    placement: 'right',
    preferredMobilePlacement: 'top',
  },
  {
    id: 'vendor-orders',
    target: '[data-tour="vendor-orders"]',
    fallbackTarget: '[data-tour="vendor-bottom-orders"]',
    title: 'Incoming Orders & Packing Queue',
    content:
      'Manage orders through Placed, Accepted, Packed, and Ready stages. Generate printable pick-lists organized by pickup time slots.',
    illustration: 'basket-tomatoes',
    placement: 'right',
    preferredMobilePlacement: 'top',
  },
  {
    id: 'vendor-insights',
    target: '[data-tour="vendor-insights"]',
    fallbackTarget: '[data-tour="vendor-bottom-more"]',
    title: 'Sales & Harvest Insights',
    content:
      'Track peak pickup windows, top-selling seasonal harvests, average basket size, and customer review sentiments.',
    illustration: 'sourdough-boule',
    placement: 'right',
    preferredMobilePlacement: 'top',
  },
  {
    id: 'vendor-storefront',
    target: '[data-tour="vendor-storefront"]',
    fallbackTarget: '[data-tour="vendor-mobile-storefront"]',
    title: 'Public Stall Storefront',
    content:
      'Preview how your stall banner, farm bio, certifications, and catalogue appear to local customers browsing MarketLink.',
    illustration: 'stall',
    placement: 'top',
    preferredMobilePlacement: 'bottom',
  },
  {
    id: 'vendor-stall',
    target: '[data-tour="vendor-stall"]',
    fallbackTarget: '[data-tour="vendor-bottom-more"]',
    title: 'Stall Settings & Schedule',
    content:
      'Configure your operating market days, pickup collection cutoff deadlines, stall biography, and contact preferences here.',
    illustration: 'honey-jar',
    placement: 'right',
    preferredMobilePlacement: 'top',
  },
];

export const GUEST_STEPS = [
  {
    id: 'guest-brand',
    target: '[data-tour="guest-brand"]',
    title: 'Welcome to MarketLink',
    content:
      'MarketLink connects you directly with certified local farmers, community markets, and fresh seasonal harvests in your neighborhood.',
    illustration: 'stall',
    placement: 'bottom',
    preferredMobilePlacement: 'bottom',
  },
  {
    id: 'guest-markets',
    target: '[data-tour="guest-markets"]',
    fallbackTarget: '[data-tour="guest-markets-btn"]',
    title: 'Discover Local Markets',
    content:
      'Find farmers markets open on weekends and weekdays near you with interactive maps, trading hours, and attending growers.',
    illustration: 'basket-door',
    placement: 'bottom',
    preferredMobilePlacement: 'bottom',
  },
  {
    id: 'guest-stalls',
    target: '[data-tour="guest-stalls"]',
    fallbackTarget: '[data-tour="guest-farmers-section"]',
    title: 'Meet Local Growers',
    content:
      'Explore verified family orchards, heritage grain bakers, vegetable growers, and local food artisans trading in your area.',
    illustration: 'crate-carrots',
    placement: 'bottom',
    preferredMobilePlacement: 'bottom',
  },
  {
    id: 'guest-produce',
    target: '[data-tour="guest-produce"]',
    fallbackTarget: '[data-tour="guest-produce-btn"]',
    title: 'Fresh Seasonal Harvest',
    content:
      'See what is ripe and available on the stalls before you head out. Check grower notes, varieties, and morning availability.',
    illustration: 'leafy-greens',
    placement: 'bottom',
    preferredMobilePlacement: 'bottom',
  },
  {
    id: 'guest-auth',
    target: '[data-tour="guest-auth"]',
    fallbackTarget: '[data-tour="guest-menu-btn"]',
    title: 'Join Our Community',
    content:
      'Sign up as a customer to reserve morning produce crates, or register your farm stall to take pre-orders from local neighbors.',
    illustration: 'honey-jar',
    placement: 'bottom',
    preferredMobilePlacement: 'bottom',
  },
];

export function getStepsForRole(role) {
  if (role === 'farmer' || role === 'vendor') {
    return VENDOR_STEPS;
  }
  if (role === 'customer' || role === 'buyer') {
    return BUYER_STEPS;
  }
  return GUEST_STEPS;
}
