'use client';

import { useState } from 'react';
import { useMemos } from '@/hooks/useMemos'; // Import the custom hook
import MemoItem from './MemoItem'; // Import the new MemoItem component

export default function MemoListEditor() {
  const [newMemoTitle, setNewMemoTitle] = useState('');
  const [newMemoContent, setNewMemoContent] = useState('');
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [editedMemoTitle, setEditedMemoTitle] = useState('');
  const [editedMemoContent, setEditedMemoContent] = useState('');

  // Use the custom hook to manage memo state and API interactions
  // Pass false to useMemos to indicate we want the user's private memos
  const { memos, loading, error, createMemo, updateMemo, deleteMemo } = useMemos(false);

  const handleCreateMemo = async () => {
    try {
      await createMemo(newMemoTitle, newMemoContent);
      setNewMemoTitle('');
      setNewMemoContent('');
    } catch (err) {
      // Error handling is done within the hook, but we can add more here if needed
      console.error("Error creating memo in component:", err);
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
    <div className="w-full md:w-1/2 p-4 border rounded-md shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
      <h2 className="text-2xl font-bold mb-4">Your Memos</h2>
      {loading.fetching ? (
        <p>Loading memos...</p>
      ) : memos.length === 0 && !error ? (
         <p>You haven't created any memos yet.</p>
      ): (
        <ul className="space-y-4">
          {memos.map((memo) => (
            <MemoItem
              key={memo.id}
              memo={memo}
              editingMemoId={editingMemoId}
              loading={loading}
              onEditClick={handleEditClick}
              onUpdateMemo={handleUpdateMemo}
              onDeleteMemo={handleDeleteMemo}
              onCancelEdit={handleCancelEdit}
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
          onClick={handleCreateMemo} // Use the new handler
          className={`px-4 py-2 border rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed`}
          disabled={loading.creating || !newMemoTitle.trim()} // Disable if loading or title is empty
        >
          {loading.creating ? 'Creating...' : 'Create Memo'}
        </button>
      </div>
    </div>
  );
}