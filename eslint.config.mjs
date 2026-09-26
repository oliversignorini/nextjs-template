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
])

export default eslintConfig
