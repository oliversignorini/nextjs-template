/**
 * Stripe subscription helpers.
 *
 * Higher-level functions for creating checkout sessions, managing the
 * customer portal, and querying subscription status. All functions return
 * `null` when Stripe is not configured.
 */

import { getStripeClient } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import type { Subscription } from '@/types'

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------

/**
 * Create a Stripe Checkout session for a given user and price.
 * Returns the session URL, or `null` if Stripe/Supabase is not configured.
 */
export async function createCheckoutSession(
  userId: string,
  priceId: string,
): Promise<string | null> {
  const stripe = getStripeClient()
  if (!stripe) return null

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/dashboard?checkout=canceled`,
    client_reference_id: userId,
    metadata: { userId },
  })

  return session.url
}

// ---------------------------------------------------------------------------
// Customer Portal
// ---------------------------------------------------------------------------

/**
 * Create a Stripe Customer Portal session.
 * Returns the portal URL, or `null` if Stripe is not configured.
 */
export async function createCustomerPortalSession(
  customerId: string,
): Promise<string | null> {
  const stripe = getStripeClient()
  if (!stripe) return null

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/dashboard/settings`,
  })

  return session.url
}

// ---------------------------------------------------------------------------
// Subscription Queries
// ---------------------------------------------------------------------------

/**
 * Fetch the active subscription for a user from Supabase.
 * Returns `null` when Supabase is not configured or no subscription exists.
 */
export async function getSubscription(
  userId: string,
): Promise<Subscription | null> {
  const supabase = createClient()
  if (!supabase) return null

  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .single()

  return (data as Subscription) ?? null
}

/**
 * Returns `true` if the subscription has an active or trialing status.
 */
export function isSubscriptionActive(
  subscription: Subscription | null,
): boolean {
  if (!subscription) return false
  return subscription.status === 'active' || subscription.status === 'trialing'
}
