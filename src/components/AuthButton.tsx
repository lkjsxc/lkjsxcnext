'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState, useCallback } from 'react'; // Import useState and useCallback if used internally

interface AuthButtonProps {
  session: ReturnType<typeof useSession>['data'];
  status: ReturnType<typeof useSession>['status'];
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  authError: string | null;
}

const AuthButton = ({ session, status, onSignIn, onSignOut, authError }: AuthButtonProps) => {
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
          className="px-4 py-2 border rounded-md text-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-150 ease-in-out flex-shrink-0"
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
        className="px-4 py-2 border rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out flex-shrink-0"
        >
        Sign in
        </button>
      </div>
  );
};

export default AuthButton;