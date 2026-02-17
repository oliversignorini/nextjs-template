/**
 * Theme provider wrapping next-themes for dark mode support.
 *
 * Configures class-based theme toggling with system preference detection.
 * Consumed in the root layout to provide theme context to all pages.
 */

'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemesProvider>
  )
}
