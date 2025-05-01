'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { POLLING_INTERVAL } from '@/lib/constants'; // Assuming constants file exists

interface PollingTask {
  task: () => void;
  enabled: boolean; // Flag to enable/disable the task
}

interface PollingContextType {
  registerPollingTask: (task: () => void, key?: string) => string; // Optional key for identification
  unregisterPollingTask: (taskId: string) => void;
  enablePollingTask: (taskId: string) => void;
  disablePollingTask: (taskId: string) => void;
  enablePollingTaskByKey: (key: string) => void; // Enable by key
  disablePollingTaskByKey: (key: string) => void; // Disable by key
}

const PollingContext = createContext<PollingContextType | undefined>(undefined);

export const PollingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Store tasks by a generated ID, and optionally by a provided key
  const tasksRef = useRef<{ [taskId: string]: PollingTask }>({});
  const taskKeysRef = useRef<{ [key: string]: string }>({}); // Map keys to task IDs
  const taskIdCounter = useRef(0);

  const registerPollingTask = useCallback((task: () => void, key?: string) => {
    const taskId = `task-${taskIdCounter.current++}`;
    tasksRef.current[taskId] = { task, enabled: true };
    if (key) {
      taskKeysRef.current[key] = taskId; // Store mapping from key to ID
    }
    return taskId;
  }, []);

  const unregisterPollingTask = useCallback((taskId: string) => {
    // Find and remove the key mapping if it exists
    const keyToRemove = Object.keys(taskKeysRef.current).find(key => taskKeysRef.current[key] === taskId);
    if (keyToRemove) {
      delete taskKeysRef.current[keyToRemove];
    }
    delete tasksRef.current[taskId];
  }, []);

  const enablePollingTask = useCallback((taskId: string) => {
    if (tasksRef.current[taskId]) {
      tasksRef.current[taskId].enabled = true;
    }
  }, []);

  const disablePollingTask = useCallback((taskId: string) => {
    if (tasksRef.current[taskId]) {
      tasksRef.current[taskId].enabled = false;
    }
  }, []);

  const enablePollingTaskByKey = useCallback((key: string) => {
    const taskId = taskKeysRef.current[key];
    if (taskId && tasksRef.current[taskId]) {
      tasksRef.current[taskId].enabled = true;
    }
  }, []);

  const disablePollingTaskByKey = useCallback((key: string) => {
    const taskId = taskKeysRef.current[key];
    if (taskId && tasksRef.current[taskId]) {
      tasksRef.current[taskId].enabled = false;
    }
  }, []);


  useEffect(() => {
    const intervalId = setInterval(() => {
      // Execute only enabled tasks on each tick
      Object.values(tasksRef.current).forEach(({ task, enabled }) => {
        if (enabled) {
          try {
            task();
          } catch (error) {
            console.error('Error executing polling task:', error);
          }
        }
      });
    }, POLLING_INTERVAL); // Use the constant for interval

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  return (
    <PollingContext.Provider value={{
      registerPollingTask,
      unregisterPollingTask,
      enablePollingTask,
      disablePollingTask,
      enablePollingTaskByKey,
      disablePollingTaskByKey,
    }}>
      {children}
    </PollingContext.Provider>
  );
};

export const usePollingContext = () => {
  const context = useContext(PollingContext);
  if (context === undefined) {
    throw new Error('usePollingContext must be used within a PollingProvider');
  }
  return context;
};