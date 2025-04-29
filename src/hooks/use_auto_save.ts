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

export function useAutoSave({ memoId, data, onSave, interval = 5000 }: UseAutoSaveOptions) {
  const savedDataRef = useRef<AutoSaveData>(data);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update the ref whenever the data changes
  useEffect(() => {
    savedDataRef.current = data;
  }, [data]);

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up the new interval
    intervalRef.current = setInterval(() => {
      // Call the save function with the latest data from the ref
      onSave(memoId, savedDataRef.current);
    }, interval);

    // Cleanup function to clear the interval when the component unmounts
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [memoId, onSave, interval]); // Re-run effect if memoId, onSave, or interval changes
}