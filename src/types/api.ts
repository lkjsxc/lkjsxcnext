import { Memo } from './memo';

// --- Memo API Types ---

// GET /api/memo
export interface GetMemosResponse {
  memos: Memo[];
}

// POST /api/memo
export interface CreateMemoRequest {
  title: string;
  content: string | null;
  isPublic: boolean;
}

export interface CreateMemoResponse {
  memo: Memo;
}

// GET /api/memo/[id]
export interface GetMemoResponse {
  memo: Memo;
  isOwner: boolean;
}

// PUT /api/memo/[id]
export interface UpdateMemoRequest {
  title?: string;
  content?: string | null;
  isPublic?: boolean;
  clientUpdatedAt: string; // ISO Date string
}

export interface UpdateMemoResponse {
  memo: Memo; // Return the updated memo, potentially with new clientUpdatedAt from server
}

// DELETE /api/memo/[id]
// No specific request body needed
export interface DeleteMemoResponse {
  success: boolean; // Or just rely on 204 status
}

// --- Generic API Error Type ---
export interface ApiErrorResponse {
  error: {
    message: string;
    code?: string; // Optional error code
  };
}