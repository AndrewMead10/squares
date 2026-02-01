import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import type { Env } from '../types'
import { createDb } from '../db'
import * as schema from '../db/schema'

export function createAuth(env: Env) {
  const db = createDb(env.DB)
  const trustedOrigins = new Set(['http://localhost:5173', 'http://localhost:5174'])

  if (env.BETTER_AUTH_URL) {
    try {
      trustedOrigins.add(new URL(env.BETTER_AUTH_URL).origin)
    } catch {
      // Ignore invalid URLs to avoid breaking auth init.
    }
  }

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
      },
    }),
    basePath: '/api/auth',
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: Array.from(trustedOrigins),
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
