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
  <Card class="border-0 shadow-soft bg-white/80 backdrop-blur-2xl ring-1 ring-border/40 overflow-hidden rounded-3xl">
    <CardHeader class="border-b border-border/30 bg-muted/30 pb-8 pt-8">
      <CardTitle class="text-2xl font-extrabold text-foreground tracking-tight">Loan Consolidation</CardTitle>
      <CardDescription class="text-muted-foreground text-base mt-2">
        Add at least two loans to compare current payments vs. a consolidated loan scenario.
      </CardDescription>
    </CardHeader>
    <CardContent class="space-y-10 pt-8 px-6 sm:px-10">
      <form class="space-y-10" @submit.prevent="form.handleSubmit">
        <div class="grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-start p-6 bg-white/40 rounded-2xl border border-border/40 shadow-sm backdrop-blur-md">
          <form.Field name="label">
            <template #default="{ field }">
              <div class="space-y-2">
                <label class="block text-sm font-semibold tracking-wide text-foreground/80" :for="field.name">Scenario Label</label>
                <Input
                  :id="field.name"
                  class="rounded-xl border-border/60 bg-white/60 px-4 py-6 text-lg transition-all focus:ring-2 focus:ring-primary/40 focus:border-primary shadow-sm"
                  :model-value="field.state.value"
                  placeholder="Debt Refinance Option A"
                  @input="onStringInput(field, $event)"
                  @blur="field.handleBlur"
                />
              </div>
            </template>
          </form.Field>

          <div class="space-y-3">
            <form.Field name="newTermMonths">
              <template #default="{ field }">
                <div class="space-y-2">
                  <label class="block text-sm font-semibold tracking-wide text-foreground/80" :for="field.name">New Term (months)</label>
                  <Input
                    :id="field.name"
                    class="rounded-xl border-border/60 bg-white/60 px-4 py-6 text-lg transition-all focus:ring-2 focus:ring-primary/40 focus:border-primary shadow-sm"
                    type="number"
                    :min="1"
                    step="1"
                    :model-value="field.state.value"
                    placeholder="60"
                    @input="onNumberInput(field, $event)"
                    @blur="field.handleBlur"
                  />
                  <p class="min-h-5 text-xs font-medium text-red-500" :class="{ invisible: !errorFor('newTermMonths') }">
                    {{ errorFor('newTermMonths') || '-' }}
                  </p>
                </div>
              </template>
            </form.Field>
            <Button type="button" variant="outline" class="w-full rounded-xl border-primary/30 text-primary hover:bg-primary/5 hover:text-primary transition-all font-semibold" @click="applySuggestedTerm">
              Use Suggested: {{ suggestedTermMonths }} mo
            </Button>
          </div>
        </div>

        <div class="space-y-6">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-border/40">
            <h3 class="text-xl font-bold text-foreground">Existing Loans</h3>
            <Button type="button" variant="outline" class="w-full sm:w-auto rounded-full px-6 bg-white shadow-sm font-semibold" @click="addLoan">
              + Add Loan
            </Button>
          </div>

          <p v-if="errorFor('loans')" class="text-xs font-medium text-red-500 bg-red-50 p-2 rounded-lg border border-red-200">{{ errorFor('loans') }}</p>

          <div class="space-y-4">
            <div
              v-for="(loan, index) in loans"
              :key="`loan-${index}`"
              class="grid gap-6 rounded-2xl border border-border/60 bg-white/50 p-6 shadow-sm hover:shadow-md transition-shadow lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end group relative"
            >
              <div class="absolute -left-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold shadow-sm border border-primary/20">
                {{ index + 1 }}
              </div>
              <div class="space-y-2">
                <label class="block text-sm font-semibold tracking-wide text-foreground/80">Principal ($)</label>
                <Input
                  class="rounded-xl border-border/60 bg-white px-4 py-5 font-medium transition-all focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  type="number"
                  :min="1"
                  step="0.01"
                  :model-value="loan.principal"
                  @input="onLoanNumberInput(index, 'principal', $event)"
                  @blur="syncValidation"
                />
                <p class="min-h-5 text-xs font-medium text-red-500" :class="{ invisible: !errorFor(`loans.${index}.principal`) }">
                  {{ errorFor(`loans.${index}.principal`) || '-' }}
                </p>
              </div>

              <div class="space-y-2">
                <label class="block text-sm font-semibold tracking-wide text-foreground/80">Interest Rate (%)</label>
                <Input
                  class="rounded-xl border-border/60 bg-white px-4 py-5 font-medium transition-all focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  type="number"
                  :min="0"
                  :max="100"
                  step="0.01"
                  :model-value="loan.interestRate"
                  @input="onLoanNumberInput(index, 'interestRate', $event)"
                  @blur="syncValidation"
                />
                <p class="min-h-5 text-xs font-medium text-red-500" :class="{ invisible: !errorFor(`loans.${index}.interestRate`) }">
                  {{ errorFor(`loans.${index}.interestRate`) || '-' }}
                </p>
              </div>

              <div class="space-y-2">
                <label class="block text-sm font-semibold tracking-wide text-foreground/80">Remaining Term (mo)</label>
                <Input
                  class="rounded-xl border-border/60 bg-white px-4 py-5 font-medium transition-all focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  type="number"
                  :min="1"
                  step="1"
                  :model-value="loan.remainingTermMonths"
                  @input="onLoanNumberInput(index, 'remainingTermMonths', $event)"
                  @blur="syncValidation"
                />
                <p
                  class="min-h-5 text-xs font-medium text-red-500"
                  :class="{ invisible: !errorFor(`loans.${index}.remainingTermMonths`) }"
                >
                  {{ errorFor(`loans.${index}.remainingTermMonths`) || '-' }}
                </p>
              </div>

              <div class="pb-[20px]">
                <Button
                  type="button"
                  variant="ghost"
                  class="w-full lg:w-auto rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 font-semibold"
                  :disabled="loans.length <= minimumLoans"
                  @click="removeLoan(index)"
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-border/40">
          <form.Subscribe
            :selector="(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })"
          >
            <template #default="{ canSubmit, isSubmitting }">
              <Button 
                class="w-full sm:w-auto px-8 py-6 rounded-full text-base font-bold bg-primary hover:bg-accent text-white shadow-float transition-all duration-300 transform hover:-translate-y-0.5"
                type="submit" 
                :disabled="!canSubmit || isSubmitting || isSaving"
              >
                {{ isSubmitting || isSaving ? 'Saving...' : 'Consolidate & Save' }}
              </Button>
            </template>
          </form.Subscribe>
        </div>
      </form>

      <div v-if="latestResult" class="space-y-6 rounded-3xl border border-primary/20 bg-primary/5 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h3 class="text-xl font-bold text-foreground">Latest Consolidation Result</h3>
        <div class="grid gap-6 xl:grid-cols-[auto_1fr] items-start xl:items-stretch">
          <div class="flex flex-col items-center justify-center p-5 bg-white/60 border border-border/40 rounded-2xl shadow-sm backdrop-blur-sm h-full">
            <DonutChart
              :data="[
                { label: 'New Principal', value: latestResult.totalConsolidatedPrincipal, color: '#0ea5e9' },
                { label: 'New Interest', value: latestResult.totalInterest, color: '#f59e0b' }
              ]"
              :size="150"
              :strokeWidth="16"
              centerLabel="Consolidated"
              :centerValue="currency(latestResult.totalConsolidatedPrincipal)"
            />
            <div class="flex items-center justify-center gap-4 mt-5 text-xs font-bold text-muted-foreground whitespace-nowrap">
              <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]"></span> Principal</span>
              <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span> Interest</span>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 h-full">
            <div class="bg-white/60 rounded-2xl p-4 border border-border/40 shadow-sm backdrop-blur-sm">
              <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Weighted Rate</p>
              <p class="text-xl font-extrabold text-foreground">{{ percent(latestResult.weightedAverageInterestRate) }}</p>
            </div>
            <div class="bg-white/60 rounded-2xl p-4 border border-border/40 shadow-sm backdrop-blur-sm">
              <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Suggested Term</p>
              <p class="text-xl font-extrabold text-foreground">{{ latestResult.suggestedTermMonths }} mo</p>
            </div>
            <div class="bg-white/60 rounded-2xl p-4 border border-primary/30 shadow-sm backdrop-blur-sm bg-primary/5">
              <p class="text-xs font-semibold uppercase tracking-wider text-primary mb-1">New Payment</p>
              <p class="text-2xl font-black text-primary">{{ currency(latestResult.monthlyPayment) }}</p>
            </div>
            
            <div class="bg-white/60 rounded-2xl p-4 border border-border/40 shadow-sm backdrop-blur-sm lg:col-span-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Current Monthly vs New</p>
                <div class="flex items-center gap-3">
                  <span class="text-lg font-bold text-muted-foreground line-through decoration-red-400 decoration-2">{{ currency(latestResult.currentMonthlyPayments) }}</span>
                  <span class="text-muted-foreground">&rarr;</span>
                  <span class="text-xl font-extrabold text-foreground">{{ currency(latestResult.monthlyPayment) }}</span>
                </div>
              </div>
              <div class="flex gap-6 sm:text-right">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Monthly Delta</p>
                  <p class="text-xl font-extrabold" :class="latestResult.monthlyPaymentDelta <= 0 ? 'text-green-600' : 'text-red-500'">
                    {{ latestResult.monthlyPaymentDelta <= 0 ? '' : '+' }}{{ currency(latestResult.monthlyPaymentDelta) }}
                  </p>
                </div>
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Interest Delta</p>
                  <p class="text-xl font-extrabold" :class="latestResult.interestDelta <= 0 ? 'text-green-600' : 'text-red-500'">
                    {{ latestResult.interestDelta <= 0 ? '' : '+' }}{{ currency(latestResult.interestDelta) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="bg-white/80 rounded-2xl p-2 border border-border/40 overflow-hidden shadow-sm">
          <AmortizationTable :rows="latestResult.amortization" />
        </div>
      </div>

      <div class="space-y-4 pt-10 border-t border-border/40">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 class="text-xl font-bold text-foreground">Consolidation History</h3>
          <div class="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" class="h-9 px-4 rounded-full text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50" :disabled="!hasHistory" @click="deleteAllHistory">
              Delete All
            </Button>
          </div>
        </div>
        <p v-if="exportError" class="text-xs font-medium text-red-500">{{ exportError }}</p>
        <p v-if="isLoadingHistory" class="text-sm font-medium text-muted-foreground/70 animate-pulse">Loading consolidation history...</p>
        <div v-else-if="hasHistory" class="space-y-3">
          <details
            v-for="item in history"
            :key="item.id"
            class="group overflow-hidden rounded-2xl border border-border/60 bg-white transition-all shadow-sm open:shadow-md"
          >
            <summary class="cursor-pointer list-none p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
              <div class="flex flex-wrap items-center justify-between gap-4">
                <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <span class="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">{{ item.label || 'Untitled Scenario' }}</span>
                  <span class="text-sm font-medium text-muted-foreground">{{ new Date(item.createdAt).toLocaleString() }}</span>
                </div>
                <span class="text-xl font-bold text-foreground">{{ currency(item.monthlyPayment) }}<span class="text-sm font-medium text-muted-foreground">/mo</span></span>
              </div>
            </summary>
            <div class="space-y-5 border-t border-border/40 bg-muted/10 p-5">
              <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p class="text-xs font-bold uppercase tracking-wider text-muted-foreground">Monthly Payment Breakdown</p>
                <div class="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    class="h-8 px-4 rounded-full text-xs font-semibold bg-white"
                    @click.stop.prevent="downloadHistoryItemCsv(item)"
                  >
                    CSV
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    class="h-8 px-4 rounded-full text-xs font-semibold bg-white"
                    :disabled="exportingItemXlsxId === item.id"
                    @click.stop.prevent="downloadHistoryItemXlsx(item)"
                  >
                    {{ exportingItemXlsxId === item.id ? '...' : 'XLSX' }}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    class="h-8 px-4 rounded-full text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50"
                    @click.stop.prevent="deleteHistoryItem(item)"
                  >
                    Delete
                  </Button>
                </div>
              </div>
              <div class="bg-white rounded-xl overflow-hidden border border-border/40 shadow-sm">
                <AmortizationTable :rows="item.amortization" />
              </div>
            </div>
          </details>
        </div>
        <p v-else class="text-sm font-medium text-muted-foreground/70 py-8 text-center italic border border-dashed border-border rounded-xl">No saved consolidations yet.</p>
      </div>
    </CardContent>
  </Card>
</template>
