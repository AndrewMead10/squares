import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { axiomMiddleware } from './lib/axiom'
import { cspHeaders } from './middleware/csp'
import { createAuth } from './lib/auth'
import type { Env, Variables } from './types'

// Page routes
import indexPage from './pages/index'
import loginPage from './pages/login'
import logoutPage from './pages/logout'
import managePage from './pages/manage/index'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()
  // Global middleware
  .use('*', axiomMiddleware)
  .use('*', cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  }))
  .use('*', cspHeaders)
  // Better Auth routes
  .on(['GET', 'POST', 'OPTIONS'], '/api/auth/*', async (c) => {
    try {
      const auth = createAuth(c.env)
      return await auth.handler(c.req.raw)
    } catch (e) {
      console.error('Auth error:', e)
      return c.json({ error: String(e) }, 500)
    }
  })
  // Mount page routes
  .route('/api/pages/index', indexPage)
  .route('/api/pages/login', loginPage)
  .route('/api/pages/logout', logoutPage)
  .route('/api/pages/manage', managePage)
  // Health check
  .get('/api/health', (c) => c.json({ status: 'ok' }))

// Export app type for RPC client
export type AppType = typeof app

export default app
