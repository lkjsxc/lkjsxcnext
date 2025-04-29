import { useState, useCallback } from 'react';

interface UsememoelectionResult {
  selectedMemoId: string | null;
  handleSelectMemo: (memoId: string | null) => void;
}

export const use_memo_selection = (): UsememoelectionResult => {
  const [selectedMemoId, setSelectedMemoId] = useState<string | null>(null);

  const handleSelectMemo = useCallback((memoId: string | null) => {
    setSelectedMemoId(memoId);
  }, []);

  return {
    selectedMemoId,
    handleSelectMemo,
  };
};