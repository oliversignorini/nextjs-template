import { z } from 'zod'
import { registry } from '@/lib/openapi/registry'

export const noteSchema = registry.register(
  'Note',
  z.object({
    id: z.uuid(),
    user_id: z.uuid(),
    title: z.string().min(1).max(200),
    body: z.string(),
    created_at: z.iso.datetime(),
  })
)

export const notesPageSchema = registry.register(
  'NotesPage',
  z.object({
    data: z.array(noteSchema),
    next_cursor: z.string().nullable(),
  })
)

export const createNoteSchema = registry.register(
  'CreateNoteInput',
  z.object({
    title: z.string().min(1).max(200),
    body: z.string().max(10_000).default(''),
  })
)

export type CreateNoteInput = z.infer<typeof createNoteSchema>
export type Note = z.infer<typeof noteSchema>
