import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

const accountId = process.env.CF_ACCOUNT_ID
const databaseId = process.env.D1_DATABASE_ID
const token = process.env.CF_API_TOKEN

const dbCredentials =
  accountId && databaseId && token
    ? { accountId, databaseId, token }
    : undefined

export default defineConfig({
  schema: './db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials,
})
