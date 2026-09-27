import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '@/utils/format';
import Illustration from '@/components/domain/Illustration';
import AddToCartButton from '@/components/domain/AddToCartButton';
import QuantityStepper from '@/components/ui/QuantityStepper';
import Badge from '@/components/ui/Badge';
import styles from './ProductCard.module.css';

/**
 * Product card for MarketLink Customer experience.
 * Features:
 *  - Tile aspect ratio: 4/3 compact/grid, 16/10 feature
 *  - Reserved 2-line title height prevents ragged cards
 *  - Clean layout: image tile, name, stall name
 *  - Price + quantity incremental stepper on row 1
 *  - Proper "Add to cart" button under the price and quantity incremental
 *  - Card link covers upper card area without interfering with controls
 */
export function ProductCard({
  product,
  farmer: farmerProp,
  variant = 'compact',
  className = '',
}) {
  const [imgError, setImgError] = useState(false);
  const [selectedQty, setSelectedQty] = useState(1);

  if (!product) return null;

  const farmer = farmerProp || product.farmer;
  const rawAvailability = product.availability || product.stock;
  const isSoldOut = rawAvailability === 'out';
  const isLowStock = rawAvailability === 'low';
  const displayPrice = product.priceCents != null ? product.priceCents : product.price;

  const aspectAttr = variant === 'feature' ? '16/10' : '4/3';
  const maxQty = product.quantityLeft ? Math.min(99, product.quantityLeft) : 99;

  return (
    <article
      className={`${styles.card} ${styles[variant] || styles.compact} ${isSoldOut ? styles.soldOutCard : ''} ${className}`}
      aria-label={`${product.name}, ${formatPrice(displayPrice)} per ${product.unit}`}
    >
      {/* Clickable link to product page covering image tile and title */}
      <Link
        to={`/buyer/products/${product.id}`}
        className={styles.stretchedLink}
        tabIndex={0}
        aria-label={`${product.name} from ${farmer?.stallName || 'Farmer'}`}
      />

      {/* Image tile container */}
      <div
        className={`${styles.imageTile} ${variant === 'feature' ? styles.imageTileFeature : ''}`}
        data-aspect={aspectAttr}
      >
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
            <Illustration
              name={product.art || 'basket'}
              size={variant === 'feature' ? 'lg' : 'md'}
            />
          </div>
        )}

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
          {farmer?.stallName && (
            <span className={styles.farmerName}>{farmer.stallName}</span>
          )}
        </div>

        {/* Footer: Price + Quantity Stepper Row, then Add to Cart button */}
        <div className={styles.footer}>
          <div className={styles.priceRow}>
            <div className={styles.priceGroup}>
              <span className={styles.price}>{formatPrice(displayPrice)}</span>
              <span className={styles.unit}>/ {product.unit}</span>
            </div>

            {!isSoldOut && (
              <div className={styles.stepperWrapper}>
                <QuantityStepper
                  value={selectedQty}
                  onChange={setSelectedQty}
                  min={1}
                  max={maxQty}
                  size="sm"
                  productName={product.name}
                />
              </div>
            )}
          </div>

          <div className={styles.actionWrapper}>
            <AddToCartButton
              productId={product.id}
              farmerId={farmer?.id || product.farmerId || product.farmer?.id}
              productName={product.name}
              quantity={selectedQty}
              onAddSuccess={() => setSelectedQty(1)}
              disabled={isSoldOut}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
