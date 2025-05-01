import { PrismaClient, Memo as PrismaMemo } from '@prisma/client';
import prisma from '@/lib/prisma'; // Assuming you have a singleton prisma client
import { Memo } from '@/types/memo';

// Define a type for the return value of getMemoById that includes isOwner
interface GetMemoByIdResult {
  memo: Memo;
  isOwner: boolean;
}

/**
 * Retrieves a list of memos based on the specified scope.
 * @param userId - The ID of the authenticated user (required for 'private' or 'all' scopes).
 * @param scope - The scope of memos to retrieve ('public', 'private', or 'all').
 * @returns A promise that resolves to an array of Memo objects.
 */
export const getMemos = async (userId: string | undefined, scope: 'public' | 'private' | 'all' = 'public'): Promise<Memo[]> => {
  const where: any = {};

  if (scope === 'private' && userId) {
    where.authorId = userId;
  } else if (scope === 'all' && userId) {
    where.OR = [
      { isPublic: true },
      { authorId: userId },
    ];
  } else if (scope === 'public') {
    where.isPublic = true;
  } else {
    // If scope is private or all but no userId is provided, return no private memos
       return [];
  }

  const memos = await prisma.memo.findMany({
    where,
    orderBy: {
      updatedAt: 'desc', // Or createdAt, depending on desired sort
    },
  });

  return memos;
};

/**
 * Retrieves a specific memo by its ID.
 * @param memoId - The ID of the memo to retrieve.
 * @param userId - The ID of the authenticated user (optional, for ownership check).
 * @returns A promise that resolves to an object containing the memo and an isOwner flag, or null if not found/authorized.
 */
export const getMemoById = async (memoId: string, userId: string | undefined): Promise<GetMemoByIdResult | null> => {
  const memo = await prisma.memo.findUnique({
    where: {
      id: memoId,
    },
  });

  if (!memo) {
    return null; // Memo not found
  }

  const isOwner = userId === memo.authorId;

  // If memo is private and user is not the owner, return null (unauthorized)
  if (!memo.isPublic && !isOwner) {
    return null;
  }

  return { memo, isOwner };
};

/**
 * Creates a new memo.
 * @param data - The data for the new memo (title, content, isPublic).
 * @param authorId - The ID of the author.
 * @returns A promise that resolves to the created Memo object.
 */
export const createMemo = async (data: { title: string; content: string | null; isPublic: boolean; }, authorId: string): Promise<Memo> => {
  const newMemo = await prisma.memo.create({
    data: {
      title: data.title,
      content: data.content,
      isPublic: data.isPublic,
      authorId: authorId,
      clientUpdatedAt: new Date(), // Set initial clientUpdatedAt on creation
    },
  });
  return newMemo;
};

/**
 * Updates a specific memo. Includes Optimistic Concurrency Control (OCC).
 * @param memoId - The ID of the memo to update.
 * @param userId - The ID of the authenticated user (for ownership check).
 * @param data - The update data (title, content, isPublic, clientUpdatedAt).
 * @param currentDbTimestamp - The clientUpdatedAt timestamp currently stored in the database for this memo.
 * @returns A promise that resolves to the updated Memo object, or throws an error if update fails (e.g., conflict).
 */
export const updateMemo = async (
  memoId: string,
  userId: string,
  data: { title?: string; content?: string | null; isPublic?: boolean; clientUpdatedAt: Date },
  currentDbTimestamp: Date
): Promise<Memo> => {
  // First, verify ownership
  const existingMemo = await prisma.memo.findUnique({
    where: { id: memoId },
    select: { authorId: true, clientUpdatedAt: true },
  });

  if (!existingMemo || existingMemo.authorId !== userId) {
    throw new Error('Unauthorized or Memo not found'); // Or a more specific error type
  }

  // OCC Check: Compare client's timestamp with the current DB timestamp
  // If the client's timestamp is older than the current DB timestamp, a conflict occurred.
  if (data.clientUpdatedAt.getTime() < currentDbTimestamp.getTime()) {
     throw new Error('Conflict: Memo has been updated by someone else.'); // Or a specific ConflictError
  }

  // Proceed with update if no conflict
  const updatedMemo = await prisma.memo.update({
    where: { id: memoId },
    data: {
      title: data.title,
      content: data.content,
      isPublic: data.isPublic,
      clientUpdatedAt: new Date(), // Update clientUpdatedAt on successful server-side update
    },
  });

  return updatedMemo;
};

/**
 * Deletes a specific memo.
 * @param memoId - The ID of the memo to delete.
 * @param userId - The ID of the authenticated user (for ownership check).
 * @returns A promise that resolves when the memo is deleted, or throws an error if deletion fails.
 */
export const deleteMemo = async (memoId: string, userId: string): Promise<void> => {
  // Verify ownership before deleting
  const existingMemo = await prisma.memo.findUnique({
    where: { id: memoId },
    select: { authorId: true },
  });

  if (!existingMemo || existingMemo.authorId !== userId) {
    throw new Error('Unauthorized or Memo not found'); // Or a more specific error type
  }

  await prisma.memo.delete({
    where: { id: memoId },
  });
};