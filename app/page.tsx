import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-3xl font-semibold">next-supabase-vercel</h1>
      <p className="max-w-md text-muted-foreground">
        Software-factory stack profile skeleton: Next.js, Supabase Auth/Postgres, RLS, a versioned
        JSON API, and one demo resource end to end.
      </p>
      <Button asChild>
        <Link href="/login">Sign in</Link>
      </Button>
    </main>
  )
}
