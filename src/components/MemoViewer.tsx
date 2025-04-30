// src/components/MemoViewer.tsx
import React from 'react';
import { Memo } from '@/types';
import { formatDate } from '@/lib/utils';

interface MemoViewerProps {
  memo: Memo;
  isOwner: boolean; // Indicates if the current user is the owner
  onEditClick: () => void; // Function to switch to edit mode
  onDeleteClick: () => void; // Function to delete the memo
}

const MemoViewer: React.FC<MemoViewerProps> = ({ memo, isOwner, onEditClick, onDeleteClick }) => {
  return (
    <div className="p-4 flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white break-words flex-grow mr-4">
          {memo.title}
        </h2>
        {isOwner && (
          <div className="flex space-x-2 flex-shrink-0">
            <button
              onClick={onEditClick}
              className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors text-sm"
            >
              Edit
            </button>
            <button
              onClick={onDeleteClick}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
            >
              Delete
            </button>
          </div>
        )}
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        <p>Created: {formatDate(new Date(memo.createdAt))}</p>
        <p>Last Updated: {formatDate(new Date(memo.updatedAt))}</p>
        {/* Display author if needed, though not explicitly in README viewer description */}
        {/* <p>Author: {memo.author?.name || 'Unknown'}</p> */}
      </div>
      <div className="flex-grow overflow-y-auto text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
        {memo.content}
      </div>
    </div>
  );
};

export default MemoViewer;