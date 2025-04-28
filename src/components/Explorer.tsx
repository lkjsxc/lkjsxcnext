// src/components/Explorer.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import type { Session } from 'next-auth';
import type { Memo } from '@/types/memo'; // Adjust path as needed
import { fetchPublicMemos, fetchUserMemos, createMemoApi } from '@/utils/memoApi'; // Import actual API functions
import { initializeMemoWebSocket, subscribeToMemoMessages, unsubscribeFromMemoMessages } from '@/utils/memoWebSocket'; // Import websocket utility

interface ExplorerProps {
  session: Session | null;
  onSelectMemo: (memoId: string | null) => void;
  selectedMemoId: string | null;
  onCreateNewMemo: (newMemoId: string) => void; // Add onCreateNewMemo prop
}


export default function Explorer({ session, onSelectMemo, selectedMemoId, onCreateNewMemo }: ExplorerProps) {
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
      // Prioritize user's version if they have edited a public memo
      const combinedMemos: Record<string, Memo> = {};
      publicMemos.forEach(memo => combinedMemos[memo.id] = memo);
      userMemos.forEach(memo => combinedMemos[memo.id] = memo); // User's memos overwrite public ones with same ID

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

// Effect to load memos when session changes or component mounts
  useEffect(() => {
    loadMemos();
  }, [loadMemos]); // Dependency array includes the memoized function
   // Dependency array includes the memoized function
// Effect to manage WebSocket connection
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let ws: WebSocket | null = null; // Use a local variable for the current effect run

    // Only attempt to connect if session user ID exists
    if (session?.user?.id) {
      console.log('Explorer: WebSocket effect running, session user ID exists.');
      // Initialize the WebSocket connection
      initializeMemoWebSocket();

      // Subscribe to memo messages
      const handleMemoMessage = (message: any) => {
        // Handle incoming websocket messages
        console.log('WebSocket message received in Explorer:', message);
        if (message && message.type && message.payload) {
          setMemos(currentMemos => {
            const updatedMemos = [...currentMemos];
            const memoIndex = updatedMemos.findIndex(m => m.id === message.payload.id);

            switch (message.type) {
              case 'memo_created':
                if (memoIndex === -1) {
                  updatedMemos.unshift(message.payload);
                }
                break;
              case 'memo_updated':
                if (memoIndex !== -1) {
                  updatedMemos[memoIndex] = message.payload;
                } else {
                   updatedMemos.unshift(message.payload);
                }
                break;
              case 'memo_deleted':
                if (memoIndex !== -1) {
                  updatedMemos.splice(memoIndex, 1);
                }
                break;
              default:
                console.warn('Unknown websocket message type:', message.type);
            }
             updatedMemos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return updatedMemos;
          });
        }
      };

      subscribeToMemoMessages(handleMemoMessage);

      // Note: We don't store the WebSocket instance directly in wsRef here
      // because websocketManager manages the single connection.
      // We just need to ensure we unsubscribe on cleanup.

    } else {
      console.log('Explorer: WebSocket effect skipped, no session user ID.');
      // If session becomes null, ensure any existing subscriptions are removed
      // The websocketManager handles the connection lifecycle based on subscriptions.
    }

    // Cleanup function
    return () => {
      console.log('Explorer: WebSocket effect cleanup running.');
      // Unsubscribe the specific handler for this component
      const handleMemoMessage = (message: any) => {
        // This is a placeholder to get the function reference for unsubscribe
        // The actual logic is in the effect's scope
      };
      unsubscribeFromMemoMessages(handleMemoMessage);
      console.log('Explorer: Unsubscribed from memo messages.');
    };

  }, [session?.user?.id]); // Dependency on session user ID

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
      loadMemos(); // Reload the list to show the new memo
    } catch (err) {
      console.error("Error creating new memo:", err);
      setError(err instanceof Error ? err.message : 'Failed to create new memo.');
    } finally {
      setIsLoading(false);
    }
  }, [session, onCreateNewMemo, loadMemos]); // Dependencies


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