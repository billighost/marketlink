import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Clock,
  Store,
  Truck,
  Bookmark,
  Share2,
  ChevronDown,
  ArrowRight,
  ExternalLink,
  ShoppingBag,
  CheckCircle2,
  Info,
  Phone,
  Mail,
  ShieldCheck,
  Dog,
  CreditCard,
  Camera,
  Check,
  Star,
  Sparkles,
  Leaf,
  Users,
  AlertCircle,
  HelpCircle,
  Award,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { PATHS } from '@/routes/paths';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import styles from './MarketDetail.module.css';

/* ── Dynamic Database of Markets ──────────────────────────────────── */
const MARKETS_DB = {
  'market-greenwich': {
    id: 'market-greenwich',
    name: 'Greenwich Village Farmers Market',
    location: 'Abingdon Square, 8th Ave & 12th St, New York, NY 10014',
    neighborhood: 'Greenwich Village, West Village',
    isOpen: true,
    statusText: 'Open Now',
    scheduleText: 'Saturdays 8AM - 2PM',
    verifiedBadge: 'Verified Producer Only',
    nextMarketDate: 'Sat, Mar 30',
    marketHours: '8:00 AM – 2:00 PM',
    activeVendorsCount: '24 Growers & Artisans',
    orderPickupText: 'Order by Fri 5 PM',
    distanceText: '1.2 mi from your location',
    rating: 4.9,
    reviewCount: 94,
    about:
      'Nestled in the historic heart of the West Village at Abingdon Square, this vibrant open-air market has been a neighborhood cornerstone since 1993. Bringing farm-fresh goodness directly from Hudson Valley family farms to Manhattan tables, shoppers can browse crisp seasonal produce, pasture-raised meats, artisan cheeses, small-batch bakery items, and fresh cut flowers.',
    historyNote:
      'Founded over 30 years ago by local West Village residents and regional fruit growers, Abingdon Square Market is recognized as one of New York City’s most historic community food traditions.',
    stats: [
      { label: 'Weekly Shoppers', value: '2,800+' },
      { label: 'Average Farm Distance', value: '42 miles' },
      { label: 'Organic & Sustainable', value: '88%' },
      { label: 'Years in Continuous Operation', value: '31 yrs' },
    ],
    highlights: [
      {
        id: 'producer-only',
        title: '100% Producer-Only',
        description: 'Every item is harvested or crafted by the seller standing at the stall.',
        icon: ShieldCheck,
      },
      {
        id: 'dog-friendly',
        title: 'Dog Friendly on Leash',
        description: 'Well-behaved dogs on 6-foot leashes are welcome on the perimeter walkways.',
        icon: Dog,
      },
      {
        id: 'ebt-fmnp',
        title: 'EBT & SNAP Bonus Match',
        description: 'Spend $2 in SNAP/EBT and receive $2 bonus Market Match wooden tokens at Info Booth.',
        icon: CreditCard,
      },
      {
        id: 'rain-shine',
        title: 'Rain or Shine Operation',
        description: 'Our growers set up covered awnings through all seasons, spring through snow.',
        icon: Sparkles,
      },
    ],
    gallery: {
      main: {
        url: '/images/market-greenwich.jpg',
        caption: 'Abingdon Square Plaza Main Stall Row',
      },
      topRight: {
        url: '/images/hero-carrots.jpg',
        caption: 'Root Veg - Organic Produce',
      },
      bottomRight: {
        url: '/images/market-wildflower.jpg',
        caption: 'The Wildflower Stand',
      },
    },
    vendors: [
      {
        id: 'f-riverbend',
        name: 'Elena Vance',
        farm: 'Riverbend Farm • Hudson Valley, NY',
        distance: '38 mi away',
        badge: '100% Organic',
        badgeType: 'organic',
        specialty: 'Heirloom tomatoes, crisp brassicas, and field strawberries',
        image: '/images/farmer-elena.jpg',
        link: '/farmers/f-riverbend',
      },
      {
        id: 'f-oakmill',
        name: 'Dan & Priya Patel',
        farm: 'Oak & Mill Bakery • Kingston, NY',
        distance: '45 mi away',
        badge: 'Heritage Grains',
        badgeType: 'artisan',
        specialty: 'Naturally leavened 48-hr sourdough boules and pastries',
        image: '/images/hero-carrots.jpg',
        link: '/farmers/f-oakmill',
      },
      {
        id: 'f-marcus',
        name: 'Marcus Bennett',
        farm: 'Sunburst Orchard • New Paltz, NY',
        distance: '52 mi away',
        badge: 'Eco-Certified',
        badgeType: 'eco',
        specialty: 'Heritage apples, fresh-pressed cider, and Bartlett pears',
        image: '/images/farmer-marcus.jpg',
        link: '/farmers/f-sunburst',
      },
      {
        id: 'f-honey',
        name: 'Sarah Jenkins',
        farm: 'Honey Hollow Apiaries • Catskill, NY',
        distance: '65 mi away',
        badge: 'Raw & Unfiltered',
        badgeType: 'raw',
        specialty: 'Wildflower comb honey, creamed clover, and beeswax candles',
        image: '/images/farmer-sarah.jpg',
        link: '/farmers/f-hollowcreek',
      },
    ],
    products: [
      {
        id: 'prod-heirloom-tomatoes',
        category: 'Produce',
        name: 'Organic Heirloom Tomato Mix',
        vendor: 'Riverbend Farm',
        tag: 'In Season',
        tagType: 'in-season',
        description: 'Juicy, vine-ripened mix of Brandywine, Cherokee Purple, and Green Zebra. 2 lb basket.',
        price: '$6.50',
        unit: '/ basket',
        stockLeft: '14 baskets left',
        stockLow: false,
        image: 'https://avatars.mds.yandex.net/i?id=d2bdd59de0248a5c5027e22529b65cf2867ae6e9-5009165-images-thumbs&n=13',
      },
      {
        id: 'prod-country-sourdough',
        category: 'Bakery',
        name: 'Country Sourdough Loaf',
        vendor: 'Oak & Mill Bakery',
        tag: 'Freshly Baked',
        tagType: 'freshly-baked',
        description: 'Naturally fermented 48-hour sourdough with a crackly crust and tender, airy crumb.',
        price: '$8.00',
        unit: '/ loaf',
        stockLeft: '8 loaves left',
        stockLow: true,
        image: '/images/product-sourdough.jpg',
      },
      {
        id: 'prod-wildflower-honey',
        category: 'Pantry',
        name: 'Raw Meadow Wildflower Honey',
        vendor: 'Honey Hollow Apiaries',
        tag: 'Small Batch',
        tagType: 'small-batch',
        description: 'Raw, unpasteurized summer blossom honey from Catskill clover and goldenrod. 16oz jar.',
        price: '$12.00',
        unit: '/ 16oz jar',
        stockLeft: '19 jars left',
        stockLow: false,
        image: '/images/product-honey.jpg',
      },
      {
        id: 'prod-butterhead-lettuce',
        category: 'Produce',
        name: 'Living Butterhead Lettuce',
        vendor: 'Riverbend Farm',
        tag: 'Crisp Harvest',
        tagType: 'in-season',
        description: 'Freshly cut heads with roots attached in cold spring water. Incredibly tender sweet leaves.',
        price: '$3.50',
        unit: '/ head',
        stockLeft: '22 heads left',
        stockLow: false,
        image: '/images/product-lettuce.jpg',
      },
      {
        id: 'prod-alpine-strawberries',
        category: 'Produce',
        name: 'Organic Alpine Strawberries',
        vendor: 'Riverbend Farm',
        tag: 'Peak Sweetness',
        tagType: 'in-season',
        description: 'Intensely fragrant wild-variety sweet berries hand-picked at dawn.',
        price: '$6.50',
        unit: '/ pint',
        stockLeft: '6 pints left',
        stockLow: true,
        image: '/images/product-strawberries.jpg',
      },
      {
        id: 'prod-farmhouse-cheddar',
        category: 'Dairy',
        name: 'Aged Farmhouse Raw Cheddar',
        vendor: 'Meadowbrook Dairy',
        tag: 'Cellar Aged',
        tagType: 'small-batch',
        description: 'Grass-fed Jersey cow milk cheese aged 14 months for sharp, nutty crystallization.',
        price: '$9.00',
        unit: '/ 8oz wedge',
        stockLeft: '11 wedges left',
        stockLow: false,
        image: '/images/market-central.jpg',
      },
    ],
    sidebar: {
      locationDescription:
        'Abingdon Square Park, located at the intersection of 8th Avenue, West 12th Street, and Hudson Street in the historic West Village.',
      transitTip: 'Subway: A, C, E, L trains to 14th St / 8th Ave (3 min walk) or 1 train to Christopher St.',
      parkingTip: 'Free 2-hour Saturday street parking along Hudson St and Bleecker St.',
      mapImage: '/images/greenwich-map.jpg',
      directionsUrl: 'https://maps.google.com/?q=Abingdon+Square+Park+New+York',
      pickupGuidelines: [
        'Pre-orders are held under the grower’s designated awning with your name tag until 1:00 PM.',
        'Online pre-order reservations close Friday at 5:00 PM so growers can harvest to order at dawn.',
        'Please bring your own reusable tote bag to help support our zero-waste market mandate.',
        'You pay the grower directly at pickup using cash, debit/credit, or SNAP/EBT tokens.',
      ],
      manager: {
        name: 'Marcus Bennett',
        role: 'West Village Market Coordinator',
        organization: 'Managed by GrowNYC in cooperation with West Village Community Alliance.',
        email: 'greenwich@marketlink.org',
        phone: '(212) 555-8392',
      },
    },
    nearbyMarkets: [
      { id: 'market-unionsquare', name: 'Union Square Greenmarket', distance: '0.9 mi', schedule: 'Wed, Fri, Sat' },
      { id: 'market-chelsea', name: 'Chelsea Farmers Market', distance: '1.1 mi', schedule: 'Sundays 9AM-3PM' },
    ],
  },

  'market-unionsquare': {
    id: 'market-unionsquare',
    name: 'Union Square Greenmarket',
    location: 'North & West Plaza, Union Square Park, New York, NY 10003',
    neighborhood: 'Union Square, Flatiron',
    isOpen: true,
    statusText: 'Open Now',
    scheduleText: 'Wed, Fri, Sat 8AM - 6PM',
    verifiedBadge: 'Flagship Producer Market',
    nextMarketDate: 'Sat, Mar 30',
    marketHours: '8:00 AM – 6:00 PM',
    activeVendorsCount: '48 Growers & Artisans',
    orderPickupText: 'Order by Fri 6 PM',
    distanceText: '0.4 mi from your location',
    rating: 4.9,
    reviewCount: 210,
    about:
      'The world-renowned flagship of New York City greenmarkets. Established in 1976, Union Square Greenmarket has grown from a handful of Hudson Valley farmers to over 48 independent growers, orchardists, bakers, and fishermen. It serves as the primary weekend culinary gathering place for home cooks, community neighbours, and Michelin-starred chefs alike.',
    historyNote:
      'Credited with kickstarting the modern farm-to-table culinary renaissance on the East Coast, Union Square has connected regional farmland with city residents for nearly fifty years.',
    stats: [
      { label: 'Weekly Shoppers', value: '18,000+' },
      { label: 'Regional Farms', value: '48 Stalls' },
      { label: 'Harvest Varieties', value: '400+ Types' },
      { label: 'Years Serving NY', value: '48 yrs' },
    ],
    highlights: [
      {
        id: 'producer-only',
        title: '100% Regional Growers',
        description: 'All produce grown within 250 miles of New York City.',
        icon: ShieldCheck,
      },
      {
        id: 'compost-drop',
        title: 'Community Compost & Textile Drop',
        description: 'Drop off kitchen food scraps and textiles every Saturday from 8AM to 2PM.',
        icon: Leaf,
      },
      {
        id: 'ebt-fmnp',
        title: 'SNAP / EBT & FreshConnect',
        description: 'Market tokens and $2 match coupons available at both north and west info tents.',
        icon: CreditCard,
      },
      {
        id: 'chef-demos',
        title: 'Chef Demos & Seedling Starts',
        description: 'Live morning cooking demonstrations with seasonal crops from 11AM–1PM.',
        icon: Sparkles,
      },
    ],
    gallery: {
      main: {
        url: '/images/market-unionsquare.jpg',
        caption: 'North Plaza Morning Market View',
      },
      topRight: {
        url: '/images/hero-market-crates.jpg',
        caption: 'Heirloom squash and cabbage crates',
      },
      bottomRight: {
        url: '/images/market-morning.jpg',
        caption: 'Early dawn setup at 17th Street',
      },
    },
    vendors: [
      {
        id: 'f-riverbend',
        name: 'Elena Vance',
        farm: 'Riverbend Farm • Hudson Valley, NY',
        distance: '38 mi away',
        badge: '100% Organic',
        badgeType: 'organic',
        specialty: 'Heritage tomatoes, certified organic salad greens, herbs',
        image: '/images/farmer-elena.jpg',
        link: '/farmers/f-riverbend',
      },
      {
        id: 'f-marcus',
        name: 'Marcus Bennett',
        farm: 'Sunburst Orchard • New Paltz, NY',
        distance: '52 mi away',
        badge: 'Eco-Certified',
        badgeType: 'eco',
        specialty: 'Stone fruits, crisp cider, and orchard berry pies',
        image: '/images/farmer-marcus.jpg',
        link: '/farmers/f-sunburst',
      },
    ],
    products: [
      {
        id: 'prod-heirloom-tomatoes',
        category: 'Produce',
        name: 'Organic Heirloom Tomato Mix',
        vendor: 'Riverbend Farm',
        tag: 'In Season',
        tagType: 'in-season',
        description: 'Cherokee Purple, Brandywine, and Green Zebra mix. 2 lb basket.',
        price: '$6.50',
        unit: '/ basket',
        stockLeft: '28 baskets left',
        stockLow: false,
        image: 'https://avatars.mds.yandex.net/i?id=d2bdd59de0248a5c5027e22529b65cf2867ae6e9-5009165-images-thumbs&n=13',
      },
      {
        id: 'prod-country-sourdough',
        category: 'Bakery',
        name: 'Country Sourdough Loaf',
        vendor: 'Oak & Mill Bakery',
        tag: 'Freshly Baked',
        tagType: 'freshly-baked',
        description: 'Cold-fermented hearth bread with toasted sesame seed crust.',
        price: '$8.00',
        unit: '/ loaf',
        stockLeft: '14 loaves left',
        stockLow: false,
        image: '/images/product-sourdough.jpg',
      },
    ],
    sidebar: {
      locationDescription:
        'North and West sides of Union Square Park, wrapping along 17th Street and Union Square West from Broadway to Park Ave South.',
      transitTip: 'Subway: 4, 5, 6, L, N, Q, R, W trains directly to 14th St - Union Square.',
      parkingTip: 'Metered commercial parking along 17th St and Broadway after 10 AM.',
      mapImage: '/images/greenwich-map.jpg',
      directionsUrl: 'https://maps.google.com/?q=Union+Square+Greenmarket+New+York',
      pickupGuidelines: [
        'Order pickup station is located at North Plaza Info Tent (Stall #1).',
        'Have your reservation name or order reference ready.',
        'Payment settled directly with growers via cash, card, or tokens.',
      ],
      manager: {
        name: 'Sarah Lin',
        role: 'Union Square Market Director',
        organization: 'Operated by GrowNYC Greenmarket Program.',
        email: 'unionsquare@marketlink.org',
        phone: '(212) 555-4920',
      },
    },
    nearbyMarkets: [
      { id: 'market-greenwich', name: 'Greenwich Village Market', distance: '0.9 mi', schedule: 'Saturdays 8AM-2PM' },
      { id: 'market-tompkins', name: 'Tompkins Square Greenmarket', distance: '1.2 mi', schedule: 'Sundays 9AM-5PM' },
    ],
  },
};

const getFallbackMarket = (id) => ({
  id,
  name: 'Regional Community Farmers Market',
  location: 'Historic Market Square, New York, NY',
  neighborhood: 'New York Regional District',
  isOpen: true,
  statusText: 'Open Saturday',
  scheduleText: 'Saturdays 8AM - 2PM',
  verifiedBadge: 'Verified Producer Only',
  nextMarketDate: 'Sat, Mar 30',
  marketHours: '8:00 AM – 2:00 PM',
  activeVendorsCount: '18 Local Growers',
  orderPickupText: 'Order by Fri 5 PM',
  distanceText: 'Nearby',
  rating: 4.8,
  reviewCount: 42,
  about:
    'Bringing fresh, seasonal harvests directly from independent family farms to neighborhood shoppers with zero middlemen. Enjoy fresh produce, bakery, eggs, dairy, and flowers.',
  historyNote: 'Organized and run by regional producers and community market managers.',
  stats: [
    { label: 'Active Stalls', value: '18+' },
    { label: 'Direct to Farm', value: '100%' },
    { label: 'Weekly Deliveries', value: 'Every Sat' },
    { label: 'Community Rating', value: '4.8 ★' },
  ],
  highlights: [
    { id: 'producer-only', title: '100% Producer-Only', description: 'Grown and made by the seller.', icon: ShieldCheck },
    { id: 'dog-friendly', title: 'Dog Friendly', description: 'Leashed pets are welcome.', icon: Dog },
    { id: 'ebt-fmnp', title: 'SNAP & EBT Match', description: 'Tokens accepted at information desk.', icon: CreditCard },
  ],
  gallery: {
    main: { url: '/images/market-morning.jpg', caption: 'Morning stall row' },
    topRight: { url: '/images/hero-carrots.jpg', caption: 'Fresh morning roots' },
    bottomRight: { url: '/images/market-wildflower.jpg', caption: 'Cut flowers stand' },
  },
  vendors: [
    {
      id: 'f-riverbend',
      name: 'Elena Vance',
      farm: 'Riverbend Farm • Hudson Valley, NY',
      distance: '38 mi',
      badge: 'Organic',
      badgeType: 'organic',
      specialty: 'Heirloom tomatoes and greens',
      image: '/images/farmer-elena.jpg',
      link: '/farmers/f-riverbend',
    },
  ],
  products: [
    {
      id: 'prod-heirloom-tomatoes',
      category: 'Produce',
      name: 'Organic Heirloom Tomato Mix',
      vendor: 'Riverbend Farm',
      tag: 'In Season',
      tagType: 'in-season',
      description: 'Hand-picked heritage tomatoes.',
      price: '$6.50',
      unit: '/ basket',
      stockLeft: '14 left',
      stockLow: false,
      image: 'https://avatars.mds.yandex.net/i?id=d2bdd59de0248a5c5027e22529b65cf2867ae6e9-5009165-images-thumbs&n=13',
    },
  ],
  sidebar: {
    locationDescription: 'Central market pavilion. Follow signage from the street entrance.',
    transitTip: 'Accessible via local bus routes and nearby train lines.',
    parkingTip: 'Nearby street parking available on weekend mornings.',
    mapImage: '/images/greenwich-map.jpg',
    directionsUrl: 'https://maps.google.com',
    pickupGuidelines: ['Pre-orders held safely under canopy until 1:00 PM.'],
    manager: {
      name: 'Market Coordination Office',
      role: 'Operations Desk',
      organization: 'MarketLink Community Partner',
      email: 'hello@marketlink.org',
      phone: '(212) 555-0198',
    },
  },
  nearbyMarkets: [],
});

/**
 * Interactive click-to-zoom image component.
 * Zooms into the exact cursor position on click and pans on mouse move while zoomed.
 */
function ZoomableGalleryImage({ src, alt, caption, className, isMain = false }) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });

  const updateOrigin = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setOrigin({ x, y });
  };

  const handleClick = (e) => {
    updateOrigin(e);
    setIsZoomed((prev) => !prev);
  };

  const handleMouseMove = (e) => {
    if (isZoomed) {
      updateOrigin(e);
    }
  };

  const handleMouseLeave = () => {
    if (isZoomed) {
      setIsZoomed(false);
    }
  };

  return (
    <div
      className={`${className} ${styles.zoomContainer} ${isZoomed ? styles.isZoomed : ''}`}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={0}
      aria-label={isZoomed ? 'Click to zoom out' : 'Click to zoom into cursor position'}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsZoomed((prev) => !prev);
        } else if (e.key === 'Escape' && isZoomed) {
          setIsZoomed(false);
        }
      }}
    >
      <img
        src={src}
        alt={alt}
        className={`${styles.galleryImg} ${styles.zoomImg}`}
        style={{
          transformOrigin: `${origin.x}% ${origin.y}%`,
          transform: isZoomed ? 'scale(2.5)' : undefined,
        }}
        draggable={false}
      />

      {/* Floating Zoom Tooltip / Badge */}
      <span className={styles.zoomBadge}>
        {isZoomed ? (
          <>
            <ZoomOut size={12} />
            <span>Click to zoom out</span>
          </>
        ) : (
          <>
            <ZoomIn size={12} />
            <span>Click to zoom</span>
          </>
        )}
      </span>

      {/* Caption Pill */}
      {caption && (
        <div className={isMain ? styles.galleryCaptionPill : styles.gallerySubPill}>
          {isMain && <Camera size={13} className={styles.cameraIcon} />}
          <span>{caption}</span>
        </div>
      )}
    </div>
  );
}

export function MarketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const market = MARKETS_DB[id] || MARKETS_DB['market-greenwich'] || getFallbackMarket(id);
  useDocumentTitle(`${market.name} — MarketLink`);

  const [activeTab, setActiveTab] = useState('overview'); // overview, vendors, products, schedule
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [reservedItems, setReservedItems] = useState({});

  const handleShare = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleReserve = (productId) => {
    setReservedItems((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  const handleTabJump = (tabName) => {
    setActiveTab(tabName);
    const contentEl = document.getElementById('market-tabs-content');
    if (contentEl) {
      contentEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const categories = ['All', ...new Set(market.products.map((p) => p.category))];

  const filteredProducts =
    selectedCategory === 'All'
      ? market.products
      : market.products.filter((p) => p.category === selectedCategory);

  return (
    <div className={styles.page}>
      {/* ─── BREADCRUMBS BAR ─────────────────────────────────────── */}
      <div className={styles.breadcrumbBar}>
        <div className="container">
          <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
            <Link to={PATHS.HOME} className={styles.crumbLink}>
              Home
            </Link>
            <span className={styles.crumbDivider}>›</span>
            <Link to={PATHS.MARKETS} className={styles.crumbLink}>
              Markets
            </Link>
            <span className={styles.crumbDivider}>›</span>
            <span className={styles.crumbCurrent}>{market.name}</span>
          </nav>
        </div>
      </div>

      {/* ─── HEADER / HERO TITLE BLOCK ─────────────────────────── */}
      <header className={styles.headerSection}>
        <div className="container">
          <div className={styles.headerLayout}>
            <div className={styles.headerLeft}>
              {/* Badges */}
              <div className={styles.badgeRow}>
                <span className={styles.statusPillOpen}>
                  <span className={styles.statusDot} />
                  {market.statusText}
                </span>
                <span className={styles.schedulePill}>{market.scheduleText}</span>
                <span className={styles.verifiedPill}>
                  <ShieldCheck size={13} />
                  {market.verifiedBadge}
                </span>
              </div>

              {/* Title */}
              <h1 className={styles.marketTitle}>{market.name}</h1>

              {/* Location & Reviews Subtitle */}
              <div className={styles.subtitleRow}>
                <div className={styles.locationSubtitle}>
                  <MapPin size={15} className={styles.locationIcon} />
                  <span>{market.location}</span>
                </div>
                <span className={styles.subSep}>•</span>
                <div className={styles.ratingBadge}>
                  <Star size={14} fill="#D4850A" color="#D4850A" />
                  <strong>{market.rating}</strong>
                  <span>({market.reviewCount} shopper reviews)</span>
                </div>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className={styles.headerActions}>
              <div className={styles.actionButtonsRow}>
                <button
                  type="button"
                  onClick={() => setSaved(!saved)}
                  className={`${styles.saveButton} ${saved ? styles.savedActive : ''}`}
                  aria-label={saved ? 'Remove from saved' : 'Save market'}
                >
                  <Bookmark
                    size={16}
                    fill={saved ? '#541722' : 'none'}
                    strokeWidth={2}
                    className={styles.actionIcon}
                  />
                  <span>{saved ? 'Saved' : 'Save Market'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className={styles.shareButton}
                  title="Share link"
                  aria-label="Share market link"
                >
                  {copied ? <Check size={16} color="#175e21" /> : <Share2 size={16} />}
                  <span>{copied ? 'Copied!' : 'Share'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleTabJump('products')}
                className={styles.jumpProductsBtn}
              >
                <ShoppingBag size={16} />
                <span>Browse Saturday Harvest</span>
                <ChevronDown size={15} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── GALLERY COLLAGE MOSAIC ─────────────────────────────── */}
      <section className={styles.gallerySection}>
        <div className="container">
          <div className={styles.galleryCollage} aria-label="Market photos">
            {/* Main Hero Shot with Click-To-Cursor Zoom */}
            <ZoomableGalleryImage
              src={market.gallery.main.url}
              alt={market.name}
              caption={market.gallery.main.caption}
              className={styles.galleryMain}
              isMain={true}
            />

            {/* Right Stack with Click-To-Cursor Zoom */}
            <div className={styles.galleryRightStack}>
              <ZoomableGalleryImage
                src={market.gallery.topRight.url}
                alt={market.gallery.topRight.caption}
                caption={market.gallery.topRight.caption}
                className={styles.gallerySubItem}
              />
              <ZoomableGalleryImage
                src={market.gallery.bottomRight.url}
                alt={market.gallery.bottomRight.caption}
                caption={market.gallery.bottomRight.caption}
                className={styles.gallerySubItem}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── KEY STATS & TRUST BAR ──────────────────────────────── */}
      <section className={styles.quickInfoSection}>
        <div className="container">
          <div className={styles.quickInfoBar} aria-label="Key market details">
            <div className={styles.quickInfoItem}>
              <div className={`${styles.quickIconWrap} ${styles.iconPink}`}>
                <Calendar size={18} />
              </div>
              <div className={styles.quickInfoContent}>
                <span className={styles.quickLabel}>Next Market</span>
                <strong className={styles.quickValue}>{market.nextMarketDate}</strong>
              </div>
            </div>

            <div className={styles.quickInfoItem}>
              <div className={`${styles.quickIconWrap} ${styles.iconOrange}`}>
                <Clock size={18} />
              </div>
              <div className={styles.quickInfoContent}>
                <span className={styles.quickLabel}>Market Hours</span>
                <strong className={styles.quickValue}>{market.marketHours}</strong>
              </div>
            </div>

            <div className={styles.quickInfoItem}>
              <div className={`${styles.quickIconWrap} ${styles.iconGreen}`}>
                <Store size={18} />
              </div>
              <div className={styles.quickInfoContent}>
                <span className={styles.quickLabel}>Active Producers</span>
                <strong className={styles.quickValue}>{market.activeVendorsCount}</strong>
              </div>
            </div>

            <div className={styles.quickInfoItem}>
              <div className={`${styles.quickIconWrap} ${styles.iconSlate}`}>
                <Truck size={18} />
              </div>
              <div className={styles.quickInfoContent}>
                <span className={styles.quickLabel}>Pre-Order Cutoff</span>
                <strong className={styles.quickValue}>{market.orderPickupText}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TAB NAVIGATION BAR ─────────────────────────────────── */}
      <section className={styles.tabNavBarSection}>
        <div className="container">
          <div className={styles.tabsNav}>
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.tabBtnActive : ''}`}
            >
              Overview & Amenities
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('vendors')}
              className={`${styles.tabBtn} ${activeTab === 'vendors' ? styles.tabBtnActive : ''}`}
            >
              Farmers & Artisans ({market.vendors.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`${styles.tabBtn} ${activeTab === 'products' ? styles.tabBtnActive : ''}`}
            >
              Available Harvest ({market.products.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('schedule')}
              className={`${styles.tabBtn} ${activeTab === 'schedule' ? styles.tabBtnActive : ''}`}
            >
              Location & Schedule
            </button>
          </div>
        </div>
      </section>

      {/* ─── MAIN TWO-COLUMN CONTENT GRID ───────────────────────── */}
      <section id="market-tabs-content" className={styles.mainContentSection}>
        <div className="container">
          <div className={styles.mainGrid}>
            {/* ── LEFT COLUMN: DYNAMIC TAB CONTENT ── */}
            <main className={styles.leftColumn}>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className={styles.tabPane}>
                  {/* About This Market */}
                  <article className={styles.contentCard}>
                    <h2 className={styles.cardHeading}>About {market.name}</h2>
                    <p className={styles.aboutText}>{market.about}</p>
                    {market.historyNote && (
                      <div className={styles.historyCallout}>
                        <Award size={18} className={styles.historyIcon} />
                        <p>{market.historyNote}</p>
                      </div>
                    )}

                    {/* Market Highlights Grid */}
                    <div className={styles.highlightsGrid}>
                      {market.highlights.map((h) => {
                        const Icon = h.icon;
                        return (
                          <div key={h.id} className={styles.highlightItem}>
                            <div className={styles.highlightHeader}>
                              <div className={styles.highlightIconWrap}>
                                <Icon size={16} />
                              </div>
                              <h3 className={styles.highlightTitle}>{h.title}</h3>
                            </div>
                            <p className={styles.highlightDesc}>{h.description}</p>
                          </div>
                        );
                      })}
                    </div>
                  </article>

                  {/* Market Stats Grid */}
                  {market.stats && (
                    <div className={styles.statsCard}>
                      <h3 className={styles.statsCardHeading}>Market Impact & Integrity</h3>
                      <div className={styles.statsMetricGrid}>
                        {market.stats.map((s, idx) => (
                          <div key={idx} className={styles.metricItem}>
                            <strong className={styles.metricVal}>{s.value}</strong>
                            <span className={styles.metricLbl}>{s.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Featured Stalls Preview */}
                  <div className={styles.contentCard}>
                    <div className={styles.sectionHeaderRow}>
                      <div>
                        <h2 className={styles.cardHeading}>Featured Stalls This Saturday</h2>
                        <p className={styles.sectionSub}>Independent regional producers setting up at dawn</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('vendors')}
                        className={styles.textLinkAction}
                      >
                        <span>View All Vendors</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>

                    <div className={styles.vendorCardsGrid}>
                      {market.vendors.slice(0, 2).map((v) => (
                        <div key={v.id} className={styles.vendorCard}>
                          <img src={v.image} alt={v.name} className={styles.vendorImg} />
                          <div className={styles.vendorDetails}>
                            <div className={styles.vendorNameRow}>
                              <h3 className={styles.vendorName}>{v.name}</h3>
                              <span className={styles.vendorBadge}>{v.badge}</span>
                            </div>
                            <p className={styles.vendorFarm}>{v.farm}</p>
                            <p className={styles.vendorSpecialty}>{v.specialty}</p>
                            <Link to={v.link} className={styles.exploreStallLink}>
                              <span>Explore Farm Stall</span>
                              <ArrowRight size={13} />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: VENDORS ROSTER */}
              {activeTab === 'vendors' && (
                <div className={styles.tabPane}>
                  <div className={styles.contentCard}>
                    <div className={styles.sectionHeaderRow}>
                      <div>
                        <h2 className={styles.cardHeading}>Participating Farmers & Artisans</h2>
                        <p className={styles.sectionSub}>
                          Every vendor is 100% verified producer-only. Zero resellers, zero markups.
                        </p>
                      </div>
                    </div>

                    <div className={styles.vendorCardsGrid}>
                      {market.vendors.map((v) => (
                        <div key={v.id} className={styles.vendorCard}>
                          <img src={v.image} alt={v.name} className={styles.vendorImg} />
                          <div className={styles.vendorDetails}>
                            <div className={styles.vendorNameRow}>
                              <h3 className={styles.vendorName}>{v.name}</h3>
                              <span className={styles.vendorBadge}>{v.badge}</span>
                            </div>
                            <p className={styles.vendorFarm}>{v.farm}</p>
                            <span className={styles.vendorDistance}>
                              <MapPin size={11} /> {v.distance}
                            </span>
                            <p className={styles.vendorSpecialty}>{v.specialty}</p>
                            <Link to={v.link} className={styles.exploreStallLink}>
                              <span>Explore Farm Stall</span>
                              <ArrowRight size={13} />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: AVAILABLE HARVEST (PRODUCTS) */}
              {activeTab === 'products' && (
                <div className={styles.tabPane}>
                  <div className={styles.contentCard}>
                    <div className={styles.productsHeaderRow}>
                      <div>
                        <h2 className={styles.cardHeading}>Available for Pre-Order</h2>
                        <p className={styles.sectionSub}>
                          Reserved online during the week, harvested at dawn, and held at the stall
                        </p>
                      </div>

                      {/* Filter Pills */}
                      <div className={styles.filterPills}>
                        {categories.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedCategory(cat)}
                            className={`${styles.filterPill} ${selectedCategory === cat ? styles.filterPillActive : ''
                              }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.productsGrid}>
                      {filteredProducts.map((p) => {
                        const isReserved = reservedItems[p.id];
                        return (
                          <div key={p.id} className={styles.productCard}>
                            <div className={styles.productImageWrap}>
                              <img src={p.image} alt={p.name} className={styles.productImg} />
                              <span className={styles.productTagPill}>{p.tag}</span>
                            </div>

                            <div className={styles.productBody}>
                              <span className={styles.productVendor}>{p.vendor}</span>
                              <h3 className={styles.productTitle}>
                                <Link
                                  to={`/products/${p.id}`}
                                  className={styles.productLink}
                                >
                                  {p.name}
                                </Link>
                              </h3>
                              <p className={styles.productDesc}>{p.description}</p>

                              <div className={styles.productPricingRow}>
                                <div className={styles.productPriceGroup}>
                                  <span className={styles.productPrice}>{p.price}</span>
                                  <span className={styles.productUnit}>{p.unit}</span>
                                </div>
                                <span
                                  className={
                                    p.stockLow ? styles.productStockAlert : styles.productStockMuted
                                  }
                                >
                                  {p.stockLeft}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleToggleReserve(p.id)}
                                className={`${styles.reserveButton} ${isReserved ? styles.reserveButtonActive : ''
                                  }`}
                              >
                                <ShoppingBag size={15} />
                                <span>{isReserved ? '✓ Reserved for Pickup' : 'Reserve for Saturday'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SCHEDULE & DIRECTIONS */}
              {activeTab === 'schedule' && (
                <div className={styles.tabPane}>
                  <div className={styles.contentCard}>
                    <h2 className={styles.cardHeading}>Market Schedule & Location Guidelines</h2>

                    <div className={styles.scheduleDetailBox}>
                      <div className={styles.scheduleDetailRow}>
                        <Calendar size={18} className={styles.scheduleIcon} />
                        <div>
                          <strong>Market Hours</strong>
                          <p>{market.scheduleText} · Year-Round Operation</p>
                        </div>
                      </div>

                      <div className={styles.scheduleDetailRow}>
                        <Clock size={18} className={styles.scheduleIcon} />
                        <div>
                          <strong>Pre-Order Window</strong>
                          <p>
                            Opens Wednesday morning · Cutoff is Friday at 5:00 PM Sharp for Saturday morning pickup.
                          </p>
                        </div>
                      </div>

                      <div className={styles.scheduleDetailRow}>
                        <MapPin size={18} className={styles.scheduleIcon} />
                        <div>
                          <strong>Exact Physical Address</strong>
                          <p>{market.location}</p>
                        </div>
                      </div>
                    </div>

                    <div className={styles.transitBox}>
                      <h3 className={styles.transitHeading}>Getting Here & Parking</h3>
                      <p className={styles.transitText}>
                        <strong>Public Transit:</strong> {market.sidebar.transitTip}
                      </p>
                      <p className={styles.transitText}>
                        <strong>Street Parking:</strong> {market.sidebar.parkingTip}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </main>

            {/* ── RIGHT COLUMN: STICKY SIDEBAR ── */}
            <aside className={styles.sidebar}>
              {/* Card 1: Market Location & Map */}
              <div className={styles.sideCard}>
                <div className={styles.sideCardHeader}>
                  <Store size={18} className={styles.sideHeaderIcon} />
                  <h2 className={styles.sideCardTitle}>Market Location</h2>
                </div>

                <div className={styles.sideMapWrapper}>
                  <img
                    src={market.sidebar.mapImage}
                    alt={`Map of ${market.name}`}
                    className={styles.sideMapImg}
                  />
                  <div className={styles.mapPinOverlay}>
                    <MapPin size={14} color="#ffffff" />
                    <span>{market.neighborhood || 'Market Square'}</span>
                  </div>
                </div>

                <p className={styles.sideLocationText}>
                  {market.sidebar.locationDescription}
                </p>

                <a
                  href={market.sidebar.directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.getDirectionsButton}
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink size={14} />
                </a>
              </div>

              {/* Card 2: Pickup Guidelines */}
              <div className={styles.sideCard}>
                <div className={styles.sideCardHeader}>
                  <Info size={18} className={styles.sideHeaderIcon} />
                  <h2 className={styles.sideCardTitle}>Pickup Guidelines</h2>
                </div>

                <ul className={styles.guidelinesList}>
                  {market.sidebar.pickupGuidelines.map((item, idx) => (
                    <li key={idx} className={styles.guidelineItem}>
                      <CheckCircle2 size={16} className={styles.guidelineCheck} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card 3: Market Manager & Info Booth */}
              <div className={styles.sideCard}>
                <div className={styles.sideCardHeader}>
                  <Award size={18} className={styles.sideHeaderIcon} />
                  <h2 className={styles.sideCardTitle}>Market Coordination Desk</h2>
                </div>

                <p className={styles.managerOrg}>{market.sidebar.manager.organization}</p>

                <div className={styles.managerContactList}>
                  <a
                    href={`mailto:${market.sidebar.manager.email}`}
                    className={styles.managerContactLink}
                  >
                    <Mail size={15} className={styles.managerContactIcon} />
                    <span>{market.sidebar.manager.email}</span>
                  </a>

                  <a
                    href={`tel:${market.sidebar.manager.phone.replace(/[^0-9]/g, '')}`}
                    className={styles.managerContactLink}
                  >
                    <Phone size={15} className={styles.managerContactIcon} />
                    <span>{market.sidebar.manager.phone}</span>
                  </a>
                </div>
              </div>

              {/* Card 4: Nearby Markets */}
              {market.nearbyMarkets && market.nearbyMarkets.length > 0 && (
                <div className={styles.sideCard}>
                  <h3 className={styles.nearbyTitle}>Nearby Regional Markets</h3>
                  <div className={styles.nearbyList}>
                    {market.nearbyMarkets.map((nm) => (
                      <Link
                        key={nm.id}
                        to={`/markets/${nm.id}`}
                        className={styles.nearbyItem}
                      >
                        <div>
                          <strong>{nm.name}</strong>
                          <span>{nm.schedule}</span>
                        </div>
                        <span className={styles.nearbyDistance}>{nm.distance}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>

      {/* ─── BOTTOM COMMUNITY CTA BANNER ────────────────────────── */}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className={styles.ctaCard}>
            <div className={styles.ctaBadgeRow}>
              <span className={styles.ctaBadge}>
                <Sparkles size={13} />
                Saturday Morning Tradition
              </span>
            </div>

            <h2 className={styles.ctaTitle}>
              Meet your growers this Saturday at {market.name}.
            </h2>

            <p className={styles.ctaSubtitle}>
              Reserve your seasonal fruits, vegetables, and artisan sourdough during the week.
              Pay in person directly at the stall.
            </p>

            <div className={styles.ctaButtonGroup}>
              <button
                type="button"
                onClick={() => handleTabJump('products')}
                className={styles.ctaPrimaryBtn}
              >
                <span>Browse {market.name} Harvest</span>
                <ArrowRight size={17} />
              </button>
              <Link to={PATHS.MARKETS} className={styles.ctaSecondaryBtn}>
                <span>Explore All 8 Markets</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default MarketDetail;
