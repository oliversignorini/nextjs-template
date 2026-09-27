import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import { plugin as shadcn } from '@shadcn/lint'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'openapi.json', '.factory/**']),
  // Design-system guard (software-factory profile): app code composes
  // components/ui + the theme tokens in app/globals.css instead of
  // restyling them or reaching for raw colours / arbitrary values.
  // components/ui itself defines the primitives, so it is exempt.
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: ['components/ui/**'],
    plugins: { shadcn },
    settings: {
      shadcn: {
        ui: '@/components/ui',
        note: 'Use components/ui + app/globals.css tokens; see AGENTS.md > Design system.',
      },
    },
    rules: {
      'shadcn/no-restyle': 'error',
      'shadcn/no-raw-colors': 'error',
      'shadcn/no-arbitrary-values': 'error',
      'shadcn/no-inline-styles': 'error',
      'shadcn/no-unknown-classes': 'error',
      'shadcn/require-static-classes': 'error',
    },
  },
  // API-first guard: no client-side Supabase data access. Everything goes
  // through a service function, called from a Server Component/Action
  // (cookie session) or app/api/v1 (cookie or Bearer) -- see AGENTS.md.
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    // The only sanctioned callers of the Supabase SDKs directly: the client
    // factories themselves, the API-auth helper that builds a bearer-scoped
    // client, every service.ts (typed on SupabaseClient<Database>, but the
    // client itself is always passed in, never created), and the seed
    // script (runs outside the app, over the Admin API).
    ignores: ['lib/supabase/**', 'lib/api/auth.ts', 'lib/*/service.ts', 'scripts/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@supabase/supabase-js',
              message:
                'No client-side Supabase access. Add/extend a lib/<domain>/service.ts instead.',
            },
            {
              name: '@supabase/ssr',
              message:
                'No client-side Supabase access. Add/extend a lib/<domain>/service.ts instead.',
            },
          ],
        },
      ],
    },
  },
])

export default eslintConfig
