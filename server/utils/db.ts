import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

const DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://loan:loan@localhost:5432/loan_calculator'

const globalForDb = globalThis as typeof globalThis & {
  _pool?: Pool
  _drizzle?: ReturnType<typeof drizzle>
}

const pool = globalForDb._pool ?? new Pool({ connectionString: DATABASE_URL })
const db = globalForDb._drizzle ?? drizzle(pool)

if (process.env.NODE_ENV !== 'production') {
  globalForDb._pool = pool
  globalForDb._drizzle = db
}

export { db }
