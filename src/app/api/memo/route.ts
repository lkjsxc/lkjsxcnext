import { NextResponse } from 'next/server';
import { getMemos, createMemo } from '@/features/memo/services/memoService';
import { requireAuth, getAuthenticatedUserId } from '@/app/api/_lib/auth';
import { CreateMemoRequest, GetMemosResponse, CreateMemoResponse, ApiErrorResponse } from '@/types/api';

// GET /api/memo
export async function GET(request: Request): Promise<NextResponse<GetMemosResponse | ApiErrorResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') as 'public' | 'private' | 'all' | null;

    const userId = await getAuthenticatedUserId();

    // Default scope is 'public' if not specified or if user is not authenticated for 'private' or 'all'
    const effectiveScope = (scope === 'private' || scope === 'all') && userId ? scope : 'public';

    const memos = await getMemos(userId ?? undefined, effectiveScope);

    return NextResponse.json({ memos });
  } catch (error) {
    console.error('Error fetching memos:', error);
    return NextResponse.json({ error: { message: 'Failed to fetch memos.' } }, { status: 500 });
  }
}

// POST /api/memo
export async function POST(request: Request): Promise<NextResponse<CreateMemoResponse | ApiErrorResponse>> {
  const session = await requireAuth();
  if (session instanceof NextResponse) {
    return session; // Return unauthorized response
  }

  try {
    const body: CreateMemoRequest = await request.json();
    const { title, content, isPublic } = body;

    if (!title) {
      return NextResponse.json({ error: { message: 'Title is required.' } }, { status: 400 });
    }

    const authorId = session.user.id; // Get authorId from the authenticated session

    const newMemo = await createMemo({ title, content, isPublic }, authorId);

    return NextResponse.json({ memo: newMemo }, { status: 201 });
  } catch (error) {
    console.error('Error creating memo:', error);
    return NextResponse.json({ error: { message: 'Failed to create memo.' } }, { status: 500 });
  }
}