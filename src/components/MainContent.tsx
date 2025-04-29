'use client';

import React from 'react';
import { Session } from 'next-auth';
import MemoExplorer from '@/components/memo_explorer';
import MemoListEditor from '@/components/memo_list_editor';
import SignInPrompt from '@/components/singin_prompt';
import DataErrorDisplay from '@/components/datta_error_display';
import { use_memo } from '@/hooks/use_memo'; // Import the hook
import { LoadingStates } from '@/types/memo'; // Assuming types are accessible

interface MainContentProps {
  session: Session | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  isPublicView: boolean;
  memoError: string | null; // Error from fetching public memo in page.tsx (can potentially remove this prop later)
  onSignIn: () => Promise<void>; // Pass down sign-in handler for SignInPrompt
}

const MainContent: React.FC<MainContentProps> = ({
  session,
  status,
  isPublicView,
  memoError, // Keep for now, but might be redundant if MemoExplorer handles its own error display
  onSignIn,
}) => {
  // Fetch public memo for the left pane (always visible)
  const { memo: publicmemo, loading: publicLoading, error: publicError } = use_memo(true);

  // Fetch user's memo for the right pane when logged in and not in public view
  const {
    memo: usermemo,
    loading: userLoading,
    error: userError,
    createMemo,
    updateMemo,
    deleteMemo,
  } = use_memo(false);

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
               {/* Pass public memo data to MemoExplorer */}
               <MemoExplorer
                 memo={publicmemo}
                 loading={publicLoading}
                 error={publicError}
               />
           </div>
       </section>

       {/* Right Pane: Contextual Content (User memo / Public View / Sign-in Prompt) */}
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
                   // Show Public memo in the right pane (using the same MemoExplorer component)
                   <>
                     <h2 className="text-base font-semibold p-3 border-b bg-gray-50 flex-shrink-0 text-gray-700 sticky top-0 z-10">
                         Public memo (View)
                     </h2>
                     <div className="flex-grow overflow-y-auto p-4">
                         {/* Pass public memo data to MemoExplorer */}
                          <MemoExplorer
                            memo={publicmemo}
                            loading={publicLoading}
                            error={publicError}
                          />
                     </div>
                   </>
               ) : (
                   // Show User's Private memo (List + Editor)
                   <>
                     <h2 className="text-base font-semibold p-3 border-b bg-gray-50 flex-shrink-0 text-gray-700 sticky top-0 z-10">
                     MainWindow
                     </h2>
                     {/* Pass user memo data and handlers to MemoListEditor */}
                     <div className="flex-grow overflow-y-auto p-4">
                       <MemoListEditor
                         memo={usermemo}
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