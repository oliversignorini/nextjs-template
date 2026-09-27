import { type NextRequest, NextResponse } from 'next/server'
import { getAuthedClient } from '@/lib/api/auth'
import { handleApiError, ApiErrors } from '@/lib/api/errors'
import { paginationQuerySchema } from '@/lib/api/pagination'
import { idempotencyKeySchema } from '@/lib/openapi/common'
import { createNoteSchema } from '@/lib/notes/schemas'
import { createNote, listNotes } from '@/lib/notes/service'
import './openapi'

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await getAuthedClient(request)
    const query = paginationQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams))
    const page = await listNotes(supabase, query)
    return NextResponse.json(page)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthedClient(request)
    const rawIdempotencyKey = request.headers.get('idempotency-key')
    const idempotencyKey = rawIdempotencyKey
      ? idempotencyKeySchema.parse(rawIdempotencyKey)
      : undefined
    const json = await request.json().catch(() => {
      throw ApiErrors.validation('Body must be valid JSON.')
    })
    const input = createNoteSchema.parse(json)
    const note = await createNote(supabase, user.id, input, { idempotencyKey })
    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
