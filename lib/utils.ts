/**
 * Utility functions shared across the application.
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge class names with Tailwind-aware conflict resolution.
 * Combines clsx (conditional classes) with tailwind-merge (deduplication).
 * @param inputs - Class values (strings, arrays, objects, or conditionals).
 * @returns Merged class string with Tailwind conflicts resolved.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
