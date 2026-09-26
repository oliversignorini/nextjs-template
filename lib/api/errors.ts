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
