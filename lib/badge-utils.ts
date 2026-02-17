/**
 * Pure utility functions for badge styling and formatting.
 *
 * Extracted from component files so they can be tested in isolation
 * and shared across multiple components without duplication.
 */

import type { TripStatus, TripPriority, DestinationType } from '@/types'

/**
 * Returns Tailwind classes for a trip status badge.
 */
export function tripStatusBadgeClass(status: TripStatus): string {
  switch (status) {
    case 'Dreaming':
      return 'border-transparent bg-brand-400/20 text-brand-700'
    case 'Planning':
      return 'border-transparent bg-amber-100 text-amber-600'
    case 'Booked':
      return 'border-transparent bg-emerald-100 text-emerald-600'
    case 'Completed':
      return 'border-transparent bg-brand-grey-300 text-brand-grey-600'
    case 'Cancelled':
      return 'border-transparent bg-destructive/10 text-destructive'
  }
}

/**
 * Returns Tailwind classes for a trip priority badge.
 */
export function tripPriorityBadgeClass(priority: TripPriority): string {
  switch (priority) {
    case 'Bucket List':
      return 'border-transparent bg-purple-100 text-purple-600'
    case 'High':
      return 'border-transparent bg-destructive/10 text-destructive'
    case 'Medium':
      return 'border-transparent bg-amber-600/10 text-amber-600'
    case 'Low':
      return 'border-transparent bg-brand-grey-300/50 text-brand-grey-600'
  }
}

/**
 * Returns Tailwind classes for a destination type badge.
 */
export function destinationTypeBadgeClass(type: DestinationType): string {
  switch (type) {
    case 'City':
      return 'border-transparent bg-brand-400/20 text-brand-700'
    case 'Beach':
      return 'border-transparent bg-cyan-100 text-cyan-600'
    case 'Mountain':
      return 'border-transparent bg-emerald-100 text-emerald-600'
    case 'Cultural':
      return 'border-transparent bg-purple-100 text-purple-600'
    case 'Adventure':
      return 'border-transparent bg-amber-100 text-amber-600'
    case 'Island':
      return 'border-transparent bg-brand-500/10 text-brand-500'
    case 'Countryside':
      return 'border-transparent bg-lime-100 text-lime-600'
  }
}

/**
 * Formats a budget amount as currency (e.g. "$5,500").
 */
export function formatBudget(amount: number): string {
  if (amount === 0) return '$0'
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Formats a large budget amount with abbreviation (e.g. "$2.5M").
 * Falls back to {@link formatBudget} for amounts under $1M.
 */
export function formatTotalBudget(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`
  }
  return formatBudget(amount)
}

/**
 * Returns the assignee name or null.
 * TripTask.assignee is already a name string, so this just passes through.
 */
export function getAssigneeName(assignee: string | null): string | null {
  return assignee
}
