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

const useMemoDetail = (memoId: string | null, ignoreServerUpdates: boolean = false) => {
  // Only fetch if memoId is not null
  const apiUrl = memoId ? `/api/memo/${memoId}` : null;

  const { data, error, isLoading, mutate } = useSWR<GetMemoResponse, ApiErrorResponse>(
    apiUrl,
    fetcher,
    {
      // Disable automatic revalidation when ignoring server updates
      revalidateOnFocus: !ignoreServerUpdates,
      revalidateOnReconnect: !ignoreServerUpdates
    }
  );

  const memo = data?.memo;
  const isOwner = data?.isOwner;

  // Register polling task to refetch memo detail if not owner and not ignoring updates
  usePolling(() => {
    if (memoId && !isOwner && !isLoading && !ignoreServerUpdates) {
      mutate();
    }
  }, [memoId, isOwner, isLoading, mutate, ignoreServerUpdates]);

  return {
    memo,
    isOwner,
    isLoading,
    error,
    refetch: mutate,
  };
};

export { useMemoDetail };