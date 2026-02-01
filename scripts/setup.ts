#!/usr/bin/env bun

import * as readline from "readline"
import { writeFileSync } from "fs"
import { join } from "path"

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim())
    })
  })
}

async function main() {
  console.log("\n========================================")
  console.log("  Cloudflare Web App Template Setup")
  console.log("========================================\n")

  // Database choice
  console.log("Choose your database:\n")
  console.log("  1. Cloudflare D1 (SQLite-based, serverless, integrated with Cloudflare)")
  console.log("  2. PlanetScale (MySQL-compatible, uses Hyperdrive for connection pooling)")
  console.log("")

  let dbChoice = ""
  while (dbChoice !== "1" && dbChoice !== "2") {
    dbChoice = await prompt("Enter your choice (1 or 2): ")
    if (dbChoice !== "1" && dbChoice !== "2") {
      console.log("Please enter 1 or 2.")
    }
  }

  const isD1 = dbChoice === "1"
  const dbName = isD1 ? "Cloudflare D1" : "PlanetScale"
  console.log(`\nYou selected: ${dbName}\n`)

  const backendDir = join(import.meta.dir, "..", "backend")

  // Update wrangler.toml
  updateWranglerToml(backendDir, isD1)

  // Update drizzle.config.ts
  updateDrizzleConfig(backendDir, isD1)

  // Update db/schema.ts with BetterAuth tables
  updateDbSchema(backendDir, isD1)

  // Update db/index.ts
  updateDbIndex(backendDir, isD1)

  // Update types.ts
  updateTypes(backendDir, isD1)

  // Update lib/auth.ts
  updateAuthConfig(backendDir, isD1)

  console.log("\n========================================")
  console.log("  Setup Complete!")
  console.log("========================================\n")

  console.log("Next steps:\n")
  console.log("  1. Copy env.example to .dev.vars in the root and fill in your values:")
  console.log("     cp env.example .dev.vars\n")

  if (isD1) {
    console.log("  2. Create your D1 database:")
    console.log("     cd backend && wrangler d1 create your-app-db\n")
    console.log("  3. Update backend/wrangler.toml with your D1 database ID\n")
    console.log("  4. Push your schema:")
    console.log("     bun run db:push\n")
  } else {
    console.log("  2. Create your PlanetScale database and get your connection string\n")
    console.log("  3. Create a Hyperdrive config:")
    console.log("     cd backend && wrangler hyperdrive create your-hyperdrive --connection-string=\"your-planetscale-url\"\n")
    console.log("  4. Update backend/wrangler.toml with your Hyperdrive ID\n")
    console.log("  5. Push your schema:")
    console.log("     bun run db:push\n")
  }

  console.log("  Then start development:")
  console.log("     bun run dev\n")

  rl.close()
}

function updateWranglerToml(backendDir: string, isD1: boolean) {
  const wranglerPath = join(backendDir, "wrangler.toml")

  const d1Config = `name = "cloudflare-app"
main = "index.ts"
compatibility_date = "2024-11-01"
compatibility_flags = ["nodejs_compat"]

# D1 Database
[[d1_databases]]
binding = "DB"
database_name = "your-app-db"
database_id = "your-database-id"  # Get this from: wrangler d1 create your-app-db

# R2 Bucket (optional)
# [[r2_buckets]]
# binding = "R2_BUCKET"
# bucket_name = "your-bucket-name"

[vars]
# Non-secret environment variables
# ENVIRONMENT = "development"
`

  const planetscaleConfig = `name = "cloudflare-app"
main = "index.ts"
compatibility_date = "2024-11-01"
compatibility_flags = ["nodejs_compat"]

# PlanetScale via Hyperdrive
[[hyperdrive]]
binding = "HYPERDRIVE"
id = "your-hyperdrive-id"  # Get this from: wrangler hyperdrive create your-hyperdrive --connection-string="..."

# R2 Bucket (optional)
# [[r2_buckets]]
# binding = "R2_BUCKET"
# bucket_name = "your-bucket-name"

[vars]
# Non-secret environment variables
# ENVIRONMENT = "development"
`

  const config = isD1 ? d1Config : planetscaleConfig
  writeFileSync(wranglerPath, config)
  console.log(`Updated: ${wranglerPath}`)
}

function updateDrizzleConfig(backendDir: string, isD1: boolean) {
  const drizzlePath = join(backendDir, "drizzle.config.ts")

  const d1Config = `import type { Config } from "drizzle-kit"

export default {
  schema: "./db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: process.env.CF_ACCOUNT_ID!,
    databaseId: process.env.D1_DATABASE_ID!,
    token: process.env.CF_API_TOKEN!,
  },
} satisfies Config
`

  const planetscaleConfig = `import type { Config } from "drizzle-kit"

export default {
  schema: "./db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config
`

  const config = isD1 ? d1Config : planetscaleConfig
  writeFileSync(drizzlePath, config)
  console.log(`Updated: ${drizzlePath}`)
}

function updateDbSchema(backendDir: string, isD1: boolean) {
  const schemaPath = join(backendDir, "db", "schema.ts")

  const d1Schema = `import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"

// BetterAuth required tables
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
})

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  idToken: text("id_token"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const verifications = sqliteTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
`

  const planetscaleSchema = `import { mysqlTable, varchar, boolean, datetime, text } from "drizzle-orm/mysql-core"

// BetterAuth required tables
export const users = mysqlTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: datetime("created_at")
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: datetime("updated_at")
    .notNull()
    .$defaultFn(() => new Date()),
})

export const sessions = mysqlTable("sessions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: datetime("expires_at").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  createdAt: datetime("created_at")
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: datetime("updated_at")
    .notNull()
    .$defaultFn(() => new Date()),
  ipAddress: varchar("ip_address", { length: 255 }),
  userAgent: text("user_agent"),
})

export const accounts = mysqlTable("accounts", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: varchar("account_id", { length: 255 }).notNull(),
  providerId: varchar("provider_id", { length: 255 }).notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: datetime("access_token_expires_at"),
  refreshTokenExpiresAt: datetime("refresh_token_expires_at"),
  scope: varchar("scope", { length: 255 }),
  idToken: text("id_token"),
  createdAt: datetime("created_at")
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: datetime("updated_at")
    .notNull()
    .$defaultFn(() => new Date()),
})

export const verifications = mysqlTable("verifications", {
  id: varchar("id", { length: 255 }).primaryKey(),
  identifier: varchar("identifier", { length: 255 }).notNull(),
  value: text("value").notNull(),
  expiresAt: datetime("expires_at").notNull(),
  createdAt: datetime("created_at")
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: datetime("updated_at")
    .notNull()
    .$defaultFn(() => new Date()),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
`

  const schema = isD1 ? d1Schema : planetscaleSchema
  writeFileSync(schemaPath, schema)
  console.log(`Updated: ${schemaPath}`)
}

function updateDbIndex(backendDir: string, isD1: boolean) {
  const indexPath = join(backendDir, "db", "index.ts")

  // Both use the same createDb(binding) signature to match the existing code
  const d1Index = `import { drizzle } from "drizzle-orm/d1"
import * as schema from "./schema"

export function createDb(d1: D1Database) {
  return drizzle(d1, { schema })
}

export type Database = ReturnType<typeof createDb>
`

  const planetscaleIndex = `import { drizzle } from "drizzle-orm/mysql2"
import mysql from "mysql2/promise"
import * as schema from "./schema"

export function createDb(hyperdrive: Hyperdrive) {
  const connection = mysql.createPool({
    uri: hyperdrive.connectionString,
  })
  return drizzle(connection, { schema, mode: "default" })
}

export type Database = ReturnType<typeof createDb>
`

  const index = isD1 ? d1Index : planetscaleIndex
  writeFileSync(indexPath, index)
  console.log(`Updated: ${indexPath}`)
}

function updateTypes(backendDir: string, isD1: boolean) {
  const typesPath = join(backendDir, "types.ts")

  const d1Types = `// Cloudflare Worker environment bindings - D1 configuration
export interface Env {
  // Database - D1
  DB: D1Database

  // R2 Storage (optional)
  R2_BUCKET?: R2Bucket
  CF_ACCOUNT_ID?: string
  R2_ACCESS_KEY_ID?: string
  R2_SECRET_ACCESS_KEY?: string
  R2_BUCKET_NAME?: string

  // Auth
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
`

  const planetscaleTypes = `// Cloudflare Worker environment bindings - PlanetScale configuration
export interface Env {
  // Database - PlanetScale via Hyperdrive
  HYPERDRIVE: Hyperdrive

  // R2 Storage (optional)
  R2_BUCKET?: R2Bucket
  CF_ACCOUNT_ID?: string
  R2_ACCESS_KEY_ID?: string
  R2_SECRET_ACCESS_KEY?: string
  R2_BUCKET_NAME?: string

  // Auth
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
`

  const types = isD1 ? d1Types : planetscaleTypes
  writeFileSync(typesPath, types)
  console.log(`Updated: ${typesPath}`)
}

function updateAuthConfig(backendDir: string, isD1: boolean) {
  const authPath = join(backendDir, "lib", "auth.ts")

  // Both use createAuth(env) to match the existing code pattern
  const d1Auth = `import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import type { Env } from "../types"
import { createDb } from "../db"

export function createAuth(env: Env) {
  const db = createDb(env.DB)

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
    }),
    basePath: "/api/auth",
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5, // 5 minutes
      },
    },
  })
}

export type Auth = ReturnType<typeof createAuth>
`

  const planetscaleAuth = `import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import type { Env } from "../types"
import { createDb } from "../db"

export function createAuth(env: Env) {
  const db = createDb(env.HYPERDRIVE)

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "mysql",
    }),
    basePath: "/api/auth",
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5, // 5 minutes
      },
    },
  })
}

export type Auth = ReturnType<typeof createAuth>
`

  const auth = isD1 ? d1Auth : planetscaleAuth
  writeFileSync(authPath, auth)
  console.log(`Updated: ${authPath}`)
}

main().catch(console.error)
