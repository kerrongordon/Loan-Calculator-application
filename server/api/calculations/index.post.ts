import { calculations } from '~~/server/db/schema'
import { db } from '~~/server/utils/db'
import { loanCalculationResultSchema } from '~~/shared/loan'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = loanCalculationResultSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? 'Invalid calculation payload.'
    })
  }

  await db.insert(calculations).values({
    principal: parsed.data.principal,
    interestRate: parsed.data.interestRate,
    termMonths: parsed.data.termMonths,
    monthlyPayment: parsed.data.monthlyPayment,
    totalPayment: parsed.data.totalPayment,
    totalInterest: parsed.data.totalInterest,
    amortization: parsed.data.amortization
  })

  return { ok: true }
})
