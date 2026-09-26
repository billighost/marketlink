import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * Navigate to a buyer destination.
 *
 * Kept under its original name so the ~16 existing call sites need no edit, but every
 * destination is now a real page: no background location, no overlay, no history games.
 * New code should call useNavigate() directly. This hook is a compatibility shim and
 * the later stages remove its call sites one page at a time.
 */
export function useOpenSheet() {
  const navigate = useNavigate();

  const openSheet = useCallback((path, options = {}) => {
    navigate(path, { replace: Boolean(options.replace) });
  }, [navigate]);

  const closeSheet = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return { openSheet, closeSheet };
}

export default useOpenSheet;
