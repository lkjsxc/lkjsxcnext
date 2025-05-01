import React from 'react';
import { Spinner } from '@/components/ui/Spinner'; // Assuming Spinner component exists

const Loading: React.FC = () => {
  return (
    <div className="flex justify-center items-center h-screen">
      <Spinner size="large" />
    </div>
  );
};

export default Loading;