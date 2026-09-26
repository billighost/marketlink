import React from 'react';
import { SkeletonCard } from '@/components/ui/Skeleton';
import styles from './HomeSkeleton.module.css';

/**
 * Layout-matched loading state for the Today page.
 * Exactly mirrors the real layout box for box:
 *  - skeleton h1 line: height: --text-h1 line box, width 60%
 *  - skeleton clock line: height: --text-sm line box, width 40%
 *  - skeleton search: height: --control-h, full width, --radius-md
 *  - skeleton row header: height: --text-h2 line box, width 35%
 *  - skeleton cards x3: width: --card-w-product, aspect 4/3 + 2 text lines
 */
export function HomeSkeleton() {
  return (
    <div className={styles.container} aria-busy="true" aria-label="Loading market page">
      <header className={styles.header}>
        <div className={styles.greetingLine} />
        <div className={styles.clockLine} />
        <div className={styles.searchBox} />
      </header>

      <section className={styles.row}>
        <div className={styles.rowHeader} />
        <div className={styles.cardsTrack}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </section>

      <section className={styles.row}>
        <div className={styles.rowHeader} />
        <div className={styles.cardsTrack}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </section>
    </div>
  );
}

export default HomeSkeleton;
