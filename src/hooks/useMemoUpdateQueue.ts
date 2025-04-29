import { useState, useEffect, useRef } from 'react';
import { Memo } from '@/types/memo';

interface MemoUpdate {
  id: string;
  title: string;
  content: string;
  clientUpdatedAt: string; // ISO string timestamp
}

export interface UseMemoUpdateQueue {
  addUpdate: (update: Omit<MemoUpdate, 'clientUpdatedAt'>) => void;
  isProcessing: boolean;
  error: string | null;
}

const useMemoUpdateQueue = (): UseMemoUpdateQueue => {
  const [queue, setQueue] = useState<MemoUpdate[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const processingRef = useRef(false); // Use ref to track processing state in effect

  // Effect to process the queue
  useEffect(() => {
    const processQueue = async () => {
      if (queue.length === 0 || processingRef.current) {
        return;
      }

      processingRef.current = true;
      setIsProcessing(true);
      setError(null);

      const nextUpdate = queue[0];

      try {
        const res = await fetch(`/api/memo/${nextUpdate.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: nextUpdate.title,
            content: nextUpdate.content,
            clientUpdatedAt: nextUpdate.clientUpdatedAt,
          }),
        });

        if (res.status === 409) {
          // Conflict detected - server has a newer version
          setError('Conflict: Server has a newer version. Please refresh.');
          // Depending on desired behavior, you might stop processing or handle differently
          setQueue([]); // Clear queue on conflict for simplicity
        } else if (!res.ok) {
          throw new Error(`Error updating memo: ${res.statusText}`);
        } else {
          // Success - remove the processed update from the queue
          setQueue(prevQueue => prevQueue.slice(1));
        }
      } catch (err: any) {
        setError(err.message);
        // Decide whether to retry or clear queue on other errors
        setQueue([]); // Clear queue on other errors for simplicity
      } finally {
        processingRef.current = false;
        setIsProcessing(false);
      }
    };

    processQueue();

    // Clean up effect if component unmounts while processing
    return () => {
      processingRef.current = false;
    };
  }, [queue]); // Depend on queue changes

  const addUpdate = (update: Omit<MemoUpdate, 'clientUpdatedAt'>) => {
    const clientUpdatedAt = new Date().toISOString();
    setQueue(prevQueue => [...prevQueue, { ...update, clientUpdatedAt }]);
  };

  return { addUpdate, isProcessing, error };
};

export default useMemoUpdateQueue;