/**
 * Application-wide constants for navigation, branding, and footer links.
 *
 * All navigation is driven by these arrays — components iterate over them
 * rather than hardcoding routes. This keeps route changes centralised.
 */

import { Home, BookOpen, LayoutDashboard, Plane, MapPin, Settings } from 'lucide-react'
import type { NavItem, SidebarNavItem } from '@/types'

/** Display name shown in the Header and page metadata. */
export const APP_NAME = 'App Template'

/** Top-level navigation items rendered in the Header. */
export const NAVIGATION_ITEMS: NavItem[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Guide', href: '/guide', icon: BookOpen },
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
]

/** Sidebar navigation items rendered in the dashboard Sidebar. */
export const SIDEBAR_ITEMS: SidebarNavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Trips', href: '/dashboard/trips', icon: Plane },
  { label: 'Destinations', href: '/dashboard/destinations', icon: MapPin },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

/** Links rendered in the Footer. */
export const FOOTER_LINKS = [
  { label: 'Guide', href: '/guide' },
  { label: 'Dashboard', href: '/dashboard' },
]
