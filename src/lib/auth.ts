import { PrismaAdapter } from '@auth/prisma-adapter';
import { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import prisma from './prisma'; // Import the prisma client singleton

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  // Configure session strategy if needed (e.g., "jwt" or "database")
  session: {
    strategy: 'database', // Or 'jwt' if you prefer JWT sessions
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Add callbacks if needed, e.g., to expose user ID in session
  callbacks: {
    async session({ session, user }) {
      // Add user ID to session
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
};