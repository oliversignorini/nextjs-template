/**
 * Resend email client and send helpers.
 *
 * Provides a lazily-initialised Resend client and convenience functions
 * for sending transactional emails using the templates in `email-templates.ts`.
 * Returns `null` when `RESEND_API_KEY` is not set.
 */

import { Resend } from 'resend'
import { isResendConfigured } from '@/lib/env'
import {
  welcomeEmailHtml,
  passwordResetEmailHtml,
  subscriptionConfirmationEmailHtml,
} from '@/lib/email-templates'

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

let resendInstance: Resend | null = null

/**
 * Returns the Resend client, or `null` if the API key is not configured.
 */
export function getResendClient(): Resend | null {
  if (!isResendConfigured()) return null

  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY!)
  }

  return resendInstance
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fromAddress =
  process.env.RESEND_FROM_EMAIL ?? 'App Template <noreply@example.com>'

/** Send a welcome email to a new user. */
export async function sendWelcomeEmail(to: string, name: string) {
  const resend = getResendClient()
  if (!resend) return null

  return resend.emails.send({
    from: fromAddress,
    to,
    subject: 'Welcome to App Template',
    html: welcomeEmailHtml(name),
  })
}

/** Send a password reset email. */
export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const resend = getResendClient()
  if (!resend) return null

  return resend.emails.send({
    from: fromAddress,
    to,
    subject: 'Reset Your Password',
    html: passwordResetEmailHtml(resetUrl),
  })
}

/** Send a subscription confirmation email. */
export async function sendSubscriptionConfirmationEmail(
  to: string,
  planName: string,
) {
  const resend = getResendClient()
  if (!resend) return null

  return resend.emails.send({
    from: fromAddress,
    to,
    subject: 'Subscription Confirmed',
    html: subscriptionConfirmationEmailHtml(planName),
  })
}
