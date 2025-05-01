'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { UpdateMemoRequest, UpdateMemoResponse, ApiErrorResponse } from '@/types/api';
import { Memo } from '@/types/memo';

interface UpdateTask {
  memoId: string;
  data: Omit<UpdateMemoRequest, 'clientUpdatedAt'>;
  clientUpdatedAt: string; // ISO Date string
  resolve: (updatedMemo: Memo) => void;
  reject: (error: Error) => void;
}

const useMemoUpdateQueue = () => {
  const [queue, setQueue] = useState<UpdateTask[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const isProcessingRef = useRef(false); // Use ref to avoid stale closure in useEffect

  const addTask = useCallback((task: Omit<UpdateTask, 'resolve' | 'reject'>): Promise<Memo> => {
    return new Promise((resolve, reject) => {
      setQueue(prevQueue => [...prevQueue, { ...task, resolve, reject }]);
    });
  }, []);

  useEffect(() => {
    const processQueue = async () => {
      if (queue.length === 0 || isProcessingRef.current) {
        return;
      }

      isProcessingRef.current = true;
      setIsProcessing(true);

      const nextTask = queue[0];

      try {
        const response = await fetch(`/api/memo/${nextTask.memoId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...nextTask.data,
            clientUpdatedAt: nextTask.clientUpdatedAt,
          }),
        });

        if (!response.ok) {
          const errorData: ApiErrorResponse = await response.json();
          throw new Error(errorData.error?.message || 'Failed to update memo.');
        }

        const result: UpdateMemoResponse = await response.json();
        nextTask.resolve(result.memo); // Resolve the promise for this task

      } catch (error: any) {
        console.error('Update queue task failed:', error);
        nextTask.reject(error); // Reject the promise for this task
      } finally {
        // Remove the processed task and continue
        setQueue(prevQueue => prevQueue.slice(1));
        isProcessingRef.current = false;
        setIsProcessing(false);
      }
    };

    processQueue();

  }, [queue]); // Dependency on queue ensures effect runs when queue changes

  return {
    addTask,
    isProcessingQueue: isProcessing,
  };
};

export { useMemoUpdateQueue };