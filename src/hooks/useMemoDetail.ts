import { useState, useEffect, useCallback } from "react";
import { MemoWithOwnership } from "@/types";
import { usePolling } from "@/components/PollingContext"; // Already created

const useMemoDetail = (memoId: string | null) => {
  const [memo, setMemo] = useState<MemoWithOwnership | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false); // State to track if the memo is being edited
  const { registerTask, unregisterTask, pausePolling, resumePolling } = usePolling();

  const fetchMemo = useCallback(async () => {
    if (!memoId) {
      setMemo(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/memo/${memoId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setMemo(null); // Memo not found
        }
        throw new Error(`Error fetching memo: ${res.status}`);
      }
      const data: MemoWithOwnership = await res.json();
      setMemo(data);
    } catch (err: any) {
      console.error(`Failed to fetch memo ${memoId}:`, err);
      setError(err.message || "Failed to fetch memo");
      setMemo(null); // Clear memo on error
    } finally {
      setIsLoading(false);
    }
  }, [memoId]); // Dependency on memoId

  // Fetch memo when memoId changes
  useEffect(() => {
    fetchMemo();
  }, [fetchMemo]);

  // Polling logic: Register/unregister task based on memoId and ownership
  useEffect(() => {
    const taskId = `fetchMemoDetail-${memoId}`;

    if (memoId && memo && !memo.isOwner && !isEditing) {
      // Only poll if a memo is selected, user is NOT the owner, and NOT editing
      registerTask(taskId, fetchMemo);
    } else {
      // Otherwise, ensure polling is stopped for this memo
      unregisterTask(taskId);
    }

    return () => {
      // Cleanup: Unregister task when memoId changes or component unmounts
      unregisterTask(taskId);
    };
  }, [memoId, memo, isEditing, registerTask, unregisterTask, fetchMemo]); // Dependencies for polling effect

  // Pause/Resume polling based on isEditing state
  useEffect(() => {
    const taskId = `fetchMemoDetail-${memoId}`;
    if (memoId) {
      if (isEditing) {
        pausePolling(taskId);
      } else {
        resumePolling(taskId);
      }
    }
  }, [memoId, isEditing, pausePolling, resumePolling]);


  const refreshMemo = () => {
    fetchMemo();
  };

  return { memo, isLoading, error, refreshMemo, isEditing, setIsEditing };
};

export default useMemoDetail;