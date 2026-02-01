import { Hono } from 'hono'
import { apiSuccess } from '../lib/errors'
import type { Env, Variables } from '../types'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()
  // Logout page data (onLoad)
  .get('/data', async (c) => {
    return c.json(apiSuccess({
      message: 'Are you sure you want to log out?'
    }))
  })
  // Handle logout action (onSubmit)
  // Note: For OAuth signout, redirect to BetterAuth's signout endpoint
  .post('/logout', async (c) => {
    // Return redirect URL - the frontend will handle the redirect
    // BetterAuth handles the actual session invalidation
    return c.json(apiSuccess({
      redirectUrl: '/api/auth/signout'
    }))
  })

export default app
