import { Memo as PrismaMemo } from '@prisma/client';

// Extend the Prisma Memo type if needed, or define a new one for client-side use
// For now, we can use the Prisma type directly or define a simple interface
export interface Memo extends PrismaMemo {
  // Add any client-specific fields here if necessary
  // e.g., isSelected?: boolean;
}

// Type for memo data used in forms or updates
export interface MemoFormData {
  title: string;
  content: string | null;
  isPublic: boolean;
}