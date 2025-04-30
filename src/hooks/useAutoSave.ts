import { useEffect, useRef } from 'react';
import { debounce } from 'lodash'; // Will need to install lodash

interface AutoSaveProps {
  title: string;
  content: string;
  isPublic: boolean;
  memoId: string;
  clientUpdatedAt: Date; // Use Date object here, convert to ISO string for API
  onSave: (payload: { title: string, content: string, isPublic: boolean, clientUpdatedAt: string }) => void;
}

const AUTO_SAVE_DELAY = 1000; // 1 second debounce delay

const useAutoSave = ({ title, content, isPublic, memoId, clientUpdatedAt, onSave }: AutoSaveProps) => {
  // Use a ref to store the debounced save function
  const debouncedSave = useRef(
    debounce((latestData: { title: string, content: string, isPublic: boolean, clientUpdatedAt: string }) => {
      onSave(latestData);
    }, AUTO_SAVE_DELAY)
  ).current; // .current to get the debounced function itself

  // Effect to trigger the debounced save whenever title, content, or isPublic changes
  useEffect(() => {
    // Generate a new timestamp whenever the content changes
    const currentTimestamp = new Date();

    // Prepare the payload with the current state and client timestamp
    const payload = {
      title,
      content,
      isPublic,
      clientUpdatedAt: currentTimestamp.toISOString(), // Convert Date to ISO string for API
    };
    debouncedSave(payload);

    // Cleanup function: Cancel any pending debounced calls when the component unmounts
    return () => {
      debouncedSave.cancel();
    };
  }, [title, content, isPublic, debouncedSave]); // Dependencies for the effect

  // No return value needed for this hook
};

export default useAutoSave;