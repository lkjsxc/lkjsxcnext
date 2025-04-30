// src/components/AuthButtons.tsx
'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import React from 'react';

const AuthButtons: React.FC = () => {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="text-gray-500">Loading...</div>; // Or a spinner
  }

  if (session) {
    return (
      <div className="flex items-center space-x-4">
        <span className="text-gray-700 dark:text-gray-300">Signed in as {session.user?.email}</span>
        <button
          onClick={() => signOut()}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn('google')} // Assuming Google is the provider
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
    >
      Sign In with Google
    </button>
  );
};

export default AuthButtons;