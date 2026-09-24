import React, { useState, useMemo } from 'react';
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
  Filter,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  X,
} from 'lucide-react';
import { PATHS } from '@/routes/paths';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import styles from './Farmers.module.css';

export const GUEST_FARMERS_DATA = [
  {
    id: 'f-riverbend',
    name: 'Elena Vance',
    farmName: 'Riverbend Farm',
    location: 'Hudson Valley, NY (38 mi away)',
    image: '/images/farmer-elena.jpg',
    coverImage: '/images/riverbend-farm.jpg',
    specialty: 'Heirloom Vegetables & Leafy Greens',
    category: 'Vegetables & Herbs',
    verified: true,
    badges: ['Organic Certified', 'Generational Farm'],
    rating: 4.9,
    reviewCount: 48,
    story:
      'Three generations of sustainable organic stewardship along the Passaic River. Harvested at dawn the morning before every weekend market.',
    markets: [
      { name: 'Greenwich Village', day: 'Sat 8AM - 2PM' },
      { name: 'Union Square', day: 'Wed & Fri 8AM - 6PM' },
    ],
    crops: ['Brandywine Tomatoes', 'Butterhead Lettuce', 'French Breakfast Radishes', 'Lacinato Kale'],
    since: 2018,
  },
  {
    id: 'f-sunburst',
    name: 'Marcus Chen',
    farmName: "Chen's Organic Acres",
    location: 'Catskill, NY (52 mi away)',
    image: '/images/farmer-marcus.jpg',
    coverImage: '/images/market-riverside.jpg',
    specialty: 'Hydroponic Living Salads & Microgreens',
    category: 'Vegetables & Herbs',
    verified: true,
    badges: ['Pesticide Free', 'Zero-Waste Water'],
    rating: 4.8,
    reviewCount: 39,
    story:
      'High-tech closed-loop hydroponics powered by solar energy. Delivering ultra-crisp, living-root greens packed with intense nutrition.',
    markets: [
      { name: 'Union Square', day: 'Wed, Fri, Sat' },
      { name: 'Chelsea Market', day: 'Sat 9AM - 3PM' },
    ],
    crops: ['Living Butterhead', 'Spicy Mustard Greens', 'Sunflower Shoots', 'Genovese Basil'],
    since: 2021,
  },
  {
    id: 'f-hollowcreek',
    name: 'Sarah Jenkins',
    farmName: 'Hollow Creek Apiary',
    location: 'Morris County, NJ (28 mi away)',
    image: '/images/farmer-sarah.jpg',
    coverImage: '/images/market-morning.jpg',
    specialty: 'Raw Wildflower Honey & Bee Pollen',
    category: 'Honey & Preserves',
    verified: true,
    badges: ['Treatment Free', 'Wildflower Certified'],
    rating: 5.0,
    reviewCount: 54,
    story:
      'Over 40 hives tended across chemical-free wildflower meadows. Every jar is single-origin, unfiltered, and labelled with the specific bloom season.',
    markets: [
      { name: 'Greenwich Village', day: 'Sat 8AM - 2PM' },
      { name: 'Tompkins Square', day: 'Sun 8AM - 5PM' },
    ],
    crops: ['Spring Blossom Honey', 'Creamed Clover Honey', 'Raw Bee Pollen', 'Propolis Tincture'],
    since: 2019,
  },
  {
    id: 'f-oakmill',
    name: 'Dan & Priya Patel',
    farmName: 'Oak & Mill Artisan Bakery',
    location: 'Kingston, NY (45 mi away)',
    image: '/images/hero-carrots.jpg',
    coverImage: '/images/product-sourdough.jpg',
    specialty: 'Heritage Grain Sourdough & Pastries',
    category: 'Bakery',
    verified: true,
    badges: ['Stone Milled', '48-hr Ferment'],
    rating: 5.0,
    reviewCount: 62,
    story:
      'Naturally leavened sourdough bread and Viennoiserie baked from stone-milled regional grains. Crusty, aromatic, and easy on digestion.',
    markets: [
      { name: 'Greenwich Village', day: 'Sat 8AM - 2PM' },
      { name: 'Chelsea Market', day: 'Sat 9AM - 3:30PM' },
    ],
    crops: ['Country Sourdough', 'Seeded Rye Boule', 'Kouign-Amann', 'Focaccia Genovese'],
    since: 2020,
  },
  {
    id: 'f-maplecrest',
    name: 'Robert Miller',
    farmName: 'Maplecrest Creamery',
    location: 'Hunterdon County, NJ (40 mi away)',
    image: '/images/farmer-elena.jpg',
    coverImage: '/images/market-central.jpg',
    specialty: 'Pasture-Raised Jersey Dairy & Raw Milk Cheeses',
    category: 'Dairy & Cheese',
    verified: true,
    badges: ['A2/A2 Certified', 'Grass-Fed 100%'],
    rating: 4.7,
    reviewCount: 31,
    story:
      'Pasture-grazed herd of Jersey cows providing nutrient-dense rich milk turned into award-winning clothbound cheddars and fresh butter.',
    markets: [
      { name: 'Union Square', day: 'Sat 8AM - 6PM' },
      { name: 'Tompkins Square', day: 'Sun 8AM - 5PM' },
    ],
    crops: ['Cave-Aged Cheddar', 'Cultured Farmhouse Butter', 'Raw Whole Milk', 'Fresh Fromage Blanc'],
    since: 2017,
  },
  {
    id: 'f-sunridge',
    name: 'Claire Dupont',
    farmName: 'Sunridge Berry Farm',
    location: 'Dutchess County, NY (60 mi away)',
    image: '/images/farmer-sarah.jpg',
    coverImage: '/images/product-strawberries.jpg',
    specialty: 'Heirloom Berries, Stone Fruit & Preserves',
    category: 'Fruit & Berries',
    verified: true,
    badges: ['Eco-Certified', 'No Synthetic Sprays'],
    rating: 4.9,
    reviewCount: 43,
    story:
      'Perched on sunny south-facing slopes, specializing in alpine strawberries, heritage blackberries, and heirloom yellow peaches picked at peak sweetness.',
    markets: [
      { name: 'Greenwich Village', day: 'Sat 8AM - 2PM' },
      { name: 'Union Square', day: 'Wed & Sat' },
    ],
    crops: ['Alpine Strawberries', 'Thornless Blackberries', 'Donut Peaches', 'Wild Blueberry Jam'],
    since: 2022,
  },
];

const CATEGORIES = [
  'All Growers',
  'Vegetables & Herbs',
  'Fruit & Berries',
  'Bakery',
  'Dairy & Cheese',
  'Honey & Preserves',
];

export function Farmers() {
  useDocumentTitle('Local Farmers & Producers — MarketLink');
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Growers');
  const [organicOnly, setOrganicOnly] = useState(false);

  const filteredFarmers = useMemo(() => {
    return GUEST_FARMERS_DATA.filter((f) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = f.name.toLowerCase().includes(q);
        const matchesFarm = f.farmName.toLowerCase().includes(q);
        const matchesSpecialty = f.specialty.toLowerCase().includes(q);
        const matchesCrops = f.crops.some((c) => c.toLowerCase().includes(q));
        if (!matchesName && !matchesFarm && !matchesSpecialty && !matchesCrops) return false;
      }

      // Category
      if (selectedCategory !== 'All Growers' && f.category !== selectedCategory) {
        return false;
      }

      // Organic filter
      if (organicOnly && !f.badges.some((b) => b.includes('Organic') || b.includes('Pesticide Free'))) {
        return false;
      }

      return true;
    });
  }, [searchQuery, selectedCategory, organicOnly]);

  return (
    <div className={styles.page}>
      {/* ─── 1. HERO BANNER ────────────────────────────────────────── */}
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
              regenerative harvests within 150 miles of your neighborhood.
            </p>

            {/* Search and Filters Bar */}
            <div className={styles.searchBarWrapper}>
              <div className={styles.searchInputGroup}>
                <Search size={18} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search farmers, farm names, or specific crops (e.g. heirloom tomatoes, honey)..."
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
                <span>Certified Organic</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. CATEGORY PILLS ─────────────────────────────────────── */}
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

      {/* ─── 3. FARMERS LISTING GRID ───────────────────────────────── */}
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
            {filteredFarmers.map((farmer) => (
              <article key={farmer.id} className={styles.farmerCard}>
                {/* Card Cover Banner with Avatar */}
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

                  {/* Seasonal Crops Preview */}
                  <div className={styles.cropsPreviewRow}>
                    <span className={styles.cropsLabel}>Specialties:</span>
                    <div className={styles.cropTagsList}>
                      {farmer.crops.slice(0, 3).map((crop) => (
                        <span key={crop} className={styles.cropTag}>
                          {crop}
                        </span>
                      ))}
                      {farmer.crops.length > 3 && (
                        <span className={styles.cropMoreTag}>
                          +{farmer.crops.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Link */}
                  <div className={styles.cardFooter}>
                    <Link
                      to={`/farmers/${farmer.id}`}
                      className={styles.viewStallBtn}
                    >
                      <span>Explore Farm Stall</span>
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filteredFarmers.length === 0 && (
            <div className={styles.emptyState}>
              <Leaf size={36} className={styles.emptyIcon} />
              <h3>No farmers match your filters</h3>
              <p>Try searching for a different crop name or reset the organic filter.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All Growers');
                  setOrganicOnly(false);
                }}
                className={styles.resetBtn}
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ─── 4. PRODUCER PLEDGE CALLOUT ────────────────────────────── */}
      <section className={styles.pledgeSection}>
        <div className="container">
          <div className={styles.pledgeCard}>
            <div className={styles.pledgeText}>
              <span className={styles.pledgeTag}>OUR GUARANTEE</span>
              <h2>The 100% Producer-Only Promise</h2>
              <p>
                Unlike conventional grocery platforms, every vendor listed on MarketLink is verified
                in person. What you purchase was cultivated, baked, or crafted by the very hands
                behind the market stall.
              </p>
            </div>
            <Link to={PATHS.REGISTER} className={styles.pledgeCtaBtn}>
              <ShoppingBag size={16} />
              <span>Sign Up to Pre-Order</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Farmers;
