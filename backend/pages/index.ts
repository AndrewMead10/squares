import { Hono } from 'hono'
import { apiSuccess } from '../lib/errors'
import type { Env, Variables } from '../types'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()
  // Landing page data endpoint
  .get('/data', async (c) => {
    return c.json(apiSuccess({
      title: 'Welcome to Cloudflare App',
      description: 'A full-stack web application template'
    }))
  })

export default app
