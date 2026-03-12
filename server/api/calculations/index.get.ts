import { desc } from 'drizzle-orm'
import { calculations } from '~~/server/db/schema'
import { db } from '~~/server/utils/db'

export default defineEventHandler(async () => {
  return db.select().from(calculations).orderBy(desc(calculations.createdAt)).limit(50)
})
