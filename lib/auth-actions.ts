/**
 * Authentication server actions.
 *
 * Provides `signUp`, `signIn`, `signOut`, and `signInWithOAuth` actions
 * that validate input with Zod before calling the Supabase Auth API.
 * All actions return a `{ success, error? }` result for the calling component.
 */

'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Validation Schemas
// ---------------------------------------------------------------------------

const authSchema = z.object({
  email: z.email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const oauthSchema = z.object({
  provider: z.enum(['google', 'github']),
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ActionResult = { success: true } | { success: false; error: string }

function notConfigured(): ActionResult {
  return { success: false, error: 'Authentication is not configured' }
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/** Create a new account with email and password. */
export async function signUp(formData: FormData): Promise<ActionResult> {
  const supabase = createClient()
  if (!supabase) return notConfigured()

  const parsed = authSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { error } = await supabase.auth.signUp(parsed.data)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/** Sign in with email and password. */
export async function signIn(formData: FormData): Promise<ActionResult> {
  const supabase = createClient()
  if (!supabase) return notConfigured()

  const parsed = authSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { success: false, error: error.message }
  }

  redirect('/dashboard')
}

/** Sign out the current user. */
export async function signOut(): Promise<ActionResult> {
  const supabase = createClient()
  if (!supabase) return notConfigured()

  const { error } = await supabase.auth.signOut()

  if (error) {
    return { success: false, error: error.message }
  }

  redirect('/')
}

/** Initiate an OAuth sign-in flow (e.g. Google, GitHub). */
export async function signInWithOAuth(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = createClient()
  if (!supabase) return notConfigured()

  const parsed = oauthSchema.safeParse({
    provider: formData.get('provider'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: parsed.data.provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    return { success: false, error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }

  return { success: true }
}
