'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { MemoList } from '@/features/memo/components/MemoList';
import { MemoViewer } from '@/features/memo/components/MemoViewer';
import { MemoEditor } from '@/features/memo/components/MemoEditor';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card'; // Import Card
import { Spinner } from '@/components/ui/Spinner'; // Import Spinner
import { useMemoDetail } from '@/features/memo/hooks/useMemoDetail'; // Import useMemoDetail
import { useSession } from 'next-auth/react';

const HomePage: React.FC = () => {
  const { data: session } = useSession();
  const isAuthenticated = !!session;

  const [selectedMemoId, setSelectedMemoId] = useState<string | null>(null);
  const [isEditingNewMemo, setIsEditingNewMemo] = useState(false);

  // Determine if the currently selected memo is owned by the logged-in user
  // This requires fetching the memo detail, but we can pass down the isOwner flag
  // from the MemoList or refetch it here if needed. For simplicity now,
  // we'll rely on the MemoEditor/Viewer to handle ownership checks internally
  // based on the fetched memo data and the current user ID.

  const handleSelectMemo = (memoId: string) => {
    setSelectedMemoId(memoId);
    setIsEditingNewMemo(false); // Not creating a new memo when selecting existing
  };

  const handleNewMemoClick = () => {
    setSelectedMemoId(null); // Deselect any existing memo
    setIsEditingNewMemo(true); // Indicate we are creating a new memo
  };

  const handleSaveSuccess = (memoId: string) => {
    setSelectedMemoId(memoId); // Select the newly created or updated memo
    setIsEditingNewMemo(false); // No longer creating a new memo
    // The MemoList should automatically refetch via polling or SWR revalidation
  };

  const handleDeleteSuccess = () => {
    setSelectedMemoId(null); // Deselect the deleted memo
    setIsEditingNewMemo(false); // Ensure we are not in a 'new memo' state
    // The MemoList should automatically refetch via polling or SWR revalidation
  };

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/3 flex flex-col">
           {isAuthenticated && (
             <div className="p-4 border-b border-gray-200">
               <Button onClick={handleNewMemoClick} className="w-full">+ New Memo</Button>
             </div>
           )}
          <MemoList selectedMemoId={selectedMemoId} onSelectMemo={handleSelectMemo} />
        </div>
        <div className="flex-1 flex flex-col p-4 overflow-y-auto">
          {isEditingNewMemo ? (
            <MemoEditor memoId={null} onSaveSuccess={handleSaveSuccess} onDeleteSuccess={handleDeleteSuccess} />
          ) : selectedMemoId ? (
            // MemoViewer or MemoEditor will handle rendering based on ownership
            // We can pass the memoId and let the components fetch and decide
            <MemoDetailWrapper memoId={selectedMemoId} onSaveSuccess={handleSaveSuccess} onDeleteSuccess={handleDeleteSuccess} />
          ) : (
            <div className="flex-1 flex justify-center items-center text-gray-500">
              Select a memo from the list or create a new one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;

// Helper component to decide between Viewer and Editor based on ownership
// This fetches the memo detail to determine isOwner
const MemoDetailWrapper: React.FC<{ memoId: string; onSaveSuccess: (memoId: string) => void; onDeleteSuccess: () => void; }> = ({ memoId, onSaveSuccess, onDeleteSuccess }) => {
  const { memo, isOwner, isLoading, error } = useMemoDetail(memoId);

   if (isLoading) {
    return (
      <Card className="flex-1 flex justify-center items-center">
        <Spinner />
      </Card>
    );
  }

  if (error) {
    return <Card className="flex-1 text-red-500">Error loading memo: {error.error.message}</Card>;
  }

  if (!memo) {
     return <Card className="flex-1 text-gray-500">Memo not found or you do not have permission.</Card>;
  }


  if (isOwner) {
    return <MemoEditor memoId={memoId} onSaveSuccess={onSaveSuccess} onDeleteSuccess={onDeleteSuccess} />;
  } else {
    return <MemoViewer memoId={memoId} />;
  }
};