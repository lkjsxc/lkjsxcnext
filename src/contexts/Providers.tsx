'use client';

import { SessionProvider } from 'next-auth/react';
import React from 'react';
import { PollingProvider } from '@/features/polling/context/PollingContext'; // Import PollingProvider

interface ProvidersProps {
  children: React.ReactNode;
}

const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <SessionProvider>
      <PollingProvider>{/* Wrap children with PollingProvider */}
        {children}
      </PollingProvider>
    </SessionProvider>
  );
};

export default Providers;