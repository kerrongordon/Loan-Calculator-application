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
    monthlyPayment: number
  ): AmortizationRow[] => {
    const rows: AmortizationRow[] = []
    const monthlyRate = annualRate / 100 / 12
    let balance = principal

    for (let month = 1; month <= termMonths; month += 1) {
      const interestPayment = monthlyRate === 0 ? 0 : balance * monthlyRate
      let principalPayment = monthlyPayment - interestPayment

      if (month === termMonths || principalPayment > balance) {
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
    }

    return rows
  }

  return {
    calculateMonthlyPayment,
    calculateTotals,
    buildAmortizationSchedule
  }
}
