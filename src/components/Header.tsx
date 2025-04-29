'use client';

import React, { useCallback } from 'react';
import { Session } from 'next-auth';
import AuthButton from '@/components/auth_button';

interface HeaderProps {
  session: Session | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  authError: string | null;
}

const Header: React.FC<HeaderProps> = ({
  session,
  status,
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