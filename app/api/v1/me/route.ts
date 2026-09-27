import { NextResponse, type NextRequest } from 'next/server'
import { getAuthedClient } from '@/lib/api/auth'
import { handleApiError } from '@/lib/api/errors'
import { getOwnProfile } from '@/lib/profiles/service'
import './openapi'

export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthedClient(request)
    const profile = await getOwnProfile(supabase, user.id)
    return NextResponse.json(profile)
  } catch (error) {
    return handleApiError(error)
  }
}
