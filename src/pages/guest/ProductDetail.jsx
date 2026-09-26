import React, { useState, useEffect } from 'react';
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
  Clock,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  Sparkles,
} from 'lucide-react';
import { getProductDetail, getRelatedProducts, getProductReviews } from '@/api/catalog';
import { formatPrice, formatDate } from '@/utils/format';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { PATHS } from '@/routes/paths';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import styles from './ProductDetail.module.css';

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [quantity, setQuantity] = useState(1);
  const [saved, setSaved] = useState(false);
  const [shared, setShared] = useState(false);

  useDocumentTitle(product ? `${product.name} — MarketLink` : 'Harvest Details — MarketLink');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([
      getProductDetail(id).catch((err) => {
        throw err;
      }),
      getRelatedProducts(id).catch(() => []),
      getProductReviews(id).catch(() => []),
    ])
      .then(([p, r, revs]) => {
        if (!active) return;
        setProduct(p);
        setRelated(Array.isArray(r) ? r : r?.items || r?.data || []);
        setReviews(Array.isArray(revs) ? revs : revs?.items || revs?.data || []);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Product not found');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      add(product.id || product._id, { farmerId: product.farmer?.id });
    }
    showToast({
      message: `Added ${quantity} ${product.name} to your basket`,
      type: 'success',
      action: 'View Basket',
      onAction: () => navigate('/buyer/basket'),
    });
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className="container" style={{ padding: '60px 20px' }}>
          <div style={{ height: 30, width: '30%', background: '#ede8df', borderRadius: 8, marginBottom: 20 }} />
          <div style={{ height: 200, background: '#ede8df', borderRadius: 16, marginBottom: 30 }} />
          <div style={{ height: 400, background: '#ede8df', borderRadius: 16 }} />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className={styles.page}>
        <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', color: '#4a1521' }}>Harvest Item Not Found</h1>
          <p style={{ color: '#4a433b', margin: '16px 0 24px' }}>
            {error || 'This produce item could not be loaded or is currently out of stock.'}
          </p>
          <Link
            to={PATHS.PRODUCTS}
            style={{
              display: 'inline-flex',
              padding: '10px 24px',
              backgroundColor: '#541722',
              color: '#ffffff',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Browse all products
          </Link>
        </div>
      </div>
    );
  }

  const farmName = product.farmer?.stallName || product.farmer?.name || 'Local Farm';
  const unitPriceCents = product.priceCents || (product.price ? product.price * 100 : 0);
  const totalCents = unitPriceCents * quantity;

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
            <span className={styles.crumbLink}>
              {typeof product.category === 'object' ? (product.category?.name || 'Produce') : (product.category || 'Produce')}
            </span>
            <span className={styles.sep}>›</span>
            <span className={styles.crumbCurrent}>{product.name}</span>
          </div>
        </div>
      </div>

      {/* ─── HERO HEADER ───────────────────────────────────────── */}
      <section className={styles.heroHeader}>
        <div className="container">
          <div className={styles.badgeRow}>
            <span className={`${styles.badge} ${styles.badgeStatus}`}>
              <span className={styles.statusDot} />
              {product.availability === 'in_stock' ? 'In Season' : 'Available'}
            </span>
            <span className={`${styles.badge} ${styles.badgeCategory}`}>
              {typeof product.category === 'object' ? (product.category?.name || 'Harvest') : (product.category || 'Harvest')}
            </span>
          </div>

          <div className={styles.titleRow}>
            <div className={styles.titleBlock}>
              <h1 className={styles.productTitle}>{product.name}</h1>
              <div className={styles.subtitleRow}>
                <div className={styles.ratingInline}>
                  <Star size={14} fill="#D4850A" color="#D4850A" />
                  <strong>4.9</strong>
                  <span>(Fresh harvest)</span>
                </div>
                <span className={styles.subtitleDot}>•</span>
                {product.farmer && (
                  <Link
                    to={`/farmers/${product.farmer.id || product.farmer._id}`}
                    className={styles.farmerInlineLink}
                  >
                    <Store size={13} />
                    {farmName}
                  </Link>
                )}
              </div>
            </div>

            <div className={styles.headerActions}>
              <button
                type="button"
                className={`${styles.actionBtn} ${saved ? styles.actionBtnActive : ''}`}
                onClick={() => setSaved(!saved)}
                aria-label="Save product"
              >
                <Bookmark size={16} fill={saved ? '#541722' : 'none'} />
                <span>{saved ? 'Saved' : 'Save'}</span>
              </button>

              <button
                type="button"
                className={styles.actionBtn}
                onClick={handleShare}
                aria-label="Share product"
              >
                {shared ? <Check size={16} color="#175e21" /> : <Share2 size={16} />}
                <span>{shared ? 'Copied' : 'Share'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── MAIN PRODUCT GRID ─────────────────────────────────── */}
      <div className="container" style={{ paddingBottom: '80px' }}>
        <div className={styles.mainGrid}>
          {/* Left Column: Image & Details */}
          <div className={styles.leftCol}>
            <div className={styles.galleryCard}>
              <div className={styles.mainImgWrap}>
                <img
                  src={product.image || '/images/product-tomatoes.jpg'}
                  alt={product.name}
                  className={styles.mainImg}
                />
              </div>
            </div>

            {/* Description Card */}
            <div className={styles.infoCard}>
              <h2 className={styles.cardHeading}>About This Harvest</h2>
              <p className={styles.descriptionText}>
                {product.description ||
                  `Grown with care by ${farmName}. Harvested fresh at dawn and packed in a clean paper tote for your Saturday market pickup.`}
              </p>

              <div className={styles.growerBox}>
                <div className={styles.growerHeader}>
                  <Store size={18} className={styles.growerIcon} />
                  <div>
                    <h3 className={styles.growerTitle}>Grown by {farmName}</h3>
                    <p className={styles.growerSub}>{product.farmer?.bio || 'Local farm producer'}</p>
                  </div>
                </div>
                {product.farmer && (
                  <Link to={`/farmers/${product.farmer.id || product.farmer._id}`} className={styles.growerLink}>
                    <span>View Farm Stall Profile</span>
                    <ArrowLeft size={13} style={{ transform: 'rotate(180deg)' }} />
                  </Link>
                )}
              </div>
            </div>

            {/* Customer Reviews Card */}
            {reviews.length > 0 && (
              <div className={styles.infoCard}>
                <h2 className={styles.cardHeading}>Customer Reviews ({reviews.length})</h2>
                <div className={styles.reviewsList}>
                  {reviews.map((r, idx) => (
                    <div key={r.id || idx} style={{ borderBottom: '1px solid #ebdcd5', padding: '12px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <strong>{r.customerName || 'Customer'}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#6e655c' }}>
                          {formatDate(r.createdAt || new Date())}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.88rem', color: '#4a433b' }}>
                        {r.comment || r.text || 'Excellent freshness!'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Pre-Order Box */}
          <aside className={styles.rightCol}>
            <div className={styles.orderBox}>
              <div className={styles.priceRow}>
                <span className={styles.bigPrice}>{formatPrice(unitPriceCents)}</span>
                <span className={styles.priceUnit}>/ {product.unit || 'each'}</span>
              </div>

              <div className={styles.pickupTimeBox}>
                <Clock size={16} className={styles.pickupClockIcon} />
                <div>
                  <strong>Pickup this Saturday</strong>
                  <p>Order during the week, collect directly at the stall.</p>
                </div>
              </div>

              {/* Quantity Stepper */}
              <div className={styles.quantitySection}>
                <label className={styles.qtyLabel}>Quantity</label>
                <div className={styles.stepperWrap}>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className={styles.stepperBtn}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={15} />
                  </button>
                  <span className={styles.stepperVal}>{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(product.quantityAvailable || 20, q + 1))}
                    disabled={quantity >= (product.quantityAvailable || 20)}
                    className={styles.stepperBtn}
                    aria-label="Increase quantity"
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>

              {/* Total Calculation */}
              <div className={styles.totalCalcRow}>
                <span>Total to pay at pickup</span>
                <strong className={styles.totalVal}>{formatPrice(totalCents)}</strong>
              </div>

              {/* Pre-Order Button */}
              <button
                type="button"
                onClick={handleAddToCart}
                className={styles.preorderBtn}
              >
                <ShoppingBag size={18} />
                <span>Pre-Order for Saturday · {formatPrice(totalCents)}</span>
              </button>

              <div className={styles.trustFooter}>
                <Sparkles size={14} color="#8c3f20" />
                <span>No upfront charge. You inspect your order and pay at the stall.</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
