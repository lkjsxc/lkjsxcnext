// src/components/Explorer.tsx
'use client';

import React, { useState } from 'react';
import useMemos from '@/hooks/useMemos';
import Spinner from './Spinner';
import { Memo } from '@/types';
import { useSession } from 'next-auth/react';

interface ExplorerProps {
  onSelectMemo: (memoId: string | null) => void; // Function to select a memo (null for new memo)
  selectedMemoId: string | null; // The ID of the currently selected memo
}

const Explorer: React.FC<ExplorerProps> = ({ onSelectMemo, selectedMemoId }) => {
  const { data: session } = useSession();
  const [scope, setScope] = useState<'public' | 'private' | 'all'>(session ? 'all' : 'public');
  const { memos, isLoading, error, fetchMemos } = useMemos({ scope });

  // Effect to update scope when session status changes
  React.useEffect(() => {
    setScope(session ? 'all' : 'public');
  }, [session]);

  const handleCreateNewMemo = async () => {
    // Optimistically create a new memo client-side
    // A real implementation might navigate to a new memo creation page or modal
    // For this structure, we'll just clear the selection and let MainWindow handle the "new" state
    onSelectMemo(null);
  };

  const handleMemoClick = (memoId: string) => {
    onSelectMemo(memoId);
  };

  return (
    <div className="w-64 bg-gray-100 dark:bg-gray-900 p-4 flex flex-col h-full border-r border-gray-300 dark:border-gray-700">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Memos</h2>
        {session && (
          <div className="flex space-x-2 mb-2">
            <button
              className={`px-3 py-1 rounded text-sm ${scope === 'public' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}
              onClick={() => setScope('public')}
            >
              Public
            </button>
            <button
              className={`px-3 py-1 rounded text-sm ${scope === 'private' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}
              onClick={() => setScope('private')}
            >
              Private
            </button>
            <button
              className={`px-3 py-1 rounded text-sm ${scope === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}
              onClick={() => setScope('all')}
            >
              All
            </button>
          </div>
        )}
        <button
          onClick={handleCreateNewMemo}
          className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          + New Memo
        </button>
      </div>

      {isLoading && <Spinner />}
      {error && <div className="text-red-500 text-sm">Error loading memos: {error.message}</div>}

      {!isLoading && !error && memos.length === 0 && (
        <div className="text-gray-500 dark:text-gray-400 text-sm">No memos found.</div>
      )}

      <ul className="flex-grow overflow-y-auto">
        {memos.map((memo) => (
          <li
            key={memo.id}
            className={`cursor-pointer p-2 rounded mb-1 transition-colors ${selectedMemoId === memo.id ? 'bg-blue-200 dark:bg-blue-700' : 'hover:bg-gray-200 dark:hover:bg-gray-800'}`}
            onClick={() => handleMemoClick(memo.id)}
          >
            <h3 className="text-md font-medium text-gray-900 dark:text-white truncate">{memo.title || 'Untitled Memo'}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {memo.isPublic ? 'Public' : 'Private'}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Explorer;