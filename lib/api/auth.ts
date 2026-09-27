import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { env } from '@/lib/env'
import { ApiErrors } from '@/lib/api/errors'
import { createClient as createServerActionClient } from '@/lib/supabase/server'

/** Every app/api/v1 route authenticates the same two ways a browser and an
 * agent each need: the Supabase session cookie, or `Authorization: Bearer
 * <access_token>` with no cookies at all. Both return a client scoped to
 * that user, so RLS still applies. */
export async function getAuthedClient(request: NextRequest) {
  const bearer = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1]

  if (bearer) {
    const supabase = createSupabaseClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: { headers: { Authorization: `Bearer ${bearer}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      }
    )
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(bearer)
    if (error || !user) throw ApiErrors.unauthorized()
    return { supabase, user }
  }

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {
          // Route handlers can't set cookies on the incoming request;
          // middleware already refreshed the session before this ran.
        },
      },
    }
  )
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) throw ApiErrors.unauthorized()
  return { supabase, user }
}

/** Same contract, for Server Components / Server Actions (cookie-only). */
export async function getAuthedServerClient() {
  const supabase = await createServerActionClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) throw ApiErrors.unauthorized()
  return { supabase, user }
}
