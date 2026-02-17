'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { NAVIGATION_ITEMS } from '@/lib/constants'
import { hasDummyAuth } from '@/lib/auth'
import { isSupabaseConfigured } from '@/lib/env'
import { cn } from '@/lib/utils'
import type { NavItem } from '@/types'

function getNavItems(): NavItem[] {
  if (isSupabaseConfigured()) return NAVIGATION_ITEMS
  if (hasDummyAuth()) return NAVIGATION_ITEMS
  return NAVIGATION_ITEMS.map((item) =>
    item.label === 'Dashboard' ? { ...item, label: 'Login', href: '/login' } : item,
  )
}

export function MobileNav() {
  const pathname = usePathname()
  const navItems = getNavItems()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-white md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-2">
          {navItems.map((item) => (
            <SheetClose asChild key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent',
                  pathname === item.href
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground',
                )}
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                {item.label}
              </Link>
            </SheetClose>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
