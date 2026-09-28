import React, { useState, useEffect } from 'react';
import { useOnboarding } from '@/context/OnboardingContext';
import Spotlight from './Spotlight';
import TourTooltip from './TourTooltip';
import WelcomeModal from './WelcomeModal';
import RestartModal from './RestartModal';

/**
 * Main OnboardingTour orchestrator component.
 * Renders the welcome screen, interactive spotlight with SVG cutout,
 * smartly positioned tooltips, and restart confirmation modal.
 */
export function OnboardingTour() {
  const {
    isActive,
    showWelcome,
    showRestartModal,
    tourType,
    currentStep,
    currentStepIndex,
    totalSteps,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    finishTour,
    closeRestartModal,
  } = useOnboarding();

  const [targetEl, setTargetEl] = useState(null);

  // Reset target element state when step changes
  useEffect(() => {
    setTargetEl(null);
  }, [currentStepIndex, tourType]);

  // Lock body scroll only on mobile when modal or tour is active to prevent jitter, but allow smooth scroll
  useEffect(() => {
    if (showWelcome || showRestartModal) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [showWelcome, showRestartModal]);

  return (
    <>
      {/* Welcome Screen for genuinely new users */}
      <WelcomeModal
        isOpen={showWelcome}
        role={tourType}
        onStart={() => startTour(tourType)}
        onSkip={skipTour}
      />

      {/* Restart confirmation modal */}
      <RestartModal
        isOpen={showRestartModal}
        role={tourType}
        onConfirm={() => startTour(tourType)}
        onClose={closeRestartModal}
      />

      {/* Interactive Spotlight and Tooltip Walkthrough */}
      {isActive && currentStep && (
        <>
          <Spotlight
            targetSelector={currentStep.target}
            fallbackSelector={currentStep.fallbackTarget}
            onTargetFound={setTargetEl}
          />
          <TourTooltip
            step={currentStep}
            stepIndex={currentStepIndex}
            totalSteps={totalSteps}
            targetElement={targetEl}
            onNext={nextStep}
            onPrev={prevStep}
            onSkip={skipTour}
            onFinish={finishTour}
          />
        </>
      )}
    </>
  );
}

export default OnboardingTour;
