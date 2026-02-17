/**
 * HTML email templates for transactional emails.
 *
 * Each function returns a complete HTML string with inline CSS for maximum
 * email client compatibility. Uses the brand colour palette.
 */

// ---------------------------------------------------------------------------
// Shared Styles
// ---------------------------------------------------------------------------

const baseStyles = `
  font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #1e293b;
  line-height: 1.6;
`

const containerStyles = `
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 20px;
`

const buttonStyles = `
  display: inline-block;
  background-color: #0f172a;
  color: #ffffff;
  text-decoration: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
`

const footerStyles = `
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
  font-size: 12px;
  color: #64748b;
`

function wrap(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; ${baseStyles}">
  <div style="${containerStyles}">
    <div style="background-color: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      ${content}
    </div>
    <div style="${footerStyles}">
      <p>This is an automated message. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>`
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

/** Welcome email sent after a new user signs up. */
export function welcomeEmailHtml(name: string): string {
  return wrap(`
    <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 16px;">Welcome, ${name}!</h1>
    <p>Thank you for signing up. We're excited to have you on board.</p>
    <p>You can get started by visiting your dashboard:</p>
    <p style="margin: 24px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/dashboard" style="${buttonStyles}">
        Go to Dashboard
      </a>
    </p>
    <p>If you have any questions, don't hesitate to reach out.</p>
  `)
}

/** Password reset email with a one-time reset link. */
export function passwordResetEmailHtml(resetUrl: string): string {
  return wrap(`
    <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 16px;">Reset Your Password</h1>
    <p>We received a request to reset your password. Click the button below to choose a new password:</p>
    <p style="margin: 24px 0;">
      <a href="${resetUrl}" style="${buttonStyles}">
        Reset Password
      </a>
    </p>
    <p>If you didn't request this, you can safely ignore this email. The link will expire in 1 hour.</p>
  `)
}

/** Subscription confirmation email sent after a successful payment. */
export function subscriptionConfirmationEmailHtml(planName: string): string {
  return wrap(`
    <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 16px;">Subscription Confirmed</h1>
    <p>Your <strong>${planName}</strong> subscription is now active. Thank you for your support!</p>
    <p>You now have access to all features included in your plan. Visit your dashboard to start using them:</p>
    <p style="margin: 24px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/dashboard" style="${buttonStyles}">
        Go to Dashboard
      </a>
    </p>
    <p>You can manage your subscription at any time from the Settings page.</p>
  `)
}
