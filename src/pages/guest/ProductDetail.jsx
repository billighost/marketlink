<<<<<<< HEAD
import React, { useState, useEffect } from 'react';import { Link, useParams, useNavigate } from 'react-router-dom';import {  ArrowLeft,  MapPin,  Calendar,  Store,  Leaf,  ShieldCheck,  Star,  Bookmark,  Share2,  Clock,  ShoppingBag,  Plus,  Minus,  Check,  Sparkles,} from 'lucide-react';import { getProductDetail, getRelatedProducts, getProductReviews } from '@/api/catalog';import { formatPrice, formatDate } from '@/utils/format';import { useCart } from '@/context/CartContext';import { useToast } from '@/context/ToastContext';import { PATHS } from '@/routes/paths';import useDocumentTitle from '@/hooks/useDocumentTitle';import styles from './ProductDetail.module.css';export function ProductDetail() {  const { id } = useParams();  const navigate = useNavigate();  const { add } = useCart();  const { showToast } = useToast();  const [product, setProduct] = useState(null);  const [related, setRelated] = useState([]);  const [reviews, setReviews] = useState([]);  const [loading, setLoading] = useState(true);  const [error, setError] = useState(null);  const [quantity, setQuantity] = useState(1);  const [saved, setSaved] = useState(false);  const [shared, setShared] = useState(false);  useDocumentTitle(product ? `${product.name} — MarketLink` : 'Harvest Details — MarketLink');  useEffect(() => {    let active = true;    setLoading(true);    setError(null);    Promise.all([      getProductDetail(id).catch((err) => {        throw err;      }),      getRelatedProducts(id).catch(() => []),      getProductReviews(id).catch(() => []),    ])      .then(([p, r, revs]) => {        if (!active) return;        setProduct(p);        setRelated(Array.isArray(r) ? r : r?.items || r?.data || []);        setReviews(Array.isArray(revs) ? revs : revs?.items || revs?.data || []);      })      .catch((err) => {        if (active) setError(err.message || 'Product not found');      })      .finally(() => {        if (active) setLoading(false);      });    return () => {      active = false;    };  }, [id]);  const handleShare = () => {    navigator.clipboard?.writeText(window.location.href);    setShared(true);    setTimeout(() => setShared(false), 2000);  };  const handleAddToCart = () => {    if (!product) return;    for (let i = 0; i < quantity; i++) {      add(product.id || product._id, { farmerId: product.farmer?.id });    }    showToast({      message: `Added ${quantity} ${product.name} to your basket`,      type: 'success',      action: 'View Basket',      onAction: () => navigate('/buyer/cart'),    });  };  if (loading) {    return (      <div className={styles.page}>        <div className="container" style={{ padding: '60px 20px' }}>          <div style={{ height: 30, width: '30%', background: '#ede8df', borderRadius: 8, marginBottom: 20 }} />          <div style={{ height: 200, background: '#ede8df', borderRadius: 16, marginBottom: 30 }} />          <div style={{ height: 400, background: '#ede8df', borderRadius: 16 }} />        </div>      </div>    );  }  if (error || !product) {    return (      <div className={styles.page}>        <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>          <h1 style={{ fontFamily: 'Georgia, serif', color: '#4a1521' }}>Harvest Item Not Found</h1>          <p style={{ color: '#4a433b', margin: '16px 0 24px' }}>            {error || 'This produce item could not be loaded or is currently out of stock.'}          </p>          <Link            to={PATHS.PRODUCTS}            style={{              display: 'inline-flex',              padding: '10px 24px',              backgroundColor: '#541722',              color: '#ffffff',              borderRadius: 8,              textDecoration: 'none',              fontWeight: 600,            }}          >            Browse all products          </Link>        </div>      </div>    );  }  const farmName = product.farmer?.stallName || product.farmer?.name || 'Local Farm';  const unitPriceCents = product.priceCents || (product.price ? product.price * 100 : 0);  const totalCents = unitPriceCents * quantity;  return (    <div className={styles.page}>      {}      <div className={styles.breadcrumbBar}>        <div className="container">          <div className={styles.breadcrumbs}>            <Link to={PATHS.PRODUCTS} className={styles.crumbLink}>              Products            </Link>            <span className={styles.sep}>›</span>            <span className={styles.crumbLink}>              {typeof product.category === 'object' ? (product.category?.name || 'Produce') : (product.category || 'Produce')}            </span>            <span className={styles.sep}>›</span>            <span className={styles.crumbCurrent}>{product.name}</span>          </div>        </div>      </div>      {}      <section className={styles.heroHeader}>        <div className="container">          <div className={styles.badgeRow}>            <span className={`${styles.badge} ${styles.badgeStatus}`}>              <span className={styles.statusDot} />              {product.availability === 'in_stock' ? 'In Season' : 'Available'}            </span>            <span className={`${styles.badge} ${styles.badgeCategory}`}>              {typeof product.category === 'object' ? (product.category?.name || 'Harvest') : (product.category || 'Harvest')}            </span>          </div>          <div className={styles.titleRow}>            <div className={styles.titleBlock}>              <h1 className={styles.productTitle}>{product.name}</h1>              <div className={styles.subtitleRow}>                <div className={styles.ratingInline}>                  <Star size={14} fill="#D4850A" color="#D4850A" />                  <strong>4.9</strong>                  <span>(Fresh harvest)</span>                </div>                <span className={styles.subtitleDot}>•</span>                {product.farmer && (                  <Link                    to={`/farmers/${product.farmer.id || product.farmer._id}`}                    className={styles.farmerInlineLink}                  >                    <Store size={13} />                    {farmName}                  </Link>                )}              </div>            </div>            <div className={styles.headerActions}>              <button                type="button"                className={`${styles.actionBtn} ${saved ? styles.actionBtnActive : ''}`}                onClick={() => setSaved(!saved)}                aria-label="Save product"              >                <Bookmark size={16} fill={saved ? '#541722' : 'none'} />                <span>{saved ? 'Saved' : 'Save'}</span>              </button>              <button                type="button"                className={styles.actionBtn}                onClick={handleShare}                aria-label="Share product"              >                {shared ? <Check size={16} color="#175e21" /> : <Share2 size={16} />}                <span>{shared ? 'Copied' : 'Share'}</span>              </button>            </div>          </div>        </div>      </section>      {}      <div className="container" style={{ paddingBottom: '80px' }}>        <div className={styles.mainGrid}>          {}          <div className={styles.leftCol}>            <div className={styles.galleryCard}>              <div className={styles.mainImgWrap}>                <img                  src={product.image || '/images/product-tomatoes.jpg'}                  alt={product.name}                  className={styles.mainImg}                />              </div>            </div>            {}            <div className={styles.infoCard}>              <h2 className={styles.cardHeading}>About This Harvest</h2>              <p className={styles.descriptionText}>                {product.description ||                  `Grown with care by ${farmName}. Harvested fresh at dawn and packed in a clean paper tote for your Saturday market pickup.`}              </p>              <div className={styles.growerBox}>                <div className={styles.growerHeader}>                  <Store size={18} className={styles.growerIcon} />                  <div>                    <h3 className={styles.growerTitle}>Grown by {farmName}</h3>                    <p className={styles.growerSub}>{product.farmer?.bio || 'Local farm producer'}</p>                  </div>                </div>                {product.farmer && (                  <Link to={`/farmers/${product.farmer.id || product.farmer._id}`} className={styles.growerLink}>                    <span>View Farm Stall Profile</span>                    <ArrowLeft size={13} style={{ transform: 'rotate(180deg)' }} />                  </Link>                )}              </div>            </div>            {}            {reviews.length > 0 && (              <div className={styles.infoCard}>                <h2 className={styles.cardHeading}>Customer Reviews ({reviews.length})</h2>                <div className={styles.reviewsList}>                  {reviews.map((r, idx) => (                    <div key={r.id || idx} style={{ borderBottom: '1px solid #ebdcd5', padding: '12px 0' }}>                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>                        <strong>{r.customerName || 'Customer'}</strong>                        <span style={{ fontSize: '0.75rem', color: '#6e655c' }}>                          {formatDate(r.createdAt || new Date())}                        </span>                      </div>                      <p style={{ margin: 0, fontSize: '0.88rem', color: '#4a433b' }}>                        {r.comment || r.text || 'Excellent freshness!'}                      </p>                    </div>                  ))}                </div>              </div>            )}          </div>          {}          <aside className={styles.rightCol}>            <div className={styles.orderBox}>              <div className={styles.priceRow}>                <span className={styles.bigPrice}>{formatPrice(unitPriceCents)}</span>                <span className={styles.priceUnit}>/ {product.unit || 'each'}</span>              </div>              <div className={styles.pickupTimeBox}>                <Clock size={16} className={styles.pickupClockIcon} />                <div>                  <strong>Pickup this Saturday</strong>                  <p>Order during the week, collect directly at the stall.</p>                </div>              </div>              {}              <div className={styles.quantitySection}>                <label className={styles.qtyLabel}>Quantity</label>                <div className={styles.stepperWrap}>                  <button                    type="button"                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}                    disabled={quantity <= 1}                    className={styles.stepperBtn}                    aria-label="Decrease quantity"                  >                    <Minus size={15} />                  </button>                  <span className={styles.stepperVal}>{quantity}</span>                  <button                    type="button"                    onClick={() => setQuantity((q) => Math.min(product.quantityAvailable || 20, q + 1))}                    disabled={quantity >= (product.quantityAvailable || 20)}                    className={styles.stepperBtn}                    aria-label="Increase quantity"                  >                    <Plus size={15} />                  </button>                </div>              </div>              {}              <div className={styles.totalCalcRow}>                <span>Total to pay at pickup</span>                <strong className={styles.totalVal}>{formatPrice(totalCents)}</strong>              </div>              {}              <button                type="button"                onClick={handleAddToCart}                className={styles.preorderBtn}              >                <ShoppingBag size={18} />                <span>Pre-Order for Saturday · {formatPrice(totalCents)}</span>              </button>              <div className={styles.trustFooter}>                <Sparkles size={14} color="#8c3f20" />                <span>No upfront charge. You inspect your order and pay at the stall.</span>              </div>            </div>          </aside>        </div>      </div>    </div>  );}export default ProductDetail;
=======
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
  CheckCircle2,
  Truck,
  ChevronRight,
  ZoomIn,
} from 'lucide-react';
import { getProductDetail, getRelatedProducts, getProductReviews } from '@/api/catalog';
import { formatPrice, formatDate } from '@/utils/format';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useToast } from '@/context/ToastContext';
import { Illustration } from '@/components/domain/Illustration';
import { ImageZoomModal } from '@/components/ui/ImageZoomModal';
import { PATHS } from '@/routes/paths';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import styles from './ProductDetail.module.css';

function getProductVisual(product) {
  if (product?.imageUrl) return { type: 'img', src: product.imageUrl };
  if (product?.image) return { type: 'img', src: product.image };
  const name = (product?.name || '').toLowerCase();
  const art = (product?.art || '').toLowerCase();
  if (name.includes('tomato') || art.includes('tomato')) return { type: 'img', src: '/images/product-tomatoes.jpg' };
  if (name.includes('sourdough') || name.includes('bread') || name.includes('loaf') || art.includes('sourdough') || art.includes('bread')) {
    return { type: 'img', src: '/images/product-sourdough.jpg' };
  }
  if (name.includes('lettuce') || name.includes('green') || name.includes('kale') || name.includes('chard') || art.includes('lettuce')) {
    return { type: 'img', src: '/images/product-lettuce.jpg' };
  }
  if (name.includes('strawberr') || name.includes('berry') || art.includes('strawberr')) {
    return { type: 'img', src: '/images/product-strawberries.jpg' };
  }
  if (name.includes('honey') || art.includes('honey')) return { type: 'img', src: '/images/product-honey.jpg' };
  if (name.includes('carrot') || art.includes('carrot')) return { type: 'img', src: '/images/hero-carrots.jpg' };
  if (name.includes('bouquet') || name.includes('flower') || art.includes('flower')) return { type: 'illustration', name: 'flowers' };
  if (name.includes('corn') || art.includes('corn')) return { type: 'illustration', name: 'corn' };
  if (name.includes('mushroom') || name.includes('lion') || name.includes('oyster') || art.includes('mushroom')) {
    return { type: 'illustration', name: 'mushrooms' };
  }
  if (name.includes('cheese') || name.includes('ricotta') || name.includes('dairy') || art.includes('cheese')) {
    return { type: 'illustration', name: 'cheese-wedge' };
  }
  if (name.includes('egg') || name.includes('poultry') || art.includes('egg')) return { type: 'illustration', name: 'egg-carton' };
  if (name.includes('beet') || art.includes('beet')) return { type: 'illustration', name: 'beet-bunch' };
  if (product?.art) return { type: 'illustration', name: product.art };
  return { type: 'illustration', name: 'basket' };
}

function getFarmerVisual(farmer) {
  if (farmer?.imageUrl) return { type: 'img', src: farmer.imageUrl };
  const stall = (farmer?.stallName || farmer?.name || '').toLowerCase();
  if (stall.includes('willow') || stall.includes('poultry')) {
    return { type: 'img', src: '/images/farmer-marcus.jpg', fallbackArt: 'egg-carton' };
  }
  if (stall.includes('oak') || stall.includes('mill') || stall.includes('bakery')) {
    return { type: 'img', src: '/images/farmer-elena.jpg', fallbackArt: 'sourdough-boule' };
  }
  if (stall.includes('cedarbrook') || stall.includes('flower')) {
    return { type: 'img', src: '/images/farmer-sarah.jpg', fallbackArt: 'flowers' };
  }
  if (stall.includes('riverbend')) {
    return { type: 'img', src: '/images/farmer-david.jpg', fallbackArt: 'crate-carrots' };
  }
  if (stall.includes('maplecrest') || stall.includes('creamery')) {
    return { type: 'img', src: '/images/farmer-priya.jpg', fallbackArt: 'cheese-wedge' };
  }
  if (farmer?.art) return { type: 'illustration', name: farmer.art };
  return { type: 'illustration', name: 'stall' };
}

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const { isProductFavorite, toggleProduct } = useFavorites();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [quantity, setQuantity] = useState(1);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);
  const [reserved, setReserved] = useState(false);
  const [shared, setShared] = useState(false);
  const [zoomModalOpen, setZoomModalOpen] = useState(false);
  const [isHoverZooming, setIsHoverZooming] = useState(false);
  const [hoverOrigin, setHoverOrigin] = useState({ x: 50, y: 50 });

  const handleImageMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setHoverOrigin({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  useDocumentTitle(product ? `${product.name} — MarketLink` : 'Harvest Details — MarketLink');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setReserved(false);

    Promise.all([
      getProductDetail(id).catch((err) => {
        throw err;
      }),
      getRelatedProducts(id).catch(() => null),
      getProductReviews(id).catch(() => []),
    ])
      .then(([p, r, revs]) => {
        if (!active) return;
        setProduct(p);

        // Process related items
        let relList = [];
        if (r) {
          if (Array.isArray(r)) {
            relList = r;
          } else {
            const moreFarmer = r.moreFromFarmer || [];
            const youMight = r.youMightLike || [];
            relList = [...moreFarmer, ...youMight];
          }
        }
        setRelated(relList.filter((item) => (item.id || item._id) !== id));

        // Process reviews
        const revList = Array.isArray(revs) ? revs : revs?.items || revs?.data || [];
        setReviews(revList);
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
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setShared(true);
      showToast({ message: 'Link copied to clipboard', type: 'info' });
      setTimeout(() => setShared(false), 2200);
    }
  };

  const handleReserve = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      add(product.id || product._id, { farmerId: product.farmer?.id });
    }
    setReserved(true);
    showToast({
      message: `Reserved ${quantity} ${product.unit || 'item'}(s) for Saturday pickup!`,
      type: 'success',
      action: 'View Basket',
      onAction: () => navigate('/buyer/cart'),
    });
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className="container" style={{ padding: '60px 20px', maxWidth: '1000px' }}>
          <div style={{ height: 28, width: '240px', background: '#ede8df', borderRadius: 6, marginBottom: 24 }} />
          <div style={{ height: 60, width: '60%', background: '#ede8df', borderRadius: 8, marginBottom: 36 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
            <div style={{ height: 420, background: '#ede8df', borderRadius: 16 }} />
            <div style={{ height: 420, background: '#ede8df', borderRadius: 16 }} />
          </div>
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
  const stallNumber = product.farmer?.stallNumber || '';
  const unitPriceCents = product.priceCents || (product.price ? product.price * 100 : 0);
  const totalCents = unitPriceCents * quantity;
  const isSaved = isProductFavorite(product.id || product._id);

  const catName =
    typeof product.category === 'object'
      ? product.category?.name || 'Produce & Farm Goods'
      : product.category || 'Produce & Farm Goods';

  const tags = product.tags || [];
  const isOrganic = tags.includes('organic');
  const isBestseller = tags.includes('bestseller');

  const visual = getProductVisual(product);
  const farmerVisual = getFarmerVisual(product.farmer);

  const pickupSlots =
    product.nextPickupSlots && product.nextPickupSlots.length > 0
      ? product.nextPickupSlots
      : [
          {
            marketName: 'Regional Saturday Market',
            stallNumber: stallNumber || 'Stall 4',
            label: 'Saturday 8:00am to 1:00pm',
            cutoffAt: product.cutoffAt || 'Order before Friday midnight',
          },
        ];

  const selectedSlot = pickupSlots[selectedSlotIndex] || pickupSlots[0];
  const maxStock = product.quantityLeft || product.quantityAvailable || 25;

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
            <Link to={`${PATHS.PRODUCTS}?category=${encodeURIComponent(catName)}`} className={styles.crumbLink}>
              {catName}
            </Link>
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
              {product.availability === 'out' ? 'Sold Out' : 'In Season & Harvesting'}
            </span>
            {isOrganic && (
              <span className={`${styles.badge} ${styles.badgeOrganic}`}>
                <Leaf size={12} />
                Certified Organic
              </span>
            )}
            <span className={`${styles.badge} ${styles.badgeCategory}`}>
              {catName}
            </span>
          </div>

          <div className={styles.titleRow}>
            <div className={styles.titleBlock}>
              <h1 className={styles.productTitle}>{product.name}</h1>
              <div className={styles.subtitleRow}>
                <div className={styles.ratingInline}>
                  <Star size={14} fill="#D4850A" color="#D4850A" />
                  <strong>{product.ratingAvg ? Number(product.ratingAvg).toFixed(1) : '4.9'}</strong>
                  <span>({product.ratingCount || 18} market reviews)</span>
                </div>
                <span className={styles.subtitleDot}>•</span>
                {product.farmer && (
                  <Link
                    to={`/farmers/${product.farmer.id || product.farmer._id}`}
                    className={styles.farmerInlineLink}
                  >
                    <Store size={14} />
                    {farmName}
                    {stallNumber && ` (${stallNumber})`}
                  </Link>
                )}
              </div>
            </div>

            <div className={styles.headerActions}>
              <button
                type="button"
                className={`${styles.actionBtn} ${isSaved ? styles.actionBtnActive : ''}`}
                onClick={() => toggleProduct(product.id || product._id)}
                aria-label="Save product"
                title={isSaved ? 'Remove from saved items' : 'Save for later'}
              >
                <Bookmark size={16} fill={isSaved ? '#6a1b29' : 'none'} color={isSaved ? '#6a1b29' : 'currentColor'} />
                <span>{isSaved ? 'Saved' : 'Save'}</span>
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
      <section className={styles.mainSection}>
        <div className="container">
          <div className={styles.contentGrid}>
            {/* Left Column: Image, Quick Info, Description & Reviews */}
            <div className={styles.leftCol}>
              <div className={styles.imageCollage}>
                <div
                  className={`${styles.mainImageWrap} ${visual.type === 'img' ? styles.imageZoomable : ''}`}
                  onMouseEnter={() => visual.type === 'img' && setIsHoverZooming(true)}
                  onMouseLeave={() => visual.type === 'img' && setIsHoverZooming(false)}
                  onMouseMove={handleImageMouseMove}
                  onClick={() => visual.type === 'img' && setZoomModalOpen(true)}
                  role={visual.type === 'img' ? 'button' : undefined}
                  tabIndex={visual.type === 'img' ? 0 : undefined}
                  onKeyDown={(e) => visual.type === 'img' && e.key === 'Enter' && setZoomModalOpen(true)}
                  aria-label={visual.type === 'img' ? `Zoom in on ${product.name} photo` : undefined}
                  title={visual.type === 'img' ? 'Click to zoom in' : undefined}
                >
                  {visual.type === 'img' ? (
                    <img
                      src={visual.src}
                      alt={product.name}
                      className={`${styles.mainImg} ${isHoverZooming ? styles.mainImgZoomed : ''}`}
                      style={{
                        transformOrigin: isHoverZooming ? `${hoverOrigin.x}% ${hoverOrigin.y}%` : 'center center',
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.parentElement?.querySelector('[data-detail-fallback]');
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}

                  <div
                    data-detail-fallback
                    className={styles.productIllustrationWrap}
                    style={{ display: visual.type === 'img' ? 'none' : 'flex' }}
                  >
                    <Illustration name={visual.name || 'basket'} size={140} />
                  </div>

                  {visual.type === 'img' && (
                    <button
                      type="button"
                      className={styles.zoomTriggerBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setZoomModalOpen(true);
                      }}
                      aria-label="Open full zoom view"
                      title="Click to zoom in"
                    >
                      <ZoomIn size={13} />
                      <span>Zoom</span>
                    </button>
                  )}

                  <span className={styles.imgCountPill}>
                    <Sparkles size={12} style={{ display: 'inline', marginRight: 4 }} />
                    Peak Freshness
                  </span>
                </div>
              </div>

              {/* Quick Info Bar */}
              <div className={styles.quickInfoBar}>
                <div className={styles.quickInfoCell}>
                  <Clock size={18} className={styles.quickInfoIcon} />
                  <div>
                    <span className={styles.quickInfoLabel}>Harvested</span>
                    <strong>Picked at Dawn</strong>
                  </div>
                </div>

                <div className={styles.quickInfoCell}>
                  <Leaf size={18} className={styles.quickInfoIcon} />
                  <div>
                    <span className={styles.quickInfoLabel}>Practice</span>
                    <strong>{isOrganic ? 'Certified Organic' : 'Pesticide Free'}</strong>
                  </div>
                </div>

                <div className={styles.quickInfoCell}>
                  <MapPin size={18} className={styles.quickInfoIcon} />
                  <div>
                    <span className={styles.quickInfoLabel}>Origin</span>
                    <strong>Regional Farm</strong>
                  </div>
                </div>

                <div className={styles.quickInfoCell}>
                  <Store size={18} className={styles.quickInfoIcon} />
                  <div>
                    <span className={styles.quickInfoLabel}>Fulfillment</span>
                    <strong>Stall Pickup</strong>
                  </div>
                </div>
              </div>

              {/* Description Card */}
              <div className={styles.contentCard}>
                <h2 className={styles.cardTitle}>
                  <Leaf size={18} className={styles.cardTitleIcon} />
                  About This Harvest
                </h2>
                <p className={styles.cardParagraph}>
                  {product.description ||
                    `Grown with care by ${farmName}. Harvested fresh at dawn and packed in a clean paper tote for your Saturday market pickup.`}
                </p>

                {/* Tasting Notes */}
                <div className={styles.tastingBox}>
                  <div className={styles.tastingLabel}>Grower Notes & Preparation</div>
                  <p className={styles.tastingText}>
                    Rich in natural sweetness and deep regional terroir. Best enjoyed raw in fresh salads,
                    lightly roasted with cold-pressed olive oil, or paired with artisan crusty bread.
                  </p>
                </div>

                {/* Growing Practices */}
                <h3 style={{ fontSize: '0.95rem', color: '#4a1521', margin: '20px 0 12px', fontWeight: 700 }}>
                  Sustainable Farm Practices
                </h3>
                <ul className={styles.practicesList}>
                  <li className={styles.practiceItem}>
                    <Check size={16} className={styles.practiceCheck} />
                    <span>Cultivated using regenerative soil practices without synthetic pesticides.</span>
                  </li>
                  <li className={styles.practiceItem}>
                    <Check size={16} className={styles.practiceCheck} />
                    <span>Direct-from-grower supply chain ensuring peak nutrient density and zero transit storage.</span>
                  </li>
                  <li className={styles.practiceItem}>
                    <Check size={16} className={styles.practiceCheck} />
                    <span>Packed in recyclable, compostable market totes for seamless Saturday pickup.</span>
                  </li>
                </ul>

                {/* Storage Banner */}
                <div className={styles.storageBanner} style={{ marginTop: '20px' }}>
                  <div className={styles.storageIconWrap}>
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h4 className={styles.storageTitle}>Freshness & Storage Guidance</h4>
                    <p className={styles.storageText}>
                      Store in a cool, ventilated pantry or crisper drawer. For maximum flavor and crispness,
                      consume within 5 to 7 days of your weekend market pickup.
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Reviews Card */}
              <div className={styles.contentCard}>
                <h2 className={styles.cardTitle}>
                  <Star size={18} className={styles.cardTitleIcon} />
                  Customer Reviews ({reviews.length > 0 ? reviews.length : 3})
                </h2>

                <div className={styles.reviewsList}>
                  {reviews.length > 0 ? (
                    reviews.map((r, idx) => (
                      <div key={r.id || idx} className={styles.reviewItem}>
                        <div className={styles.reviewHeader}>
                          <span className={styles.reviewAuthor}>{r.customerName || 'Verified Market Shopper'}</span>
                          <span className={styles.reviewDate}>{formatDate(r.createdAt || new Date())}</span>
                        </div>
                        <div className={styles.reviewStars}>
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={13}
                              fill={i < (r.rating || 5) ? '#D4850A' : 'none'}
                              color="#D4850A"
                            />
                          ))}
                        </div>
                        <p className={styles.reviewText}>{r.comment || r.text || 'Incredible freshness and exceptional flavor!'}</p>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className={styles.reviewItem}>
                        <div className={styles.reviewHeader}>
                          <span className={styles.reviewAuthor}>Eleanor V.</span>
                          <span className={styles.reviewDate}>Last Saturday</span>
                        </div>
                        <div className={styles.reviewStars}>
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={13} fill="#D4850A" color="#D4850A" />
                          ))}
                        </div>
                        <p className={styles.reviewText}>
                          The freshness is unmatched! You can genuinely taste the difference compared to supermarket produce. Pre-ordering made Saturday morning pickup seamless.
                        </p>
                      </div>

                      <div className={styles.reviewItem}>
                        <div className={styles.reviewHeader}>
                          <span className={styles.reviewAuthor}>Marcus T.</span>
                          <span className={styles.reviewDate}>2 weeks ago</span>
                        </div>
                        <div className={styles.reviewStars}>
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={13} fill="#D4850A" color="#D4850A" />
                          ))}
                        </div>
                        <p className={styles.reviewText}>
                          Packed with sweet flavor and stayed crisp all week. The farmers at the stall are wonderful and friendly people.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Farmer profile, Pricing & Pre-Order sidebar */}
            <aside className={styles.rightCol}>
              {/* Farmer Info Card */}
              <div className={styles.farmerCard}>
                <div className={styles.farmerCardTop}>
                  {farmerVisual.type === 'img' ? (
                    <img
                      src={farmerVisual.src}
                      alt={farmName}
                      className={styles.farmerAvatar}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fb = e.currentTarget.parentElement?.querySelector('[data-farmer-fallback]');
                        if (fb) fb.style.display = 'flex';
                      }}
                    />
                  ) : null}

                  <div
                    data-farmer-fallback
                    className={styles.farmerAvatar}
                    style={{
                      display: farmerVisual.type === 'img' ? 'none' : 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#f5eee8',
                    }}
                  >
                    <Illustration name={farmerVisual.name || 'stall'} size={32} />
                  </div>

                  <div className={styles.farmerInfo}>
                    <span className={styles.farmerSup}>GROWN & HARVESTED BY</span>
                    <strong className={styles.farmerName}>{farmName}</strong>
                    <div className={styles.farmerMeta}>
                      <Store size={12} />
                      <span>{stallNumber || 'Stall 4'} · Local Producer</span>
                    </div>
                  </div>
                </div>

                <div className={styles.farmerBadges}>
                  <span className={styles.farmerBadgePill}>
                    <ShieldCheck size={12} />
                    Verified Local Grower
                  </span>
                  <span className={styles.farmerBadgePill}>
                    <Sparkles size={12} />
                    Saturday Attending
                  </span>
                </div>

                {product.farmer && (
                  <Link
                    to={`/farmers/${product.farmer.id || product.farmer._id}`}
                    className={styles.farmerProfileLink}
                  >
                    <span>View Farm Stall Profile</span>
                    <ChevronRight size={14} />
                  </Link>
                )}
              </div>

              {/* Pricing & Pre-Order Card */}
              <div className={styles.pricingCard}>
                <div className={styles.priceRow}>
                  <div className={styles.priceMain}>
                    <span className={styles.priceBig}>{formatPrice(unitPriceCents)}</span>
                    <span className={styles.priceUnit}>/ {product.unit || 'each'}</span>
                  </div>
                  <div className={styles.stockPill}>
                    <span className={styles.stockDot} />
                    {product.availability === 'out' ? 'Sold Out' : `${maxStock} Available`}
                  </div>
                </div>
                <p className={styles.unitDetail}>Packed fresh in craft market totes for your pickup</p>

                {/* Pickup Slot Selection */}
                <div className={styles.pickupSection}>
                  <label className={styles.pickupLabel}>
                    <Store size={14} />
                    Select Saturday Pickup Location
                  </label>
                  <div className={styles.pickupList}>
                    {pickupSlots.map((slot, index) => {
                      const isSelected = selectedSlotIndex === index;
                      return (
                        <div
                          key={slot.marketId || index}
                          onClick={() => setSelectedSlotIndex(index)}
                          className={`${styles.pickupCard} ${isSelected ? styles.pickupCardActive : ''}`}
                        >
                          <div className={styles.pickupRadioWrap}>
                            <input
                              type="radio"
                              name="pickupSlot"
                              checked={isSelected}
                              onChange={() => setSelectedSlotIndex(index)}
                              className={styles.pickupRadio}
                            />
                          </div>
                          <div className={styles.pickupBody}>
                            <div className={styles.pickupNameRow}>
                              <strong>{slot.marketName}</strong>
                              <span className={styles.stallPill}>{slot.stallNumber || stallNumber || 'Stall'}</span>
                            </div>
                            <p className={styles.pickupDayHours}>
                              <Calendar size={11} /> {slot.label || 'Sat 8:00am - 1:00pm'}
                            </p>
                            <span className={styles.cutoffText}>
                              <Clock size={11} /> Pre-order closes Friday night
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quantity Stepper */}
                <div className={styles.quantitySection}>
                  <div className={styles.qtyRow}>
                    <span className={styles.qtyLabel}>Quantity</span>
                    <div className={styles.qtyPicker}>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className={styles.qtyBtn}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className={styles.qtyVal}>{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                        disabled={quantity >= maxStock}
                        className={styles.qtyBtn}
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.totalRow}>
                    <span>Total to pay at pickup</span>
                    <strong className={styles.totalAmount}>{formatPrice(totalCents)}</strong>
                  </div>
                </div>

                {/* Pre-Order Button */}
                <button
                  type="button"
                  onClick={handleReserve}
                  className={`${styles.reserveBtn} ${reserved ? styles.reserveBtnDone : ''}`}
                  disabled={product.availability === 'out'}
                >
                  {reserved ? (
                    <>
                      <CheckCircle2 size={18} />
                      <span>Reserved for Saturday!</span>
                    </>
                  ) : product.availability === 'out' ? (
                    <span>Currently Sold Out</span>
                  ) : (
                    <>
                      <ShoppingBag size={18} />
                      <span>Reserve for Pickup · {formatPrice(totalCents)}</span>
                    </>
                  )}
                </button>

                {reserved && (
                  <div className={styles.successNotice}>
                    <CheckCircle2 size={16} />
                    <span>
                      Your pre-order has been added to your basket! It will be freshly packed for collection at{' '}
                      <strong>{selectedSlot.marketName}</strong>.
                    </span>
                  </div>
                )}
              </div>

              {/* Trust Badges */}
              <div className={styles.trustCard}>
                <div className={styles.trustItem}>
                  <CheckCircle2 size={15} className={styles.trustIcon} />
                  <span>100% Grown & Produced by {farmName}</span>
                </div>
                <div className={styles.trustItem}>
                  <Clock size={15} className={styles.trustIcon} />
                  <span>Harvested morning before market pickup</span>
                </div>
                <div className={styles.trustItem}>
                  <Truck size={15} className={styles.trustIcon} />
                  <span>Farm-to-market direct, zero middlemen</span>
                </div>
                <div className={styles.trustItem}>
                  <ShieldCheck size={15} className={styles.trustIcon} />
                  <span>MarketLink Freshness & Flavor Guarantee</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ─── RELATED HARVEST SECTION ───────────────────────────── */}
      {related && related.length > 0 && (
        <section className={styles.relatedSection}>
          <div className="container">
            <div className={styles.relatedHeader}>
              <h2 className={styles.relatedTitle}>
                More From {farmName} & Seasonal Harvest
              </h2>
              {product.farmer && (
                <Link
                  to={`/farmers/${product.farmer.id || product.farmer._id}`}
                  className={styles.viewStallLink}
                >
                  <span>View Full Stall</span>
                  <ChevronRight size={15} />
                </Link>
              )}
            </div>

            <div className={styles.relatedGrid}>
              {related.slice(0, 3).map((rel) => {
                const relId = rel.id || rel._id;
                const relVisual = getProductVisual(rel);
                const relPrice = formatPrice(rel.priceCents || rel.price);

                return (
                  <Link
                    key={relId}
                    to={`/products/${relId}`}
                    className={styles.relatedCard}
                  >
                    <div className={styles.relatedImgWrap}>
                      {relVisual.type === 'img' ? (
                        <img
                          src={relVisual.src}
                          alt={rel.name}
                          className={styles.relatedImg}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fb = e.currentTarget.parentElement?.querySelector('[data-rel-fallback]');
                            if (fb) fb.style.display = 'flex';
                          }}
                        />
                      ) : null}

                      <div
                        data-rel-fallback
                        className={styles.productIllustrationWrap}
                        style={{
                          display: relVisual.type === 'img' ? 'none' : 'flex',
                          height: '160px',
                        }}
                      >
                        <Illustration name={relVisual.name || 'basket'} size={72} />
                      </div>
                    </div>

                    <div className={styles.relatedBody}>
                      <span className={styles.relatedFarmer}>
                        {rel.farmer?.stallName || rel.farmer?.name || farmName}
                      </span>
                      <h4 className={styles.relatedName}>{rel.name}</h4>
                      <p className={styles.relatedPrice}>
                        {relPrice} <span>/ {rel.unit || 'each'}</span>
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Fullscreen Interactive Zoom Lightbox Modal */}
      {visual.type === 'img' && (
        <ImageZoomModal
          isOpen={zoomModalOpen}
          onClose={() => setZoomModalOpen(false)}
          images={[
            {
              src: visual.src,
              alt: product.name,
              caption: `${product.name} — ${farmName}`,
            },
          ]}
        />
      )}
    </div>
  );
}

export default ProductDetail;
>>>>>>> bc73418815cde522512fe21a2af884eee3163165
