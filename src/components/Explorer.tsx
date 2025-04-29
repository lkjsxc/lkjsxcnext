'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Memo } from '@/types/memo'; // Assuming a type definition for Memo exists

interface ExplorerProps {
  onSelectMemo: (memoId: string | null) => void;
}
const Explorer: React.FC<ExplorerProps> = ({ onSelectMemo }) => {
  const { data: session, status } = useSession();
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMemos = async () => {
    setLoading(true);
    setError(null);
    try {
      const scope = session ? 'private' : 'public';
      const res = await fetch(`/api/memo?scope=${scope}`);
      if (!res.ok) {
        throw new Error(`Error fetching memos: ${res.statusText}`);
      }
      const data: Memo[] = await res.json();
      setMemos(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemos();

    // Set up polling (e.g., every 10 seconds)
    const pollingInterval = setInterval(fetchMemos, 10000);

    // Clean up interval on component unmount or session status change
    return () => clearInterval(pollingInterval);
  }, [session, status]); // Refetch when session or status changes

  const [selectedMemoId, setSelectedMemoId] = useState<string | null>(null);

  const handleMemoClick = (memoId: string) => {
    setSelectedMemoId(memoId);
    onSelectMemo(memoId);
  };

  return (
    <div className="h-full overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">Memos</h2>
      {loading && <p>Loading memos...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!loading && memos.length === 0 && <p>No memos found.</p>}
      <ul>
        {memos.map(memo => (
          <li
            key={memo.id}
            className={`border-b last:border-b-0 py-2 cursor-pointer hover:bg-gray-50 px-2 ${selectedMemoId === memo.id ? 'bg-blue-100' : ''}`}
            onClick={() => handleMemoClick(memo.id)}
          >
            {memo.title || 'Untitled Memo'} {memo.isPublic ? '(Public)' : '(Private)'}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Explorer;