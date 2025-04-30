// src/components/Header.tsx
import React from 'react';
import AuthButtons from './AuthButtons';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-200 dark:bg-gray-800 p-4 flex justify-between items-center shadow-md">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">lkjsxcnext Memos</h1>
      <AuthButtons />
    </header>
  );
};

export default Header;