import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { apiSuccess } from '../../lib/errors'
import { requireAuth } from '../../middleware/auth'
import type { Env, Variables } from '../../types'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()
  // Apply auth middleware to all routes in this file
  .use('/*', requireAuth)
  // Load page data (onLoad)
  .get('/data', async (c) => {
    const user = c.get('user')
    return c.json(apiSuccess({
      user,
      items: []
    }))
  })
  // Handle profile update (onSubmit)
  .post('/update-profile',
    zValidator('json', z.object({
      name: z.string().min(1).max(100),
    })),
    async (c) => {
      const body = c.req.valid('json')
      // TODO: Update user profile in database
      // const user = c.get('user')
      // await updateUserProfile(user.id, body)
      return c.json(apiSuccess({ updated: true, name: body.name }))
    }
  )

export default app
