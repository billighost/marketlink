import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Calendar,
  Store,
  Leaf,
  ShieldCheck,
  Star,
  ArrowRight,
  CheckCircle2,
  X,
  Eye,
  Sparkles,
  Filter,
} from 'lucide-react';
import { getFarmers, getMarkets, getFarmerProducts } from '@/api/catalog';
import { PATHS } from '@/routes/paths';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import { formatPrice } from '@/utils/format';
import styles from './Farmers.module.css';

const CATEGORIES = [
  'All Growers',
  'Vegetables & Herbs',
  'Fruit & Berries',
  'Bakery',
  'Dairy & Cheese',
  'Honey & Preserves',
];

function getFarmerImages(f) {
  const stall = (f.stallName || f.farmName || f.name || '').toLowerCase();
  if (stall.includes('willow') || stall.includes('poultry')) {
    return {
      avatar: '/images/farmer-marcus.jpg',
      cover: '/images/hero-market-crates.jpg',
      category: 'Dairy & Cheese',
    };
  }
  if (stall.includes('oak') || stall.includes('mill') || stall.includes('bakery')) {
    return {
      avatar: '/images/farmer-elena.jpg',
      cover: '/images/hero-market-crates.jpg',
      category: 'Bakery',
    };
  }
  if (stall.includes('cedarbrook') || stall.includes('flower')) {
    return {
      avatar: '/images/farmer-sarah.jpg',
      cover: '/images/market-wildflower.jpg',
      category: 'Vegetables & Herbs',
    };
  }
  if (stall.includes('riverbend')) {
    return {
      avatar: '/images/farmer-david.jpg',
      cover: '/images/riverbend-farm.jpg',
      category: 'Vegetables & Herbs',
    };
  }
  if (stall.includes('maplecrest') || stall.includes('creamery')) {
    return {
      avatar: '/images/farmer-priya.jpg',
      cover: '/images/market-morning.jpg',
      category: 'Dairy & Cheese',
    };
  }
  if (stall.includes('hollow') || stall.includes('mushroom') || stall.includes('apiary')) {
    return {
      avatar: '/images/farmer-marcus.jpg',
      cover: '/images/market-riverside.jpg',
      category: 'Honey & Preserves',
    };
  }
  return {
    avatar: f.avatar || f.imageUrl || '/images/farmer-david.jpg',
    cover: f.coverImage || '/images/riverbend-farm.jpg',
    category: f.category || 'Vegetables & Herbs',
  };
}

export function Farmers() {
  useDocumentTitle('Local Farmers & Producers — MarketLink');
  const navigate = useNavigate();

  const [rawFarmers, setRawFarmers] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Growers');
  const [selectedMarketId, setSelectedMarketId] = useState('all');
  const [organicOnly, setOrganicOnly] = useState(false);

  // Peek modal
  const [peekFarmer, setPeekFarmer] = useState(null);
  const [peekProducts, setPeekProducts] = useState([]);
  const [peekLoading, setPeekLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([
      getFarmers().catch(() => []),
      getMarkets().catch(() => ({ data: [] })),
    ])
      .then(([farmersData, marketsData]) => {
        if (!active) return;
        const fList = Array.isArray(farmersData)
          ? farmersData
          : farmersData?.data || farmersData?.items || [];
        const mList = Array.isArray(marketsData)
          ? marketsData
          : marketsData?.data || marketsData?.items || [];
        setRawFarmers(fList);
        setMarkets(mList);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Open Peek Modal & fetch products
  const handleOpenPeek = async (farmer, e) => {
    e.preventDefault();
    setPeekFarmer(farmer);
    setPeekLoading(true);
    setPeekProducts([]);
    try {
      const res = await getFarmerProducts(farmer.id);
      const list = Array.isArray(res) ? res : res?.data || [];
      setPeekProducts(list.slice(0, 6));
    } catch {
      setPeekProducts([]);
    } finally {
      setPeekLoading(false);
    }
  };

  const normalizedFarmers = useMemo(() => {
    return rawFarmers.map((f) => {
      const id = f.id || f._id;
      const farmName = f.stallName || f.farmName || f.name || 'Local Farm';
      const growerName = f.name || (f.stallName ? `Grower at ${f.stallName}` : 'Local Grower');
      const visual = getFarmerImages(f);
      const badges = ['100% Producer Only'];
      if (f.isTopSeller) badges.push('Top Seller');
      if (f.isNew) badges.push('New Grower');

      const operatingDaysFormatted =
        Array.isArray(f.operatingDays) && f.operatingDays.length > 0
          ? f.operatingDays.map((d) => (typeof d === 'string' ? d.toUpperCase() : '')).filter(Boolean).join(', ')
          : 'WEEKENDS';

      const marketList =
        Array.isArray(f.markets) && f.markets.length > 0
          ? f.markets.map((m) => ({
              id: m.id || m._id,
              name: m.name || 'Local Market',
              day: m.day || operatingDaysFormatted,
            }))
          : [{ id: 'sat', name: 'Saturday Elm Street Market', day: operatingDaysFormatted }];

      return {
        id,
        name: growerName,
        farmName,
        location: f.stallNumber ? `Stall ${f.stallNumber} · Local Foodshed` : 'Local Regional Square',
        image: visual.avatar,
        coverImage: visual.cover,
        specialty: f.specialty || f.specialties?.join(', ') || 'Fresh Seasonal Harvest',
        category: f.category || visual.category,
        verified: true,
        badges,
        rating: f.ratingAvg ? Number(f.ratingAvg).toFixed(1) : f.rating ? Number(f.rating).toFixed(1) : '5.0',
        reviewCount: f.ratingCount || f.reviewCount || 14,
        story: f.story || f.bio || 'Dedicated to sustainable regional stewardship and harvest-fresh market stalls.',
        markets: marketList,
      };
    });
  }, [rawFarmers]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = { 'All Growers': normalizedFarmers.length };
    CATEGORIES.forEach((cat) => {
      if (cat !== 'All Growers') {
        counts[cat] = normalizedFarmers.filter((f) => f.category === cat).length;
      }
    });
    return counts;
  }, [normalizedFarmers]);

  const filteredFarmers = useMemo(() => {
    return normalizedFarmers.filter((f) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = f.name?.toLowerCase().includes(q);
        const matchesFarm = f.farmName?.toLowerCase().includes(q);
        const matchesSpecialty = f.specialty?.toLowerCase().includes(q);
        if (!matchesName && !matchesFarm && !matchesSpecialty) return false;
      }

      if (selectedCategory !== 'All Growers') {
        if (f.category !== selectedCategory) return false;
      }

      if (selectedMarketId !== 'all') {
        const attends = f.markets.some(
          (m) =>
            m.id === selectedMarketId ||
            (m.name && m.name.toLowerCase().includes(selectedMarketId.toLowerCase()))
        );
        if (!attends) return false;
      }

      if (organicOnly) {
        if (!f.verified && !f.badges.includes('Producer Only')) return false;
      }

      return true;
    });
  }, [normalizedFarmers, searchQuery, selectedCategory, selectedMarketId, organicOnly]);

  return (
    <div className={styles.page}>
      {/* ─── 1. HERO BANNER & REGIONAL FOODSHED METRICS ─────────────── */}
      <section className={styles.heroSection}>
        <div className="container">
          <div className={styles.heroContent}>
            <span className={styles.eyebrow}>
              <span className={styles.pulseGreenDot} />
              <Leaf size={14} className={styles.eyebrowIcon} />
              100% REGIONAL PRODUCER-ONLY MARKET
            </span>

            <h1 className={styles.heroTitle}>Meet Our Local Farmers & Artisans</h1>
            <p className={styles.heroSubtitle}>
              Every grower on MarketLink is an independent family farm or food artisan cultivating
              regenerative harvests within your regional foodshed. Zero middlemen, picked hours before pickup.
            </p>

            {/* Regional Foodshed Telemetry Bar */}
            <div className={styles.foodshedCountersBar} aria-label="Regional foodshed statistics">
              <div className={styles.counterItem}>
                <span className={styles.counterNum}>{normalizedFarmers.length || 14}</span>
                <span className={styles.counterLabel}>Verified Producers</span>
              </div>
              <div className={styles.counterDivider} />
              <div className={styles.counterItem}>
                <span className={styles.counterNum}>{markets.length || 4}</span>
                <span className={styles.counterLabel}>Regional Markets</span>
              </div>
              <div className={styles.counterDivider} />
              <div className={styles.counterItem}>
                <span className={styles.counterNum}>100%</span>
                <span className={styles.counterLabel}>Direct-to-Customer</span>
              </div>
              <div className={styles.counterDivider} />
              <div className={styles.counterItem}>
                <span className={styles.counterNum}>&lt; 45 mi</span>
                <span className={styles.counterLabel}>Avg Farm Distance</span>
              </div>
            </div>

            {/* Search & Market Dropdown Controls */}
            <div className={styles.searchControlsRow}>
              <div className={styles.searchInputGroup}>
                <Search size={18} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search farmers, farms, or produce..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className={styles.clearSearchBtn}
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Neighborhood Market Selector */}
              <select
                className={styles.marketSelectDropdown}
                value={selectedMarketId}
                onChange={(e) => setSelectedMarketId(e.target.value)}
                aria-label="Filter by market location"
              >
                <option value="all">All Market Locations</option>
                {markets.map((m) => (
                  <option key={m.id || m._id} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setOrganicOnly((v) => !v)}
                className={`${styles.filterToggleBtn} ${organicOnly ? styles.filterToggleActive : ''}`}
              >
                <ShieldCheck size={16} />
                <span>Verified Only</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. STICKY CATEGORY PILLS BAR ────────────────────────────── */}
      <div className={styles.categoryBar}>
        <div className="container">
          <div className={styles.categoryScroll}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`${styles.categoryChip} ${
                  selectedCategory === cat ? styles.categoryChipActive : ''
                }`}
              >
                <span>{cat}</span>
                <span className={styles.categoryCountBadge}>
                  {categoryCounts[cat] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── 3. FARMERS LISTING GRID ─────────────────────────────────── */}
      <section className={styles.farmersGridSection}>
        <div className="container">
          <div className={styles.resultsMetaRow}>
            <p className={styles.resultsCount}>
              Showing <strong>{filteredFarmers.length}</strong> verified independent growers
              {selectedCategory !== 'All Growers' && ` in "${selectedCategory}"`}
            </p>
            <div className={styles.trustBadges}>
              <span className={styles.trustBadge}>
                <CheckCircle2 size={13} color="#7A2E3B" /> 100% Producer Only
              </span>
              <span className={styles.trustBadge}>
                <CheckCircle2 size={13} color="#7A2E3B" /> No Resellers
              </span>
            </div>
          </div>

          <div className={styles.farmersGrid}>
            {loading ? (
              <div style={{ gridColumn: '1 / -1', padding: '60px 0', textAlign: 'center', color: '#6e655c' }}>
                <p>Loading farmers...</p>
              </div>
            ) : filteredFarmers.length > 0 ? (
              filteredFarmers.map((farmer) => (
                <article key={farmer.id} className={styles.farmerCard}>
                  {/* Card Cover Banner */}
                  <div className={styles.cardHeaderArea}>
                    <img
                      src={farmer.coverImage}
                      alt={farmer.farmName}
                      className={styles.cardCoverImg}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/riverbend-farm.jpg';
                      }}
                    />
                    <div className={styles.cardCoverOverlay} />

                    <div className={styles.avatarWrap}>
                      <img
                        src={farmer.image}
                        alt={farmer.name}
                        className={styles.avatarImg}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/images/farmer-david.jpg';
                        }}
                      />
                    </div>

                    <div className={styles.ratingBadge}>
                      <Star size={13} fill="#E07A2C" color="#E07A2C" />
                      <span>{farmer.rating}</span>
                      <span className={styles.ratingCount}>({farmer.reviewCount})</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className={styles.cardBody}>
                    <div className={styles.titleRow}>
                      <div>
                        <h2 className={styles.farmTitle}>{farmer.farmName}</h2>
                        <p className={styles.farmerSpecialty}>{farmer.specialty}</p>
                      </div>
                    </div>

                    <div className={styles.locationRow}>
                      <MapPin size={13} className={styles.locIcon} />
                      <span>{farmer.location}</span>
                    </div>

                    <div className={styles.badgesRow}>
                      {farmer.badges.map((b) => (
                        <span
                          key={b}
                          className={`${styles.badgePill} ${b.includes('Producer') ? styles.badgePillHighlight : ''}`}
                        >
                          {b}
                        </span>
                      ))}
                    </div>

                    <p className={styles.storySnippet}>{farmer.story}</p>

                    {/* Market Attendance */}
                    <div className={styles.marketAttendanceBox}>
                      <div className={styles.marketBoxHeader}>
                        <Store size={13} />
                        <span>Where to pick up:</span>
                      </div>
                      <div className={styles.marketDaysList}>
                        {farmer.markets.map((m, idx) => (
                          <div key={idx} className={styles.marketDayItem}>
                            <span className={styles.marketDayName}>{m.name}</span>
                            <span className={styles.marketDayTime}>{m.day}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className={styles.cardFooter}>
                      <button
                        type="button"
                        onClick={(e) => handleOpenPeek(farmer, e)}
                        className={styles.peekBtn}
                        title="Quickly preview seasonal produce"
                      >
                        <Eye size={14} />
                        <span>Peek</span>
                      </button>

                      <Link to={`/farmers/${farmer.id}`} className={styles.viewStallBtn}>
                        <span>Explore Stall</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div style={{ gridColumn: '1 / -1', padding: '60px 0', textAlign: 'center', color: '#6e655c' }}>
                <h3 style={{ fontSize: '1.25rem', color: '#1f2937', marginBottom: '8px' }}>
                  No growers found
                </h3>
                <p style={{ color: '#6b7280', marginBottom: '16px' }}>
                  Try adjusting your search keyword or clearing the market/category filter.
                </p>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All Growers');
                    setSelectedMarketId('all');
                    setOrganicOnly(false);
                  }}
                >
                  Reset all filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── 4. QUICK HARVEST PEEK MODAL ─────────────────────────────── */}
      {peekFarmer && (
        <BottomSheet
          isOpen={Boolean(peekFarmer)}
          onClose={() => setPeekFarmer(null)}
          size="tall"
          title={`${peekFarmer.farmName} — Seasonal Harvest`}
        >
          <div className={styles.peekModalContent}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
              <img
                src={peekFarmer.image}
                alt={peekFarmer.farmName}
                style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div>
                <strong style={{ fontSize: '1.1rem', color: '#111827', display: 'block' }}>
                  {peekFarmer.farmName}
                </strong>
                <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                  {peekFarmer.specialty} • {peekFarmer.rating} ★
                </span>
              </div>
            </div>

            <h4 style={{ fontSize: '0.95rem', color: '#7A2E3B', margin: '4px 0 0 0' }}>
              Current Produce Available for Pre-order
            </h4>

            {peekLoading ? (
              <p style={{ color: '#6b7280' }}>Loading harvest items...</p>
            ) : peekProducts.length === 0 ? (
              <p style={{ color: '#6b7280' }}>
                Catalog is being refreshed for this week's market. Check stall profile for full details!
              </p>
            ) : (
              <div className={styles.peekProduceGrid}>
                {peekProducts.map((p) => (
                  <div key={p.id || p._id} className={styles.peekProduceCard}>
                    <strong style={{ fontSize: '0.9rem', color: '#111827' }}>{p.name}</strong>
                    <span style={{ fontSize: '0.85rem', color: '#7A2E3B', fontWeight: 600 }}>
                      {formatPrice(p.priceCents)} / {p.unit}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {p.quantityAvailable || p.quantity || 'Available'} in stock
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <Button variant="secondary" size="md" onClick={() => setPeekFarmer(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  navigate(`/farmers/${peekFarmer.id}`);
                  setPeekFarmer(null);
                }}
              >
                <span>Visit Full Farm Stall</span>
                <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}

export default Farmers;
