import { createMiddleware } from 'hono/factory'
import type { Env, Variables } from '../types'

// Simple request logging middleware for Axiom
// Sends logs to Axiom via their ingest API
export const axiomMiddleware = createMiddleware<{
  Bindings: Env
  Variables: Variables
}>(async (c, next) => {
  const start = Date.now()

  await next()

  const duration = Date.now() - start
  const { AXIOM_TOKEN, AXIOM_DATASET } = c.env

  // Only log if Axiom is configured
  if (AXIOM_TOKEN && AXIOM_DATASET) {
    const logEntry = {
      _time: new Date().toISOString(),
      request: {
        method: c.req.method,
        path: c.req.path,
        url: c.req.url,
      },
      response: {
        status: c.res.status,
        duration,
      },
      cf: c.req.raw.cf,
    }

    // Fire and forget - don't block the response
    c.executionCtx.waitUntil(
      fetch(`https://api.axiom.co/v1/datasets/${AXIOM_DATASET}/ingest`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AXIOM_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([logEntry]),
      }).catch(() => {
        // Silently ignore logging failures
      })
    )
  }
})
