// src/components/MainWindow.tsx
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Memo } from '@/types';
import useMemoDetail from '@/hooks/useMemoDetail';
import MemoViewer from './MemoViewer';
import MemoEditor from './MemoEditor';
import Spinner from './Spinner';
import { useSession } from 'next-auth/react';

interface MainWindowProps {
  selectedMemoId: string | null; // The ID of the currently selected memo (null for new)
  onMemoCreated: (newMemoId: string) => void; // Callback after a new memo is created
  onMemoDeleted: () => void; // Callback after a memo is deleted
  onMemoUpdated: (updatedMemo: Memo) => void; // Callback after a memo is updated
}

const MainWindow: React.FC<MainWindowProps> = ({
  selectedMemoId,
  onMemoCreated,
  onMemoDeleted,
  onMemoUpdated,
}) => {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<Error | null>(null);
  const [deleteError, setDeleteError] = useState<Error | null>(null);

  // Use the useMemoDetail hook to fetch and manage the selected memo
  const {
    memo,
    isLoading: isLoadingMemo,
    error: memoError,
    fetchMemo,
    setMemo, // Allow local state updates
  } = useMemoDetail({ memoId: selectedMemoId, isEditing: isEditing || isCreating });

  // Effect to reset state when selectedMemoId changes
  useEffect(() => {
    setIsEditing(false);
    setIsCreating(selectedMemoId === null); // If selectedMemoId is null, we are creating
    setCreateError(null);
    setDeleteError(null);
    // useMemoDetail will handle fetching if selectedMemoId is not null
    if (selectedMemoId === null) {
      // Clear local memo state when creating a new memo
      setMemo(null);
    }
  }, [selectedMemoId, setMemo]);

  // Handle switching to edit mode
  const handleEditClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  // Handle canceling edit mode
  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    // Refetch the memo to discard local changes if needed, or rely on polling
    fetchMemo();
  }, [fetchMemo]);

  // Handle successful save from MemoEditor
  const handleSaveSuccess = useCallback((updatedMemo: Memo) => {
    setIsEditing(false);
    // Update local state immediately with the saved memo
    setMemo(updatedMemo);
    onMemoUpdated(updatedMemo); // Notify parent about the update
    // Polling will eventually update the list in Explorer
  }, [setMemo, onMemoUpdated]);

  // Handle save error from MemoEditor
  const handleSaveError = useCallback((error: Error) => {
    // Handle conflict error specifically
    if (error.message.includes('Conflict')) {
      alert('Conflict: This memo has been updated by someone else. Your changes were not saved. Please refresh to get the latest version.');
      fetchMemo(); // Refetch the latest version on conflict
      setIsEditing(false); // Exit edit mode
    } else {
      setDeleteError(error); // Reuse deleteError state for general save errors for simplicity
      console.error("Memo save error:", error);
    }
  }, [fetchMemo]);


  // Handle creating a new memo
  const handleCreateMemo = useCallback(async (newMemoData: { title: string; content: string; isPublic: boolean }) => {
    setIsSaving(true); // Use a separate state for saving during creation
    setCreateError(null);
    try {
      const response = await fetch('/api/memo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMemoData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const createdMemo: Memo = await response.json();
      onMemoCreated(createdMemo.id); // Notify parent and select the new memo
      setIsCreating(false); // Exit creation mode
      // MemoDetail hook will fetch the newly created memo
    } catch (err: any) {
      setCreateError(err);
      console.error("Error creating memo:", err);
    } finally {
      setIsSaving(false);
    }
  }, [onMemoCreated]);

  // Handle deleting a memo
  const handleDeleteClick = useCallback(async () => {
    if (!memo || !session?.user?.id) return;

    if (window.confirm(`Are you sure you want to delete "${memo.title || 'this memo'}"?`)) {
      setDeleteError(null);
      try {
        const response = await fetch(`/api/memo/${memo.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        onMemoDeleted(); // Notify parent to update the list and clear selection
      } catch (err: any) {
        setDeleteError(err);
        console.error(`Error deleting memo ${memo.id}:`, err);
      }
    }
  }, [memo, session, onMemoDeleted]);

  // State for saving during creation (separate from auto-save)
  const [isSaving, setIsSaving] = useState(false);

  // Local state for new memo creation form
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  // Effect to reset local state when starting new memo creation
  useEffect(() => {
    if (isCreating) {
      setTitle('');
      setContent('');
      setIsPublic(false);
    }
  }, [isCreating]);


  // Render logic
  if (isLoadingMemo || (isCreating && isSaving)) {
    return (
      <div className="flex-grow flex justify-center items-center">
        <Spinner />
      </div>
    );
  }

  if (memoError) {
    return (
      <div className="flex-grow p-4 text-red-500">
        Error loading memo: {memoError.message}
      </div>
    );
  }

  if (createError) {
     return (
      <div className="flex-grow p-4 text-red-500">
        Error creating memo: {createError.message}
      </div>
    );
  }

  if (deleteError) {
     return (
      <div className="flex-grow p-4 text-red-500">
        Error deleting memo: {deleteError.message}
      </div>
    );
  }


  if (isCreating) {
    // Render a simplified editor for creating a new memo
    return (
      <div className="p-4 flex flex-col h-full">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">New Memo</h2>
         <div className="mb-4">
            <input
              type="text"
              placeholder="Memo Title"
              className="w-full text-2xl font-bold bg-transparent border-b border-gray-300 dark:border-gray-700 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 text-gray-900 dark:text-white pb-2"
              value={title} // Use local state for new memo title
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="mb-4 flex items-center space-x-2">
            <label htmlFor="isPublicNew" className="text-gray-700 dark:text-gray-300">
              Public:
            </label>
            <input
              type="checkbox"
              id="isPublicNew"
              checked={isPublic} // Use local state for new memo public status
              onChange={(e) => setIsPublic(e.target.checked)}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
             {isSaving && <Spinner />}
          </div>
          <div className="flex-grow mb-4">
            <textarea
              placeholder="Memo Content"
              className="w-full h-full bg-transparent focus:outline-none text-gray-800 dark:text-gray-200 resize-none"
              value={content} // Use local state for new memo content
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        <div className="flex justify-end space-x-2">
           <button
            onClick={() => {
              setIsCreating(false); // Cancel creation
              onMemoDeleted(); // Clear selection in parent - using onMemoDeleted to signal parent to clear selection
            }}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleCreateMemo({ title, content, isPublic })}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            disabled={isSaving || !title} // Disable if saving or title is empty
          >
            {isSaving ? 'Creating...' : 'Create Memo'}
          </button>
        </div>
      </div>
    );
  }

  if (!memo) {
    // Display a message if no memo is selected and not creating
    return (
      <div className="flex-grow flex justify-center items-center text-gray-500 dark:text-gray-400">
        Select a memo from the left or create a new one.
      </div>
    );
  }

  // If a memo is selected and not creating
  return (
    <div className="flex-grow bg-white dark:bg-gray-800 shadow-md rounded-md overflow-hidden">
      {isEditing ? (
        <MemoEditor
          memo={memo}
          onSaveSuccess={handleSaveSuccess}
          onSaveError={handleSaveError}
          onCancelEdit={handleCancelEdit}
        />
      ) : (
        <MemoViewer
          memo={memo}
          isOwner={memo.authorId === session?.user?.id} // Pass ownership status
          onEditClick={handleEditClick}
          onDeleteClick={handleDeleteClick}
        />
      )}
    </div>
  );
};

export default MainWindow;