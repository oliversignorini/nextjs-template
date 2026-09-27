import { z } from 'zod'
import { registry } from '@/lib/openapi/registry'
import { commonErrorResponses, errorResponse } from '@/lib/openapi/common'
import { noteSchema } from '@/lib/notes/schemas'

export const paramsSchema = z.object({ id: z.uuid() })

registry.registerPath({
  method: 'get',
  path: '/api/v1/notes/{id}',
  summary: 'Get a single note',
  security: [{ bearerAuth: [] }],
  request: { params: paramsSchema },
  responses: {
    200: { description: 'The note', content: { 'application/json': { schema: noteSchema } } },
    404: errorResponse('Not found'),
    ...commonErrorResponses,
  },
})

registry.registerPath({
  method: 'delete',
  path: '/api/v1/notes/{id}',
  summary: 'Delete a note (owner only -- RLS denies other roles/users)',
  security: [{ bearerAuth: [] }],
  request: { params: paramsSchema },
  responses: {
    204: { description: 'Deleted' },
    404: errorResponse('Not found, or not visible/writable to the caller'),
    ...commonErrorResponses,
  },
})
