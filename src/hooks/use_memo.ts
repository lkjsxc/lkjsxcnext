import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Memo, LoadingStates } from '../types/memo';
import { fetchPublicmemo, fetchUsermemo, createMemoApi, updateMemoApi, deleteMemoApi } from '../utils/memo_api';

export type MemoViewMode = 'user' | 'public' | 'all';

interface UsememoResult {
  memo: Memo[];
  loading: LoadingStates;
  error: string | null;
  createMemo: (title: string, content: string, isPublic?: boolean) => Promise<string | void>;
  updateMemo: (id: string, title: string, content: string, isPublic?: boolean) => Promise<void>;
  deleteMemo: (id: string) => Promise<void>;
  fetchmemo: () => Promise<void>;
}

export const use_memo = (viewMode: MemoViewMode = 'user'): UsememoResult => {
  const { status } = useSession();
  const [memo, setmemo] = useState<Memo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<LoadingStates>({
    fetching: false,
    creating: false,
    updating: null,
    deleting: null,
  });

  const handleApiCall = useCallback(async (apiCall: () => Promise<any>, loadingKey: keyof LoadingStates, successCallback: (data: any) => void, id?: string): Promise<any> => {
    setLoading((prev: LoadingStates) => ({ ...prev, [loadingKey]: id || true }));
    setError(null);
    try {
      const data = await apiCall();
      successCallback(data);
      return data; // Return the data received by the success callback
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      throw err; // Re-throw the error so the caller can handle it if needed
    } finally {
      setLoading((prev: LoadingStates) => ({ ...prev, [loadingKey]: id ? null : false }));
    }
  }, []);

  const fetchmemo = useCallback(async () => {
    let userMemos: Memo[] = [];
    let publicMemos: Memo[] = [];

    setLoading(prev => ({ ...prev, fetching: true }));
    setError(null);

    try {
      if (viewMode === 'user' || viewMode === 'all') {
        if (status === 'authenticated') {
          userMemos = await fetchUsermemo();
        } else if (viewMode === 'user') {
           // If in 'user' mode but not authenticated, clear memos
           setmemo([]);
           return;
        }
      }

      if (viewMode === 'public' || viewMode === 'all') {
        publicMemos = await fetchPublicmemo();
      }

      let combinedMemos = [];
      if (viewMode === 'user') {
          combinedMemos = userMemos;
      } else if (viewMode === 'public') {
          combinedMemos = publicMemos;
      } else { // viewMode === 'all'
          // Combine and remove potential duplicates (though IDs should be unique)
          const memoMap = new Map<string, Memo>();
          userMemos.forEach(m => memoMap.set(m.id, m));
          publicMemos.forEach(m => memoMap.set(m.id, m));
          combinedMemos = Array.from(memoMap.values());
      }

      // Sort memos - maybe by creation date or last updated? For now, just list.
      setmemo(combinedMemos);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch memos.');
    } finally {
      setLoading(prev => ({ ...prev, fetching: false }));
    }

  }, [status, viewMode]); // Depend on status and viewMode

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    // Fetch initially based on viewMode and authentication status
    if (viewMode === 'public' || status === 'authenticated') {
       fetchmemo();
       intervalId = setInterval(fetchmemo, 5000); // Poll every 5 seconds
    } else if (viewMode === 'user' && status === 'unauthenticated') {
       // If in 'user' mode and unauthenticated, clear memos and don't poll
       setmemo([]);
       setError(null);
       setLoading({ fetching: false, creating: false, updating: null, deleting: null });
    }


    return () => {
      if (intervalId) {
        clearInterval(intervalId); // Cleanup interval on unmount or dependency change
      }
    };
  }, [status, fetchmemo, viewMode]); // Re-run effect if status, fetchmemo, or viewMode changes


  const createMemo = async (title: string, content: string, isPublic: boolean = false) => {
    const newMemo = await handleApiCall(() => createMemoApi(title, content), 'creating', (newMemo: Memo) => {
      // If in 'user' or 'all' view, add the new memo to the list immediately
      if (viewMode === 'user' || viewMode === 'all') {
         setmemo(prevmemo => [newMemo, ...prevmemo]);
      }
      // If in 'public' view, the new memo won't appear unless it's public,
      // and the next poll will pick it up.
    });
    return newMemo.id; // Return the ID of the newly created memo
  };

  const updateMemo = async (id: string, title: string, content: string, isPublic?: boolean): Promise<void> => {
     if (!title.trim()) {
        setError("Memo title cannot be empty.");
        return;
     }
     await handleApiCall(() => updateMemoApi(id, title, content, isPublic), 'updating', (updatedMemo: Memo) => {
       setmemo(prevmemo => prevmemo.map(memo => (memo.id === updatedMemo.id ? updatedMemo : memo)));
     }, id);
  };

  const deleteMemo = async (id: string) => {
    await handleApiCall(() => deleteMemoApi(id), 'deleting', () => {
      setmemo(prevmemo => prevmemo.filter(memo => memo.id !== id));
    }, id);
  };

  return {
    memo,
    loading,
    error,
    createMemo,
    updateMemo,
    deleteMemo,
    fetchmemo,
  };
};