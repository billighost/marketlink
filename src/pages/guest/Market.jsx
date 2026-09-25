import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  ChevronDown,
  Plus,
  Minus,
  Crosshair,
  ArrowRight,
  Star,
  Sparkles,
  ShieldCheck,
  Compass,
  SlidersHorizontal,
} from 'lucide-react';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import styles from './Market.module.css';

/* ─── COMPREHENSIVE REGIONAL MARKETS DIRECTORY ─────────────────────────── */
export const MARKETS_DATA = [
  {
    id: 'market-unionsquare',
    name: 'Union Square Greenmarket',
    image: '/images/market-unionsquare.jpg',
    status: 'Open Today',
    statusType: 'open',
    statusDetail: 'Open Today • Closes at 6:00 PM',
    distance: '0.4 mi away',
    distanceMiles: '0.4 miles away',
    neighborhood: 'Union Square',
    location: 'North & West sides of Union Square Park',
    fullAddress: 'North & West Plaza, Union Square Park, New York, NY 10003',
    nextMarket: 'Today, until 6:00 PM',
    hours: '8:00 AM – 6:00 PM',
    vendors: '32 Growers',
    vendorsCount: 32,
    rating: 4.9,
    reviewCount: 210,
    day: 'Mon, Wed, Fri, Sat',
    categories: ['All Markets', 'Organic Only', 'Open Today', 'Weekend'],
    specialties: ['Hudson Valley Apples', 'Raw Honey', 'Heritage Greens', 'Farm Cheeses'],
    description:
      'The flagship New York market. Over 40 regional family farms offering orchard fruits, heritage vegetables, artisanal cheeses, and fresh bakery goods.',
    path: '/markets/market-unionsquare',
    mapPin: {
      name: 'Union Square',
      top: '53.5%',
      left: '62.9%',
      badge: '32',
      x: 629,
      y: 375,
    },
  },
  {
    id: 'market-greenwich',
    name: 'Greenwich Village Market',
    image: '/images/market-greenwich.jpg',
    status: 'Open Today',
    statusType: 'open',
    statusDetail: 'Open Today • Closes at 2:00 PM',
    distance: '1.2 mi away',
    distanceMiles: '1.2 miles away',
    neighborhood: 'West Village',
    location: 'Abingdon Square, 8th Ave & 12th St',
    fullAddress: 'Abingdon Square Park, 8th Ave & 12th St, New York, NY 10014',
    nextMarket: 'Today, until 2:00 PM',
    hours: '8:00 AM – 2:00 PM',
    vendors: '24 Growers',
    vendorsCount: 24,
    rating: 4.9,
    reviewCount: 94,
    day: 'Saturday & Wednesday',
    categories: ['All Markets', 'Organic Only', 'Open Today', 'Weekend'],
    specialties: ['Artisan Sourdough', 'Pasture Eggs', 'Wild Berries', 'Cultured Butter'],
    description:
      'Historic Abingdon Square setting featuring 24 Hudson Valley family farms bringing heirloom produce, sourdough, and pasture-raised meats.',
    path: '/markets/market-greenwich',
    mapPin: {
      name: 'Greenwich Village',
      top: '65%',
      left: '47%',
      badge: '24',
      x: 470,
      y: 455,
    },
  },
  {
    id: 'market-chelsea',
    name: 'Chelsea Farmers Market',
    image: '/images/market-chelsea.jpg',
    status: 'Opens Tomorrow',
    statusType: 'tomorrow',
    statusDetail: 'Opens Tomorrow at 9:00 AM',
    distance: '1.8 mi away',
    distanceMiles: '1.8 miles away',
    neighborhood: 'Chelsea',
    location: 'W 23rd St & 9th Ave',
    fullAddress: 'W 23rd St & 9th Ave, New York, NY 10011',
    nextMarket: 'Sat, 9:00 AM',
    hours: '9:00 AM – 3:30 PM',
    vendors: '18 Growers',
    vendorsCount: 18,
    rating: 4.8,
    reviewCount: 68,
    day: 'Saturday',
    categories: ['All Markets', 'Weekend'],
    specialties: ['Artisan Hard Ciders', 'Seasonal Peaches', 'Wild Caught Fish', 'Microgreens'],
    description:
      'A lively neighborhood gathering on 23rd Street offering seasonal orchard fruits, pasture-raised poultry, and fresh artisanal ciders.',
    path: '/markets/market-chelsea',
    mapPin: {
      name: 'Chelsea',
      top: '40%',
      left: '49%',
      badge: '18',
      x: 490,
      y: 280,
    },
  },
  {
    id: 'market-tompkins',
    name: 'Tompkins Square Greenmarket',
    image: '/images/market-tompkins.jpg',
    status: 'Open Today',
    statusType: 'open',
    statusDetail: 'Open Today • Closes at 5:00 PM',
    distance: '2.3 mi away',
    distanceMiles: '2.3 miles away',
    neighborhood: 'East Village',
    location: 'Avenue A & E 7th St',
    fullAddress: 'Avenue A & E 7th St, East Village, New York, NY 10009',
    nextMarket: 'Today, until 5:00 PM',
    hours: '8:00 AM – 5:00 PM',
    vendors: '15 Growers',
    vendorsCount: 15,
    rating: 4.7,
    reviewCount: 52,
    day: 'Sunday & Thursday',
    categories: ['All Markets', 'Organic Only', 'Open Today', 'Weekend'],
    specialties: ['Certified Organic Herbs', 'Wild Mushrooms', 'Cold-pressed Oils', 'Ferments'],
    description:
      'East Village community staple with an exceptional selection of certified organic greens, raw local honey, and orchard apples.',
    path: '/markets/market-tompkins',
    mapPin: {
      name: 'Tompkins Square',
      top: '65.7%',
      left: '73.8%',
      badge: '15',
      x: 738,
      y: 460,
    },
  },
  {
    id: 'market-brooklyn',
    name: 'Brooklyn Grand Army Plaza',
    image: '/images/market-brooklyn.jpg',
    status: 'Opens Tomorrow',
    statusType: 'tomorrow',
    statusDetail: 'Opens Tomorrow at 8:00 AM',
    distance: '3.2 mi away',
    distanceMiles: '3.2 miles away',
    neighborhood: 'Brooklyn',
    location: 'Prospect Park West & Flatbush Ave, BK',
    fullAddress: 'Prospect Park West & Flatbush Ave, Brooklyn, NY 11238',
    nextMarket: 'Sat, 8:00 AM',
    hours: '8:00 AM – 3:00 PM',
    vendors: '38 Growers',
    vendorsCount: 38,
    rating: 4.9,
    reviewCount: 145,
    day: 'Saturday',
    categories: ['All Markets', 'Weekend', 'Organic Only'],
    specialties: ['Orchard Pears', 'Smoked Trout', 'Artisan Charcuterie', 'Gluten-free Bakes'],
    description:
      'The flagship Brooklyn market at the northwest entrance of Prospect Park with dozens of farm stands and artisanal makers.',
    path: '/markets/market-brooklyn',
    mapPin: {
      name: 'Grand Army Plaza',
      top: '87.1%',
      left: '80%',
      badge: '38',
      x: 800,
      y: 610,
    },
  },
  {
    id: 'market-stuyvesant',
    name: 'Stuyvesant Town Market',
    image: '/images/market-stuyvesant.jpg',
    status: 'Open Today',
    statusType: 'open',
    statusDetail: 'Open Today • Closes at 4:00 PM',
    distance: '2.8 mi away',
    distanceMiles: '2.8 miles away',
    neighborhood: 'East Village',
    location: 'Oval & 14th St Loop, NY',
    fullAddress: 'The Oval at 14th St Loop, New York, NY 10009',
    nextMarket: 'Today, until 4:00 PM',
    hours: '9:30 AM – 4:00 PM',
    vendors: '12 Growers',
    vendorsCount: 12,
    rating: 4.7,
    reviewCount: 38,
    day: 'Sunday',
    categories: ['All Markets', 'Open Today', 'Weekend'],
    specialties: ['Fresh Field Berries', 'Handmade Ravioli', 'Root Vegetables', 'Organic Flowers'],
    description:
      'Convenient residential market tucked around the park oval, featuring farm-fresh berries, artisanal baked goods, and wild fish.',
    path: '/markets/market-stuyvesant',
    mapPin: {
      name: 'Stuyvesant Town',
      top: '54.2%',
      left: '77%',
      badge: '12',
      x: 770,
      y: 380,
    },
  },
  {
    id: 'market-riverside',
    name: 'Riverside Park Greenmarket',
    image: '/images/market-riverside.jpg',
    status: 'Opens Tomorrow',
    statusType: 'tomorrow',
    statusDetail: 'Opens Tomorrow at 8:30 AM',
    distance: '3.6 mi away',
    distanceMiles: '3.6 miles away',
    neighborhood: 'Upper West Side',
    location: 'Riverside Dr & W 97th St',
    fullAddress: 'Riverside Dr & W 97th St, New York, NY 10025',
    nextMarket: 'Sat, 8:30 AM',
    hours: '8:30 AM – 2:30 PM',
    vendors: '14 Growers',
    vendorsCount: 14,
    rating: 4.8,
    reviewCount: 44,
    day: 'Saturday',
    categories: ['All Markets', 'Weekend'],
    specialties: ['Stone Fruits', 'Free-range Poultry', 'Squash & Gourds', 'Local Maple Syrup'],
    description:
      'Perched along the scenic Hudson River on the Upper West Side, offering regional stone fruits, grass-fed meats, and root vegetables.',
    path: '/markets/market-riverside',
    mapPin: {
      name: 'Riverside Park',
      top: '18.5%',
      left: '34.5%',
      badge: '14',
      x: 345,
      y: 130,
    },
  },
  {
    id: 'market-central',
    name: 'Central Park West Market',
    image: '/images/market-central.jpg',
    status: 'Open Today',
    statusType: 'open',
    statusDetail: 'Open Today • Closes at 3:00 PM',
    distance: '2.9 mi away',
    distanceMiles: '2.9 miles away',
    neighborhood: 'Upper West Side',
    location: 'Columbus Ave & 77th St',
    fullAddress: 'Columbus Ave between 77th & 81st St, New York, NY 10024',
    nextMarket: 'Today, until 3:00 PM',
    hours: '9:00 AM – 3:00 PM',
    vendors: '20 Growers',
    vendorsCount: 20,
    rating: 4.8,
    reviewCount: 86,
    day: 'Sunday',
    categories: ['All Markets', 'Open Today', 'Organic Only', 'Weekend'],
    specialties: ['Artisan Cheddars', 'Heirloom Tomatoes', 'Cider Donuts', 'Organic Shiitake'],
    description:
      'Historic outdoor market behind the Museum of Natural History with pasture cheeses, organic mushrooms, and artisanal breads.',
    path: '/markets/market-central',
    mapPin: {
      name: 'Central Park West',
      top: '20%',
      left: '53.5%',
      badge: '20',
      x: 535,
      y: 140,
    },
  },
];

export function Market() {
  useDocumentTitle('Explore Farmers Markets — MarketLink');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Mode: list vs map
  const initialMode = searchParams.get('view') === 'list' ? 'list' : 'map';
  const [viewMode, setViewMode] = useState(initialMode);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('All Neighborhoods');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('All Markets');
  const [sortBy, setSortBy] = useState('distance'); // 'distance' | 'rating' | 'vendors' | 'name'

  // Card on top of map should NOT be there on first load (user requirement)
  const [selectedMarketId, setSelectedMarketId] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // Persistent bookmarks from localStorage
  const [savedMarkets, setSavedMarkets] = useState(() => {
    try {
      const saved = localStorage.getItem('marketlink_saved_markets');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [mapZoom, setMapZoom] = useState(0.98);
  const [hoveredMarketId, setHoveredMarketId] = useState(null);

  // Panning & dragging state for map canvas
  const [panOffset, setPanOffset] = useState({ x: 0, y: -25 });
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);
  const mapCanvasRef = useRef(null);

  // Refs for auto-scrolling sidebar cards
  const cardRefs = useRef({});

  // Dynamic counts for quick filter tabs
  const savedCount = useMemo(
    () => Object.values(savedMarkets).filter(Boolean).length,
    [savedMarkets]
  );
  const openTodayCount = useMemo(
    () => MARKETS_DATA.filter((m) => m.statusType === 'open').length,
    []
  );

  const filterTabs = [
    { label: 'All Markets', filter: 'All Markets' },
    { label: 'Open Today', filter: 'Open Today', hasDot: true },
    { label: `Saved (${savedCount})`, filter: 'Saved' },
    { label: 'Certified Organic', filter: 'Organic Only' },
    { label: 'Weekend Markets', filter: 'Weekend' },
  ];

  const handleModeChange = (mode) => {
    setViewMode(mode);
    setSearchParams({ view: mode });
  };

  const toggleSave = (id, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setSavedMarkets((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem('marketlink_saved_markets', JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
  };

  // Center the map smoothly onto a market pin (accounting for floating preview offset)
  const panToMarket = (market, customZoom) => {
    if (!market || !mapCanvasRef.current) return;
    const rect = mapCanvasRef.current.getBoundingClientRect();
    const zoom = customZoom || Math.max(mapZoom, 1.15);

    // dx, dy from center of 1000x700 map board
    const dx = (market.mapPin.x - 500) * zoom;
    const dy = (market.mapPin.y - 350) * zoom;

    // Center pin at 44% width and 38% height so bottom-right floating card doesn't cover it
    const targetX = rect.width * 0.44;
    const targetY = rect.height * 0.38;

    const targetPanX = Math.round(targetX - rect.width / 2 - dx);
    const targetPanY = Math.round(targetY - rect.height / 2 - dy);

    setMapZoom(zoom);
    setPanOffset({ x: targetPanX, y: targetPanY });
  };

  const handleSelectMarket = (m, source = 'card') => {
    if (!m) return;
    setSelectedMarketId(m.id);
    setIsPopupOpen(true);

    panToMarket(m);

    // If selected from map or locate button, scroll sidebar to that card smoothly
    if (source === 'pin' || source === 'locate') {
      if (cardRefs.current[m.id]) {
        cardRefs.current[m.id].scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  };

  const handleRecenter = () => {
    setMapZoom(0.98);
    setPanOffset({ x: 0, y: -25 });
    setIsPopupOpen(false);
    setSelectedMarketId(null);
  };

  const handleLocateUser = () => {
    // 10003 is at Union Square (629, 375)
    const unionSq = MARKETS_DATA.find((m) => m.id === 'market-unionsquare');
    if (unionSq) {
      handleSelectMarket(unionSq, 'locate');
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedNeighborhood('All Neighborhoods');
    setSelectedFilterCategory('All Markets');
    setSortBy('distance');
  };

  // Window-level mouse listeners for non-sticking, smooth panning
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    // Don't drag if clicking buttons, links, or popup
    if (
      e.target.closest('button') ||
      e.target.closest('a') ||
      e.target.closest(`.${styles.floatingPreviewCard}`) ||
      e.target.closest(`.${styles.mapPinAnchor}`)
    ) {
      return;
    }
    isDraggingRef.current = true;
    setIsDragging(true);
    hasMovedRef.current = false;
    dragStartRef.current = {
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      hasMovedRef.current = true;
      setPanOffset({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Non-passive wheel listener for smooth zooming
  useEffect(() => {
    const el = mapCanvasRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const zoomDelta = e.deltaY < 0 ? 0.12 : -0.12;
      setMapZoom((prev) => {
        const next = Math.min(Math.max(prev + zoomDelta, 0.75), 2.2);
        return Math.round(next * 100) / 100;
      });
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Filtered and sorted markets list
  const filteredMarkets = useMemo(() => {
    let list = MARKETS_DATA.filter((m) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = m.name.toLowerCase().includes(q);
        const matchesLoc = m.location.toLowerCase().includes(q);
        const matchesDesc = m.description.toLowerCase().includes(q);
        const matchesHood = m.neighborhood.toLowerCase().includes(q);
        const matchesSpec = m.specialties?.some((s) => s.toLowerCase().includes(q));
        if (!matchesName && !matchesLoc && !matchesDesc && !matchesHood && !matchesSpec) return false;
      }

      // Neighborhood dropdown
      if (selectedNeighborhood !== 'All Neighborhoods') {
        if (m.neighborhood !== selectedNeighborhood) return false;
      }

      // Filter tabs
      if (selectedFilterCategory === 'Saved') {
        if (!savedMarkets[m.id]) return false;
      } else if (selectedFilterCategory !== 'All Markets') {
        if (!m.categories.includes(selectedFilterCategory)) return false;
      }

      return true;
    });

    // Sorting
    list = [...list].sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'vendors') return b.vendorsCount - a.vendorsCount;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      // Default: distance
      return parseFloat(a.distance) - parseFloat(b.distance);
    });

    return list;
  }, [searchQuery, selectedNeighborhood, selectedFilterCategory, sortBy, savedMarkets]);

  // Active market for popup preview (only if selectedMarketId is truthy)
  const activeMarket = selectedMarketId
    ? MARKETS_DATA.find((m) => m.id === selectedMarketId)
    : null;

  return (
    <div className={styles.pageWrapper}>
      {/* ─── HEADER / FILTER CONTROL AREA (STRICTLY SCOPED TO CONTAINER) ── */}
      <section className={styles.headerSection} aria-label="Markets directory controls">
        <div className="container">
          <div className={styles.headerInner}>
            {/* Top row: Title, Subtitle, and View Mode Switcher */}
            <div className={styles.headerTopRow}>
              <div className={styles.headerTitleCol}>
                <div className={styles.kickerRow}>
                  <span className={styles.kickerBadge}>
                    <Sparkles size={13} />
                    FARM-TO-TABLE DIRECTORY
                  </span>
                  <span className={styles.verifiedBadge}>
                    <ShieldCheck size={12} />
                    8 Verified Community Markets
                  </span>
                </div>
                <h1 className={styles.pageHeading}>Explore Farmers Markets</h1>
                <p className={styles.pageSubtitle}>
                  Find seasonal open-air markets, certified organic growers, and fresh local harvests across New York and Hudson Valley.
                </p>
              </div>

              {/* Segmented View Mode Switcher */}
              <div className={styles.viewSwitchWrap}>
                <div className={styles.segmentedControl} role="tablist" aria-label="View mode">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={viewMode === 'map'}
                    onClick={() => handleModeChange('map')}
                    className={`${styles.segmentBtn} ${
                      viewMode === 'map' ? styles.segmentBtnActive : ''
                    }`}
                  >
                    <MapIcon size={14} />
                    <span>Map View</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={viewMode === 'list'}
                    onClick={() => handleModeChange('list')}
                    className={`${styles.segmentBtn} ${
                      viewMode === 'list' ? styles.segmentBtnActive : ''
                    }`}
                  >
                    <ListIcon size={14} />
                    <span>List View</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom row: Filter Toolbar */}
            <div className={styles.filterToolbar}>
              {/* Search Box */}
              <div className={styles.searchBoxWrap}>
                <Search size={15} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search by market name, crops, or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                  aria-label="Search markets"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className={styles.clearSearchBtn}
                    aria-label="Clear search"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Neighborhood Selector Dropdown */}
              <div className={styles.dropdownWrap}>
                <MapPin size={14} className={styles.dropdownPinIcon} />
                <select
                  value={selectedNeighborhood}
                  onChange={(e) => setSelectedNeighborhood(e.target.value)}
                  className={styles.dropdownSelect}
                  aria-label="Filter by neighborhood"
                >
                  <option value="All Neighborhoods">All Neighborhoods (NYC)</option>
                  <option value="Union Square">Union Square</option>
                  <option value="West Village">West Village</option>
                  <option value="Chelsea">Chelsea</option>
                  <option value="East Village">East Village</option>
                  <option value="Upper West Side">Upper West Side</option>
                  <option value="Brooklyn">Brooklyn</option>
                </select>
                <ChevronDown size={14} className={styles.dropdownChevron} />
              </div>

              {/* Filter Pills Track */}
              <div className={styles.filterChipsScroll}>
                {filterTabs.map((tab) => (
                  <button
                    key={tab.label}
                    type="button"
                    onClick={() => setSelectedFilterCategory(tab.filter)}
                    className={`${styles.filterChip} ${
                      selectedFilterCategory === tab.filter ? styles.filterChipActive : ''
                    }`}
                  >
                    {tab.hasDot && <span className={styles.filterChipDot} />}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── MAIN CONTENT CONTAINER (MATCHING TOPBAR SCOPE) ────────────── */}
      <main className="container" id="main">
        <div className={styles.discoveryWrapper}>
          {viewMode === 'map' ? (
            /* ── VIEW MODE: MAP VIEW (FRAMED SIDEBAR + CARTOGRAPHY) ── */
            <div className={styles.mapViewCard}>
              {/* ── LEFT SIDEBAR: SCROLLABLE MARKET CARDS ── */}
              <aside className={styles.sidebarFrame} aria-label="Farmers markets list">
                <div className={styles.sidebarHeaderStrip}>
                  <div className={styles.sidebarTopRow}>
                    <div className={styles.sidebarTitleCol}>
                      <span className={styles.sidebarResultsCount}>
                        {filteredMarkets.length} {filteredMarkets.length === 1 ? 'Market' : 'Markets'} Available
                      </span>
                      <span className={styles.sidebarLocationNote}>· NYC Regional</span>
                    </div>
                    {(searchQuery ||
                      selectedNeighborhood !== 'All Neighborhoods' ||
                      selectedFilterCategory !== 'All Markets' ||
                      sortBy !== 'distance') && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className={styles.resetFiltersLink}
                      >
                        Reset all
                      </button>
                    )}
                  </div>

                  <div className={styles.sidebarControlsRow}>
                    {/* Sort Dropdown */}
                    <div className={styles.sidebarSortWrap}>
                      <SlidersHorizontal size={12} className={styles.sidebarSortIcon} />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className={styles.sidebarSortSelect}
                        aria-label="Sort markets by"
                      >
                        <option value="distance">Nearest First</option>
                        <option value="rating">Top Rated</option>
                        <option value="vendors">Most Growers</option>
                        <option value="name">Name (A–Z)</option>
                      </select>
                      <ChevronDown size={11} className={styles.sidebarSortChevron} />
                    </div>

                    {/* Quick Filter Tabs */}
                    <div
                      className={styles.sidebarQuickTabs}
                      onWheel={(e) => {
                        if (e.deltaY !== 0) {
                          e.currentTarget.scrollLeft += e.deltaY;
                        }
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedFilterCategory('All Markets')}
                        className={`${styles.sidebarQuickTab} ${
                          selectedFilterCategory === 'All Markets' ? styles.sidebarQuickTabActive : ''
                        }`}
                      >
                        All ({MARKETS_DATA.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedFilterCategory('Open Today')}
                        className={`${styles.sidebarQuickTab} ${
                          selectedFilterCategory === 'Open Today' ? styles.sidebarQuickTabActive : ''
                        }`}
                      >
                        <span className={styles.pulseDot} />
                        Open ({openTodayCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedFilterCategory('Saved')}
                        className={`${styles.sidebarQuickTab} ${
                          selectedFilterCategory === 'Saved' ? styles.sidebarQuickTabActive : ''
                        }`}
                      >
                        <Bookmark
                          size={10}
                          fill={selectedFilterCategory === 'Saved' ? '#ffffff' : '#7A2E3B'}
                        />
                        Saved ({savedCount})
                      </button>
                    </div>
                  </div>
                </div>

                {/* SCROLLABLE CARDS CONTAINER */}
                <div className={styles.cardsScrollArea}>
                  {filteredMarkets.map((m) => {
                    const isSelected = m.id === selectedMarketId;
                    const isHovered = m.id === hoveredMarketId;
                    const isSaved = savedMarkets[m.id];

                    return (
                      <article
                        key={m.id}
                        ref={(el) => (cardRefs.current[m.id] = el)}
                        onClick={() => handleSelectMarket(m, 'card')}
                        onMouseEnter={() => setHoveredMarketId(m.id)}
                        onMouseLeave={() => setHoveredMarketId(null)}
                        className={`${styles.marketCard} ${
                          isSelected ? styles.marketCardActive : ''
                        } ${isHovered ? styles.marketCardHovered : ''}`}
                        tabIndex={0}
                        aria-selected={isSelected}
                      >
                        <div className={styles.cardTopRow}>
                          <div className={styles.cardThumbWrap}>
                            <img src={m.image} alt={m.name} className={styles.cardThumb} />
                            <span className={styles.distanceChip}>{m.distance}</span>
                          </div>

                          <div className={styles.cardContentCol}>
                            <div className={styles.cardBadgesRow}>
                              <span
                                className={
                                  m.statusType === 'open'
                                    ? styles.statusTagOpen
                                    : styles.statusTagTomorrow
                                }
                              >
                                <span
                                  className={
                                    m.statusType === 'open'
                                      ? styles.pulseDot
                                      : styles.pulseDotAmber
                                  }
                                />
                                {m.status}
                              </span>

                              <button
                                type="button"
                                onClick={(e) => toggleSave(m.id, e)}
                                className={`${styles.bookmarkBtn} ${
                                  isSaved ? styles.bookmarkBtnActive : ''
                                }`}
                                aria-label={isSaved ? 'Remove from saved' : 'Save market'}
                                title={isSaved ? 'Remove from saved' : 'Save market'}
                              >
                                <Bookmark size={13} fill={isSaved ? '#7A2E3B' : 'none'} />
                              </button>
                            </div>

                            <h2 className={styles.cardTitle}>{m.name}</h2>

                            <div className={styles.cardLocation}>
                              <MapPin size={11} />
                              <span className={styles.cardLocationText}>{m.location}</span>
                            </div>

                            <div className={styles.cardMetaRow}>
                              <span className={styles.ratingBadge}>
                                <Star size={11} fill="#D4850A" color="#D4850A" />
                                {m.rating}
                                <span className={styles.reviewCount}>({m.reviewCount})</span>
                              </span>
                              <span className={styles.metaItem}>
                                <Store size={11} /> {m.vendors}
                              </span>
                              <span className={styles.metaItem}>
                                <Clock size={11} /> {m.hours.split('–')[0]}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Specialty harvest tags */}
                        {m.specialties && (
                          <div className={styles.cardSpecialtiesRow}>
                            {m.specialties.slice(0, 3).map((spec) => (
                              <span key={spec} className={styles.specialtyTag}>
                                {spec}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className={styles.cardFooterStrip}>
                          <span className={styles.cardDayBadge}>{m.day}</span>
                          <div className={styles.cardFooterActions}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectMarket(m, 'locate');
                              }}
                              className={styles.cardLocateBtn}
                              title="Show on map"
                            >
                              <Compass size={12} />
                              <span>Show on Map</span>
                            </button>
                            <Link
                              to={m.path}
                              className={styles.exploreLink}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span>Explore</span>
                              <ArrowRight size={11} />
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}

                  {filteredMarkets.length === 0 && (
                    <div className={styles.emptySidebar}>
                      {selectedFilterCategory === 'Saved' ? (
                        <>
                          <Bookmark size={36} className={styles.emptySidebarIcon} />
                          <h3 className={styles.emptyTitle}>No saved markets yet</h3>
                          <p className={styles.emptyDesc}>
                            Tap the bookmark icon on any market card to save it for quick access when planning your visit.
                          </p>
                          <button
                            type="button"
                            onClick={() => setSelectedFilterCategory('All Markets')}
                            className={styles.resetFiltersLink}
                          >
                            Explore all markets
                          </button>
                        </>
                      ) : (
                        <>
                          <Store size={36} className={styles.emptySidebarIcon} />
                          <h3 className={styles.emptyTitle}>No matching markets</h3>
                          <p className={styles.emptyDesc}>
                            Try adjusting your search criteria or clearing selected filters to view all New York farmers markets.
                          </p>
                          <button
                            type="button"
                            onClick={handleResetFilters}
                            className={styles.resetFiltersLink}
                          >
                            Show all 8 markets
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </aside>

              {/* ── RIGHT PANEL: EDITORIAL CARTOGRAPHIC MAP CANVAS ── */}
              <div
                ref={mapCanvasRef}
                className={styles.mapCanvasFrame}
                onMouseDown={handleMouseDown}
                aria-label="Interactive Manhattan and Brooklyn Farmers Market Map"
              >
                {/* SVG Vector Map Viewport */}
                <div
                  className={`${styles.mapViewport} ${
                    isDragging ? styles.mapViewportDragging : styles.mapViewportSmooth
                  }`}
                  style={{
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${mapZoom})`,
                  }}
                >
                  {/* Fixed Coordinate Map Board (1000px by 700px) */}
                  <div className={styles.mapBoard}>
                    <svg
                      viewBox="0 0 1000 700"
                      width="1000"
                      height="700"
                      className={styles.cartoVectorSvg}
                      aria-hidden="true"
                    >
                      <defs>
                        {/* Water styling */}
                        <linearGradient id="cartoWater" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#c5dbe9" />
                          <stop offset="60%" stopColor="#b4cede" />
                          <stop offset="100%" stopColor="#a3c1d4" />
                        </linearGradient>

                        {/* Land subtle parchment gradient */}
                        <linearGradient id="cartoLand" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f7f3eb" />
                          <stop offset="100%" stopColor="#ede6db" />
                        </linearGradient>

                        {/* Park Grass Pattern */}
                        <pattern id="parkTexture" width="16" height="16" patternUnits="userSpaceOnUse">
                          <rect width="16" height="16" fill="#d2e3cc" />
                          <circle cx="8" cy="8" r="1.2" fill="#bed4b7" opacity="0.65" />
                        </pattern>

                        {/* Subtle city grid dot texture */}
                        <pattern id="cityGridTexture" width="20" height="20" patternUnits="userSpaceOnUse">
                          <circle cx="10" cy="10" r="0.6" fill="#c4b8aa" opacity="0.2" />
                        </pattern>
                      </defs>

                      {/* Extended Base Landmass to prevent cutoffs during pan */}
                      <rect x="-2000" y="-2000" width="5000" height="5000" fill="url(#cartoLand)" />
                      <rect x="-2000" y="-2000" width="5000" height="5000" fill="url(#cityGridTexture)" />

                      {/* ── WATERWAYS ── */}
                      {/* Hudson River (West Coast of Manhattan) */}
                      <path
                        d="M -1000,-1000 L 320,-1000 L 320,0 C 290,140 250,280 270,410 C 290,490 350,600 420,700 L 420,3000 L -1000,3000 Z"
                        fill="url(#cartoWater)"
                      />

                      {/* Hudson River Piers & Docks */}
                      <g fill="#9cb7ca" stroke="#87a5ba" strokeWidth="1">
                        <rect x="290" y="80" width="34" height="7" rx="1" />
                        <rect x="280" y="140" width="38" height="8" rx="1" />
                        <rect x="270" y="210" width="42" height="9" rx="1" />
                        <rect x="260" y="270" width="45" height="10" rx="1" />
                        <rect x="255" y="340" width="44" height="9" rx="1" />
                        <rect x="260" y="400" width="46" height="10" rx="1" />
                        <rect x="278" y="470" width="44" height="9" rx="1" />
                        <rect x="310" y="540" width="40" height="9" rx="1" />
                        <rect x="345" y="600" width="38" height="8" rx="1" />
                      </g>

                      {/* East River & Brooklyn Coastline */}
                      <path
                        d="M 860,-1000 L 3000,-1000 L 3000,3000 L 730,3000 L 730,700 C 680,630 680,540 730,520 C 820,490 875,410 850,340 C 820,240 840,110 860,0 Z"
                        fill="url(#cartoWater)"
                      />

                      {/* Brooklyn Landmass */}
                      <path
                        d="M 3000,3000 L 730,3000 L 730,700 C 690,640 700,560 750,530 C 820,500 870,430 850,360 L 3000,360 Z"
                        fill="#e9e3d7"
                      />

                      {/* Waterway Shoreline Wave Accents */}
                      <path
                        d="M 315,10 C 285,150 248,290 268,415 C 288,495 348,605 415,695"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        opacity="0.45"
                      />
                      <path
                        d="M 855,10 C 835,115 815,245 845,345 C 870,415 815,495 725,525"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        opacity="0.45"
                      />

                      {/* ── FAMOUS SUSPENSION BRIDGES ── */}
                      {/* Williamsburg Bridge */}
                      <g stroke="#918070" strokeWidth="2.5" opacity="0.85">
                        <line x1="810" y1="435" x2="890" y2="400" />
                        <circle cx="850" cy="417" r="3" fill="#6d5e50" />
                      </g>

                      {/* Manhattan Bridge */}
                      <g stroke="#7b8d99" strokeWidth="2.5" opacity="0.85">
                        <line x1="755" y1="520" x2="840" y2="495" />
                        <circle cx="797" cy="507" r="3" fill="#586772" />
                      </g>

                      {/* Brooklyn Bridge */}
                      <g stroke="#918070" strokeWidth="3" opacity="0.9">
                        <line x1="720" y1="550" x2="810" y2="525" />
                        <circle cx="765" cy="537" r="3.5" fill="#58483b" />
                      </g>

                      {/* ── MAJOR ARTERIAL ROADS & STREET GRID ── */}
                      <g fill="none">
                        {/* Broadway (Iconic Diagonal cutting across Manhattan) */}
                        <path
                          d="M 570,0 C 555,180 625,380 470,700"
                          stroke="#d3c3b0"
                          strokeWidth="4"
                        />

                        {/* 14th Street Transversal */}
                        <path d="M 270,390 L 820,390" stroke="#cfbeab" strokeWidth="3.5" />
                        {/* 23rd Street Transversal */}
                        <path d="M 260,280 L 840,280" stroke="#d5c6b5" strokeWidth="3" />
                        {/* 34th Street Transversal */}
                        <path d="M 270,195 L 850,195" stroke="#d5c6b5" strokeWidth="3" />
                        {/* 42nd Street Transversal */}
                        <path d="M 290,130 L 860,130" stroke="#d5c6b5" strokeWidth="3" />
                        {/* Houston Street */}
                        <path d="M 310,510 L 820,510" stroke="#d8cab9" strokeWidth="3" />
                        {/* Canal Street */}
                        <path d="M 360,600 L 780,600" stroke="#d8cab9" strokeWidth="3" />

                        {/* Avenues Grid (North-South lines) */}
                        <g stroke="#e2d6c7" strokeWidth="2">
                          <line x1="390" y1="60" x2="360" y2="670" />
                          <line x1="440" y1="40" x2="410" y2="680" />
                          <line x1="490" y1="20" x2="470" y2="690" />
                          <line x1="540" y1="0" x2="520" y2="700" />
                          <line x1="590" y1="0" x2="580" y2="700" strokeWidth="2.5" />
                          <line x1="640" y1="0" x2="630" y2="700" />
                          <line x1="690" y1="0" x2="690" y2="700" />
                          <line x1="740" y1="0" x2="750" y2="680" />
                          <line x1="790" y1="20" x2="810" y2="520" />
                        </g>

                        {/* Secondary Neighborhood Streets */}
                        <g stroke="#eae0d4" strokeWidth="1.2">
                          <line x1="280" y1="90" x2="860" y2="90" />
                          <line x1="270" y1="160" x2="850" y2="160" />
                          <line x1="260" y1="235" x2="840" y2="235" />
                          <line x1="265" y1="325" x2="830" y2="325" />
                          <line x1="270" y1="355" x2="820" y2="355" />
                          <line x1="280" y1="430" x2="820" y2="430" />
                          <line x1="290" y1="470" x2="810" y2="470" />
                          <line x1="330" y1="550" x2="790" y2="550" />
                          <line x1="380" y1="640" x2="740" y2="640" />
                        </g>
                      </g>

                      {/* ── PARKS & GREEN SPACES ── */}
                      {/* Central Park (South Edge) */}
                      <rect
                        x="530"
                        y="0"
                        width="125"
                        height="120"
                        rx="6"
                        fill="url(#parkTexture)"
                        stroke="#abc5a1"
                        strokeWidth="1.5"
                      />

                      {/* Riverside Park ribbon */}
                      <path
                        d="M 330,0 L 355,0 C 340,60 325,120 315,160 L 295,160 Z"
                        fill="url(#parkTexture)"
                        stroke="#abc5a1"
                      />

                      {/* Madison Square Park */}
                      <rect
                        x="585"
                        y="265"
                        width="35"
                        height="30"
                        rx="4"
                        fill="url(#parkTexture)"
                        stroke="#abc5a1"
                      />

                      {/* Union Square Park */}
                      <rect
                        x="610"
                        y="370"
                        width="38"
                        height="40"
                        rx="5"
                        fill="url(#parkTexture)"
                        stroke="#abc5a1"
                      />

                      {/* Abingdon Square */}
                      <polygon
                        points="460,450 485,445 480,465 455,460"
                        fill="url(#parkTexture)"
                        stroke="#abc5a1"
                      />

                      {/* Washington Square Park */}
                      <rect
                        x="530"
                        y="465"
                        width="45"
                        height="32"
                        rx="4"
                        fill="url(#parkTexture)"
                        stroke="#abc5a1"
                      />

                      {/* Tompkins Square Park */}
                      <rect
                        x="715"
                        y="455"
                        width="46"
                        height="42"
                        rx="4"
                        fill="url(#parkTexture)"
                        stroke="#abc5a1"
                      />

                      {/* Stuyvesant Town Oval */}
                      <ellipse
                        cx="770"
                        cy="385"
                        rx="25"
                        ry="18"
                        fill="url(#parkTexture)"
                        stroke="#abc5a1"
                      />

                      {/* Prospect Park (Brooklyn) */}
                      <ellipse
                        cx="800"
                        cy="630"
                        rx="75"
                        ry="50"
                        fill="url(#parkTexture)"
                        stroke="#abc5a1"
                      />

                      {/* ── PARK LABELS ── */}
                      <text x="592" y="55" fill="#4d6e44" fontSize="10" fontWeight="700" letterSpacing="1.5" textAnchor="middle">CENTRAL PARK</text>
                      <text x="629" y="392" fill="#4d6e44" fontSize="8" fontWeight="700" textAnchor="middle">Union Sq</text>
                      <text x="738" y="478" fill="#4d6e44" fontSize="8" fontWeight="700" textAnchor="middle">Tompkins</text>
                      <text x="552" y="483" fill="#4d6e44" fontSize="8" fontWeight="700" textAnchor="middle">Wash Sq</text>
                      <text x="800" y="635" fill="#4d6e44" fontSize="10" fontWeight="700" letterSpacing="1" textAnchor="middle">PROSPECT PARK</text>

                      {/* ── WATERWAY LABELS ── */}
                      <text x="140" y="320" fill="#8aa8bd" fontSize="12" fontWeight="700" letterSpacing="4" transform="rotate(-72, 140, 320)">HUDSON RIVER</text>
                      <text x="910" y="460" fill="#8aa8bd" fontSize="12" fontWeight="700" letterSpacing="3" transform="rotate(66, 910, 460)">EAST RIVER</text>

                      {/* ── NEIGHBORHOOD LABELS ── */}
                      <text x="490" y="340" fill="#a89a8a" fontSize="10" fontWeight="700" letterSpacing="2.5">CHELSEA</text>
                      <text x="440" y="500" fill="#a89a8a" fontSize="9.5" fontWeight="700" letterSpacing="2">WEST VILLAGE</text>
                      <text x="705" y="425" fill="#a89a8a" fontSize="9.5" fontWeight="700" letterSpacing="2">EAST VILLAGE</text>
                      <text x="495" y="575" fill="#a89a8a" fontSize="9.5" fontWeight="700" letterSpacing="2">SOHO</text>
                      <text x="450" y="640" fill="#a89a8a" fontSize="9.5" fontWeight="700" letterSpacing="2">TRIBECA</text>
                      <text x="860" y="580" fill="#9e9182" fontSize="11" fontWeight="700" letterSpacing="2.5">BROOKLYN</text>

                      {/* ── USER SIMULATED PIN (10003) ── */}
                      <g transform="translate(620, 415)">
                        <circle cx="0" cy="0" r="16" fill="#7A2E3B" opacity="0.12">
                          <animate attributeName="r" values="10;22;10" dur="2.4s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.25;0.05;0.25" dur="2.4s" repeatCount="indefinite" />
                        </circle>
                        <circle cx="0" cy="0" r="7" fill="#ffffff" stroke="#7A2E3B" strokeWidth="2.5" />
                        <circle cx="0" cy="0" r="3.5" fill="#7A2E3B" />
                      </g>
                    </svg>

                    {/* ─── INTERACTIVE MAP PINS (VISIBLY RENDERED & INTERACTIVE) ── */}
                    {MARKETS_DATA.map((m) => {
                      const isSelected = m.id === selectedMarketId;
                      const isHovered = m.id === hoveredMarketId;

                      return (
                        <div
                          key={m.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (hasMovedRef.current) return;
                            handleSelectMarket(m, 'pin');
                          }}
                          onMouseEnter={() => setHoveredMarketId(m.id)}
                          onMouseLeave={() => setHoveredMarketId(null)}
                          className={`${styles.mapPinAnchor} ${
                            isSelected ? styles.mapPinAnchorSelected : ''
                          } ${isHovered ? styles.mapPinAnchorHovered : ''}`}
                          style={{
                            left: `${m.mapPin.x}px`,
                            top: `${m.mapPin.y}px`,
                          }}
                          role="button"
                          tabIndex={0}
                          aria-label={`Market: ${m.name}`}
                        >
                          <div className={styles.pinBeaconGlow} />

                          <div className={styles.pinPillBody}>
                            <span
                              className={
                                m.statusType === 'open'
                                  ? styles.pinStatusIndicator
                                  : styles.pinStatusIndicatorTomorrow
                              }
                            />
                            <span className={styles.pinLabelText}>{m.mapPin.name}</span>
                            <span className={styles.pinVendorCount}>{m.mapPin.badge}</span>
                          </div>

                          <div className={styles.pinBeakArrow} />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── MAP CONTROLS (TOP RIGHT) ── */}
                <div className={styles.mapUtilityStack}>
                  <div className={styles.zoomButtonGroup}>
                    <button
                      type="button"
                      onClick={() => setMapZoom((z) => Math.min(Math.round((z + 0.15) * 100) / 100, 2.0))}
                      className={styles.mapControlBtn}
                      title="Zoom in"
                      aria-label="Zoom in"
                    >
                      <Plus size={16} />
                    </button>
                    <div className={styles.zoomDivider} />
                    <button
                      type="button"
                      onClick={() => setMapZoom((z) => Math.max(Math.round((z - 0.15) * 100) / 100, 0.75))}
                      className={styles.mapControlBtn}
                      title="Zoom out"
                      aria-label="Zoom out"
                    >
                      <Minus size={16} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleRecenter}
                    className={styles.recenterBtn}
                    title="Fit All Markets / Recenter"
                    aria-label="Fit all markets"
                  >
                    <RotateCcw size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={handleLocateUser}
                    className={styles.recenterBtn}
                    title="Locate My Area (10003 - Union Square)"
                    aria-label="Locate my area"
                  >
                    <Crosshair size={15} />
                  </button>
                </div>

                {/* ── MAP LEGEND (BOTTOM LEFT) ── */}
                <div className={styles.mapLegendStrip}>
                  <div className={styles.legendItem}>
                    <span className={styles.pinStatusIndicator} />
                    <span>Open Today</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={styles.pinStatusIndicatorTomorrow} />
                    <span>Tomorrow</span>
                  </div>
                  <div className={styles.legendItem}>
                    <MapPin size={11} color="#7A2E3B" />
                    <span>You (10003)</span>
                  </div>
                  <div className={styles.legendHint}>
                    <span>• Drag to pan • Scroll to zoom</span>
                  </div>
                </div>

                {/* ── FLOATING DETAIL CARD (BOTTOM RIGHT PREVIEW) ── */}
                {/* User requirement: "the car untop of map should not be there for the frist time aftre they click onn the market" */}
                {isPopupOpen && activeMarket && (
                  <article
                    className={styles.floatingPreviewCard}
                    aria-label={`${activeMarket.name} preview`}
                  >
                    <div className={styles.previewPhotoWrap}>
                      <img
                        src={activeMarket.image}
                        alt={activeMarket.name}
                        className={styles.previewPhoto}
                      />
                      <div className={styles.previewPhotoOverlay}>
                        <span className={styles.previewStatusBadge}>
                          <span
                            className={
                              activeMarket.statusType === 'open'
                                ? styles.pulseDot
                                : styles.pulseDotAmber
                            }
                          />
                          {activeMarket.status}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            setIsPopupOpen(false);
                            setSelectedMarketId(null);
                          }}
                          className={styles.previewCloseBtn}
                          aria-label="Close preview"
                          title="Close preview"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>

                    <div className={styles.previewBody}>
                      <div className={styles.previewTitleRow}>
                        <h2 className={styles.previewTitle}>{activeMarket.name}</h2>
                        <div className={styles.previewRating}>
                          <Star size={12} fill="#D4850A" color="#D4850A" />
                          <span>{activeMarket.rating}</span>
                          <span style={{ fontSize: '10px', color: '#8c8277' }}>({activeMarket.reviewCount})</span>
                        </div>
                      </div>

                      <div className={styles.previewLocation}>
                        <MapPin size={12} />
                        <span>{activeMarket.location}</span>
                      </div>

                      <div className={styles.previewStatsGrid}>
                        <div className={styles.previewStatBox}>
                          <span className={styles.previewStatLabel}>GROWERS</span>
                          <span className={styles.previewStatValue}>{activeMarket.vendors}</span>
                        </div>
                        <div className={styles.previewStatBox}>
                          <span className={styles.previewStatLabel}>DISTANCE</span>
                          <span className={styles.previewStatValue}>{activeMarket.distance}</span>
                        </div>
                        <div className={styles.previewStatBox}>
                          <span className={styles.previewStatLabel}>HOURS</span>
                          <span className={styles.previewStatValue}>{activeMarket.hours.split('–')[0]}</span>
                        </div>
                      </div>

                      <div className={styles.previewActionsRow}>
                        <Link to={activeMarket.path} className={styles.previewExploreBtn}>
                          <span>Explore & Pre-Order</span>
                          <ArrowRight size={13} />
                        </Link>
                        <button
                          type="button"
                          onClick={(e) => toggleSave(activeMarket.id, e)}
                          className={`${styles.previewSaveBtn} ${
                            savedMarkets[activeMarket.id] ? styles.previewSaveActive : ''
                          }`}
                          aria-label="Save market"
                          title="Save market"
                        >
                          <Bookmark size={15} fill={savedMarkets[activeMarket.id] ? '#7A2E3B' : 'none'} />
                        </button>
                      </div>
                    </div>
                  </article>
                )}
              </div>
            </div>
          ) : (
            /* ── VIEW MODE: LIST / EDITORIAL GRID VIEW ── */
            <div className={styles.listViewWrap}>
              <div className={styles.listHeaderRow}>
                <span className={styles.listResultsCount}>
                  Showing {filteredMarkets.length} verified markets
                </span>
              </div>

              <div className={styles.marketsEditorialGrid}>
                {filteredMarkets.map((m) => {
                  const isSaved = savedMarkets[m.id];

                  return (
                    <article key={m.id} className={styles.gridCard}>
                      <div className={styles.gridCardPhotoWrap}>
                        <img src={m.image} alt={m.name} className={styles.gridCardPhoto} />
                        <span
                          className={
                            m.statusType === 'open'
                              ? styles.gridCardStatusBadge
                              : styles.gridCardStatusBadgeTomorrow
                          }
                        >
                          <span
                            className={
                              m.statusType === 'open' ? styles.pulseDot : styles.pulseDotAmber
                            }
                          />
                          {m.status}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => toggleSave(m.id, e)}
                          className={styles.gridCardBookmarkBtn}
                          aria-label={isSaved ? 'Remove from saved' : 'Save market'}
                        >
                          <Bookmark size={15} fill={isSaved ? '#7A2E3B' : 'none'} />
                        </button>
                      </div>

                      <div className={styles.gridCardBody}>
                        <div className={styles.gridCardTopMeta}>
                          <span className={styles.gridCardDistance}>
                            <MapPin size={12} color="#7A2E3B" />
                            {m.distance}
                          </span>
                          <div className={styles.gridCardRating}>
                            <Star size={12} fill="#D4850A" color="#D4850A" />
                            <span>{m.rating}</span>
                            <span style={{ color: '#8c8277', fontWeight: 400 }}>
                              ({m.reviewCount})
                            </span>
                          </div>
                        </div>

                        <h2 className={styles.gridCardTitle}>
                          <Link to={m.path} className={styles.gridCardTitleLink}>
                            {m.name}
                          </Link>
                        </h2>

                        <p className={styles.gridCardLocation}>{m.location}</p>
                        <p className={styles.gridCardDesc}>{m.description}</p>

                        <div className={styles.gridCardPillTags}>
                          <span className={styles.gridCardTag}>
                            <Store size={12} /> {m.vendors}
                          </span>
                          <span className={styles.gridCardTag}>
                            <Clock size={12} /> {m.hours}
                          </span>
                          <span className={styles.gridCardTag}>
                            <Calendar size={12} /> {m.day}
                          </span>
                        </div>

                        <div className={styles.gridCardFooter}>
                          <Link to={m.path} className={styles.gridCardActionBtn}>
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
      </main>
    </div>
  );
}

export default Market;
