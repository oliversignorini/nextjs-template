/**
 * Shared TypeScript types for the application.
 *
 * Contains navigation types, domain models (trips, destinations, trip tasks),
 * and API response wrappers used across the application.
 */

import type { LucideIcon } from 'lucide-react'

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

/** Navigation item used in header and general navigation */
export interface NavItem {
  label: string
  href: string
  icon?: LucideIcon
  disabled?: boolean
  children?: NavItem[]
}

/** Sidebar navigation item — icon is required for sidebar display */
export interface SidebarNavItem extends NavItem {
  icon: LucideIcon
}

// ---------------------------------------------------------------------------
// API Response Wrappers
// ---------------------------------------------------------------------------

/** Successful API response */
export interface APIResponse<T> {
  success: true
  data: T
}

/** Error API response */
export interface APIError {
  success: false
  error: {
    code: string
    message: string
  }
}

/** Union type for all API responses */
export type APIResult<T> = APIResponse<T> | APIError

// ---------------------------------------------------------------------------
// Trips
// ---------------------------------------------------------------------------

export type TripStatus = 'Dreaming' | 'Planning' | 'Booked' | 'Completed' | 'Cancelled'

export type TripPriority = 'Bucket List' | 'High' | 'Medium' | 'Low'

export interface Trip {
  id: string
  name: string
  description: string
  status: TripStatus
  priority: TripPriority
  budget: number
  startDate: string
  endDate: string | null
  country: string
  continent: string
}

// ---------------------------------------------------------------------------
// Destinations
// ---------------------------------------------------------------------------

export type Season = 'Spring' | 'Summer' | 'Autumn' | 'Winter' | 'Year-round'

export type DestinationType =
  | 'City'
  | 'Beach'
  | 'Mountain'
  | 'Cultural'
  | 'Adventure'
  | 'Island'
  | 'Countryside'

export interface Destination {
  id: string
  name: string
  country: string
  continent: string
  type: DestinationType
  bestSeason: Season
  averageDailyCost: number
  isVisited: boolean
}

// ---------------------------------------------------------------------------
// Trip Tasks
// ---------------------------------------------------------------------------

export type TripTaskStatus = 'To Research' | 'Booking' | 'Confirmed' | 'Done'

export interface TripTask {
  id: string
  title: string
  description: string
  status: TripTaskStatus
  priority: TripPriority
  tripId: string
  assignee: string | null
  dueDate: string | null
  createdAt: string
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface DashboardSummary {
  totalTrips: number
  upcomingTrips: number
  totalBudget: number
  countriesVisited: number
}

// ---------------------------------------------------------------------------
// Auth — Profiles
// ---------------------------------------------------------------------------

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  stripe_customer_id: string | null
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'past_due'
  | 'paused'
  | 'trialing'
  | 'unpaid'

export interface Subscription {
  id: string
  user_id: string
  status: SubscriptionStatus
  price_id: string | null
  quantity: number | null
  cancel_at_period_end: boolean
  current_period_start: string | null
  current_period_end: string | null
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}
