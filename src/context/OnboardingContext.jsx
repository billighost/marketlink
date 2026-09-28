import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getStepsForRole, BUYER_STEPS, VENDOR_STEPS, GUEST_STEPS } from '@/components/onboarding/tourSteps';

const OnboardingContext = createContext(null);

const STORAGE_KEY_PREFIX = 'marketlink_onboarding_completed';

export function OnboardingProvider({ children }) {
  const { role, isCheckingSession, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tour type: 'buyer' | 'vendor' | 'guest'
  const activeRole = useMemo(() => {
    if (role === 'farmer' || role === 'vendor') return 'vendor';
    if (role === 'customer' || role === 'buyer') return 'buyer';
    return 'guest';
  }, [role]);

  const [tourType, setTourType] = useState(activeRole);
  const [isActive, setIsActive] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Keep tourType in sync with role when tour is not actively running
  useEffect(() => {
    if (!isActive) {
      setTourType(activeRole);
    }
  }, [activeRole, isActive]);

  const steps = useMemo(() => {
    return getStepsForRole(tourType);
  }, [tourType]);

  const currentStep = steps[currentStepIndex] || null;
  const totalSteps = steps.length;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  // Check if tour has been completed or skipped previously
  const checkIsCompleted = useCallback((type = activeRole) => {
    try {
      const specificKey = `${STORAGE_KEY_PREFIX}_${type}`;
      const hasSpecific = localStorage.getItem(specificKey) === 'true';
      return hasSpecific;
    } catch {
      return false;
    }
  }, [activeRole]);

  // Mark tour completed/skipped in localStorage
  const markCompleted = useCallback((type = tourType) => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX, 'true');
      localStorage.setItem(`${STORAGE_KEY_PREFIX}_${type}`, 'true');
    } catch {
      // ignore storage errors
    }
  }, [tourType]);

  // Automatic first-time user detection
  useEffect(() => {
    if (isCheckingSession) return;

    // Do not trigger welcome on auth pages (login, register, forgot-password, etc.)
    const authPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/unauthorized'];
    if (authPaths.includes(location.pathname)) return;

    const alreadyDone = checkIsCompleted(activeRole);
    if (!alreadyDone) {
      // Gentle delayed reveal to allow DOM to hydrate smoothly
      const timer = setTimeout(() => {
        setTourType(activeRole);
        setShowWelcome(true);
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [isCheckingSession, activeRole, checkIsCompleted, location.pathname]);

  // Start tour from step 0
  const startTour = useCallback((overrideType = null) => {
    const targetType = overrideType || activeRole;
    setTourType(targetType);
    setShowWelcome(false);
    setShowRestartModal(false);
    setCurrentStepIndex(0);
    setIsActive(true);

    // If buyer and not on /buyer, navigate to /buyer for best starting experience
    if (targetType === 'buyer' && !location.pathname.startsWith('/buyer')) {
      navigate('/buyer');
    } else if (targetType === 'vendor' && !location.pathname.startsWith('/vendor')) {
      navigate('/vendor');
    } else if (targetType === 'guest' && location.pathname !== '/') {
      navigate('/');
    }
  }, [activeRole, location.pathname, navigate]);

  // Advance to next step
  const nextStep = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      // Completed last step!
      markCompleted(tourType);
      setIsActive(false);
      setCurrentStepIndex(0);
    }
  }, [currentStepIndex, totalSteps, markCompleted, tourType]);

  // Step backwards
  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  // Skip tour
  const skipTour = useCallback(() => {
    markCompleted(tourType);
    setIsActive(false);
    setShowWelcome(false);
    setShowRestartModal(false);
    setCurrentStepIndex(0);
  }, [markCompleted, tourType]);

  // Finish tour explicitly
  const finishTour = useCallback(() => {
    markCompleted(tourType);
    setIsActive(false);
    setCurrentStepIndex(0);
  }, [markCompleted, tourType]);

  // Open Restart modal
  const openRestartModal = useCallback((overrideType = null) => {
    if (overrideType) {
      setTourType(overrideType);
    } else {
      setTourType(activeRole);
    }
    setShowRestartModal(true);
  }, [activeRole]);

  const closeRestartModal = useCallback(() => {
    setShowRestartModal(false);
  }, []);

  const value = useMemo(
    () => ({
      isActive,
      showWelcome,
      showRestartModal,
      tourType,
      currentStepIndex,
      currentStep,
      totalSteps,
      isFirstStep,
      isLastStep,
      startTour,
      nextStep,
      prevStep,
      skipTour,
      finishTour,
      openRestartModal,
      closeRestartModal,
      setShowWelcome,
      checkIsCompleted,
    }),
    [
      isActive,
      showWelcome,
      showRestartModal,
      tourType,
      currentStepIndex,
      currentStep,
      totalSteps,
      isFirstStep,
      isLastStep,
      startTour,
      nextStep,
      prevStep,
      skipTour,
      finishTour,
      openRestartModal,
      closeRestartModal,
      checkIsCompleted,
    ]
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return ctx;
}

export default OnboardingContext;
