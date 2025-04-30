// src/types/index.ts

import { Memo as PrismaMemo, User as PrismaUser } from '@prisma/client';
import { Session, DefaultSession } from 'next-auth';

// Extend the default NextAuth Session type to include user ID
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    } & DefaultSession['user'];
  }

  interface User extends PrismaUser {
    id: string;
  }
}

// Type for the Memo model from Prisma
export type Memo = PrismaMemo;

// Type for a user session with the added user ID
export type UserSession = Session;