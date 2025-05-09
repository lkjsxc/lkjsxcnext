'use client';

import { useEffect, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useMemoUpdateQueue } from './useMemoUpdateQueue';
import { MemoFormData } from '@/types/memo';
import { usePolling } from '@/features/polling/hooks/usePolling';

interface UseMemoAutoSaveOptions {
  memoId: string | null;
  formData: MemoFormData;
  initialMemoClientUpdatedAt: string | undefined;
  isEditing: boolean;
}

const AUTO_SAVE_DELAY = 1000; // 1 second debounce delay

const useMemoAutoSave = ({
  memoId,
  formData,
  initialMemoClientUpdatedAt,
  isEditing,
}: UseMemoAutoSaveOptions) => {
  const debouncedFormData = useDebounce(formData, AUTO_SAVE_DELAY);
  const { addTask, isProcessingQueue } = useMemoUpdateQueue();
  const lastSavedDataRef = useRef<MemoFormData | null>(null);

  // Function to check if data needs saving
  const needsSaving = () => {
    if (!lastSavedDataRef.current) return true;
    return JSON.stringify(lastSavedDataRef.current) !== JSON.stringify(formData);
  };

  // Function to perform the actual save
  const performSave = async () => {
    if (memoId && initialMemoClientUpdatedAt && !isProcessingQueue && needsSaving()) {
      try {
        await addTask({
          memoId,
          data: formData,
          clientUpdatedAt: initialMemoClientUpdatedAt,
        });
        lastSavedDataRef.current = formData;
        console.log(`Auto-saved memo ${memoId}`);
      } catch (error) {
        console.error(`Auto-save failed for memo ${memoId}:`, error);
      }
    }
  };

  // Register polling task for periodic saves - always enabled but only saves when needed
  usePolling(
    () => {
      if (memoId) {
        performSave();
      }
    },
    [memoId, formData, initialMemoClientUpdatedAt, isProcessingQueue],
    memoId || undefined
  );

  // Effect to handle auto-saving when debounced form data changes
  useEffect(() => {
    performSave();
  }, [debouncedFormData]);
};

export { useMemoAutoSave };