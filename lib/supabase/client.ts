/**
 * Supabase browser client.
 *
 * Creates a client for use in Client Components. Uses `createBrowserClient`
 * from `@supabase/ssr` which handles cookie-based auth automatically.
 * Returns `null` if Supabase is not configured.
 */

import { createBrowserClient } from '@supabase/ssr'
import { isSupabaseConfigured } from '@/lib/env'

/**
 * Create a Supabase client for use in the browser.
 * Returns `null` when Supabase env vars are not configured.
 */
export function createClient() {
  if (!isSupabaseConfigured()) return null

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
