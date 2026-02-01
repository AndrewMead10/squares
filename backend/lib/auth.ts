import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import type { Env } from '../types'
import { createDb } from '../db'

// Create auth instance for a specific request context
// Better Auth needs to be instantiated per-request to access env bindings
export function createAuth(env: Env) {
  const db = createDb(env.DB)

  return betterAuth({
    database: drizzleAdapter(db, {
      // Use 'sqlite' for D1
      // Use 'mysql' for PlanetScale
      provider: 'sqlite'
    }),
    basePath: '/api/auth',
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      }
    },
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5 // 5 minutes
      }
    }
  })
}

export type Auth = ReturnType<typeof createAuth>
