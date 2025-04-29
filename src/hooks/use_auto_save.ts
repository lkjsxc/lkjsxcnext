import { useEffect, useRef } from 'react';

interface AutoSaveData {
  title: string;
  content: string;
  isPublic: boolean;
}

interface UseAutoSaveOptions {
  memoId: string;
  data: AutoSaveData;
  onSave: (memoId: string, data: AutoSaveData) => Promise<void>;
  interval?: number; // in milliseconds
}

import { use_central_polling } from './use_central_polling';

interface AutoSaveData {
  title: string;
  content: string;
  isPublic: boolean;
}

interface UseAutoSaveOptions {
  memoId: string;
  data: AutoSaveData;
  onSave: (memoId: string, data: AutoSaveData) => Promise<void>;
  interval?: number; // in milliseconds
}

export function useAutoSave({ memoId, data, onSave, interval = 5000 }: UseAutoSaveOptions) {
  const savedDataRef = useRef<AutoSaveData>(data);

  // Update the ref whenever the data changes
  useEffect(() => {
    savedDataRef.current = data;
  }, [data]);

  // Use central polling for the auto-save interval
  use_central_polling({
    shouldPoll: !!memoId, // Only poll if memoId is provided
    fetchFunction: () => onSave(memoId, savedDataRef.current),
    interval: interval,
    dependencies: [memoId, onSave, data], // Re-configure polling if these change
  });

  // No explicit return needed as use_central_polling handles the interval lifecycle
}