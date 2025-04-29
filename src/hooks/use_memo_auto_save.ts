import { useEffect, useRef } from 'react';
import { Memo } from '../types/memo';

interface UseMemoAutoSaveProps {
  selectedMemoId: string | null;
  memos: Memo[];
  updateMemo: (id: string, title: string, content: string, isPublic?: boolean) => Promise<void>;
}

export const use_memo_auto_save = ({ selectedMemoId, memos, updateMemo }: UseMemoAutoSaveProps) => {
  const previousMemoIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Save the previous memo when the selected memo changes
    if (previousMemoIdRef.current && previousMemoIdRef.current !== selectedMemoId) {
      const memoToSave = memos.find(memo => memo.id === previousMemoIdRef.current);
      if (memoToSave) {
        // Assuming the memo object in the 'memos' array holds the latest content
        // If content is managed elsewhere (e.g., in a separate state for the editor),
        // we would need to access that state here. For now, assuming 'memos' is updated.
        console.log(`Attempting to auto-save memo: ${memoToSave.id}`);
        updateMemo(memoToSave.id, memoToSave.title, memoToSave.content, memoToSave.isPublic);
      }
    }

    // Update the ref to the current selected memo ID
    previousMemoIdRef.current = selectedMemoId;

  }, [selectedMemoId, memos, updateMemo]); // Depend on selectedMemoId, memos, and updateMemo
};