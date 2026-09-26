import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/utils/format';
import styles from './CartBar.module.css';

/**
 * Floating basket pill that appears on mobile/tablet when the basket has items.
 * Hidden on the Cart page, when any sheet is open, and on desktop (1024px+).
 */
export function CartBar() {
  const { count, subtotal } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  // Don't show when basket is empty
  if (count === 0) return null;

  // Don't show on the Basket route itself
  if (location.pathname === '/buyer/basket') return null;

  const handleClick = () => {
    navigate('/buyer/basket');
  };

  return (
    <button
      type="button"
      className={styles.bar}
      onClick={handleClick}
      aria-label={`View basket, ${count} ${count === 1 ? 'item' : 'items'}, ${formatPrice(subtotal)}`}
      data-cart-bar
    >
      <span className={styles.text}>
        View basket · {count} {count === 1 ? 'item' : 'items'} · {formatPrice(subtotal)}
      </span>
    </button>
  );
}

export default CartBar;
