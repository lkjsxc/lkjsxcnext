// src/lib/utils.ts

/**
 * Formats a Date object into a readable string.
 * @param date The Date object to format.
 * @returns A formatted date string.
 */
export function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };
  return new Date(date).toLocaleString(undefined, options);
}

// Add other utility functions here as needed