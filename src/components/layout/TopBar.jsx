import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { PATHS } from '@/routes/paths';
import Button from '@/components/ui/Button';
import Illustration from '@/components/domain/Illustration';
import styles from './TopBar.module.css';

/**
 * TopBar navigation header for guest pages.
 * Desktop: logo, 2 nav links, text link "Sign in", secondary button "Get started".
 * Mobile (<768px): collapsible drawer with focus trap and escape listener.
 */
export function TopBar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const menuButtonRef = useRef(null);
  const drawerRef = useRef(null);

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Lock body scroll and handle keyboard events (Escape and focus trap)
  useEffect(() => {
    if (!isOpen) {
      document.body.classList.remove('noScroll');
      return;
    }

    document.body.classList.add('noScroll');

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusableEls = drawerRef.current.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableEls.length === 0) return;

        const firstEl = focusableEls[0];
        const lastEl = focusableEls[focusableEls.length - 1];

        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Focus the first item in the drawer when opened
    const timer = setTimeout(() => {
      if (drawerRef.current) {
        const firstFocusable = drawerRef.current.querySelector('a, button');
        firstFocusable?.focus();
      }
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('noScroll');
      clearTimeout(timer);
    };
  }, [isOpen]);

  const toggleMenu = () => {
    if (isOpen) {
      setIsOpen(false);
      menuButtonRef.current?.focus();
    } else {
      setIsOpen(true);
    }
  };

  const navLinkClass = ({ isActive }) =>
    `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`;

  return (
    <header className={styles.header}>
      <div className={`container ${styles.barInner}`}>
        {/* Brand Logo */}
        <Link to={PATHS.HOME} className={styles.logoLink} aria-label="MarketLink Home">
          <Illustration name="basket" size="sm" className={styles.logoIllustration} />
          <span className={styles.logoText}>MarketLink</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.desktopNav} aria-label="Main Navigation">
          <ul className={styles.navList} role="list">
            <li>
              <NavLink to={PATHS.ABOUT} className={navLinkClass}>
                About
              </NavLink>
            </li>
            <li>
              <NavLink to={PATHS.CONTACT} className={navLinkClass}>
                Contact
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Desktop Actions */}
        <div className={styles.desktopActions}>
          <Link to={PATHS.LOGIN} className={styles.signInLink}>
            Sign in
          </Link>
          <Button
            as={Link}
            to={PATHS.REGISTER}
            variant="secondary"
            size="sm"
            className={styles.getStartedButton}
          >
            Get started
          </Button>
        </div>

        {/* Mobile Menu Button (<768px) */}
        <button
          ref={menuButtonRef}
          type="button"
          className={styles.menuButton}
          onClick={toggleMenu}
          aria-expanded={isOpen}
          aria-controls="mobile-nav-drawer"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
        >
          {isOpen ? (
            <X size={20} strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <Menu size={20} strokeWidth={1.5} aria-hidden="true" />
          )}
          <span className={styles.menuButtonLabel}>{isOpen ? 'Close' : 'Menu'}</span>
        </button>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div
          id="mobile-nav-drawer"
          ref={drawerRef}
          className={styles.drawer}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
        >
          <nav className={styles.drawerNav} aria-label="Mobile Navigation">
            <ul className={styles.drawerList} role="list">
              <li>
                <NavLink
                  to={PATHS.ABOUT}
                  className={navLinkClass}
                  onClick={() => setIsOpen(false)}
                >
                  About
                </NavLink>
              </li>
              <li>
                <NavLink
                  to={PATHS.CONTACT}
                  className={navLinkClass}
                  onClick={() => setIsOpen(false)}
                >
                  Contact
                </NavLink>
              </li>
            </ul>

            <div className={styles.drawerDivider} />

            <div className={styles.drawerActions}>
              <Link
                to={PATHS.LOGIN}
                className={styles.drawerSignInLink}
                onClick={() => setIsOpen(false)}
              >
                Sign in
              </Link>
              <Button
                as={Link}
                to={PATHS.REGISTER}
                variant="secondary"
                size="md"
                className={styles.drawerGetStarted}
                onClick={() => setIsOpen(false)}
              >
                Get started
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export default TopBar;
