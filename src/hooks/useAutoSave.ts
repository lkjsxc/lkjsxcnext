// src/hooks/useAutoSave.ts
import { useEffect, useRef, useCallback } from 'react';
import { Memo } from '@/types';
import useMemoUpdateQueue from './useMemoUpdateQueue';

interface UseAutoSaveProps {
  memoId: string | null;
  data: Partial<Memo>; // The data to potentially save
  clientUpdatedAt: string | null; // The client's timestamp for OCC
  onSaveSuccess?: (updatedMemo: Memo) => void;
  onSaveError?: (error: Error) => void;
  debounceDelay?: number; // Delay in milliseconds before saving (default: 1000ms)
  isEditing: boolean; // Flag to indicate if the memo is actively being edited
}

const useAutoSave = ({
  memoId,
  data,
  clientUpdatedAt,
  onSaveSuccess,
  onSaveError,
  debounceDelay = 1000,
  isEditing,
}: UseAutoSaveProps) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { addUpdateTask } = useMemoUpdateQueue();

  // Function to trigger a save
  const triggerSave = useCallback(async () => {
    if (!memoId || !clientUpdatedAt) {
      console.warn("Auto-save skipped: memoId or clientUpdatedAt is missing.");
      return;
    }

    console.log(`Attempting auto-save for memo ${memoId}`);

    // Add the update task to the queue
    addUpdateTask({
      memoId,
      data,
      clientUpdatedAt,
      resolve: (updatedMemo) => {
        console.log(`Auto-save successful for memo ${memoId}`);
        onSaveSuccess?.(updatedMemo);
      },
      reject: (error) => {
        console.error(`Auto-save failed for memo ${memoId}:`, error);
        onSaveError?.(error);
      },
    });

  }, [memoId, data, clientUpdatedAt, addUpdateTask, onSaveSuccess, onSaveError]);

  // Effect to handle debouncing
  useEffect(() => {
    // Only trigger auto-save if editing and memoId/clientUpdatedAt are available
    if (isEditing && memoId && clientUpdatedAt) {
      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Set a new debounce timer
      timerRef.current = setTimeout(() => {
        triggerSave();
      }, debounceDelay);
    }

    // Cleanup: clear the timer when the component unmounts or dependencies change
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [data, debounceDelay, triggerSave, isEditing, memoId, clientUpdatedAt]); // Re-run effect when data changes

  // Optional: Manually trigger a save (e.g., on blur or before closing)
  const saveNow = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    triggerSave();
  }, [triggerSave]);

  return { saveNow };
};

export default useAutoSave;