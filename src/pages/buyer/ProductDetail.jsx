import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, ChevronRight, Clock, ShieldCheck } from 'lucide-react';
import { getProductDetail, getProductReviews, getRelatedProducts } from '@/api/catalog';
import { useQuery } from '@/hooks/useQuery';
import { formatPrice, formatCountdown } from '@/utils/format';
import { useFavorites } from '@/context/FavoritesContext';
import Illustration from '@/components/domain/Illustration';
import AddToCartButton from '@/components/domain/AddToCartButton';
import ProductCard from '@/components/domain/ProductCard';
import ReviewItem from '@/components/domain/ReviewItem';
import Badge from '@/components/ui/Badge';
import Stars from '@/components/ui/Stars';
import HorizontalRow from '@/components/layout/HorizontalRow';
import Skeleton from '@/components/ui/Skeleton';
import Page from '@/components/layout/Page';
import PageTitle from '@/components/layout/PageTitle';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import styles from './ProductDetail.module.css';

/**
 * Product detail view rendered as a dedicated buyer page.
 * Connected to GET /api/products/:id, /reviews, and /related.
 */
export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
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

  useDocumentTitle(`${product?.name || 'Product Details'} · MarketLink`);

  const reviews = reviewsData?.data || [];
  const relatedProducts = relatedData || [];

  if (loading) {
    return (
      <Page width="detail">
        <div className={styles.container}>
          <div style={{ padding: 'var(--space-6)' }}>
            <Skeleton height="260px" borderRadius="var(--radius-lg)" style={{ marginBottom: 'var(--space-4)' }} />
            <Skeleton height="32px" width="60%" style={{ marginBottom: 'var(--space-2)' }} />
            <Skeleton height="24px" width="40%" style={{ marginBottom: 'var(--space-6)' }} />
            <Skeleton height="80px" borderRadius="var(--radius-md)" />
          </div>
        </div>
      </Page>
    );
  }

  if (error || !product) {
    return (
      <Page width="detail">
        <div className={styles.notFound}>
          <h2>Product not found</h2>
          <p>This harvest item might be out of season or no longer listed.</p>
          <Link to="/buyer/products" className={styles.backLink}>
            Back to all products
          </Link>
        </div>
      </Page>
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
      navigate(`/buyer/stalls/${farmer.id}`);
    }
  };

  return (
    <Page width="detail">
      <PageTitle
        title={product.name}
        backTo="/buyer/products"
        backLabel="Back to browse"
      />
      <div className={styles.container}>
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
              <h2 className={styles.title}>{product.name}</h2>
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
                onSeeAll={() => navigate('/buyer/products')}
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
    </Page>
  );
}

export default ProductDetail;
