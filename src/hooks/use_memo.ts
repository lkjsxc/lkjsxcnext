import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Memo, LoadingStates } from '../types/memo';
import { fetchPublicmemo, fetchUsermemo, createMemoApi, updateMemoApi, deleteMemoApi } from '../utils/memo_api';
import { use_central_polling } from './use_central_polling';

export type MemoViewMode = 'user' | 'public' | 'all';

interface UsememoResult {
  memo: Memo[];
  loading: LoadingStates;
  error: string | null;
  createMemo: (title: string, content: string, isPublic?: boolean) => Promise<string | void>;
  updateMemo: (id: string, title: string, content: string, isPublic?: boolean) => Promise<void>;
  deleteMemo: (id: string) => Promise<void>;
  // fetchmemo is no longer exposed as it's managed by central polling
}

export const use_memo = (viewMode: MemoViewMode = 'user'): UsememoResult => {
  const { status } = useSession();
  const [localLoading, setLocalLoading] = useState<LoadingStates>({
    fetching: false,
    creating: false,
    updating: null,
    deleting: null,
  });
  const [localError, setLocalError] = useState<string | null>(null);


  const fetchUserAndPublicMemos = useCallback(async () => {
    const userMemosPromise = (viewMode === 'user' || viewMode === 'all') && status === 'authenticated'
      ? fetchUsermemo()
      : Promise.resolve([]);

    const publicMemosPromise = (viewMode === 'public' || viewMode === 'all')
      ? fetchPublicmemo()
      : Promise.resolve([]);

    const [userMemos, publicMemos] = await Promise.all([userMemosPromise, publicMemosPromise]);

    if (viewMode === 'user' && status !== 'authenticated') {
      // If in 'user' mode but not authenticated, return empty
      return [];
    }

    if (viewMode === 'user') {
      return userMemos;
    } else if (viewMode === 'public') {
      return publicMemos;
    } else { // viewMode === 'all'
      // Combine and remove potential duplicates (though IDs should be unique)
      const memoMap = new Map<string, Memo>();
      userMemos.forEach(m => memoMap.set(m.id, m));
      publicMemos.forEach(m => memoMap.set(m.id, m));
      return Array.from(memoMap.values());
    }
  }, [status, viewMode]); // Depend on status and viewMode


  const memoPollingConfig = useMemo(() => {
    const shouldPollMemos = viewMode === 'public' || status === 'authenticated';

    return {
      id: 'memoFetch',
      fetchFunction: fetchUserAndPublicMemos,
      interval: 5000,
      shouldPoll: shouldPollMemos,
      dependencies: [status, viewMode]
    };
  }, [status, viewMode, fetchUserAndPublicMemos]);

  const memoPollingState = use_central_polling(memoPollingConfig);

  // Effect to handle clearing memos when unauthenticated in user mode
  useEffect(() => {
    if (viewMode === 'user' && status === 'unauthenticated') {
      // If in 'user' mode and unauthenticated, clear memos and errors
      setLocalLoading({ fetching: false, creating: false, updating: null, deleting: null });
      setLocalError(null);
    }
  }, [status, viewMode]);


  const handleApiCall = useCallback(async (apiCall: () => Promise<any>, loadingKey: keyof LoadingStates, successCallback: (data: any) => void, id?: string): Promise<any> => {
    setLocalLoading((prev: LoadingStates) => ({ ...prev, [loadingKey]: id || true }));
    setLocalError(null);
    try {
      const data = await apiCall();
      successCallback(data);
      return data; // Return the data received by the success callback
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'An unknown error occurred.');
      throw err; // Re-throw the error so the caller can handle it if needed
    } finally {
      setLocalLoading((prev: LoadingStates) => ({ ...prev, [loadingKey]: id ? null : false }));
    }
  }, []);


  const createMemo = async (title: string, content: string, isPublic: boolean = false) => {
    const newMemo = await handleApiCall(() => createMemoApi(title, content), 'creating', (newMemo: Memo) => {
      // The central polling will eventually pick up the new memo,
      // but we can optimistically add it to the list if in the correct view mode.
      // This might cause a brief flicker if the poll returns before the optimistic update.
      // A more robust solution might involve coordinating with the central polling state update.
      // For now, we rely on the next poll to sync the state.
    });
    return newMemo.id; // Return the ID of the newly created memo
  };

  const updateMemo = async (id: string, title: string, content: string, isPublic?: boolean): Promise<void> => {
     if (!title.trim()) {
        setLocalError("Memo title cannot be empty.");
        return;
     }
     await handleApiCall(() => updateMemoApi(id, title, content), 'updating', (updatedMemo: Memo) => {
       // The central polling will eventually pick up the update.
       // Optimistic update could be added here, but relying on the next poll for simplicity.
     }, id);
  };

  const deleteMemo = async (id: string) => {
    await handleApiCall(() => deleteMemoApi(id), 'deleting', () => {
      // The central polling will eventually pick up the deletion.
      // Optimistic update could be added here, but relying on the next poll for simplicity.
    }, id);
  };

  // Combine local loading/error with polling state
  const combinedLoading: LoadingStates = {
    fetching: localLoading.fetching || (memoPollingState?.loading ?? false),
    creating: localLoading.creating,
    updating: localLoading.updating,
    deleting: localLoading.deleting,
  };

  const combinedError = localError || memoPollingState?.error || null;


  return {
    memo: memoPollingState?.data || [],
    loading: combinedLoading,
    error: combinedError,
    createMemo,
    updateMemo,
    deleteMemo,
    // fetchmemo is no longer returned
  };
};