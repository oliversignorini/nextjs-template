'use server'

import { revalidatePath } from 'next/cache'
import { getAuthedServerClient } from '@/lib/api/auth'
import { createNoteSchema } from '@/lib/notes/schemas'
import { createNote } from '@/lib/notes/service'

export type CreateNoteState = { error?: string } | undefined

export async function createNoteAction(
  _prev: CreateNoteState,
  formData: FormData
): Promise<CreateNoteState> {
  const parsed = createNoteSchema.safeParse({
    title: formData.get('title'),
    body: formData.get('body') ?? '',
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid note.' }

  const { supabase, user } = await getAuthedServerClient()
  await createNote(supabase, user.id, parsed.data)
  revalidatePath('/notes')
  return undefined
}
