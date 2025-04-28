'use client';

import React from 'react';
import { useMemos } from '@/hooks/useMemos'; // Import the custom hook

export default function MemoExplorer() {
  // Use the custom hook to manage memo state and API interactions for public memos
  // Pass true to useMemos to indicate we want public memos
  const { memos, loading, error } = useMemos(true);

  return (
    <div className="w-full md:w-1/2 p-4 border rounded-md shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
      <h2 className="text-2xl font-bold mb-4">Public Memos</h2>
      {loading.fetching ? (
        <p>Loading public memos...</p>
      ) : error ? (
        <p className="text-red-500">Error loading public memos: {error}</p>
      ) : memos.length === 0 ? (
        <p>No public memos available yet.</p>
      ) : (
        <ul className="space-y-4">
          {memos.map((memo) => (
            <li key={memo.id} className="p-4 border rounded-md shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
              <h3 className="text-xl font-semibold break-words">{memo.title}</h3>
              {memo.content && (
                <p className="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">{memo.content}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}