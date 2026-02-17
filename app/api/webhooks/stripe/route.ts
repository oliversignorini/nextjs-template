/**
 * POST /api/webhooks/stripe
 *
 * Handles incoming Stripe webhook events. Verifies the webhook signature,
 * then processes subscription lifecycle events by updating the Supabase
 * `subscriptions` table via the service role client.
 */

import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { isStripeConfigured, isSupabaseConfigured } from '@/lib/env'
import { getStripeClient } from '@/lib/stripe'
import type { APIResult } from '@/types'

// ---------------------------------------------------------------------------
// Supabase admin client (service role — bypasses RLS)
// ---------------------------------------------------------------------------

function getAdminClient() {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    },
  )
}

// ---------------------------------------------------------------------------
// Webhook Handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  const stripe = getStripeClient()

  if (!stripe || !isStripeConfigured()) {
    const res: APIResult<never> = {
      success: false,
      error: { code: 'NOT_CONFIGURED', message: 'Stripe is not configured' },
    }
    return NextResponse.json(res, { status: 503 })
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    const res: APIResult<never> = {
      success: false,
      error: { code: 'BAD_REQUEST', message: 'Missing signature or webhook secret' },
    }
    return NextResponse.json(res, { status: 400 })
  }

  // Verify webhook signature
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    )
  } catch {
    const res: APIResult<never> = {
      success: false,
      error: { code: 'INVALID_SIGNATURE', message: 'Invalid webhook signature' },
    }
    return NextResponse.json(res, { status: 400 })
  }

  const supabase = getAdminClient()
  if (!supabase) {
    const res: APIResult<never> = {
      success: false,
      error: { code: 'NOT_CONFIGURED', message: 'Supabase is not configured' },
    }
    return NextResponse.json(res, { status: 503 })
  }

  // -----------------------------------------------------------------------
  // Event handlers
  // -----------------------------------------------------------------------

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      const customerId = session.customer as string

      if (userId && customerId) {
        await supabase
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', userId)
      }
      break
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription

      // Look up user by stripe_customer_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', subscription.customer as string)
        .single()

      if (profile) {
        const firstItem = subscription.items.data[0]

        await supabase.from('subscriptions').upsert({
          id: subscription.id,
          user_id: profile.id,
          status: subscription.status,
          price_id: firstItem?.price.id ?? null,
          quantity: firstItem?.quantity ?? null,
          cancel_at_period_end: subscription.cancel_at_period_end,
          current_period_start: firstItem?.current_period_start
            ? new Date(firstItem.current_period_start * 1000).toISOString()
            : null,
          current_period_end: firstItem?.current_period_end
            ? new Date(firstItem.current_period_end * 1000).toISOString()
            : null,
        })
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await supabase
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('id', subscription.id)
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      const subId =
        typeof invoice.parent?.subscription_details?.subscription === 'string'
          ? invoice.parent.subscription_details.subscription
          : invoice.parent?.subscription_details?.subscription?.id
      if (subId) {
        await supabase
          .from('subscriptions')
          .update({ status: 'active' })
          .eq('id', subId)
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const failedSubId =
        typeof invoice.parent?.subscription_details?.subscription === 'string'
          ? invoice.parent.subscription_details.subscription
          : invoice.parent?.subscription_details?.subscription?.id
      if (failedSubId) {
        await supabase
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('id', failedSubId)
      }
      break
    }
  }

  const res: APIResult<{ received: true }> = {
    success: true,
    data: { received: true },
  }
  return NextResponse.json(res)
}
