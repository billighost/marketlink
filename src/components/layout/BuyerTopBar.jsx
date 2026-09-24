import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ShoppingBasket } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { homeMarket, getMarket } from '@/data/placeholders';
import Illustration from '@/components/domain/Illustration';
import MarketLinkLogo from '@/components/ui/MarketLinkLogo';
import styles from './BuyerTopBar.module.css';

/**
 * Top bar for the signed-in Customer interface.
 * Responsive specifications:
 *  - Below 1024px (phone & tablet):
 *      Slim bar with market selector only (label above name, min-width 0, truncating).
 *      No avatar (profile lives in bottom nav), no extra buttons.
 *  - 1024px to 1279px (desktop/tablet landscape):
 *      Brand logo, compact market selector (name only, max-width),
 *      4 nav links (Market, Browse, Orders, Favorites), Cart button, and Avatar.
 *  - 1280px and up:
 *      Same structure with generous whitespace.
 */
export function BuyerTopBar() {
  const { user } = useAuth();
  const { count } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 4;
      setScrolled((prev) => (prev !== isScrolled ? isScrolled : prev));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const currentMarket = (user?.homeMarketId ? getMarket(user.homeMarketId) : null) || homeMarket;
  const currentPath = location.state?.background?.pathname || location.pathname;

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

  const handleOpenCart = () => {
    navigate('/buyer/cart', {
      state: { background: location.state?.background || location },
    });
  };

  const handleOpenMarkets = () => {
    navigate('/buyer/markets');
  };

  return (
    <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ''}`} role="banner">
      <div className={styles.container}>
        {/* Left: Brand logo (desktop only >=1024px) */}
        <Link to="/buyer" className={styles.brand} aria-label="MarketLink home">
          <MarketLinkLogo size="sm" />
        </Link>

        {/* Center / Mobile Left: Market selector button */}
        <button
          type="button"
          onClick={handleOpenMarkets}
          className={styles.marketSelector}
          aria-label={`Current market: ${currentMarket.name}. Click to change market.`}
        >
          <div className={styles.marketInfo}>
            <span className={styles.marketLabel}>Picking up from</span>
            <span className={styles.marketName}>
              {currentMarket.name}
              <ChevronDown size={14} className={styles.chevron} aria-hidden="true" />
            </span>
          </div>
        </button>

        {/* Desktop Nav Links (>=1024px only) */}
        <nav className={styles.desktopNav} aria-label="Customer navigation">
          <Link
            to="/buyer"
            className={`${styles.navLink} ${currentPath === '/buyer' ? styles.navLinkActive : ''}`}
          >
            Market
          </Link>
          <Link
            to="/buyer/products"
            className={`${styles.navLink} ${currentPath.startsWith('/buyer/products') ? styles.navLinkActive : ''}`}
          >
            Browse
          </Link>
          <Link
            to="/buyer/orders"
            className={`${styles.navLink} ${currentPath.startsWith('/buyer/orders') ? styles.navLinkActive : ''}`}
          >
            Orders
          </Link>
          <Link
            to="/buyer/favorites"
            className={`${styles.navLink} ${currentPath.startsWith('/buyer/favorites') ? styles.navLinkActive : ''}`}
          >
            Favorites
          </Link>
        </nav>

        {/* Desktop Action Group (>=1024px only) */}
        <div className={styles.actions}>
          {/* Desktop Cart Button */}
          <button
            type="button"
            onClick={handleOpenCart}
            className={styles.cartButton}
            aria-label={`Shopping cart with ${count} items`}
            data-cart-target-desktop
          >
            <ShoppingBasket size={20} strokeWidth={1.75} aria-hidden="true" />
            <span className={styles.cartText}>Cart</span>
            {count > 0 && (
              <span className={styles.badge} data-cart-badge aria-hidden="true">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </button>

          {/* Desktop Avatar button linking to Profile */}
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
