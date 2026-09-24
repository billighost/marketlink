import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
import Toast from '@/components/ui/Toast';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toastData, setToastData] = useState(null);
  const toastKeyRef = useRef(0);

  const showToast = useCallback(({ message, action, onAction, duration = 3000 }) => {
    toastKeyRef.current += 1;
    setToastData({
      key: toastKeyRef.current,
      message,
      action,
      onAction: () => {
        onAction?.();
        setToastData(null);
      },
      duration,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToastData(null);
  }, []);

  const value = useMemo(() => ({ showToast, hideToast }), [showToast, hideToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toastData && (
        <Toast
          key={toastData.key}
          message={toastData.message}
          action={toastData.action}
          onAction={toastData.onAction}
          duration={toastData.duration}
          onDismiss={hideToast}
        />
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastContext;
