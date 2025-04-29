import { useEffect, useRef } from 'react';
import { Memo } from '@/types/memo';
import { UseMemoUpdateQueue } from './useMemoUpdateQueue'; // Assuming the type is exported

interface UseAutoSaveProps {
  memo: Memo | null;
  addUpdate: UseMemoUpdateQueue['addUpdate'];
  isEditing: boolean;
  saveInterval?: number; // Interval in milliseconds, default 5000 (5 seconds)
}

const useAutoSave = ({ memo, addUpdate, isEditing, saveInterval = 5000 }: UseAutoSaveProps) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const latestMemoRef = useRef<Memo | null>(memo); // Keep track of the latest memo state

  // Update the latest memo ref whenever the memo prop changes
  useEffect(() => {
    latestMemoRef.current = memo;
  }, [memo]);

  useEffect(() => {
    if (isEditing && memo) {
      // Start the auto-save interval
      intervalRef.current = setInterval(() => {
        // Use the latest memo state from the ref
        if (latestMemoRef.current) {
          console.log('Auto-saving memo:', latestMemoRef.current.id);
          addUpdate({
            id: latestMemoRef.current.id,
            title: latestMemoRef.current.title,
            content: latestMemoRef.current.content,
          });
        }
      }, saveInterval);
    } else {
      // Clear the interval if not editing or no memo
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Clean up the interval when the component unmounts or dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isEditing, saveInterval, addUpdate]); // Depend on isEditing, saveInterval, and addUpdate

  // Optional: Trigger a save when editing stops
  // useEffect(() => {
  //   if (!isEditing && memo && latestMemoRef.current) {
  //     console.log('Saving memo on stop editing:', latestMemoRef.current.id);
  //     addUpdate({
  //       id: latestMemoRef.current.id,
  //       title: latestMemoRef.current.title,
  //       content: latestMemoRef.current.content,
  //     });
  //   }
  // }, [isEditing, memo, addUpdate]);
};

export default useAutoSave;