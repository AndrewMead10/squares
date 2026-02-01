// Cloudflare Worker environment bindings
export interface Env {
  // Database - D1 (default, run `bun run setup` for PlanetScale)
  DB: D1Database

  // Database - PlanetScale via Hyperdrive (uncomment after setup)
  // HYPERDRIVE: Hyperdrive

  // R2 Storage (optional)
  R2_BUCKET?: R2Bucket
  CF_ACCOUNT_ID?: string
  R2_ACCESS_KEY_ID?: string
  R2_SECRET_ACCESS_KEY?: string
  R2_BUCKET_NAME?: string

  // Auth (required)
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string

  // Logging (optional)
  AXIOM_TOKEN?: string
  AXIOM_DATASET?: string

  // AI (optional)
  OPENAI_API_KEY?: string
}

// Hono context variables set by middleware
export interface Variables {
  user: {
    id: string
    email: string
    name: string | null
  } | null
  session: {
    id: string
    userId: string
    expiresAt: Date
  } | null
}
