/**
 * POST /api/email
 *
 * Sends a transactional email using the specified template. Validates the
 * request body with Zod and delegates to the appropriate send helper.
 * Returns 503 if Resend is not configured.
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendSubscriptionConfirmationEmail,
} from '@/lib/email'
import { isResendConfigured } from '@/lib/env'
import type { APIResult } from '@/types'

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const emailSchema = z.object({
  to: z.email(),
  template: z.enum(['welcome', 'password-reset', 'subscription-confirmation']),
  data: z.record(z.string(), z.string()).optional(),
})

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  if (!isResendConfigured()) {
    const res: APIResult<never> = {
      success: false,
      error: { code: 'NOT_CONFIGURED', message: 'Email service is not configured' },
    }
    return NextResponse.json(res, { status: 503 })
  }

  const body = await request.json()
  const parsed = emailSchema.safeParse(body)

  if (!parsed.success) {
    const res: APIResult<never> = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: parsed.error.issues[0].message,
      },
    }
    return NextResponse.json(res, { status: 400 })
  }

  const { to, template, data } = parsed.data

  try {
    let result

    switch (template) {
      case 'welcome':
        result = await sendWelcomeEmail(to, data?.name ?? 'there')
        break
      case 'password-reset':
        if (!data?.resetUrl) {
          const res: APIResult<never> = {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'resetUrl is required for password-reset template',
            },
          }
          return NextResponse.json(res, { status: 400 })
        }
        result = await sendPasswordResetEmail(to, data.resetUrl)
        break
      case 'subscription-confirmation':
        result = await sendSubscriptionConfirmationEmail(
          to,
          data?.planName ?? 'Pro',
        )
        break
    }

    if (!result?.data?.id) {
      const res: APIResult<never> = {
        success: false,
        error: { code: 'SEND_FAILED', message: 'Failed to send email' },
      }
      return NextResponse.json(res, { status: 500 })
    }

    const res: APIResult<{ id: string }> = {
      success: true,
      data: { id: result.data.id },
    }
    return NextResponse.json(res)
  } catch {
    const res: APIResult<never> = {
      success: false,
      error: { code: 'SEND_FAILED', message: 'Failed to send email' },
    }
    return NextResponse.json(res, { status: 500 })
  }
}
