'use client';

import Header from '@/components/Header';
import DataErrorDisplay from '@/components/DataErrorDisplay';
import Explorer from '@/components/Explorer';
import MainWindow from '@/components/MainWindow';
import { useAuthHandlers } from '@/hooks/useAuthHandlers';
import { useMemoSelection } from '@/hooks/useMemoSelection'; // Import the new hook

export default function Home() {
  const { session, status, authError, handleSignIn, handleSignOut } = useAuthHandlers();
  const { selectedMemoId, handleSelectMemo } = useMemoSelection(); // Use the new hook

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
      {(authError) && <DataErrorDisplay authError={authError} />}

      {/* Main Content Area: Flex row, takes remaining height */}
      <div className="flex flex-1 overflow-hidden"> {/* flex-1 allows this div to grow */}

        {/* Explorer Pane (Left) */}
        <div className="w-1/3 lg:w-1/4 border-r border-gray-300 overflow-y-auto p-4 bg-white shadow-sm">
          <Explorer
              session={session}
              onSelectMemo={handleSelectMemo}
              selectedMemoId={selectedMemoId}
              onCreateNewMemo={(newMemoId) => handleSelectMemo(newMemoId)} // Pass the handler
          />
        </div>

        {/* MainWindow Pane (Right) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
           <MainWindow
              selectedMemoId={selectedMemoId}
              session={session}
              onMemoDeleted={() => handleSelectMemo(null)} // Use handleSelectMemo from hook
              onMemoCreated={(newMemoId) => handleSelectMemo(newMemoId)} // Use handleSelectMemo from hook
           />
        </div>

      </div>
    </div>
  );
}