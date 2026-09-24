import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BottomSheet from '@/components/ui/BottomSheet';

/**
 * Route wrapper for modal bottom sheets.
 * Handles opening in a BottomSheet, closing via navigate(-1) (or fallback to /buyer),
 * and passes the inSheet flag to child components.
 */
export function SheetRoute({
  children,
  size = 'tall',
  title,
  fallbackPath = '/buyer',
  showBack,
  onBack,
  footer,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClose = () => {
    if (location.state?.background) {
      navigate(-1);
    } else {
      navigate(fallbackPath, { replace: true });
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (location.state?.from) {
      navigate(location.state.from, { replace: true });
    } else {
      handleClose();
    }
  };

  return (
    <div data-sheet-overlay>
      <BottomSheet
        open={true}
        onClose={handleClose}
        size={size}
        title={title}
        showBack={showBack || Boolean(location.state?.from)}
        onBack={handleBack}
        footer={footer}
      >
        {React.isValidElement(children)
          ? React.cloneElement(children, { inSheet: true, onClose: handleClose })
          : children}
      </BottomSheet>
    </div>
  );
}

export default SheetRoute;
