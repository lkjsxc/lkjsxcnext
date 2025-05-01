'use client';

import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { GetMemosResponse, ApiErrorResponse } from '@/types/api';
import { Memo } from '@/types/memo';
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

interface UseMemosListOptions {
  scope?: 'public' | 'private' | 'all';
}

const useMemosList = (options?: UseMemosListOptions) => {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const scope = options?.scope || 'public';

  // Determine the API URL based on scope and authentication status
  const apiUrl = userId && (scope === 'private' || scope === 'all')
    ? `/api/memo?scope=${scope}`
    : '/api/memo?scope=public'; // Default to public if not authenticated or scope is public

  const { data, error, isLoading, mutate } = useSWR<GetMemosResponse, ApiErrorResponse>(apiUrl, fetcher);

  // Register polling task to refetch memos
  usePolling(() => {
    // Only refetch if not currently loading to avoid race conditions
    if (!isLoading) {
      mutate(); // Trigger SWR revalidation
    }
  }, [isLoading, mutate]); // Dependencies: refetch when loading state or mutate function changes

  return {
    memos: data?.memos || [],
    isLoading,
    error,
    refetch: mutate, // Expose mutate as refetch
  };
};

export { useMemosList };