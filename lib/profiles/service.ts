import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ApiErrors, mapDbError } from '@/lib/api/errors'
import type { Database } from '@/types/database'

type Client = SupabaseClient<Database>

export type Profile = {
  id: string
  email: string
  role: 'admin' | 'member'
}

export async function getOwnProfile(supabase: Client, userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw mapDbError(error)
  if (!data) throw ApiErrors.notFound('Profile')
  return data
}
