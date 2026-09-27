import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = createAdminClient()
  const { error } = await supabase.from('profiles').select('id').limit(1)

  if (error) {
    return NextResponse.json({ ok: false, db: false, error: error.message }, { status: 503 })
  }

  return NextResponse.json({ ok: true, db: true })
}
