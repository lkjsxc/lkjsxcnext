"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import useMemos from "@/hooks/useMemos"; // Will create this hook
import { Memo } from "@/types";
import Spinner from "./Spinner"; // Will create this component

interface ExplorerProps {
  onSelectMemo: (id: string | null) => void;
  selectedMemoId: string | null;
}

const Explorer: React.FC<ExplorerProps> = ({ onSelectMemo, selectedMemoId }) => {
  const { data: session } = useSession();
  const [scope, setScope] = useState<"public" | "private" | "all">(session ? "all" : "public");
  const { memos, isLoading, error, refreshMemos } = useMemos(scope);

  // Update scope when session changes
  useEffect(() => {
    setScope(session ? "all" : "public");
  }, [session]);

  const handleCreateNewMemo = async () => {
    if (!session) {
      alert("Please sign in to create a new memo.");
      return;
    }
    try {
      const res = await fetch("/api/memo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: "New Memo", content: "", isPublic: false }),
      });

      if (!res.ok) {
        throw new Error(`Error creating memo: ${res.status}`);
      }

      const newMemo: Memo = await res.json();
      refreshMemos(); // Refresh the list after creating
      onSelectMemo(newMemo.id); // Select the new memo

    } catch (err) {
      console.error("Failed to create new memo:", err);
      alert("Failed to create new memo.");
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Memos</h2>

      {session && (
        <div className="mb-4">
          <label htmlFor="scope-select" className="block text-sm font-medium text-gray-700">
            View:
          </label>
          <select
            id="scope-select"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={scope}
            onChange={(e) => setScope(e.target.value as "public" | "private" | "all")}
          >
            <option value="public">Public</option>
            <option value="private">My Private</option>
            <option value="all">All (Public + My Private)</option>
          </select>
        </div>
      )}

      {session && (
        <button
          onClick={handleCreateNewMemo}
          className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
        >
          + New Memo
        </button>
      )}


      {isLoading && <Spinner />}
      {error && <div className="text-red-500">Error loading memos.</div>}

      {!isLoading && memos && memos.length === 0 && (
        <div className="text-gray-500">No memos found.</div>
      )}

      <ul className="space-y-2">
        {memos && memos.map((memo: Memo) => (
          <li
            key={memo.id}
            className={`cursor-pointer p-2 rounded ${selectedMemoId === memo.id ? 'bg-blue-200' : 'hover:bg-gray-200'}`}
            onClick={() => onSelectMemo(memo.id)}
          >
            <div className="font-medium truncate">{memo.title || "Untitled Memo"}</div>
            <div className="text-sm text-gray-500 truncate">
              {memo.isPublic ? "Public" : "Private"}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Explorer;