import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface Memo {
  id: string;
  title: string;
  content: string | null;
}

interface LoadingStates {
  fetching: boolean;
  creating: boolean;
  updating: string | null;
  deleting: string | null;
}

interface UseMemosResult {
  memos: Memo[];
  loading: LoadingStates;
  error: string | null;
  createMemo: (title: string, content: string) => Promise<void>;
  updateMemo: (id: string, title: string, content: string) => Promise<void>;
  deleteMemo: (id: string) => Promise<void>;
  fetchMemos: () => Promise<void>; // Expose fetchMemos if needed for manual refresh
}

export const useMemos = (): UseMemosResult => {
  const { data: session, status } = useSession();
  const [memos, setMemos] = useState<Memo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<LoadingStates>({
    fetching: false,
    creating: false,
    updating: null,
    deleting: null,
  });

  const fetchMemos = useCallback(async () => {
    if (status !== 'authenticated') return;

    setLoading(prev => ({ ...prev, fetching: true }));
    setError(null);
    try {
      const res = await fetch('/api/memos');
      if (!res.ok) {
        let errorMsg = `Error fetching memos: ${res.status} ${res.statusText}`;
        try {
           const errorData = await res.json();
           errorMsg = errorData.message || errorMsg;
        } catch (jsonError) {
           // Ignore if response is not JSON or empty
        }
        throw new Error(errorMsg);
      }
      const data: Memo[] = await res.json();
      setMemos(data);
    } catch (err) {
      console.error('Failed to fetch memos:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching memos.');
      setMemos([]);
    } finally {
      setLoading(prev => ({ ...prev, fetching: false }));
    }
  }, [status]); // Depend on status

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
    setLoading(prev => ({ ...prev, creating: true }));
    setError(null);
    try {
      const res = await fetch('/api/memos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      if (!res.ok) {
        let errorMsg = `Error creating memo: ${res.status} ${res.statusText}`;
         try { const errorData = await res.json(); errorMsg = errorData.message || errorMsg; } catch (e) {}
        throw new Error(errorMsg);
      }
      const newMemo: Memo = await res.json();
      setMemos(prevMemos => [newMemo, ...prevMemos]);
    } catch (err) {
      console.error('Failed to create memo:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred while creating the memo.');
      throw err; // Re-throw to allow component to handle form clearing etc.
    } finally {
      setLoading(prev => ({ ...prev, creating: false }));
    }
  };

  const updateMemo = async (id: string, title: string, content: string) => {
     if (!title.trim()) {
        setError("Memo title cannot be empty.");
        return;
    }
    setLoading(prev => ({ ...prev, updating: id }));
    setError(null);
    try {
      const res = await fetch(`/api/memos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      if (!res.ok) {
        let errorMsg = `Error updating memo: ${res.status} ${res.statusText}`;
        try { const errorData = await res.json(); errorMsg = errorData.message || errorMsg; } catch (e) {}
        throw new Error(errorMsg);
      }
      const updatedMemo: Memo = await res.json();
      setMemos(prevMemos =>
        prevMemos.map(memo => (memo.id === id ? updatedMemo : memo))
      );
    } catch (err) {
      console.error(`Failed to update memo with id ${id}:`, err);
      setError(err instanceof Error ? err.message : `An unknown error occurred while updating memo ${id}.`);
      throw err; // Re-throw to allow component to handle cancel edit etc.
    } finally {
      setLoading(prev => ({ ...prev, updating: null }));
    }
  };

  const deleteMemo = async (id: string) => {
    setLoading(prev => ({ ...prev, deleting: id }));
    setError(null);
    try {
      const res = await fetch(`/api/memos/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
         let errorMsg = `Error deleting memo: ${res.status} ${res.statusText}`;
         if (res.status !== 204) {
            try { const errorData = await res.json(); errorMsg = errorData.message || errorMsg; } catch (e) {}
         }
        throw new Error(errorMsg);
      }
      setMemos(prevMemos => prevMemos.filter(memo => memo.id !== id));
    } catch (err) {
      console.error(`Failed to delete memo with id ${id}:`, err);
      setError(err instanceof Error ? err.message : `An unknown error occurred while deleting memo ${id}.`);
      throw err; // Re-throw
    } finally {
      setLoading(prev => ({ ...prev, deleting: null }));
    }
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