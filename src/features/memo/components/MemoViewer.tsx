'use client';

import React from 'react';
import { useMemoDetail } from '@/features/memo/hooks/useMemoDetail';
import { Spinner } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';

interface MemoViewerProps {
  memoId: string;
}

const MemoViewer: React.FC<MemoViewerProps> = ({ memoId }) => {
  const { memo, isLoading, error } = useMemoDetail(memoId);

  if (isLoading) {
    return (
      <Card className="flex-1 flex justify-center items-center">
        <Spinner />
      </Card>
    );
  }

  if (error) {
    return <Card className="flex-1 text-red-500">Error loading memo: {error.error.message}</Card>;
  }

  if (!memo) {
    return <Card className="flex-1 text-gray-500">Memo not found or you do not have permission to view it.</Card>;
  }

  return (
    <Card className="flex-1 overflow-y-auto">
      <h2 className="text-2xl font-bold mb-4">{memo.title || 'Untitled Memo'}</h2>
      <div className="text-gray-700 whitespace-pre-wrap">{memo.content}</div>
      <div className="text-sm text-gray-500 mt-4">
        Last updated: {new Date(memo.updatedAt).toLocaleString()}
      </div>
    </Card>
  );
};

export { MemoViewer };