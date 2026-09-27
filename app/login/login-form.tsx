'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sendMagicLink, signInWithPassword } from '@/app/login/actions'

export function LoginForm({ next }: { next?: string }) {
  const [passwordState, passwordAction, passwordPending] = useActionState(
    signInWithPassword,
    undefined
  )
  const [magicState, magicAction, magicPending] = useActionState(sendMagicLink, undefined)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Email + password, or a magic link via Mailpit locally.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          <form action={passwordAction} className="flex flex-col gap-4">
            {next ? <input type="hidden" name="next" value={next} /> : null}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            {passwordState?.error ? (
              <p role="alert" className="text-sm text-destructive">
                {passwordState.error}
              </p>
            ) : null}
            <Button type="submit" disabled={passwordPending}>
              {passwordPending ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <form action={magicAction} className="flex flex-col gap-4 border-t pt-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="magic-email">Magic link email</Label>
              <Input id="magic-email" name="email" type="email" autoComplete="email" required />
            </div>
            {magicState?.error ? (
              <p role="alert" className="text-sm text-destructive">
                {magicState.error}
              </p>
            ) : null}
            {magicState?.sent ? (
              <p role="status" className="text-sm text-muted-foreground">
                Check Mailpit for your sign-in link.
              </p>
            ) : null}
            <Button type="submit" variant="secondary" disabled={magicPending}>
              {magicPending ? 'Sending…' : 'Email me a magic link'}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
