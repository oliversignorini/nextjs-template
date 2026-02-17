/**
 * Stripe client instance and pricing configuration.
 *
 * Provides a lazily-initialised Stripe client and pricing tier constants.
 * The client is `null` when `STRIPE_SECRET_KEY` is not set.
 */

import Stripe from 'stripe'
import { isStripeConfigured } from '@/lib/env'

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

let stripeInstance: Stripe | null = null

/**
 * Returns the Stripe client, or `null` if Stripe is not configured.
 * The instance is created once and reused across requests.
 */
export function getStripeClient(): Stripe | null {
  if (!isStripeConfigured()) return null

  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-01-28.clover',
      typescript: true,
    })
  }

  return stripeInstance
}

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

export interface PricingTier {
  name: string
  description: string
  priceId: string
  price: number
  features: string[]
}

/** Pricing tiers — update `priceId` values with real Stripe Price IDs. */
export const PRICING: PricingTier[] = [
  {
    name: 'Free',
    description: 'For individuals getting started',
    priceId: 'price_free',
    price: 0,
    features: ['Up to 3 projects', 'Basic analytics', 'Email support'],
  },
  {
    name: 'Pro',
    description: 'For growing teams',
    priceId: 'price_pro_placeholder',
    price: 29,
    features: [
      'Unlimited projects',
      'Advanced analytics',
      'Priority support',
      'API access',
    ],
  },
  {
    name: 'Enterprise',
    description: 'For large organisations',
    priceId: 'price_enterprise_placeholder',
    price: 99,
    features: [
      'Everything in Pro',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantee',
    ],
  },
]
