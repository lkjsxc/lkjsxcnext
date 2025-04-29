// src/components/Explorer.tsx
import { useState, useEffect, useCallback } from 'react';
import type { Session } from 'next-auth';
import type { Memo } from '@/types/memo'; // Adjust path as needed
import { fetchPublicmemo, fetchUsermemo, createMemoApi } from '@/utils/memo_api'; // Import actual API functions

interface ExplorerProps {
  session: Session | null;
  onSelectMemo: (memoId: string | null) => void;
  selectedMemoId: string | null;
  onCreateNewMemo: (newMemoId: string) => void; // Add onCreateNewMemo prop
}


export default function Explorer({ session, onSelectMemo, selectedMemoId, onCreateNewMemo }: ExplorerProps) {
  const [memo, setmemo] = useState<Memo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadmemo = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const publicmemoPromise = fetchPublicmemo();
      const usermemoPromise = session ? fetchUsermemo() : Promise.resolve([]); // Fetch user memo only if logged in

      const [publicmemo, usermemo] = await Promise.all([
          publicmemoPromise,
          usermemoPromise
      ]);

      // Combine and deduplicate memo
      // Prioritize user's version if they have edited a public memo
      const combinedmemo: Record<string, Memo> = {};
      publicmemo.forEach(memo => combinedmemo[memo.id] = memo);
      usermemo.forEach(memo => combinedmemo[memo.id] = memo); // User's memo overwrite public ones with same ID

      // Sort by date (newest first) - adjust if needed
      const sortedmemo = Object.values(combinedmemo).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setmemo(sortedmemo);

    } catch (err) {
      console.error("Error loading memo:", err);
      setError(err instanceof Error ? err.message : 'Failed to load memo.');
    } finally {
      setIsLoading(false);
    }
  }, [session]); // Reload when session changes

// Effect to load memo when session changes or component mounts
  useEffect(() => {
    loadmemo();
  }, [loadmemo]); // Dependency array includes the memoized function
   // Dependency array includes the memoized function

  const handleCreateNewMemo = useCallback(async () => {
    if (!session) {
      alert('You must be logged in to create a new memo.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const newMemo = await createMemoApi('', ''); // Create with empty title and content
      onCreateNewMemo(newMemo.id); // Call the prop to select the new memo
      loadmemo(); // Reload the list to show the new memo
    } catch (err) {
      console.error("Error creating new memo:", err);
      setError(err instanceof Error ? err.message : 'Failed to create new memo.');
    } finally {
      setIsLoading(false);
    }
  }, [session, onCreateNewMemo, loadmemo]); // Dependencies


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
                {session && memo.authorId === session.user.id && (
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