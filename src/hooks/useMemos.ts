import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Memo, LoadingStates } from '../types/memo';
import { fetchPublicMemos, fetchUserMemos, createMemoApi, updateMemoApi, deleteMemoApi } from '../utils/memoApi';
import { initializeMemoWebSocket, subscribeToMemoMessages, unsubscribeFromMemoMessages } from '../utils/memoWebSocket'; // Import the refactored WebSocket functions

interface UseMemosResult {
  memos: Memo[];
  loading: LoadingStates;
  error: string | null;
  createMemo: (title: string, content: string, isPublic?: boolean) => Promise<void>;
  updateMemo: (id: string, title: string, content: string, isPublic?: boolean) => Promise<void>;
  deleteMemo: (id: string) => Promise<void>;
  fetchMemos: () => Promise<void>;
}

export const useMemos = (isPublicView: boolean): UseMemosResult => {
  const { status } = useSession();
  const [memos, setMemos] = useState<Memo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<LoadingStates>({
    fetching: false,
    creating: false,
    updating: null,
    deleting: null,
  });

  const handleApiCall = useCallback(async (apiCall: () => Promise<any>, loadingKey: keyof LoadingStates, successCallback: (data: any) => void, id?: string) => {
    setLoading((prev: LoadingStates) => ({ ...prev, [loadingKey]: id || true }));
    setError(null);
    const data = await apiCall();
    successCallback(data);
    setLoading((prev: LoadingStates) => ({ ...prev, [loadingKey]: id ? null : false }));
  }, []);

  const fetchMemos = useCallback(async () => {
    const apiCall = isPublicView ? fetchPublicMemos : fetchUserMemos;
    handleApiCall(apiCall, 'fetching', setMemos);
  }, [status, handleApiCall, isPublicView]);

  useEffect(() => {
    if (status === 'authenticated' || isPublicView) {
      fetchMemos();
    } else if (status === 'unauthenticated' && !isPublicView) {
      setMemos([]);
      setError(null);
      setLoading({ fetching: false, creating: false, updating: null, deleting: null });
    }
  }, [status, fetchMemos, isPublicView]);

  // WebSocket integration
  useEffect(() => {
    // Initialize the shared WebSocket connection if it hasn't been already
    // This is safe to call multiple times; the manager handles the single connection.
    initializeMemoWebSocket();

    const handleMemoMessage = (data: any) => {
      console.log('Received memo WebSocket message:', data);
      // Update memos state based on the message type
      switch (data.type) {
        case 'memo_created':
          // Add the new memo to the beginning of the list
          setMemos(prevMemos => [data.payload, ...prevMemos]);
          break;
        case 'memo_updated':
          // Replace the updated memo in the list
          setMemos(prevMemos => prevMemos.map(memo => (memo.id === data.payload.id ? data.payload : memo)));
          break;
        case 'memo_deleted':
          // Remove the deleted memo from the list
          setMemos(prevMemos => prevMemos.filter(memo => memo.id !== data.payload.id));
          break;
        default:
          console.warn('Unknown memo WebSocket message type:', data.type);
      }
    };

    // Subscribe to memo-specific messages
    subscribeToMemoMessages(handleMemoMessage);

    // Clean up the subscription when the component unmounts
    return () => {
      console.log('useMemos useEffect cleanup: Unsubscribing from memo messages');
      unsubscribeFromMemoMessages(handleMemoMessage);
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount and cleans up on unmount

  const createMemo = async (title: string, content: string) => {
    if (!title.trim()) {
        setError("Memo title cannot be empty.");
        return;
    }
    await handleApiCall(() => createMemoApi(title, content), 'creating', (newMemo: Memo) => {
      // The WebSocket will broadcast the new memo, so we don't update state here directly
      console.log("Memo created via API, waiting for WebSocket broadcast.");
    });
  };

  const updateMemo = async (id: string, title: string, content: string, isPublic?: boolean) => {
     if (!title.trim()) {
        setError("Memo title cannot be empty.");
        return;
     }
     await handleApiCall(() => updateMemoApi(id, title, content, isPublic), 'updating', (updatedMemo: Memo) => {
       // The WebSocket will broadcast the updated memo, so we don't update state here directly
       console.log("Memo updated via API, waiting for WebSocket broadcast.");
     }, id);
  };

  const deleteMemo = async (id: string) => {
    await handleApiCall(() => deleteMemoApi(id), 'deleting', () => {
      // The WebSocket will broadcast the deleted memo ID, so we don't update state here directly
      console.log("Memo deleted via API, waiting for WebSocket broadcast.");
    }, id);
  };

  return {
    memos,
    loading,
    error,
    createMemo,
    updateMemo,
    deleteMemo,
    fetchMemos,
  };
};