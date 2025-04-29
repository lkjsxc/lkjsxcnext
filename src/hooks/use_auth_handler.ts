import { useState, useCallback } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

interface UseAuthHandlersResult {
  session: ReturnType<typeof useSession>['data'];
  status: ReturnType<typeof useSession>['status'];
  authError: string | null;
  handleSignIn: () => Promise<void>;
  handleSignOut: () => Promise<void>;
  setAuthError: (error: string | null) => void; // Expose setter for external errors if needed
}

export const use_auth_handlers = (): UseAuthHandlersResult => {
  const { data: session, status } = useSession();
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSignIn = useCallback(async () => {
    setAuthError(null);
    try {
      const result = await signIn('google', { redirect: false });
      if (result?.error) {
        const friendlyError = result.error === "OAuthAccountNotLinked"
          ? "Email linked to another provider. Try signing out and signing in with Google."
          : "Sign in failed. Please try again.";
        console.error("Sign in error details:", result.error);
        setAuthError(friendlyError);
      }
    } catch (err: any) {
      console.error("Sign in catch block:", err);
      setAuthError('An unexpected error occurred during sign in.');
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    setAuthError(null);
    try {
      await signOut({ redirect: false });
    } catch (err: any) {
      console.error("Sign out catch block:", err);
      setAuthError('An unexpected error occurred during sign out.');
    }
  }, []);

  return {
    session,
    status,
    authError,
    handleSignIn,
    handleSignOut,
    setAuthError,
  };
};