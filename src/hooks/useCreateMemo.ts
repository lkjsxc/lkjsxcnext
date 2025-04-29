import { useState } from 'react';
import { Memo } from '@/types/memo'; // Assuming Memo type is defined

interface UseCreateMemo {
  createMemo: (initialData?: { title?: string; content?: string; isPublic?: boolean }) => Promise<Memo | null>;
  loading: boolean;
  error: string | null;
}

const useCreateMemo = (): UseCreateMemo => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMemo = async (initialData = {}): Promise<Memo | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/memo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(initialData),
      });

      if (!res.ok) {
        throw new Error(`Error creating memo: ${res.statusText}`);
      }

      const newMemo: Memo = await res.json();
      // Assuming the API returns the newly created memo
      return newMemo;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createMemo, loading, error };
};

export default useCreateMemo;