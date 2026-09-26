import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingBasket } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { getMarkets } from '@/api/catalog';
import { useQuery } from '@/hooks/useQuery';
import MarketLinkLogo from '@/components/ui/MarketLinkLogo';
import MarketDropdown from '@/components/layout/MarketDropdown';
import styles from './BuyerTopBar.module.css';

/**
 * Top bar for Customer (buyer) interface.
 * - Under 1024px: Slim bar (56px) with Market selector (grows, truncates), Search icon, Basket icon + count.
 * - 1024px and up: Desktop bar (68px) with Logo, 5 Nav links (Today, Browse, Stalls, Markets, Orders),
 *   Market dropdown, Search icon, Basket button, and Avatar.
 *
 * Accent budget: Exactly ONE beet element in top bar (the active nav link).
 * Hairline border reveals only when scrolled.
 */
export function BuyerTopBar() {
  const { user } = useAuth();
  const { count } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useQuery(['markets'], ({ signal }) => getMarkets({}, signal));

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 4;
      setScrolled((prev) => (prev !== isScrolled ? isScrolled : prev));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const currentPath = location.pathname;

  const getInitials = () => {
    if (user?.firstName && user?.name) {
      const parts = user.name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return user.firstName[0].toUpperCase();
    }
    if (user?.name) {
      const parts = user.name.trim().split(/\s+/);
      return parts.map((p) => p[0]).slice(0, 2).join('').toUpperCase();
    }
    return 'C';
  };

  return (
    <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ''}`} role="banner">
      <div className={styles.container}>
        {/* Brand logo (desktop only >=1024px) */}
        <Link to="/buyer" className={styles.brand} aria-label="MarketLink home">
          <MarketLinkLogo size="sm" />
        </Link>

        {/* Desktop Nav Links (>=1024px only) */}
        <nav className={styles.desktopNav} aria-label="Customer navigation">
          <Link
            to="/buyer"
            className={`${styles.navLink} ${currentPath === '/buyer' ? styles.navLinkActive : ''}`}
          >
            Today
          </Link>
          <Link
            to="/buyer/products"
            className={`${styles.navLink} ${currentPath.startsWith('/buyer/products') ? styles.navLinkActive : ''}`}
          >
            Browse
          </Link>
          <Link
            to="/buyer/stalls"
            className={`${styles.navLink} ${currentPath.startsWith('/buyer/stalls') ? styles.navLinkActive : ''}`}
          >
            Stalls
          </Link>
          <Link
            to="/buyer/markets"
            className={`${styles.navLink} ${currentPath.startsWith('/buyer/markets') ? styles.navLinkActive : ''}`}
          >
            Markets
          </Link>
          <Link
            to="/buyer/orders"
            className={`${styles.navLink} ${currentPath.startsWith('/buyer/orders') ? styles.navLinkActive : ''}`}
          >
            Orders
          </Link>
        </nav>

        {/* Action group: on mobile MarketDropdown flexes on left; Search and Basket on right */}
        <div className={styles.actions}>
          <div className={styles.marketWrapper}>
            <MarketDropdown variant="buyer" />
          </div>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
            className={styles.searchButton}
            aria-label="Search the market"
          >
            <Search size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>

          <Link
            to="/buyer/basket"
            className={styles.cartButton}
            aria-label={`Shopping basket with ${count} items`}
            data-cart-target-desktop
          >
            <ShoppingBasket size={20} strokeWidth={1.75} aria-hidden="true" />
            <span className={styles.cartText}>Basket</span>
            {count > 0 && (
              <span className={styles.badge} data-cart-badge aria-hidden="true">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </Link>

          <Link
            to="/buyer/profile"
            className={styles.avatarButton}
            aria-label={`Your profile, ${user?.name || 'Customer'}`}
          >
            <span className={styles.avatarText}>{getInitials()}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default BuyerTopBar;
