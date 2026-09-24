import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { formatPrice } from '@/utils/format';
import { getFarmer } from '@/data/placeholders';
import { useFavorites } from '@/context/FavoritesContext';
import Illustration from '@/components/domain/Illustration';
import AddToCartButton from '@/components/domain/AddToCartButton';
import Badge from '@/components/ui/Badge';
import styles from './ProductCard.module.css';

/**
 * Product card for MarketLink Customer experience.
 * Variants:
 *  - 'compact': 9.5rem fixed width for horizontal rows (Market Home feed)
 *  - 'feature': 16rem fixed width for featured editorial row
 *  - 'grid': Fluid width for 2-column Browse/Products grid
 *  - 'list': Horizontal list item row
 */
export function ProductCard({
  product,
  farmer: farmerProp,
  variant = 'compact',
  className = '',
}) {
  const location = useLocation();
  const { isProductFavorite, toggleProduct } = useFavorites();

  if (!product) return null;

  const farmer = farmerProp || getFarmer(product.farmerId);
  const isFavorite = isProductFavorite(product.id);
  const isSoldOut = product.stock === 'out';
  const isLowStock = product.stock === 'low';

  const handleToggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleProduct(product.id);
  };

  const productSheetPath = `/buyer/products/${product.id}`;
  const linkState = { background: location.state?.background || location };

  return (
    <article
      className={`${styles.card} ${styles[variant] || styles.compact} ${isSoldOut ? styles.soldOutCard : ''} ${className}`}
      aria-label={`${product.name}, ${formatPrice(product.price)} per ${product.unit}`}
    >
      {/* Stretched Link for keyboard and click access */}
      <Link
        to={productSheetPath}
        state={linkState}
        className={styles.stretchedLink}
        tabIndex={0}
        aria-label={`${product.name} from ${farmer?.stallName || 'Farmer'}`}
      />

      {/* Image tile container */}
      <div className={styles.imageTile}>
        <div className={styles.illustrationWrapper}>
          <Illustration
            name={product.art || 'basket'}
            size={variant === 'feature' ? 'lg' : 'md'}
          />
        </div>

        {/* Favorite heart button */}
        <button
          type="button"
          className={`${styles.favoriteButton} ${isFavorite ? styles.favorited : ''}`}
          onClick={handleToggleFavorite}
          aria-label={isFavorite ? `Remove ${product.name} from favorites` : `Save ${product.name} to favorites`}
          aria-pressed={isFavorite}
        >
          <Heart
            size={18}
            strokeWidth={1.75}
            fill={isFavorite ? 'var(--color-beet)' : 'none'}
            className={styles.heartIcon}
            aria-hidden="true"
          />
        </button>

        {/* Stock badge */}
        {isSoldOut && (
          <div className={styles.badgeWrapper}>
            <Badge variant="danger" size="sm">Sold out</Badge>
          </div>
        )}
        {!isSoldOut && isLowStock && (
          <div className={styles.badgeWrapper}>
            <Badge variant="warning" size="sm">
              {product.quantityLeft ? `${product.quantityLeft} left` : 'Low stock'}
            </Badge>
          </div>
        )}
      </div>

      {/* Product Content Details */}
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.name}>{product.name}</h3>
          {farmer && (
            <span className={styles.farmerName}>{farmer.stallName}</span>
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.priceGroup}>
            <span className={styles.price}>{formatPrice(product.price)}</span>
            <span className={styles.unit}>/ {product.unit}</span>
          </div>

          <div className={styles.actionWrapper}>
            <AddToCartButton
              productId={product.id}
              productName={product.name}
              variant="icon"
              disabled={isSoldOut}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
