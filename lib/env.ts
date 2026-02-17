/**
 * Environment variable validation and feature detection.
 *
 * Uses Zod to parse environment variables at runtime. All variables are
 * optional — missing vars don't crash the app, they simply disable the
 * corresponding integration. Use the `is*Configured()` helpers to check
 * whether a feature has the required env vars set.
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Server Environment Variables
// ---------------------------------------------------------------------------

const serverSchema = z.object({
  // Supabase
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Anthropic
  ANTHROPIC_API_KEY: z.string().optional(),

  // Resend
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
})

/** Parsed server-side environment variables (safe to use in server code only). */
export const serverEnv = serverSchema.parse(process.env)

// ---------------------------------------------------------------------------
// Client Environment Variables
// ---------------------------------------------------------------------------

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
})

/** Parsed client-side environment variables (safe to expose to the browser). */
export const clientEnv = clientSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
})

// ---------------------------------------------------------------------------
// Feature Detection Helpers
// ---------------------------------------------------------------------------

/** Returns `true` when both Supabase URL and anon key are configured. */
export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

/** Returns `true` when the Stripe secret key is configured. */
export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY
}

/** Returns `true` when the Anthropic API key is configured. */
export function isAnthropicConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY
}

/** Returns `true` when the Resend API key is configured. */
export function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY
}
