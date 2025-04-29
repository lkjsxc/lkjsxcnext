// src/components/EditorTab.tsx
import { useState, useCallback, useEffect, useRef } from 'react';
import type { Session } from 'next-auth';
import { useAutoSave } from '@/hooks/use_auto_save';
import { useMemoUpdateQueue } from '@/hooks/useMemoUpdateQueue'; // Import the update queue hook
import type { Memo } from '@/types/memo';

interface EditorTabProps {
  memo: Memo;
  session: Session | null; // Needed for API calls potentially
  onMemoDeleted: () => void;
  onMemoChange: (updatedMemo: Memo) => void; // Add onMemoChange prop
  // Add onSaveSuccess callback if needed
}


import { updateMemoApi, deleteMemoApi } from '@/utils/memo_api';


export default function EditorTab({ memo, session, onMemoDeleted, onMemoChange }: EditorTabProps) {
  const [title, setTitle] = useState(memo.title);
  const [content, setContent] = useState(memo.content ?? '');
  const [isPublic, setIsPublic] = useState(memo.isPublic);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const initializedMemoId = useRef<string | null>(null);

  // Reset form state only when a new memo is selected (memo.id changes)
  useEffect(() => {
    if (memo.id !== initializedMemoId.current) {
      setTitle(memo.title);
      setContent(memo.content ?? '');
      setIsPublic(memo.isPublic);
      setError(null);
      setSaveSuccess(false);
      setIsSaving(false);
      setIsDeleting(false);
      initializedMemoId.current = memo.id;
    }
    // Note: Subsequent updates to memo (e.g., from polling in parent) will not reset the state
    // The auto-save hook is responsible for saving the local state.
  }, [memo.id]); // Depend only on memo.id

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);
    try {
      await updateMemoApi(memo.id, title, content, isPublic);
      setSaveSuccess(true);
      // Optionally clear success message after a few seconds
      setTimeout(() => setSaveSuccess(false), 3000);
      // Note: We don't need to update local state `memo` here because
      // if the save is successful, the parent list might refetch or
      // the data is considered up-to-date. If you need immediate reflection
      // without full refetch, you might need another callback to update parent.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save memo.');
      setError(err instanceof Error ? err.message : 'Failed to save memo.');
    } finally {
      setIsSaving(false);
    }
  }, [memo.id, title, content, isPublic]);

  // Auto-save hook
  // Wrapper function for auto-save
  // Get the addUpdate function from the queue hook
  const { addUpdate } = useMemoUpdateQueue();

  // Auto-save function that adds to the queue
  const queueAutoSave = useCallback(async (memoId: string, data: { title: string; content: string; isPublic: boolean }) => {
    // Add the update to the queue
    addUpdate({
      id: memoId,
      title: data.title,
      content: data.content,
      isPublic: data.isPublic,
    });
    // Since addUpdate is synchronous, we can return a resolved promise
    return Promise.resolve();
  }, [addUpdate]); // Depend on addUpdate

  // Auto-save hook
  useAutoSave({
    memoId: memo.id,
    data: { title, content, isPublic },
    onSave: queueAutoSave, // Use the function that adds to the queue
    interval: 5000, // Save every 5 seconds
  });

  const handleDelete = useCallback(async () => {
     if (!window.confirm(`Are you sure you want to delete "${memo.title || 'this memo'}"?`)) {
       return;
     }
    setIsDeleting(true);
    setError(null);
    try {
      await deleteMemoApi(memo.id);
      onMemoDeleted(); // Notify parent to clear selection/refetch list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete memo.');
      setIsDeleting(false); // Only set back if deletion failed
      setError(err instanceof Error ? err.message : 'Failed to delete memo.');
      setIsDeleting(false); // Only set back if deletion failed
    }
    // No finally block needed as component might unmount on success
  }, [memo.id, memo.title, onMemoDeleted]);

  return (
    <div className="flex flex-col h-full">
        {/* Header/Toolbar */}
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
            <h2 className="text-xl font-semibold">Edit Memo</h2>
            <div className="flex items-center space-x-2">
                 {/* Public/Private Toggle */}
                 <label className="flex items-center space-x-2 cursor-pointer text-sm">
                    <input
                        type="checkbox"
                        checked={isPublic}
                        onChange={(e) => {
                          setIsPublic(e.target.checked);
                          onMemoChange({ ...memo, title, content, isPublic: e.target.checked });
                        }}
                        className="form-checkbox h-4 w-4 text-blue-600"
                        disabled={isSaving || isDeleting}
                    />
                    <span>Public</span>
                </label>

                {/* Delete Button */}
                <button
                    onClick={handleDelete}
                    disabled={isDeleting || isSaving}
                    className={`px-3 py-1 rounded text-sm ${
                        isDeleting
                        ? 'bg-gray-400 text-gray-800 cursor-not-allowed'
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                </button>

                {/* Save Button */}
            </div>
        </div>

       {/* Status Messages */}
       {error && <p className="mb-2 text-red-500 bg-red-100 p-2 rounded border border-red-300 text-sm">Error: {error}</p>}
       {saveSuccess && <p className="mb-2 text-green-600 bg-green-100 p-2 rounded border border-green-300 text-sm">Saved successfully!</p>}

      {/* Form Fields */}
      <div className="flex flex-col space-y-4 flex-1">
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            onMemoChange({ ...memo, title: e.target.value, content, isPublic });
          }}
          placeholder="Memo Title"
          className="p-2 border rounded text-lg font-medium focus:ring-2 focus:ring-blue-300 focus:outline-none"
          disabled={isSaving || isDeleting}
        />
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            onMemoChange({ ...memo, title, content: e.target.value, isPublic });
          }}
          placeholder="Memo Content..."
          className="p-2 border rounded flex-1 resize-none focus:ring-2 focus:ring-blue-300 focus:outline-none" // flex-1 makes it take available space
          rows={10} // Adjust initial rows as needed
          disabled={isSaving || isDeleting}
        />
      </div>
    </div>
  );
}
