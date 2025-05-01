'use client';

import React from 'react';
import { useMemosList } from '@/features/memo/hooks/useMemosList';
import { MemoListItem } from './MemoListItem';
import { Spinner } from '@/components/ui/Spinner';
import { Memo } from '@/types/memo';

interface MemoListProps {
  selectedMemoId: string | null;
  onSelectMemo: (memoId: string) => void;
}

const MemoList: React.FC<MemoListProps> = ({ selectedMemoId, onSelectMemo }) => {
  // Fetch all memos initially (public + user's private if authenticated)
  const { memos, isLoading, error } = useMemosList({ scope: 'all' });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error loading memos: {error.error.message}</div>;
  }

  return (
    <div className="w-full md:w-1/3 border-r border-gray-200 overflow-y-auto">
      {memos.length === 0 ? (
        <div className="p-4 text-gray-500">No memos found. Create a new one!</div>
      ) : (
        memos.map((memo) => (
          <MemoListItem
            key={memo.id}
            memo={memo}
            onSelect={onSelectMemo}
            isSelected={memo.id === selectedMemoId}
          />
        ))
      )}
    </div>
  );
};

export { MemoList };