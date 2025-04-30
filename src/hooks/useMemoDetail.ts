// src/hooks/useMemoDetail.ts
import { useState, useEffect, useCallback } from 'react';
import { Memo } from '@/types';
import { usePolling } from '@/components/PollingContext';

interface UseMemoDetailProps {
  memoId: string | null;
  isEditing: boolean; // Flag to indicate if the memo is currently being edited
}

interface UseMemoDetailResult {
  memo: Memo | null;
  isLoading: boolean;
  error: Error | null;
  fetchMemo: () => Promise<void>; // Function to manually refetch the memo
  setMemo: (memo: Memo | null) => void; // Function to update memo state locally
}

const useMemoDetail = ({ memoId, isEditing }: UseMemoDetailProps): UseMemoDetailResult => {
  const [memo, setMemo] = useState<Memo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { registerTask, unregisterTask, pausePolling, resumePolling } = usePolling();

  const fetchMemo = useCallback(async () => {
    if (!memoId) {
      setMemo(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/memo/${memoId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data: Memo = await response.json();
      setMemo(data);
    } catch (err: any) {
      setError(err);
      setMemo(null); // Clear memo on error
      console.error(`Failed to fetch memo ${memoId}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [memoId]);

  // Effect to fetch memo when memoId changes
  useEffect(() => {
    fetchMemo();
  }, [fetchMemo]);

  // Effect to register/unregister polling task
  useEffect(() => {
    if (memoId) {
      // Register polling task for this memo
      registerTask(fetchMemo, `memo-detail-${memoId}`);

      // Pause polling if currently editing
      if (isEditing) {
        pausePolling(`memo-detail-${memoId}`);
      } else {
        resumePolling(`memo-detail-${memoId}`);
      }
    }

    // Cleanup: unregister polling task when memoId changes or component unmounts
    return () => {
      if (memoId) {
        unregisterTask(`memo-detail-${memoId}`);
      }
    };
  }, [memoId, isEditing, registerTask, unregisterTask, pausePolling, resumePolling, fetchMemo]); // Depend on memoId, isEditing, and polling context functions

  // Effect to pause/resume polling based on isEditing state
  useEffect(() => {
    if (memoId) {
      if (isEditing) {
        pausePolling(`memo-detail-${memoId}`);
      } else {
        resumePolling(`memo-detail-${memoId}`);
      }
    }
  }, [memoId, isEditing, pausePolling, resumePolling]);


  return { memo, isLoading, error, fetchMemo, setMemo };
};

export default useMemoDetail;