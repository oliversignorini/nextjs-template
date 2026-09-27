// Vitest runs everything in one process (no client/server bundle split), so
// the real `server-only` package's throw-on-client-import guard doesn't
// apply here. Aliased in vitest.config.ts.
export {}
