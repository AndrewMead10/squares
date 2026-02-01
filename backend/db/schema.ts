import { sqliteTable, text, integer, unique } from "drizzle-orm/sqlite-core"

// BetterAuth required tables
// Note: Run `bun run setup` to configure for PlanetScale (MySQL) instead

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

// Football Squares tables

export const participants = sqliteTable("participants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  imageKey: text("image_key"),
  squareCount: integer("square_count").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const squares = sqliteTable("squares", {
  id: text("id").primaryKey(),
  row: integer("row").notNull(),
  col: integer("col").notNull(),
  participantId: text("participant_id").references(() => participants.id, { onDelete: "set null" }),
}, (table) => ({
  uniqueRowCol: unique().on(table.row, table.col),
}))

export const gameConfig = sqliteTable("game_config", {
  id: text("id").primaryKey(),
  espnGameId: text("espn_game_id"),
  team1Name: text("team1_name"),
  team2Name: text("team2_name"),
  rowDigits: text("row_digits"), // JSON array of digit assignments for rows
  colDigits: text("col_digits"), // JSON array of digit assignments for cols
  halftimeWinnerParticipantId: text("halftime_winner_participant_id").references(() => participants.id, { onDelete: "set null" }),
  finalWinnerParticipantId: text("final_winner_participant_id").references(() => participants.id, { onDelete: "set null" }),
})

export type Participant = typeof participants.$inferSelect
export type Square = typeof squares.$inferSelect
export type GameConfig = typeof gameConfig.$inferSelect
