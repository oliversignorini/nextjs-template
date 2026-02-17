/**
 * Root middleware — runs on every matched request.
 *
 * Combines three concerns:
 * 1. Rate limiting for `/api/*` routes (skips webhooks).
 * 2. Supabase session refresh (keeps auth tokens alive).
 * 3. Route protection for `/dashboard/*` (redirects if unauthenticated).
 *
 * When Supabase is not configured, dummy auth checks use a simple cookie
 * to gate dashboard access.
 */

import { type NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { isSupabaseConfigured } from '@/lib/env'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // -----------------------------------------------------------------------
  // Rate limiting for API routes (skip webhooks — they verify signatures)
  // -----------------------------------------------------------------------
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/webhooks/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? 'anonymous'
    const result = rateLimit(ip)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(result.limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(result.reset),
          },
        },
      )
    }
  }

  // -----------------------------------------------------------------------
  // Supabase session refresh + route protection
  // -----------------------------------------------------------------------
  if (isSupabaseConfigured()) {
    return updateSession(request)
  } else if (pathname.startsWith('/dashboard')) {
    const hasAuth = request.cookies.get('app-template-session')
    if (!hasAuth) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - Static assets (svg, png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
