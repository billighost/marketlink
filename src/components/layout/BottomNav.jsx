import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Store, Search, ShoppingBasket, Receipt, User } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import styles from './BottomNav.module.css';

/**
 * Mobile bottom navigation bar (5 items).
 * Active item gets beet icon/label and 2px bar above.
 * Cart item opens the cart sheet; others navigate to pages.
 */
const NAV_ITEMS = [
  { id: 'market',  label: 'Market',  icon: Store,           path: '/buyer',           matchPaths: ['/buyer'] },
  { id: 'browse',  label: 'Browse',  icon: Search,          path: '/buyer/products',  matchPaths: ['/buyer/products'] },
  { id: 'cart',    label: 'Cart',    icon: ShoppingBasket,  path: '/buyer/cart',      matchPaths: ['/buyer/cart'] },
  { id: 'orders',  label: 'Orders',  icon: Receipt,         path: '/buyer/orders',    matchPaths: ['/buyer/orders'] },
  { id: 'you',     label: 'You',     icon: User,            path: '/buyer/profile',   matchPaths: ['/buyer/profile'] },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { count } = useCart();

  // Determine which nav item is active based on current path
  const getIsActive = (item) => {
    const path = location.state?.background?.pathname || location.pathname;
    if (item.id === 'market') return path === '/buyer';
    return path.startsWith(item.path);
  };

  const handleClick = (item) => {
    if (item.id === 'cart') {
      // Open cart as a sheet
      navigate('/buyer/cart', { state: { background: location.state?.background || location } });
      return;
    }

    const currentBase = location.state?.background?.pathname || location.pathname;
    const isCurrentActive = item.id === 'market' ? currentBase === '/buyer' : currentBase.startsWith(item.path);

    if (isCurrentActive) {
      // If a sheet is currently open over this tab, dismiss it back to the tab
      if (location.state?.background) {
        navigate(item.path, { replace: true });
        return;
      }

      // If already at top of Market tab, refresh feed
      const atTop = window.scrollY <= 15;
      if (atTop && item.id === 'market') {
        window.dispatchEvent(new CustomEvent('marketlink:refresh-feed'));
      } else {
        // Smoothly scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      navigate(item.path);
    }
  };

  return (
    <nav className={styles.nav} aria-label="Main navigation">
      <ul className={styles.list} role="list">
        {NAV_ITEMS.map((item) => {
          const isActive = getIsActive(item);
          const Icon = item.icon;
          return (
            <li key={item.id} className={styles.item}>
              <button
                type="button"
                className={`${styles.button} ${isActive ? styles.active : ''}`}
                onClick={() => handleClick(item)}
                aria-current={isActive ? 'page' : undefined}
                data-cart-target={item.id === 'cart' ? '' : undefined}
              >
                {isActive && <span className={styles.bar} aria-hidden="true" />}
                <span className={styles.iconWrap}>
                  <Icon size={24} strokeWidth={1.5} aria-hidden="true" />
                  {item.id === 'cart' && count > 0 && (
                    <span className={styles.badge} data-cart-badge aria-label={`${count} items in cart`}>
                      {count > 9 ? '9+' : count}
                    </span>
                  )}
                </span>
                <span className={styles.label}>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default BottomNav;
