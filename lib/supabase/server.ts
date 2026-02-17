/**
 * Supabase server client.
 *
 * Creates a client for use in Server Components, Server Actions, and Route
 * Handlers. Uses `createServerClient` from `@supabase/ssr` with Next.js
 * `cookies()` for session management. Returns `null` if Supabase is not
 * configured.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { isSupabaseConfigured } from '@/lib/env'

/**
 * Create a Supabase client for use on the server.
 * Returns `null` when Supabase env vars are not configured.
 */
export function createClient() {
  if (!isSupabaseConfigured()) return null

  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // `setAll` can be called from Server Components where cookies
            // are read-only. The middleware will refresh the session instead.
          }
        },
      },
    },
  )
}
