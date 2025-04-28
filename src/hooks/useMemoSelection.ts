import { useState, useCallback } from 'react';

interface UseMemoSelectionResult {
  selectedMemoId: string | null;
  handleSelectMemo: (memoId: string | null) => void;
}

export const useMemoSelection = (): UseMemoSelectionResult => {
  const [selectedMemoId, setSelectedMemoId] = useState<string | null>(null);

  const handleSelectMemo = useCallback((memoId: string | null) => {
    setSelectedMemoId(memoId);
  }, []);

  return {
    selectedMemoId,
    handleSelectMemo,
  };
};