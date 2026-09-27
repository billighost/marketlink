import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowUp, Sparkles, ShoppingBasket } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSmartBasket } from '@/context/SmartBasketContext';
import styles from './FloatingActions.module.css';

/**
 * Coordinated floating action stack that provides:
 * 1. AI Assistant round button — present on every page, hidden on the assistant page itself.
 * 2. Back to Top round button — appears smoothly when page is scrolled down (>350px).
 *
 * Automatically adapts positioning above mobile bottom navigation bars.
 */
export function FloatingActions({ showTopAfter = 350 }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showTop, setShowTop] = useState(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  // Monitor scroll for Back to Top appearance
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > showTopAfter) {
        setShowTop(true);
      } else {
        setShowTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [showTopAfter]);

  // Hide floating actions when any sheet, modal, or overlay is open
  useEffect(() => {
    const checkOverlay = () => {
      const hasNoScroll =
        document.body.classList.contains('noScroll') ||
        document.documentElement.classList.contains('noScroll');
      const hasOverlay = Boolean(
        document.querySelector('[data-sheet-overlay], [role="dialog"], [aria-modal="true"]')
      );
      setIsOverlayOpen(hasNoScroll || hasOverlay);
    };

    checkOverlay();

    const observer = new MutationObserver(checkOverlay);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
      childList: true,
      subtree: false,
    });
    window.addEventListener('resize', checkOverlay);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', checkOverlay);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const isAssistantPage = location.pathname === '/buyer/assistant';
  const isSmartBasketPage = location.pathname === '/buyer/smart-basket';
  const { openSmartBasket } = useSmartBasket();

  const handleClickAi = () => {
    if (user && (user.role === 'customer' || user.role === 'buyer')) {
      navigate('/buyer/assistant');
    } else if (user) {
      // Vendor or admin visiting assistant
      navigate('/buyer/assistant');
    } else {
      // Guest: redirect to assistant (ProtectedRoute preserves redirect to login)
      navigate('/buyer/assistant');
    }
  };

  // If a modal or sheet is open, do not render floating actions
  if (isOverlayOpen) {
    return null;
  }

  // If on assistant or smart-basket page and not scrolled down enough for BackToTop, nothing to render
  if (isAssistantPage && isSmartBasketPage && !showTop) {
    return null;
  }

  return (
    <div className={styles.floatingStack} data-floating-actions aria-label="Floating shortcuts">
      {/* 1. AI Assistant Floating Button */}
      {!isAssistantPage && (
        <button
          type="button"
          onClick={handleClickAi}
          className={`${styles.floatBtn} ${styles.aiBtn}`}
          aria-label="Ask MarketLink AI Assistant"
          title="Ask AI Assistant"
        >
          <Sparkles size={20} strokeWidth={2} className={styles.aiIcon} />
          <span className={styles.aiDotBadge} aria-hidden="true" />
          <span className={styles.tooltip}>Ask AI Assistant</span>
        </button>
      )}

      {/* 2. Smart Basket Floating Button */}
      {!isSmartBasketPage && (
        <button
          type="button"
          onClick={() => openSmartBasket()}
          className={`${styles.floatBtn} ${styles.smartBasketBtn}`}
          aria-label="Open Smart Basket"
          title="Open Smart Basket"
        >
          <ShoppingBasket size={21} strokeWidth={2.2} className={styles.basketIcon} />
          <span className={styles.basketDotBadge} aria-hidden="true" />
          <span className={styles.tooltip}>Smart Basket</span>
        </button>
      )}

      {/* 3. Back to Top Floating Button (Renders above buttons when scrolled) */}
      {showTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className={`${styles.floatBtn} ${styles.topBtn}`}
          aria-label="Back to top of page"
          title="Back to top"
        >
          <ArrowUp size={18} strokeWidth={2.4} className={styles.topIcon} />
          <span className={styles.tooltip}>Back to top</span>
        </button>
      )}
    </div>
  );
}

export default FloatingActions;
