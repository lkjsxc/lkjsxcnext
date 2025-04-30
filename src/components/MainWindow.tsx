"use client";

import { useSession } from "next-auth/react";
import useMemoDetail from "@/hooks/useMemoDetail"; // Will create this hook
import MemoViewer from "./MemoViewer"; // Will create this component
import MemoEditor from "./MemoEditor"; // Will create this component
import Spinner from "./Spinner"; // Already created

interface MainWindowProps {
  selectedMemoId: string | null;
  onMemoDeleted: () => void;
}

const MainWindow: React.FC<MainWindowProps> = ({ selectedMemoId, onMemoDeleted }) => {
  const { data: session } = useSession();
  const { memo, isLoading, error, refreshMemo } = useMemoDetail(selectedMemoId);

  if (!selectedMemoId) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Select a memo from the sidebar or create a new one.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        Error loading memo: {error}
      </div>
    );
  }

  if (!memo) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Memo not found.
      </div>
    );
  }

  // Determine if the current user is the owner
  // We rely on the `isOwner` flag provided by the API for accuracy
  const isOwner = memo.isOwner;

  return (
    <div className="h-full p-4">
      {isOwner ? (
        <MemoEditor memo={memo} onMemoUpdated={refreshMemo} onMemoDeleted={onMemoDeleted} />
      ) : (
        <MemoViewer memo={memo} />
      )}
    </div>
  );
};

export default MainWindow;