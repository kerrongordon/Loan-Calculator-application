<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useForm } from '@tanstack/vue-form'
import type { ConsolidationLoanInput } from '~~/shared/loan'
import { consolidationInputSchema } from '~~/shared/loan'
import Button from '~/components/ui/button/Button.vue'
import Card from '~/components/ui/card/Card.vue'
import CardContent from '~/components/ui/card/CardContent.vue'
import CardDescription from '~/components/ui/card/CardDescription.vue'
import CardHeader from '~/components/ui/card/CardHeader.vue'
import CardTitle from '~/components/ui/card/CardTitle.vue'
import Input from '~/components/ui/input/Input.vue'

const {
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
} = useLoanConsolidation()
const { currency, percent } = useFormatters()
const { exportRowsAsCsv, exportRowsAsXlsx } = useHistoryExport()

const minimumLoans = 2
const fieldErrors = ref<Record<string, string>>({})
type StringFieldHandler = {
  handleChange: (value: string) => void
}
type NumberFieldHandler = {
  handleChange: (value: number) => void
}
type ConsolidationHistoryItem = (typeof history.value)[number]
const isExportingXlsx = ref(false)
const exportingItemXlsxId = ref<number | null>(null)
const exportError = ref<string | null>(null)

const newLoan = (): ConsolidationLoanInput => ({
  principal: 12000,
  interestRate: 7.2,
  remainingTermMonths: 48
})

const loans = useState<ConsolidationLoanInput[]>('loan-consolidation/form-loans', () => [newLoan(), newLoan()])

const form = useForm({
  defaultValues: {
    label: '',
    newTermMonths: 60
  },
  onSubmit: async ({ value }) => {
    const payload = {
      ...value,
      loans: loans.value
    }
    const parsed = consolidationInputSchema.safeParse(payload)

    if (!parsed.success) {
      fieldErrors.value = toErrorMap(parsed.error.issues)
      return
    }

    fieldErrors.value = {}

    const result = calculate(parsed.data)
    await save(result)
  }
})

const suggestedTermMonths = computed(() => {
  const totalPrincipal = loans.value.reduce((sum, loan) => sum + loan.principal, 0)

  if (totalPrincipal === 0) {
    return 1
  }

  const weightedTerm = loans.value.reduce(
    (sum, loan) => sum + loan.principal * loan.remainingTermMonths,
    0
  )

  return Math.max(1, Math.round(weightedTerm / totalPrincipal))
})

const toErrorMap = (
  issues: Array<{ path: (string | number)[]; message: string }>
): Record<string, string> => {
  const errors: Record<string, string> = {}

  for (const issue of issues) {
    const key = issue.path.join('.')

    if (!errors[key]) {
      errors[key] = issue.message
    }
  }

  return errors
}

const toNumber = (event: Event): number => {
  const value = Number((event.target as HTMLInputElement).value)
  return Number.isFinite(value) ? value : 0
}

const exportRows = computed(() =>
  history.value.map((item) => ({
    id: item.id,
    createdAt: new Date(item.createdAt).toISOString(),
    label: item.label || '',
    loanCount: item.loans.length,
    totalConsolidatedPrincipal: item.totalConsolidatedPrincipal,
    weightedAverageInterestRate: item.weightedAverageInterestRate,
    newTermMonths: item.newTermMonths,
    suggestedTermMonths: item.suggestedTermMonths,
    monthlyPayment: item.monthlyPayment,
    currentMonthlyPayments: item.currentMonthlyPayments,
    monthlyPaymentDelta: item.monthlyPaymentDelta,
    totalInterest: item.totalInterest,
    currentTotalInterest: item.currentTotalInterest,
    interestDelta: item.interestDelta
  }))
)

const onStringInput = (field: StringFieldHandler, event: Event): void => {
  field.handleChange((event.target as HTMLInputElement).value)
}

const onNumberInput = (field: NumberFieldHandler, event: Event): void => {
  field.handleChange(toNumber(event))
}

const addLoan = (): void => {
  loans.value = [...loans.value, newLoan()]
}

const removeLoan = (index: number): void => {
  if (loans.value.length <= minimumLoans) {
    return
  }

  loans.value = loans.value.filter((_, currentIndex) => currentIndex !== index)
}

const updateLoan = (
  index: number,
  field: keyof ConsolidationLoanInput,
  event: Event
): void => {
  const nextLoans = [...loans.value]
  const currentLoan = nextLoans[index]

  if (!currentLoan) {
    return
  }

  nextLoans[index] = {
    ...currentLoan,
    [field]: toNumber(event)
  }

  loans.value = nextLoans
}

const onLoanNumberInput = (
  index: number,
  field: keyof ConsolidationLoanInput,
  event: Event
): void => {
  updateLoan(index, field, event)
}

const downloadHistoryCsv = (): void => {
  exportError.value = null
  exportRowsAsCsv(exportRows.value, 'loan-consolidation-history')
}

const downloadHistoryXlsx = async (): Promise<void> => {
  exportError.value = null
  isExportingXlsx.value = true

  try {
    await exportRowsAsXlsx(exportRows.value, 'loan-consolidation-history', 'Consolidations')
  } catch {
    exportError.value = 'XLSX export failed.'
  } finally {
    isExportingXlsx.value = false
  }
}

const toItemExportRows = (item: ConsolidationHistoryItem) =>
  item.amortization.map((row) => ({
    historyId: item.id,
    createdAt: new Date(item.createdAt).toISOString(),
    label: item.label || '',
    totalConsolidatedPrincipal: item.totalConsolidatedPrincipal,
    weightedAverageInterestRate: item.weightedAverageInterestRate,
    newTermMonths: item.newTermMonths,
    month: row.month,
    payment: row.payment,
    principalPayment: row.principal,
    interestPayment: row.interest,
    balance: row.balance
  }))

const downloadHistoryItemCsv = (item: ConsolidationHistoryItem): void => {
  exportError.value = null
  exportRowsAsCsv(toItemExportRows(item), `loan-consolidation-${item.id}`)
}

const downloadHistoryItemXlsx = async (item: ConsolidationHistoryItem): Promise<void> => {
  exportError.value = null
  exportingItemXlsxId.value = item.id

  try {
    await exportRowsAsXlsx(toItemExportRows(item), `loan-consolidation-${item.id}`, 'Consolidation')
  } catch {
    exportError.value = 'XLSX export failed.'
  } finally {
    exportingItemXlsxId.value = null
  }
}

const deleteHistoryItem = (item: ConsolidationHistoryItem): void => {
  if (!import.meta.client) {
    return
  }

  const shouldDelete = window.confirm('Delete this consolidation from history?')

  if (shouldDelete) {
    removeHistoryItem(item.id)
  }
}

const deleteAllHistory = (): void => {
  if (!import.meta.client) {
    return
  }

  const shouldDelete = window.confirm('Delete all consolidation history?')

  if (shouldDelete) {
    clearHistory()
  }
}

const syncValidation = (): void => {
  const parsed = consolidationInputSchema.safeParse({
    ...form.state.values,
    loans: loans.value
  })

  fieldErrors.value = parsed.success ? {} : toErrorMap(parsed.error.issues)
}

const applySuggestedTerm = (): void => {
  form.setFieldValue('newTermMonths', suggestedTermMonths.value)
  syncValidation()
}

const errorFor = (path: string): string | undefined => fieldErrors.value[path]

onMounted(() => {
  void loadHistory()
  syncValidation()
})
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Loan Consolidation</CardTitle>
      <CardDescription>
        Add at least two loans to compare current payments vs. a consolidated loan scenario.
      </CardDescription>
    </CardHeader>
    <CardContent class="space-y-6">
      <form class="space-y-6" @submit.prevent="form.handleSubmit">
        <div class="grid gap-4 lg:grid-cols-[2fr_1fr] lg:items-start">
          <form.Field name="label">
            <template #default="{ field }">
              <div class="space-y-1.5">
                <label class="block text-sm font-medium text-slate-700" :for="field.name">Scenario Label</label>
                <Input
                  :id="field.name"
                  :model-value="field.state.value"
                  placeholder="Debt Refinance Option A"
                  @input="onStringInput(field, $event)"
                  @blur="field.handleBlur"
                />
              </div>
            </template>
          </form.Field>

          <div class="space-y-2">
            <form.Field name="newTermMonths">
              <template #default="{ field }">
                <div class="space-y-1.5">
                  <label class="block text-sm font-medium text-slate-700" :for="field.name">New Term (months)</label>
                  <Input
                    :id="field.name"
                    type="number"
                    :min="1"
                    step="1"
                    :model-value="field.state.value"
                    placeholder="60"
                    @input="onNumberInput(field, $event)"
                    @blur="field.handleBlur"
                  />
                  <p class="min-h-4 text-xs text-red-600" :class="{ invisible: !errorFor('newTermMonths') }">
                    {{ errorFor('newTermMonths') || '-' }}
                  </p>
                </div>
              </template>
            </form.Field>
            <Button type="button" variant="outline" class="w-full" @click="applySuggestedTerm">
              Use {{ suggestedTermMonths }} mo
            </Button>
          </div>
        </div>

        <div class="space-y-4">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 class="text-base font-semibold">Existing Loans</h3>
            <Button type="button" variant="outline" class="w-full sm:w-auto" @click="addLoan">Add Loan</Button>
          </div>

          <p v-if="errorFor('loans')" class="text-xs text-red-600">{{ errorFor('loans') }}</p>

          <div
            v-for="(loan, index) in loans"
            :key="`loan-${index}`"
            class="grid gap-4 rounded-md border border-border p-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end"
          >
            <div class="space-y-1.5">
              <label class="block text-sm font-medium text-slate-700">Principal ($)</label>
              <Input
                type="number"
                :min="1"
                step="0.01"
                :model-value="loan.principal"
                @input="onLoanNumberInput(index, 'principal', $event)"
                @blur="syncValidation"
              />
              <p class="min-h-4 text-xs text-red-600" :class="{ invisible: !errorFor(`loans.${index}.principal`) }">
                {{ errorFor(`loans.${index}.principal`) || '-' }}
              </p>
            </div>

            <div class="space-y-1.5">
              <label class="block text-sm font-medium text-slate-700">Interest Rate (%)</label>
              <Input
                type="number"
                :min="0"
                :max="100"
                step="0.01"
                :model-value="loan.interestRate"
                @input="onLoanNumberInput(index, 'interestRate', $event)"
                @blur="syncValidation"
              />
              <p class="min-h-4 text-xs text-red-600" :class="{ invisible: !errorFor(`loans.${index}.interestRate`) }">
                {{ errorFor(`loans.${index}.interestRate`) || '-' }}
              </p>
            </div>

            <div class="space-y-1.5">
              <label class="block text-sm font-medium text-slate-700">Remaining Term (months)</label>
              <Input
                type="number"
                :min="1"
                step="1"
                :model-value="loan.remainingTermMonths"
                @input="onLoanNumberInput(index, 'remainingTermMonths', $event)"
                @blur="syncValidation"
              />
              <p
                class="min-h-4 text-xs text-red-600"
                :class="{ invisible: !errorFor(`loans.${index}.remainingTermMonths`) }"
              >
                {{ errorFor(`loans.${index}.remainingTermMonths`) || '-' }}
              </p>
            </div>

            <div>
              <Button
                type="button"
                variant="ghost"
                class="w-full lg:w-auto"
                :disabled="loans.length <= minimumLoans"
                @click="removeLoan(index)"
              >
                Remove
              </Button>
            </div>
          </div>
        </div>

        <form.Subscribe
          :selector="(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })"
        >
          <template #default="{ canSubmit, isSubmitting }">
            <Button type="submit" :disabled="!canSubmit || isSubmitting || isSaving">
              {{ isSubmitting || isSaving ? 'Saving Consolidation...' : 'Consolidate & Save' }}
            </Button>
          </template>
        </form.Subscribe>
      </form>

      <div v-if="latestResult" class="space-y-4 rounded-lg border border-border bg-slate-50 p-4">
        <h3 class="text-base font-semibold">Latest Consolidation Result</h3>
        <div class="grid gap-3 text-sm md:grid-cols-3">
          <p>
            <span class="font-medium">Consolidated Principal:</span>
            {{ currency(latestResult.totalConsolidatedPrincipal) }}
          </p>
          <p>
            <span class="font-medium">Weighted Avg Rate:</span>
            {{ percent(latestResult.weightedAverageInterestRate) }}
          </p>
          <p>
            <span class="font-medium">Suggested Term:</span>
            {{ latestResult.suggestedTermMonths }} months
          </p>
          <p><span class="font-medium">New Monthly Payment:</span> {{ currency(latestResult.monthlyPayment) }}</p>
          <p><span class="font-medium">Current Monthly Total:</span> {{ currency(latestResult.currentMonthlyPayments) }}</p>
          <p>
            <span class="font-medium">Monthly Delta:</span>
            {{ currency(latestResult.monthlyPaymentDelta) }}
          </p>
          <p>
            <span class="font-medium">Interest Delta:</span>
            {{ currency(latestResult.interestDelta) }}
          </p>
        </div>
        <AmortizationTable :rows="latestResult.amortization" />
      </div>

      <div class="space-y-2">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 class="text-base font-semibold">Consolidation History</h3>
          <div class="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" class="h-8 px-3 py-1 text-red-600" :disabled="!hasHistory" @click="deleteAllHistory">
              Delete All
            </Button>
          </div>
        </div>
        <p v-if="exportError" class="text-xs text-red-600">{{ exportError }}</p>
        <p v-if="isLoadingHistory" class="text-sm text-slate-500">Loading consolidation history...</p>
        <div v-else-if="hasHistory" class="space-y-2">
          <details
            v-for="item in history"
            :key="item.id"
            class="overflow-hidden rounded-md border border-border bg-white"
          >
            <summary class="cursor-pointer list-none px-3 py-2">
              <div class="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>{{ item.label || 'Untitled scenario' }}</span>
                <span>{{ new Date(item.createdAt).toLocaleString() }}</span>
                <span class="font-medium">{{ currency(item.monthlyPayment) }}/mo</span>
              </div>
            </summary>
            <div class="space-y-3 border-t border-border bg-slate-50 p-3">
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Monthly Payment Breakdown</p>
                <div class="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    class="h-8 px-3 py-1"
                    @click.stop.prevent="downloadHistoryItemCsv(item)"
                  >
                    Download This CSV
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    class="h-8 px-3 py-1"
                    :disabled="exportingItemXlsxId === item.id"
                    @click.stop.prevent="downloadHistoryItemXlsx(item)"
                  >
                    {{ exportingItemXlsxId === item.id ? 'Preparing XLSX...' : 'Download This XLSX' }}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    class="h-8 px-3 py-1 text-red-600"
                    @click.stop.prevent="deleteHistoryItem(item)"
                  >
                    Delete This
                  </Button>
                </div>
              </div>
              <AmortizationTable :rows="item.amortization" />
            </div>
          </details>
        </div>
        <p v-else class="text-sm text-slate-500">No saved consolidations yet.</p>
      </div>
    </CardContent>
  </Card>
</template>
