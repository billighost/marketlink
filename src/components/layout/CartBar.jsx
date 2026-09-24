import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/utils/format';
import styles from './CartBar.module.css';

/**
 * Floating cart pill that appears when the cart has items.
 * Hidden on the Cart page, when any sheet is open, and when the cart is empty.
 */
export function CartBar() {
  const { count, subtotal } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  // Don't show when cart is empty
  if (count === 0) return null;

  // Don't show when a sheet is already open
  if (location.state?.background) return null;

  // Don't show on the Cart route itself
  if (location.pathname === '/buyer/cart') return null;

  const handleClick = () => {
    navigate('/buyer/cart', { state: { background: location } });
  };

  return (
    <button
      type="button"
      className={styles.bar}
      onClick={handleClick}
      aria-label={`View cart, ${count} items, ${formatPrice(subtotal)}`}
      data-cart-bar
    >
      <span className={styles.text}>
        View cart · {count} {count === 1 ? 'item' : 'items'} · {formatPrice(subtotal)}
      </span>
    </button>
  );
}

export default CartBar;
