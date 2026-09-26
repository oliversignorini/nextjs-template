import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import { serverEnv } from '@/lib/env.server'
import type { Database } from '@/types/database'

/** Service-role client. Bypasses RLS entirely -- never expose to the
 * browser, never use it to answer a normal user request. Reserved for
 * seeding and the rare admin-only capability that must cross RLS by design. */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
