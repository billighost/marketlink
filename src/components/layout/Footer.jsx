import React from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '@/routes/paths';
import WaveDivider from '@/components/layout/WaveDivider';
import Illustration from '@/components/domain/Illustration';
import styles from './Footer.module.css';

/**
 * Footer component with canvas background and top wave divider.
 * 3-part calm layout: Brand + tagline, key links, copyright.
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
