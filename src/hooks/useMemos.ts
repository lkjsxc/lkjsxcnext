import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Memo, LoadingStates } from '../types/memo';
import { fetchPublicMemos, fetchUserMemos, createMemoApi, updateMemoApi, deleteMemoApi } from '../utils/memoApi';

interface UseMemosResult {
  memos: Memo[];
  loading: LoadingStates;
  error: string | null;
  createMemo: (title: string, content: string, isPublic?: boolean) => Promise<void>;
  updateMemo: (id: string, title: string, content: string, isPublic?: boolean) => Promise<void>;
  deleteMemo: (id: string) => Promise<void>;
  fetchMemos: () => Promise<void>;
}

export const useMemos = (isPublicView: boolean): UseMemosResult => {
  const { status } = useSession();
  const [memos, setMemos] = useState<Memo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<LoadingStates>({
    fetching: false,
    creating: false,
    updating: null,
    deleting: null,
  });

  const handleApiCall = useCallback(async (apiCall: () => Promise<any>, loadingKey: keyof LoadingStates, successCallback: (data: any) => void, id?: string) => {
    setLoading((prev: LoadingStates) => ({ ...prev, [loadingKey]: id || true }));
    setError(null);
    try {
      const data = await apiCall();
      successCallback(data);
    } catch (err) {
      console.error(`Failed to perform API call for ${String(loadingKey)}:`, err);
      setError(err instanceof Error ? err.message : `An unknown error occurred during ${String(loadingKey)}.`);
      throw err; // Re-throw to allow component to handle errors
    } finally {
      setLoading((prev: LoadingStates) => ({ ...prev, [loadingKey]: id ? null : false }));
    }
  }, []);

  const fetchMemos = useCallback(async () => {
    // Fetch public memos if isPublicView is true, otherwise fetch user's memos
    // Fetch public memos if isPublicView is true, otherwise fetch user's memos
    const apiCall = isPublicView ? fetchPublicMemos : fetchUserMemos;
    handleApiCall(apiCall, 'fetching', setMemos);
  }, [status, handleApiCall, isPublicView]); // Add isPublicView as a dependency

  useEffect(() => {
    // Fetch memos when status or isPublicView changes
    // Fetch memos if authenticated or in public view.
    // Do not fetch if unauthenticated and in private view.
    if (status === 'authenticated' || isPublicView) {
      fetchMemos();
    } else if (status === 'unauthenticated' && !isPublicView) {
      // Clear memos and reset state if unauthenticated and not in public view
      setMemos([]);
      setError(null);
      setLoading({ fetching: false, creating: false, updating: null, deleting: null });
    }
  }, [status, fetchMemos, isPublicView]); // Add isPublicView as a dependency

  const createMemo = async (title: string, content: string) => {
    if (!title.trim()) {
        setError("Memo title cannot be empty.");
        return;
    }
    await handleApiCall(() => createMemoApi(title, content), 'creating', (newMemo: Memo) => {
      setMemos(prevMemos => [newMemo, ...prevMemos]);
    });
  };

  const updateMemo = async (id: string, title: string, content: string, isPublic?: boolean) => {
     if (!title.trim()) {
        setError("Memo title cannot be empty.");
        return;
     }
     await handleApiCall(() => updateMemoApi(id, title, content, isPublic), 'updating', (updatedMemo: Memo) => {
       console.log("API returned updated memo:", updatedMemo);
       setMemos(prevMemos => {
         console.log("Previous memos state:", prevMemos);
         const newMemos = prevMemos.map(memo => (memo.id === id ? updatedMemo : memo));
         console.log("New memos state after update:", newMemos);
         return newMemos;
       });
     }, id);
  };

  const deleteMemo = async (id: string) => {
    await handleApiCall(() => deleteMemoApi(id), 'deleting', () => {
      setMemos(prevMemos => prevMemos.filter(memo => memo.id !== id));
    }, id);
  };

  return {
    memos,
    loading,
    error,
    createMemo,
    updateMemo,
    deleteMemo,
    fetchMemos,
  };
};