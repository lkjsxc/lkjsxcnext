'use client';

import { useEffect } from 'react';
import { usePollingContext } from '../context/PollingContext';

const usePolling = (task: () => void, dependencies: React.DependencyList = [], key?: string) => { // Accept optional key
  const { registerPollingTask, unregisterPollingTask, enablePollingTask, disablePollingTask } = usePollingContext();

  useEffect(() => {
    // Register the task when the component mounts or dependencies change
    // Pass the key if provided
    const taskId = registerPollingTask(task, key);

    // Unregister the task when the component unmounts or dependencies change
    return () => {
      unregisterPollingTask(taskId);
    };
  }, [task, registerPollingTask, unregisterPollingTask, key, ...dependencies]); // Include key in dependencies

  // Expose enable/disable functions if a key was provided
  const enable = key ? () => enablePollingTask(key) : undefined;
  const disable = key ? () => disablePollingTask(key) : undefined;

  return { enable, disable }; // Return enable/disable functions
};

export { usePolling };