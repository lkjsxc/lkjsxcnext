import { useState } from 'react';

interface UseDeleteMemo {
  deleteMemo: (memoId: string) => Promise<boolean>; // Return true on success
  loading: boolean;
  error: string | null;
}

const useDeleteMemo = (): UseDeleteMemo => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteMemo = async (memoId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/memo/${memoId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error(`Error deleting memo: ${res.statusText}`);
      }

      // Assuming a successful response (status 200/204) means deletion was successful
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { deleteMemo, loading, error };
};

export default useDeleteMemo;