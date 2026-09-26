import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sun, Search, ShoppingBasket, Receipt, User } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useNotificationCount } from '@/hooks/useNotificationCount';
import styles from './BottomNav.module.css';

/**
 * Mobile bottom navigation bar (5 items: Today, Browse, Basket, Orders, You).
 * Active item gets beet icon/label and 2px bar above.
 * Basket item opens the basket sheet; others navigate to pages.
 */
const NAV_ITEMS = [
  { id: 'today',  label: 'Today',  icon: Sun,            path: '/buyer',           matchPaths: ['/buyer'] },
  { id: 'browse', label: 'Browse', icon: Search,         path: '/buyer/products',  matchPaths: ['/buyer/products'] },
  { id: 'basket', label: 'Basket', icon: ShoppingBasket, path: '/buyer/basket',    matchPaths: ['/buyer/basket'] },
  { id: 'orders', label: 'Orders', icon: Receipt,        path: '/buyer/orders',    matchPaths: ['/buyer/orders'] },
  { id: 'you',    label: 'You',    icon: User,           path: '/buyer/profile',   matchPaths: ['/buyer/profile'] },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { count } = useCart();
  const { unreadCount } = useNotificationCount();

  // Determine which nav item is active based on current path
  const getIsActive = (item) => {
    if (item.id === 'today') return location.pathname === '/buyer';
    return location.pathname.startsWith(item.path);
  };

  const handleClick = (item) => {
    const isCurrentActive = item.id === 'today' ? location.pathname === '/buyer' : location.pathname.startsWith(item.path);

    if (isCurrentActive) {
      // If already at top of Today tab, refresh feed
      const atTop = window.scrollY <= 15;
      if (atTop && item.id === 'today') {
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
                data-cart-target={item.id === 'basket' ? '' : undefined}
              >
                {isActive && <span className={styles.bar} aria-hidden="true" />}
                <span className={styles.iconWrap}>
                  <Icon size={24} strokeWidth={1.5} aria-hidden="true" />
                  {item.id === 'basket' && count > 0 && (
                    <span className={styles.badge} data-cart-badge aria-label={`${count} items in basket`}>
                      {count > 9 ? '9+' : count}
                    </span>
                  )}
                  {item.id === 'you' && unreadCount > 0 && (
                    <span className={styles.unreadDot} aria-label={`${unreadCount} unread notifications`} />
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
