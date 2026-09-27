// Contract-only: registers this resource's OpenAPI paths. Kept separate
// from route.ts so `scripts/openapi/generate.ts` can import it without
// pulling in server-only auth/service code (that script runs under plain
// Node, not the Next.js server runtime).
import { registry } from '@/lib/openapi/registry'
import { commonErrorResponses, errorResponse, idempotencyKeyHeader } from '@/lib/openapi/common'
import { paginationQuerySchema } from '@/lib/api/pagination'
import { createNoteSchema, noteSchema, notesPageSchema } from '@/lib/notes/schemas'

registry.registerPath({
  method: 'get',
  path: '/api/v1/notes',
  summary: "List the caller's notes, newest first",
  security: [{ bearerAuth: [] }],
  request: { query: paginationQuerySchema },
  responses: {
    200: {
      description:
        'A page of notes. `next_cursor` is an opaque token: pass it back as `cursor` for the next page.',
      content: { 'application/json': { schema: notesPageSchema } },
    },
    ...commonErrorResponses,
  },
})

registry.registerPath({
  method: 'post',
  path: '/api/v1/notes',
  summary: 'Create a note',
  security: [{ bearerAuth: [] }],
  request: {
    headers: idempotencyKeyHeader,
    body: { content: { 'application/json': { schema: createNoteSchema } } },
  },
  responses: {
    201: {
      description: 'The created note',
      content: { 'application/json': { schema: noteSchema } },
    },
    409: errorResponse(
      'Idempotency-Key reused with a different body, or a request with it is still in flight'
    ),
    ...commonErrorResponses,
  },
})
