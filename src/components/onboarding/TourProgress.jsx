import React from 'react';
import styles from './Onboarding.module.css';

/**
 * Progress indicator for tour steps with numbered pills or subtle dots.
 */
export function TourProgress({ currentStepIndex, totalSteps }) {
  return (
    <div className={styles.progressWrapper} aria-label={`Step ${currentStepIndex + 1} of ${totalSteps}`}>
      <div className={styles.dotsRow}>
        {Array.from({ length: totalSteps }).map((_, idx) => {
          const isActive = idx === currentStepIndex;
          const isCompleted = idx < currentStepIndex;
          return (
            <span
              key={idx}
              className={`${styles.dot} ${isActive ? styles.dotActive : ''} ${isCompleted ? styles.dotCompleted : ''}`}
            />
          );
        })}
      </div>
      <span className={styles.progressText}>
        Step {currentStepIndex + 1} of {totalSteps}
      </span>
    </div>
  );
}

export default TourProgress;
