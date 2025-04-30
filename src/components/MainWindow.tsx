'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Memo } from '@/types/memo'; // Assuming Memo type is defined
import useMemoUpdateQueue from '@/hooks/useMemoUpdateQueue';
import useAutoSave from '@/hooks/useAutoSave';
import useCreateMemo from '@/hooks/useCreateMemo';
import useDeleteMemo from '@/hooks/useDeleteMemo';

interface MainWindowProps {
  selectedMemoId: string | null;
  onMemoCreated: (memoId: string) => void;
  onMemoDeleted: () => void;
}

const MainWindow: React.FC<MainWindowProps> = ({ selectedMemoId, onMemoCreated, onMemoDeleted }) => {
  const { data: session } = useSession();
  const [memo, setMemo] = useState<Memo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  const { addUpdate, isProcessing, error: updateError } = useMemoUpdateQueue();
  const { createMemo, loading: createLoading, error: createError } = useCreateMemo();
  const { deleteMemo, loading: deleteLoading, error: deleteError } = useDeleteMemo();


  // Use useCallback to memoize the update handler for useAutoSave dependency
  const handleAddUpdate = useCallback((update: Omit<Memo, 'clientUpdatedAt'>) => {
    addUpdate(update);
  }, [addUpdate]);

  useAutoSave({
    memo,
    addUpdate: handleAddUpdate,
    isEditing: isOwner && !!memo, // Only auto-save if owner and memo exists
  });

  useEffect(() => {
    const fetchMemo = async () => {
      // Do not fetch if no memo is selected or if the user is the owner (editing)
      if (!selectedMemoId || isOwner) {
        // If no memo selected, clear the current memo state
        if (!selectedMemoId) {
           setMemo(null);
           setIsOwner(false);
        }
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/memo/${selectedMemoId}`);
        if (!res.ok) {
          throw new Error(`Error fetching memo: ${res.statusText}`);
        }
        const data: Memo & { isOwner: boolean } = await res.json();
        setMemo(data);
        setIsOwner(data.isOwner);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMemo();
  }, [selectedMemoId, session]); // Refetch when selectedMemoId or session changes

  const handleCreateNewMemo = async () => {
    // TODO: Decide on initial data for new memo (e.g., title, content, public/private)
    const newMemo = await createMemo({ title: 'New Memo', content: '', isPublic: session ? false : true });
    if (newMemo) {
      console.log('New memo created:', newMemo.id);
      onMemoCreated(newMemo.id); // Call the handler from page.tsx
    }
  };

  const handleDeleteMemo = async () => {
    if (selectedMemoId && confirm('Are you sure you want to delete this memo?')) {
      const success = await deleteMemo(selectedMemoId);
      if (success) {
        console.log('Memo deleted:', selectedMemoId);
        onMemoDeleted(); // Call the handler from page.tsx
      }
    }
  };


  if (!selectedMemoId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <p className="mb-4">Select a memo from the explorer or create a new one.</p>
        <button
          onClick={handleCreateNewMemo}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Create New Memo
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        Loading memo...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        Error loading memo: {error}
      </div>
    );
  }

  if (!memo) {
    return (
       <div className="flex items-center justify-center h-full text-gray-500">
        Memo not found.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Memo Title */}
      <h1 className="text-2xl font-bold mb-4">{memo.title || 'Untitled Memo'}</h1>

      {/* Memo Content */}
      <div className="flex-1 overflow-y-auto">
        {isOwner ? (
          // Editor Mode (Placeholder)
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
               <p className="text-gray-600">Editing as owner...</p>
               {/* Public/Private Toggle */}
               <label className="flex items-center cursor-pointer">
                 <span className="mr-2 text-gray-700">Private</span>
                 <div className="relative">
                   <input
                     type="checkbox"
                     className="sr-only"
                     checked={memo.isPublic}
                     onChange={(e) => setMemo({ ...memo, isPublic: e.target.checked })}
                   />
                   <div className={`block w-14 h-8 rounded-full transition ${memo.isPublic ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                   <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${memo.isPublic ? 'translate-x-full' : ''}`}></div>
                 </div>
                 <span className="ml-2 text-gray-700">Public</span>
               </label>
               <button
                 onClick={handleDeleteMemo}
                 className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
               >
                 Delete Memo
               </button>
            </div>

            {/* Memo Title Input */}
            <input
              type="text"
              className="w-full text-2xl font-bold mb-4 p-2 border rounded"
              value={memo.title}
              onChange={(e) => setMemo({ ...memo, title: e.target.value })}
              placeholder="Untitled Memo"
            />

            {/* Memo Content Textarea */}
            <textarea
              className="flex-1 w-full p-2 border rounded resize-none"
              value={memo.content}
              onChange={(e) => setMemo({ ...memo, content: e.target.value })}
              placeholder="Edit your memo here..."
            />

            {/* Save Status/Error Display */}
            {isProcessing && <p className="text-sm text-gray-500 mt-2">Saving...</p>}
            {updateError && <p className="text-sm text-red-500 mt-2">Save Error: {updateError}</p>}
          </div>
        ) : (
          // Viewer Mode
          <div className="prose max-w-none">
            <p>{memo.content}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainWindow;