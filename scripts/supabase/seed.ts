#!/usr/bin/env -S pnpm exec tsx
// Demo data for a fresh `pnpm env:reset`: one user per role, plus one demo
// row for the walking-skeleton resource. Idempotent -- safe to re-run.
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceRoleKey) {
  throw new Error(
    'seed: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (run via `pnpm env:reset`)'
  )
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const DEMO_PASSWORD = 'demo-password-123'

const users = [
  { email: 'admin@demo.test', role: 'admin' as const },
  { email: 'member@demo.test', role: 'member' as const },
  { email: 'member2@demo.test', role: 'member' as const },
]

async function ensureUser(email: string, role: 'admin' | 'member') {
  const { data: existing } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const found = existing?.users.find((u) => u.email === email)
  if (found) return found

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { role },
  })
  if (error) throw error
  return data.user
}

async function main() {
  const created: Record<string, string> = {}
  for (const { email, role } of users) {
    const user = await ensureUser(email, role)
    created[email] = user.id
    console.log(`seed: ${email} (${role}) -> ${user.id}`)
  }

  const memberId = created['member@demo.test']!
  const { data: existingNote } = await admin
    .from('notes')
    .select('id')
    .eq('user_id', memberId)
    .limit(1)
    .maybeSingle()
  if (!existingNote) {
    const { error } = await admin
      .from('notes')
      .insert({ user_id: memberId, title: 'Welcome', body: 'This is the seeded demo note.' })
    if (error) throw error
    console.log('seed: created demo note for member@demo.test')
  }

  console.log(`seed: done. Every demo user's password is "${DEMO_PASSWORD}".`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
