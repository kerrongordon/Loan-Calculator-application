import { computed, ref } from 'vue'
import { useStorage } from '@vueuse/core'
import {
  loanCalculationResultSchema,
  type LoanCalculationResult,
  loanCalculatorInputSchema,
  type LoanCalculatorInput
} from '~~/shared/loan'

type LoanCalculationHistoryItem = LoanCalculationResult & {
  id: number
  createdAt: string
}

export const useLoanCalculator = () => {
  const { calculateTotals, buildAmortizationSchedule } = useLoanMath()

  const latestResult = useState<LoanCalculationResult | null>('loan-calculator/latest', () => null)
  const history = useStorage<LoanCalculationHistoryItem[]>('loan-calculator/history', [])
  const isLoadingHistory = ref(false)
  const isSaving = ref(false)

  const calculate = (rawInput: LoanCalculatorInput): LoanCalculationResult => {
    const input = loanCalculatorInputSchema.parse(rawInput)
    const totals = calculateTotals(input.principal, input.interestRate, input.termMonths)
    
    const extraPayment = input.extraMonthlyPayment || 0
    const amortization = buildAmortizationSchedule(
      input.principal,
      input.interestRate,
      input.termMonths,
      totals.monthlyPayment,
      extraPayment
    )

    const actualTermMonths = amortization.length
    const actualTotalPayment = amortization.reduce((sum, row) => sum + row.payment, 0)
    const actualTotalInterest = amortization.reduce((sum, row) => sum + row.interest, 0)
    const interestSaved = totals.totalInterest - actualTotalInterest

    const result = loanCalculationResultSchema.parse({
      ...input,
      monthlyPayment: totals.monthlyPayment,
      totalPayment: actualTotalPayment,
      totalInterest: actualTotalInterest,
      actualTermMonths,
      interestSaved: Math.max(0, interestSaved),
      amortization
    })

    latestResult.value = result

    return result
  }

  const save = async (result: LoanCalculationResult): Promise<void> => {
    isSaving.value = true

    try {
      const entry: LoanCalculationHistoryItem = {
        ...result,
        id: Date.now(),
        createdAt: new Date().toISOString()
      }
      history.value = [entry, ...history.value].slice(0, 100)
    } finally {
      isSaving.value = false
    }
  }

  const loadHistory = async (): Promise<void> => {
    isLoadingHistory.value = true

    try {
      if (!Array.isArray(history.value)) {
        history.value = []
      }
    } finally {
      isLoadingHistory.value = false
    }
  }

  const removeHistoryItem = (id: number): void => {
    history.value = history.value.filter((item) => item.id !== id)
  }

  const clearHistory = (): void => {
    history.value = []
  }

  const hasHistory = computed(() => history.value.length > 0)

  return {
    latestResult,
    history,
    hasHistory,
    isLoadingHistory,
    isSaving,
    calculate,
    save,
    loadHistory,
    removeHistoryItem,
    clearHistory
  }
}
