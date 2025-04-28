import { Memo } from '../types/memo'; // Assuming types will be moved

const API_BASE_URL = '/api/memos';

interface ApiError extends Error {
  status?: number;
  statusText?: string;
  message: string;
}

const handleApiResponse = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    let errorMsg = `API Error: ${res.status} ${res.statusText}`;
    let errorData: any = null;
    try {
      errorData = await res.json();
      errorMsg = errorData.message || errorMsg;
    } catch (jsonError) {
      // Ignore if response is not JSON or empty
    }
    const error: ApiError = new Error(errorMsg);
    error.status = res.status;
    error.statusText = res.statusText;
    error.message = errorMsg; // Ensure message is set
    throw error;
  }

  // Handle 204 No Content specifically
  if (res.status === 204) {
      return null as T; // Or handle as appropriate for your delete case
  }

  return res.json() as Promise<T>;
};

export const fetchMemoById = async (id: string): Promise<Memo | null> => {
  const res = await fetch(`${API_BASE_URL}/${id}`);
  if (res.status === 404) {
    return null;
  }
  return handleApiResponse<Memo>(res);
};

export const fetchPublicMemos = async (): Promise<Memo[]> => {
  const res = await fetch(API_BASE_URL);
  return handleApiResponse<Memo[]>(res);
};

export const fetchUserMemos = async (): Promise<Memo[]> => {
  // Assuming the API endpoint handles fetching user-specific memos based on the authenticated session
  const res = await fetch(`${API_BASE_URL}?scope=private`);
  return handleApiResponse<Memo[]>(res);
};

export const createMemoApi = async (title: string, content: string): Promise<Memo> => {
  const res = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content }),
  });
  return handleApiResponse<Memo>(res);
};

export const updateMemoApi = async (id: string, title: string, content: string, isPublic?: boolean): Promise<Memo> => {
  const res = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content, isPublic }),
  });
  return handleApiResponse<Memo>(res);
};

export const deleteMemoApi = async (id: string): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
  });
  // handleApiResponse will throw for non-2xx, but we expect 204 for success
  if (!res.ok && res.status !== 204) {
     await handleApiResponse(res); // This will throw the appropriate error
  }
  // No content expected for 204
};