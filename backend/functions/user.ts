import { eq } from 'drizzle-orm'
import { users } from '../db/schema'
import type { Database } from '../db'

export async function getUserById(db: Database, id: string) {
  return db.query.users.findFirst({
    where: eq(users.id, id)
  })
}

export async function updateUserProfile(db: Database, id: string, data: { name: string }) {
  return db.update(users)
    .set(data)
    .where(eq(users.id, id))
    .returning()
}

export async function createUser(db: Database, data: { id: string; email: string; name?: string }) {
  return db.insert(users)
    .values(data)
    .returning()
}
