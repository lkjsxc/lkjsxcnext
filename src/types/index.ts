import { Memo as PrismaMemo, User as PrismaUser } from '@prisma/client';

// Extend the default Memo type from Prisma if needed, or just re-export
export type Memo = PrismaMemo;

// Extend the default User type from Prisma if needed, or just re-export
export type User = PrismaUser;

// Define a type for a memo with ownership information (used in GET /api/memo/[id])
export type MemoWithOwnership = Memo & {
  isOwner: boolean;
  author: User; // Include the author relation
};

// Define a type for the session user, including the id
import { Session } from 'next-auth';

export type SessionUser = Session['user'] & {
  id: string;
};

export type ExtendedSession = Session & {
  user: SessionUser;
};