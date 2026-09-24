import React from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Heart, ChevronRight, Clock, ShieldCheck, ArrowLeft } from 'lucide-react';
import { getProduct, getFarmer, getReviewsByProduct, getProductsByFarmer, getProductsByCategory } from '@/data/placeholders';
import { formatPrice } from '@/utils/format';
import { useFavorites } from '@/context/FavoritesContext';
import { useOpenSheet } from '@/hooks/useOpenSheet';
import Illustration from '@/components/domain/Illustration';
import AddToCartButton from '@/components/domain/AddToCartButton';
import ProductCard from '@/components/domain/ProductCard';
import ReviewItem from '@/components/domain/ReviewItem';
import Badge from '@/components/ui/Badge';
import Stars from '@/components/ui/Stars';
import HorizontalRow from '@/components/layout/HorizontalRow';
import styles from './ProductDetail.module.css';

/**
 * Product detail view rendered inside a modal bottom sheet (or full-page fallback).
 */
export function ProductDetail({ inSheet = false, onClose }) {
  const { id } = useParams();
  const location = useLocation();
  const { openSheet } = useOpenSheet();
  const { isProductFavorite, toggleProduct } = useFavorites();

  const product = getProduct(id);

  if (!product) {
    return (
      <div className={styles.notFound}>
        <h2>Product not found</h2>
        <p>This item might be out of season or no longer listed.</p>
        <Link to="/buyer/products" className={styles.backLink}>
          Back to all products
        </Link>
      </div>
    );
  }

  const farmer = getFarmer(product.farmerId);
  const isFavorite = isProductFavorite(product.id);
  const reviews = getReviewsByProduct(product.id);
  const isSoldOut = product.stock === 'out';
  const isLowStock = product.stock === 'low';

  const moreFromFarmer = getProductsByFarmer(product.farmerId).filter((p) => p.id !== product.id);
  const similarProducts = getProductsByCategory(product.category).filter(
    (p) => p.id !== product.id && p.farmerId !== product.farmerId
  );

  const handleFarmerClick = (e) => {
    e.preventDefault();
    openSheet(`/buyer/farmers/${farmer.id}`);
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
      <div className={styles.visualContainer}>
        <div className={styles.illustrationWrapper}>
          <Illustration name={product.art || 'basket'} size="xl" />
        </div>

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
            <span className={styles.price}>{formatPrice(product.price)}</span>
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
              <Illustration name={farmer.art || 'crate'} size="sm" />
            </div>
            <div className={styles.farmerInfo}>
              <span className={styles.farmerLabel}>Grown & prepared by</span>
              <span className={styles.farmerName}>{farmer.stallName}</span>
              <span className={styles.farmerLocation}>{farmer.stallNumber}</span>
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
          {product.cutoff && (
            <div className={styles.factItem}>
              <Clock size={16} className={styles.factIcon} aria-hidden="true" />
              <span>{product.cutoff}</span>
            </div>
          )}
          <div className={styles.factItem}>
            <ShieldCheck size={16} className={styles.factIcon} aria-hidden="true" />
            <span>Pay on Saturday at market pickup</span>
          </div>
        </div>

        {/* Reviews Section */}
        <div className={styles.section}>
          <div className={styles.reviewsHeader}>
            <h2 className={styles.sectionTitle}>Customer reviews</h2>
            {reviews.length > 0 && (
              <span className={styles.reviewSummary}>
                <Stars rating={5} />
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
              No reviews yet for this harvest. Be the first to try it!
            </p>
          )}
        </div>

        {/* More from this farmer */}
        {moreFromFarmer.length > 0 && (
          <div className={styles.recommendSection}>
            <HorizontalRow
              title={`More from ${farmer?.stallName || 'this farmer'}`}
              seeAllLabel="View stall"
              onSeeAll={handleFarmerClick}
            >
              {moreFromFarmer.map((item) => (
                <ProductCard key={item.id} product={item} variant="compact" />
              ))}
            </HorizontalRow>
          </div>
        )}

        {/* Similar items */}
        {similarProducts.length > 0 && (
          <div className={styles.recommendSection}>
            <HorizontalRow
              title="You might also like"
              seeAllLabel="Browse all"
              onSeeAll={() => openSheet('/buyer/products')}
            >
              {similarProducts.map((item) => (
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
            <span className={styles.footerTotal}>{formatPrice(product.price)}</span>
            <span className={styles.footerUnit}>/ {product.unit}</span>
          </div>
          <div className={styles.footerAction}>
            <AddToCartButton
              productId={product.id}
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
