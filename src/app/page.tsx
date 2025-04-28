'use client';

import { useState, useCallback } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Header from '@/components/Header';
import DataErrorDisplay from '@/components/DataErrorDisplay';
// --- Import Conceptual Placeholders for the new structure ---
// You will need to create these actual components
import Explorer from '@/components/Explorer'; // Displays memo list (left pane)
import MainWindow from '@/components/MainWindow'; // Displays memo detail/editor (right pane)

// --- Main Page Component (Redesigned based on README) ---

export default function Home() {
  const { data: session, status } = useSession();
  const [selectedMemoId, setSelectedMemoId] = useState<string | null>(null); // ID of the memo selected in Explorer
  const [authError, setAuthError] = useState<string | null>(null);
  // Note: Memo data fetching should now ideally happen *within* Explorer and MainWindow
  // We might keep a top-level error state or handle errors within child components.

  // --- Authentication Handlers ---
  const handleSignIn = useCallback(async () => {
    setAuthError(null);
    setSelectedMemoId(null); // Clear selection on sign in
    try {
      const result = await signIn('google', { redirect: false });
      if (result?.error) {
        const friendlyError = result.error === "OAuthAccountNotLinked"
          ? "Email linked to another provider. Try signing out and signing in with Google."
          : "Sign in failed. Please try again.";
        console.error("Sign in error details:", result.error);
        setAuthError(friendlyError);
      }
      // No need to set isPublicView here anymore
    } catch (err: any) {
      console.error("Sign in catch block:", err);
      setAuthError('An unexpected error occurred during sign in.');
    }
  }, []); // Dependencies: none

  const handleSignOut = useCallback(async () => {
    setAuthError(null);
    setSelectedMemoId(null); // Clear selection on sign out
    try {
      await signOut({ redirect: false });
      // No view state to change here, Explorer will update based on session change
    } catch (err: any) {
      console.error("Sign out catch block:", err);
      setAuthError('An unexpected error occurred during sign out.');
    }
  }, []); // Dependencies: none

  // --- Memo Selection Handler ---
  // Passed down to the Explorer component
  const handleSelectMemo = useCallback((memoId: string | null) => {
    setSelectedMemoId(memoId);
  }, []); // Dependencies: none

  // --- Render Logic ---

  return (
    // Main container: Full height, flex column
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-gray-100">

      {/* Header Component */}
      <Header
        session={session}
        status={status}
        // Remove props related to isPublicView if they are no longer needed in Header
        // isPublicView={isPublicView} // Removed
        // onToggleView={handleToggleView} // Removed
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        authError={authError}
        // Maybe add a prop for triggering 'Create New Memo' if that button lives in the header
        // onCreateNewMemo={() => { /* Logic to create new memo and select it */ }}
      />

      {/* Optional: Display auth errors prominently */}
      {authError && <DataErrorDisplay authError={authError} />}
      {/* Remove memoError prop if data fetching errors are handled in child components */}
      {/* <DataErrorDisplay memoError={memoError} /> */}


      {/* Main Content Area: Flex row, takes remaining height */}
      <div className="flex flex-1 overflow-hidden"> {/* flex-1 allows this div to grow */}

        {/* Explorer Pane (Left) */}
        <div className="w-1/3 lg:w-1/4 border-r border-gray-300 overflow-y-auto p-4 bg-white shadow-sm">
          {/*
            The Explorer component needs to:
            - Fetch public memos (always)
            - Fetch user's memos if logged in (session exists)
            - Display list of memo titles (combined list)
            - Highlight the selected memo based on `selectedMemoId`
            - Call `onSelectMemo` when a title is clicked
            - Potentially include 'Create New Memo' button and filtering UI later
          */}
          <Explorer
              session={session}
              onSelectMemo={handleSelectMemo}
              selectedMemoId={selectedMemoId}
          />
        </div>

        {/* MainWindow Pane (Right) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {/*
            The MainWindow component needs to:
            - Receive `selectedMemoId` and `session`
            - If `selectedMemoId` exists:
              - Fetch details for that memo
              - Determine if it's the user's own memo (check authorId against session?.user?.id)
              - Render EditorTab (if own memo) or ViewerTab (if other's memo)
            - If `selectedMemoId` is null:
              - Display a placeholder message (e.g., "Select a memo" or "Create a new memo")
            - Handle memo saving, deleting, toggling public/private (passing functions down if needed or handling internally)
          */}
           <MainWindow
              selectedMemoId={selectedMemoId}
              session={session}
              // Pass a callback to clear selection if MainWindow handles deletion
              onMemoDeleted={() => setSelectedMemoId(null)}
              // Pass callback to update selection if MainWindow handles creation
              onMemoCreated={(newMemoId) => setSelectedMemoId(newMemoId)}
           />
        </div>

      </div>
    </div>
  );
}