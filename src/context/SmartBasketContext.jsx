import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const SmartBasketContext = createContext(null);

export function SmartBasketProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialParams, setInitialParams] = useState(null);
  const navigate = useNavigate();

  const openSmartBasket = useCallback((params = null) => {
    setInitialParams(params);
    setIsOpen(true);
  }, []);

  const closeSmartBasket = useCallback(() => {
    setIsOpen(false);
  }, []);

  const navigateToSmartBasket = useCallback((params = null) => {
    setIsOpen(false);
    if (params?.prompt) {
      navigate(`/buyer/smart-basket?prompt=${encodeURIComponent(params.prompt)}`);
    } else {
      navigate('/buyer/smart-basket');
    }
  }, [navigate]);

  return (
    <SmartBasketContext.Provider
      value={{
        isOpen,
        initialParams,
        openSmartBasket,
        closeSmartBasket,
        navigateToSmartBasket,
      }}
    >
      {children}
    </SmartBasketContext.Provider>
  );
}

export function useSmartBasket() {
  const ctx = useContext(SmartBasketContext);
  if (!ctx) {
    return {
      isOpen: false,
      initialParams: null,
      openSmartBasket: () => {},
      closeSmartBasket: () => {},
      navigateToSmartBasket: () => {},
    };
  }
  return ctx;
}
