import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import styles from './BackToTop.module.css';

/**
 * Floating BackToTop button with smooth appearance when scrolled down,
 * subtle glassmorphism styling, and smooth window scroll to top.
 */
export function BackToTop({ showAfter = 350 }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > showAfter) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [showAfter]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className={styles.backToTopBtn}
      aria-label="Back to top of page"
      title="Back to top"
    >
      <ArrowUp size={18} strokeWidth={2.4} className={styles.icon} />
      <span className={styles.tooltip}>Back to top</span>
    </button>
  );
}

export default BackToTop;
