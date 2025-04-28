'use client';

interface SignInPromptProps {
  onSignIn: () => Promise<void>;
}

const SignInPrompt = ({ onSignIn }: SignInPromptProps) => (
  <div className="flex flex-col items-center justify-center h-full text-center p-6">
    <h2 className="text-xl font-semibold mb-4 text-gray-700">My Memos</h2>
    <p className="mb-6 text-gray-600">
      Sign in to create, edit, and manage your personal memos.
    </p>
    <button
      onClick={onSignIn}
      className="px-5 py-2.5 border rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
    >
      Sign In
    </button>
     <p className="mt-4 text-sm text-gray-500">
        (You can still browse public memos on the left)
    </p>
  </div>
);

export default SignInPrompt;