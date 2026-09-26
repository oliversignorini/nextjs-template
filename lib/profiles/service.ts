import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ApiErrors } from '@/lib/api/errors'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any, any, any>

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

  if (error) throw ApiErrors.validation(error.message)
  if (!data) throw ApiErrors.notFound('Profile')
  return data as Profile
}
