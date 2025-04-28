'use client';

import { useState, useCallback } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import MemoExplorer from '@/components/MemoExplorer'; // Shows everyone's public memos
import MemoListEditor from '@/components/MemoListEditor'; // Shows logged-in user's memos + editor functionality
import { useMemos } from '@/hooks/useMemos'; // Assuming this hook fetches public memos
import AuthButton from '@/components/AuthButton';
import SignInPrompt from '@/components/SignInPrompt';
import DataErrorDisplay from '@/components/DataErrorDisplay';

// --- Main Page Component (Redesigned based on README) ---

export default function Home() {
  const { data: session, status } = useSession();
  // Default view for logged-in users shows their memos in the right pane
  const [isPublicView, setIsPublicView] = useState(false);
  // Fetch public memos (potentially for the left pane, hook might need adjustment if context changes)
  const { error: memoError } = useMemos(true); // Always fetch public for the left pane explorer
  const [authError, setAuthError] = useState<string | null>(null);

  // Memoized Sign-In Handler
  const handleSignIn = useCallback(async () => {
    setAuthError(null);
    try {
      const result = await signIn('google', { redirect: false });
      if (result?.error) {
        const friendlyError = result.error === "OAuthAccountNotLinked"
          ? "Email linked to another provider."
          : "Sign in failed. Please try again.";
        console.error("Sign in error details:", result.error);
        setAuthError(friendlyError);
      } else {
         setIsPublicView(false); // Default to 'My Memos' view after sign-in
      }
    } catch (err: any) {
      console.error("Sign in catch block:", err);
      setAuthError('An unexpected error occurred during sign in.');
    }
  }, []);

  // Memoized Sign-Out Handler
  const handleSignOut = useCallback(async () => {
    setAuthError(null);
    try {
      await signOut({ redirect: false });
      setIsPublicView(true); // Revert to showing public in right pane if user logs out? Or maybe just let it be handled by session check? Let's default to false. The session check handles the prompt anyway.
      setIsPublicView(false);
    } catch (err: any) {
      console.error("Sign out catch block:", err);
      setAuthError('An unexpected error occurred during sign out.');
    }
  }, []);

  // Toggle between showing user's memos ('My Memos') and the public explorer in the right pane
  const handleToggleView = () => {
    setIsPublicView(prev => !prev);
  };

  // --- Render Logic ---

  return (
    // Main container: Full height, flex column, prevent body scroll
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-gray-100">

      {/* Header */}
      <header className="flex justify-between items-center p-3 border-b bg-white shadow-sm flex-shrink-0 h-16">
        {/* Logo */}
        <h1 className="text-xl font-bold text-gray-800 px-2">
          lkjsxcnext
        </h1>

        {/* View Toggle Button (Only shown when logged in) */}
        {session && (
          <button
            onClick={handleToggleView}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            aria-label={isPublicView ? 'Switch to My Memos view' : 'Switch to Public Memos view'}
          >
            {isPublicView ? 'Show My Memos' : 'Show Public Memos'}
          </button>
        )}

        {/* Account / Auth Button */}
        <AuthButton
          session={session}
          status={status}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          authError={authError}
        />
      </header>

      {/* Global Data Fetching Error Display (if applicable) */}
      <DataErrorDisplay memoError={memoError} />

      {/* Main Content Area (Panes) */}
      {/* Takes remaining height, flex row, gap for visual separation (optional), overflow hidden */}
      <main className="flex-grow flex flex-row gap-0 overflow-hidden">

        {/* Left Pane: Public Memo Explorer (Always visible) */}
        <section className="w-1/3 md:w-1/4 lg:w-1/5 border-r bg-white flex flex-col overflow-hidden">
           {/* Pane Header */}
           <h2 className="text-base font-semibold p-3 border-b bg-gray-50 flex-shrink-0 text-gray-600 sticky top-0 z-10">
                Public Explorer
            </h2>
            {/* Scrollable Content Area */}
            <div className="flex-grow overflow-y-auto p-2">
                {/* Renders the list of public memos */}
                {/* MemoExplorer should handle its own internal loading/error state */}
                <MemoExplorer />
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
                    // Show Public Memos in the right pane
                    <>
                      <h2 className="text-base font-semibold p-3 border-b bg-gray-50 flex-shrink-0 text-gray-700 sticky top-0 z-10">
                          Public Memos (View)
                      </h2>
                      <div className="flex-grow overflow-y-auto p-4">
                          {/* Show MemoExplorer again, maybe for focused view later */}
                           <MemoExplorer />
                           {/* TODO: Implement selection from left pane to show detail here? */}
                      </div>
                    </>
                ) : (
                    // Show User's Private Memos (List + Editor)
                    <>
                      <h2 className="text-base font-semibold p-3 border-b bg-gray-50 flex-shrink-0 text-gray-700 sticky top-0 z-10">
                      MainWindow
                      </h2>
                      {/* MemoListEditor handles listing user's memos and the editing UI */}
                      {/* It should handle its own data fetching, loading, and error states */}
                      <div className="flex-grow overflow-y-auto p-4">
                        <MemoListEditor /* Pass userId={session.user.id} if needed */ />
                      </div>
                    </>
                )
            ) : (
                 // --- Logged Out State ---
                 // No separate title needed as SignInPrompt includes one
                 <div className="flex-grow overflow-y-auto">
                     <SignInPrompt onSignIn={handleSignIn} />
                 </div>
            )}
        </section>

      </main>
    </div>
  );
}