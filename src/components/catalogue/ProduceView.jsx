import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Heart,
  Share2,
  ShoppingBag,
  Check,
  Clock,
  MapPin,
  Store,
  ShieldCheck,
  Sprout,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  Plus,
  Minus,
  Calendar,
  Flame,
  Info,
  Award,
  CheckCircle2,
  ExternalLink,
  ThumbsUp,
  Star,
  Snowflake,
  ChefHat,
} from 'lucide-react';
import {
  getProductDetail,
  getProductReviews,
  getRelatedProducts,
  getFarmerProducts,
  getFarmerPickupSlots,
} from '@/api/catalog';
import { recordViewedProduct } from '@/utils/recentViews';
import { useQuery } from '@/hooks/useQuery';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useToast } from '@/context/ToastContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatPrice } from '@/utils/format';
import Illustration from '@/components/domain/Illustration';
import ProductCard from '@/components/domain/ProductCard';
import ReviewItem from '@/components/domain/ReviewItem';
import Stars from '@/components/ui/Stars';
import HorizontalRow from '@/components/layout/HorizontalRow';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import Skeleton from '@/components/ui/Skeleton';
import { useCatalogueRoutes } from './routes';
import styles from './ProduceView.module.css';

function formatCutoffSentence(cutoffAt) {
  if (!cutoffAt) return 'Reserve before the scheduled market date.';
  const d = new Date(cutoffAt);
  if (isNaN(d.getTime())) return 'Reserve before the scheduled market date.';
  const dayName = d.toLocaleDateString('en-GB', { weekday: 'long' });
  const dayNum = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const timeStr = d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `Harvest cutoff: ${dayName} ${dayNum} at ${timeStr}. Pre-order before then to guarantee freshness.`;
}

function formatSlotDisplay(slot) {
  if (!slot) return { day: '', time: '', market: '', stall: '' };
  const market = slot.marketName || 'Market Collection';
  const stall = slot.stallNumber || 'Farm Stall';

  if (slot.label) {
    const parts = slot.label.split(',');
    return {
      day: parts[0] || 'Market Day',
      time: parts[1] ? parts[1].trim() : 'Morning collection',
      market,
      stall,
    };
  }

  if (slot.start && slot.end) {
    const start = new Date(slot.start);
    const end = new Date(slot.end);
    const day = start.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    const startTime = start.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: false });
    const endTime = end.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: false });
    return {
      day,
      time: `${startTime}–${endTime}`,
      market,
      stall,
    };
  }

  return { day: 'Scheduled Day', time: 'Collection Hours', market, stall };
}

export function ProduceView({ audience = 'guest' }) {
  const { id } = useParams();
  const routes = useCatalogueRoutes(audience);
  const navigate = useNavigate();
  const location = useLocation();
  const isBuyer = audience === 'buyer';

  const { add } = useCart();
  const { isProductFavorite, toggleProduct } = useFavorites();
  const { showToast } = useToast();

  const [imgError, setImgError] = useState(false);
  const [qty, setQty] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [activeTab, setActiveTab] = useState('notes');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const loginNext = `/login?next=${encodeURIComponent(location.pathname + (location.search || ''))}`;

  const {
    data: product,
    loading: productLoading,
    error: productError,
    refetch: refetchProduct,
  } = useQuery([`${audience}-product-detail`, id], ({ signal }) => getProductDetail(id, signal));

  useDocumentTitle(`${product?.name || 'Produce'} · MarketLink`);

  useEffect(() => {
    if (product && (product.id || product._id)) {
      recordViewedProduct(product);
    }
  }, [product]);

  const farmerId = product?.farmer?.id || product?.farmer?._id;

  const { data: reviewsData } = useQuery(
    [`${audience}-product-reviews`, id],
    ({ signal }) => getProductReviews(id, { limit: 10 }, signal),
    { enabled: Boolean(id && product) }
  );

  const { data: relatedData } = useQuery(
    [`${audience}-product-related`, id],
    ({ signal }) => getRelatedProducts(id, signal),
    { enabled: Boolean(id && product) }
  );

  const { data: farmerProductsData } = useQuery(
    [`${audience}-farmer-products`, farmerId],
    ({ signal }) => getFarmerProducts(farmerId, { limit: 8 }, signal),
    { enabled: Boolean(farmerId) }
  );

  const { data: pickupSlotsData } = useQuery(
    [`${audience}-farmer-slots`, farmerId],
    ({ signal }) => getFarmerPickupSlots(farmerId, signal),
    { enabled: Boolean(farmerId) }
  );

  const pickupSlots = Array.isArray(pickupSlotsData)
    ? pickupSlotsData
    : pickupSlotsData?.data || product?.nextPickupSlots || [];

  useEffect(() => {
    if (!selectedSlot && pickupSlots.length > 0) {
      const firstOpen = pickupSlots.find((s) => s.isOpen !== false) || pickupSlots[0];
      setSelectedSlot(firstOpen);
    }
  }, [pickupSlots, selectedSlot]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Product link copied to clipboard');
    } else {
      showToast('Share: ' + window.location.href);
    }
  };

  if (productLoading || (!product && !productError)) {
    return (
      <div className={styles.pageWrap}>
        <div className={styles.navRow}>
          <Skeleton height="2rem" width="10rem" borderRadius="var(--radius-full)" />
        </div>
        <div className={styles.topGrid}>
          <Skeleton height="26rem" borderRadius="var(--radius-xl)" />
          <div className={styles.skeletonCol}>
            <Skeleton height="2.5rem" width="80%" />
            <Skeleton height="1.8rem" width="40%" />
            <Skeleton height="4rem" borderRadius="var(--radius-md)" />
            <Skeleton height="6rem" borderRadius="var(--radius-lg)" />
            <Skeleton height="3.2rem" borderRadius="var(--radius-full)" />
          </div>
        </div>
      </div>
    );
  }

  if (productError || !product) {
    const isNotFound =
      !product ||
      productError?.status === 404 ||
      productError?.message?.includes('not found');

    return (
      <div className={styles.pageWrap}>
        <div className={styles.navRow}>
          <Link to={routes.browse} className={styles.backLink}>
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Back to browse</span>
          </Link>
        </div>
        {isNotFound ? (
          <EmptyState
            scene="lost-path"
            title="Produce not found or unlisted"
            text="This item has been harvested, sold out, or the link has changed."
            actionLabel="Explore seasonal produce"
            actionTo={routes.browse}
          />
        ) : (
          <ErrorState
            scene="offline-field"
            title="Unable to load produce details"
            text="Please check your connection and try again."
            onRetry={refetchProduct}
          />
        )}
      </div>
    );
  }

  const farmer = product.farmer;
  const isFavorite = isBuyer && isProductFavorite(product.id || product._id);
  const rawAvailability = product.availability || (product.quantityLeft === 0 ? 'out' : 'in');
  const isSoldOut = rawAvailability === 'out';
  const displayPrice = product.priceCents != null ? product.priceCents : product.price;
  const totalPriceCents = (displayPrice || 0) * qty;

  const allFarmerProducts = Array.isArray(farmerProductsData?.data)
    ? farmerProductsData.data
    : Array.isArray(farmerProductsData)
    ? farmerProductsData
    : [];
  const moreFromFarmer = allFarmerProducts.filter((p) => (p.id || p._id) !== (product.id || product._id));

  const youMightLike = Array.isArray(relatedData?.youMightLike)
    ? relatedData.youMightLike
    : Array.isArray(relatedData)
    ? relatedData
    : [];

  const reviews = reviewsData?.data || (Array.isArray(reviewsData) ? reviewsData : []);
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 3);
  const ratingAvg = product.ratingAvg ? Number(product.ratingAvg).toFixed(1) : (reviews.length > 0 ? '5.0' : null);
  const totalReviewsCount = reviews.length;

  const handleAddToCart = () => {
    if (isSoldOut) return;
    if (!isBuyer) {
      navigate(loginNext);
      return;
    }
    for (let i = 0; i < qty; i++) {
      add(product.id || product._id, {
        farmerId: farmer?.id || farmer?._id,
        slotStart: selectedSlot?.start || null,
      });
    }
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1600);
    showToast(`Added ${qty} ${qty === 1 ? 'item' : 'items'} to basket`);
  };

  const handleStepperChange = (delta) => {
    const maxQty = product.quantityLeft || 99;
    setQty((prev) => Math.max(1, Math.min(maxQty, prev + delta)));
  };

  const marketName =
    (product.marketIds?.[0]?.name) ||
    farmer?.marketName ||
    selectedSlot?.marketName ||
    'Local Farmers Market';

  const categoryName = product.category?.name || 'Produce';

  return (
    <div className={styles.pageWrap}>
      
      <nav className={styles.navRow} aria-label="Breadcrumb">
        <div className={styles.breadcrumbCluster}>
          <Link to={routes.browse} className={styles.backLink}>
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Browse</span>
          </Link>
          <span className={styles.breadSep} aria-hidden="true">/</span>
          <span className={styles.breadItem}>{categoryName}</span>
          <span className={styles.breadSep} aria-hidden="true">/</span>
          <span className={styles.breadCurrent}>{product.name}</span>
        </div>

        <button
          type="button"
          className={styles.shareBtn}
          onClick={handleShare}
          aria-label="Share produce"
          title="Share"
        >
          <Share2 size={16} aria-hidden="true" />
          <span className={styles.shareText}>Share</span>
        </button>
      </nav>

      <div className={styles.topGrid}>
        
        <div className={styles.leftCol}>
          <div className={styles.visualCard}>
            <div className={styles.imageViewport}>
              {product.imageUrl && !imgError ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  loading="eager"
                  className={styles.mainPhoto}
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className={styles.illustrationWrap}>
                  <Illustration name={product.art || 'basket'} size="xl" />
                </div>
              )}

              <div className={styles.floatingTagWrap}>
                <span className={styles.categoryBadge}>
                  <Sprout size={13} aria-hidden="true" />
                  {categoryName}
                </span>

                {product.quantityLeft != null && product.quantityLeft > 0 && product.quantityLeft <= 5 && !isSoldOut && (
                  <span className={styles.scarcityBadge}>
                    <Flame size={12} aria-hidden="true" />
                    Only {product.quantityLeft} left!
                  </span>
                )}

                {isSoldOut && (
                  <span className={styles.soldOutBadge}>
                    Sold Out
                  </span>
                )}
              </div>

              {isBuyer ? (
                <button
                  type="button"
                  className={`${styles.favoriteButton} ${isFavorite ? styles.favorited : ''}`}
                  onClick={() => toggleProduct(product.id || product._id)}
                  aria-label={isFavorite ? 'Remove from saved items' : 'Save produce'}
                  title={isFavorite ? 'Saved' : 'Save'}
                >
                  <Heart
                    size={20}
                    strokeWidth={2}
                    fill={isFavorite ? 'currentColor' : 'none'}
                    aria-hidden="true"
                  />
                </button>
              ) : (
                <Link
                  to={loginNext}
                  className={styles.favoriteButton}
                  aria-label="Sign in to save produce"
                  title="Sign in to save"
                >
                  <Heart size={20} strokeWidth={2} fill="none" aria-hidden="true" />
                </Link>
              )}
            </div>

            <div className={styles.guaranteeStrip}>
              <div className={styles.guaranteeItem}>
                <ShieldCheck size={16} className={styles.guaranteeIcon} aria-hidden="true" />
                <span>Zero pesticide sprays</span>
              </div>
              <div className={styles.guaranteeItem}>
                <Clock size={16} className={styles.guaranteeIcon} aria-hidden="true" />
                <span>Harvested within 24h</span>
              </div>
              <div className={styles.guaranteeItem}>
                <Award size={16} className={styles.guaranteeIcon} aria-hidden="true" />
                <span>100% grower direct</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.rightCol}>
          
          <div className={styles.headerBlock}>
            <div className={styles.ratingStripe}>
              {ratingAvg ? (
                <div className={styles.starRow}>
                  <Stars rating={Number(ratingAvg)} />
                  <span className={styles.ratingText}>
                    <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Star size={12} fill="currentColor" aria-hidden="true" />
                      {ratingAvg}
                    </strong> ({totalReviewsCount} {totalReviewsCount === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              ) : (
                <span className={styles.freshTag}>
                  <Sparkles size={13} aria-hidden="true" />
                  Fresh Seasonal Harvest
                </span>
              )}
            </div>

            <h1 className={styles.productTitle}>{product.name}</h1>

            <div className={styles.priceRow}>
              <div className={styles.priceGroup}>
                <span className={styles.priceMain}>{formatPrice(displayPrice)}</span>
                <span className={styles.priceUnit}>/ {product.unit || 'unit'}</span>
              </div>

              {!isSoldOut && (
                <span className={styles.stockStatus}>
                  <span className={styles.stockDot} aria-hidden="true" />
                  In Stock for Pickup
                </span>
              )}
            </div>
          </div>

          {farmer && (
            <div className={styles.stallCard}>
              <div className={styles.stallAvatar}>
                {farmer.art ? (
                  <Illustration name={farmer.art} size="sm" />
                ) : (
                  <Store size={20} aria-hidden="true" />
                )}
              </div>

              <div className={styles.stallInfo}>
                <div className={styles.stallHeader}>
                  <h3 className={styles.stallName}>
                    {farmer.stallName || farmer.name || 'Local Farm Stall'}
                  </h3>
                  <span className={styles.stallPitch}>
                    {farmer.stallNumber || 'Stall Pitch'}
                  </span>
                </div>
                <p className={styles.stallMarket}>
                  <MapPin size={13} aria-hidden="true" />
                  <span>Trading at {marketName}</span>
                </p>
              </div>

              <Link
                to={`${routes.stalls}/${farmer.id || farmer._id}`}
                className={styles.visitStallLink}
                aria-label={`Visit ${farmer.stallName || 'stall'}`}
              >
                <span>Visit stall</span>
                <ChevronRight size={14} aria-hidden="true" />
              </Link>
            </div>
          )}

          <div className={styles.pickupSection}>
            <div className={styles.sectionTitleRow}>
              <div className={styles.sectionTitleWithIcon}>
                <Calendar size={18} className={styles.sectionIcon} aria-hidden="true" />
                <h2 className={styles.sectionHeading}>Market Pickup Window</h2>
              </div>
            </div>

            <p className={styles.cutoffNotice}>
              <Clock size={14} className={styles.cutoffIcon} aria-hidden="true" />
              <span>{formatCutoffSentence(product.farmerCutoff?.cutoffAt)}</span>
            </p>

            {pickupSlots.length > 0 ? (
              <div
                className={styles.slotsGrid}
                role={isBuyer ? 'radiogroup' : 'group'}
                aria-label="Available collection slots"
              >
                {pickupSlots.map((slot, idx) => {
                  const isSelected = selectedSlot?.start === slot.start;
                  const display = formatSlotDisplay(slot);

                  return (
                    <button
                      key={slot.start || idx}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      className={`${styles.slotCard} ${isSelected ? styles.slotCardActive : ''}`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      <div className={styles.slotRadio}>
                        {isSelected ? (
                          <CheckCircle2 size={18} className={styles.checkedIcon} aria-hidden="true" />
                        ) : (
                          <div className={styles.uncheckDot} aria-hidden="true" />
                        )}
                      </div>

                      <div className={styles.slotText}>
                        <div className={styles.slotDateTime}>
                          <span className={styles.slotDay}>{display.day}</span>
                          <span className={styles.slotHours}>{display.time}</span>
                        </div>
                        <span className={styles.slotLocation}>
                          {display.market} · {display.stall}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className={styles.noSlotsBanner}>
                <Info size={16} aria-hidden="true" />
                <span>Next collection schedule will be confirmed shortly. Check back soon.</span>
              </div>
            )}
          </div>

          <div className={styles.orderActionsSuite}>
            {isSoldOut ? (
              <div className={styles.soldOutBox} role="status">
                <div className={styles.soldOutHeader}>
                  <Info size={18} aria-hidden="true" />
                  <strong>This harvest has sold out</strong>
                </div>
                <p className={styles.soldOutDesc}>
                  All available stock for this collection has been claimed. The grower is cultivating the next seasonal batch.
                </p>
                <div className={styles.soldOutButtons}>
                  <Link to={routes.browse} className={styles.soldOutBtnPrimary}>
                    Explore similar produce
                  </Link>
                  {farmer?.id && (
                    <Link
                      to={`${routes.stalls}/${farmer.id || farmer._id}`}
                      className={styles.soldOutBtnSecondary}
                    >
                      More from this stall
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className={styles.stepperAndButtonRow}>
                  <div className={styles.stepperWrap} aria-label="Select quantity">
                    <button
                      type="button"
                      className={styles.stepperBtn}
                      onClick={() => handleStepperChange(-1)}
                      disabled={qty <= 1}
                      aria-label="Decrease quantity"
                    >
                      <Minus size={16} />
                    </button>
                    <span className={styles.stepperValue} aria-live="polite">
                      {qty}
                    </span>
                    <button
                      type="button"
                      className={styles.stepperBtn}
                      onClick={() => handleStepperChange(1)}
                      disabled={qty >= (product.quantityLeft || 99)}
                      aria-label="Increase quantity"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {isBuyer ? (
                    <button
                      type="button"
                      className={`${styles.addToBasketBtn} ${addedAnimation ? styles.addedSuccess : ''}`}
                      onClick={handleAddToCart}
                    >
                      {addedAnimation ? (
                        <>
                          <Check size={18} strokeWidth={2.5} aria-hidden="true" />
                          <span>Added to Basket!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={18} aria-hidden="true" />
                          <span>
                            Add {qty > 1 ? `${qty} ` : ''}to Basket · {formatPrice(totalPriceCents)}
                          </span>
                        </>
                      )}
                    </button>
                  ) : (
                    <Link to={loginNext} className={styles.guestReserveBtn}>
                      <ShoppingBag size={18} aria-hidden="true" />
                      <span>Sign in to reserve produce</span>
                    </Link>
                  )}
                </div>

                <p className={styles.checkoutHint}>
                  <ShieldCheck size={14} aria-hidden="true" />
                  <span>Collected fresh on market day. Pay securely online or upon pickup.</span>
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <section className={styles.tabsSection} aria-label="Detailed information">
        <div className={styles.tabsHeader} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'notes'}
            className={`${styles.tabBtn} ${activeTab === 'notes' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('notes')}
          >
            Produce & Harvest Notes
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'pickup'}
            className={`${styles.tabBtn} ${activeTab === 'pickup' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('pickup')}
          >
            How Market Pickup Works
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'producer'}
            className={`${styles.tabBtn} ${activeTab === 'producer' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('producer')}
          >
            About the Producer
          </button>
        </div>

        <div className={styles.tabContentCard}>
          {activeTab === 'notes' && (
            <div className={styles.tabPane}>
              <h3 className={styles.tabPaneTitle}>About this Harvest</h3>
              <p className={styles.descriptionText}>
                {product.description ||
                  `Cultivated with care by ${farmer?.stallName || 'our local grower'}. Harvested fresh at the peak of flavor, ensuring premium taste, zero long-haul transport, and complete nutritional integrity.`}
              </p>

              <div className={styles.tipsGrid}>
                <div className={styles.tipCard}>
                  <span className={styles.tipEmoji}><Sprout size={18} /></span>
                  <div>
                    <h4 className={styles.tipTitle}>Peak Season</h4>
                    <p className={styles.tipDesc}>Grown naturally in season for maximum flavor and nutrition.</p>
                  </div>
                </div>
                <div className={styles.tipCard}>
                  <span className={styles.tipEmoji}><Snowflake size={18} /></span>
                  <div>
                    <h4 className={styles.tipTitle}>Storage Advice</h4>
                    <p className={styles.tipDesc}>Keep in a cool, ventilated area or crisper drawer for optimal freshness.</p>
                  </div>
                </div>
                <div className={styles.tipCard}>
                  <span className={styles.tipEmoji}><ChefHat size={18} /></span>
                  <div>
                    <h4 className={styles.tipTitle}>Culinary Tips</h4>
                    <p className={styles.tipDesc}>Pairs wonderfully with local sourdough, artisan cheeses, and fresh olive oils.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pickup' && (
            <div className={styles.tabPane}>
              <h3 className={styles.tabPaneTitle}>Simple 3-Step Market Collection</h3>
              <div className={styles.stepsFlow}>
                <div className={styles.stepItem}>
                  <div className={styles.stepNumber}>1</div>
                  <h4 className={styles.stepTitle}>Pre-Order Online</h4>
                  <p className={styles.stepDesc}>Reserve your harvest before the cutoff date so growers know what to pick.</p>
                </div>
                <div className={styles.stepConnector} aria-hidden="true">→</div>
                <div className={styles.stepItem}>
                  <div className={styles.stepNumber}>2</div>
                  <h4 className={styles.stepTitle}>Harvested Fresh</h4>
                  <p className={styles.stepDesc}>The grower harvests and packs your produce directly from the field or kitchen.</p>
                </div>
                <div className={styles.stepConnector} aria-hidden="true">→</div>
                <div className={styles.stepItem}>
                  <div className={styles.stepNumber}>3</div>
                  <h4 className={styles.stepTitle}>Collect at the Stall</h4>
                  <p className={styles.stepDesc}>Head to the stall on market day, show your order code, and take home fresh produce.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'producer' && (
            <div className={styles.tabPane}>
              <h3 className={styles.tabPaneTitle}>
                {farmer?.stallName || 'Artisan Producer'}
              </h3>
              <p className={styles.descriptionText}>
                {farmer?.bio ||
                  `${farmer?.stallName || 'This grower'} is a dedicated local producer trading across our regional farmers markets. Committed to ecological agriculture, minimal food miles, and direct community connections.`}
              </p>

              {farmer?.id && (
                <div className={styles.producerActionRow}>
                  <Link
                    to={`${routes.stalls}/${farmer.id || farmer._id}`}
                    className={styles.producerProfileBtn}
                  >
                    <span>View full stall profile & all harvests</span>
                    <ChevronRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {moreFromFarmer.length > 0 && (
        <section className={styles.recommendSection}>
          <div className={styles.recommendHeader}>
            <div>
              <span className={styles.recommendEyebrow}>From the Same Grower</span>
              <h2 className={styles.recommendTitle}>
                Also at {farmer?.stallName || 'this stall'}
              </h2>
            </div>
            {farmer?.id && (
              <Link
                to={`${routes.stalls}/${farmer.id || farmer._id}`}
                className={styles.seeAllLink}
              >
                <span>See all stall items</span>
                <ChevronRight size={14} aria-hidden="true" />
              </Link>
            )}
          </div>

          <div className={styles.productCardsGrid}>
            {moreFromFarmer.slice(0, 3).map((item) => (
              <ProductCard
                key={item.id || item._id}
                product={item}
                variant="grid"
                audience={audience}
              />
            ))}
          </div>
        </section>
      )}

      {youMightLike.length > 0 && (
        <section className={styles.recommendSection}>
          <div className={styles.recommendHeader}>
            <div>
              <span className={styles.recommendEyebrow}>Community Recommendations</span>
              <h2 className={styles.recommendTitle}>Similar produce you might enjoy</h2>
            </div>
            <Link to={routes.browse} className={styles.seeAllLink}>
              <span>Explore all browse</span>
              <ChevronRight size={14} aria-hidden="true" />
            </Link>
          </div>

          <div className={styles.productCardsGrid}>
            {youMightLike.slice(0, 3).map((item) => (
              <ProductCard
                key={item.id || item._id}
                product={item}
                variant="grid"
                audience={audience}
              />
            ))}
          </div>
        </section>
      )}

      <section className={styles.reviewsSection} aria-labelledby="reviews-title">
        <div className={styles.reviewsHeader}>
          <div>
            <span className={styles.recommendEyebrow}>Community Feedback</span>
            <h2 id="reviews-title" className={styles.recommendTitle}>
              Harvest Reviews & Ratings
            </h2>
          </div>

          {ratingAvg && (
            <div className={styles.ratingBadgePill}>
              <Stars rating={Number(ratingAvg)} />
              <span>{ratingAvg} out of 5 ({totalReviewsCount} {totalReviewsCount === 1 ? 'review' : 'reviews'})</span>
            </div>
          )}
        </div>

        {reviews.length > 0 ? (
          <div className={styles.reviewsList}>
            {visibleReviews.map((rev) => (
              <ReviewItem key={rev.id || rev._id} review={rev} />
            ))}

            {reviews.length > 3 && !showAllReviews && (
              <button
                type="button"
                className={styles.showAllReviewsBtn}
                onClick={() => setShowAllReviews(true)}
              >
                <span>Read all {totalReviewsCount} reviews</span>
                <ChevronRight size={14} aria-hidden="true" />
              </button>
            )}
          </div>
        ) : (
          <div className={styles.reviewsEmptyCard}>
            <div className={styles.reviewsEmptyIcon}>
              <Sparkles size={24} aria-hidden="true" />
            </div>
            <h3 className={styles.reviewsEmptyTitle}>Be the first to review this harvest</h3>
            <p className={styles.reviewsEmptyDesc}>
              After you collect your produce at the market, you can share feedback on flavor, freshness, and quality.
            </p>
          </div>
        )}
      </section>

      <div className={styles.mobileStickyBar} role="region" aria-label="Purchase actions">
        <div className={styles.mobilePriceBlock}>
          <span className={styles.mobilePrice}>{formatPrice(totalPriceCents)}</span>
          <span className={styles.mobileUnit}>({qty} {product.unit || 'unit'})</span>
        </div>

        <div className={styles.mobileActionsGroup}>
          {!isSoldOut && (
            <div className={styles.mobileStepper}>
              <button
                type="button"
                className={styles.mobileStepperBtn}
                onClick={() => handleStepperChange(-1)}
                disabled={qty <= 1}
                aria-label="Decrease quantity"
              >
                <Minus size={14} />
              </button>
              <span className={styles.mobileStepperVal}>{qty}</span>
              <button
                type="button"
                className={styles.mobileStepperBtn}
                onClick={() => handleStepperChange(1)}
                disabled={qty >= (product.quantityLeft || 99)}
                aria-label="Increase quantity"
              >
                <Plus size={14} />
              </button>
            </div>
          )}

          {isBuyer ? (
            <button
              type="button"
              className={`${styles.mobileAddBtn} ${addedAnimation ? styles.mobileAddSuccess : ''}`}
              onClick={handleAddToCart}
              disabled={isSoldOut}
            >
              {isSoldOut ? (
                'Sold out'
              ) : addedAnimation ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Check size={16} />
                  <span>Added!</span>
                </span>
              ) : (
                'Add to Basket'
              )}
            </button>
          ) : (
            <Link to={loginNext} className={styles.mobileAddBtn}>
              Sign in to reserve
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProduceView;
