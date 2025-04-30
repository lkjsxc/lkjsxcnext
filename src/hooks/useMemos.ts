// src/hooks/useMemos.ts
import { useState, useEffect, useCallback } from 'react';
import { Memo } from '@/types';
import { usePolling } from '@/components/PollingContext';
import { useSession } from 'next-auth/react';

interface UseMemosProps {
  scope: 'public' | 'private' | 'all'; // Scope for fetching memos
}

interface UseMemosResult {
  memos: Memo[];
  isLoading: boolean;
  error: Error | null;
  fetchMemos: () => Promise<void>; // Function to manually refetch the list
}

const useMemos = ({ scope }: UseMemosProps): UseMemosResult => {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { registerTask, unregisterTask } = usePolling();
  const { data: session, status } = useSession();

  const fetchMemos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Only fetch private/all if authenticated
      if ((scope === 'private' || scope === 'all') && status !== 'authenticated') {
         setMemos([]); // Clear memos if scope requires auth but user is not authenticated
         setIsLoading(false);
         return;
      }

      const response = await fetch(`/api/memo?scope=${scope}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data: Memo[] = await response.json();
      setMemos(data);
    } catch (err: any) {
      setError(err);
      setMemos([]); // Clear memos on error
      console.error(`Failed to fetch memos with scope "${scope}":`, err);
    } finally {
      setIsLoading(false);
    }
  }, [scope, status]); // Depend on scope and session status

  // Effect to register/unregister polling task for the memo list
  useEffect(() => {
    // Only poll if authenticated for private/all scopes
    if (scope === 'public' || status === 'authenticated') {
       registerTask(fetchMemos, `memo-list-${scope}`);
    }


    // Cleanup: unregister polling task when scope changes or component unmounts
    return () => {
      unregisterTask(`memo-list-${scope}`);
    };
  }, [scope, status, registerTask, unregisterTask, fetchMemos]); // Depend on scope, session status, and polling context functions


  return { memos, isLoading, error, fetchMemos };
};

export default useMemos;