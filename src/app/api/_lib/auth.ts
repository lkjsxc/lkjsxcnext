import { getServerSession, Session } from 'next-auth'; // Import Session
import { authOptions } from '@/lib/auth'; // Assuming authOptions are exported from here
import { NextResponse } from 'next/server';
import { ApiErrorResponse } from '@/types/api'; // Import ApiErrorResponse

/**
 * Helper function to get the server session and enforce authentication.
 * @returns The authenticated user's session, or a NextResponse with an ApiErrorResponse if not authenticated.
 */
export const requireAuth = async (): Promise<Session | NextResponse<ApiErrorResponse>> => {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: { message: 'Authentication required.' } }, {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return session;
};

/**
 * Helper function to get the authenticated user's ID.
 * @returns The authenticated user's ID, or null if not authenticated.
 */
export const getAuthenticatedUserId = async (): Promise<string | null> => {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
};
