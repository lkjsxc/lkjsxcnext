'use client';

import React from 'react';
import { Session } from 'next-auth';
import MemoExplorer from '@/components/MemoExplorer';
import MemoListEditor from '@/components/MemoListEditor';
import SignInPrompt from '@/components/SignInPrompt';
import DataErrorDisplay from '@/components/DataErrorDisplay';
import { useMemos } from '@/hooks/useMemos'; // Import the hook
import { LoadingStates } from '@/types/memo'; // Assuming types are accessible

interface MainContentProps {
  session: Session | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  isPublicView: boolean;
  memoError: string | null; // Error from fetching public memos in page.tsx (can potentially remove this prop later)
  onSignIn: () => Promise<void>; // Pass down sign-in handler for SignInPrompt
}

const MainContent: React.FC<MainContentProps> = ({
  session,
  status,
  isPublicView,
  memoError, // Keep for now, but might be redundant if MemoExplorer handles its own error display
  onSignIn,
}) => {
  // Fetch public memos for the left pane (always visible)
  const { memos: publicMemos, loading: publicLoading, error: publicError } = useMemos(true);

  // Fetch user's memos for the right pane when logged in and not in public view
  const {
    memos: userMemos,
    loading: userLoading,
    error: userError,
    createMemo,
    updateMemo,
    deleteMemo,
  } = useMemos(false);

  return (
    <main className="flex-grow flex flex-row gap-0 overflow-hidden">

      {/* Left Pane: Public Memo Explorer (Always visible) */}
      <section className="w-1/3 md:w-1/4 lg:w-1/5 border-r bg-white flex flex-col overflow-hidden">
         {/* Pane Header */}
         <h2 className="text-base font-semibold p-3 border-b bg-gray-50 flex-shrink-0 text-gray-600 sticky top-0 z-10">
               Public Explorer
           </h2>
           {/* Scrollable Content Area */}
           <div className="flex-grow overflow-y-auto p-2">
               {/* Pass public memos data to MemoExplorer */}
               <MemoExplorer
                 memos={publicMemos}
                 loading={publicLoading}
                 error={publicError}
               />
           </div>
       </section>

       {/* Right Pane: Contextual Content (User Memos / Public View / Sign-in Prompt) */}
       <section className="flex-grow flex flex-col overflow-hidden bg-white">
           {/* Conditional Rendering based on login status and view toggle */}
           {status === 'loading' ? (
                // Optional: Loading indicator for the right pane while session loads
                <div className="flex justify-center items-center h-full">
                    <p>Loading session...</p>
                </div>
           ) : session ? (
               // --- Logged In State ---
               isPublicView ? (
                   // Show Public Memos in the right pane (using the same MemoExplorer component)
                   <>
                     <h2 className="text-base font-semibold p-3 border-b bg-gray-50 flex-shrink-0 text-gray-700 sticky top-0 z-10">
                         Public Memos (View)
                     </h2>
                     <div className="flex-grow overflow-y-auto p-4">
                         {/* Pass public memos data to MemoExplorer */}
                          <MemoExplorer
                            memos={publicMemos}
                            loading={publicLoading}
                            error={publicError}
                          />
                     </div>
                   </>
               ) : (
                   // Show User's Private Memos (List + Editor)
                   <>
                     <h2 className="text-base font-semibold p-3 border-b bg-gray-50 flex-shrink-0 text-gray-700 sticky top-0 z-10">
                     MainWindow
                     </h2>
                     {/* Pass user memos data and handlers to MemoListEditor */}
                     <div className="flex-grow overflow-y-auto p-4">
                       <MemoListEditor
                         memos={userMemos}
                         loading={userLoading}
                         error={userError}
                         createMemo={createMemo}
                         updateMemo={updateMemo}
                         deleteMemo={deleteMemo}
                       />
                     </div>
                   </>
               )
           ) : (
                // --- Logged Out State ---
                // No separate title needed as SignInPrompt includes one
                <div className="flex-grow overflow-y-auto">
                    <SignInPrompt onSignIn={onSignIn} />
                </div>
           )}
       </section>

     </main>
   );
 };

 export default MainContent;