import React from 'react';
import { MemoWithOwnership } from '@/types';
import { format } from 'date-fns'; // Will need to install date-fns

interface MemoViewerProps {
  memo: MemoWithOwnership;
}

const MemoViewer: React.FC<MemoViewerProps> = ({ memo }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h1 className="text-3xl font-bold mb-2">{memo.title || "Untitled Memo"}</h1>
        <div className="text-sm text-gray-600 mb-2">
          Created: {format(new Date(memo.createdAt), 'PPP p')}
          {' | '}
          Last Updated: {format(new Date(memo.updatedAt), 'PPP p')}
          {' | '}
          Visibility: {memo.isPublic ? "Public" : "Private"}
        </div>
        <div className="text-sm text-gray-600">Author: {memo.author.name || memo.author.email}</div>
      </div>
      <div className="flex-1 overflow-y-auto border rounded p-4 bg-gray-50">
        <p className="whitespace-pre-wrap">{memo.content}</p>
      </div>
    </div>
  );
};

export default MemoViewer;