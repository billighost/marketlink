import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { formatPrice } from '@/utils/format';
import { getFarmer } from '@/data/placeholders';
import Illustration from '@/components/domain/Illustration';
import AddToCartButton from '@/components/domain/AddToCartButton';
import Badge from '@/components/ui/Badge';
import styles from './ProductCard.module.css';

/**
 * Product card for MarketLink Customer experience.
 * Minimal design system specifications:
 *  - Tile aspect ratio: 4/3 compact/grid, 16/10 feature
 *  - Reserved 2-line title height prevents ragged cards
 *  - Clean layout: image tile, name, one muted farm line, price + add button
 *  - Heart removed from compact & feature cards (lives in sheet & favorites)
 *  - Stock badge only when 'out' or 'low'
 *  - Card link covers upper card area without overlapping the add-to-cart button
 */
export function ProductCard({
  product,
  farmer: farmerProp,
  variant = 'compact',
  className = '',
}) {
  const location = useLocation();

  if (!product) return null;

  const farmer = farmerProp || getFarmer(product.farmerId);
  const isSoldOut = product.stock === 'out';
  const isLowStock = product.stock === 'low';

  const productSheetPath = `/buyer/products/${product.id}`;
  const linkState = { background: location.state?.background || location };
  const aspectAttr = variant === 'feature' ? '16/10' : '4/3';

  return (
    <article
      className={`${styles.card} ${styles[variant] || styles.compact} ${isSoldOut ? styles.soldOutCard : ''} ${className}`}
      aria-label={`${product.name}, ${formatPrice(product.price)} per ${product.unit}`}
    >
      {/* Clickable link to product sheet covering image tile and title */}
      <Link
        to={productSheetPath}
        state={linkState}
        className={styles.stretchedLink}
        tabIndex={0}
        aria-label={`${product.name} from ${farmer?.stallName || 'Farmer'}`}
      />

      {/* Image tile container */}
      <div
        className={`${styles.imageTile} ${variant === 'feature' ? styles.imageTileFeature : ''}`}
        data-aspect={aspectAttr}
      >
        <div className={styles.illustrationWrapper}>
          <Illustration
            name={product.art || 'basket'}
            size={variant === 'feature' ? 'lg' : 'md'}
          />
        </div>

        {/* Stock badge: shown only if out or low */}
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
