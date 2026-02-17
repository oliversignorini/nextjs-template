'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <h2 className="text-2xl font-bold text-brand-900 dark:text-brand-400">
        Dashboard Error
      </h2>
      <p className="mt-4 text-muted-foreground">
        Something went wrong loading this dashboard section.
      </p>
      <Button onClick={reset} className="mt-6 bg-brand-900 hover:bg-brand-700">
        Try Again
      </Button>
    </div>
  )
}
