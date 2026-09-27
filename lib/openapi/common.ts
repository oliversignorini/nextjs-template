import { z } from 'zod'
import { registry } from '@/lib/openapi/registry'

/** The error envelope every app/api/v1 response uses (lib/api/errors.ts). */
export const apiErrorSchema = registry.register(
  'ApiError',
  z.object({
    error: z.object({
      code: z.string(),
      message: z.string(),
      field: z.string().optional(),
    }),
  })
)

export function errorResponse(description: string) {
  return { description, content: { 'application/json': { schema: apiErrorSchema } } }
}

/** Every route can hit these; spread into a route's own `responses`. Routes
 * with their own 403/404/409 semantics use errorResponse() directly so the
 * ApiError schema is attached there too (mapDbError can return any of
 * 401/403/404/409/422/500 -- see lib/api/errors.ts). */
export const commonErrorResponses = {
  401: errorResponse('Authentication required'),
  403: errorResponse('Forbidden'),
  422: errorResponse('Validation error'),
  500: errorResponse('Internal error'),
}

export const idempotencyKeyHeader = z.object({
  'idempotency-key': z.string().optional().openapi({
    description: 'Dedupe key: retrying a create with the same key returns the original result.',
  }),
})
