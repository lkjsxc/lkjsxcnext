'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import Explorer from '@/components/Explorer';
import MainWindow from '@/components/MainWindow';
import { use_auth_handlers } from '@/hooks/use_auth_handler';

export default function Home() {
  const { session, status, authError, handleSignIn, handleSignOut } = use_auth_handlers();
  const [selectedMemoId, setSelectedMemoId] = useState<string | null>(null);

  const handleSelectMemo = (memoId: string | null) => {
    setSelectedMemoId(memoId);
  };

  const handleMemoCreated = (memoId: string) => {
    setSelectedMemoId(memoId);
  };

  const handleMemoDeleted = () => {
    setSelectedMemoId(null);
  };

  return (
    // Main container: Full height, flex column
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-gray-100">

      {/* Header Component */}
      <Header
        session={session}
        status={status}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        authError={authError}
      />

      {/* Optional: Display auth errors prominently */}
      {/* Optional: Display auth errors prominently */}
      {/* {(authError) && <DataErrorDisplay authError={authError} />} */}

      {/* Main Content Area: Flex row, takes remaining height */}
      <div className="flex flex-1 overflow-hidden"> {/* flex-1 allows this div to grow */}

        {/* Explorer Pane (Left) */}
        <div className="w-1/3 lg:w-1/4 border-r border-gray-300 overflow-y-auto p-4 bg-white shadow-sm">
          <Explorer onSelectMemo={handleSelectMemo} />
        </div>

        {/* MainWindow Pane (Right) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
           <MainWindow
             selectedMemoId={selectedMemoId}
             onMemoCreated={handleMemoCreated}
             onMemoDeleted={handleMemoDeleted}
           />
         </div>
 
       </div>
    </div>
  );
}