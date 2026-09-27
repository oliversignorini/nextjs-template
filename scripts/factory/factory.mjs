#!/usr/bin/env node
// Software-factory profile commands for nextjs-template (next-supabase-vercel).
//
// Every command is slot-aware: FACTORY_SLOT (0-9, default 0) picks a port
// block (default port + slot*100), a Supabase `project_id`
// (nextjs-template-s<slot>), and a satellite Supabase project dir
// (.factory/supabase-s<slot>/, gitignored) so parallel worktrees never share
// containers, volumes or ports. Supabase's own config.toml stays a single
// tracked file; this script renders a per-slot copy into the satellite dir
// and always drives the CLI with --workdir against it.
//
//   node scripts/factory/factory.mjs <command> [args]
//
//   env         write .env.local for this slot (does not touch containers)
//   env:up      render the satellite project, `supabase start`, write .env.local
//   env:down    `supabase stop` for this slot (keeps the satellite dir + volumes)
//   env:reset   env:down, env:up, `supabase db reset`, seed demo users/rows, gen:types
//   dev         run `next dev` on this slot's port
//   health      exit 0 when GET /api/health returns 200
//   test:db     `supabase test db` against this slot's stack
//   e2e [args]  run Playwright against this slot (starts dev if not up)
//   gen:types   regenerate types/database.ts from this slot's running stack
//   ports       print this slot's port map as JSON
import { spawn, spawnSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const MARKER = '# managed-by: scripts/factory/factory.mjs'
const IS_WINDOWS = process.platform === 'win32'

// Pinned past the CLI's own default resolution for postgres `major_version
// = 17`: 17.6.1.171 has a corrupted image on this host (0-byte
// docker-entrypoint.sh/gosu, reproduced independently of this repo) and
// re-pulling the same tag doesn't fix it. 17.6.1.172 is pulled and
// verified intact. The CLI reads this exact file to pick the patch
// version, so every slot's satellite gets one. Bump it (or drop it once
// the CLI's own default is >= this) if the corrupted image is ever cleaned
// up host-wide.
const PINNED_POSTGRES_VERSION = '17.6.1.172'

const BASE_PORTS = {
  WEB_PORT: 3000,
  SUPABASE_API_PORT: 54321,
  SUPABASE_DB_PORT: 54322,
  SUPABASE_SHADOW_PORT: 54320,
  SUPABASE_STUDIO_PORT: 54323,
  SUPABASE_MAIL_PORT: 54324,
  SUPABASE_POOLER_PORT: 54329,
}

function slot() {
  const raw = process.env.FACTORY_SLOT ?? '0'
  const value = Number(raw)
  if (!Number.isInteger(value) || value < 0 || value > 9) {
    fail(`FACTORY_SLOT must be an integer 0-9, got "${raw}"`)
  }
  return value
}

function ports(s = slot()) {
  return Object.fromEntries(Object.entries(BASE_PORTS).map(([k, v]) => [k, v + s * 100]))
}

function fail(message) {
  console.error(`factory: ${message}`)
  process.exit(1)
}

function projectId(s = slot()) {
  return `nextjs-template-s${s}`
}

/** --workdir wants the directory *containing* a supabase/ folder, used
 * exactly as given with no ancestor search -- not the supabase/ folder
 * itself. Passing the wrong one means the CLI finds no config.toml at all
 * and silently falls back to a default project_id derived from the
 * satellite dir's own basename, which is how slot 4 first collided with an
 * unrelated leftover "supabase-s4" stack on this host. */
function satelliteDir(s = slot()) {
  return join(ROOT, '.factory', `supabase-s${s}`)
}

function satelliteSupabaseDir(s = slot()) {
  return join(satelliteDir(s), 'supabase')
}

// ------------------------------------------------------ satellite project

/** Copies supabase/{migrations,seed.sql,tests} into the satellite dir and
 * renders config.toml with this slot's ports + project_id, so a bare
 * `supabase db reset --workdir <satellite>` only ever touches this slot. */
function renderSatellite(s) {
  const dir = satelliteSupabaseDir(s)
  mkdirSync(dir, { recursive: true })
  for (const name of ['migrations', 'seed.sql', 'tests']) {
    const src = join(ROOT, 'supabase', name)
    if (!existsSync(src)) continue
    cpSync(src, join(dir, name), { recursive: true })
  }

  const p = ports(s)
  const remap = new Map(Object.entries(BASE_PORTS).map(([k, v]) => [String(v), String(p[k])]))
  let toml = readFileSync(join(ROOT, 'supabase', 'config.toml'), 'utf8')
  toml = toml.replace(/^project_id = ".*"$/m, `project_id = "${projectId(s)}"`)
  toml = toml.replace(/^(\s*(?:port|shadow_port) = )(\d+)$/gm, (m, prefix, port) =>
    remap.has(port) ? `${prefix}${remap.get(port)}` : m
  )
  toml = toml.replace(/^site_url = ".*"$/m, `site_url = "http://127.0.0.1:${p.WEB_PORT}"`)
  toml = toml.replace(
    /^additional_redirect_urls = \[.*\]$/m,
    `additional_redirect_urls = ["http://127.0.0.1:${p.WEB_PORT}"]`
  )
  writeFileSync(join(dir, 'config.toml'), toml)

  mkdirSync(join(dir, '.temp'), { recursive: true })
  writeFileSync(join(dir, '.temp', 'postgres-version'), PINNED_POSTGRES_VERSION)

  return dir
}

// ---------------------------------------------------------------- env file

function envVars(s, statusEnv) {
  const p = ports(s)
  return {
    FACTORY_SLOT: String(s),
    PORT: String(p.WEB_PORT),
    NEXT_PUBLIC_APP_URL: `http://localhost:${p.WEB_PORT}`,
    NEXT_PUBLIC_SUPABASE_URL: statusEnv?.API_URL ?? `http://127.0.0.1:${p.SUPABASE_API_PORT}`,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: statusEnv?.ANON_KEY ?? '',
    SUPABASE_SERVICE_ROLE_KEY: statusEnv?.SERVICE_ROLE_KEY ?? '',
    E2E_BASE_URL: `http://localhost:${p.WEB_PORT}`,
    E2E_MAILPIT_URL: `http://127.0.0.1:${p.SUPABASE_MAIL_PORT}`,
  }
}

function writeEnvLocal(s, statusEnv) {
  const vars = envVars(s, statusEnv)
  const body = Object.entries(vars)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')
  writeFileSync(
    join(ROOT, '.env.local'),
    `${MARKER} (slot ${s}); regenerate with \`pnpm env:up\`.\n${body}\n`
  )
}

function readEnvLocal() {
  const path = join(ROOT, '.env.local')
  if (!existsSync(path)) return {}
  const vars = {}
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line)
    if (m) vars[m[1]] = m[2]
  }
  return vars
}

function envFromFile() {
  return { ...process.env, ...readEnvLocal() }
}

// ------------------------------------------------------------- processes

function shellArgs(cmd, args) {
  if (!IS_WINDOWS) return [cmd, args, false]
  const quote = (a) => (/[\s"&|<>^]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a)
  return [[cmd, ...args].map(quote).join(' '), [], true]
}

function run(cmd, args, opts = {}) {
  const [c, a, shell] = shellArgs(cmd, args)
  const res = spawnSync(c, a, {
    cwd: opts.cwd ?? ROOT,
    env: opts.env ?? envFromFile(),
    stdio: opts.capture ? 'pipe' : 'inherit',
    shell,
    encoding: 'utf8',
  })
  if (res.status !== 0 && !opts.allowFail) {
    fail(`\`${cmd} ${args.join(' ')}\` exited ${res.status}\n${res.stderr ?? ''}`)
  }
  return res
}

function supabase(args, opts = {}) {
  return run('pnpm', ['exec', 'supabase', ...args, '--workdir', satelliteDir()], opts)
}

function killTree(child) {
  if (!child.pid || child.exitCode !== null) return
  if (IS_WINDOWS)
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
  else {
    try {
      process.kill(-child.pid, 'SIGTERM')
    } catch {
      child.kill('SIGTERM')
    }
  }
}

function devProcess(env, logPath) {
  const p = ports()
  const logFd = logPath ? openSync(logPath, 'a') : undefined
  const [c, a, shell] = shellArgs('pnpm', ['exec', 'next', 'dev', '-p', String(p.WEB_PORT)])
  return spawn(c, a, {
    cwd: ROOT,
    env,
    shell,
    detached: !IS_WINDOWS,
    stdio: logFd === undefined ? 'inherit' : ['ignore', logFd, logFd],
  })
}

// --------------------------------------------------------------- commands

function cmdEnv() {
  const s = slot()
  renderSatellite(s)
  const status = supabase(['status', '-o', 'env'], { allowFail: true, capture: true })
  const statusEnv = status.status === 0 ? parseEnvOutput(status.stdout) : undefined
  writeEnvLocal(s, statusEnv)
  console.log(`factory: wrote .env.local for slot ${s}`)
}

function parseEnvOutput(text) {
  const vars = {}
  for (const line of text.split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)="?(.*?)"?$/.exec(line)
    if (m) vars[m[1]] = m[2]
  }
  return vars
}

function cmdEnvUp() {
  const s = slot()
  renderSatellite(s)
  supabase(['start'])
  cmdEnv()
  console.log(`factory: slot ${s} up -> ${JSON.stringify(ports(s))}`)
}

function cmdEnvDown() {
  const s = slot()
  if (existsSync(satelliteDir(s))) {
    supabase(['stop', '--no-backup'], { allowFail: true })
  }
}

async function cmdEnvReset() {
  cmdEnvDown()
  cmdEnvUp()
  supabase(['db', 'reset'])
  run('pnpm', ['exec', 'tsx', 'scripts/supabase/seed.ts'], { env: envFromFile() })
  cmdGenTypes()
}

function cmdDev() {
  const env = envFromFile()
  const p = ports()
  console.log(
    `factory: slot ${slot()} -> web http://localhost:${p.WEB_PORT}  mail http://127.0.0.1:${p.SUPABASE_MAIL_PORT}`
  )
  const child = devProcess(env)
  const stop = () => {
    killTree(child)
    process.exit(0)
  }
  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)
  child.on('exit', (code) => code && console.error(`factory: dev exited ${code}`))
}

async function probe(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    return res.status < 500
  } catch {
    return false
  }
}

async function healthy() {
  const p = ports()
  const ok = await probe(`http://localhost:${p.WEB_PORT}/api/health`)
  return { slot: slot(), web: ok, ok }
}

async function cmdHealth() {
  const result = await healthy()
  console.log(JSON.stringify(result))
  process.exit(result.ok ? 0 : 1)
}

function cmdTestDb() {
  renderSatellite(slot())
  supabase(['test', 'db'])
}

function cmdGenTypes() {
  const res = supabase(['gen', 'types', 'typescript'], { capture: true })
  const header =
    '// Generated by `pnpm gen:types` (supabase gen types typescript --local).\n// Do not hand-edit; regenerate after every migration.\n'
  writeFileSync(join(ROOT, 'types', 'database.ts'), header + res.stdout)
  console.log('factory: wrote types/database.ts')
}

async function cmdE2e(args) {
  const env = envFromFile()
  let started
  if (!(await healthy()).ok) {
    mkdirSync(join(ROOT, '.factory'), { recursive: true })
    const logPath = join(ROOT, '.factory', `dev-slot${slot()}.log`)
    console.log(`factory: slot not serving; starting dev (log: ${logPath})`)
    started = devProcess(env, logPath)
    const deadline = Date.now() + 120_000
    while (!(await healthy()).ok) {
      if (Date.now() > deadline) {
        killTree(started)
        fail('dev did not become healthy within 120s')
      }
      await new Promise((r) => setTimeout(r, 2000))
    }
  }
  const workers = args.some((a) => a.startsWith('--workers'))
    ? []
    : [`--workers=${process.env.E2E_WORKERS ?? '1'}`]
  const status = run('pnpm', ['exec', 'playwright', 'test', ...workers, ...args], {
    env,
    allowFail: true,
  })
  if (started) killTree(started)
  process.exit(status.status ?? 1)
}

// -------------------------------------------------------------- dispatch

const [command, ...rest] = process.argv.slice(2)
switch (command) {
  case 'env':
    cmdEnv()
    break
  case 'env:up':
    cmdEnvUp()
    break
  case 'env:down':
    cmdEnvDown()
    break
  case 'env:reset':
    await cmdEnvReset()
    break
  case 'dev':
    cmdDev()
    break
  case 'health':
    await cmdHealth()
    break
  case 'test:db':
    cmdTestDb()
    break
  case 'gen:types':
    cmdGenTypes()
    break
  case 'e2e':
    await cmdE2e(rest)
    break
  case 'ports':
    console.log(JSON.stringify({ slot: slot(), ...ports() }))
    break
  case 'destroy':
    cmdEnvDown()
    rmSync(satelliteDir(slot()), { recursive: true, force: true })
    break
  default:
    fail(`unknown command "${command ?? ''}"; see the header of scripts/factory/factory.mjs`)
}
