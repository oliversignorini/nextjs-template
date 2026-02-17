/**
 * Dynamic Open Graph image.
 *
 * Generates a 1200x630 OG image using Next.js `ImageResponse`. Uses the
 * brand-900 background with white text displaying the app name.
 */

import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'App Template'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            letterSpacing: '-0.025em',
            marginBottom: 16,
          }}
        >
          App Template
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 400,
            color: '#94a3b8',
          }}
        >
          Production-ready Next.js application template
        </div>
      </div>
    ),
    { ...size },
  )
}
