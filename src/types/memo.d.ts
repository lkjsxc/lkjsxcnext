export interface Memo {
  id: string;
  title: string;
  content: string | null;
  isPublic: boolean;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoadingStates {
  fetching: boolean;
  creating: boolean;
  updating: string | null;
  deleting: string | null;
}