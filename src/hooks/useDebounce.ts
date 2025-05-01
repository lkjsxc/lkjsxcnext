import { useState, useEffect } from 'react';

function useDebounce<T>(value: T, delay: number): T {
  // State to store debounced value
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancel the timeout if value changes (also on unmount)
    // This is how we prevent debounced value from updating too early
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Only re-call effect if value or delay changes

  return debouncedValue;
}

export { useDebounce };