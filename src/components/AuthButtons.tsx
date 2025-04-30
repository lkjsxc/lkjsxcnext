"use client";

import { signIn, signOut, useSession } from "next-auth/react";

const AuthButtons = () => {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>; // Or a spinner component
  }

  if (session) {
    return (
      <button
        onClick={() => signOut()}
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
      >
        Sign Out ({session.user?.name || session.user?.email})
      </button>
    );
  }

  return (
    <button
      onClick={() => signIn("google")}
      className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
    >
      Sign In with Google
    </button>
  );
};

export default AuthButtons;