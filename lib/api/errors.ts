import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

/** Consistent error shape for every app/api/v1 response. */
export type ApiErrorBody = {
  error: {
    code: string
    message: string
    field?: string
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public field?: string
  ) {
    super(message)
  }

  toResponse() {
    const body: ApiErrorBody = {
      error: {
        code: this.code,
        message: this.message,
        ...(this.field ? { field: this.field } : {}),
      },
    }
    return NextResponse.json(body, { status: this.status })
  }
}

export const ApiErrors = {
  unauthorized: () => new ApiError(401, 'unauthorized', 'Authentication required.'),
  forbidden: () => new ApiError(403, 'forbidden', 'You do not have access to this resource.'),
  notFound: (resource: string) => new ApiError(404, 'not_found', `${resource} not found.`),
  validation: (message: string, field?: string) =>
    new ApiError(422, 'validation_error', message, field),
  conflict: (message: string) => new ApiError(409, 'conflict', message),
}

type PostgrestLikeError = { code?: string | null; message: string }

/** Maps a Postgres/PostgREST error to the API's error envelope instead of
 * ever forwarding the raw message: an RLS denial, a constraint violation and
 * a network blip all look different to a caller (403 vs 409 vs 500), and the
 * raw Postgres text can leak schema/implementation details. */
export function mapDbError(error: PostgrestLikeError): ApiError {
  const code = error.code ?? ''
  if (code === 'PGRST116') return new ApiError(404, 'not_found', 'Resource not found.')
  if (code === '42501') return ApiErrors.forbidden()
  if (code === '23505') return new ApiError(409, 'conflict', 'This record already exists.')
  if (code.startsWith('22') || code.startsWith('23')) {
    return new ApiError(422, 'validation_error', 'The request violates a database constraint.')
  }
  console.error('unmapped database error', error)
  return new ApiError(500, 'internal_error', 'Something went wrong.')
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) return error.toResponse()
  if (error instanceof ZodError) {
    const issue = error.issues[0]
    return new ApiError(
      422,
      'validation_error',
      issue?.message ?? 'Invalid input.',
      issue?.path.join('.')
    ).toResponse()
  }
  console.error(error)
  return new ApiError(500, 'internal_error', 'Something went wrong.').toResponse()
}
