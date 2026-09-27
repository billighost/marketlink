import React, { useRef, useState, useCallback } from 'react';
import { Check, ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { flyToCart, bumpCartIcon, popBadge } from '@/utils/flyToCart';
import styles from './AddToCartButton.module.css';

/**
 * Proper Add to Cart button for cards and detail views.
 * Supports adding custom staged quantity, micro-animations,
 * visual feedback, and live cart item count indicator.
 */
export function AddToCartButton({
  productId,
  farmerId,
  productName = 'item',
  quantity = 1,
  onAddSuccess,
  variant = 'card',
  disabled = false,
  className = '',
}) {
  const { getQuantity, add } = useCart();
  const cartQty = getQuantity(productId);
  const buttonRef = useRef(null);
  const [animating, setAnimating] = useState(false);

  const handleAddToCart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    setAnimating(true);
    add(productId, { farmerId }, quantity);

    if (buttonRef.current) {
      flyToCart(buttonRef.current, () => {
        bumpCartIcon();
        popBadge();
      });
    }

    onAddSuccess?.();

    setTimeout(() => {
      setAnimating(false);
    }, 1200);
  }, [disabled, add, productId, farmerId, quantity, onAddSuccess]);

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className={`${styles.addToCartBtn} ${variant === 'wide' ? styles.wide : ''} ${styles.disabled} ${className}`}
        aria-label={`${productName} is sold out`}
      >
        Sold out
      </button>
    );
  }

  if (animating) {
    return (
      <button
        ref={buttonRef}
        type="button"
        className={`${styles.addToCartBtn} ${variant === 'wide' ? styles.wide : ''} ${styles.animating} ${className}`}
        aria-label={`Added ${quantity} ${productName} to cart`}
      >
        <Check size={16} strokeWidth={2.5} className={styles.checkIcon} aria-hidden="true" />
        <span>Added!</span>
        {cartQty > 0 && (
          <span className={styles.cartBadge} aria-label={`${cartQty} in cart`}>
            {cartQty}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleAddToCart}
      className={`${styles.addToCartBtn} ${variant === 'wide' ? styles.wide : ''} ${className}`}
      aria-label={`Add ${quantity} ${productName} to cart`}
    >
      <ShoppingCart size={15} strokeWidth={2} aria-hidden="true" />
      <span>Add to cart</span>
      {cartQty > 0 && (
        <span className={styles.cartBadge} title={`${cartQty} in cart`}>
          {cartQty}
        </span>
      )}
    </button>
  );
}

export default AddToCartButton;
