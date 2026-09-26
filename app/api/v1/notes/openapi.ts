// Contract-only: registers this resource's OpenAPI paths. Kept separate
// from route.ts so `scripts/openapi/generate.ts` can import it without
// pulling in server-only auth/service code (that script runs under plain
// Node, not the Next.js server runtime).
import { registry } from '@/lib/openapi/registry'
import { paginationQuerySchema } from '@/lib/api/pagination'
import { createNoteSchema, noteSchema } from '@/lib/notes/schemas'

registry.registerPath({
  method: 'get',
  path: '/api/v1/notes',
  summary: "List the caller's notes, newest first",
  security: [{ bearerAuth: [] }],
  request: { query: paginationQuerySchema },
  responses: {
    200: {
      description: 'A page of notes',
      content: {
        'application/json': {
          schema: noteSchema.array(),
        },
      },
    },
  },
})

registry.registerPath({
  method: 'post',
  path: '/api/v1/notes',
  summary: 'Create a note',
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: createNoteSchema } } },
  },
  responses: {
    201: {
      description: 'The created note',
      content: { 'application/json': { schema: noteSchema } },
    },
  },
})
