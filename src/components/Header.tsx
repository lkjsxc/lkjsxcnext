import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import AuthButtons from "./AuthButtons"; // Will create this component

const Header = () => {
  const { data: session, status } = useSession();

  return (
    <header className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center">
      <div className="text-xl font-bold">
        <Link href="/">lkjsxcnext</Link>
      </div>
      <nav>
        <AuthButtons />
      </nav>
    </header>
  );
};

export default Header;