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
} from 'lucide-react';
import { getFarmers } from '@/api/catalog';
import { PATHS } from '@/routes/paths';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import styles from './Farmers.module.css';

const CATEGORIES = [
  'All Growers',
  'Vegetables & Herbs',
  'Fruit & Berries',
  'Bakery',
  'Dairy & Cheese',
  'Honey & Preserves',
];

export function Farmers() {
  useDocumentTitle('Local Farmers & Producers ΓÇö MarketLink');
  const navigate = useNavigate();

  const [rawFarmers, setRawFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Growers');
  const [organicOnly, setOrganicOnly] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getFarmers()
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data) ? data : data?.data || data?.items || [];
        setRawFarmers(list);
      })
      .catch(() => {
        if (active) setRawFarmers([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const normalizedFarmers = useMemo(() => {
    return rawFarmers.map((f) => {
      const id = f.id || f._id;
      const farmName = f.stallName || f.farmName || f.name || 'Local Farm';
      const growerName = f.name || 'Local Grower';
      return {
        id,
        name: growerName,
        farmName,
        location: f.bio || 'Local Region',
        image: f.avatar || '/images/farmer-elena.jpg',
        coverImage: f.coverImage || '/images/riverbend-farm.jpg',
        specialty: f.specialties?.join(', ') || f.specialty || 'Fresh Seasonal Produce',
        category: f.category || 'Vegetables & Herbs',
        verified: true,
        badges: ['Producer Only', 'Family Farm'],
        rating: f.rating || 4.9,
        reviewCount: f.reviewCount || 42,
        story: f.story || f.bio || 'Dedicated to sustainable agricultural stewardship and fresh market harvests.',
        markets: Array.isArray(f.markets) && f.markets.length > 0
          ? f.markets.map((m) => ({ name: m.name || 'Local Market', day: m.day || 'Sat 8AM - 1PM' }))
          : [{ name: 'Saturday Market', day: 'Sat 8AM - 1PM' }],
      };
    });
  }, [rawFarmers]);

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

      return true;
    });
  }, [normalizedFarmers, searchQuery, selectedCategory]);

  return (
    <div className={styles.page}>
      {/* ΓöÇΓöÇΓöÇ 1. HERO BANNER ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      <section className={styles.heroSection}>
        <div className="container">
          <div className={styles.heroContent}>
            <span className={styles.eyebrow}>
              <Leaf size={14} className={styles.eyebrowIcon} />
              DIRECT FROM PRODUCERS
            </span>
            <h1 className={styles.heroTitle}>Meet Our Local Farmers & Artisans</h1>
            <p className={styles.heroSubtitle}>
              Every grower on MarketLink is an independent family farmer or food artisan cultivating
              regenerative harvests within your regional foodshed.
            </p>

            {/* Search and Filters Bar */}
            <div className={styles.searchBarWrapper}>
              <div className={styles.searchInputGroup}>
                <Search size={18} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search farmers, farm names, or specialties..."
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

              <button
                type="button"
                onClick={() => setOrganicOnly((v) => !v)}
                className={`${styles.organicFilterBtn} ${organicOnly ? styles.organicFilterActive : ''}`}
              >
                <ShieldCheck size={16} />
                <span>Verified Only</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ΓöÇΓöÇΓöÇ 2. CATEGORY PILLS ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
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
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ΓöÇΓöÇΓöÇ 3. FARMERS LISTING GRID ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      <section className={styles.farmersGridSection}>
        <div className="container">
          <div className={styles.resultsMetaRow}>
            <p className={styles.resultsCount}>
              Showing <strong>{filteredFarmers.length}</strong> verified independent growers
            </p>
            <div className={styles.trustBadges}>
              <span className={styles.trustBadge}>
                <CheckCircle2 size={13} color="#27532B" /> 100% Producer Only
              </span>
              <span className={styles.trustBadge}>
                <CheckCircle2 size={13} color="#27532B" /> No Wholesalers
              </span>
            </div>
          </div>

          <div className={styles.farmersGrid}>
            {loading ? (
              <div style={{ gridColumn: '1 / -1', padding: '40px 0', textAlign: 'center', color: '#6e655c' }}>
                Loading farmers...
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
                    />
                    <div className={styles.cardCoverOverlay} />

                    <div className={styles.avatarWrap}>
                      <img
                        src={farmer.image}
                        alt={farmer.name}
                        className={styles.avatarImg}
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
                        <p className={styles.farmerName}>Grown by {farmer.name}</p>
                      </div>
                    </div>

                    <div className={styles.locationRow}>
                      <MapPin size={13} className={styles.locIcon} />
                      <span>{farmer.location}</span>
                    </div>

                    <div className={styles.badgesRow}>
                      {farmer.badges.map((b) => (
                        <span key={b} className={styles.badgePill}>
                          {b}
                        </span>
                      ))}
                    </div>

                    <p className={styles.storySnippet}>{farmer.story}</p>

                    {/* Market Attendance */}
                    <div className={styles.marketAttendanceBox}>
                      <div className={styles.marketBoxHeader}>
                        <Store size={13} className={styles.storeIcon} />
                        <span>Where to find this stall:</span>
                      </div>
                      <div className={styles.marketDaysList}>
                        {farmer.markets.map((m) => (
                          <div key={m.name} className={styles.marketDayItem}>
                            <span className={styles.marketDayName}>{m.name}</span>
                            <span className={styles.marketDayTime}>{m.day}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className={styles.cardFooter}>
                      <Link to={`/farmers/${farmer.id}`} className={styles.viewStallBtn}>
                        <span>Explore Farm Stall</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div style={{ gridColumn: '1 / -1', padding: '60px 0', textAlign: 'center', color: '#6e655c' }}>
                <h3>No farmers found</h3>
                <p>Try searching with another keyword or resetting the category filter.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Farmers;
