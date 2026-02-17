/**
 * Anthropic client factory.
 *
 * Provides a lazily-initialised Anthropic client and the default model
 * constant. Returns `null` when `ANTHROPIC_API_KEY` is not set.
 */

import Anthropic from '@anthropic-ai/sdk'
import { isAnthropicConfigured } from '@/lib/env'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default model used for chat completions. */
export const DEFAULT_MODEL = 'claude-sonnet-4-20250514'

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

let anthropicInstance: Anthropic | null = null

/**
 * Returns the Anthropic client, or `null` if the API key is not configured.
 * The instance is created once and reused across requests.
 */
export function getAnthropicClient(): Anthropic | null {
  if (!isAnthropicConfigured()) return null

  if (!anthropicInstance) {
    anthropicInstance = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    })
  }

  return anthropicInstance
}
