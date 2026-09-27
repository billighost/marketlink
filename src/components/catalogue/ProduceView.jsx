import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Heart } from 'lucide-react';
import {
  getProductDetail,
  getProductReviews,
  getRelatedProducts,
  getFarmerProducts,
  getFarmerPickupSlots,
} from '@/api/catalog';
import { useQuery } from '@/hooks/useQuery';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useToast } from '@/context/ToastContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatPrice } from '@/utils/format';
import Illustration from '@/components/domain/Illustration';
import ProductCard from '@/components/domain/ProductCard';
import ReviewItem from '@/components/domain/ReviewItem';
import StockLine from '@/components/domain/StockLine';
import StallInline from '@/components/domain/StallInline';
import Stars from '@/components/ui/Stars';
import QuantityStepper from '@/components/ui/QuantityStepper';
import HorizontalRow from '@/components/layout/HorizontalRow';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import Skeleton from '@/components/ui/Skeleton';
import { useCatalogueRoutes } from './routes';
import styles from './ProduceView.module.css';

function formatCutoffSentence(cutoffAt) {
  if (!cutoffAt) return 'Reserve before market day.';
  const d = new Date(cutoffAt);
  if (isNaN(d.getTime())) return 'Reserve before market day.';
  const dayName = d.toLocaleDateString('en-GB', { weekday: 'long' });
  const timeStr = d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `Reserve by ${dayName} ${timeStr}.`;
}

function formatSlotLabel(slot) {
  if (!slot) return '';
  if (slot.label) return slot.label;
  if (!slot.start || !slot.end) return 'Pickup slot';
  const start = new Date(slot.start);
  const end = new Date(slot.end);
  const day = start.toLocaleDateString('en-GB', { weekday: 'short' });
  const startTime = start.toLocaleTimeString('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  });
  const endTime = end.toLocaleTimeString('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  });
  return `${day} ${startTime}–${endTime}`;
}

/**
 * Shared Produce detail view.
 * @param {'guest'|'buyer'} audience chooses actions and link targets, never content
 */
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
  const [showAllReviews, setShowAllReviews] = useState(false);

  const loginNext = `/login?next=${encodeURIComponent(location.pathname + (location.search || ''))}`;

  // 1. Product Detail query
  const {
    data: product,
    loading: productLoading,
    error: productError,
    refetch: refetchProduct,
  } = useQuery([`${audience}-product-detail`, id], ({ signal }) => getProductDetail(id, signal));

  useDocumentTitle(`${product?.name || 'Produce'} · MarketLink`);

  const farmerId = product?.farmer?.id || product?.farmer?._id;

  // 2. Reviews query
  const { data: reviewsData } = useQuery(
    [`${audience}-product-reviews`, id],
    ({ signal }) => getProductReviews(id, { limit: 10 }, signal),
    { enabled: Boolean(id && product) }
  );

  // 3. Related products query
  const { data: relatedData } = useQuery(
    [`${audience}-product-related`, id],
    ({ signal }) => getRelatedProducts(id, signal),
    { enabled: Boolean(id && product) }
  );

  // 4. Farmer products query ("Also on this stall")
  const { data: farmerProductsData } = useQuery(
    [`${audience}-farmer-products`, farmerId],
    ({ signal }) => getFarmerProducts(farmerId, { limit: 8 }, signal),
    { enabled: Boolean(farmerId) }
  );

  // 5. Pickup slots query
  const { data: pickupSlotsData } = useQuery(
    [`${audience}-farmer-slots`, farmerId],
    ({ signal }) => getFarmerPickupSlots(farmerId, signal),
    { enabled: Boolean(farmerId) }
  );

  const pickupSlots = Array.isArray(pickupSlotsData)
    ? pickupSlotsData
    : pickupSlotsData?.data || product?.nextPickupSlots || [];

  // Default first open slot for buyer
  useEffect(() => {
    if (isBuyer && !selectedSlot && pickupSlots.length > 0) {
      const firstOpen = pickupSlots.find((s) => s.isOpen !== false) || pickupSlots[0];
      setSelectedSlot(firstOpen);
    }
  }, [pickupSlots, selectedSlot, isBuyer]);

  // Loading skeleton state
  if (productLoading) {
    return (
      <div className={styles.pageWrap}>
        <div className={styles.backRow}>
          <Skeleton height="24px" width="120px" borderRadius="var(--radius-sm)" />
        </div>
        <div className={styles.topGrid}>
          <div className={styles.leftCol}>
            <Skeleton height="320px" borderRadius="var(--radius-lg)" />
          </div>
          <div className={styles.rightCol}>
            <Skeleton height="40px" width="70%" />
            <Skeleton height="28px" width="40%" />
            <Skeleton height="20px" width="50%" />
            <Skeleton height="100px" borderRadius="var(--radius-lg)" />
            <Skeleton height="60px" />
          </div>
        </div>
      </div>
    );
  }

  // Not found or network error
  if (productError || !product) {
    const isNotFound =
      !product ||
      productError?.status === 404 ||
      productError?.message?.includes('not found');

    return (
      <div className={styles.pageWrap}>
        <div className={styles.backRow}>
          <Link to={routes.browse} className={styles.backLink}>
            ← Back to browse
          </Link>
        </div>
        {isNotFound ? (
          <EmptyState
            scene="lost-path"
            title="That produce is not on a stall"
            text="It may have sold out, or the listing was removed."
            actionLabel="Back to browse"
            actionTo={routes.browse}
          />
        ) : (
          <ErrorState
            scene="offline-field"
            title="Couldn't load produce details"
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

  // Filter also on this stall (exclude current product)
  const allFarmerProducts = Array.isArray(farmerProductsData?.data)
    ? farmerProductsData.data
    : Array.isArray(farmerProductsData)
    ? farmerProductsData
    : [];
  const moreFromFarmer = allFarmerProducts.filter((p) => (p.id || p._id) !== (product.id || product._id));

  // Similar at other stalls
  const youMightLike = Array.isArray(relatedData?.youMightLike)
    ? relatedData.youMightLike
    : Array.isArray(relatedData)
    ? relatedData
    : [];

  // Reviews
  const reviews = reviewsData?.data || (Array.isArray(reviewsData) ? reviewsData : []);
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 3);
  const ratingAvg = product.ratingAvg ? Number(product.ratingAvg).toFixed(1) : '5.0';
  const totalReviewsCount = reviews.length;

  const handleAddToCart = () => {
    if (isSoldOut || !isBuyer) return;
    for (let i = 0; i < qty; i++) {
      add(product.id || product._id, {
        farmerId: farmer?.id || farmer?._id,
        slotStart: selectedSlot?.start || null,
      });
    }
    showToast(`Added ${qty} to basket`);
  };

  return (
    <div className={styles.pageWrap}>
      {/* Back to browse link */}
      <nav className={styles.backRow} aria-label="Breadcrumb">
        <Link to={routes.browse} className={styles.backLink}>
          ← Back to browse
        </Link>
      </nav>

      {/* Main Top Grid */}
      <div className={styles.topGrid}>
        {/* Left Column: sticky visual tile */}
        <div className={styles.leftCol}>
          <div className={styles.visualTile} data-aspect="4/3">
            {product.imageUrl && !imgError ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                loading="eager"
                className={styles.photo}
                onError={() => setImgError(true)}
              />
            ) : (
              <div className={styles.illustrationWrapper}>
                <Illustration name={product.art || 'basket'} size="xl" />
              </div>
            )}

            {/* Favorite toggle button (buyer) or Sign in to save (guest) */}
            {isBuyer ? (
              <button
                type="button"
                className={`${styles.favoriteButton} ${isFavorite ? styles.favorited : ''}`}
                onClick={() => toggleProduct(product.id || product._id)}
                aria-label={isFavorite ? 'Remove from saved' : 'Save produce'}
              >
                <Heart
                  size={20}
                  strokeWidth={1.5}
                  fill={isFavorite ? 'currentColor' : 'none'}
                  aria-hidden="true"
                />
              </button>
            ) : (
              <Link
                to={loginNext}
                className={styles.favoriteButton}
                aria-label="Sign in to save"
              >
                <Heart
                  size={20}
                  strokeWidth={1.5}
                  fill="none"
                  aria-hidden="true"
                />
              </Link>
            )}
          </div>
        </div>

        {/* Right Column: Name, price, stock, stall, cutoff, slots, inline add */}
        <div className={styles.rightCol}>
          <div className={styles.headingGroup}>
            <h1 className={styles.title}>{product.name}</h1>
            <div className={styles.priceLine}>
              <span className={styles.price}>{formatPrice(displayPrice)}</span>
              <span className={styles.unit}>/ {product.unit}</span>
            </div>
            <StockLine
              availability={rawAvailability}
              quantityLeft={product.quantityLeft}
              unit={product.unit}
              productId={product.id || product._id}
            />
          </div>

          {/* Stall strip */}
          <StallInline
            farmer={farmer}
            market={product.marketIds?.[0] || farmer?.marketName}
            audience={audience}
          />

          {/* About this produce */}
          {product.description && (
            <section className={styles.section} aria-labelledby="about-produce-heading">
              <h2 id="about-produce-heading" className={styles.sectionTitle}>
                About this produce
              </h2>
              <p className={styles.description}>{product.description}</p>
            </section>
          )}

          {/* Collect it: cutoff sentence + pickup windows */}
          <section className={styles.section} aria-labelledby="collect-heading">
            <h2 id="collect-heading" className={styles.sectionTitle}>
              Collect it
            </h2>
            <p className={styles.cutoffSentence}>
              {formatCutoffSentence(product.farmerCutoff?.cutoffAt)}
            </p>

            {pickupSlots.length > 0 ? (
              <div
                className={styles.slotsRow}
                role={isBuyer ? 'radiogroup' : 'group'}
                aria-label="Pickup slots"
              >
                {pickupSlots.map((slot, index) => {
                  const isSelected = selectedSlot?.start === slot.start;
                  if (!isBuyer) {
                    return (
                      <span
                        key={slot.start || index}
                        className={`${styles.slotChip} ${styles.slotChipReadOnly}`}
                      >
                        {formatSlotLabel(slot)}
                      </span>
                    );
                  }
                  return (
                    <button
                      key={slot.start || index}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      className={`${styles.slotChip} ${isSelected ? styles.slotChipActive : ''}`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {formatSlotLabel(slot)}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className={styles.noSlotsText}>
                No pickup windows open yet for this stall.
              </p>
            )}
          </section>

          {/* Desktop Inline Add Control (>= 768px) */}
          <div className={styles.desktopAddRow}>
            {isBuyer ? (
              <>
                <QuantityStepper
                  value={qty}
                  onChange={setQty}
                  min={1}
                  max={product.quantityLeft || 99}
                  disabled={isSoldOut}
                />
                <button
                  type="button"
                  className={styles.desktopAddBtn}
                  onClick={handleAddToCart}
                  disabled={isSoldOut}
                  aria-label={
                    isSoldOut
                      ? 'Sold out'
                      : `Add ${qty} ${product.name} to basket`
                  }
                >
                  {isSoldOut ? 'Sold out' : 'Add to basket'}
                </button>
              </>
            ) : isSoldOut ? (
              <Link to={loginNext} className={styles.desktopAddBtn}>
                Sign in to be told when it is back
              </Link>
            ) : (
              <Link to={loginNext} className={styles.desktopAddBtn}>
                Sign in to reserve
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Full width bottom sections: Also on stall, Similar produce, Reviews */}
      <div className={styles.bottomSections}>
        {/* Also on this stall */}
        {moreFromFarmer.length > 0 && (
          <HorizontalRow
            title="Also on this stall"
            seeAllLabel="See all"
            onSeeAll={() => navigate(`${routes.browse}?farmer=${farmer?.id || farmer?._id}`)}
          >
            {moreFromFarmer.map((item) => (
              <ProductCard
                key={item.id || item._id}
                product={item}
                variant="compact"
                audience={audience}
              />
            ))}
          </HorizontalRow>
        )}

        {/* Similar at other stalls */}
        {youMightLike.length > 0 && (
          <HorizontalRow
            title="Similar at other stalls"
            seeAllLabel="See all"
            onSeeAll={() => navigate(routes.browse)}
          >
            {youMightLike.map((item) => (
              <ProductCard
                key={item.id || item._id}
                product={item}
                variant="compact"
                audience={audience}
              />
            ))}
          </HorizontalRow>
        )}

        {/* Reviews Section */}
        <section className={styles.section} aria-labelledby="reviews-heading">
          <div className={styles.reviewsHeader}>
            <h2 id="reviews-heading" className={styles.sectionTitle}>
              Reviews
            </h2>
            {totalReviewsCount > 0 && (
              <div className={styles.reviewsMeta}>
                <Stars rating={Number(ratingAvg)} />
                <span>{`★ ${ratingAvg} · ${totalReviewsCount} ${totalReviewsCount === 1 ? 'review' : 'reviews'}`}</span>
              </div>
            )}
          </div>

          {reviews.length > 0 ? (
            <>
              <div className={styles.reviewsList}>
                {visibleReviews.map((rev) => (
                  <ReviewItem key={rev.id || rev._id} review={rev} />
                ))}
              </div>
              {reviews.length > 3 && !showAllReviews && (
                <button
                  type="button"
                  className={styles.showAllReviewsLink}
                  onClick={() => setShowAllReviews(true)}
                >
                  Show all reviews →
                </button>
              )}
            </>
          ) : (
            <EmptyState
              scene="first-review"
              title="No reviews yet"
              text="Be the first after you collect."
            />
          )}
        </section>
      </div>

      {/* Mobile Sticky Add Bar (< 768px) */}
      <div className={styles.mobileStickyBar} role="region" aria-label="Purchase actions">
        <div className={styles.barPriceGroup}>
          <span className={styles.barPrice}>{formatPrice(displayPrice)}</span>
          <span className={styles.barUnit}>/ {product.unit}</span>
        </div>

        <div className={styles.barActions}>
          {isBuyer ? (
            <>
              <QuantityStepper
                value={qty}
                onChange={setQty}
                min={1}
                max={product.quantityLeft || 99}
                size="sm"
                disabled={isSoldOut}
              />
              <button
                type="button"
                className={styles.mobileAddBtn}
                onClick={handleAddToCart}
                disabled={isSoldOut}
                aria-label={
                  isSoldOut
                    ? 'Sold out'
                    : `Add ${qty} ${product.name} to basket`
                }
              >
                {isSoldOut ? 'Sold out' : 'Add to basket'}
              </button>
            </>
          ) : isSoldOut ? (
            <Link to={loginNext} className={styles.mobileAddBtn}>
              Sign in to be told when it is back
            </Link>
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
