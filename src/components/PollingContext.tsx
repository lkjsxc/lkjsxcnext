"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

// Define the shape of the context value
interface PollingContextType {
  registerTask: (id: string, task: () => void) => void;
  unregisterTask: (id: string) => void;
  pausePolling: (id: string) => void;
  resumePolling: (id: string) => void;
}

// Create the context with a default undefined value
const PollingContext = createContext<PollingContextType | undefined>(undefined);

// Polling interval in milliseconds (5 seconds)
const POLLING_INTERVAL = 5000;

export const PollingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Map to store registered tasks: taskId -> task function
  const tasksRef = useRef<Map<string, () => void>>(new Map());
  // Set to store IDs of tasks that have paused polling
  const pausedTasksRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Function to run all registered tasks that are not paused
  const runTasks = useCallback(() => {
    tasksRef.current.forEach((task, id) => {
      if (!pausedTasksRef.current.has(id)) {
        task();
      }
    });
  }, []);

  // Start the polling interval
  useEffect(() => {
    intervalRef.current = setInterval(runTasks, POLLING_INTERVAL);

    // Cleanup function to clear the interval when the component unmounts
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [runTasks]); // Re-run effect if runTasks changes (due to useCallback dependencies)

  // Register a task with a unique ID
  const registerTask = useCallback((id: string, task: () => void) => {
    tasksRef.current.set(id, task);
  }, []);

  // Unregister a task by its ID
  const unregisterTask = useCallback((id: string) => {
    tasksRef.current.delete(id);
    pausedTasksRef.current.delete(id); // Also remove from paused set
  }, []);

  // Pause polling for a specific task ID
  const pausePolling = useCallback((id: string) => {
    pausedTasksRef.current.add(id);
  }, []);

  // Resume polling for a specific task ID
  const resumePolling = useCallback((id: string) => {
    pausedTasksRef.current.delete(id);
  }, []);


  // Provide the context value to children
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

// Custom hook to use the PollingContext
export const usePolling = () => {
  const context = useContext(PollingContext);
  if (context === undefined) {
    throw new Error('usePolling must be used within a PollingProvider');
  }
  return context;
};