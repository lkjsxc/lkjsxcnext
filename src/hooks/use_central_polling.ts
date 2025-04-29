import { useState, useEffect, useCallback, useRef } from 'react';

interface PollingConfig<T> {
  shouldPoll: boolean;
  fetchFunction: () => Promise<T>;
  interval: number; // milliseconds
  dependencies?: any[]; // Dependencies for when the polling should be active or re-configured
  processQueue?: () => Promise<void>; // Optional function to process a queue before fetching
}

interface PollingState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}
// Action types
type Action<T> =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS', payload: T }
  | { type: 'FETCH_ERROR', payload: string };

// Reducer function
function pollingReducer<T>(state: PollingState<T>, action: Action<T>): PollingState<T> {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { data: action.payload, loading: false, error: null };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

export const use_central_polling = <T>({ shouldPoll, fetchFunction, interval, dependencies = [], processQueue }: PollingConfig<T>): PollingState<T> => {
  const [state, setState] = useState<PollingState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    setState(prevState => pollingReducer(prevState, { type: 'FETCH_START' }));
    try {
      // Process the queue before fetching new data
      if (processQueue) {
        await processQueue();
      }
      const data = await fetchFunction();
      setState(prevState => pollingReducer(prevState, { type: 'FETCH_SUCCESS', payload: data }));
    } catch (err) {
      setState(prevState => pollingReducer(prevState, { type: 'FETCH_ERROR', payload: err instanceof Error ? err.message : 'An unknown error occurred.' }));
    }
  }, [fetchFunction, processQueue]); // Recreate fetchData if fetchFunction or processQueue changes

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (shouldPoll) {
      // Fetch immediately on mount or when polling starts/dependencies change
      fetchData();

      // Set up new interval
      intervalRef.current = setInterval(() => {
        fetchData();
      }, interval);
    }

    // Cleanup interval on unmount or when dependencies/shouldPoll/interval changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [shouldPoll, interval, fetchData, processQueue, ...dependencies]); // Re-run effect if these dependencies change

  return state;
};