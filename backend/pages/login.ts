import { Hono } from 'hono'
import { apiSuccess } from '../lib/errors'
import type { Env, Variables } from '../types'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()
  // Login page data (onLoad)
  .get('/data', async (c) => {
    return c.json(apiSuccess({
      providers: ['google'],
      oauthUrl: '/api/auth/signin/google'
    }))
  })
  // Handle login action (onSubmit) - returns OAuth redirect URL
  .post('/login', async (c) => {
    // BetterAuth handles the actual OAuth flow
    // This endpoint just provides a consistent pattern
    return c.json(apiSuccess({
      redirectUrl: '/api/auth/signin/google'
    }))
  })

export default app
