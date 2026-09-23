import React from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '@/routes/paths';
import WaveDivider from '@/components/layout/WaveDivider';
import Illustration from '@/components/domain/Illustration';
import styles from './Footer.module.css';

/**
 * Footer component with canvas background and top wave divider.
 * 3-part calm layout: Brand + tagline, 4 key links, copyright.
 */
export function Footer({ withWave = true }) {
  return (
    <footer className={styles.footerWrapper}>
      {withWave && <WaveDivider shape="gentle" className={styles.wave} />}
      <div className={styles.footerBody}>
        <div className={`container ${styles.footerContent}`}>
          {/* Part 1: Brand & Tagline */}
          <div className={styles.brandCol}>
            <Link to={PATHS.HOME} className={styles.brandLink}>
              <Illustration name="basket" size="sm" className={styles.brandIcon} />
              <span className={styles.brandName}>MarketLink</span>
            </Link>
            <p className={styles.tagline}>Made for market days.</p>
            {/* Scalloped awning hairline touch */}
            <svg
              className={styles.awningTouch}
              viewBox="0 0 120 8"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M0,2 Q10,7 20,2 Q30,7 40,2 Q50,7 60,2 Q70,7 80,2 Q90,7 100,2 Q110,7 120,2"
                className={styles.awningPath}
              />
            </svg>
          </div>

          {/* Part 2: Navigation Links */}
          <nav className={styles.navCol} aria-label="Footer Navigation">
            <ul className={styles.linkList} role="list">
              <li>
                <Link to={PATHS.ABOUT} className={styles.footerLink}>
                  About
                </Link>
              </li>
              <li>
                <Link to={PATHS.CONTACT} className={styles.footerLink}>
                  Contact
                </Link>
              </li>
              <li>
                <Link to={PATHS.LOGIN} className={styles.footerLink}>
                  Sign in
                </Link>
              </li>
              <li>
                <Link to={PATHS.REGISTER} className={styles.footerLink}>
                  Create account
                </Link>
              </li>
            </ul>
          </nav>

          {/* Part 3: Copyright */}
          <div className={styles.legalCol}>
            <p className={styles.copyright}>
              © {new Date().getFullYear()} MarketLink. Pre-order for pickup at your local market.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
