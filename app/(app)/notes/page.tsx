import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAuthedServerClient } from '@/lib/api/auth'
import { listNotes } from '@/lib/notes/service'
import { paginationQuerySchema } from '@/lib/api/pagination'
import { NoteForm } from '@/app/(app)/notes/note-form'

export default async function NotesPage() {
  const { supabase } = await getAuthedServerClient()
  const { data: notes } = await listNotes(supabase, paginationQuerySchema.parse({}))

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Notes</h1>
      <NoteForm />
      <div className="flex flex-col gap-3" data-testid="notes-list">
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notes yet.</p>
        ) : (
          notes.map((note) => (
            <Card key={note.id} data-testid="note-item">
              <CardHeader>
                <CardTitle>{note.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{note.body}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
