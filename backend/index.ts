import { Hono } from 'hono'
import { axiomMiddleware } from './lib/axiom'
import { cspHeaders } from './middleware/csp'
import { createAuth } from './lib/auth'
import type { Env, Variables } from './types'

// Page routes
import indexPage from './pages/index'
import loginPage from './pages/login'
import logoutPage from './pages/logout'
import appPage from './pages/app/index'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()
  // Global middleware
  .use('*', axiomMiddleware)
  .use('*', cspHeaders)
  // Better Auth routes
  .on(['GET', 'POST'], '/api/auth/*', (c) => {
    const auth = createAuth(c.env)
    return auth.handler(c.req.raw)
  })
  // Mount page routes
  .route('/api/pages/index', indexPage)
  .route('/api/pages/login', loginPage)
  .route('/api/pages/logout', logoutPage)
  .route('/api/pages/app', appPage)
  // Health check
  .get('/api/health', (c) => c.json({ status: 'ok' }))

// Export app type for RPC client
export type AppType = typeof app

export default app
