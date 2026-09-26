import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { ApiError, ApiErrors, handleApiError } from '@/lib/api/errors'

async function bodyOf(response: Response) {
  return response.json() as Promise<{ error: { code: string; message: string; field?: string } }>
}

describe('handleApiError', () => {
  it('serializes an ApiError with its status and error shape', async () => {
    const response = handleApiError(ApiErrors.notFound('Note'))
    expect(response.status).toBe(404)
    expect(await bodyOf(response)).toEqual({
      error: { code: 'not_found', message: 'Note not found.' },
    })
  })

  it('turns a ZodError into a 422 validation_error with the failing field', async () => {
    const schema = z.object({ title: z.string().min(1) })
    const result = schema.safeParse({ title: '' })
    if (result.success) throw new Error('expected parse to fail')

    const response = handleApiError(result.error)
    expect(response.status).toBe(422)
    const body = await bodyOf(response)
    expect(body.error.code).toBe('validation_error')
    expect(body.error.field).toBe('title')
  })

  it('never leaks internal error details for unknown errors', async () => {
    const response = handleApiError(new Error('database password is hunter2'))
    expect(response.status).toBe(500)
    expect(await bodyOf(response)).toEqual({
      error: { code: 'internal_error', message: 'Something went wrong.' },
    })
  })

  it('includes an optional field on ApiError only when given', () => {
    const withField = new ApiError(422, 'validation_error', 'bad', 'email')
    const withoutField = new ApiError(422, 'validation_error', 'bad')
    expect(withField.field).toBe('email')
    expect(withoutField.field).toBeUndefined()
  })
})
