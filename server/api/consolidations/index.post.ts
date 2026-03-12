import { consolidations } from '~~/server/db/schema'
import { db } from '~~/server/utils/db'
import { consolidationResultSchema } from '~~/shared/loan'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = consolidationResultSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? 'Invalid consolidation payload.'
    })
  }

  await db.insert(consolidations).values({
    label: parsed.data.label?.trim() ? parsed.data.label.trim() : null,
    loans: parsed.data.loans,
    totalConsolidatedPrincipal: parsed.data.totalConsolidatedPrincipal,
    weightedAverageInterestRate: parsed.data.weightedAverageInterestRate,
    newTermMonths: parsed.data.newTermMonths,
    suggestedTermMonths: parsed.data.suggestedTermMonths,
    monthlyPayment: parsed.data.monthlyPayment,
    totalPayment: parsed.data.totalPayment,
    totalInterest: parsed.data.totalInterest,
    currentMonthlyPayments: parsed.data.currentMonthlyPayments,
    currentTotalInterest: parsed.data.currentTotalInterest,
    interestDelta: parsed.data.interestDelta,
    monthlyPaymentDelta: parsed.data.monthlyPaymentDelta,
    amortization: parsed.data.amortization
  })

  return { ok: true }
})
