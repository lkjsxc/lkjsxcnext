import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Memo, LoadingStates } from '../types/memo';
import { fetchAllMemos, createMemoApi, updateMemoApi, deleteMemoApi } from '../utils/memoApi';

interface UseMemosResult {
  memos: Memo[];
  loading: LoadingStates;
  error: string | null;
  createMemo: (title: string, content: string) => Promise<void>;
  updateMemo: (id: string, title: string, content: string) => Promise<void>;
  deleteMemo: (id: string) => Promise<void>;
  fetchMemos: () => Promise<void>;
}

export const useMemos = (): UseMemosResult => {
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
    if (status !== 'authenticated') return;
    handleApiCall(fetchAllMemos, 'fetching', setMemos);
  }, [status, handleApiCall]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchMemos();
    } else if (status === 'unauthenticated') {
      setMemos([]);
      setError(null);
      setLoading({ fetching: false, creating: false, updating: null, deleting: null });
    }
  }, [status, fetchMemos]);

  const createMemo = async (title: string, content: string) => {
    if (!title.trim()) {
        setError("Memo title cannot be empty.");
        return;
    }
    await handleApiCall(() => createMemoApi(title, content), 'creating', (newMemo: Memo) => {
      setMemos(prevMemos => [newMemo, ...prevMemos]);
    });
  };

  const updateMemo = async (id: string, title: string, content: string) => {
     if (!title.trim()) {
        setError("Memo title cannot be empty.");
        return;
    }
    await handleApiCall(() => updateMemoApi(id, title, content), 'updating', (updatedMemo: Memo) => {
      setMemos(prevMemos =>
        prevMemos.map(memo => (memo.id === id ? updatedMemo : memo))
      );
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