import { useEffect } from 'react';
import { usePolling as usePollingContext } from '../components/PollingContext';
import { Memo } from '@/types/memo';

interface UseMemoPollingOptions {
  list?: boolean; // Set to true to poll for the memo list
  memoId?: string | null; // Provide memo ID to poll for a specific memo
  enabled?: boolean; // Whether polling is enabled, default true
}

const useMemoPolling = (options?: UseMemoPollingOptions) => {
  const { list = false, memoId = null, enabled = true } = options || {};
  const pollingContext = usePollingContext();

  useEffect(() => {
    if (!enabled) {
      // If disabled, stop any active polling related to this hook instance
      if (list) {
        pollingContext.stopMemoListPolling();
      }
      if (memoId) {
        pollingContext.stopMemoPolling(); // Stop polling for any specific memo
      }
      return;
    }

    if (list) {
      pollingContext.startMemoListPolling();
    } else {
      pollingContext.stopMemoListPolling();
    }

    if (memoId) {
      pollingContext.startMemoPolling(memoId);
    } else {
      pollingContext.stopMemoPolling(); // Stop polling for any specific memo
    }

    // Cleanup: stop polling when the component unmounts or options change
    return () => {
      if (list) {
        pollingContext.stopMemoListPolling();
      }
      if (memoId) {
        pollingContext.stopMemoPolling(); // Stop polling for any specific memo
      }
    };
  }, [list, memoId, enabled, pollingContext]);

  // Return data based on options
  if (list) {
    return { data: pollingContext.getMemoListData() as Memo[] | null, loading: false, error: null }; // TODO: Add loading/error to context
  } else if (memoId) {
    return { data: pollingContext.getMemoDetailsData(memoId) as Memo | null, loading: false, error: null }; // TODO: Add loading/error to context
  } else {
    return { data: null, loading: false, error: null };
  }
};

export default useMemoPolling;