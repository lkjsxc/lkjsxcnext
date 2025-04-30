import { useState, useEffect, useCallback } from "react";
import { Memo } from "@/types";
import { usePolling } from "@/components/PollingContext"; // Will integrate with polling later

const useMemos = (scope: "public" | "private" | "all") => {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { registerTask, unregisterTask } = usePolling(); // Use polling context

  const fetchMemos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/memo?scope=${scope}`);
      if (!res.ok) {
        throw new Error(`Error fetching memos: ${res.status}`);
      }
      const data: Memo[] = await res.json();
      setMemos(data);
    } catch (err: any) {
      console.error("Failed to fetch memos:", err);
      setError(err.message || "Failed to fetch memos");
    } finally {
      setIsLoading(false);
    }
  }, [scope]); // Dependency on scope

  // Initial fetch and refetch when scope changes
  useEffect(() => {
    fetchMemos();
  }, [fetchMemos]);

  // Register fetchMemos with polling context
  useEffect(() => {
    const taskId = `fetchMemos-${scope}`;
    registerTask(taskId, fetchMemos);

    return () => {
      unregisterTask(taskId);
    };
  }, [scope, fetchMemos, registerTask, unregisterTask]); // Dependencies for effect

  const refreshMemos = () => {
    fetchMemos();
  };

  return { memos, isLoading, error, refreshMemos };
};

export default useMemos;