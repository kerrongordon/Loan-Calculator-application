import { computed, ref } from 'vue'
import { useStorage } from '@vueuse/core'
import {
  consolidationInputSchema,
  consolidationResultSchema,
  type ConsolidationInput,
  type ConsolidationLoanInput,
  type ConsolidationResult
} from '~~/shared/loan'

const totalBy = (loans: ConsolidationLoanInput[], selector: (loan: ConsolidationLoanInput) => number): number =>
  loans.reduce((total, loan) => total + selector(loan), 0)

type ConsolidationHistoryItem = ConsolidationResult & {
  id: number
  createdAt: string
}

export const useLoanConsolidation = () => {
  const { calculateTotals, buildAmortizationSchedule } = useLoanMath()

  const latestResult = useState<ConsolidationResult | null>('loan-consolidation/latest', () => null)
  const history = useStorage<ConsolidationHistoryItem[]>('loan-consolidation/history', [])
  const isLoadingHistory = ref(false)
  const isSaving = ref(false)

  const calculate = (rawInput: ConsolidationInput): ConsolidationResult => {
    const input = consolidationInputSchema.parse(rawInput)

    const totalConsolidatedPrincipal = totalBy(input.loans, (loan) => loan.principal)
    const weightedAverageInterestRate =
      totalBy(input.loans, (loan) => loan.principal * loan.interestRate) / totalConsolidatedPrincipal

    const suggestedTermMonths = Math.max(
      1,
      Math.round(
        totalBy(input.loans, (loan) => loan.principal * loan.remainingTermMonths) / totalConsolidatedPrincipal
      )
    )

    const currentLoanSummaries = input.loans.map((loan) =>
      calculateTotals(loan.principal, loan.interestRate, loan.remainingTermMonths)
    )

    const currentMonthlyPayments = currentLoanSummaries.reduce(
      (total, summary) => total + summary.monthlyPayment,
      0
    )
    const currentTotalInterest = currentLoanSummaries.reduce(
      (total, summary) => total + summary.totalInterest,
      0
    )

    const consolidatedSummary = calculateTotals(
      totalConsolidatedPrincipal,
      weightedAverageInterestRate,
      input.newTermMonths
    )

    const amortization = buildAmortizationSchedule(
      totalConsolidatedPrincipal,
      weightedAverageInterestRate,
      input.newTermMonths,
      consolidatedSummary.monthlyPayment
    )

    const result = consolidationResultSchema.parse({
      ...input,
      totalConsolidatedPrincipal,
      weightedAverageInterestRate,
      suggestedTermMonths,
      monthlyPayment: consolidatedSummary.monthlyPayment,
      totalPayment: consolidatedSummary.totalPayment,
      totalInterest: consolidatedSummary.totalInterest,
      currentMonthlyPayments,
      currentTotalInterest,
      interestDelta: currentTotalInterest - consolidatedSummary.totalInterest,
      monthlyPaymentDelta: currentMonthlyPayments - consolidatedSummary.monthlyPayment,
      amortization
    })

    latestResult.value = result

    return result
  }

  const save = async (result: ConsolidationResult): Promise<void> => {
    isSaving.value = true

    try {
      const entry: ConsolidationHistoryItem = {
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
    isSaving,
    isLoadingHistory,
    calculate,
    save,
    loadHistory,
    removeHistoryItem,
    clearHistory
  }
}
