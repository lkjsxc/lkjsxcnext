'use client';

interface DataErrorDisplayProps {
  memoError?: string | null;
  authError?: string | null;
}

const DataErrorDisplay = ({ memoError, authError }: DataErrorDisplayProps) => {
  const errorMessage = memoError || authError;

  if (!errorMessage) return null;

  return (
    <div className="my-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded mx-4">
      <p><strong>Error:</strong> {errorMessage}</p>
      {/* Optional: Add more specific messages based on error type if needed */}
      {/* <p className="text-sm">Details: {memoError ? 'Memo data issue' : 'Authentication issue'}</p> */}
    </div>
  );
};

export default DataErrorDisplay;