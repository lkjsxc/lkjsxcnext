// src/components/MainWindow.tsx
import { useState, useEffect, useCallback } from 'react';
import type { Session } from 'next-auth';
import type { Memo } from '@/types/memo';
import EditorTab from './editor_tab'; // We'll create this next
import ViewerTab from './viewer_tab'; // We'll create this next

interface MainWindowProps {
  selectedMemoId: string | null;
  session: Session | null;
  onMemoDeleted: () => void; // Callback to clear selection in parent
  onMemoCreated: (newMemoId: string) => void; // Callback to select new memo (for later use)
}

// --- Mock API Fetch Function (Replace with your actual API calls) ---
async function fetchMemoById(id: string): Promise<Memo | null> {
  const response = await fetch(`/api/memo/${id}`);
  if (!response.ok) {
    if (response.status === 404) return null; // Not found
    throw new Error(`Failed to fetch memo ${id}`);
  }
  return response.json();
}
// --- End Mock API ---

export default function MainWindow({ selectedMemoId, session, onMemoDeleted, onMemoCreated }: MainWindowProps) {
  const [currentMemo, setCurrentMemo] = useState<Memo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMemoDetails = async () => {
      // Reset state when selection is cleared
      if (!selectedMemoId) {
        setCurrentMemo(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setCurrentMemo(null); // Clear previous memo while loading
      try {
        const memo = await fetchMemoById(selectedMemoId);
        if (memo) {
          // If using mock data with 'currentUser', replace it with the actual session user ID
          if (memo.authorId === 'currentUser' && session?.user?.id) {
            memo.authorId = session.user.id;
          }
          setCurrentMemo(memo);
        } else {
          setError('Memo not found.');
          // Optionally, call onMemoDeleted() here if a selected memo suddenly 404s
          // onMemoDeleted();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load memo details.');
      } finally {
        setIsLoading(false);
      }
    };

    loadMemoDetails(); // Initial load

    // Set up polling if a memo is selected
    let intervalId: NodeJS.Timeout | undefined;
    if (selectedMemoId) {
      intervalId = setInterval(loadMemoDetails, 10000); // Poll every 10 seconds
    }

    return () => {
      // Cleanup interval on unmount or dependency change
      if (intervalId) {
        clearInterval(intervalId);
      }
    };

  }, [selectedMemoId, session]); // Re-fetch if selected ID changes or session changes (for authorId check)

  // --- Render Logic ---

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><p>Loading memo...</p></div>;
  }

  if (error) {
    return <div className="p-4 text-red-600 bg-red-100 border border-red-400 rounded">Error: {error}</div>;
  }

  if (!selectedMemoId) {
    return (
      <div className="flex justify-center items-center h-full text-gray-500">
        <p>Select a memo from the list on the left, or create a new one.</p>
        {/* Placeholder for future 'Create New' action if initiated from here */}
      </div>
    );
  }

  if (!currentMemo) {
     // Should ideally be covered by loading/error states, but as a fallback
     return <div className="flex justify-center items-center h-full text-gray-500">Memo not available.</div>;
  }

  // Determine if the current user owns the memo
  const isOwner = session?.user?.id === currentMemo.authorId;

  return (
    <div className="h-full">
      {isOwner ? (
        <EditorTab
            key={currentMemo.id} // Add key to force re-mount/state reset when memo changes
            memo={currentMemo}
            session={session}
            onMemoDeleted={onMemoDeleted}
            // onMemoChange={onMemoChange} // Pass onMemoChange to EditorTab
            // Pass onMemoCreated if Editor handles creation flow later
        />
      ) : (
        <ViewerTab memo={currentMemo} />
      )}
    </div>
  );
}