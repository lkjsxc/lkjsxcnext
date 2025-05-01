import { NextResponse } from 'next/server';
import { getMemoById, updateMemo, deleteMemo } from '@/features/memo/services/memoService';
import { requireAuth, getAuthenticatedUserId } from '@/app/api/_lib/auth';
import { GetMemoResponse, UpdateMemoRequest, UpdateMemoResponse, DeleteMemoResponse, ApiErrorResponse } from '@/types/api';

// GET /api/memo/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<GetMemoResponse | ApiErrorResponse>> {
  try {
    const memoId = params.id;
    const userId = await getAuthenticatedUserId();

    const result = await getMemoById(memoId, userId ?? undefined);

    if (!result) {
      // getMemoById returns null if not found or unauthorized
      return NextResponse.json({ error: { message: 'Memo not found or unauthorized.' } }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error(`Error fetching memo ${params.id}:`, error);
    return NextResponse.json({ error: { message: 'Failed to fetch memo.' } }, { status: 500 });
  }
}

// PUT /api/memo/[id]
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<UpdateMemoResponse | ApiErrorResponse>> {
  const session = await requireAuth();
  if (session instanceof NextResponse) {
    return session; // Return unauthorized response
  }

  try {
    const memoId = params.id;
    const userId = session.user.id;
    const body: UpdateMemoRequest = await request.json();
    const { clientUpdatedAt, ...updateData } = body;

    if (!clientUpdatedAt) {
       return NextResponse.json({ error: { message: 'clientUpdatedAt is required for updates.' } }, { status: 400 });
    }

    // Fetch the current memo to get the latest clientUpdatedAt from the DB
    const existingMemo = await getMemoById(memoId, userId); // Use the service to also check ownership

    if (!existingMemo || !existingMemo.isOwner) {
         return NextResponse.json({ error: { message: 'Memo not found or unauthorized to update.' } }, { status: 404 });
    }

    // Pass the current DB timestamp to the service for OCC check
    const currentDbTimestamp = existingMemo.memo.clientUpdatedAt;

    const updatedMemo = await updateMemo(memoId, userId, {
      ...updateData,
      clientUpdatedAt: new Date(clientUpdatedAt), // Convert ISO string back to Date
    }, currentDbTimestamp);

    return NextResponse.json({ memo: updatedMemo });
  } catch (error: any) {
    console.error(`Error updating memo ${params.id}:`, error);
    if (error.message.includes('Conflict')) {
       return NextResponse.json({ error: { message: error.message } }, { status: 409 });
    }
    return NextResponse.json({ error: { message: 'Failed to update memo.' } }, { status: 500 });
  }
}

// DELETE /api/memo/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<DeleteMemoResponse | ApiErrorResponse>> {
  const session = await requireAuth();
  if (session instanceof NextResponse) {
    return session; // Return unauthorized response
  }

  try {
    const memoId = params.id;
    const userId = session.user.id;

    await deleteMemo(memoId, userId);

    return NextResponse.json({ success: true }, { status: 200 }); // Or 204 No Content
  } catch (error: any) {
    console.error(`Error deleting memo ${params.id}:`, error);
     if (error.message.includes('Unauthorized')) {
       return NextResponse.json({ error: { message: error.message } }, { status: 403 });
    }
    return NextResponse.json({ error: { message: 'Failed to delete memo.' } }, { status: 500 });
  }
}