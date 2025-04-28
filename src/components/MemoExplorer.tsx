'use client';

import React from 'react';
import { Memo, LoadingStates } from '@/types/memo'; // Import necessary types

interface MemoExplorerProps {
  memos: Memo[];
  loading: LoadingStates;
  error: string | null;
  // Add a handler for memo selection if needed later
  // onSelectMemo: (memoId: string) => void;
}

const MemoExplorer: React.FC<MemoExplorerProps> = ({ memos, loading, error }) => {
  return (
    <div className="w-full p-4"> {/* Adjusted width as it's now in a pane */}
      {/* Removed h2 as it's in the parent pane header */}
      {loading.fetching ? (
        <p>Loading memos...</p>
      ) : error ? (
        <p className="text-red-500">Error loading memos: {error}</p>
      ) : memos.length === 0 ? (
        <p>No memos available yet.</p>
      ) : (
        <ul className="space-y-4">
          {memos.map((memo) => (
            <li key={memo.id} className="p-4 border rounded-md shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
              <h3 className="text-xl font-semibold break-words">{memo.title}</h3>
              {/* Content is shown in explorer based on README */}
              {memo.content && (
                <p className="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">{memo.content}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MemoExplorer;