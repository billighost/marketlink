import React, { useEffect, useRef } from 'react';
import { ArrowRight, Clock, Sparkles, X } from 'lucide-react';
import Illustration from '@/components/domain/Illustration';
import styles from './Onboarding.module.css';

/**
 * First-Time Welcome Modal.
 * Welcomes new visitors, explains what MarketLink offers based on role,
 * displays estimated duration, and allows instant tour launch or skipping.
 */
export function WelcomeModal({
  isOpen,
  role = 'buyer',
  onStart,
  onSkip,
}) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus modal container on mount
    modalRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onSkip();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onStart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onStart, onSkip]);

  if (!isOpen) return null;

  const isVendor = role === 'vendor' || role === 'farmer';
  const illustrationName = isVendor ? 'stall' : 'basket-tomatoes';

  const headingText = isVendor
    ? 'Welcome to Grower Portal 👋'
    : 'Welcome to MarketLink 👋';

  const subHeadingText = isVendor
    ? "Let's take a quick tour so you can discover how to manage your stall, orders, and market collections."
    : "Let's take a quick tour so you can discover everything you can do on MarketLink.";

  const featuresList = isVendor
    ? [
        'Verify customer pickup codes instantly with one tap',
        'Keep stall inventory live and prevent empty crate trips',
        'Streamline morning packing workflows and harvest orders',
      ]
    : [
        'Browse live morning harvest directly from regional family farms',
        'Reserve produce without upfront payment — inspect and pay cash at the stall',
        'Plan optimal walking circuits with our Market Route Planner',
      ];

  return (
    <div
      className={styles.modalBackdrop}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onSkip();
      }}
    >
      <div
        ref={modalRef}
        className={styles.welcomeCard}
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-modal-title"
        tabIndex={-1}
      >
        {/* Subtle close button */}
        <button
          type="button"
          onClick={onSkip}
          className={styles.welcomeCloseBtn}
          aria-label="Skip onboarding"
        >
          <X size={18} strokeWidth={2.2} />
        </button>

        {/* Hero Illustration */}
        <div className={styles.welcomeIllustrationBox}>
          <Illustration name={illustrationName} size="lg" className={styles.welcomeIllustration} />
          <div className={styles.welcomeGlowBehind} aria-hidden="true" />
        </div>

        {/* Title & Duration Badge */}
        <div className={styles.welcomeHeaderGroup}>
          <div className={styles.durationPill}>
            <Clock size={13} className={styles.durationIcon} aria-hidden="true" />
            <span>2 minute walkthrough</span>
          </div>

          <h2 id="welcome-modal-title" className={styles.welcomeTitle}>
            {headingText}
          </h2>

          <p className={styles.welcomeSubtitle}>
            {subHeadingText}
          </p>
        </div>

        {/* Key Features Bullet List */}
        <div className={styles.welcomeBullets}>
          {featuresList.map((feat, idx) => (
            <div key={idx} className={styles.welcomeBulletItem}>
              <span className={styles.bulletCheck} aria-hidden="true">
                <Sparkles size={13} />
              </span>
              <span className={styles.bulletText}>{feat}</span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className={styles.welcomeActions}>
          <button
            type="button"
            onClick={onStart}
            className={styles.startTourBtn}
            autoFocus
          >
            <span>Start Tour</span>
            <ArrowRight size={17} strokeWidth={2.2} />
          </button>

          <button
            type="button"
            onClick={onSkip}
            className={styles.skipWelcomeBtn}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}

export default WelcomeModal;
