import React from 'react';
import { Memo } from '@/types/memo';

interface MemoListItemProps {
  memo: Memo;
  onSelect: (memoId: string) => void;
  isSelected: boolean;
}

const MemoListItem: React.FC<MemoListItemProps> = ({ memo, onSelect, isSelected }) => {
  return (
    <div
      className={`cursor-pointer p-3 border-b border-gray-200 hover:bg-gray-100 ${isSelected ? 'bg-blue-100' : ''}`}
      onClick={() => onSelect(memo.id)}
    >
      <h3 className="text-lg font-semibold truncate">{memo.title || 'Untitled Memo'}</h3>
      <p className="text-sm text-gray-600 truncate">{memo.content || 'No content'}</p>
      <div className="text-xs text-gray-500 mt-1">
        {memo.isPublic ? 'Public' : 'Private'} | Last updated: {new Date(memo.updatedAt).toLocaleString()}
      </div>
    </div>
  );
};

export { MemoListItem };