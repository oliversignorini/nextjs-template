/**
 * Simplified site footer with brand and navigation links.
 *
 * Single row layout with brand icon/name, navigation links, and copyright.
 */

import Link from 'next/link'
import { LayoutDashboard } from 'lucide-react'
import { APP_NAME, FOOTER_LINKS } from '@/lib/constants'

export function Footer() {
  return (
    <footer className="bg-muted text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" />
            <span className="font-semibold">{APP_NAME}</span>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-6">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Copyright */}
        <div className="mt-4 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} {APP_NAME}. Built with Next.js.
        </div>
      </div>
    </footer>
  )
}
