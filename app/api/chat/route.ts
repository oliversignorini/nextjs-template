/**
 * POST /api/chat
 *
 * Accepts a list of chat messages and returns a streaming response from
 * the Anthropic API. Returns 503 if the Anthropic integration is not
 * configured.
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAnthropicClient, DEFAULT_MODEL } from '@/lib/anthropic'
import type { APIResult } from '@/types'

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1),
      }),
    )
    .min(1),
})

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  const anthropic = getAnthropicClient()

  if (!anthropic) {
    const res: APIResult<never> = {
      success: false,
      error: { code: 'NOT_CONFIGURED', message: 'Anthropic AI is not configured' },
    }
    return NextResponse.json(res, { status: 503 })
  }

  const body = await request.json()
  const parsed = chatSchema.safeParse(body)

  if (!parsed.success) {
    const res: APIResult<never> = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: parsed.error.issues[0].message,
      },
    }
    return NextResponse.json(res, { status: 400 })
  }

  const stream = anthropic.messages.stream({
    model: DEFAULT_MODEL,
    max_tokens: 1024,
    messages: parsed.data.messages,
  })

  // Convert the Anthropic SDK stream into a ReadableStream for the response
  const readableStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          controller.enqueue(encoder.encode(event.delta.text))
        }
      }

      controller.close()
    },
  })

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  })
}
