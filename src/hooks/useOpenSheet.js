import { useLocation, useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * Hook to open modal bottom sheets over the current page.
 * Uses React Router background location pattern.
 * If already in a sheet, replaces the current sheet instead of stacking.
 */
export function useOpenSheet() {
  const location = useLocation();
  const navigate = useNavigate();

  const openSheet = useCallback((path, options = {}) => {
    // If we are already viewing a sheet (background exists in state), preserve original background and replace
    const hasBackground = Boolean(location.state?.background);
    const background = location.state?.background || location;

    navigate(path, {
      replace: hasBackground || options.replace,
      state: {
        background,
        from: location.pathname,
        ...options.state,
      },
    });
  }, [location, navigate]);

  const closeSheet = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return { openSheet, closeSheet };
}

export default useOpenSheet;
