import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getAuthedServerClient } from '@/lib/api/auth'
import { getOwnProfile } from '@/lib/profiles/service'
import { signOut } from '@/app/(app)/actions'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let supabase, user
  try {
    ;({ supabase, user } = await getAuthedServerClient())
  } catch {
    redirect('/login')
  }
  const profile = await getOwnProfile(supabase, user.id)

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <nav className="flex items-center gap-4">
          <span className="font-semibold">notes</span>
          {profile.role === 'admin' ? (
            <a href="/notes" className="text-sm text-muted-foreground hover:text-foreground">
              All notes (admin)
            </a>
          ) : null}
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{profile.email}</span>
          <Badge variant="secondary">{profile.role}</Badge>
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
