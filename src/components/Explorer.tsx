// src/components/Explorer.tsx
import { useCallback } from 'react';
import type { Session } from 'next-auth';
import type { Memo } from '@/types/memo'; // Adjust path as needed
import { use_memo } from '@/hooks/use_memo'; // Import the use_memo hook

interface ExplorerProps {
  session: Session | null;
  onSelectMemo: (memoId: string | null) => void;
  selectedMemoId: string | null;
  onCreateNewMemo: (newMemoId: string) => void; // Add onCreateNewMemo prop
  onMemoChange: () => void; // Add onMemoChange prop
}


export default function Explorer({ session, onSelectMemo, selectedMemoId, onCreateNewMemo, onMemoChange }: ExplorerProps) {
  // Use the use_memo hook to fetch and manage memo data
  const { memo, loading, error, createMemo, fetchmemo } = use_memo('all'); // Fetch all memos (user and public) for Explorer

  const handleCreateNewMemo = useCallback(async () => {
    if (!session) {
      alert('You must be logged in to create a new memo.');
      return;
    }
    try {
      const newMemoId = await createMemo('', ''); // Create with empty title and content and get the new ID
      // The use_memo hook will refetch data after creation,
      // so we don't need to call fetchmemo explicitly here.
      // We still need to call onCreateNewMemo and onMemoChange for parent component logic.
      if (newMemoId) {
        onCreateNewMemo(newMemoId); // Select the newly created memo
        onMemoChange(); // Notify parent of change
      }
    } catch (err) {
      console.error("Error creating new memo:", err);
      // Error handling is now done within the use_memo hook, but we can still show a local alert
      alert(`Failed to create new memo: ${error || 'Unknown error'}`);
    }
  }, [session, createMemo, onCreateNewMemo, onMemoChange, error]); // Dependencies


  // Determine loading state from the hook
  const isLoading = loading.fetching || loading.creating;


  // --- Render Logic ---
  return (
    <div className="h-full flex flex-col">
      <h2 className="text-xl font-semibold mb-4 border-b pb-2">Explorer</h2>

      {/* "Create New Memo" Button */}
      <button
        onClick={handleCreateNewMemo}
        className="mb-4 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoading || !session} // Disable if loading or not logged in
      >
        + New Memo
      </button>

      {/* TODO: Add Filter Input Here */}
      {/* <input type="text" placeholder="Filter by title..." className="mb-4 p-2 border rounded w-full" /> */}


      {isLoading && <p className="text-gray-500">Loading memo...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {!isLoading && !error && memo.length === 0 && (
        <p className="text-gray-500">No memo found.</p>
      )}

      {!isLoading && !error && memo.length > 0 && (
        <ul className="space-y-1 overflow-y-auto flex-1"> {/* flex-1 and overflow-y-auto for scrolling */}
          {memo.map((memo) => (
            <li key={memo.id}>
              <button
                onClick={() => onSelectMemo(memo.id)}
                className={`w-full text-left p-2 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                  selectedMemoId === memo.id ? 'bg-blue-100 font-semibold' : 'bg-transparent'
                }`}
                title={memo.title} // Add title attribute for long titles
              >
                <span className="block truncate"> {/* truncate long titles */}
                   {memo.title || '(Untitled)'}
                </span>
                {/* Optional: Add a small indicator for user's own memo */}
                {session && memo.authorId === session.user?.id && ( // Use optional chaining for session.user
                   <span className="text-xs text-blue-600 ml-1">(Mine)</span>
                )}
                {/* Optional: Add indicator for public/private */}
                {/* <span className={`text-xs ml-1 ${memo.isPublic ? 'text-green-600' : 'text-gray-500'}`}>
                   {memo.isPublic ? 'Public' : 'Private'}
                </span> */}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}