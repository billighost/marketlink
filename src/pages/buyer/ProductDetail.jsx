<<<<<<< HEAD
import React from 'react';import { useParams, Link } from 'react-router-dom';import { Heart, ChevronRight, Clock, ShieldCheck, ArrowLeft } from 'lucide-react';import { getProductDetail, getProductReviews, getRelatedProducts } from '@/api/catalog';import { useQuery } from '@/hooks/useQuery';import { formatPrice, formatCountdown } from '@/utils/format';import { useFavorites } from '@/context/FavoritesContext';import { useOpenSheet } from '@/hooks/useOpenSheet';import Illustration from '@/components/domain/Illustration';import AddToCartButton from '@/components/domain/AddToCartButton';import ProductCard from '@/components/domain/ProductCard';import ReviewItem from '@/components/domain/ReviewItem';import Badge from '@/components/ui/Badge';import Stars from '@/components/ui/Stars';import HorizontalRow from '@/components/layout/HorizontalRow';import Skeleton from '@/components/ui/Skeleton';import styles from './ProductDetail.module.css';export function ProductDetail({ inSheet = false, onClose }) {  const { id } = useParams();  const { openSheet } = useOpenSheet();  const { isProductFavorite, toggleProduct } = useFavorites();  const { data: product, loading, error } = useQuery(    ['product-detail', id],    ({ signal }) => getProductDetail(id, signal)  );  const { data: reviewsData } = useQuery(    ['product-reviews', id],    ({ signal }) => getProductReviews(id, {}, signal),    { enabled: Boolean(id) }  );  const { data: relatedData } = useQuery(    ['product-related', id],    ({ signal }) => getRelatedProducts(id, signal),    { enabled: Boolean(id) }  );  const reviews = reviewsData?.data || [];  const relatedProducts = relatedData || [];  if (loading) {    return (      <div className={`${styles.container} ${!inSheet ? styles.standalone : ''}`}>        <div style={{ padding: 'var(--space-6)' }}>          <Skeleton height="260px" borderRadius="var(--radius-lg)" style={{ marginBottom: 'var(--space-4)' }} />          <Skeleton height="32px" width="60%" style={{ marginBottom: 'var(--space-2)' }} />          <Skeleton height="24px" width="40%" style={{ marginBottom: 'var(--space-6)' }} />          <Skeleton height="80px" borderRadius="var(--radius-md)" />        </div>      </div>    );  }  if (error || !product) {    return (      <div className={styles.notFound}>        <h2>Product not found</h2>        <p>This harvest item might be out of season or no longer listed.</p>        <Link to="/buyer/products" className={styles.backLink}>          Back to all products        </Link>      </div>    );  }  const farmer = product.farmer;  const isFavorite = isProductFavorite(product.id);  const rawAvailability = product.availability || product.stock;  const isSoldOut = rawAvailability === 'out';  const isLowStock = rawAvailability === 'low';  const displayPrice = product.priceCents != null ? product.priceCents : product.price;  const cutoffCountdown = product.farmerCutoff?.cutoffAt    ? formatCountdown(product.farmerCutoff.cutoffAt)    : null;  const handleFarmerClick = (e) => {    e.preventDefault();    if (farmer?.id) {      openSheet(`/buyer/farmers/${farmer.id}`);    }  };  return (    <div className={`${styles.container} ${!inSheet ? styles.standalone : ''}`}>      {}      {!inSheet && (        <div className={styles.fallbackHeader}>          <Link to="/buyer/products" className={styles.backButton}>            <ArrowLeft size={20} aria-hidden="true" />            <span>Back to products</span>          </Link>        </div>      )}      {}      <div className={styles.visualContainer} data-aspect="4/3">        <div className={styles.illustrationWrapper}>          <Illustration name={product.art || 'basket'} size="xl" />        </div>        {}        <button          type="button"          className={`${styles.favoriteButton} ${isFavorite ? styles.favorited : ''}`}          onClick={() => toggleProduct(product.id)}          aria-label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}        >          <Heart            size={22}            strokeWidth={1.75}            fill={isFavorite ? 'var(--color-beet)' : 'none'}            className={styles.heartIcon}            aria-hidden="true"          />        </button>        {}        {isSoldOut && (          <div className={styles.badgeWrapper}>            <Badge variant="danger" size="md">Sold out for Saturday</Badge>          </div>        )}        {!isSoldOut && isLowStock && (          <div className={styles.badgeWrapper}>            <Badge variant="warning" size="md">              {product.quantityLeft ? `Only ${product.quantityLeft} remaining` : 'Low stock'}            </Badge>          </div>        )}      </div>      {}      <div className={styles.body}>        {}        <div className={styles.titleSection}>          <div className={styles.nameRow}>            <h1 className={styles.title}>{product.name}</h1>          </div>          <div className={styles.priceRow}>            <span className={styles.price}>{formatPrice(displayPrice)}</span>            <span className={styles.unit}>per {product.unit}</span>          </div>        </div>        {}        {farmer && (          <button            type="button"            className={styles.farmerBanner}            onClick={handleFarmerClick}            aria-label={`Visit ${farmer.stallName} stall`}          >            <div className={styles.farmerAvatar}>              <Illustration name={farmer.art || 'stall'} size="sm" />            </div>            <div className={styles.farmerInfo}>              <span className={styles.farmerLabel}>Grown & prepared by</span>              <span className={styles.farmerName}>{farmer.stallName}</span>              {farmer.stallNumber && (                <span className={styles.farmerLocation}>{farmer.stallNumber}</span>              )}            </div>            <ChevronRight size={18} className={styles.farmerChevron} aria-hidden="true" />          </button>        )}        {}        <div className={styles.section}>          <h2 className={styles.sectionTitle}>About this harvest</h2>          <p className={styles.description}>{product.description}</p>        </div>        {}        <div className={styles.factsList}>          {cutoffCountdown && (            <div className={styles.factItem}>              <Clock size={16} className={styles.factIcon} aria-hidden="true" />              <span>Order cutoff: {cutoffCountdown}</span>            </div>          )}          <div className={styles.factItem}>            <ShieldCheck size={16} className={styles.factIcon} aria-hidden="true" />            <span>Pay in person at market stall pickup</span>          </div>        </div>        {}        <div className={styles.section}>          <div className={styles.reviewsHeader}>            <h2 className={styles.sectionTitle}>Customer reviews</h2>            {reviews.length > 0 && (              <span className={styles.reviewSummary}>                <Stars rating={product.ratingAvg || 5} />                <span className={styles.reviewCount}>({reviews.length})</span>              </span>            )}          </div>          {reviews.length > 0 ? (            <div className={styles.reviewsList}>              {reviews.map((rev) => (                <ReviewItem key={rev.id} review={rev} />              ))}            </div>          ) : (            <p className={styles.noReviews}>              No reviews yet for this harvest. Be the first to pre-order and review.            </p>          )}        </div>        {}        {relatedProducts.length > 0 && (          <div className={styles.recommendSection}>            <HorizontalRow              title="You might also like"              seeAllLabel="Browse all"              onSeeAll={() => openSheet('/buyer/products')}            >              {relatedProducts.map((item) => (                <ProductCard key={item.id} product={item} variant="compact" />              ))}            </HorizontalRow>          </div>        )}      </div>      {}      <footer className={styles.footer}>        <div className={styles.footerContent}>          <div className={styles.footerPrice}>            <span className={styles.footerTotal}>{formatPrice(displayPrice)}</span>            <span className={styles.footerUnit}>/ {product.unit}</span>          </div>          <div className={styles.footerAction}>            <AddToCartButton              productId={product.id}              farmerId={farmer?.id || product.farmerId || product.farmer?.id}              productName={product.name}              variant="wide"              disabled={isSoldOut}            />          </div>        </div>      </footer>    </div>  );}export default ProductDetail;
=======
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, ChevronRight, Clock, ShieldCheck, ArrowLeft } from 'lucide-react';
import { getProductDetail, getProductReviews, getRelatedProducts } from '@/api/catalog';
import { useQuery } from '@/hooks/useQuery';
import { formatPrice, formatCountdown } from '@/utils/format';
import { useFavorites } from '@/context/FavoritesContext';
import { useOpenSheet } from '@/hooks/useOpenSheet';
import Illustration from '@/components/domain/Illustration';
import AddToCartButton from '@/components/domain/AddToCartButton';
import ProductCard from '@/components/domain/ProductCard';
import ReviewItem from '@/components/domain/ReviewItem';
import Badge from '@/components/ui/Badge';
import Stars from '@/components/ui/Stars';
import HorizontalRow from '@/components/layout/HorizontalRow';
import Skeleton from '@/components/ui/Skeleton';
import styles from './ProductDetail.module.css';

/**
 * Product detail view rendered inside a modal bottom sheet (or full-page fallback).
 * Connected to GET /api/products/:id, /reviews, and /related.
 */
export function ProductDetail({ inSheet = false, onClose }) {
  const { id } = useParams();
  const { openSheet } = useOpenSheet();
  const { isProductFavorite, toggleProduct } = useFavorites();
  const [imgError, setImgError] = useState(false);

  const { data: product, loading, error } = useQuery(
    ['product-detail', id],
    ({ signal }) => getProductDetail(id, signal)
  );

  const { data: reviewsData } = useQuery(
    ['product-reviews', id],
    ({ signal }) => getProductReviews(id, {}, signal),
    { enabled: Boolean(id) }
  );

  const { data: relatedData } = useQuery(
    ['product-related', id],
    ({ signal }) => getRelatedProducts(id, signal),
    { enabled: Boolean(id) }
  );

  const reviews = reviewsData?.data || [];
  const relatedProducts = relatedData || [];

  if (loading) {
    return (
      <div className={`${styles.container} ${!inSheet ? styles.standalone : ''}`}>
        <div style={{ padding: 'var(--space-6)' }}>
          <Skeleton height="260px" borderRadius="var(--radius-lg)" style={{ marginBottom: 'var(--space-4)' }} />
          <Skeleton height="32px" width="60%" style={{ marginBottom: 'var(--space-2)' }} />
          <Skeleton height="24px" width="40%" style={{ marginBottom: 'var(--space-6)' }} />
          <Skeleton height="80px" borderRadius="var(--radius-md)" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className={styles.notFound}>
        <h2>Product not found</h2>
        <p>This harvest item might be out of season or no longer listed.</p>
        <Link to="/buyer/products" className={styles.backLink}>
          Back to all products
        </Link>
      </div>
    );
  }

  const farmer = product.farmer;
  const isFavorite = isProductFavorite(product.id);
  const rawAvailability = product.availability || product.stock;
  const isSoldOut = rawAvailability === 'out';
  const isLowStock = rawAvailability === 'low';
  const displayPrice = product.priceCents != null ? product.priceCents : product.price;

  const cutoffCountdown = product.farmerCutoff?.cutoffAt
    ? formatCountdown(product.farmerCutoff.cutoffAt)
    : null;

  const handleFarmerClick = (e) => {
    e.preventDefault();
    if (farmer?.id) {
      openSheet(`/buyer/farmers/${farmer.id}`);
    }
  };

  return (
    <div className={`${styles.container} ${!inSheet ? styles.standalone : ''}`}>
      {/* Full-page fallback top back bar */}
      {!inSheet && (
        <div className={styles.fallbackHeader}>
          <Link to="/buyer/products" className={styles.backButton}>
            <ArrowLeft size={20} aria-hidden="true" />
            <span>Back to products</span>
          </Link>
        </div>
      )}

      {/* Main product illustration visual */}
      <div className={styles.visualContainer} data-aspect="4/3">
        {product.imageUrl && !imgError ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className={styles.photo}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={styles.illustrationWrapper}>
            <Illustration name={product.art || 'basket'} size="xl" />
          </div>
        )}

        {/* Floating Heart button */}
        <button
          type="button"
          className={`${styles.favoriteButton} ${isFavorite ? styles.favorited : ''}`}
          onClick={() => toggleProduct(product.id)}
          aria-label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
        >
          <Heart
            size={22}
            strokeWidth={1.75}
            fill={isFavorite ? 'var(--color-beet)' : 'none'}
            className={styles.heartIcon}
            aria-hidden="true"
          />
        </button>

        {/* Stock status overlay badge */}
        {isSoldOut && (
          <div className={styles.badgeWrapper}>
            <Badge variant="danger" size="md">Sold out for Saturday</Badge>
          </div>
        )}
        {!isSoldOut && isLowStock && (
          <div className={styles.badgeWrapper}>
            <Badge variant="warning" size="md">
              {product.quantityLeft ? `Only ${product.quantityLeft} remaining` : 'Low stock'}
            </Badge>
          </div>
        )}
      </div>

      {/* Main details body */}
      <div className={styles.body}>
        {/* Title & Price Header */}
        <div className={styles.titleSection}>
          <div className={styles.nameRow}>
            <h1 className={styles.title}>{product.name}</h1>
          </div>
          <div className={styles.priceRow}>
            <span className={styles.price}>{formatPrice(displayPrice)}</span>
            <span className={styles.unit}>per {product.unit}</span>
          </div>
        </div>

        {/* Farmer Stall Link Banner */}
        {farmer && (
          <button
            type="button"
            className={styles.farmerBanner}
            onClick={handleFarmerClick}
            aria-label={`Visit ${farmer.stallName} stall`}
          >
            <div className={styles.farmerAvatar}>
              <Illustration name={farmer.art || 'stall'} size="sm" />
            </div>
            <div className={styles.farmerInfo}>
              <span className={styles.farmerLabel}>Grown & prepared by</span>
              <span className={styles.farmerName}>{farmer.stallName}</span>
              {farmer.stallNumber && (
                <span className={styles.farmerLocation}>{farmer.stallNumber}</span>
              )}
            </div>
            <ChevronRight size={18} className={styles.farmerChevron} aria-hidden="true" />
          </button>
        )}

        {/* Description */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>About this harvest</h2>
          <p className={styles.description}>{product.description}</p>
        </div>

        {/* Harvest Facts */}
        <div className={styles.factsList}>
          {cutoffCountdown && (
            <div className={styles.factItem}>
              <Clock size={16} className={styles.factIcon} aria-hidden="true" />
              <span>Order cutoff: {cutoffCountdown}</span>
            </div>
          )}
          <div className={styles.factItem}>
            <ShieldCheck size={16} className={styles.factIcon} aria-hidden="true" />
            <span>Pay in person at market stall pickup</span>
          </div>
        </div>

        {/* Reviews Section */}
        <div className={styles.section}>
          <div className={styles.reviewsHeader}>
            <h2 className={styles.sectionTitle}>Customer reviews</h2>
            {reviews.length > 0 && (
              <span className={styles.reviewSummary}>
                <Stars rating={product.ratingAvg || 5} />
                <span className={styles.reviewCount}>({reviews.length})</span>
              </span>
            )}
          </div>

          {reviews.length > 0 ? (
            <div className={styles.reviewsList}>
              {reviews.map((rev) => (
                <ReviewItem key={rev.id} review={rev} />
              ))}
            </div>
          ) : (
            <p className={styles.noReviews}>
              No reviews yet for this harvest. Be the first to pre-order and review.
            </p>
          )}
        </div>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <div className={styles.recommendSection}>
            <HorizontalRow
              title="You might also like"
              seeAllLabel="Browse all"
              onSeeAll={() => openSheet('/buyer/products')}
            >
              {relatedProducts.map((item) => (
                <ProductCard key={item.id} product={item} variant="compact" />
              ))}
            </HorizontalRow>
          </div>
        )}
      </div>

      {/* Sticky Bottom Add-to-Cart Action Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerPrice}>
            <span className={styles.footerTotal}>{formatPrice(displayPrice)}</span>
            <span className={styles.footerUnit}>/ {product.unit}</span>
          </div>
          <div className={styles.footerAction}>
            <AddToCartButton
              productId={product.id}
              farmerId={farmer?.id || product.farmerId || product.farmer?.id}
              productName={product.name}
              variant="wide"
              disabled={isSoldOut}
            />
          </div>
        </div>
      </footer>
    </div>
  );
}

export default ProductDetail;
>>>>>>> bc73418815cde522512fe21a2af884eee3163165
