import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  MapPin,
  Calendar,
  RotateCcw,
  Map as MapIcon,
  List as ListIcon,
  Bookmark,
  Clock,
  Store,
  Navigation,
  Check,
  X,
  Sliders,
  ChevronDown,
  Plus,
  Minus,
  Crosshair,
  ArrowRight,
  ExternalLink,
  Star,
  Sparkles,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { PATHS } from '@/routes/paths';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import styles from './Market.module.css';

export const MARKETS_DATA = [
  {
    id: 'market-unionsquare',
    name: 'Union Square Greenmarket',
    image: '/images/market-unionsquare.jpg',
    status: 'Open Now',
    statusType: 'open',
    statusDetail: 'Open Now • Closes at 6:00 PM',
    distance: '0.4 mi away',
    distanceMiles: '0.4 miles away',
    location: 'North & West sides of Union Square Park',
    fullAddress: 'North & West Plaza, Union Square Park, New York, NY 10003',
    nextMarket: 'Today, until 6:00 PM',
    hours: '8:00 AM – 6:00 PM',
    vendors: '32 Growers',
    vendorsDetail: '32 Growers & Artisans',
    rating: 4.9,
    reviewCount: 210,
    day: 'Wednesday, Friday, Saturday',
    categories: ['All Markets', 'Organic Only', 'Open Now', 'Weekend'],
    description:
      'The flagship New York market. Over 40 regional family farms offering orchard fruits, heritage vegetables, artisanal cheeses, and bakery goods.',
    path: '/markets/market-unionsquare',
    mapPin: {
      name: 'Union Square',
      top: '38%',
      left: '68%',
    },
  },
  {
    id: 'market-greenwich',
    name: 'Greenwich Village Market',
    image: '/images/market-greenwich.jpg',
    status: 'Open Now',
    statusType: 'open',
    statusDetail: 'Open Now • Closes at 2:00 PM',
    distance: '1.2 mi away',
    distanceMiles: '1.2 miles away',
    location: 'Abingdon Square, 8th Ave & 12th St',
    fullAddress: 'Abingdon Square Park, 8th Ave & 12th St, New York, NY 10014',
    nextMarket: 'Sat, Mar 30',
    hours: '8:00 AM – 2:00 PM',
    vendors: '24 Growers',
    vendorsDetail: '24 Growers & Artisans',
    rating: 4.9,
    reviewCount: 94,
    day: 'Saturday',
    categories: ['All Markets', 'Organic Only', 'Open Now', 'Weekend'],
    description:
      'Historic Abingdon Square setting featuring 24 Hudson Valley family farms bringing heirloom produce, sourdough, and pasture-raised meats.',
    path: '/markets/market-greenwich',
    mapPin: {
      name: 'Greenwich Village',
      top: '49%',
      left: '52%',
    },
  },
  {
    id: 'market-chelsea',
    name: 'Chelsea Farmers Market',
    image: '/images/market-chelsea.jpg',
    status: 'Open Tomorrow',
    statusType: 'tomorrow',
    statusDetail: 'Opens Tomorrow at 9:00 AM',
    distance: '1.8 mi away',
    distanceMiles: '1.8 miles away',
    location: 'W 23rd St & 9th Ave',
    fullAddress: 'W 23rd St & 9th Ave, New York, NY 10011',
    nextMarket: 'Sat, Mar 30',
    hours: '9:00 AM – 3:30 PM',
    vendors: '18 Growers',
    vendorsDetail: '18 Growers & Artisans',
    rating: 4.8,
    reviewCount: 68,
    day: 'Saturday',
    categories: ['All Markets', 'Weekend'],
    description:
      'A lively neighborhood gathering on 23rd Street offering seasonal orchard fruits, pasture-raised poultry, and fresh artisanal ciders.',
    path: '/markets/market-chelsea',
    mapPin: {
      name: 'Chelsea',
      top: '26%',
      left: '56%',
    },
  },
  {
    id: 'market-tompkins',
    name: 'Tompkins Square Greenmarket',
    image: '/images/market-tompkins.jpg',
    status: 'Open Now',
    statusType: 'open',
    statusDetail: 'Open Now • Closes at 5:00 PM',
    distance: '2.3 mi away',
    distanceMiles: '2.3 miles away',
    location: 'Avenue A & E 7th St',
    fullAddress: 'Avenue A & E 7th St, East Village, New York, NY 10009',
    nextMarket: 'Sun, Mar 31',
    hours: '8:00 AM – 5:00 PM',
    vendors: '15 Growers',
    vendorsDetail: '15 Growers & Artisans',
    rating: 4.7,
    reviewCount: 52,
    day: 'Sunday',
    categories: ['All Markets', 'Organic Only', 'Open Now', 'Weekend'],
    description:
      'East Village community staple with an exceptional selection of certified organic greens, raw local honey, and orchard apples.',
    path: '/markets/market-tompkins',
    mapPin: {
      name: 'Tompkins Square',
      top: '55%',
      left: '80%',
    },
  },
  {
    id: 'market-brooklyn',
    name: 'Brooklyn Grand Army Plaza',
    image: '/images/market-brooklyn.jpg',
    status: 'Open Tomorrow',
    statusType: 'tomorrow',
    statusDetail: 'Opens Tomorrow at 8:00 AM',
    distance: '3.2 mi away',
    distanceMiles: '3.2 miles away',
    location: 'Prospect Park West & Flatbush Ave, BK',
    fullAddress: 'Prospect Park West & Flatbush Ave, Brooklyn, NY 11238',
    nextMarket: 'Sat, Mar 30',
    hours: '8:00 AM – 3:00 PM',
    vendors: '38 Growers',
    vendorsDetail: '38 Growers & Artisans',
    rating: 4.9,
    reviewCount: 145,
    day: 'Saturday',
    categories: ['All Markets', 'Weekend', 'Organic Only'],
    description:
      'The flagship Brooklyn market at the northwest entrance of Prospect Park with dozens of farm stands and artisanal makers.',
    path: '/markets/market-brooklyn',
    mapPin: {
      name: 'Grand Army Plaza',
      top: '82%',
      left: '78%',
    },
  },
  {
    id: 'market-stuyvesant',
    name: 'Stuyvesant Town Market',
    image: '/images/market-stuyvesant.jpg',
    status: 'Open Now',
    statusType: 'open',
    statusDetail: 'Open Now • Closes at 4:00 PM',
    distance: '2.8 mi away',
    distanceMiles: '2.8 miles away',
    location: 'Oval & 14th St Loop, NY',
    fullAddress: 'The Oval at 14th St Loop, New York, NY 10009',
    nextMarket: 'Today, until 4:00 PM',
    hours: '9:30 AM – 4:00 PM',
    vendors: '12 Growers',
    vendorsDetail: '12 Growers & Artisans',
    rating: 4.7,
    reviewCount: 38,
    day: 'Saturday',
    categories: ['All Markets', 'Open Now', 'Weekend'],
    description:
      'Convenient residential market tucked around the park oval, featuring farm-fresh berries, artisanal baked goods, and wild fish.',
    path: '/markets/market-stuyvesant',
    mapPin: {
      name: 'Stuyvesant Town',
      top: '42%',
      left: '88%',
    },
  },
  {
    id: 'market-riverside',
    name: 'Riverside Park Greenmarket',
    image: '/images/market-riverside.jpg',
    status: 'Open Tomorrow',
    statusType: 'tomorrow',
    statusDetail: 'Opens Tomorrow at 8:30 AM',
    distance: '3.6 mi away',
    distanceMiles: '3.6 miles away',
    location: 'Riverside Dr & W 97th St',
    fullAddress: 'Riverside Dr & W 97th St, New York, NY 10025',
    nextMarket: 'Sat, Mar 30',
    hours: '8:30 AM – 2:30 PM',
    vendors: '14 Growers',
    vendorsDetail: '14 Growers & Artisans',
    rating: 4.8,
    reviewCount: 44,
    day: 'Saturday',
    categories: ['All Markets', 'Weekend'],
    description:
      'Perched along the scenic Hudson River on the Upper West Side, offering regional stone fruits, grass-fed meats, and root vegetables.',
    path: '/markets/market-riverside',
    mapPin: {
      name: 'Riverside Park',
      top: '12%',
      left: '46%',
    },
  },
  {
    id: 'market-central',
    name: 'Central Park West Market',
    image: '/images/market-central.jpg',
    status: 'Open Now',
    statusType: 'open',
    statusDetail: 'Open Now • Closes at 3:00 PM',
    distance: '2.9 mi away',
    distanceMiles: '2.9 miles away',
    location: 'Columbus Ave & 77th St',
    fullAddress: 'Columbus Ave between 77th & 81st St, New York, NY 10024',
    nextMarket: 'Today, until 3:00 PM',
    hours: '9:00 AM – 3:00 PM',
    vendors: '20 Growers',
    vendorsDetail: '20 Growers & Artisans',
    rating: 4.8,
    reviewCount: 86,
    day: 'Sunday',
    categories: ['All Markets', 'Open Now', 'Organic Only', 'Weekend'],
    description:
      'Historic outdoor market behind the Museum of Natural History with pasture cheeses, organic mushrooms, and artisanal breads.',
    path: '/markets/market-central',
    mapPin: {
      name: 'Central Park West',
      top: '18%',
      left: '62%',
    },
  },
];

export function Market() {
  useDocumentTitle('Explore Farmers Markets — MarketLink');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialMode = searchParams.get('view') === 'list' ? 'list' : 'map';
  const [viewMode, setViewMode] = useState(initialMode);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('New York, NY (10003)');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('All Markets (8)');
  const [selectedMarketId, setSelectedMarketId] = useState('market-unionsquare');
  const [isPopupOpen, setIsPopupOpen] = useState(true);
  const [savedMarkets, setSavedMarkets] = useState({});
  const [mapZoom, setMapZoom] = useState(1);
  const [hoveredMarketId, setHoveredMarketId] = useState(null);

  const filterTabs = [
    { label: 'All Markets (8)', filter: 'All Markets' },
    { label: 'Open Now (5)', filter: 'Open Now' },
    { label: 'Organic Only', filter: 'Organic Only' },
    { label: 'Weekend Markets', filter: 'Weekend' },
  ];

  const handleModeChange = (mode) => {
    setViewMode(mode);
    setSearchParams({ view: mode });
  };

  const toggleSave = (id, e) => {
    if (e) e.stopPropagation();
    setSavedMarkets((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSelectMarket = (m) => {
    setSelectedMarketId(m.id);
    setIsPopupOpen(true);
  };

  const filteredMarkets = useMemo(() => {
    return MARKETS_DATA.filter((m) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = m.name.toLowerCase().includes(q);
        const matchesLoc = m.location.toLowerCase().includes(q);
        const matchesDesc = m.description.toLowerCase().includes(q);
        if (!matchesName && !matchesLoc && !matchesDesc) return false;
      }

      const currentTab = filterTabs.find((t) => t.label === selectedFilterCategory);
      if (currentTab && currentTab.filter !== 'All Markets') {
        if (!m.categories.includes(currentTab.filter)) return false;
      }

      return true;
    });
  }, [searchQuery, selectedFilterCategory]);

  const activeMarket =
    MARKETS_DATA.find((m) => m.id === selectedMarketId) || MARKETS_DATA[0];

  return (
    <div className={styles.pageContainer}>
      {/* ─── HEADER BAR ─────────────────────────────────────────── */}
      <div className={styles.headerBar}>
        <div className="container">
          <div className={styles.headerBarInner}>
            <div className={styles.headerTitleGroup}>
              <div className={styles.headerKickerRow}>
                <span className={styles.headerKicker}>
                  <Sparkles size={13} />
                  New York & Regional Directory
                </span>
                <span className={styles.countBadge}>{MARKETS_DATA.length} Verified Markets</span>
              </div>
              <h1 className={styles.pageTitle}>Explore Farmers Markets</h1>
              <p className={styles.pageSubtitle}>
                Find fresh seasonal harvests, artisan goods, and direct-from-farm producers near you.
              </p>
            </div>

            {/* Segmented View Mode Switcher */}
            <div className={styles.viewModeWrapper}>
              <div className={styles.toggleButtonGroup}>
                <button
                  type="button"
                  onClick={() => handleModeChange('map')}
                  className={`${styles.toggleBtn} ${
                    viewMode === 'map' ? styles.toggleBtnActive : ''
                  }`}
                  aria-pressed={viewMode === 'map'}
                >
                  <MapIcon size={14} />
                  <span>Map View</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('list')}
                  className={`${styles.toggleBtn} ${
                    viewMode === 'list' ? styles.toggleBtnActive : ''
                  }`}
                  aria-pressed={viewMode === 'list'}
                >
                  <ListIcon size={14} />
                  <span>List View</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── VIEW MODE: MAP VIEW ─────────────────────────────────── */}
      {viewMode === 'map' ? (
        <div className={styles.mapViewContainer}>
          {/* ── LEFT PANEL: INTERACTIVE SEARCH & MARKETS LIST ── */}
          <aside className={styles.mapSidebar} aria-label="Market search and list">
            {/* Search Input */}
            <div className={styles.sidebarSearchWrap}>
              <Search size={15} className={styles.sidebarSearchIcon} />
              <input
                type="text"
                placeholder="Search markets, vendors, or organic goods..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.sidebarSearchInput}
                aria-label="Search markets"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className={styles.clearSearchBtn}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Location Selector Row */}
            <div className={styles.locationSelectorRow}>
              <div className={styles.locationDropdownWrap}>
                <MapPin size={14} className={styles.locationPinIcon} />
                <span className={styles.locationSelectedText}>{selectedLocation}</span>
                <ChevronDown size={13} className={styles.locationChevron} />
              </div>
              <button
                type="button"
                className={styles.filterOptionsBtn}
                title="Filters"
                aria-label="Filters"
              >
                <Sliders size={14} />
              </button>
            </div>

            {/* Category Filter Pills (Horizontal Scroll) */}
            <div className={styles.filterPillsTrack}>
              <div className={styles.filterPillsScroll} role="tablist">
                {filterTabs.map((tab) => (
                  <button
                    key={tab.label}
                    type="button"
                    onClick={() => setSelectedFilterCategory(tab.label)}
                    className={`${styles.filterPillBtn} ${
                      selectedFilterCategory === tab.label ? styles.filterPillBtnActive : ''
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Cards List */}
            <div className={styles.cardsListScroll}>
              {filteredMarkets.map((m) => {
                const isSelected = m.id === selectedMarketId;
                const isHovered = m.id === hoveredMarketId;
                return (
                  <div
                    key={m.id}
                    onClick={() => handleSelectMarket(m)}
                    onMouseEnter={() => setHoveredMarketId(m.id)}
                    onMouseLeave={() => setHoveredMarketId(null)}
                    className={`${styles.mapMarketCard} ${
                      isSelected ? styles.mapMarketCardSelected : ''
                    } ${isHovered ? styles.mapMarketCardHovered : ''}`}
                  >
                    <div className={styles.cardThumbWrap}>
                      <img src={m.image} alt={m.name} className={styles.cardThumb} />
                      <span className={styles.cardDistanceBadge}>{m.distance}</span>
                    </div>

                    <div className={styles.cardDetails}>
                      <div className={styles.cardMetaTop}>
                        <span
                          className={
                            m.statusType === 'open'
                              ? styles.badgeOpenNow
                              : styles.badgeOpenTomorrow
                          }
                        >
                          <span className={styles.badgeDot} />
                          {m.status}
                        </span>
                        <div className={styles.cardRatingInline}>
                          <Star size={11} fill="#D4850A" color="#D4850A" />
                          <span>{m.rating}</span>
                        </div>
                      </div>

                      <h3 className={styles.cardTitle}>{m.name}</h3>
                      <p className={styles.cardAddress}>
                        <MapPin size={11} />
                        <span>{m.location}</span>
                      </p>

                      <div className={styles.cardMetaBottom}>
                        <span className={styles.vendorsCountTag}>
                          <Store size={11} /> {m.vendors}
                        </span>
                        <span className={styles.hoursTag}>
                          <Clock size={11} /> {m.hours}
                        </span>
                      </div>

                      <div className={styles.cardActionsRow}>
                        <Link
                          to={m.path}
                          className={styles.cardViewLink}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>View Market Page</span>
                          <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredMarkets.length === 0 && (
                <div className={styles.emptyResults}>
                  <Store size={32} className={styles.emptyIcon} />
                  <h4>No markets found</h4>
                  <p>Try searching for a different neighborhood or reset your filters.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedFilterCategory('All Markets (8)');
                    }}
                    className={styles.resetFiltersBtn}
                  >
                    Reset filters
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* ── RIGHT PANEL: CARTOGRAPHIC MAP CANVAS ── */}
          <section className={styles.mapCanvasArea} aria-label="Interactive market map">
            {/* Rich Vector Cartographic Map Canvas */}
            <div
              className={styles.mapVectorBackground}
              style={{ transform: `scale(${mapZoom})` }}
            >
              <svg
                viewBox="0 0 1000 700"
                className={styles.cartoMapSvg}
                preserveAspectRatio="xMidYMid slice"
              >
                <defs>
                  {/* Subtle water gradient */}
                  <linearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#cfdfeb" />
                    <stop offset="100%" stopColor="#bdd3e3" />
                  </linearGradient>

                  {/* Park pattern */}
                  <pattern id="parkGrass" width="20" height="20" patternUnits="userSpaceOnUse">
                    <rect width="20" height="20" fill="#d8e8d2" />
                    <circle cx="10" cy="10" r="1.5" fill="#c3dbbc" opacity="0.6" />
                  </pattern>
                </defs>

                {/* Base Land Fill */}
                <rect width="1000" height="700" fill="#ede8df" />

                {/* Hudson River on left */}
                <path
                  d="M 0,0 L 290,0 C 260,160 210,320 280,500 C 315,580 370,680 430,700 L 0,700 Z"
                  fill="url(#waterGrad)"
                />

                {/* East River on right & Brooklyn coastline */}
                <path
                  d="M 850,700 C 820,530 870,360 1000,220 L 1000,700 Z"
                  fill="url(#waterGrad)"
                />

                {/* Waterway Labels */}
                <text x="110" y="320" fill="#8baec7" fontSize="13" fontWeight="600" letterSpacing="3" transform="rotate(-70, 110, 320)">
                  HUDSON RIVER
                </text>
                <text x="910" y="480" fill="#8baec7" fontSize="13" fontWeight="600" letterSpacing="3" transform="rotate(65, 910, 480)">
                  EAST RIVER
                </text>

                {/* Major Arterial Roads / Grid Lines */}
                <g stroke="#ded4c8" strokeWidth="2.5" fill="none">
                  {/* Broadway diagonal curve */}
                  <path d="M 590,0 C 570,180 640,360 520,700" stroke="#d0c2b2" strokeWidth="4" />
                  {/* 14th Street */}
                  <path d="M 230,340 L 920,340" stroke="#d0c2b2" strokeWidth="3.5" />
                  {/* 23rd Street */}
                  <path d="M 210,210 L 890,210" stroke="#d7cbbd" strokeWidth="3" />
                  {/* Houston Street */}
                  <path d="M 290,520 L 950,520" stroke="#d7cbbd" strokeWidth="3" />
                  {/* Canal Street */}
                  <path d="M 330,620 L 980,620" stroke="#d7cbbd" strokeWidth="3" />

                  {/* Avenues (Vertical lines) */}
                  <path d="M 440,80 L 410,660" />
                  <path d="M 510,50 L 480,680" />
                  <path d="M 600,0 L 580,700" />
                  <path d="M 680,0 L 670,700" strokeWidth="3" />
                  <path d="M 750,0 L 760,700" />
                  <path d="M 820,0 L 830,700" />
                  <path d="M 880,40 L 900,600" />

                  {/* Minor Grid Streets */}
                  <path d="M 240,120 L 860,120" strokeWidth="1.5" />
                  <path d="M 220,160 L 880,160" strokeWidth="1.5" />
                  <path d="M 210,260 L 900,260" strokeWidth="1.5" />
                  <path d="M 220,300 L 910,300" strokeWidth="1.5" />
                  <path d="M 250,380 L 930,380" strokeWidth="1.5" />
                  <path d="M 260,420 L 930,420" strokeWidth="1.5" />
                  <path d="M 270,470 L 940,470" strokeWidth="1.5" />
                  <path d="M 310,570 L 960,570" strokeWidth="1.5" />
                </g>

                {/* Parks in soft green pattern */}
                {/* Central Park lower edge */}
                <rect x="580" y="0" width="120" height="90" rx="4" fill="url(#parkGrass)" stroke="#b5d1ad" />
                {/* Union Square Park */}
                <rect x="665" y="325" width="40" height="40" rx="5" fill="url(#parkGrass)" stroke="#b5d1ad" />
                {/* Abingdon Square */}
                <polygon points="505,475 535,468 528,496 500,490" fill="url(#parkGrass)" stroke="#b5d1ad" />
                {/* Madison Square Park */}
                <rect x="650" y="200" width="36" height="46" rx="4" fill="url(#parkGrass)" stroke="#b5d1ad" />
                {/* Washington Square Park */}
                <rect x="585" y="475" width="46" height="34" rx="4" fill="url(#parkGrass)" stroke="#b5d1ad" />
                {/* Tompkins Square Park */}
                <rect x="785" y="490" width="50" height="44" rx="4" fill="url(#parkGrass)" stroke="#b5d1ad" />
                {/* Prospect Park (Brooklyn) */}
                <ellipse cx="780" cy="650" rx="85" ry="55" fill="url(#parkGrass)" stroke="#b5d1ad" />

                {/* Neighborhood & Park Typography */}
                <text x="685" y="348" fill="#587850" fontSize="9" fontWeight="700" textAnchor="middle">Union Sq</text>
                <text x="518" y="484" fill="#587850" fontSize="8" fontWeight="700" textAnchor="middle">Abingdon Sq</text>
                <text x="810" y="515" fill="#587850" fontSize="8" fontWeight="700" textAnchor="middle">Tompkins Sq</text>
                <text x="780" y="655" fill="#587850" fontSize="10" fontWeight="700" textAnchor="middle">Prospect Park</text>

                <text x="490" y="270" fill="#a49788" fontSize="11" fontWeight="600" letterSpacing="1">CHELSEA</text>
                <text x="440" y="440" fill="#a49788" fontSize="11" fontWeight="600" letterSpacing="1">WEST VILLAGE</text>
                <text x="720" y="440" fill="#a49788" fontSize="11" fontWeight="600" letterSpacing="1">EAST VILLAGE</text>
                <text x="820" y="615" fill="#a49788" fontSize="11" fontWeight="600" letterSpacing="1">BROOKLYN</text>

                {/* User Simulated Location Pin (10003) */}
                <g transform="translate(640, 370)">
                  <circle cx="0" cy="0" r="14" fill="#3b82f6" opacity="0.15" />
                  <circle cx="0" cy="0" r="8" fill="#ffffff" />
                  <circle cx="0" cy="0" r="5" fill="#2563eb" />
                </g>
              </svg>

              {/* ─── INTERACTIVE MAP PINS WITH POINTERS ─────────── */}
              {MARKETS_DATA.map((m) => {
                const isSelected = m.id === selectedMarketId;
                const isHovered = m.id === hoveredMarketId;
                return (
                  <div
                    key={m.id}
                    onClick={() => handleSelectMarket(m)}
                    className={`${styles.mapPinContainer} ${
                      isSelected ? styles.mapPinActive : styles.mapPinInactive
                    } ${isHovered ? styles.mapPinHovered : ''}`}
                    style={{
                      top: m.mapPin.top,
                      left: m.mapPin.left,
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Market: ${m.name}`}
                  >
                    <div className={styles.mapPinPill}>
                      <span className={styles.pinStatusDot} />
                      <span className={styles.pinNameText}>{m.mapPin.name}</span>
                      <span className={styles.pinVendorPill}>{m.vendors.split(' ')[0]}</span>
                    </div>
                    <div className={styles.pinBeak} />
                  </div>
                );
              })}
            </div>

            {/* ─── MAP CONTROLS (TOP RIGHT) ────────────────────── */}
            <div className={styles.mapControlsWrap}>
              <button
                type="button"
                onClick={() => setMapZoom((z) => Math.min(z + 0.15, 1.6))}
                className={styles.mapControlBtn}
                title="Zoom in"
                aria-label="Zoom in"
              >
                <Plus size={15} />
              </button>
              <button
                type="button"
                onClick={() => setMapZoom((z) => Math.max(z - 0.15, 0.85))}
                className={styles.mapControlBtn}
                title="Zoom out"
                aria-label="Zoom out"
              >
                <Minus size={15} />
              </button>
              <button
                type="button"
                onClick={() => setMapZoom(1)}
                className={styles.mapControlBtn}
                title="Reset view to New York"
                aria-label="Reset location"
              >
                <Crosshair size={15} />
              </button>
            </div>

            {/* ─── FLOATING DETAIL CARD (BOTTOM RIGHT) ─────────── */}
            {isPopupOpen && activeMarket && (
              <div className={styles.floatingMarketCard}>
                {/* Photo Header */}
                <div className={styles.floatingImgWrap}>
                  <img
                    src={activeMarket.image}
                    alt={activeMarket.name}
                    className={styles.floatingCoverImg}
                  />
                  <div className={styles.floatingImgOverlay}>
                    <span className={styles.floatingStatusBadge}>
                      <span className={styles.floatingStatusDot} />
                      {activeMarket.statusDetail}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsPopupOpen(false)}
                      className={styles.floatingCloseBtn}
                      aria-label="Close preview"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                <div className={styles.floatingCardBody}>
                  {/* Title & Rating */}
                  <div className={styles.floatingTitleRow}>
                    <h2 className={styles.floatingTitle}>{activeMarket.name}</h2>
                    <div className={styles.floatingRating}>
                      <Star size={13} fill="#D4850A" color="#D4850A" />
                      <strong>{activeMarket.rating}</strong>
                    </div>
                  </div>

                  <p className={styles.floatingLocation}>
                    <MapPin size={12} className={styles.floatingPinIcon} />
                    <span>{activeMarket.location}</span>
                  </p>

                  <p className={styles.floatingDesc}>{activeMarket.description}</p>

                  {/* Two Stats Tiles */}
                  <div className={styles.floatingStatsGrid}>
                    <div className={styles.floatingStatBox}>
                      <span className={styles.floatingStatLabel}>Today's Vendors</span>
                      <strong className={styles.floatingStatValue}>
                        {activeMarket.vendors}
                      </strong>
                    </div>
                    <div className={styles.floatingStatBox}>
                      <span className={styles.floatingStatLabel}>Distance</span>
                      <strong className={styles.floatingStatValue}>
                        {activeMarket.distanceMiles}
                      </strong>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className={styles.floatingActionsRow}>
                    <Link to={activeMarket.path} className={styles.viewFullMarketBtn}>
                      <span>View Full Market Page</span>
                      <ArrowRight size={14} />
                    </Link>

                    <button
                      type="button"
                      onClick={(e) => toggleSave(activeMarket.id, e)}
                      className={`${styles.floatingBookmarkBtn} ${
                        savedMarkets[activeMarket.id] ? styles.floatingBookmarkActive : ''
                      }`}
                      title={
                        savedMarkets[activeMarket.id]
                          ? 'Remove from saved'
                          : 'Save market'
                      }
                      aria-label="Save market"
                    >
                      <Bookmark
                        size={16}
                        fill={savedMarkets[activeMarket.id] ? '#541722' : 'none'}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      ) : (
        /* ─── VIEW MODE: GRID / LIST VIEW ─────────────────────────── */
        <div className="container" style={{ paddingBlock: '28px 60px' }}>
          {/* Filter Bar */}
          <div className={styles.listFilterBar}>
            <div className={styles.listSearchInputWrap}>
              <Search size={15} className={styles.sidebarSearchIcon} />
              <input
                type="text"
                placeholder="Search by market name, address, or neighborhood..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.listSearchInput}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className={styles.clearSearchBtn}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className={styles.listPillsRow}>
              {filterTabs.map((tab) => (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => setSelectedFilterCategory(tab.label)}
                  className={`${styles.filterPillBtn} ${
                    selectedFilterCategory === tab.label ? styles.filterPillBtnActive : ''
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of All Markets */}
          <div className={styles.marketsGrid}>
            {filteredMarkets.map((m) => {
              const isSaved = savedMarkets[m.id];
              return (
                <article key={m.id} className={styles.marketGridCard}>
                  <div className={styles.cardImageContainer}>
                    <img src={m.image} alt={m.name} className={styles.gridCardImg} />
                    <span
                      className={
                        m.statusType === 'open'
                          ? styles.gridStatusOpen
                          : styles.gridStatusTomorrow
                      }
                    >
                      <span className={styles.badgeDot} />
                      {m.status}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => toggleSave(m.id, e)}
                      className={`${styles.gridSaveBtn} ${isSaved ? styles.gridSaveBtnActive : ''}`}
                      aria-label="Save market"
                    >
                      <Bookmark size={15} fill={isSaved ? '#541722' : 'none'} />
                    </button>
                  </div>

                  <div className={styles.gridCardBody}>
                    <div className={styles.gridCardTopRow}>
                      <span className={styles.gridDistance}>
                        <MapPin size={12} /> {m.distance}
                      </span>
                      <div className={styles.gridRating}>
                        <Star size={12} fill="#D4850A" color="#D4850A" />
                        <strong>{m.rating}</strong>
                        <span>({m.reviewCount})</span>
                      </div>
                    </div>

                    <h2 className={styles.gridTitle}>
                      <Link to={m.path} className={styles.gridTitleLink}>
                        {m.name}
                      </Link>
                    </h2>
                    <p className={styles.gridAddress}>{m.location}</p>
                    <p className={styles.gridDescription}>{m.description}</p>

                    <div className={styles.gridMetaTags}>
                      <span className={styles.gridMetaTag}>
                        <Store size={12} /> {m.vendors}
                      </span>
                      <span className={styles.gridMetaTag}>
                        <Clock size={12} /> {m.hours}
                      </span>
                      <span className={styles.gridMetaTag}>
                        <Calendar size={12} /> {m.day}
                      </span>
                    </div>

                    <div className={styles.gridCardFooter}>
                      <Link to={m.path} className={styles.gridCardViewBtn}>
                        <span>View Market & Pre-Order</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default Market;
