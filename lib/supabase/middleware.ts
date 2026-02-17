/**
 * Supabase middleware client.
 *
 * Creates a Supabase client that can refresh auth tokens and write updated
 * session cookies back to the response. Called from the root middleware to
 * keep the session alive on every request.
 */

import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { isSupabaseConfigured } from '@/lib/env'

/**
 * Refresh the Supabase session and return a response with updated cookies.
 * Returns the unmodified response when Supabase is not configured.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  if (!isSupabaseConfigured()) return supabaseResponse

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Refresh the session — this reads and writes cookies as needed
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect /dashboard/* routes — redirect unauthenticated users to home
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
