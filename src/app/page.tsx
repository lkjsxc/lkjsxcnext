// src/app/page.tsx
'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import Explorer from '@/components/Explorer';
import MainWindow from '@/components/MainWindow';
import { Memo } from '@/types';

const HomePage: React.FC = () => {
  const [selectedMemoId, setSelectedMemoId] = useState<string | null>(null);

  // Handle memo selection from Explorer
  const handleSelectMemo = (memoId: string | null) => {
    setSelectedMemoId(memoId);
  };

  // Handle memo creation success from MainWindow
  const handleMemoCreated = (newMemoId: string) => {
    setSelectedMemoId(newMemoId); // Select the newly created memo
  };

  // Handle memo deletion success from MainWindow
  const handleMemoDeleted = () => {
    setSelectedMemoId(null); // Clear selection after deletion
  };

  // Handle memo update success from MainWindow (optional, MainWindow updates its own state)
  const handleMemoUpdated = (updatedMemo: Memo) => {
    // If the updated memo is the currently selected one, MainWindow will handle its state.
    // We might need this if the update affects the list in Explorer, but useMemos polling handles that.
    // This callback is mainly for MainWindow to notify the parent that an update occurred.
    console.log(`Memo ${updatedMemo.id} updated.`);
  };


  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header />
      <div className="flex flex-grow overflow-hidden">
        <Explorer onSelectMemo={handleSelectMemo} selectedMemoId={selectedMemoId} />
        <MainWindow
          selectedMemoId={selectedMemoId}
          onMemoCreated={handleMemoCreated}
          onMemoDeleted={handleMemoDeleted}
          onMemoUpdated={handleMemoUpdated}
        />
      </div>
    </div>
  );
};

export default HomePage;