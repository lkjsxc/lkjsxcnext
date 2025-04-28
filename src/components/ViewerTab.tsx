// src/components/ViewerTab.tsx
import type { Memo } from '@/types';

interface ViewerTabProps {
  memo: Memo;
}

export default function ViewerTab({ memo }: ViewerTabProps) {
  return (
    <div className="prose max-w-none"> {/* Use Tailwind Typography for basic styling */}
      <h1 className="border-b pb-2 mb-4">{memo.title || '(Untitled)'}</h1>
      {/* Render content - use dangerouslySetInnerHTML only if you TRUST the source or sanitize it first! */}
      {/* For plain text: */}
      <p className="whitespace-pre-wrap">{memo.content}</p>
      {/* If content could be HTML/Markdown that's already sanitized: */}
      {/* <div dangerouslySetInnerHTML={{ __html: memo.content }} /> */}

      <div className="mt-6 text-sm text-gray-500 border-t pt-2">
        <p>Status: {memo.isPublic ? 'Public' : 'Private'}</p>
        {/* Add author info if available */}
        {/* <p>Author: {memo.author?.name || 'Unknown'}</p> */}
        <p>Last Updated: {new Date(memo.updatedAt).toLocaleString()}</p>
      </div>
    </div>
  );
}