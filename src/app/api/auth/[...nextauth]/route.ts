import NextAuth, { Account, Profile, User } from "next-auth"; // Import types
import { AdapterUser } from "next-auth/adapters"; // Import AdapterUser
import GoogleProvider, { GoogleProfile } from "next-auth/providers/google"; // Import GoogleProfile
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, email }: { user: User | AdapterUser; account: Account | null; profile?: Profile | GoogleProfile | undefined; email?: { verificationRequest?: boolean | undefined; } | undefined }) {
      // You can add custom logic here if needed, e.g., check if user is allowed to sign in
      // For now, just return true to allow sign in
      return true;
    },
    async session({ session, user }: { session: any, user: any }) {
      // Add user ID to session
      session.user.id = user.id;
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin', // You can define a custom sign-in page
    error: '/auth/error', // Error code passed in query string as ?error=
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };