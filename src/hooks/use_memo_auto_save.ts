import { useEffect, useRef } from 'react';
import { Memo } from '../types/memo';
import { useMemoUpdateQueue } from './useMemoUpdateQueue';

interface UseMemoAutoSaveProps {
  selectedMemoId: string | null;
  memos: Memo[];
  // updateMemo is no longer directly used by this hook,
  // but might be needed by the component using this hook.
  // We will keep it in the interface for now but it's not used internally for auto-save.
  updateMemo: (id: string, title: string, content: string, isPublic?: boolean) => Promise<void>;
}

export const use_memo_auto_save = ({ selectedMemoId, memos, updateMemo }: UseMemoAutoSaveProps) => {
  const previousMemoIdRef = useRef<string | null>(null);
  const { addUpdate } = useMemoUpdateQueue();

  useEffect(() => {
    // Save the previous memo when the selected memo changes
    if (previousMemoIdRef.current && previousMemoIdRef.current !== selectedMemoId) {
      const memoToSave = memos.find(memo => memo.id === previousMemoIdRef.current);
      if (memoToSave) {
        // Assuming the memo object in the 'memos' array holds the latest content
        // If content is managed elsewhere (e.g., in a separate state for the editor),
        // we would need to access that state here. For now, assuming 'memos' is updated.
        console.log(`Attempting to auto-save memo: ${memoToSave.id}`);
        // Add the update to the queue instead of calling updateMemo directly
        addUpdate({
          id: memoToSave.id,
          title: memoToSave.title,
          content: memoToSave.content,
          isPublic: memoToSave.isPublic,
        });
      }
    }

    // Update the ref to the current selected memo ID
    previousMemoIdRef.current = selectedMemoId;

  }, [selectedMemoId, memos, addUpdate]); // Depend on selectedMemoId, memos, and addUpdate
};