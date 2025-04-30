import { useState, useEffect, useRef, useCallback } from 'react';
import { Memo } from '@/types';

interface UpdatePayload {
  title?: string;
  content?: string;
  isPublic?: boolean;
  clientUpdatedAt: string; // ISO string
}

interface UpdateTask {
  payload: UpdatePayload;
  resolve: (updatedMemo: Memo) => void;
  reject: (error: Error) => void;
}

const useMemoUpdateQueue = (memoId: string | null, onSuccessfulUpdate: () => void) => {
  const [queue, setQueue] = useState<UpdateTask[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const isProcessingRef = useRef(false); // Use ref to avoid stale closure in useEffect

  // Effect to process the queue whenever it changes or processing state changes
  useEffect(() => {
    const processQueue = async () => {
      if (queue.length === 0 || isProcessingRef.current) {
        return;
      }

      isProcessingRef.current = true;
      setIsProcessing(true);

      const nextTask = queue[0];
      const { payload, resolve, reject } = nextTask;

      try {
        const res = await fetch(`/api/memo/${memoId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const updatedMemo: Memo = await res.json();
          resolve(updatedMemo);
          // Remove the processed task and continue
          setQueue(prevQueue => prevQueue.slice(1));
          onSuccessfulUpdate(); // Notify parent of successful update
        } else if (res.status === 409) {
          // Conflict detected
          const error = new Error('Conflict: Memo has been updated by another process.');
          reject(error);
          // On conflict, clear the queue and force a re-fetch of the latest data
          console.warn("Conflict detected. Clearing update queue and refreshing memo.");
          setQueue([]); // Clear queue on conflict
          onSuccessfulUpdate(); // Re-fetch latest data
        } else {
          const error = new Error(`Error updating memo: ${res.status}`);
          reject(error);
          // On other errors, you might want to keep the task or clear it depending on desired behavior
          // For now, let's clear the queue on any API error to prevent infinite loops
          console.error("API error during memo update. Clearing update queue.");
          setQueue([]);
          // Optionally, you could add retry logic here
        }
      } catch (error: any) {
        console.error("Network or unexpected error during memo update:", error);
        reject(error);
        // Clear queue on network errors too
        setQueue([]);
      } finally {
        isProcessingRef.current = false;
        setIsProcessing(false);
      }
    };

    processQueue();

  }, [queue, memoId, onSuccessfulUpdate]); // Dependencies for the effect

  // Function to add an update request to the queue
  const enqueueUpdate = useCallback((payload: UpdatePayload): Promise<Memo> => {
    return new Promise((resolve, reject) => {
      const newTask: UpdateTask = { payload, resolve, reject };
      setQueue(prevQueue => [...prevQueue, newTask]);
    });
  }, []); // No dependencies needed for enqueueUpdate

  // Clear the queue if memoId changes
  useEffect(() => {
    setQueue([]);
    isProcessingRef.current = false;
    setIsProcessing(false);
  }, [memoId]);


  return { enqueueUpdate, isProcessingQueue: isProcessing };
};

export default useMemoUpdateQueue;