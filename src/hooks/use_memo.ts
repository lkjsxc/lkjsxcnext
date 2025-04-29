import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Memo, LoadingStates } from '../types/memo';
import { fetchPublicmemo, fetchUsermemo, createMemoApi, updateMemoApi, deleteMemoApi } from '../utils/memo_api';

interface UsememoResult {
  memo: Memo[];
  loading: LoadingStates;
  error: string | null;
  createMemo: (title: string, content: string, isPublic?: boolean) => Promise<void>;
  updateMemo: (id: string, title: string, content: string, isPublic?: boolean) => Promise<void>;
  deleteMemo: (id: string) => Promise<void>;
  fetchmemo: () => Promise<void>;
}

export const use_memo = (isPublicView: boolean): UsememoResult => {
  const { status } = useSession();
  const [memo, setmemo] = useState<Memo[]>([]);
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
    const data = await apiCall();
    successCallback(data);
    setLoading((prev: LoadingStates) => ({ ...prev, [loadingKey]: id ? null : false }));
  }, []);

  const fetchmemo = useCallback(async () => {
    const apiCall = isPublicView ? fetchPublicmemo : fetchUsermemo;
    handleApiCall(apiCall, 'fetching', setmemo);
  }, [status, handleApiCall, isPublicView]);

  useEffect(() => {
    if (status === 'authenticated' || isPublicView) {
      fetchmemo();
    } else if (status === 'unauthenticated' && !isPublicView) {
      setmemo([]);
      setError(null);
      setLoading({ fetching: false, creating: false, updating: null, deleting: null });
    }
  }, [status, fetchmemo, isPublicView]);


  const createMemo = async (title: string, content: string) => {
    if (!title.trim()) {
        setError("Memo title cannot be empty.");
        return;
    }
    await handleApiCall(() => createMemoApi(title, content), 'creating', (newMemo: Memo) => {
      setmemo(prevmemo => [newMemo, ...prevmemo]);
    });
  };

  const updateMemo = async (id: string, title: string, content: string, isPublic?: boolean) => {
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