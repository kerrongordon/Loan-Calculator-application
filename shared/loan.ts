import { z } from 'zod'

export const loanCalculatorInputSchema = z.object({
  principal: z.coerce.number().positive('Principal must be greater than 0.'),
  interestRate: z.coerce
    .number()
    .min(0, 'Interest rate cannot be negative.')
    .max(100, 'Interest rate cannot exceed 100%.'),
  termMonths: z.coerce.number().int('Term must be a whole number.').positive('Term must be greater than 0.')
})

export const consolidationLoanSchema = z.object({
  principal: z.coerce.number().positive('Principal must be greater than 0.'),
  interestRate: z.coerce
    .number()
    .min(0, 'Interest rate cannot be negative.')
    .max(100, 'Interest rate cannot exceed 100%.'),
  remainingTermMonths: z.coerce
    .number()
    .int('Remaining term must be a whole number.')
    .positive('Remaining term must be greater than 0.')
})

export const consolidationInputSchema = z.object({
  label: z.string().trim().max(80, 'Label cannot exceed 80 characters.').optional(),
  loans: z.array(consolidationLoanSchema).min(2, 'Add at least 2 loans.'),
  newTermMonths: z.coerce
    .number()
    .int('New term must be a whole number.')
    .positive('New term must be greater than 0.')
})

export const amortizationRowSchema = z.object({
  month: z.number().int().positive(),
  payment: z.number(),
  principal: z.number(),
  interest: z.number(),
  balance: z.number()
})

export const loanCalculationResultSchema = loanCalculatorInputSchema.extend({
  monthlyPayment: z.number(),
  totalPayment: z.number(),
  totalInterest: z.number(),
  amortization: z.array(amortizationRowSchema)
})

export const consolidationResultSchema = consolidationInputSchema.extend({
  totalConsolidatedPrincipal: z.number(),
  weightedAverageInterestRate: z.number(),
  suggestedTermMonths: z.number().int().positive(),
  monthlyPayment: z.number(),
  totalPayment: z.number(),
  totalInterest: z.number(),
  currentMonthlyPayments: z.number(),
  currentTotalInterest: z.number(),
  interestDelta: z.number(),
  monthlyPaymentDelta: z.number(),
  amortization: z.array(amortizationRowSchema)
})

export type LoanCalculatorInput = z.infer<typeof loanCalculatorInputSchema>
export type ConsolidationLoanInput = z.infer<typeof consolidationLoanSchema>
export type ConsolidationInput = z.infer<typeof consolidationInputSchema>
export type AmortizationRow = z.infer<typeof amortizationRowSchema>
export type LoanCalculationResult = z.infer<typeof loanCalculationResultSchema>
export type ConsolidationResult = z.infer<typeof consolidationResultSchema>

export const zodFieldErrors = (error: z.ZodError): Record<string, string> => {
  const flattened = error.flatten().fieldErrors
  const entries = Object.entries(flattened)
    .filter((entry): entry is [string, string[]] => Array.isArray(entry[1]) && entry[1].length > 0)
    .map(([key, value]) => [key, value[0] ?? 'Invalid value'])

  return Object.fromEntries(entries)
}
