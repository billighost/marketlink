import React, { useRef, useState } from 'react';
import { Plus, Check } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { flyToCart, bumpCartIcon, popBadge } from '@/utils/flyToCart';
import QuantityStepper from '@/components/ui/QuantityStepper';
import styles from './AddToCartButton.module.css';

/**
 * Add-to-cart button with micro-animation and stepper transition.
 * Variants:
 *  - 'icon': Compact round button for product cards (transforms into compact stepper once in cart)
 *  - 'wide': Full-width button for product detail sheet / modal
 */
export function AddToCartButton({
  productId,
  productName = 'item',
  variant = 'icon',
  disabled = false,
  className = '',
}) {
  const { getQuantity, add, setQuantity } = useCart();
  const quantity = getQuantity(productId);
  const buttonRef = useRef(null);
  const [animating, setAnimating] = useState(false);

  const handleAddFirst = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    setAnimating(true);
    add(productId);

    if (buttonRef.current) {
      flyToCart(buttonRef.current, () => {
        bumpCartIcon();
        popBadge();
      });
    }

    setTimeout(() => {
      setAnimating(false);
    }, 450);
  };

  const handleQuantityChange = (newQty) => {
    setQuantity(productId, newQty);
  };

  if (disabled) {
    if (variant === 'wide') {
      return (
        <button
          type="button"
          disabled
          className={`${styles.wideButton} ${styles.disabled} ${className}`}
        >
          Sold out
        </button>
      );
    }
    return (
      <button
        type="button"
        disabled
        className={`${styles.iconButton} ${styles.disabled} ${className}`}
        aria-label={`${productName} is sold out`}
      >
        <Plus size={18} strokeWidth={2} aria-hidden="true" />
      </button>
    );
  }

  // If already in cart, show quantity stepper
  if (quantity > 0) {
    return (
      <div
        className={`${styles.stepperWrapper} ${variant === 'wide' ? styles.stepperWide : ''} ${className}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <QuantityStepper
          value={quantity}
          onChange={handleQuantityChange}
          min={0}
          max={99}
          productName={productName}
          compact={variant === 'icon'}
        />
      </div>
    );
  }

  // Wide variant (e.g. for ProductDetail sheet sticky footer)
  if (variant === 'wide') {
    return (
      <button
        ref={buttonRef}
        type="button"
        className={`${styles.wideButton} ${animating ? styles.added : ''} ${className}`}
        onClick={handleAddFirst}
        aria-label={`Add ${productName} to cart`}
      >
        {animating ? (
          <>
            <Check size={18} strokeWidth={2} aria-hidden="true" />
            <span>Added</span>
          </>
        ) : (
          <>
            <Plus size={18} strokeWidth={2} aria-hidden="true" />
            <span>Add to cart</span>
          </>
        )}
      </button>
    );
  }

  // Default: round icon button (for product cards)
  return (
    <button
      ref={buttonRef}
      type="button"
      className={`${styles.iconButton} ${animating ? styles.animating : ''} ${className}`}
      onClick={handleAddFirst}
      aria-label={`Add ${productName} to cart`}
    >
      {animating ? (
        <Check size={18} strokeWidth={2} className={styles.checkIcon} aria-hidden="true" />
      ) : (
        <Plus size={18} strokeWidth={2} aria-hidden="true" />
      )}
    </button>
  );
}

export default AddToCartButton;
