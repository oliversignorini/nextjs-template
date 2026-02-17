/**
 * Site header with application branding.
 *
 * Client component — reads dummy auth cookie to conditionally show
 * Dashboard or Login in the navigation.
 */

'use client'

import Link from 'next/link'
import { LayoutDashboard } from 'lucide-react'
import { APP_NAME, NAVIGATION_ITEMS } from '@/lib/constants'
import { ThemeToggle } from '@/components/ThemeToggle'
import { MobileNav } from '@/components/layout/MobileNav'
import { hasDummyAuth } from '@/lib/auth'
import { isSupabaseConfigured } from '@/lib/env'
import type { NavItem } from '@/types'

function getNavItems(): NavItem[] {
  // When Supabase is configured, always show all items (Supabase handles auth)
  if (isSupabaseConfigured()) return NAVIGATION_ITEMS

  // When using dummy auth, swap Dashboard for Login if not authenticated
  if (hasDummyAuth()) return NAVIGATION_ITEMS

  return NAVIGATION_ITEMS.map((item) =>
    item.label === 'Dashboard' ? { ...item, label: 'Login', href: '/login' } : item,
  )
}

export function Header() {
  const navItems = getNavItems()

  return (
    <header className="bg-brand-900 text-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <LayoutDashboard className="h-7 w-7" />
          <span className="text-lg font-semibold">{APP_NAME}</span>
        </Link>

        <div className="flex items-center gap-4">
          <nav className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-white/80 transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
          <MobileNav />
        </div>
      </div>
    </header>
  )
}
