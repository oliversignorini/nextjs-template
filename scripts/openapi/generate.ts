#!/usr/bin/env -S pnpm exec tsx
// Regenerates openapi.json from the zod-to-openapi registry every route
// handler under app/api/v1 registers into. `pnpm api:check` runs this with
// --check and fails the build on drift, since this file is the agent/MCP
// contract for the API.
import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { registry } from '../../lib/openapi/registry'

// Import every resource's contract module so its registry.registerPath()
// calls run (kept separate from route.ts, which pulls in server-only code).
import '../../app/api/v1/notes/openapi'
import '../../app/api/v1/notes/[id]/openapi'

registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  description: 'Supabase access token, or use the browser session cookie instead.',
})

const generator = new OpenApiGeneratorV31(registry.definitions)
const document = generator.generateDocument({
  openapi: '3.1.0',
  info: {
    title: 'nextjs-template API',
    version: '1.0.0',
    description:
      'Every capability the UI has, exposed as a versioned HTTP JSON API for agents and MCP clients.',
  },
  servers: [{ url: '/api/v1' }],
})

const outPath = resolve(import.meta.dirname, '../../openapi.json')
const rendered = JSON.stringify(document, null, 2) + '\n'

if (process.argv.includes('--check')) {
  const current = existsSync(outPath) ? readFileSync(outPath, 'utf8') : ''
  if (current !== rendered) {
    console.error('openapi.json is out of date. Run `pnpm api:generate` and commit the result.')
    process.exit(1)
  }
  console.log('openapi.json is up to date.')
} else {
  writeFileSync(outPath, rendered)
  console.log(`wrote ${outPath}`)
}
