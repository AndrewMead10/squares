import { hc } from 'hono/client'
// Note: Type import from backend - requires backend to be built/type-checked first
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { AppType } from '../../../backend'

export const api = hc<AppType>('/')

// Re-export the API client type for use in components
export type { AppType }
