/**
 * Root layout — wraps every page in the application.
 *
 * Provides the ThemeProvider (dark mode), QueryProvider (React Query),
 * and the global Header/Footer shell. Uses Open Sans via next/font.
 */

import type { Metadata } from 'next'
import { Open_Sans } from 'next/font/google'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const openSans = Open_Sans({ subsets: ['latin'], weight: ['300', '400', '600', '700'] })

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  title: {
    default: 'App Template',
    template: '%s | App Template',
  },
  description: 'Internal application template',
  metadataBase: new URL(appUrl),
  robots: { index: false, follow: false },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'App Template',
  },
  twitter: {
    card: 'summary_large_image',
  },
  alternates: {
    canonical: appUrl,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={openSans.className}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand-900 focus:px-4 focus:py-2 focus:text-white focus:outline-none"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <QueryProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main id="main-content" className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
          </QueryProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
