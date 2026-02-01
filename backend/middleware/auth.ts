import { createMiddleware } from 'hono/factory'
import { createAuth } from '../lib/auth'
import { apiError, ErrorCodes } from '../lib/errors'
import type { Env, Variables } from '../types'

export const requireAuth = createMiddleware<{
  Bindings: Env
  Variables: Variables
}>(async (c, next) => {
  const auth = createAuth(c.env)
  const session = await auth.api.getSession({ headers: c.req.raw.headers })

  if (!session) {
    return c.json(apiError(ErrorCodes.UNAUTHORIZED, 'Authentication required'), 401)
  }

  c.set('user', session.user)
  c.set('session', session.session)
  await next()
})
