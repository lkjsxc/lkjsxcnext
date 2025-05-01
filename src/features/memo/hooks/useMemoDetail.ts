'use client';

import useSWR from 'swr';
import { GetMemoResponse, ApiErrorResponse } from '@/types/api';
import { usePolling } from '@/features/polling/hooks/usePolling'; // Import usePolling

// Define a fetcher function for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error.message || 'Failed to fetch data');
  }
  return res.json();
};

const useMemoDetail = (memoId: string | null) => {
  // Only fetch if memoId is not null
  const apiUrl = memoId ? `/api/memo/${memoId}` : null;

  const { data, error, isLoading, mutate } = useSWR<GetMemoResponse, ApiErrorResponse>(apiUrl, fetcher);

  const memo = data?.memo;
  const isOwner = data?.isOwner;

  // Register polling task to refetch memo detail if not the owner
  // Polling is also implicitly paused if memoId is null (apiUrl is null)
  usePolling(() => {
    if (memoId && !isOwner && !isLoading) { // Only poll if memo exists, user is not owner, and not currently loading
      mutate(); // Trigger SWR revalidation
    }
  }, [memoId, isOwner, isLoading, mutate]); // Dependencies

  return {
    memo,
    isOwner,
    isLoading,
    error,
    refetch: mutate, // Expose mutate as refetch
  };
};

export { useMemoDetail };