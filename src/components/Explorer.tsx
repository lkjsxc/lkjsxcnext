// src/components/Explorer.tsx
import { useState, useEffect, useCallback } from 'react';
import type { Session } from 'next-auth';
import type { Memo } from '@/types'; // Adjust path as needed

interface ExplorerProps {
  session: Session | null;
  onSelectMemo: (memoId: string | null) => void;
  selectedMemoId: string | null;
  // Add onCreateNewMemo prop later if the button is here
}

// --- Mock API Fetch Functions (Replace with your actual API calls) ---
async function fetchPublicMemos(): Promise<Memo[]> {
  console.log('Fetching public memos...');
  // const response = await fetch('/api/memos/public');
  // if (!response.ok) throw new Error('Failed to fetch public memos');
  // return response.json();
  // Mock Data:
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
   return [
     { id: 'pub1', title: 'Public Memo Alpha', content: '...', isPublic: true, authorId: 'user1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
     { id: 'pub2', title: 'Another Public Note', content: '...', isPublic: true, authorId: 'user2', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
   ];
}

async function fetchUserMemos(): Promise<Memo[]> {
  console.log('Fetching user memos...');
  // const response = await fetch('/api/memos/mine'); // Needs authentication header handled
  // if (!response.ok) {
  //   if (response.status === 401) return []; // Not logged in or unauthorized
  //   throw new Error('Failed to fetch user memos');
  // }
  // return response.json();
  // Mock Data:
  await new Promise(resolve => setTimeout(resolve, 400)); // Simulate network delay
   return [
    { id: 'mine1', title: 'My Private Thoughts', content: '...', isPublic: false, authorId: 'currentUser', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'mine2', title: 'My Shared Idea', content: '...', isPublic: true, authorId: 'currentUser', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
   ];
}
// --- End Mock API ---


export default function Explorer({ session, onSelectMemo, selectedMemoId }: ExplorerProps) {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMemos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    console.log("Explorer: loadMemos triggered. Session:", !!session);

    try {
      const publicMemosPromise = fetchPublicMemos();
      const userMemosPromise = session ? fetchUserMemos() : Promise.resolve([]); // Fetch user memos only if logged in

      const [publicMemos, userMemos] = await Promise.all([
          publicMemosPromise,
          userMemosPromise
      ]);

      // Combine and deduplicate memos
      const combinedMemos: Record<string, Memo> = {};
      [...publicMemos, ...userMemos].forEach(memo => {
         // Ensure user memos have correct authorId if mock data uses placeholder
         if (session && memo.authorId === 'currentUser') {
             memo.authorId = session.user.id ?? 'unknown';
         }
         combinedMemos[memo.id] = memo; // Overwrite public with user's version if IDs match
      });

      // Sort by date (newest first) - adjust if needed
      const sortedMemos = Object.values(combinedMemos).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setMemos(sortedMemos);

    } catch (err) {
      console.error("Error loading memos:", err);
      setError(err instanceof Error ? err.message : 'Failed to load memos.');
    } finally {
      setIsLoading(false);
    }
  }, [session]); // Reload when session changes

  useEffect(() => {
    loadMemos();
  }, [loadMemos]); // Dependency array includes the memoized function


  // --- Render Logic ---
  return (
    <div className="h-full flex flex-col">
      <h2 className="text-xl font-semibold mb-4 border-b pb-2">Explorer</h2>

      {/* TODO: Add "Create New Memo" Button Here */}
      {/* <button className="mb-4 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
        + New Memo
      </button> */}

      {/* TODO: Add Filter Input Here */}
      {/* <input type="text" placeholder="Filter by title..." className="mb-4 p-2 border rounded w-full" /> */}


      {isLoading && <p className="text-gray-500">Loading memos...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {!isLoading && !error && memos.length === 0 && (
        <p className="text-gray-500">No memos found.</p>
      )}

      {!isLoading && !error && memos.length > 0 && (
        <ul className="space-y-1 overflow-y-auto flex-1"> {/* flex-1 and overflow-y-auto for scrolling */}
          {memos.map((memo) => (
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
                 {/* Optional: Add a small indicator for user's own memos */}
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