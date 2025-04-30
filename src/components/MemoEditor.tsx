"use client";

import React, { useState, useEffect } from 'react';
import { MemoWithOwnership } from '@/types';
import useAutoSave from '@/hooks/useAutoSave'; // Will create this hook
import useMemoUpdateQueue from '@/hooks/useMemoUpdateQueue'; // Will create this hook
import { format } from 'date-fns'; // Already installed

interface MemoEditorProps {
  memo: MemoWithOwnership;
  onMemoUpdated: () => void; // Callback to refresh memo detail after successful save/conflict resolution
  onMemoDeleted: () => void; // Callback to handle memo deletion
}

const MemoEditor: React.FC<MemoEditorProps> = ({ memo, onMemoUpdated, onMemoDeleted }) => {
  const [title, setTitle] = useState(memo.title);
  const [content, setContent] = useState(memo.content || '');
  const [isPublic, setIsPublic] = useState(memo.isPublic);

  // Reset state when memo changes
  useEffect(() => {
    setTitle(memo.title);
    setContent(memo.content || '');
    setIsPublic(memo.isPublic);
  }, [memo]);

  // Use the update queue hook
  const { enqueueUpdate, isProcessingQueue } = useMemoUpdateQueue(memo.id, onMemoUpdated);

  // Use the auto-save hook
  useAutoSave({
    title,
    content,
    isPublic,
    memoId: memo.id,
    clientUpdatedAt: memo.clientUpdatedAt,
    onSave: enqueueUpdate, // Trigger queue update on auto-save
  });

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this memo?")) {
      return;
    }

    try {
      const res = await fetch(`/api/memo/${memo.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error(`Error deleting memo: ${res.status}`);
      }

      onMemoDeleted(); // Call the delete callback

    } catch (err) {
      console.error("Failed to delete memo:", err);
      alert("Failed to delete memo.");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <input
          type="text"
          className="w-full text-3xl font-bold mb-2 p-2 border rounded"
          placeholder="Untitled Memo"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="text-sm text-gray-600 mb-2">
          Created: {format(new Date(memo.createdAt), 'PPP p')}
          {' | '}
          Last Updated: {format(new Date(memo.updatedAt), 'PPP p')}
          {' | '}
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">{isPublic ? "Public" : "Private"}</span>
          </label>
        </div>
        <div className="text-sm text-gray-600">Author: {memo.author.name || memo.author.email}</div>
        {isProcessingQueue && <div className="text-sm text-blue-600">Saving...</div>}
      </div>
      <textarea
        className="flex-1 w-full p-4 border rounded bg-gray-50 resize-none outline-none"
        placeholder="Write your memo here..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleDelete}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Delete Memo
        </button>
      </div>
    </div>
  );
};

export default MemoEditor;