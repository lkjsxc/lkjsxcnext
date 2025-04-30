// src/components/PollingContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

// Define the shape of the context value
interface PollingContextType {
  registerTask: (task: () => Promise<void>, key: string) => void;
  unregisterTask: (key: string) => void;
  pausePolling: (key: string) => void;
  resumePolling: (key: string) => void;
}

// Create the context
const PollingContext = createContext<PollingContextType | undefined>(undefined);

// Custom hook to use the PollingContext
export const usePolling = () => {
  const context = useContext(PollingContext);
  if (context === undefined) {
    throw new Error('usePolling must be used within a PollingProvider');
  }
  return context;
};

// Polling Provider component
interface PollingProviderProps {
  children: React.ReactNode;
  interval?: number; // Polling interval in milliseconds (default: 5000ms)
}

export const PollingProvider: React.FC<PollingProviderProps> = ({ children, interval = 5000 }) => {
  // Map to store tasks: key -> task function
  const tasksRef = useRef<Map<string, () => Promise<void>>>(new Map());
  // Set to store keys of paused tasks
  const pausedTasksRef = useRef<Set<string>>(new Set());
  const [tick, setTick] = useState(0); // State to trigger re-renders and task execution

  // Register a task with a unique key
  const registerTask = useCallback((task: () => Promise<void>, key: string) => {
    tasksRef.current.set(key, task);
  }, []);

  // Unregister a task by its key
  const unregisterTask = useCallback((key: string) => {
    tasksRef.current.delete(key);
    pausedTasksRef.current.delete(key); // Also remove from paused if it was there
  }, []);

  // Pause polling for a specific task key
  const pausePolling = useCallback((key: string) => {
    pausedTasksRef.current.add(key);
  }, []);

  // Resume polling for a specific task key
  const resumePolling = useCallback((key: string) => {
    pausedTasksRef.current.delete(key);
  }, []);

  // Effect to run the polling interval
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(prevTick => prevTick + 1);
    }, interval);

    // Cleanup the interval on component unmount
    return () => clearInterval(timer);
  }, [interval]);

  // Effect to execute registered tasks on each tick
  useEffect(() => {
    // Execute tasks that are not paused
    tasksRef.current.forEach(async (task, key) => {
      if (!pausedTasksRef.current.has(key)) {
        try {
          await task();
        } catch (error) {
          console.error(`Error executing polling task for key "${key}":`, error);
        }
      }
    });
  }, [tick]); // Re-run whenever tick changes

  const contextValue = {
    registerTask,
    unregisterTask,
    pausePolling,
    resumePolling,
  };

  return (
    <PollingContext.Provider value={contextValue}>
      {children}
    </PollingContext.Provider>
  );
};