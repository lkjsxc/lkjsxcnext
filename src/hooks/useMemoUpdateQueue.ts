import { useState, useEffect, useRef, useCallback } from 'react';
import { updateMemoApi } from '../utils/memo_api'; // Assuming this is the correct import path

interface QueuedMemoUpdate {
  id: string;
  title: string;
  content: string;
  isPublic?: boolean;
  timestamp: number;
}

export const useMemoUpdateQueue = () => {
  const [queue, setQueue] = useState<QueuedMemoUpdate[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addUpdate = (update: Omit<QueuedMemoUpdate, 'timestamp'>) => {
    setQueue(prevQueue => [...prevQueue, { ...update, timestamp: Date.now() }]);
  };

  const processQueueManually = useCallback(async () => {
    if (queue.length > 0 && !isProcessing) {
      setIsProcessing(true);
      const nextUpdate = queue[0];
      try {
        // Call the API to update the memo
        // The server will need to handle the timestamp and potential conflicts
        await updateMemoApi(nextUpdate.id, nextUpdate.title, nextUpdate.content, nextUpdate.isPublic);

        // Remove the processed item from the queue
        setQueue(prevQueue => prevQueue.slice(1));
      } catch (error) {
        console.error('Error processing memo update queue:', error);
        // Depending on the error handling strategy, you might retry,
        // move the item to a failed queue, or remove it.
        // For now, let's just log and remove to prevent blocking the queue.
         setQueue(prevQueue => prevQueue.slice(1));
      } finally {
        setIsProcessing(false);
      }
    }
  }, [queue, isProcessing]); // Depend on queue and isProcessing

  // Remove the internal useEffect that processes the queue automatically
  // useEffect(() => {
  //   processQueue();
  // }, [queue, isProcessing]);

  return { addUpdate, queue, isProcessing, processQueueManually, queueSize: queue.length };
};