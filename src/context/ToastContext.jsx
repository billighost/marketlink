import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
import Toast from '@/components/ui/Toast';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toastData, setToastData] = useState(null);
  const toastKeyRef = useRef(0);

  const showToast = useCallback((param) => {
    toastKeyRef.current += 1;
    const opts = typeof param === 'string' ? { message: param } : (param || {});
    setToastData({
      key: toastKeyRef.current,
      message: opts.message || '',
      action: opts.action,
      onAction: () => {
        opts.onAction?.();
        setToastData(null);
      },
      duration: opts.duration || 3000,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToastData(null);
  }, []);

  const show = useCallback((msg) => {
    showToast(msg);
  }, [showToast]);

  const value = useMemo(() => ({ showToast, hideToast, show }), [showToast, hideToast, show]);

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
