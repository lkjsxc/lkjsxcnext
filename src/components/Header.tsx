'use client';

import React, { useCallback } from 'react';
import { Session } from 'next-auth';
import AuthButton from '@/components/AuthButton';

interface HeaderProps {
  session: Session | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  isPublicView: boolean;
  onToggleView: () => void;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  authError: string | null;
}

const Header: React.FC<HeaderProps> = ({
  session,
  status,
  isPublicView,
  onToggleView,
  onSignIn,
  onSignOut,
  authError,
}) => {
  return (
    <header className="flex justify-between items-center p-3 border-b bg-white shadow-sm flex-shrink-0 h-16">
      {/* Logo */}
      <h1 className="text-xl font-bold text-gray-800 px-2">
        lkjsxcnext
      </h1>

      {/* View Toggle Button (Only shown when logged in) */}
      {session && (
        <button
          onClick={onToggleView}
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
        onSignIn={onSignIn}
        onSignOut={onSignOut}
        authError={authError}
      />
    </header>
  );
};

export default Header;