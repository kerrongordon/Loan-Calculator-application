import type { AmortizationRow } from '~~/shared/loan'

const roundMoney = (value: number): number => Math.round(value * 100) / 100

export const useLoanMath = () => {
  const calculateMonthlyPayment = (principal: number, annualRate: number, termMonths: number): number => {
    if (annualRate === 0) {
      return roundMoney(principal / termMonths)
    }

    const monthlyRate = annualRate / 100 / 12
    const power = (1 + monthlyRate) ** termMonths
    const payment = (principal * monthlyRate * power) / (power - 1)

    return roundMoney(payment)
  }

  const calculateTotals = (
    principal: number,
    annualRate: number,
    termMonths: number
  ): { monthlyPayment: number; totalPayment: number; totalInterest: number } => {
    const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths)
    const totalPayment = roundMoney(monthlyPayment * termMonths)
    const totalInterest = roundMoney(totalPayment - principal)

    return {
      monthlyPayment,
      totalPayment,
      totalInterest
    }
  }

  const buildAmortizationSchedule = (
    principal: number,
    annualRate: number,
    termMonths: number,
    baseMonthlyPayment: number,
    extraMonthlyPayment: number = 0
  ): AmortizationRow[] => {
    const rows: AmortizationRow[] = []
    const monthlyRate = annualRate / 100 / 12
    let balance = principal
    let month = 1

    while (balance > 0 && month <= termMonths * 5) { // Cap at 5x term to prevent infinite loops in weird scenarios
      const interestPayment = monthlyRate === 0 ? 0 : balance * monthlyRate
      let principalPayment = baseMonthlyPayment - interestPayment + extraMonthlyPayment

      if (principalPayment > balance) {
        principalPayment = balance
      }

      const payment = roundMoney(principalPayment + interestPayment)
      balance = roundMoney(balance - principalPayment)

      rows.push({
        month,
        payment,
        principal: roundMoney(principalPayment),
        interest: roundMoney(interestPayment),
        balance: Math.max(balance, 0)
      })
      month++
    }

    return rows
  }

  return {
    calculateMonthlyPayment,
    calculateTotals,
    buildAmortizationSchedule
  }
}
