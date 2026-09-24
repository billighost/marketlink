import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Store,
  Leaf,
  ShieldCheck,
  Star,
  Bookmark,
  Share2,
  CheckCircle2,
  Clock,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  Info,
  ChevronRight,
  Heart,
  Truck,
  Sprout,
  Apple,
  Thermometer,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { PATHS } from '@/routes/paths';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import styles from './ProductDetail.module.css';

/* ── Sample dynamic database for guest products ────────────────────── */
const PRODUCTS_DB = {
  'prod-heirloom-tomatoes': {
    id: 'prod-heirloom-tomatoes',
    name: 'Organic Heirloom Tomato Mix',
    category: 'Vegetables & Greens',
    price: '$6.50',
    unit: '/ basket',
    numericPrice: 6.5,
    unitDetails: 'Approx. 2 lbs per basket (4-6 mixed heritage tomatoes)',
    badge: 'In Season',
    badgeType: 'season',
    isOrganic: true,
    stockText: '14 baskets available',
    stockCount: 14,
    rating: 4.9,
    reviewCount: 38,
    mainImage: '/images/product-tomatoes.jpg',
    galleryImages: [
      '/images/product-tomatoes.jpg',
      '/images/riverbend-farm.jpg',
      '/images/market-greenwich.jpg',
    ],
    farmer: {
      id: 'f-riverbend',
      name: 'Elena Vance',
      farmName: 'Riverbend Farm',
      location: 'Hudson Valley, NY',
      distance: '38 mi',
      avatar: '/images/farmer-elena.jpg',
      badge: 'Certified Organic',
      markets: 2,
    },
    pickupOptions: [
      {
        id: 'opt-greenwich',
        marketName: 'Greenwich Village Farmers Market',
        marketId: 'market-greenwich',
        day: 'Saturday, Mar 30',
        hours: '8:00 AM – 2:00 PM',
        stall: 'Stall #4',
        cutoff: 'Order by Friday 5:00 PM',
      },
      {
        id: 'opt-unionsquare',
        marketName: 'Union Square Greenmarket',
        marketId: 'market-unionsquare',
        day: 'Wednesday, Apr 3',
        hours: '8:00 AM – 6:00 PM',
        stall: 'Stall #12',
        cutoff: 'Order by Tuesday 4:00 PM',
      },
    ],
    description:
      'A colorful, hand-picked basket of vine-ripened heritage tomatoes grown in alluvial riverfront soil. Each basket contains a sun-drenched mix of Brandywine, Cherokee Purple, Green Zebra, and Gold Medal varieties. These heirlooms boast unmatched depth of flavor: rich, sweet, and perfectly balanced with delicate acidity.',
    tastingNotes:
      'Brandywine brings luscious classic beefsteak sweetness; Cherokee Purple offers deep smoky undertones; Green Zebra adds a refreshing citrusy brightness.',
    growingPractices: [
      '100% USDA Certified Organic soil biology',
      'Never sprayed with synthetic pesticides, fungicides, or chemical weed controls',
      'Naturally vine-ripened on open trellises, never gas-ripened in warehouses',
      'Harvested at dawn on the day before the market to lock in sugars and aroma',
    ],
    storageTips:
      'Store at room temperature with stems facing down away from direct sunlight. Never refrigerate fresh heirloom tomatoes, as temperatures below 55°F break down the flavor compounds and create a mealy texture.',
    relatedProducts: [
      {
        id: 'prod-butterhead-lettuce',
        name: 'Living Butterhead Lettuce',
        price: '$3.00',
        unit: '/ head',
        image: '/images/product-lettuce.jpg',
        farmer: 'Riverbend Farm',
      },
      {
        id: 'prod-alpine-strawberries',
        name: 'Organic Alpine Strawberries',
        price: '$6.50',
        unit: '/ pint',
        image: '/images/product-strawberries.jpg',
        farmer: 'Riverbend Farm',
      },
      {
        id: 'prod-wildflower-honey',
        name: 'Raw Meadow Wildflower Honey',
        price: '$12.00',
        unit: '/ 16oz',
        image: '/images/product-honey.jpg',
        farmer: 'Honey Hollow Apiary',
      },
    ],
  },
  'prod-country-sourdough': {
    id: 'prod-country-sourdough',
    name: 'Country Sourdough Loaf',
    category: 'Artisan Bakery',
    price: '$8.00',
    unit: '/ loaf',
    numericPrice: 8.0,
    unitDetails: 'Approx. 850g rustic round boule',
    badge: 'Freshly Baked',
    badgeType: 'fresh',
    isOrganic: false,
    stockText: '8 loaves available',
    stockCount: 8,
    rating: 5.0,
    reviewCount: 52,
    mainImage: '/images/product-sourdough.jpg',
    galleryImages: [
      '/images/product-sourdough.jpg',
      '/images/market-wildflower.jpg',
      '/images/market-greenwich.jpg',
    ],
    farmer: {
      id: 'f-oakmill',
      name: 'Dan & Priya Patel',
      farmName: 'Oak & Mill Artisan Bakery',
      location: 'Kingston, NY',
      distance: '45 mi',
      avatar: '/images/hero-carrots.jpg',
      badge: 'Heritage Grains',
      markets: 1,
    },
    pickupOptions: [
      {
        id: 'opt-greenwich',
        marketName: 'Greenwich Village Farmers Market',
        marketId: 'market-greenwich',
        day: 'Saturday, Mar 30',
        hours: '8:00 AM – 2:00 PM',
        stall: 'Stall #7',
        cutoff: 'Order by Thursday 6:00 PM',
      },
    ],
    description:
      'Naturally leavened 48-hour sourdough bread crafted with stone-milled regional New York flours, filtered spring water, and fine sea salt. Baked on refractory stone deck ovens for a deeply caramelized, blistered crust and an airy, custard-like crumb.',
    tastingNotes:
      'Pleasant mild lactic sourness, nutty notes from whole spelt and rye, with a deep toasty cereal finish.',
    growingPractices: [
      '100% naturally leavened with our 8-year-old wild yeast culture',
      '48-hour cold bulk fermentation for optimal gut health and digestibility',
      'Flours sourced directly from regional small grains growers in New York State',
    ],
    storageTips:
      'Keep cut-side down on a wooden cutting board for 3 days. Or store wrapped in a clean linen bread bag. Do not store in plastic.',
    relatedProducts: [
      {
        id: 'prod-wildflower-honey',
        name: 'Raw Meadow Wildflower Honey',
        price: '$12.00',
        unit: '/ 16oz',
        image: '/images/product-honey.jpg',
        farmer: 'Honey Hollow Apiary',
      },
      {
        id: 'prod-jersey-butter',
        name: 'Cultured Farmhouse Butter',
        price: '$7.50',
        unit: '/ 8oz',
        image: '/images/market-central.jpg',
        farmer: 'Meadowbrook Dairy',
      },
    ],
  },
};

const getFallbackProduct = (id) => ({
  id,
  name: 'Farm Fresh Harvest Item',
  category: 'Produce',
  price: '$5.00',
  unit: '/ item',
  numericPrice: 5.0,
  unitDetails: 'Freshly harvested regional crop',
  badge: 'Fresh Harvest',
  badgeType: 'fresh',
  isOrganic: true,
  stockText: '10 items available',
  stockCount: 10,
  rating: 4.8,
  reviewCount: 20,
  mainImage: '/images/product-tomatoes.jpg',
  galleryImages: ['/images/product-tomatoes.jpg'],
  farmer: {
    id: 'f-riverbend',
    name: 'Elena Vance',
    farmName: 'Riverbend Farm',
    location: 'Hudson Valley, NY',
    distance: '38 mi',
    avatar: '/images/farmer-elena.jpg',
    badge: 'Organic Practices',
    markets: 2,
  },
  pickupOptions: [
    {
      id: 'opt-greenwich',
      marketName: 'Greenwich Village Farmers Market',
      marketId: 'market-greenwich',
      day: 'Saturday, Mar 30',
      hours: '8:00 AM – 2:00 PM',
      stall: 'Stall #4',
      cutoff: 'Order by Friday 5:00 PM',
    },
  ],
  description:
    'Fresh local produce grown by independent regional family farms and brought to your neighborhood market.',
  tastingNotes: 'Crisp, natural, full of field-fresh sweetness.',
  growingPractices: ['Sustainable soil care', 'Harvested within 24 hours of market'],
  storageTips: 'Keep cool and consume fresh within one week.',
  relatedProducts: [],
});

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const product = PRODUCTS_DB[id] || getFallbackProduct(id);
  useDocumentTitle(`${product.name} — MarketLink`);

  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [selectedPickup, setSelectedPickup] = useState(
    product.pickupOptions[0]?.id || ''
  );
  const [quantity, setQuantity] = useState(1);
  const [reserved, setReserved] = useState(false);
  const [saved, setSaved] = useState(false);
  const [shared, setShared] = useState(false);

  const images = product.galleryImages || [product.mainImage];
  const totalPrice = (product.numericPrice * quantity).toFixed(2);

  const handleReserve = () => {
    setReserved(true);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  return (
    <div className={styles.page}>
      {/* ─── BREADCRUMB BAR ─────────────────────────────────────── */}
      <div className={styles.breadcrumbBar}>
        <div className="container">
          <div className={styles.breadcrumbs}>
            <Link to={PATHS.PRODUCTS} className={styles.crumbLink}>
              Products
            </Link>
            <span className={styles.sep}>›</span>
            <span className={styles.crumbLink}>{product.category}</span>
            <span className={styles.sep}>›</span>
            <span className={styles.crumbCurrent}>{product.name}</span>
          </div>
        </div>
      </div>

      {/* ─── HERO HEADER ───────────────────────────────────────── */}
      <section className={styles.heroHeader}>
        <div className="container">
          {/* Badge Row */}
          <div className={styles.badgeRow}>
            <span className={`${styles.badge} ${styles.badgeStatus}`}>
              <span className={styles.statusDot} />
              {product.badge}
            </span>
            {product.isOrganic && (
              <span className={`${styles.badge} ${styles.badgeOrganic}`}>
                <ShieldCheck size={13} />
                Certified Organic
              </span>
            )}
            <span className={`${styles.badge} ${styles.badgeCategory}`}>
              {product.category}
            </span>
          </div>

          {/* Title Row */}
          <div className={styles.titleRow}>
            <div className={styles.titleBlock}>
              <h1 className={styles.productTitle}>{product.name}</h1>
              <div className={styles.subtitleRow}>
                <div className={styles.ratingInline}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={14}
                      fill={i <= Math.floor(product.rating) ? '#D4850A' : 'none'}
                      color="#D4850A"
                    />
                  ))}
                  <strong>{product.rating}</strong>
                  <span>({product.reviewCount} reviews)</span>
                </div>
                <span className={styles.subtitleDot}>•</span>
                <Link
                  to={`/farmers/${product.farmer.id}`}
                  className={styles.farmerInlineLink}
                >
                  <Store size={13} />
                  {product.farmer.farmName}
                </Link>
                <span className={styles.subtitleDot}>•</span>
                <span className={styles.locationInline}>
                  <MapPin size={13} />
                  {product.farmer.location}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.headerActions}>
              <button
                type="button"
                className={`${styles.actionBtn} ${saved ? styles.actionBtnActive : ''}`}
                onClick={() => setSaved(!saved)}
              >
                <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
                <span>{saved ? 'Saved' : 'Save'}</span>
              </button>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={handleShare}
              >
                {shared ? <Check size={16} /> : <Share2 size={16} />}
                <span>{shared ? 'Copied!' : 'Share'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── MAIN CONTENT GRID ─────────────────────────────────── */}
      <section className={styles.mainSection}>
        <div className="container">
          <div className={styles.contentGrid}>
            {/* ── LEFT: IMAGE GALLERY & DETAILS ── */}
            <div className={styles.leftCol}>
              {/* Image Collage */}
              <div className={styles.imageCollage}>
                <div className={styles.mainImageWrap}>
                  <img
                    src={images[activeImgIndex]}
                    alt={product.name}
                    className={styles.mainImg}
                  />
                  <span className={styles.imgCountPill}>
                    📸 {activeImgIndex + 1}/{images.length}
                  </span>
                </div>
                {images.length > 1 && (
                  <div className={styles.sideImages}>
                    {images.slice(0, 3).map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImgIndex(idx)}
                        className={`${styles.sideImgBtn} ${
                          activeImgIndex === idx ? styles.sideImgBtnActive : ''
                        }`}
                      >
                        <img src={img} alt={`View ${idx + 1}`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Info Bar */}
              <div className={styles.quickInfoBar}>
                <div className={styles.quickInfoCell}>
                  <Clock size={16} className={styles.quickInfoIcon} />
                  <div>
                    <span className={styles.quickInfoLabel}>Next Pickup</span>
                    <strong>{product.pickupOptions[0]?.day || 'TBD'}</strong>
                  </div>
                </div>
                <div className={styles.quickInfoCell}>
                  <Store size={16} className={styles.quickInfoIcon} />
                  <div>
                    <span className={styles.quickInfoLabel}>Available At</span>
                    <strong>{product.pickupOptions.length} Market{product.pickupOptions.length !== 1 ? 's' : ''}</strong>
                  </div>
                </div>
                <div className={styles.quickInfoCell}>
                  <Leaf size={16} className={styles.quickInfoIcon} />
                  <div>
                    <span className={styles.quickInfoLabel}>Source</span>
                    <strong>{product.farmer.distance} away</strong>
                  </div>
                </div>
                <div className={styles.quickInfoCell}>
                  <ShoppingBag size={16} className={styles.quickInfoIcon} />
                  <div>
                    <span className={styles.quickInfoLabel}>Stock</span>
                    <strong>{product.stockText}</strong>
                  </div>
                </div>
              </div>

              {/* About This Product */}
              <div className={styles.contentCard}>
                <h2 className={styles.cardTitle}>
                  <Apple size={18} className={styles.cardTitleIcon} />
                  About This Product
                </h2>
                <p className={styles.cardParagraph}>{product.description}</p>

                {product.tastingNotes && (
                  <div className={styles.tastingBox}>
                    <h3 className={styles.tastingLabel}>
                      🍷 Tasting & Flavor Profile
                    </h3>
                    <p className={styles.tastingText}>{product.tastingNotes}</p>
                  </div>
                )}
              </div>

              {/* Growing Practices */}
              <div className={styles.contentCard}>
                <h2 className={styles.cardTitle}>
                  <Sprout size={18} className={styles.cardTitleIcon} />
                  Growing Practices
                </h2>
                <ul className={styles.practicesList}>
                  {product.growingPractices.map((p, idx) => (
                    <li key={idx} className={styles.practiceItem}>
                      <CheckCircle2 size={16} className={styles.practiceCheck} />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Storage Tips */}
              {product.storageTips && (
                <div className={styles.storageBanner}>
                  <div className={styles.storageIconWrap}>
                    <Thermometer size={20} />
                  </div>
                  <div>
                    <h3 className={styles.storageTitle}>Kitchen Storage Advice</h3>
                    <p className={styles.storageText}>{product.storageTips}</p>
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT: SIDEBAR (STICKY) ── */}
            <aside className={styles.rightCol}>
              {/* Farmer Card */}
              <div className={styles.farmerCard}>
                <div className={styles.farmerCardTop}>
                  <img
                    src={product.farmer.avatar}
                    alt={product.farmer.name}
                    className={styles.farmerAvatar}
                  />
                  <div className={styles.farmerInfo}>
                    <span className={styles.farmerSup}>Cultivated by</span>
                    <strong className={styles.farmerName}>{product.farmer.farmName}</strong>
                    <span className={styles.farmerMeta}>
                      <MapPin size={11} /> {product.farmer.location} · {product.farmer.distance}
                    </span>
                  </div>
                </div>
                <div className={styles.farmerBadges}>
                  <span className={styles.farmerBadgePill}>
                    <ShieldCheck size={12} /> {product.farmer.badge}
                  </span>
                  <span className={styles.farmerBadgePill}>
                    <Store size={12} /> {product.farmer.markets} Market{product.farmer.markets !== 1 ? 's' : ''}
                  </span>
                </div>
                <Link
                  to={`/farmers/${product.farmer.id}`}
                  className={styles.farmerProfileLink}
                >
                  View Farm Profile
                  <ChevronRight size={14} />
                </Link>
              </div>

              {/* Pricing Card */}
              <div className={styles.pricingCard}>
                <div className={styles.priceRow}>
                  <div className={styles.priceMain}>
                    <span className={styles.priceBig}>{product.price}</span>
                    <span className={styles.priceUnit}>{product.unit}</span>
                  </div>
                  <div className={styles.stockPill}>
                    <span className={styles.stockDot} />
                    In Stock
                  </div>
                </div>
                <p className={styles.unitDetail}>{product.unitDetails}</p>

                {/* Pickup Selector */}
                <div className={styles.pickupSection}>
                  <label className={styles.pickupLabel}>
                    <Store size={14} />
                    Select Market Pickup
                  </label>
                  <div className={styles.pickupList}>
                    {product.pickupOptions.map((opt) => (
                      <div
                        key={opt.id}
                        onClick={() => setSelectedPickup(opt.id)}
                        className={`${styles.pickupCard} ${
                          selectedPickup === opt.id ? styles.pickupCardActive : ''
                        }`}
                      >
                        <div className={styles.pickupRadioWrap}>
                          <input
                            type="radio"
                            name="market-pickup"
                            checked={selectedPickup === opt.id}
                            onChange={() => setSelectedPickup(opt.id)}
                            className={styles.pickupRadio}
                          />
                        </div>
                        <div className={styles.pickupBody}>
                          <div className={styles.pickupNameRow}>
                            <strong>{opt.marketName}</strong>
                            <span className={styles.stallPill}>{opt.stall}</span>
                          </div>
                          <p className={styles.pickupDayHours}>
                            <Calendar size={11} /> {opt.day} · {opt.hours}
                          </p>
                          <span className={styles.cutoffText}>
                            <Clock size={11} /> {opt.cutoff}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quantity & Total */}
                <div className={styles.quantitySection}>
                  <div className={styles.qtyRow}>
                    <span className={styles.qtyLabel}>Quantity</span>
                    <div className={styles.qtyPicker}>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className={styles.qtyBtn}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className={styles.qtyVal}>{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => q + 1)}
                        className={styles.qtyBtn}
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <div className={styles.totalRow}>
                    <span>Subtotal</span>
                    <strong className={styles.totalAmount}>${totalPrice}</strong>
                  </div>
                </div>

                {/* Reserve Button */}
                <button
                  type="button"
                  onClick={handleReserve}
                  className={`${styles.reserveBtn} ${
                    reserved ? styles.reserveBtnDone : ''
                  }`}
                  disabled={reserved}
                >
                  {reserved ? (
                    <>
                      <CheckCircle2 size={18} />
                      <span>Reserved for Pickup!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={18} />
                      <span>Reserve for Market Pickup</span>
                    </>
                  )}
                </button>

                {reserved && (
                  <div className={styles.successNotice}>
                    <CheckCircle2 size={15} />
                    <span>
                      Your pre-order is confirmed. We'll hold this at{' '}
                      <strong>
                        {product.pickupOptions.find((o) => o.id === selectedPickup)?.marketName || product.pickupOptions[0]?.marketName}
                      </strong>{' '}
                      on market morning!
                    </span>
                  </div>
                )}
              </div>

              {/* Trust Badges */}
              <div className={styles.trustCard}>
                <div className={styles.trustItem}>
                  <CheckCircle2 size={15} className={styles.trustIcon} />
                  <span>100% Grown by {product.farmer.farmName}</span>
                </div>
                <div className={styles.trustItem}>
                  <Clock size={15} className={styles.trustIcon} />
                  <span>Harvested morning before market pickup</span>
                </div>
                <div className={styles.trustItem}>
                  <Truck size={15} className={styles.trustIcon} />
                  <span>Farm-to-market, zero middlemen</span>
                </div>
                <div className={styles.trustItem}>
                  <ShieldCheck size={15} className={styles.trustIcon} />
                  <span>MarketLink Freshness Guarantee</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ─── RELATED PRODUCTS ──────────────────────────────────── */}
      {product.relatedProducts && product.relatedProducts.length > 0 && (
        <section className={styles.relatedSection}>
          <div className="container">
            <div className={styles.relatedHeader}>
              <h2 className={styles.relatedTitle}>
                More From {product.farmer.farmName}
              </h2>
              <Link
                to={`/farmers/${product.farmer.id}`}
                className={styles.viewStallLink}
              >
                View Full Stall
                <ChevronRight size={15} />
              </Link>
            </div>

            <div className={styles.relatedGrid}>
              {product.relatedProducts.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/products/${rel.id}`}
                  className={styles.relatedCard}
                >
                  <div className={styles.relatedImgWrap}>
                    <img src={rel.image} alt={rel.name} className={styles.relatedImg} />
                  </div>
                  <div className={styles.relatedBody}>
                    <span className={styles.relatedFarmer}>{rel.farmer}</span>
                    <h4 className={styles.relatedName}>{rel.name}</h4>
                    <p className={styles.relatedPrice}>
                      {rel.price} <span>{rel.unit}</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default ProductDetail;
