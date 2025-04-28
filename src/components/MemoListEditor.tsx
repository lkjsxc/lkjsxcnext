'use client';

import { useState } from 'react';
import { useMemos } from '@/hooks/useMemos'; // Import the custom hook

export default function MemoListEditor() {
  const [newMemoTitle, setNewMemoTitle] = useState('');
  const [newMemoContent, setNewMemoContent] = useState('');
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [editedMemoTitle, setEditedMemoTitle] = useState('');
  const [editedMemoContent, setEditedMemoContent] = useState('');

  // Use the custom hook to manage memo state and API interactions
  const { memos, loading, error, createMemo, updateMemo, deleteMemo } = useMemos();

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

  const handleUpdateMemo = async (id: string) => {
    try {
      await updateMemo(id, editedMemoTitle, editedMemoContent);
      handleCancelEdit(); // Clear editing state on successful update
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
            <li key={memo.id} className="p-4 border rounded-md shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
              {editingMemoId === memo.id ? (
                // --- Edit Form ---
                <div className="flex flex-col space-y-3">
                  <input
                    type="text"
                    value={editedMemoTitle}
                    onChange={(e) => setEditedMemoTitle(e.target.value)}
                    placeholder="Memo Title"
                    className="border rounded-md p-2 text-black dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    disabled={loading.updating === memo.id}
                  />
                  <textarea
                    value={editedMemoContent}
                    onChange={(e) => setEditedMemoContent(e.target.value)}
                    placeholder="Memo Content (optional)"
                    className="border rounded-md p-2 text-black dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    rows={4}
                    disabled={loading.updating === memo.id}
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleUpdateMemo(memo.id)}
                      className={`px-4 py-2 border rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed`}
                      disabled={loading.updating === memo.id || !editedMemoTitle.trim()}
                    >
                      {loading.updating === memo.id ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 border rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 disabled:opacity-50"
                      disabled={loading.updating === memo.id}
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
                  <div className="mt-4 space-x-2">
                    <button
                      onClick={() => handleEditClick(memo)}
                      className="px-3 py-1 border rounded-md text-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 disabled:opacity-50"
                       disabled={!!loading.updating || !!loading.deleting} // Disable if any update/delete is in progress
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteMemo(memo.id)}
                      className={`px-3 py-1 border rounded-md text-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed`}
                      disabled={loading.deleting === memo.id || !!loading.updating} // Disable if *this* is deleting or *any* update is happening
                    >
                      {loading.deleting === memo.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              )}
            </li>
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