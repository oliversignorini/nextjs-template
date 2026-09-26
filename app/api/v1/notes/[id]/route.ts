import { type NextRequest, NextResponse } from 'next/server'
import { getAuthedClient } from '@/lib/api/auth'
import { handleApiError } from '@/lib/api/errors'
import { deleteNote, getNote } from '@/lib/notes/service'
import { paramsSchema } from './openapi'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supabase } = await getAuthedClient(request)
    const { id } = paramsSchema.parse(await params)
    const note = await getNote(supabase, id)
    return NextResponse.json(note)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase } = await getAuthedClient(request)
    const { id } = paramsSchema.parse(await params)
    await deleteNote(supabase, id)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
