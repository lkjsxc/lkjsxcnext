'use client';

import { useState, useCallback } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import MemoExplorer from '@/components/MemoExplorer'; // Shows everyone's memos (Public)
import MemoListEditor from '@/components/MemoListEditor'; // Shows logged-in user's memos
import { useMemos } from '@/hooks/useMemos'; // Assuming this hook fetches *public* memos or handles context

// --- Helper Functional Components ---

// AuthButton (Keep as is - it's well-structured)
const AuthButton = ({ session, status, onSignIn, onSignOut, authError }: { // Removed setAuthError prop as it's handled by handlers
  session: ReturnType<typeof useSession>['data'];
  status: ReturnType<typeof useSession>['status'];
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  authError: string | null;
}) => {
  // Display Auth Error near the button if it occurs
  const errorDisplay = authError ? (
    <p className="text-xs text-red-600 mr-2">{authError}</p>
  ) : null;

  if (status === 'loading') {
    return <div className="px-4 py-2 text-sm text-gray-500">Loading Auth...</div>;
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        {errorDisplay}
        <p className="text-sm hidden sm:block">
          Signed in as <span className="font-semibold">{session.user?.name || session.user?.email}</span>
        </p>
        <button
          onClick={onSignOut}
          className="px-4 py-2 border rounded-md text-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-150 ease-in-out flex-shrink-0" // flex-shrink-0 prevents shrinking
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
      <div className="flex items-center gap-2">
         {errorDisplay}
        <button
        onClick={onSignIn}
        className="px-4 py-2 border rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out flex-shrink-0" // flex-shrink-0 prevents shrinking
        >
        Sign in
        </button>
      </div>
  );
};

// Component for the right pane when the user is logged out
const SignInPrompt = ({ onSignIn }: { onSignIn: () => Promise<void> }) => (
  <div className="flex flex-col items-center justify-center h-full text-center p-6">
    <h2 className="text-xl font-semibold mb-4 text-gray-700">My Memos</h2>
    <p className="mb-6 text-gray-600">
      Sign in to create, edit, and manage your personal memos.
    </p>
    <button
      onClick={onSignIn}
      className="px-5 py-2.5 border rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
    >
      Sign In
    </button>
     <p className="mt-4 text-sm text-gray-500">
        (You can still browse public memos on the left)
    </p>
  </div>
);

// Component to display data fetching errors (if any from useMemos)
const DataErrorDisplay = ({ memoError }: { memoError: string | null }) => {
  if (!memoError) return null;

  return (
    <div className="my-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded mx-4">
      <p><strong>Data Error:</strong> {memoError}</p>
      <p className="text-sm">Could not load memo data. Please try again later.</p>
    </div>
  );
};


// --- Main Page Component (Redesigned) ---

export default function Home() {
  const { data: session, status } = useSession();
  // Assuming useMemos fetches public memos by default or based on context
  // Error from this hook likely relates to fetching *public* data if used in MemoExplorer
  const { error: memoError } = useMemos();
  const [authError, setAuthError] = useState<string | null>(null);

  // Memoized Sign-In Handler (Pure function given inputs)
  const handleSignIn = useCallback(async () => {
    setAuthError(null); // Clear previous errors
    try {
      const result = await signIn('google', { redirect: false }); // Adjust provider if needed
      if (result?.error) {
        const friendlyError = result.error === "OAuthAccountNotLinked"
          ? "Email linked to another provider."
          : "Sign in failed. Please try again."; // More generic error
        console.error("Sign in error details:", result.error); // Log detailed error
        setAuthError(friendlyError);
      }
    } catch (err: any) {
      console.error("Sign in catch block:", err);
      setAuthError('An unexpected error occurred during sign in.');
    }
  }, []); // No dependencies, created once

  // Memoized Sign-Out Handler (Pure function given inputs)
  const handleSignOut = useCallback(async () => {
    setAuthError(null);
    try {
      await signOut({ redirect: false }); // Stay on page
    } catch (err: any) {
      console.error("Sign out catch block:", err);
      setAuthError('An unexpected error occurred during sign out.');
    }
  }, []); // No dependencies, created once

  // --- Render Logic ---

  // Optional: More sophisticated loading state (e.g., skeleton loaders)
  // if (status === 'loading') {
  //   return <div className="flex justify-center items-center min-h-screen"><p>Loading...</p></div>;
  // }
  // We render the layout even during auth loading for a smoother feel

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-gray-100"> {/* Full height, prevent body scroll */}

      {/* Header */}
      <header className="flex justify-between items-center p-3 border-b bg-white shadow-sm flex-shrink-0 h-16"> {/* Fixed height */}
        <h1 className="text-xl font-bold text-gray-800 px-2">
          Memo App
        </h1>
        <AuthButton
          session={session}
          status={status}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          authError={authError}
        />
      </header>

      {/* Display Global Data Fetching Error (if applicable) */}
      {/* Placed here, it's visible regardless of login state */}
      <DataErrorDisplay memoError={memoError} />

      {/* Main Content Area (Panes) */}
      <main className="flex-grow flex flex-row gap-0 overflow-hidden"> {/* Take remaining height, flex row */}

        {/* Left Pane: Public Memo Explorer */}
        <section className="w-1/3 md:w-1/4 lg:w-1/5 border-r bg-white flex flex-col overflow-hidden"> {/* Adjust width as needed */}
           <h2 className="text-base font-semibold p-3 border-b bg-gray-50 flex-shrink-0 text-gray-600">
                Public Explorer
            </h2>
            <div className="flex-grow overflow-y-auto p-2">
                {/* MemoExplorer likely handles its own loading/error for public memos */}
                <MemoExplorer />
            </div>
        </section>

        {/* Right Pane: User's Editor or Sign-In Prompt */}
        <section className="flex-grow flex flex-col overflow-hidden bg-white"> {/* Takes remaining width */}
            {/* Conditional Rendering based on session */}
            {session ? (
                <>
                 <h2 className="text-base font-semibold p-3 border-b bg-gray-50 flex-shrink-0 text-gray-700">
                    My Memos
                 </h2>
                 {/* Note: MemoListEditor should handle its own loading/error for user's memos */}
                 {/* Pass session or user ID if needed by the component */}
                 <div className="flex-grow overflow-y-auto p-4">
                    <MemoListEditor /* userId={session.user.id} */ />
                 </div>
                </>
            ) : (
                 // Show prompt when not logged in
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