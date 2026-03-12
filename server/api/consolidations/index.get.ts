import { desc } from 'drizzle-orm'
import { consolidations } from '~~/server/db/schema'
import { db } from '~~/server/utils/db'

export default defineEventHandler(async () => {
  return db.select().from(consolidations).orderBy(desc(consolidations.createdAt)).limit(50)
})
