'use client';

import React, { useState } from 'react';
import { Memo, LoadingStates } from '@/types/memo';

interface MemoItemProps {
  memo: Memo;
  editingMemoId: string | null;
  loading: LoadingStates;
  onEditClick: (memo: Memo) => void;
  onUpdateMemo: (id: string, title: string, content: string, isPublic?: boolean) => Promise<void>;
  onDeleteMemo: (id: string) => Promise<void>;
  onCancelEdit: () => void;
}

export default function MemoItem({
  memo,
  editingMemoId,
  loading,
  onEditClick,
  onUpdateMemo,
  onDeleteMemo,
  onCancelEdit,
}: MemoItemProps) {
  const [editedMemoTitle, setEditedMemoTitle] = useState(memo.title);
  const [editedMemoContent, setEditedMemoContent] = useState(memo.content || '');

  // Sync internal state when the memo prop changes (e.g., after update)
  React.useEffect(() => {
    setEditedMemoTitle(memo.title);
    setEditedMemoContent(memo.content || '');
  }, [memo]);


  const isEditing = editingMemoId === memo.id;
  const isUpdating = loading.updating === memo.id;
  const isDeleting = loading.deleting === memo.id;

  const handleSaveEdit = async () => {
    await onUpdateMemo(memo.id, editedMemoTitle, editedMemoContent, memo.isPublic);
    // State update and clearing editing state is handled by the parent component's onUpdateMemo callback
  };

  const handleTogglePublic = async () => {
     await onUpdateMemo(memo.id, memo.title, memo.content || '', !memo.isPublic);
  }

  return (
    <li key={memo.id} className="p-4 border rounded-md shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
      {isEditing ? (
        // --- Edit Form ---
        <div className="flex flex-col space-y-3">
          <input
            type="text"
            value={editedMemoTitle}
            onChange={(e) => setEditedMemoTitle(e.target.value)}
            placeholder="Memo Title"
            className="border rounded-md p-2 text-black dark:bg-gray-700 dark:text-white dark:border-gray-600"
            disabled={isUpdating}
          />
          <textarea
            value={editedMemoContent}
            onChange={(e) => setEditedMemoContent(e.target.value)}
            placeholder="Memo Content (optional)"
            className="border rounded-md p-2 text-black dark:bg-gray-700 dark:text-white dark:border-gray-600"
            rows={4}
            disabled={isUpdating}
          />
          <div className="flex space-x-2">
            <button
              onClick={handleSaveEdit}
              className={`px-4 py-2 border rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={isUpdating || !editedMemoTitle.trim()}
            >
              {isUpdating ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={onCancelEdit}
              className="px-4 py-2 border rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 disabled:opacity-50"
              disabled={isUpdating}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        // --- Display Memo ---
        <div>
          <h3 className="text-xl font-semibold break-words">{memo.title}</h3>
          {memo.content && (
            <p className="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">{memo.content}</p>
          )}
          <div className="mt-4 flex items-center space-x-2">
            {/* Public/Private Toggle */}
            <button
              onClick={handleTogglePublic}
              className={`px-3 py-1 border rounded-md text-sm text-white ${memo.isPublic ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'} focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={isUpdating || isDeleting}
            >
              {isUpdating ? 'Saving...' : (memo.isPublic ? 'Public' : 'Private')}
            </button>

            <button
              onClick={() => onEditClick(memo)}
              className="px-3 py-1 border rounded-md text-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 disabled:opacity-50"
               disabled={isUpdating || isDeleting} // Disable if any update/delete is in progress
            >
              Edit
            </button>
            <button
              onClick={() => onDeleteMemo(memo.id)}
              className={`px-3 py-1 border rounded-md text-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={isDeleting || isUpdating} // Disable if *this* is deleting or *any* update is happening
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}