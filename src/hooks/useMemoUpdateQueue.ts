// src/hooks/useMemoUpdateQueue.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { Memo } from '@/types';

// Define the shape of an update task in the queue
interface UpdateTask {
  memoId: string;
  data: Partial<Memo>; // Data to update
  clientUpdatedAt: string; // Timestamp from the client at the time of edit
  resolve: (updatedMemo: Memo) => void; // Function to call on success
  reject: (error: Error) => void; // Function to call on failure
}

const useMemoUpdateQueue = () => {
  const [queue, setQueue] = useState<UpdateTask[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const isMounted = useRef(true); // To prevent state updates on unmounted component

  useEffect(() => {
    return () => {
      isMounted.current = false; // Mark component as unmounted on cleanup
    };
  }, []);

  // Function to add a task to the queue
  const addUpdateTask = useCallback((task: UpdateTask) => {
    setQueue(prevQueue => [...prevQueue, task]);
  }, []);

  // Effect to process the queue
  useEffect(() => {
    const processQueue = async () => {
      if (queue.length === 0 || isProcessing) {
        return; // Nothing to process or already processing
      }

      setIsProcessing(true);
      const nextTask = queue[0];

      try {
        // Simulate API call for updating memo
        // In a real app, this would be a fetch request to PUT /api/memo/[id]
        const response = await fetch(`/api/memo/${nextTask.memoId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...nextTask.data,
            clientUpdatedAt: nextTask.clientUpdatedAt,
          }),
        });

        if (response.status === 409) {
          // Conflict detected
          const error = new Error('Conflict: Memo has been updated by someone else.');
          console.warn(`Update conflict for memo ${nextTask.memoId}`);
          nextTask.reject(error); // Reject the promise for this task
        } else if (!response.ok) {
          const errorData = await response.json();
          const error = new Error(errorData.message || `HTTP error! status: ${response.status}`);
          console.error(`API error updating memo ${nextTask.memoId}:`, error);
          nextTask.reject(error); // Reject the promise for this task
        } else {
          const updatedMemo: Memo = await response.json();
          console.log(`Successfully updated memo ${nextTask.memoId}`);
          nextTask.resolve(updatedMemo); // Resolve the promise for this task
        }

      } catch (error: any) {
        console.error(`Network or unexpected error updating memo ${nextTask.memoId}:`, error);
        nextTask.reject(error); // Reject the promise for this task
      } finally {
        // Remove the processed task from the queue
        if (isMounted.current) {
           setQueue(prevQueue => prevQueue.slice(1));
           setIsProcessing(false);
        }
      }
    };

    processQueue();

  }, [queue, isProcessing]); // Depend on queue and isProcessing state

  return { addUpdateTask, isProcessing, queueSize: queue.length };
};

export default useMemoUpdateQueue;