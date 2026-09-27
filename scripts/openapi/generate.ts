#!/usr/bin/env -S pnpm exec tsx
// Regenerates openapi.json from the zod-to-openapi registry every route
// handler under app/api/v1 registers into. `pnpm api:check` runs this with
// --check and fails the build on drift (spec vs handlers) *and* on any
// app/api/v1/**/route.ts whose exported HTTP methods aren't registered in
// an adjacent openapi.ts -- an unregistered route is otherwise invisible to
// both this script and the drift check, since neither compares against the
// handler's actual exports.
import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi'
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { registry } from '../../lib/openapi/registry'

const ROOT = resolve(import.meta.dirname, '../..')
const API_DIR = join(ROOT, 'app/api/v1')
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] as const

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

/** app/api/v1/notes/[id]/route.ts -> /api/v1/notes/{id} */
function routePath(routeFile: string): string {
  const rel = routeFile
    .slice(ROOT.length)
    .replace(/\\/g, '/')
    .replace(/^\/app/, '')
    .replace(/\/route\.ts$/, '')
  return rel.replace(/\[([^\]]+)\]/g, '{$1}')
}

function exportedMethods(routeFile: string): string[] {
  const src = readFileSync(routeFile, 'utf8')
  return HTTP_METHODS.filter((m) => new RegExp(`export\\s+async\\s+function\\s+${m}\\b`).test(src))
}

async function main() {
  const allFiles = walk(API_DIR)
  const routeFiles = allFiles.filter((f) => f.endsWith('route.ts'))
  const openapiFiles = allFiles.filter((f) => f.endsWith('openapi.ts'))

  // Import every resource's contract module so its registry.registerPath()
  // calls run (kept separate from route.ts, which pulls in server-only code
  // this plain-Node script can't load).
  for (const file of openapiFiles) await import(pathToFileURL(file).href)

  registry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    description: 'Supabase access token, or use the browser session cookie instead.',
  })

  const registeredRoutes = new Set(
    registry.definitions
      .filter((d): d is Extract<typeof d, { type: 'route' }> => d.type === 'route')
      .map((d) => `${d.route.method.toUpperCase()} ${d.route.path}`)
  )

  const missing = routeFiles.flatMap((file) => {
    const path = routePath(file)
    return exportedMethods(file)
      .map((method) => `${method} ${path}`)
      .filter((key) => !registeredRoutes.has(key))
  })

  if (missing.length > 0) {
    console.error('api:check: these routes are not registered in an openapi.ts:')
    for (const key of missing) console.error(`  ${key}`)
    process.exit(1)
  }

  const generator = new OpenApiGeneratorV31(registry.definitions)
  const document = generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'nextjs-template API',
      version: '1.0.0',
      description:
        'Every capability the UI has, exposed as a versioned HTTP JSON API for agents and MCP clients.',
    },
    // Paths are already absolute (/api/v1/...); a server prefix here would
    // double it (/api/v1/api/v1/...) in any generated client or MCP tool.
    servers: [{ url: '/' }],
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
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
