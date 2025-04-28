// src/components/EditorTab.tsx
import { useState, useCallback, useEffect } from 'react';
import type { Session } from 'next-auth';
import type { Memo } from '@/types/memo';

interface EditorTabProps {
  memo: Memo;
  session: Session | null; // Needed for API calls potentially
  onMemoDeleted: () => void;
  // Add onSaveSuccess callback if needed
}


// --- Mock API Update/Delete Functions (Replace with actual calls) ---
async function updateMemoApi(id: string, data: Partial<Pick<Memo, 'title' | 'content' | 'isPublic'>>): Promise<Memo> {
    console.log(`Updating memo ${id} with:`, data);
    const response = await fetch(`/api/memos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update memo');
    return response.json();
}

async function deleteMemoApi(id: string): Promise<void> {
    const response = await fetch(`/api/memos/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete memo');
}
// --- End Mock API ---


export default function EditorTab({ memo, session, onMemoDeleted }: EditorTabProps) {
  const [title, setTitle] = useState(memo.title);
  const [content, setContent] = useState(memo.content ?? '');
  const [isPublic, setIsPublic] = useState(memo.isPublic);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Reset form state if the memo prop changes (e.g., user selects a different memo)
  useEffect(() => {
    setTitle(memo.title);
    setContent(memo.content ?? '');
    setIsPublic(memo.isPublic);
    setError(null);
    setSaveSuccess(false);
    setIsSaving(false);
    setIsDeleting(false);
  }, [memo]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);
    try {
      await updateMemoApi(memo.id, { title, content, isPublic });
      setSaveSuccess(true);
      // Optionally clear success message after a few seconds
      setTimeout(() => setSaveSuccess(false), 3000);
      // Note: We don't need to update local state `memo` here because
      // if the save is successful, the parent list might refetch or
      // the data is considered up-to-date. If you need immediate reflection
      // without full refetch, you might need another callback to update parent.
    } catch (err) {
      console.error("Error saving memo:", err);
      setError(err instanceof Error ? err.message : 'Failed to save memo.');
    } finally {
      setIsSaving(false);
    }
  }, [memo.id, title, content, isPublic]);

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
      console.error("Error deleting memo:", err);
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
                        onChange={(e) => setIsPublic(e.target.checked)}
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
                <button
                    onClick={handleSave}
                    disabled={isSaving || isDeleting}
                    className={`px-4 py-1 rounded text-sm font-semibold ${
                        isSaving
                        ? 'bg-gray-400 text-gray-800 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                >
                    {isSaving ? 'Saving...' : 'Save'}
                </button>
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
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Memo Title"
          className="p-2 border rounded text-lg font-medium focus:ring-2 focus:ring-blue-300 focus:outline-none"
          disabled={isSaving || isDeleting}
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Memo Content..."
          className="p-2 border rounded flex-1 resize-none focus:ring-2 focus:ring-blue-300 focus:outline-none" // flex-1 makes it take available space
          rows={10} // Adjust initial rows as needed
          disabled={isSaving || isDeleting}
        />
      </div>
    </div>
  );
}