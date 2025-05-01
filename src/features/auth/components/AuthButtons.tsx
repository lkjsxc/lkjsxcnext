'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/Button'; // Assuming Button component exists

const AuthButtons: React.FC = () => {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>; // Or a Spinner component
  }

  if (session) {
    return (
      <div className="flex items-center space-x-4">
        {session.user?.image && (
          <img
            src={session.user.image}
            alt="User Avatar"
            className="w-8 h-8 rounded-full"
          />
        )}
        <span>{session.user?.name || session.user?.email}</span>
        <Button onClick={() => signOut()}>Sign Out</Button>
      </div>
    );
  }

  return (
    <Button onClick={() => signIn('google')}>Sign In with Google</Button>
  );
};

export default AuthButtons;