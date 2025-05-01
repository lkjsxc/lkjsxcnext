'use client';

import { useEffect, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useMemoUpdateQueue } from './useMemoUpdateQueue';
import { MemoFormData } from '@/types/memo';
import { usePollingContext } from '@/features/polling/context/PollingContext'; // To pause polling

interface UseMemoAutoSaveOptions {
  memoId: string | null; // The ID of the memo being edited
  formData: MemoFormData; // The current form data from the editor
  initialMemoClientUpdatedAt: string | undefined; // The clientUpdatedAt from the last fetched memo
  isEditing: boolean; // Whether the user is actively editing this memo
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
  const { unregisterPollingTask } = usePollingContext(); // Get unregister function
  const pollingTaskIdRef = useRef<string | null>(null); // Ref to store polling task ID

  // Effect to handle auto-saving when debounced form data changes
  useEffect(() => {
    // Only attempt to save if it's an existing memo and form data has changed
    // and the queue is not currently processing (to avoid adding while processing)
    if (memoId && initialMemoClientUpdatedAt !== undefined && !isProcessingQueue) {
      // Check if the debounced data is different from the initial data (optional but good)
      // A more robust check would compare against the last successfully saved data
      // For simplicity, we'll just assume debounced change means save is needed.

      // Add the update task to the queue
      addTask({
        memoId,
        data: debouncedFormData,
        clientUpdatedAt: initialMemoClientUpdatedAt, // Use the timestamp from the last fetch
      })
      .then(() => {
        console.log(`Auto-saved memo ${memoId}`);
        // TODO: Add subtle UI feedback for successful save
      })
      .catch((error) => {
        console.error(`Auto-save failed for memo ${memoId}:`, error);
        // TODO: Add UI feedback for save failure (e.g., toast notification)
        // TODO: Handle 409 Conflict specifically (e.g., prompt user, re-fetch)
      });
    }
  }, [debouncedFormData, memoId, initialMemoClientUpdatedAt, addTask, isProcessingQueue]); // Dependencies

  // Effect to pause/resume polling for the specific memo being edited
  useEffect(() => {
    if (memoId && isEditing) {
      // When editing starts, unregister the polling task for this memo
      // We need a way to identify the polling task for this specific memoId.
      // This requires a modification to usePolling or PollingContext to allow
      // tasks to be associated with an ID or key.
      // For now, we'll assume a mechanism exists or skip this part.
      // A better approach might be to pass a flag to usePolling to disable it.

      // --- Temporary: Skipping actual unregistering for now ---
      // A proper implementation would involve:
      // 1. Modifying usePolling to accept a key (e.g., memoId)
      // 2. Modifying PollingContext to store tasks by key and provide a way to disable/enable by key
      // 3. Calling a disable function here: disablePollingTask(memoId);
      console.log(`Polling for memo ${memoId} should be paused.`);

    } else if (memoId && !isEditing && pollingTaskIdRef.current) {
       // When editing stops, re-register or enable the polling task
       // --- Temporary: Skipping actual re-registering for now ---
       console.log(`Polling for memo ${memoId} should be resumed.`);
       // enablePollingTask(memoId);
    }

    // Cleanup: Ensure polling is re-enabled if component unmounts while editing
    return () => {
      if (memoId && pollingTaskIdRef.current) {
         console.log(`Component unmounted, ensuring polling for memo ${memoId} is resumed.`);
         // enablePollingTask(memoId);
      }
    };
  }, [memoId, isEditing, unregisterPollingTask]); // Dependencies

  // We don't return anything from this hook as its purpose is side effects (saving)
};

export { useMemoAutoSave };