import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Memo } from '@/types/memo'; // Assuming Memo type is defined here

interface PollingState {
  memoListPollingActive: boolean;
  activeMemoPollingId: string | null;
  memoListData: Memo[];
  memoDetailsData: { [memoId: string]: Memo };
  startMemoListPolling: () => void;
  stopMemoListPolling: () => void;
  startMemoPolling: (memoId: string) => void;
  stopMemoPolling: () => void; // Modified to stop any active memo polling
  getMemoListData: () => Memo[];
  getMemoDetailsData: (memoId: string) => Memo | undefined;
}

const PollingContext = createContext<PollingState | undefined>(undefined);

interface PollingProviderProps {
  children: ReactNode;
}

const POLLING_INTERVAL = 5000; // 5 seconds

export const PollingProvider: React.FC<PollingProviderProps> = ({ children }) => {
  const [memoListPollingActive, setMemoListPollingActive] = useState(false);
  const [activeMemoPollingId, setActiveMemoPollingId] = useState<string | null>(null);
  const [memoListData, setMemoListData] = useState<Memo[]>([]);
  const [memoDetailsData, setMemoDetailsData] = useState<{ [memoId: string]: Memo }>({});

  // Polling for memo list
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (memoListPollingActive) {
      const fetchMemoList = async () => {
        try {
          console.log('Polling memo list...');
          const res = await fetch('/api/memo');
          if (!res.ok) {
            throw new Error(`Error fetching memo list: ${res.statusText}`);
          }
          const data = await res.json();
          setMemoListData(data);
        } catch (error) {
          console.error('Error polling memo list:', error);
        }
      };
      fetchMemoList(); // Initial fetch
      intervalId = setInterval(fetchMemoList, POLLING_INTERVAL);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [memoListPollingActive]);

  // Polling for specific memo details
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (activeMemoPollingId) {
      const fetchMemoDetails = async (memoId: string) => {
        try {
          console.log(`Polling memo details for ID: ${memoId}...`);
          const res = await fetch(`/api/memo/${memoId}`);
           if (!res.ok) {
            throw new Error(`Error fetching memo details for ${memoId}: ${res.statusText}`);
          }
          const data = await res.json();
          setMemoDetailsData(prev => ({ ...prev, [memoId]: data }));
        } catch (error) {
          console.error(`Error polling memo details for ID ${memoId}:`, error);
        }
      };
      fetchMemoDetails(activeMemoPollingId); // Initial fetch
      intervalId = setInterval(() => fetchMemoDetails(activeMemoPollingId!), POLLING_INTERVAL);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [activeMemoPollingId]);

  const startMemoListPolling = () => setMemoListPollingActive(true);
  const stopMemoListPolling = () => setMemoListPollingActive(false);
  const startMemoPolling = (memoId: string) => setActiveMemoPollingId(memoId);
  const stopMemoPolling = () => setActiveMemoPollingId(null); // Modified
  const getMemoListData = () => memoListData;
  const getMemoDetailsData = (memoId: string) => memoDetailsData[memoId];

  return (
    <PollingContext.Provider
      value={{
        memoListPollingActive,
        activeMemoPollingId,
        memoListData,
        memoDetailsData,
        startMemoListPolling,
        stopMemoListPolling,
        startMemoPolling,
        stopMemoPolling,
        getMemoListData,
        getMemoDetailsData,
      }}
    >
      {children}
    </PollingContext.Provider>
  );
};

export const usePolling = () => {
  const context = useContext(PollingContext);
  if (context === undefined) {
    throw new Error('usePolling must be used within a PollingProvider');
  }
  return context;
};