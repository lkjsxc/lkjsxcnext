"use client";

import { useState } from "react";
import Header from "@/components/Header"; // Will create this component
import Explorer from "@/components/Explorer"; // Will create this component
import MainWindow from "@/components/MainWindow"; // Will create this component

export default function Home() {
  const [selectedMemoId, setSelectedMemoId] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* Explorer Sidebar */}
        <div className="w-64 bg-gray-100 border-r overflow-y-auto">
          <Explorer onSelectMemo={setSelectedMemoId} selectedMemoId={selectedMemoId} />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          <MainWindow selectedMemoId={selectedMemoId} onMemoDeleted={() => setSelectedMemoId(null)} />
        </div>
      </div>
    </div>
  );
}