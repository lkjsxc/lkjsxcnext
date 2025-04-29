import { useEffect, useState, useCallback } from 'react';
import { use_central_polling } from './use_central_polling';
import { useMemoUpdateQueue } from './useMemoUpdateQueue';
import { fetchUsermemo, updateMemoApi } from '../utils/memo_api';
import { Memo } from '../types/memo';

interface SyncState {
  lastSync: number | null;
  isSyncing: boolean;
  error: string | null;
  memos: Memo[]; // Add memos property
}

export const useSyncManager = () => {
  const { queue, addUpdate, isProcessing: isProcessingQueue, processQueueManually } = useMemoUpdateQueue();
  const [syncState, setSyncState] = useState<SyncState>({
    lastSync: null,
    isSyncing: false,
    error: null,
    memos: [], // Initialize memos as an empty array
  });

  const syncWithServer = useCallback(async () => {
    if (syncState.isSyncing) return;

    setSyncState(prevState => ({ ...prevState, isSyncing: true, error: null }));

    try {
      // 1. Process outgoing queue

      // 2. Fetch latest data from server
      const latestMemos = await fetchUsermemo();
      console.log('Fetched latest memos:', latestMemos);

      // Compare fetched memos with current memos to avoid unnecessary state updates
      const memosChanged = latestMemos.length !== syncState.memos.length ||
        latestMemos.some((latestMemo, index) => {
          const currentMemo = syncState.memos[index];
          return !currentMemo || latestMemo.id !== currentMemo.id ||
                 latestMemo.title !== currentMemo.title ||
                 latestMemo.content !== currentMemo.content ||
                 latestMemo.isPublic !== currentMemo.isPublic; // Assuming isPublic is also part of Memo
        });

      if (memosChanged) {
        setSyncState(prevState => ({
          ...prevState,
          memos: latestMemos, // Store fetched memos
          lastSync: Date.now(),
          isSyncing: false,
          error: null,
        }));
      } else {
         setSyncState(prevState => ({
           ...prevState,
           lastSync: Date.now(),
           isSyncing: false,
           error: null,
         }));
      }

    } catch (error) {
      console.error('Synchronization error:', error);
      setSyncState(prevState => ({
        ...prevState,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'An unknown synchronization error occurred.',
      }));
    }
  }, [processQueueManually]); // Removed queue dependency as it's handled by use_central_polling

  // Use central polling to trigger syncWithServer every 5 seconds
  // Pass processQueueManually to ensure queue is processed before fetching
  use_central_polling({
    shouldPoll: true, // Always poll for synchronization
    fetchFunction: syncWithServer, // The function to call at each interval
    interval: 5000, // 5 seconds
    dependencies: [syncWithServer, processQueueManually], // Re-configure polling if syncWithServer or processQueueManually changes
    processQueue: processQueueManually, // Pass the queue processing function
  });

  // Effect to potentially trigger sync after queue processing (less ideal)
  // useEffect(() => {
  //   if (!isProcessing && queue.length === 0 && syncState.isSyncing) {
  //     // This is a simplistic way to detect queue completion.
  //     // A more robust method is needed.
  //     syncWithServer(); // Re-fetch after queue is empty? Needs careful thought.
  //   }
  // }, [isProcessingQueue, queue.length, syncState.isSyncing, syncWithServer]);


  return {
    addMemoUpdateToQueue: addUpdate,
    syncState,
    queueSize: queue.length,
    isProcessingQueue,
  };
};