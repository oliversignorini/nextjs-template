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
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const

/** Sorted so the walk order (and therefore the openapi.ts import order,
 * which drives the registry's -- and the generated document's -- component
 * and path order) is identical on every OS. readdirSync's order is
 * filesystem-dependent: NTFS happens to return names alphabetically, ext4
 * does not, so CI (Linux) and local Windows runs produced byte-different
 * openapi.json and `api:check` drifted on Linux only. */
function walk(dir: string): string[] {
  return readdirSync(dir)
    .sort()
    .flatMap((name) => {
      const full = join(dir, name)
      return statSync(full).isDirectory() ? walk(full) : [full]
    })
}

/** app/api/v1/notes/[id]/route.ts -> /api/v1/notes/{id}. Path segments are
 * always joined with "/" regardless of the host's path separator. */
function routePath(routeFile: string): string {
  const rel = routeFile
    .slice(ROOT.length)
    .split(/[\\/]/)
    .join('/')
    .replace(/^\/app/, '')
    .replace(/\/route\.[jt]sx?$/, '')
  return rel.replace(/\[([^\]]+)\]/g, '{$1}')
}

function exportedMethods(routeFile: string): string[] {
  const src = readFileSync(routeFile, 'utf8')
  return HTTP_METHODS.filter((m) => {
    const patterns = [
      `export\\s+(?:async\\s+)?function\\s+${m}\\b`, // export [async] function GET
      `export\\s+const\\s+${m}\\s*=`, // export const GET = ...
      `export\\s*\\{[^}]*\\bas\\s+${m}\\b`, // export { handler as GET }
    ]
    return patterns.some((p) => new RegExp(p).test(src))
  })
}

async function main() {
  const allFiles = walk(API_DIR)
  const routeFiles = allFiles.filter((f) => /route\.[jt]sx?$/.test(f)).sort()
  const openapiFiles = allFiles.filter((f) => f.endsWith('openapi.ts')).sort()

  // Import every resource's contract module so its registry.registerPath()
  // calls run (kept separate from route.ts, which pulls in server-only code
  // this plain-Node script can't load).
  for (const file of openapiFiles) await import(pathToFileURL(file).href)

  registry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    description: 'Supabase access token, or use the browser session cookie instead.',
  })

  const routeDefs = registry.definitions.filter(
    (d): d is Extract<typeof d, { type: 'route' }> => d.type === 'route'
  )
  const registeredRoutes = new Set(
    routeDefs.map((d) => `${d.route.method.toUpperCase()} ${d.route.path}`)
  )

  const handlerKeys = new Set(
    routeFiles.flatMap((file) =>
      exportedMethods(file).map((method) => `${method} ${routePath(file)}`)
    )
  )

  const missing = [...handlerKeys].filter((key) => !registeredRoutes.has(key))
  const orphaned = [...registeredRoutes].filter((key) => !handlerKeys.has(key))

  if (missing.length > 0 || orphaned.length > 0) {
    if (missing.length > 0) {
      console.error('api:check: these routes have a handler but no openapi.ts registration:')
      for (const key of missing) console.error(`  ${key}`)
    }
    if (orphaned.length > 0) {
      console.error('api:check: these registered paths have no matching route handler:')
      for (const key of orphaned) console.error(`  ${key}`)
    }
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
  // Force LF regardless of the platform's default writeFileSync behaviour
  // (both Windows and Linux write LF for a plain '\n' string -- this guards
  // against something upstream sneaking in a CRLF and drifting the check).
  const rendered = JSON.stringify(document, null, 2).replace(/\r\n/g, '\n') + '\n'

  if (process.argv.includes('--check')) {
    const current = existsSync(outPath) ? readFileSync(outPath, 'utf8').replace(/\r\n/g, '\n') : ''
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
