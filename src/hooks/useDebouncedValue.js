/**
 * Returns a debounced version of a given value.
 */
import { useState, useEffect } from 'react';

export function useDebouncedValue(value, delayMs = 250) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}

export default useDebouncedValue;
