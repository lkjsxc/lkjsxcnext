// src/components/MemoEditor.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Memo } from '@/types';
import useAutoSave from '@/hooks/useAutoSave';
import Spinner from './Spinner'; // Assuming Spinner is in the same directory

interface MemoEditorProps {
  memo: Memo;
  onSaveSuccess: (updatedMemo: Memo) => void;
  onSaveError: (error: Error) => void;
  onCancelEdit: () => void; // Function to cancel editing and go back to viewer
}

const MemoEditor: React.FC<MemoEditorProps> = ({
  memo,
  onSaveSuccess,
  onSaveError,
  onCancelEdit,
}) => {
  const [title, setTitle] = useState(memo.title);
  const [content, setContent] = useState(memo.content || '');
  const [isPublic, setIsPublic] = useState(memo.isPublic);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<Error | null>(null);

  // State to track if the user is actively editing (for pausing polling)
  const [isActivelyEditing, setIsActivelyEditing] = useState(false);

  // Data to be passed to useAutoSave
  const autoSaveData = {
    title,
    content,
    isPublic,
  };

  // Integrate with useAutoSave hook
  const { saveNow } = useAutoSave({
    memoId: memo.id,
    data: autoSaveData,
    clientUpdatedAt: memo.clientUpdatedAt.toISOString(), // Pass the original clientUpdatedAt for OCC
    onSaveSuccess: (updatedMemo) => {
      setIsSaving(false);
      setSaveError(null);
      onSaveSuccess(updatedMemo); // Propagate success up
    },
    onSaveError: (error) => {
      setIsSaving(false);
      setSaveError(error);
      onSaveError(error); // Propagate error up
    },
    isEditing: isActivelyEditing, // Pass the active editing state
  });

  // Effect to update local state when the memo prop changes (e.g., after a successful save refetches)
  useEffect(() => {
    setTitle(memo.title);
    setContent(memo.content || '');
    setIsPublic(memo.isPublic);
  }, [memo]);

  // Handlers for input changes
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setIsActivelyEditing(true); // User is actively editing
    setIsSaving(true); // Indicate saving is in progress (will be debounced)
    setSaveError(null); // Clear previous errors on new input
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsActivelyEditing(true); // User is actively editing
    setIsSaving(true); // Indicate saving is in progress (will be debounced)
    setSaveError(null); // Clear previous errors on new input
  };

  const handlePublicToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsPublic(e.target.checked);
    setIsActivelyEditing(true); // User is actively editing
    setIsSaving(true); // Indicate saving is in progress (will be debounced)
    setSaveError(null); // Clear previous errors on new input
  };

  // Handle blur events to potentially trigger an immediate save
  const handleBlur = useCallback(() => {
    setIsActivelyEditing(false); // User is no longer actively editing
    saveNow(); // Trigger an immediate save on blur
  }, [saveNow]);

  // Handle cancel button click
  const handleCancel = useCallback(() => {
    setIsActivelyEditing(false); // Ensure polling resumes if it was paused
    onCancelEdit();
  }, [onCancelEdit]);

  return (
    <div className="p-4 flex flex-col h-full">
      <div className="mb-4">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          onBlur={handleBlur}
          placeholder="Memo Title"
          className="w-full text-2xl font-bold bg-transparent border-b border-gray-300 dark:border-gray-700 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 text-gray-900 dark:text-white pb-2"
        />
      </div>
      <div className="mb-4 flex items-center space-x-2">
        <label htmlFor="isPublic" className="text-gray-700 dark:text-gray-300">
          Public:
        </label>
        <input
          type="checkbox"
          id="isPublic"
          checked={isPublic}
          onChange={handlePublicToggle}
          className="form-checkbox h-5 w-5 text-blue-600"
        />
        {isSaving && <Spinner />}
        {saveError && <span className="text-red-500 text-sm">Save Error: {saveError.message}</span>}
      </div>
      <div className="flex-grow mb-4">
        <textarea
          value={content}
          onChange={handleContentChange}
          onBlur={handleBlur}
          placeholder="Memo Content"
          className="w-full h-full bg-transparent focus:outline-none text-gray-800 dark:text-gray-200 resize-none"
        />
      </div>
      <div className="flex justify-end space-x-2">
        <button
          onClick={handleCancel}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors"
        >
          Cancel
        </button>
        {/* Save button is not strictly needed due to auto-save, but could be added for manual trigger */}
        {/* <button
          onClick={saveNow}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button> */}
      </div>
    </div>
  );
};

export default MemoEditor;