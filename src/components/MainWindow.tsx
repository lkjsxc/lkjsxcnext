// src/components/MainWindow.tsx
import { useState, useEffect, useCallback } from 'react';
import type { Session } from 'next-auth';
import type { Memo } from '@/types/memo';
import EditorTab from './editor_tab'; // We'll create this next
import ViewerTab from './viewer_tab'; // We'll create this next
import { useSyncManager } from '@/hooks/use_sync_manager'; // Import the new hook

interface MainWindowProps {
  selectedMemoId: string | null;
  session: Session | null;
  onMemoDeleted: () => void; // Callback to clear selection in parent
  onMemoCreated: (newMemoId: string) => void; // Callback to select new memo (for later use)
}

// --- Mock API Fetch Function (Replace with your actual API calls) ---
// --- Mock API Fetch Function (Replace with your actual API calls) ---
// async function fetchMemoById(id: string): Promise<Memo | null> {
//   const response = await fetch(`/api/memo/${id}`);
//   if (!response.ok) {
//     if (response.status === 404) return null; // Not found
//     throw new Error(`Failed to fetch memo ${id}`);
//   }
//   return response.json();
// }
// --- End Mock API ---

export default function MainWindow({ selectedMemoId, session, onMemoDeleted, onMemoCreated }: MainWindowProps) {
  const [currentMemo, setCurrentMemo] = useState<Memo | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Keep loading state for initial load/selection change
  const [error, setError] = useState<string | null>(null); // Keep error state

  // Use the new sync manager
  const { addMemoUpdateToQueue, syncState } = useSyncManager();

  // Determine if the current user owns the currently loaded memo
  const isOwner = session?.user?.id === currentMemo?.authorId;

  // Effect for initial memo load when selectedMemoId changes or component mounts
  // This will now rely on the data fetched by useSyncManager

  // Effect to update currentMemo when syncState.memos changes and selectedMemoId is set
  useEffect(() => {
    if (selectedMemoId && syncState.memos) {
      const memo = syncState.memos.find(m => m.id === selectedMemoId);
      if (memo) {
        setCurrentMemo(memo);
      } else {
        // Memo not found in synced data, it might have been deleted on another client
        setCurrentMemo(null);
        onMemoDeleted(); // Clear selection
      }
    } else if (!selectedMemoId) {
       setCurrentMemo(null);
    }
  }, [selectedMemoId, syncState.memos, onMemoDeleted]);


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

  // Determine if the current user owns the memo (This is now only used for rendering)

  return (
    <div className="h-full">
      {isOwner ? (
        <EditorTab
            key={currentMemo.id} // Add key to force re-mount/state reset when memo changes
            memo={currentMemo}
            session={session}
            onMemoDeleted={onMemoDeleted}
            onMemoChange={(updatedMemo) => {
              // Add the updated memo to the sync queue
              addMemoUpdateToQueue({
                id: updatedMemo.id,
                title: updatedMemo.title,
                content: updatedMemo.content,
                isPublic: updatedMemo.isPublic,
              });
              // Optionally update local state immediately for responsiveness
              setCurrentMemo(updatedMemo);
            }}
            // Pass onMemoCreated if Editor handles creation flow later
        />
      ) : (
        <ViewerTab memo={currentMemo} />
      )}
    </div>
  );
}