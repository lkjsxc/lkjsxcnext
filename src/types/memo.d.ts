export interface Memo {
  id: string;
  title: string;
  content: string | null;
}

export interface LoadingStates {
  fetching: boolean;
  creating: boolean;
  updating: string | null;
  deleting: string | null;
}