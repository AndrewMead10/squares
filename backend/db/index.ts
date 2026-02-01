import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'

// For D1 (SQLite):
// The DB binding comes from wrangler.toml and is passed via env
// In your route handlers, access it like: const db = createDb(c.env.DB)

export function createDb(d1: D1Database) {
  return drizzle(d1, { schema })
}

// For PlanetScale via Hyperdrive:
// import { drizzle } from 'drizzle-orm/mysql2'
// import mysql from 'mysql2/promise'
//
// export function createDb(hyperdrive: Hyperdrive) {
//   const connection = mysql.createPool({
//     uri: hyperdrive.connectionString
//   })
//   return drizzle(connection, { schema, mode: 'default' })
// }

// Export a placeholder for type inference (actual db is created per-request)
export type Database = ReturnType<typeof createDb>

// This is a placeholder that will be replaced at runtime
// For now, we export a dummy for the auth adapter
export const db = null as unknown as Database
