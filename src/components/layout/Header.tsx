import React from 'react';
import AuthButtons from '@/features/auth/components/AuthButtons'; // Import AuthButtons

const Header: React.FC = () => {
  return (
    <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <div className="text-xl font-bold">lkjsxcnext</div>
      <AuthButtons />{/* Integrate AuthButtons */}
    </header>
  );
};

export { Header };