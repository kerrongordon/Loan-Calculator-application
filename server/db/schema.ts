import { integer, jsonb, numeric, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'
import type { AmortizationRow, ConsolidationLoanInput } from '~~/shared/loan'

export const calculations = pgTable('calculations', {
  id: serial('id').primaryKey(),
  principal: numeric('principal', { precision: 14, scale: 2, mode: 'number' }).notNull(),
  interestRate: numeric('interest_rate', { precision: 7, scale: 4, mode: 'number' }).notNull(),
  termMonths: integer('term_months').notNull(),
  monthlyPayment: numeric('monthly_payment', { precision: 14, scale: 2, mode: 'number' }).notNull(),
  totalPayment: numeric('total_payment', { precision: 14, scale: 2, mode: 'number' }).notNull(),
  totalInterest: numeric('total_interest', { precision: 14, scale: 2, mode: 'number' }).notNull(),
  amortization: jsonb('amortization').$type<AmortizationRow[]>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
})

export const consolidations = pgTable('consolidations', {
  id: serial('id').primaryKey(),
  label: text('label'),
  loans: jsonb('loans').$type<ConsolidationLoanInput[]>().notNull(),
  totalConsolidatedPrincipal: numeric('total_consolidated_principal', {
    precision: 14,
    scale: 2,
    mode: 'number'
  }).notNull(),
  weightedAverageInterestRate: numeric('weighted_average_interest_rate', {
    precision: 7,
    scale: 4,
    mode: 'number'
  }).notNull(),
  newTermMonths: integer('new_term_months').notNull(),
  suggestedTermMonths: integer('suggested_term_months').notNull(),
  monthlyPayment: numeric('monthly_payment', { precision: 14, scale: 2, mode: 'number' }).notNull(),
  totalPayment: numeric('total_payment', { precision: 14, scale: 2, mode: 'number' }).notNull(),
  totalInterest: numeric('total_interest', { precision: 14, scale: 2, mode: 'number' }).notNull(),
  currentMonthlyPayments: numeric('current_monthly_payments', {
    precision: 14,
    scale: 2,
    mode: 'number'
  }).notNull(),
  currentTotalInterest: numeric('current_total_interest', {
    precision: 14,
    scale: 2,
    mode: 'number'
  }).notNull(),
  interestDelta: numeric('interest_delta', { precision: 14, scale: 2, mode: 'number' }).notNull(),
  monthlyPaymentDelta: numeric('monthly_payment_delta', { precision: 14, scale: 2, mode: 'number' }).notNull(),
  amortization: jsonb('amortization').$type<AmortizationRow[]>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
})
