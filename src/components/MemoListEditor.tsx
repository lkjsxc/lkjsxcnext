'use client';

import { useState } from 'react';
import { Memo, LoadingStates } from '@/types/memo'; // Import necessary types
import MemoItem from './MemoItem'; // Import the MemoItem component

interface MemoListEditorProps {
  memos: Memo[];
  loading: LoadingStates;
  error: string | null;
  createMemo: (title: string, content: string) => Promise<void>;
  updateMemo: (id: string, title: string, content: string, isPublic?: boolean) => Promise<void>;
  deleteMemo: (id: string) => Promise<void>;
}

const MemoListEditor: React.FC<MemoListEditorProps> = ({
  memos,
  loading,
  error,
  createMemo,
  updateMemo,
  deleteMemo,
}) => {
  const [newMemoTitle, setNewMemoTitle] = useState('');
  const [newMemoContent, setNewMemoContent] = useState('');
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [editedMemoTitle, setEditedMemoTitle] = useState('');
  const [editedMemoContent, setEditedMemoContent] = useState('');

  const handleCreateMemo = async () => {
    try {
      await createMemo(newMemoTitle, newMemoContent);
      setNewMemoTitle('');
      setNewMemoContent('');
    } catch (err) {
      console.error("Error creating memo in component:", err);
      // Error display is handled by the hook/parent component, but could add local feedback
    }
  };

  const handleUpdateMemo = async (id: string, title: string, content: string, isPublic?: boolean) => {
    try {
      await updateMemo(id, title, content, isPublic);
      // If the update was from the edit form, clear the editing state
      if (editingMemoId === id) {
        handleCancelEdit();
      }
    } catch (err) {
       console.error(`Error updating memo ${id} in component:`, err);
       // Error display is handled by the hook/parent component
    }
  };

  const handleDeleteMemo = async (id: string) => {
     // Optional: Add a confirmation dialog here
     if (!window.confirm("Are you sure you want to delete this memo?")) {
       return;
     }
    try {
      await deleteMemo(id);
    } catch (err) {
       console.error(`Error deleting memo ${id} in component:`, err);
       // Error display is handled by the hook/parent component
    }
  };

  const handleEditClick = (memo: { id: string; title: string; content: string | null }) => {
    setEditingMemoId(memo.id);
    setEditedMemoTitle(memo.title);
    setEditedMemoContent(memo.content || '');
  };

  const handleCancelEdit = () => {
    setEditingMemoId(null);
    setEditedMemoTitle('');
    setEditedMemoContent('');
  };

  return (
    <div className="w-full p-4"> {/* Adjusted width as it's now in a pane */}
      {/* Removed h2 as it's in the parent pane header */}
      {loading.fetching ? (
        <p>Loading memos...</p>
      ) : error ? (
         <p className="text-red-500">Error loading memos: {error}</p>
      ) : memos.length === 0 ? (
         <p>You haven't created any memos yet.</p>
      ): (
        <ul className="space-y-4">
          {memos.map((memo) => (
            <MemoItem
              key={memo.id}
              memo={memo}
              editingMemoId={editingMemoId}
              loading={loading} // Pass loading state for individual item actions
              onEditClick={handleEditClick}
              onUpdateMemo={handleUpdateMemo}
              onDeleteMemo={handleDeleteMemo}
              onCancelEdit={handleCancelEdit}
              editedMemoTitle={editedMemoTitle} // Pass down edited state
              editedMemoContent={editedMemoContent} // Pass down edited state
              setEditedMemoTitle={setEditedMemoTitle} // Pass down state setters
              setEditedMemoContent={setEditedMemoContent} // Pass down state setters
            />
          ))}
        </ul>
      )}

      {/* Create New Memo Section */}
      <h2 className="text-2xl font-bold mt-8 mb-4 pt-4 border-t">Create New Memo</h2>
      <div className="flex flex-col space-y-3">
        <input
          type="text"
          placeholder="Title (required)"
          value={newMemoTitle}
          onChange={(e) => setNewMemoTitle(e.target.value)}
          className="border rounded-md p-2 text-black dark:bg-gray-700 dark:text-white dark:border-gray-600"
          disabled={loading.creating}
        />
        <textarea
          placeholder="Content (optional)"
          value={newMemoContent}
          onChange={(e) => setNewMemoContent(e.target.value)}
          className="border rounded-md p-2 text-black dark:bg-gray-700 dark:text-white dark:border-gray-600"
          rows={4}
          disabled={loading.creating}
        />
        <button
          onClick={handleCreateMemo}
          className={`px-4 py-2 border rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed`}
          disabled={loading.creating || !newMemoTitle.trim()}
        >
          {loading.creating ? 'Creating...' : 'Create Memo'}
        </button>
      </div>
    </div>
  );
};

export default MemoListEditor;