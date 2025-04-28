'use client';

interface DataErrorDisplayProps {
  memoError: string | null;
}

const DataErrorDisplay = ({ memoError }: DataErrorDisplayProps) => {
  if (!memoError) return null;

  return (
    <div className="my-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded mx-4">
      <p><strong>Data Error:</strong> {memoError}</p>
      <p className="text-sm">Could not load memo data. Please try again later.</p>
    </div>
  );
};

export default DataErrorDisplay;