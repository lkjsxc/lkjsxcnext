'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Memo } from '@/types/memo'; // Assuming a type definition for Memo exists
import useMemoPolling from '@/hooks/usePolling';

interface ExplorerProps {
  onSelectMemo: (memoId: string | null) => void;
}

const Explorer: React.FC<ExplorerProps> = ({ onSelectMemo }) => {
  const { data: session, status } = useSession();
  const scope = session ? 'private' : 'public';
  const memoListUrl = `/api/memo?scope=${scope}`;

  const { data: memos, loading, error } = useMemoPolling({ list: true }) as { data: Memo[] | null, loading: boolean, error: string | null };

  const [selectedMemoId, setSelectedMemoId] = useState<string | null>(null);

  const handleMemoClick = (memoId: string) => {
    setSelectedMemoId(memoId);
    onSelectMemo(memoId);
  };

  const handleCreateMemo = async () => {
    if (status !== 'authenticated') {
      alert('You must be signed in to create a memo.');
      return;
    }

    try {
      const res = await fetch('/api/memo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: '',
          content: '',
          isPublic: false, // Default to private for new memos
        }),
      });

      if (!res.ok) {
        throw new Error(`Error creating memo: ${res.statusText}`);
      }

      const newMemo: Memo = await res.json();
      handleMemoClick(newMemo.id); // Select the newly created memo

    } catch (err: any) {
      // Use the error state from usePolling or a local one if needed
      console.error('Error creating memo:', err);
      alert(`Error creating memo: ${err.message}`);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">Memos</h2>
      <button
        className={`mb-4 px-4 py-2 text-white rounded ${status === 'authenticated' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-400 cursor-not-allowed'}`}
        onClick={handleCreateMemo}
        disabled={status !== 'authenticated'}
      >
        Add New Memo
      </button>
      {loading && <p>Loading memos...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!loading && memos && memos.length === 0 && <p>No memos found.</p>}
      <ul>
        {memos && memos.map(memo => (
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